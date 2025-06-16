import redis
import subprocess
import time

r = redis.Redis(host="localhost", port=6379, decode_responses=True)

last_value = None

while True:
    try:
        value = r.get("scale:worker_count")
        if value and value != last_value:
            print(f"🔁 Scaling to {value} workers...")
            subprocess.run(["docker", "compose", "up", "--scale", f"worker={value}", "-d", "worker"])
            last_value = value
    except Exception as e:
        print(f"❌ Error: {e}")
    time.sleep(5)
