import json, os, random, sys, time, socket, datetime as dt

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
