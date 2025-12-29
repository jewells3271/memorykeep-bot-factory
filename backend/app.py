from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os, json
from datetime import datetime
from functools import wraps

app = Flask(__name__, template_folder="templates", static_folder="static")
CORS(app) 

MEMORY_BASE = os.path.join(os.path.dirname(__file__), "memory_data")
os.makedirs(MEMORY_BASE, exist_ok=True)

def load_whitelist(path="whitelist.txt"):
    keys = set()
    try:
        with open(path, "r") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "," in line:
                    name, key = [x.strip() for x in line.split(",", 1)]
                else:
                    key = line
                keys.add(key)
    except Exception as e:
        print(f"Warning: could not load whitelist.txt: {e}")
    return keys

VALID_KEYS = load_whitelist()


def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401
        api_key = auth_header.split(" ")[1]
        if api_key not in VALID_KEYS:
            return jsonify({"error": "Unauthorized"}), 403
        request.instance_id = api_key
        return f(*args, **kwargs)
    return decorated

def get_file_path(instance_id, mem_type, as_json=False):
    inst_dir = os.path.join(MEMORY_BASE, instance_id)
    os.makedirs(inst_dir, exist_ok=True)
    ext = "json" if as_json else "txt" if mem_type != "experience" else "log"
    return os.path.join(inst_dir, f"{mem_type}.{ext}")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/log-memory", methods=["POST"])
@require_api_key
def log_memory():
    data = request.json
    mem_type = data.get("type", "experience")
    entry = data.get("entry")
    if entry is None:
        return jsonify({"error": "Missing 'entry'"}), 400

    is_json = isinstance(entry, dict)
    file_path = get_file_path(request.instance_id, mem_type, is_json)
    timestamp = datetime.now().isoformat()

    if is_json:
        logs = []
        if os.path.exists(file_path):
            with open(file_path, "r") as f:
                try:
                    logs = json.load(f)
                except:
                    logs = []
        entry["timestamp"] = timestamp
        logs.append(entry)
        with open(file_path, "w") as f:
            json.dump(logs, f, indent=2)
    else:
        with open(file_path, "a") as f:
            f.write(f"[{timestamp}] {entry}\n")

    return jsonify({"status": "logged"})

@app.route("/api/get-memory", methods=["GET"])
@require_api_key
def get_memory():
    mem_type = request.args.get("type", "experience")
    file_path_txt = get_file_path(request.instance_id, mem_type, False)
    file_path_json = get_file_path(request.instance_id, mem_type, True)

    if os.path.exists(file_path_json):
        with open(file_path_json, "r") as f:
            return jsonify({"memory": json.load(f), "format": "json"})
    elif os.path.exists(file_path_txt):
        with open(file_path_txt, "r") as f:
            return jsonify({"memory": f.read(), "format": "text"})
    else:
        return jsonify({"error": "No memory found"}), 404

@app.route("/api/overwrite-memory", methods=["POST"])
@require_api_key
def overwrite_memory():
    data = request.json
    mem_type = data.get("type")
    entry = data.get("entry")
    if not mem_type or entry is None:
        return jsonify({"error": "Missing 'type' or 'entry'"}), 400

    is_json = isinstance(entry, dict) or isinstance(entry, list)
    file_path = get_file_path(request.instance_id, mem_type, is_json)

    with open(file_path, "w") as f:
        if is_json:
            json.dump(entry, f, indent=2)
        else:
            f.write(entry.strip() + "\n")

    return jsonify({"status": "overwritten"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
