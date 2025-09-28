#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import docker
import json
import os
import queue
import threading
import time
from typing import Optional
import requests

# =============== CONFIG POR ENV ===============

API_URL = os.getenv("BUGRADAR_API_URL", "http://localhost:3000/api/logs")  # POST logs
STATUS_API_URL = os.getenv("BUGRADAR_STATUS_API_URL", "http://localhost:3000/api/status")  # POST status
USER_ID = os.getenv("BUGRADAR_USER_ID", "")  # UUID del usuario/propietario

MONITOR_CONTAINERS = os.getenv("BUGRADAR_CONTAINERS", "")  # CSV de nombres; vacío = todos
TAIL = int(os.getenv("BUGRADAR_TAIL", "100"))              # cuántas líneas históricas traerse
PARSE_JSON = os.getenv("BUGRADAR_PARSE_JSON", "1") == "1"  # si el log es JSON {"level": "...", "msg": "..."}
HEARTBEAT_EVERY = int(os.getenv("BUGRADAR_HEARTBEAT_EVERY", "60"))  # seg

# Palabras clave (fallback cuando no hay JSON "level" fiable)
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

# =============== CLASIFICACIÓN DE SEVERIDAD ===============

def normalize_level(val: str) -> str:
    s = str(val).strip().lower()
    # mapear comunes
    if s in ("err", "error", "fatal", "panic", "crit", "critical", "severe"):
        return "error"
    if s in ("warn", "warning", "deprecated"):
        return "warning"
    if s in ("info", "information", "notice", "debug", "trace"):
        return "info"
    # números (algunos frameworks)
    if s.isdigit():
        n = int(s)
        if n >= 40:  # error y superiores
            return "error"
        if n >= 30:
            return "warning"
        return "info"
    return s

def get_severity_from_text(line: str) -> Optional[str]:
    low = line.lower()
    if any(k in low for k in ERROR_KEYWORDS):
        return "error"
    if any(k in low for k in WARNING_KEYWORDS):
        return "warning"
    return None  # ignoramos info

def get_severity(line: str) -> Optional[str]:
    """
    Devuelve "error" | "warning" | None (ignoramos info)
    """
    if PARSE_JSON:
        try:
            obj = json.loads(line)
            # muchos frameworks tienen "level" o "severity"
            lvl = obj.get("level") or obj.get("severity") or obj.get("lvl") or obj.get("log_level")
            if lvl is not None:
                sev = normalize_level(str(lvl))
                if sev in ("error", "warning"):
                    return sev
                return None
            # si no hay nivel, mirar claves típicas de error
            msg = obj.get("msg") or obj.get("message") or ""
            sev = get_severity_from_text(f"{msg} {json.dumps(obj, ensure_ascii=False)}")
            return sev
        except Exception:
            # no era JSON limpio; caemos a texto
            pass
    return get_severity_from_text(line)

# =============== ENVÍO A API ===============

def send_log_to_api(log_message: str, container_name: str, severity: str):
    payload = {
        "log_message": log_message,
        "container_name": container_name,
        "severity": severity,
        "user_id": USER_ID
    }
    http_post(API_URL, payload)

def send_status_to_api(container_name: str, status: str):
    payload = {
        "container_name": container_name,
        "status": status,  # 'up' | 'down' | 'heartbeat'
        "user_id": USER_ID or None
    }
    http_post(STATUS_API_URL, payload)

# =============== DOCKER ===============

def connect_to_docker():
    try:
        client = docker.from_env()
        client.ping()
        print("✅ Conexión con Docker establecida con éxito.")
        return client
    except docker.errors.DockerException as e:
        print(f"❌ Error al conectar con Docker: {e}")
        print("Asegúrate de que el daemon de Docker está ejecutándose y montaste /var/run/docker.sock.")
        return None

# =============== MONITORIZACIÓN DE LOGS ===============

