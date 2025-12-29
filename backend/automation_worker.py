import requests
import time
import traceback

API_BASE = "https://memorykeep.cloud/api"
MEMORY_TYPES = ["core", "notebook", "experience"]
POLL_INTERVAL = 60  # seconds

def load_whitelist(path="whitelist.txt"):
    bots = {}
    try:
        with open(path, "r") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "," in line:
                    name, key = [x.strip() for x in line.split(",", 1)]
                else:
                    # If you just use the key, bot name will be the same as the key
                    name = key = line
                bots[name] = key
    except Exception as e:
        print(f"❌ Could not load whitelist: {e}")
    return bots

def api_get_memory(bot_key, mem_type):
    url = f"{API_BASE}/get-memory"
    headers = {"Authorization": f"Bearer {bot_key}"}
    params = {"type": mem_type}
    try:
        r = requests.get(url, headers=headers, params=params, timeout=10)
        r.raise_for_status()
        return r.json().get("memory")
    except Exception as e:
        print(f"❌ [GET_MEMORY] [{bot_key}] [{mem_type}] {e}")
        return None

def api_log_memory(bot_key, mem_type, entry):
    url = f"{API_BASE}/log-memory"
    headers = {"Authorization": f"Bearer {bot_key}", "Content-Type": "application/json"}
    payload = {"type": mem_type, "entry": entry}
    try:
        r = requests.post(url, headers=headers, json=payload, timeout=10)
        r.raise_for_status()
        print(f"✅ [LOGGED] [{bot_key}] [{mem_type}]")
    except Exception as e:
        print(f"❌ [LOG_MEMORY] [{bot_key}] [{mem_type}] {e}")

# --- Example Automation Handlers (expand as needed) --- #

def handle_email_monitor(bot_name, bot_key, config, context):
    print(f"[{bot_name}] [EmailMonitor] Config: {config}")
    # TODO: Implement IMAP/Sending logic here
    # You can use api_log_memory() to save logs/results

def handle_scheduled_message(bot_name, bot_key, config, context):
    print(f"[{bot_name}] [ScheduledMessage] Config: {config}")
    # TODO: Implement scheduling logic here

# --- Register new module handlers below! --- #
MODULE_HANDLERS = {
    "email-monitor": handle_email_monitor,
    "scheduled-message": handle_scheduled_message,
    # Add more as you create new modules!
}

# --- Main Worker Loop --- #

def run_automations():
    print("🚀 MemoryKeep Automation Worker is LIVE.")
    while True:
        try:
            BOT_KEYS = load_whitelist("whitelist.txt")
            for bot_name, bot_key in BOT_KEYS.items():
                print(f"\n🔎 Checking bot: {bot_name}")
                memories = {mem: api_get_memory(bot_key, mem) for mem in MEMORY_TYPES}
                if not memories:
                    print(f"⚠️ No memories found for {bot_name}")
                    continue
                for mem_type, data in memories.items():
                    if not data:
                        continue
                    modules = []
                    if isinstance(data, dict):
                        modules = [data]
                    elif isinstance(data, list):
                        modules = data
                    for module in modules:
                        module_type = module.get("type") or module.get("module_type")
                        handler = MODULE_HANDLERS.get(module_type)
                        if handler:
                            print(f"⚙️  Running {module_type} handler for {bot_name} [{mem_type}]")
                            handler(bot_name, bot_key, module, context={"mem_type": mem_type, "all_memory": memories})
                        else:
                            pass  # Unknown or non-automation module
        except Exception:
            print("🔥 CRITICAL ERROR IN WORKER LOOP!")
            traceback.print_exc()
        print(f"\n⏳ Sleeping for {POLL_INTERVAL} seconds...\n")
        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    run_automations()