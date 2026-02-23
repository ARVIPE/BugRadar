import json, os, random, time, socket, datetime as dt, threading
from flask import Flask, jsonify, request, Response

app      = Flask(__name__)
APP_NAME = os.getenv("APP_NAME", "noisy-app")
HOST     = socket.gethostname()

SCENARIOS = {
    "db_crash":   ("error",   "db connection failed – max retries exceeded"),
    "oom":        ("error",   "out of memory – worker process killed (OOMKiller)"),
    "auth_fail":  ("error",   "auth failed – JWT signature invalid"),
    "timeout":    ("error",   "timeout calling upstream service after 30 s"),
    "unhandled":  ("error",   "unhandled exception in worker thread – stack overflow"),
    "disk_full":  ("warning", "disk almost full – 95 % used on /var/lib/docker"),
    "high_mem":   ("warning", "high memory usage – 87 % of available RAM consumed"),
    "slow_query": ("warning", "slow query detected – 4.2 s on SELECT * FROM orders"),
    "cache_miss": ("warning", "cache near capacity – eviction rate spike detected"),
    "retry":      ("warning", "retrying upstream – attempt 3/5"),
}

NOISE = {
    "warning": ["cache near capacity", "retrying upstream", "slow query detected",
                "high memory usage", "disk almost full"],
    "error":   ["db connection failed", "unhandled exception in worker",
                "timeout calling upstream", "auth failed", "out of file descriptors"],
}


def emit(level: str, msg: str) -> dict:
    payload = {"ts": dt.datetime.utcnow().isoformat() + "Z",
               "level": level, "msg": msg, "app": APP_NAME, "host": HOST}
    print(json.dumps(payload), flush=True)
    return payload


@app.route("/api/health")
def health_check():
    ok = random.choices([True, False], weights=[80, 20])[0]
    return (jsonify({"status": "ok"}), 200) if ok else (jsonify({"status": "error"}), 500)

@app.route("/api/users")
def get_users():
    time.sleep(random.uniform(0.05, 0.15))
    return jsonify([{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}])

@app.route("/api/products/<int:product_id>")
def get_product(product_id):
    time.sleep(random.uniform(0.1, 0.3))
    return jsonify({"id": product_id, "name": f"Product {product_id}", "price": 99.9})

@app.route("/api/orders", methods=["POST"])
def create_order():
    time.sleep(random.uniform(0.2, 0.5))
    if random.random() < 0.1:
        return jsonify({"error": "Internal server error"}), 500
    return jsonify({"status": "created", "order_id": random.randint(1000, 2000)}), 201


@app.route("/demo/trigger", methods=["POST"])
def demo_trigger():
    body     = request.get_json(silent=True) or {}
    scenario = body.get("scenario") or request.args.get("scenario")
    if scenario and scenario not in SCENARIOS:
        return jsonify({"error": f"unknown scenario '{scenario}'"}), 400
    if not scenario:
        scenario = random.choice(list(SCENARIOS.keys()))
    level, msg = SCENARIOS[scenario]
    return jsonify({"ok": True, "emitted": emit(level, msg)}), 200


@app.route("/demo")
def demo_panel():
    rows = ""
    for sid, (level, msg) in SCENARIOS.items():
        color = "#ef4444" if level == "error" else "#f59e0b"
        bg    = "#1f1020" if level == "error" else "#1f1a10"
        badge = ("ERROR", "#ef4444") if level == "error" else ("WARNING", "#d97706")
        rows += f"""
        <div class="row">
          <button onclick="trigger('{sid}')" id="btn-{sid}"
                  style="border-color:{color};color:{color};background:{bg};">
            <span class="badge" style="background:{badge[1]}">{badge[0]}</span>
            {msg}
          </button>
          <span class="fb" id="fb-{sid}"></span>
        </div>"""

    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>BugRadar – TFG Demo</title>
