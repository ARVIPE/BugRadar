#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import docker
import json
import os
import queue
import re
import threading
import time
from typing import Optional
import requests

# =============== CONFIG POR ENV ===============

API_URL = os.getenv("BUGRADAR_API_URL", "http://localhost:3000/api/logs")
STATUS_API_URL = os.getenv("BUGRADAR_STATUS_API_URL", "http://localhost:3000/api/status")
LATENCY_API_URL = os.getenv("BUGRADAR_LATENCY_API_URL", "http://localhost:3000/api/latency")


LATENCY_TARGET_URL = os.getenv("BUGRADAR_LATENCY_TARGET_URL")

USER_ID = os.getenv("BUGRADAR_USER_ID", "")

MONITOR_CONTAINERS = os.getenv("BUGRADAR_CONTAINERS", "")
TAIL = int(os.getenv("BUGRADAR_TAIL", "100"))
PARSE_JSON = os.getenv("BUGRADAR_PARSE_JSON", "1") == "1"
HEARTBEAT_EVERY = int(os.getenv("BUGRADAR_HEARTBEAT_EVERY", "60"))
LATENCY_EVERY = int(os.getenv("BUGRADAR_LATENCY_EVERY", "300"))

ERROR_KEYWORDS = ["error", "exception", "traceback", "failed", "critical", "panic", "fatal"]
WARNING_KEYWORDS = ["warning", "warn", "deprecated", "timeout", "slow"]

# =============== UTILS ===============

def debug(msg: str):
    if os.getenv("BUGRADAR_DEBUG", "0") == "1":
        print(f"[agent] {msg}")

def should_monitor(name: str) -> bool:
    if not MONITOR_CONTAINERS.strip():
        return True
    wl = [x.strip() for x in MONITOR_CONTAINERS.split(",") if x.strip()]
    return name in wl

def http_post(url: str, payload: dict, timeout=5):
    try:
        r = requests.post(url, json=payload, timeout=timeout)
        if r.status_code not in (200, 201):
            print(f"  ❌ POST {url} -> {r.status_code}: {r.text[:300]}")
        else:
            debug(f"POST {url} ok")
        return r
    except Exception as e:
        print(f"  ❌ POST {url} error: {e}")
        return None

# =============== SEVERITY CLASSIFICATION ===============

def normalize_level(val: str) -> str:
    s = str(val).strip().lower()
    if s in ("err", "error", "fatal", "panic", "crit", "critical", "severe"): return "error"
    if s in ("warn", "warning", "deprecated"): return "warning"
    if s in ("info", "information", "notice", "debug", "trace"): return "info"
    if s.isdigit():
        n = int(s)
        if n >= 40: return "error"
        if n >= 30: return "warning"
        return "info"
    return s

def get_severity_from_text(line: str) -> Optional[str]:
    low = line.lower()
    if any(k in low for k in ERROR_KEYWORDS): return "error"
    if any(k in low for k in WARNING_KEYWORDS): return "warning"
    return None

def get_severity(line: str) -> Optional[str]:
    if PARSE_JSON:
        try:
            obj = json.loads(line)
            lvl = obj.get("level") or obj.get("severity") or obj.get("lvl") or obj.get("log_level")
            if lvl is not None:
                sev = normalize_level(str(lvl))
                return sev if sev in ("error", "warning") else None
            msg = obj.get("msg") or obj.get("message") or ""
            return get_severity_from_text(f"{msg} {json.dumps(obj, ensure_ascii=False)}")
        except Exception:
            pass
    return get_severity_from_text(line)

# =============== API PAYLOADS ===============

def send_log_to_api(log_message: str, container_name: str, severity: str):
    http_post(API_URL, {
        "log_message": log_message,
        "container_name": container_name,
        "severity": severity,
        "user_id": USER_ID
    })

def send_status_to_api(container_name: str, status: str):
    http_post(STATUS_API_URL, {
        "container_name": container_name,
        "status": status,
        "user_id": USER_ID or None
    })


def send_latency_to_api(endpoint: str, method: str, latency_ms: int, status_code: int):
    http_post(LATENCY_API_URL, {
        "endpoint": endpoint,
        "method": method,
        "latency_ms": latency_ms,
        "status_code": status_code,
        "user_id": USER_ID or None
    })

# =============== DOCKER ===============

def connect_to_docker():
    try:
        client = docker.from_env()
        client.ping()
        print("✅ Docker connection successful.")
        return client
    except docker.errors.DockerException as e:
        print(f"❌ Docker connection error: {e}")
        return None

# =============== LOG MONITORING ===============

def stream_container_logs(container, out_q: queue.Queue):
    name = container.name
    if not should_monitor(name): return
    debug(f"Attaching logs: {name}")
    try:
        for raw in container.logs(stream=True, follow=True, tail=TAIL):
            line = raw.decode("utf-8", errors="replace").strip()
            if line: out_q.put((name, line))
    except Exception as e:
        print(f"❌ Log stream error [{name}]: {e}")

