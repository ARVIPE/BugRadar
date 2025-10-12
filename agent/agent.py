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

def should_monitor(container) -> bool:
    """
    Decide si un contenedor debe ser monitorizado.
    Prioridad 1: Label de Docker 'bugradar.monitor=true'.
    Prioridad 2: Nombre del contenedor en la variable de entorno BUGRADAR_CONTAINERS.
    Prioridad 3: Si no se especifica nada, se monitoriza todo.
    """
    if container.labels.get('bugradar.monitor') == 'true':
        return True
    if container.labels.get('bugradar.monitor') == 'false':
        return False
    
    # Fallback a la variable de entorno
    if not MONITOR_CONTAINERS.strip():
        return True
        
    wl = [x.strip() for x in MONITOR_CONTAINERS.split(",") if x.strip()]
    return container.name in wl

def should_monitor_by_name(name: str) -> bool:
    """Función de fallback para eventos donde no tenemos el objeto container completo."""
    if not MONITOR_CONTAINERS.strip():
        return True
    wl = [x.strip() for x in MONITOR_CONTAINERS.split(",") if x.strip()]
    return name in wl

def http_post(url: str, payload: dict, timeout=5):
    """Función de envío a la API mejorada con reintentos y backoff exponencial."""
    retries = 3
    delay = 1  # segundos
    backoff_factor = 2

    for i in range(retries):
        try:
            r = requests.post(url, json=payload, timeout=timeout)
            if r.status_code in (200, 201):
                debug(f"POST {url} ok")
                return r
            
            if 500 <= r.status_code < 600:
                print(f"  ⚠️  POST {url} -> {r.status_code} (Server Error). Retrying in {delay}s... ({i + 1}/{retries})")
            else:
                print(f"  ❌ POST {url} -> {r.status_code}: {r.text[:300]} (Client Error, no retry)")
                return None
        
        except requests.RequestException as e:
            print(f"  ⚠️  POST {url} error: {e}. Retrying in {delay}s... ({i + 1}/{retries})")

        time.sleep(delay)
        delay *= backoff_factor

    print(f"  ❌ POST {url} failed after {retries} retries.")
    return None


# =============== SEVERITY CLASSIFICATION ===============
# (Sin cambios en esta sección)

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
# (Sin cambios en esta sección)

def send_log_to_api(log_message: str, container_name: str, severity: str):
    http_post(API_URL, {"log_message": log_message, "container_name": container_name, "severity": severity, "user_id": USER_ID})

def send_status_to_api(container_name: str, status: str):
    http_post(STATUS_API_URL, {"container_name": container_name, "status": status, "user_id": USER_ID or None})

def send_latency_to_api(endpoint: str, method: str, latency_ms: int, status_code: int):
    http_post(LATENCY_API_URL, {"endpoint": endpoint, "method": method, "latency_ms": latency_ms, "status_code": status_code, "user_id": USER_ID or None})


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


# =============== LOG & STATUS MONITORING (ROBUST VERSION) ===============

def stream_container_logs(container, out_q: queue.Queue):
    """Lee el flujo de logs en vivo de un único contenedor."""
    try:
        for raw in container.logs(stream=True, follow=True, tail=TAIL):
            line = raw.decode("utf-8", errors="replace").strip()
            if line:
                out_q.put((container.name, line))
    except Exception as e:
        # Errores aquí suelen ser porque el contenedor se detuvo. El monitor de eventos lo gestionará.
        debug(f"Log stream for {container.name} ended: {e}")

def logs_dispatcher(out_q: queue.Queue, stop_evt: threading.Event):
    """Hilo único que procesa todos los logs de la cola."""
    while not stop_evt.is_set():
        try:
            name, line = out_q.get(timeout=1.0)
            sev = get_severity(line)
            if sev in ("error", "warning"):
                print(f"  [LOG] {name} | {sev.upper()} | {line[:200]}")
                send_log_to_api(line, name, sev)
        except queue.Empty:
            continue

def start_log_stream_for_container(container, out_q):
    """Función auxiliar para iniciar un hilo de logs para un contenedor."""
    if should_monitor(container):
        thread = threading.Thread(target=stream_container_logs, args=(container, out_q), daemon=True)
        thread.start()
        debug(f"Log stream started for {container.name}")

def fetch_logs_from_stopped_container(container_id, client, out_q):
    """Realiza una 'autopsia' para leer los últimos logs de un contenedor que falló."""
    try:
        container = client.containers.get(container_id)
        if not should_monitor(container): return
        
        logs = container.logs(tail=200).decode('utf-8', errors='replace')
        for line in logs.strip().split('\n'):
            if line:
                out_q.put((container.name, line))
        debug(f"Fetched last logs from stopped container {container.name}")
    except docker.errors.NotFound:
        debug(f"Container {container_id} not found. Could not fetch logs.")
    except Exception as e:
        print(f"❌ Error fetching logs for stopped container {container_id}: {e}")