<style>
  *{{box-sizing:border-box;margin:0;padding:0}}
  body{{background:#0d0d1a;color:#e2e8f0;font-family:'Segoe UI',system-ui,sans-serif;
        min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:2rem 1rem}}
  header{{text-align:center;margin-bottom:2rem}}
  header h1{{font-size:1.8rem;font-weight:700;color:#f59e0b}}
  header p{{color:#94a3b8;font-size:.9rem;margin-top:.4rem}}
  .card{{background:#13131f;border:1px solid #2d2d44;border-radius:1rem;padding:1.5rem;width:100%;max-width:640px}}
  .label{{font-size:.68rem;text-transform:uppercase;letter-spacing:.12em;color:#64748b;margin-bottom:.8rem}}
  .random-btn{{width:100%;padding:.9rem;font-size:1rem;font-weight:700;
               background:linear-gradient(135deg,#f59e0b,#d97706);color:#0d0d1a;
               border:none;border-radius:.75rem;cursor:pointer;margin-bottom:.5rem;
               display:flex;align-items:center;justify-content:center;gap:.5rem;transition:opacity .15s}}
  .random-btn:hover{{opacity:.85}} .random-btn:active{{opacity:.6}} .random-btn:disabled{{opacity:.5;cursor:wait}}
  #fb-random{{display:block;text-align:center;font-size:.8rem;min-height:1.2rem;margin-bottom:1rem}}
  hr{{border:none;border-top:1px solid #2d2d44;margin:1rem 0}}
  .row{{display:flex;align-items:center;gap:.6rem;margin-bottom:.55rem}}
  button{{flex:1;padding:.6rem 1rem;border:1px solid;border-radius:.6rem;cursor:pointer;
           font-size:.82rem;text-align:left;display:flex;align-items:center;gap:.6rem;transition:opacity .15s}}
  button:hover{{opacity:.8}} button:active{{opacity:.5}} button:disabled{{opacity:.5;cursor:wait}}
  .badge{{font-size:.6rem;font-weight:700;padding:.15rem .4rem;border-radius:.25rem;color:#fff;flex-shrink:0}}
  .fb{{font-size:.75rem;width:60px;text-align:center;flex-shrink:0}}
  .ok{{color:#34d399}} .err{{color:#f87171}}
  .spin{{display:inline-block;animation:spin .6s linear infinite}}
  @keyframes spin{{to{{transform:rotate(360deg)}}}}
  footer{{margin-top:1.5rem;color:#334155;font-size:.72rem}}
</style>
</head>
<body>
<header>
  <h1>🐛 BugRadar – TFG Demo</h1>
  <p>Cada botón emite un log real de <strong>noisy-app</strong> → agente → dashboard</p>
</header>
<div class="card">
  <div class="label">Acción rápida</div>
  <button class="random-btn" onclick="triggerRandom()" id="btn-random">🎲 Inyectar evento aleatorio</button>
  <span id="fb-random"></span>
  <hr>
  <div class="label">Escenarios específicos</div>
  {rows}
</div>
<footer>noisy-app · {HOST}</footer>
<script>
async function trigger(scenario) {{
  const btn = document.getElementById('btn-' + scenario);
  const fb  = document.getElementById('fb-' + scenario);
  btn.disabled = true;
  fb.innerHTML = '<span class="spin">⟳</span>';
  try {{
    const r = await fetch('/demo/trigger', {{method:'POST',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{scenario}})}});
    fb.innerHTML = r.ok ? '<span class="ok">✓</span>' : '<span class="err">✗</span>';
  }} catch {{ fb.innerHTML = '<span class="err">✗</span>'; }}
  setTimeout(() => {{ fb.innerHTML = ''; btn.disabled = false; }}, 2000);
}}

async function triggerRandom() {{
  const btn = document.getElementById('btn-random');
  const fb  = document.getElementById('fb-random');
  btn.disabled = true; btn.textContent = '⟳ Enviando…';
  try {{
    const r    = await fetch('/demo/trigger', {{method:'POST',headers:{{'Content-Type':'application/json'}},body:'{{}}'}});
    const data = await r.json();
    fb.innerHTML = r.ok ? `<span class="ok">✓ ${{data.emitted?.level?.toUpperCase()}} emitido</span>` : '<span class="err">✗</span>';
  }} catch {{ fb.innerHTML = '<span class="err">✗</span>'; }}
  btn.disabled = false; btn.innerHTML = '🎲 Inyectar evento aleatorio';
  setTimeout(() => {{ fb.innerHTML = ''; }}, 2500);
}}
</script>
</body>
</html>"""
    return Response(html, mimetype="text/html")


def noisy_loop():
    while True:
        level = random.choices(["warning", "error"], weights=[70, 30])[0]
        emit(level, random.choice(NOISE[level]))
        time.sleep(30)

threading.Thread(target=noisy_loop, daemon=True).start()

if __name__ == "__main__":
    import logging
    logging.getLogger("werkzeug").setLevel(logging.ERROR)
    app.run(host="0.0.0.0", port=5000)
