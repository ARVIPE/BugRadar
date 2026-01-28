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


API_URL = os.getenv("BUGRADAR_API_URL", "http://localhost:3000/api/logs")
LATENCY_API_URL = os.getenv("BUGRADAR_LATENCY_API_URL", "http://localhost:3000/api/latency")
LATENCY_TARGET_URL = os.getenv("BUGRADAR_LATENCY_TARGET_URL")

# Url from which the agent will fetch the list of endpoints to monitor
CONFIG_URL = os.getenv("BUGRADAR_CONFIG_URL")

API_KEY = os.getenv("BUGRADAR_API_KEY", "")
if not API_KEY:
    print("❌ BUGRADAR_API_KEY is not set. The agent will not work.")
    exit(1)

AUTH_HEADERS = {
    "Authorization": f"Bearer {API_KEY}"
}

# Agent configuration:
MONITOR_CONTAINERS = os.getenv("BUGRADAR_CONTAINERS", "")
TAIL = int(os.getenv("BUGRADAR_TAIL", "100"))
PARSE_JSON = os.getenv("BUGRADAR_PARSE_JSON", "1") == "1"
LATENCY_EVERY = int(os.getenv("BUGRADAR_LATENCY_EVERY", "300")) # 5 minutes by default

ERROR_KEYWORDS = ["error", "exception", "traceback", "failed", "critical", "panic", "fatal"]
WARNING_KEYWORDS = ["warning", "warn", "deprecated", "timeout", "slow"]

def debug(msg: str):
    if os.getenv("BUGRADAR_DEBUG", "0") == "1":
        print(f"[agent] {msg}")

def should_monitor(name: str) -> bool:
    if not MONITOR_CONTAINERS.strip():
        return True
    wl = [x.strip() for x in MONITOR_CONTAINERS.split(",") if x.strip()]
    return name in wl

def http_post(url: str, payload: dict, timeout=5, use_auth=True):
    try:
        headers = AUTH_HEADERS if use_auth else {}
        r = requests.post(url, json=payload, timeout=timeout, headers=headers)
        if r.status_code not in (200, 201):
            print(f"  ❌ POST {url} -> {r.status_code}: {r.text[:300]}")
        else:
            debug(f"POST {url} ok")
        return r
    except Exception as e:
        print(f"  ❌ POST {url} error: {e}")
        return None

# SEVERITY CLASSIFICATION

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

# API PAYLOADS

def send_log_to_api(log_message: str, container_name: str, severity: str):
    http_post(API_URL, {
        "log_message": log_message,
        "container_name": container_name,
        "severity": severity,
    })

def send_latency_to_api(endpoint: str, method: str, latency_ms: int, status_code: int):
    http_post(LATENCY_API_URL, {
        "endpoint": endpoint,
        "method": method,
        "latency_ms": latency_ms,
        "status_code": status_code,
    })

# DOCKER

def connect_to_docker():
    try:
        client = docker.from_env()
        client.ping()
        print("✅ Docker connection successful.")
        return client
    except docker.errors.DockerException as e:
        print(f"❌ Docker connection error: {e}")
        return None

# LOG MONITORING
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

# LATENCY MONITORING
def measure_latency(endpoint_info):
    base_url = LATENCY_TARGET_URL.rstrip('/')
    path = endpoint_info['rule'] # Literal path (e.g: /api/users/1)
    url = f"{base_url}{path}"
    method = endpoint_info['methods'][0]
    
    endpoint_rule_for_api = endpoint_info['rule']

    try:
        start_time = time.monotonic()
        r = requests.request(method, url, timeout=10, json={}) 
        latency = time.monotonic() - start_time
        latency_ms = int(latency * 1000)
        
        print(f"  [LATENCY] {method} {path} -> {r.status_code} in {latency_ms}ms")
        send_latency_to_api(endpoint_rule_for_api, method, latency_ms, r.status_code)
    except requests.RequestException as e:
        print(f"  ❌ [LATENCY] {method} {path} -> FAILED: {e}")

def latency_loop():
    if not LATENCY_TARGET_URL or not CONFIG_URL:
        print("🔬 Latency monitor disabled (missing LATENCY_TARGET_URL or BUGRADAR_CONFIG_URL)")
        return
    
    print("🔬 Starting latency monitor (mode: API config)...")

    while True:
        endpoints_to_monitor_raw = []
        try:
            # Fetch the configuration from the API in each cycle
            debug(f"Fetching config from {CONFIG_URL}")
            r = requests.get(CONFIG_URL, headers=AUTH_HEADERS, timeout=10)
            
            if r.status_code == 200:
                data = r.json()
                endpoints_to_monitor_raw = data.get("endpoints", [])
                if endpoints_to_monitor_raw:
                    debug(f"Fetched {len(endpoints_to_monitor_raw)} endpoints from API.")
            else:
                print(f"  ❌ Error fetching config: {r.status_code} {r.text[:100]}")
            
        except Exception as e:
            print(f"  ❌ Error fetching config: {e}")
        
        try:
            # Process the list of endpoints
            endpoints_to_monitor = []
            for item in endpoints_to_monitor_raw:
                item = item.strip()
                if not item: continue
                try:
                    # Wait for format "METHOD /literal/path"
                    method, rule = item.split(' ', 1)
                    endpoints_to_monitor.append({
                        "rule": rule.strip(),
                        "methods": [method.strip().upper()]
                    })
                except Exception as e:
                    print(f"  ❌ Skipping invalid endpoint format from API: '{item}'")

            # Measure latency for each endpoint
            if not endpoints_to_monitor:
                 debug("No endpoints to monitor in this cycle.")
            
            for endpoint_info in endpoints_to_monitor:
                measure_latency(endpoint_info)
                time.sleep(1) # Small pause between each endpoint

            # Wait before starting the next cycle
            debug(f"Latency cycle complete. Waiting {LATENCY_EVERY}s...")
            time.sleep(LATENCY_EVERY)
            
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"❌ Latency loop error (inner): {e}")
            time.sleep(LATENCY_EVERY)


def main():
    client = connect_to_docker()
    if not client: return

    # Start the latency thread
    threading.Thread(target=latency_loop, daemon=True).start()

    # Start the logs threads
    stop_evt = start_logs_threads(client)

    print("Agent started (Logs & Latency). (Ctrl+C to stop)")
    try:
        while True: time.sleep(1)
    except KeyboardInterrupt:
        print("\n Stopping agent...")
        stop_evt.set()

if __name__ == "__main__":
    main()