def logs_dispatcher(out_q: queue.Queue, stop_evt: threading.Event):
    while not stop_evt.is_set():
        try:
            name, line = out_q.get(timeout=1.0)
            sev = get_severity(line)
            if sev in ("error", "warning"):
                print(f"  [LOG] {name} | {sev.upper()} | {line[:200]}")
                send_log_to_api(line, name, sev)
        except queue.Empty:
            continue

def start_logs_threads(client) -> threading.Event:
    out_q, stop_evt = queue.Queue(maxsize=10000), threading.Event()
    threading.Thread(target=logs_dispatcher, args=(out_q, stop_evt), daemon=True).start()
    try:
        for c in client.containers.list():
            if should_monitor(c.name):
                threading.Thread(target=stream_container_logs, args=(c, out_q), daemon=True).start()
    except Exception as e:
        print(f"❌ Could not list containers for logs: {e}")
    return stop_evt

# =============== STATUS MONITORING (UP/DOWN + HEARTBEAT) ===============

def monitor_container_status(client):
    print("🚦 Listening for Docker events (UP/DOWN) and sending heartbeats...")
    try:
        for c in client.containers.list():
            if should_monitor(c.name): send_status_to_api(c.name, "heartbeat")
    except Exception as e:
        print(f"❌ Could not list containers at startup (status): {e}")

    def heartbeat_loop():
        while True:
            try:
                for c in client.containers.list():
                    if should_monitor(c.name): send_status_to_api(c.name, "heartbeat")
                time.sleep(HEARTBEAT_EVERY)
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"❌ Heartbeat error: {e}")
                time.sleep(HEARTBEAT_EVERY)
    threading.Thread(target=heartbeat_loop, daemon=True).start()

    try:
        for ev in client.events(decode=True):
            if ev.get("Type") != "container": continue
            attrs = ev.get("Actor", {}).get("Attributes", {}) or {}
            name = attrs.get("name")
            if not name or not should_monitor(name): continue
            action = ev.get("Action")
            if action in ("start", "unpause", "health_status: healthy"): send_status_to_api(name, "up")
            elif action in ("die", "stop", "pause", "health_status: unhealthy", "kill", "oom"): send_status_to_api(name, "down")
    except KeyboardInterrupt:
        print("🛑 Stopping status monitor...")
    except Exception as e:
        print(f"❌ Event stream error: {e}")

# =============== LATENCY MONITORING ===============

def substitute_path_vars(path):
    # Reemplaza <tipo:nombre> por un valor por defecto. Sencillo por ahora.
    path = re.sub(r"<int:[^>]+>", "1", path)
    path = re.sub(r"<string:[^>]+>", "default", path)
    path = re.sub(r"<[^>]+>", "1", path) # Genérico
    return path

def measure_latency(endpoint_info):
    base_url = LATENCY_TARGET_URL.rstrip('/')
    path = substitute_path_vars(endpoint_info['rule'])
    url = f"{base_url}{path}"
    method = endpoint_info['methods'][0] # Usamos el primer método listado

    try:
        start_time = time.monotonic()
        r = requests.request(method, url, timeout=10, json={})
        latency = time.monotonic() - start_time
        latency_ms = int(latency * 1000)
        print(f"  [LATENCY] {method} {path} -> {r.status_code} in {latency_ms}ms")
        send_latency_to_api(endpoint_info['rule'], method, latency_ms, r.status_code)
    except requests.RequestException as e:
        print(f"  ❌ [LATENCY] {method} {path} -> FAILED: {e}")


def latency_loop():
    if not LATENCY_TARGET_URL: return
    print("🔬 Starting latency monitor...")
    routes_url = f"{LATENCY_TARGET_URL.rstrip('/')}/debug/routes"

    while True:
        try:
            print(f"Fetching endpoints from {routes_url}...")
            r = requests.get(routes_url, timeout=10)
            if r.status_code != 200:
                print(f"Could not fetch endpoints, status: {r.status_code}")
                time.sleep(LATENCY_EVERY)
                continue
            
            endpoints = r.json()
            print(f"Discovered {len(endpoints)} endpoints to monitor.")
            for endpoint in endpoints:
                measure_latency(endpoint)
                time.sleep(1) # Pequeña pausa entre cada endpoint

            time.sleep(LATENCY_EVERY)
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"❌ Latency loop error: {e}")
            time.sleep(LATENCY_EVERY)

# =============== MAIN ===============

def main():
    if not USER_ID: print("⚠️ BUGRADAR_USER_ID not set.")

    client = connect_to_docker()
    if not client: return

    threading.Thread(target=monitor_container_status, args=(client,), daemon=True).start()
    threading.Thread(target=latency_loop, daemon=True).start()

    stop_evt = start_logs_threads(client)

    print("🚀 Agent started. (Ctrl+C to stop)")
    try:
        while True: time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Stopping agent...")
        stop_evt.set()

if __name__ == "__main__":
    main()