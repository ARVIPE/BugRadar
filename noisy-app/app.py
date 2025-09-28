import json, os, random, sys, time, socket, datetime as dt, threading
from flask import Flask, jsonify

# ============== HEALTHCHECK SERVER (FLASK) ==============
# Simula un servicio que a veces falla para probar el uptime.

app = Flask(__name__)
IS_HEALTHY = True  # Estado global de salud

@app.route('/health')
def health_check():
    # 80% de las veces funciona, 20% falla
    is_ok = random.choices([True, False], weights=[80, 20])[0]
    if is_ok:
        return jsonify({"status": "ok"}), 200
    else:
        return jsonify({"status": "error"}), 500

def run_flask_app():
    # Werkzeug es ruidoso, así que deshabilitamos su log por defecto
    import logging
    log = logging.getLogger('werkzeug')
    log.setLevel(logging.ERROR)
    app.run(host='0.0.0.0', port=5000)

# Iniciar Flask en un hilo demonio para que no bloquee el script principal
threading.Thread(target=run_flask_app, daemon=True).start()


# ============== SCRIPT DE LOGS RUIDOSOS (sin cambios) ==============

APP_NAME = os.getenv("APP_NAME", "noisy-app")
LEVELS = ["warning", "error"]

msgs = {
    "warning": [
        "cache near capacity", "retrying upstream", "slow query detected",
        "high memory usage", "disk almost full"
    ],
    "error": [
        "db connection failed", "unhandled exception in worker",
        "timeout calling upstream", "auth failed", "out of file descriptors"
    ]
}

i = 0
while True:
    i += 1
    level = random.choices(LEVELS, weights=[70,30])[0]  # 70% warn, 30% error
    msg = random.choice(msgs[level])
    payload = {
        "ts": dt.datetime.utcnow().isoformat() + "Z",
        "level": level,
        "msg": msg,
        "i": i,
        "app": APP_NAME,
        "host": socket.gethostname(),
    }
    print(json.dumps(payload), flush=True)
    time.sleep(10)