def monitor_docker_events(client, out_q):
    """
    Hilo principal que escucha eventos de Docker para gestionar dinámicamente
    la monitorización de contenedores y su estado.
    """
    print("🚦 Listening for Docker events...")

    def heartbeat_loop():
        while True:
            try:
                for c in client.containers.list():
                    if should_monitor(c):
                        send_status_to_api(c.name, "heartbeat")
                time.sleep(HEARTBEAT_EVERY)
            except Exception as e:
                print(f"❌ Heartbeat error: {e}")
                time.sleep(HEARTBEAT_EVERY)
    
    threading.Thread(target=heartbeat_loop, daemon=True).start()

    try:
        for event in client.events(decode=True):
            if event.get("Type") != "container": continue

            action = event.get("Action")
            container_id = event.get("id")
            attrs = event.get("Actor", {}).get("Attributes", {}) or {}
            name = attrs.get("name")

            if not name: continue

            if action == "start":
                try:
                    container = client.containers.get(container_id)
                    if should_monitor(container):
                        print(f"  🟢 Container UP: {name}")
                        send_status_to_api(name, "up")
                        start_log_stream_for_container(container, out_q)
                except docker.errors.NotFound:
                    debug(f"Container {name} event received, but not found via API yet.")

            elif action == "die":
                exit_code_str = attrs.get("exitCode", "0")
                if should_monitor_by_name(name):
                    print(f"  🔴 Container DOWN: {name} (Exit code: {exit_code_str})")
                    send_status_to_api(name, "down")
                    if int(exit_code_str) != 0:
                        fetch_logs_from_stopped_container(container_id, client, out_q)

            elif action in ("stop", "pause") and should_monitor_by_name(name):
                print(f"  ⚫ Container STOPPED/PAUSED: {name}")
                send_status_to_api(name, "down")

    except Exception as e:
        print(f"❌ Docker event stream error: {e}. The agent might need a restart.")


def latency_loop():
    if not LATENCY_TARGET_URL: return
    print("🔬 Starting latency monitor...")
    
    def substitute_path_vars(path):
        path = re.sub(r"<int:[^>]+>", "1", path)
        path = re.sub(r"<string:[^>]+>", "default", path)
        path = re.sub(r"<[^>]+>", "1", path)
        return path

    def measure_latency(endpoint_info, base_url):
        path = substitute_path_vars(endpoint_info['rule'])
        url = f"{base_url}{path}"
        method = endpoint_info['methods'][0]
        try:
            start_time = time.monotonic()
            r = requests.request(method, url, timeout=10)
            latency_ms = int((time.monotonic() - start_time) * 1000)
            debug(f"  [LATENCY] {method} {path} -> {r.status_code} in {latency_ms}ms")
            send_latency_to_api(endpoint_info['rule'], method, latency_ms, r.status_code)
        except requests.RequestException as e:
            print(f"  ❌ [LATENCY] {method} {path} -> FAILED: {e}")

    while True:
        try:
            routes_url = f"{LATENCY_TARGET_URL.rstrip('/')}/debug/routes"
            r = requests.get(routes_url, timeout=10)
            if r.status_code == 200:
                endpoints = r.json()
                debug(f"Discovered {len(endpoints)} endpoints to monitor for latency.")
                base_url = LATENCY_TARGET_URL.rstrip('/')
                for endpoint in endpoints:
                    measure_latency(endpoint, base_url)
                    time.sleep(1)
            else:
                print(f"Could not fetch latency endpoints, status: {r.status_code}")
        except Exception as e:
            print(f"❌ Latency loop error: {e}")
        time.sleep(LATENCY_EVERY)


# =============== MAIN ===============

def main():
    if not USER_ID: print("⚠️ BUGRADAR_USER_ID not set.")

    client = connect_to_docker()
    if not client: return

    log_queue = queue.Queue(maxsize=10000)
    stop_event = threading.Event()

    # 1. Iniciar el hilo que procesa los logs de la cola
    threading.Thread(target=logs_dispatcher, args=(log_queue, stop_event), daemon=True).start()

    # 2. Iniciar la lectura de logs para los contenedores que ya están corriendo
    print("🚀 Attaching to currently running containers...")
    for c in client.containers.list():
        start_log_stream_for_container(c, log_queue)

    # 3. Iniciar los hilos de monitorización principales
    threading.Thread(target=monitor_docker_events, args=(client, log_queue), daemon=True).start()
    threading.Thread(target=latency_loop, daemon=True).start()

    print("✅ Agent started. (Ctrl+C to stop)")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Stopping agent...")
        stop_event.set()

if __name__ == "__main__":
    main()