def stream_container_logs(container, out_q: queue.Queue):
    name = container.name
    if not should_monitor(name):
        return
    debug(f"attach logs: {name}")
    try:
        for raw in container.logs(stream=True, follow=True, tail=TAIL):
            try:
                line = raw.decode("utf-8", errors="replace").strip()
            except Exception:
                line = str(raw).strip()
            if not line:
                continue
            out_q.put((name, line))
    except Exception as e:
        print(f"❌ Log stream error [{name}]: {e}")

def logs_dispatcher(out_q: queue.Queue, stop_evt: threading.Event):
    while not stop_evt.is_set():
        try:
            name, line = out_q.get(timeout=1.0)
        except queue.Empty:
            continue
        sev = get_severity(line)
        if sev in ("error", "warning"):
            print(f"  [LOG] {name} | {sev.upper()} | {line[:2000]}")
            send_log_to_api(line, name, sev)
        # else: ignoramos info/debug/etc

def start_logs_threads(client) -> threading.Event:
    out_q: queue.Queue = queue.Queue(maxsize=10000)
    stop_evt = threading.Event()
    # dispatcher
    threading.Thread(target=logs_dispatcher, args=(out_q, stop_evt), daemon=True).start()
    # uno por contenedor actual
    try:
        for c in client.containers.list():
            if should_monitor(c.name):
                threading.Thread(target=stream_container_logs, args=(c, out_q), daemon=True).start()
    except Exception as e:
        print(f"❌ No se pudo listar contenedores para logs: {e}")
    # si aparecen contenedores nuevos, nos “reanexa” el evento de start (ver monitor_status)
    return stop_evt

# =============== MONITORIZACIÓN DE ESTADO (UP/DOWN + HEARTBEAT) ===============

def monitor_container_status(client):
    print("🚦 Escuchando eventos de Docker (UP/DOWN) y enviando heartbeats…")
    # Envío inicial de heartbeat de contenedores en ejecución
    try:
        for c in client.containers.list():
            if should_monitor(c.name):
                send_status_to_api(c.name, "heartbeat")
    except Exception as e:
        print(f"❌ No se pudo listar contenedores al inicio (status): {e}")

    # Heartbeat periódico
    def heartbeat_loop():
        while True:
            try:
                for c in client.containers.list():
                    if should_monitor(c.name):
                        send_status_to_api(c.name, "heartbeat")
                time.sleep(HEARTBEAT_EVERY)
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"❌ Error en heartbeat: {e}")
                time.sleep(HEARTBEAT_EVERY)

    threading.Thread(target=heartbeat_loop, daemon=True).start()

    # Eventos del daemon
    try:
        for ev in client.events(decode=True):
            if ev.get("Type") != "container":
                continue
            action = ev.get("Action")
            attrs = ev.get("Actor", {}).get("Attributes", {}) or {}
            name = attrs.get("name")
            if not name or not should_monitor(name):
                continue

            if action in ("start", "unpause", "health_status: healthy"):
                send_status_to_api(name, "up")
            elif action in ("die", "stop", "pause", "health_status: unhealthy", "kill", "oom"):
                send_status_to_api(name, "down")
            # Si quieres, cuando arranca un contenedor nuevo, podríamos auto-anexar logs.
            # El attach dinámico es más complejo (puede duplicar streams si no controlas),
            # preferimos reiniciar el agente o gestionar un registro de anexados.
    except KeyboardInterrupt:
        print("🛑 Parando monitor de estado…")
    except Exception as e:
        print(f"❌ Error en stream de eventos: {e}")

# =============== MAIN ===============

def main():
    if not USER_ID:
        print("⚠️  BUGRADAR_USER_ID no está definido. Se enviarán logs/estado sin usuario (user_id=None).")

    client = connect_to_docker()
    if not client:
        return

    # Hilo de estado
    threading.Thread(target=monitor_container_status, args=(client,), daemon=True).start()

    # Hilos de logs
    stop_evt = start_logs_threads(client)

    print("🚀 Agente iniciado. (Ctrl+C para detener)")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Deteniendo agente…")
        stop_evt.set()

if __name__ == "__main__":
    main()
