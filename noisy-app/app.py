import json, os, random, sys, time, socket, datetime as dt, threading
from flask import Flask, jsonify, request


# Simulate a service that sometimes fails to test uptime.

app = Flask(__name__)

# Endpoints
@app.route('/api/health')
def health_check():
    """Endpoint for uptime."""
    is_ok = random.choices([True, False], weights=[80, 20])[0]
    if is_ok:
        return jsonify({"status": "ok"}), 200
    else:
        return jsonify({"status": "error"}), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    """Simulate a database read."""
    time.sleep(random.uniform(0.05, 0.15))
    return jsonify([{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}])

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Simulate a variable latency read."""
    time.sleep(random.uniform(0.1, 0.3))
    return jsonify({"id": product_id, "name": f"Product {product_id}", "price": 99.9})

@app.route('/api/orders', methods=['POST'])
def create_order():
    """Simulate a write with possible failure."""
    time.sleep(random.uniform(0.2, 0.5))
    if random.random() < 0.1:
        return jsonify({"error": "Internal server error"}), 500
    return jsonify({"status": "created", "order_id": random.randint(1000, 2000)}), 201

def run_flask_app():
    import logging
    log = logging.getLogger('werkzeug')
    log.setLevel(logging.ERROR)
    app.run(host='0.0.0.0', port=5000)

threading.Thread(target=run_flask_app, daemon=True).start()


# Noisy logs script

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
    time.sleep(30) 
