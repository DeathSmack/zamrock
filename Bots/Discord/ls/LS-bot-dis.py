#!/usr/bin/env python3
# ──────────────────────────────────────────────────────────────────────────────────────
#  Discord → OpenAI “Cat‑DJ” bot
#  • Random cat‑DJ style “thinking” messages
#  • Per‑user sleep/wake via `!sleep`, `!wake`, or any message containing “Soap”
#  • 5‑minute contextual window for normal messages
#  • Owner (owner id in .env) can always use commands and put the bot to sleep
#  • Plus: Owner-only commands to change models, list models, set default model
# ──────────────────────────────────────────────────────────────────────────────────────

import os
import time
import random
import re
import discord
import requests
from dotenv import load_dotenv

# ──────────────────────────────────────────────────────────────────────────────────────
#  Load environment variables
# ──────────────────────────────────────────────────────────────────────────────────────
load_dotenv()
DISCORD_TOKEN   = os.getenv("DISCORD_TOKEN")
OPENWEBUI_URL   = os.getenv("OPENWEBUI_URL")
OPENWEBUI_MODEL = os.getenv("OPENWEBUI_MODEL", "gpt-3.5-turbo")
OPENWEBUI_TOKEN = os.getenv("OPENWEBUI_TOKEN")          # optional
OWNER_ID        = os.getenv("OWNER_ID")                  # Discord user ID of the owner

if not DISCORD_TOKEN or not OPENWEBUI_URL:
    raise RuntimeError("DISCORD_TOKEN and OPENWEBUI_URL must be set in .env")
if not OWNER_ID:
    raise RuntimeError("OWNER_ID must be set in .env")

# ──────────────────────────────────────────────────────────────────────────────────────
#  Helper: talk to OpenWebUI
# ──────────────────────────────────────────────────────────────────────────────────────
def query_openwebui(prompt: str) -> str:
    payload = {
        "model": OPENWEBUI_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
    }
    headers = {}
    if OPENWEBUI_TOKEN:
        headers["Authorization"] = f"Bearer {OPENWEBUI_TOKEN}"
    try:
        resp = requests.post(
            f"{OPENWEBUI_URL}/api/v1/chat/completions",
            json=payload,
            headers=headers,
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]
    except Exception as exc:
        print(f"OpenWebUI error: {exc}")
        return "⚠️ *Could not get a response from the model.*"

# ──────────────────────────────────────────────────────────────────────────────────────
#  Text‑splitting utilities (Discord message limit is 2000 chars)
# ──────────────────────────────────────────────────────────────────────────────────────
MAX_CHUNK = 1990
def chunk_text(text: str, limit: int = MAX_CHUNK) -> list[str]:
    return [text[i:i + limit] for i in range(0, len(text), limit)]

async def send_chunks(channel, text: str):
    for chunk in chunk_text(text):
        await channel.send(chunk)

# ──────────────────────────────────────────────────────────────────────────────────────
#  Discord bot setup
# ──────────────────────────────────────────────────────────────────────────────────────
intents = discord.Intents.default()
intents.message_content = True
client = discord.Client(intents=intents)

# ──────────────────────────────────────────────────────────────────────────────────────
#  Config: models list and default
# ──────────────────────────────────────────────────────────────────────────────────────
# You can update this list as needed, or load from a file if preferred
MODELS = os.getenv("MODELS", "liquidsoap,another-model,yet-another").split(",")
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", MODELS[0])

# store current model in memory
current_model = DEFAULT_MODEL

def is_owner(user: discord.User) -> bool:
    return str(user.id) == OWNER_ID

# ──────────────────────────────────────────────────────────────────────────────────────
#  Owner-only commands to manage models
# ──────────────────────────────────────────────────────────────────────────────────────
@client.event
async def on_message(message):
    global current_model
    # Your existing commands and logic...

    # -- ADDITIONAL OWNER-ONLY COMMANDS START HERE --
    if message.content.startswith("!listmodels") and is_owner(message.author):
        models_str = "\n".join(f"{i+1}. {m}" for i, m in enumerate(MODELS))
        await message.channel.send(f"Available models:\n{models_str}")
        return

    if message.content.startswith("!setmodel") and is_owner(message.author):
        parts = message.content.split(maxsplit=1)
        if len(parts) < 2:
            await message.channel.send("Usage: !setmodel <model_name|number>")
            return
        arg = parts[1]
        # Check if number
        if arg.isdigit():
            index = int(arg) - 1
            if 0 <= index < len(MODELS):
                current_model = MODELS[index]
                await message.channel.send(f"Model changed to: {current_model}")
            else:
                await message.channel.send("Invalid model number.")
        else:
            # Check by name
            if arg in MODELS:
                current_model = arg
                await message.channel.send(f"Model changed to: {current_model}")
            else:
                await message.channel.send("Model name not found.")
        return

    if message.content.startswith("!defaultmodel") and is_owner(message.author):
        current_model = DEFAULT_MODEL
        await message.channel.send(f"Model reset to default: {current_model}")
        return

    # ... rest of your existing on_message logic ...
    # (your current code continues here)

    # Ignore other parts (your existing code)
    # ... existing code continues unchanged ...
    # For clarity, I will just append your existing on_message code after this

    # -- your existing on_message code starts here (from your code above) --
    # ignore the previous comment, just append the rest of your code here

    # Ignore the bot's own messages
    if message.author == client.user:
        return

    # DEBUG: log every incoming message
    print(f"[{time.strftime('%H:%M:%S')}] {message.author} said: {message.content}")

    content = message.content.strip()
    content_lower = content.lower()
    user_id = message.author.id

    # ---------- 1️⃣ Owner‑only shutdown ----------
    if content_lower.startswith("!shutdown"):
        if not is_owner(message.author):
            await message.channel.send("❌ You don't have permission to use this command.")
            return
        await message.channel.send("🔒 Shutting down…")
        await client.close()
        return

    # ---------- 2️⃣ Show current model ----------
    if content_lower.startswith("!model"):
        await message.channel.send(f"Current model: **{OPENWEBUI_MODEL}**")
        return

    # ---------- 3️⃣ Show owner information ----------
    if content_lower.startswith("!owner"):
        owner = client.get_user(int(OWNER_ID))
        await message.channel.send(f"Bot owner: {owner} (ID: {OWNER_ID})")
        return

    # ---------- 4️⃣ Sleep / wake commands (per‑user) ----------
    if content_lower.startswith("!sleep"):
        USER_SLEEP[user_id] = True
        await message.channel.send(
            "😴 *The cat‑DJ is sleeping now. Use “Soap, or !ask” to wake him.*"
        )
        return
    if content_lower.startswith("!wake"):
        USER_SLEEP[user_id] = False
        await message.channel.send("🔊 *The cat‑DJ is awake and ready!*")
        return

    # ---------- 5️⃣ If user is sleeping ----------
    if USER_SLEEP.get(user_id, False):
        # Wake if the message starts with a command **or contains the word “soap” anywhere**
        if content.startswith('!') or 'soap' in content_lower:
            USER_SLEEP[user_id] = False   # wake the user
        else:
            # Non‑prefixed message while sleeping – nothing to do
            return

    # ---------- 6️⃣ “Soap” rule ----------
    if "soap" in content_lower:
        sanitized = sanitize(content)
        if not sanitized:
            print(f"[DEBUG] 'Soap' greeting only – ignoring message from {message.author}")
            return

        # “Soap, go to sleep”
        if "go to sleep" in sanitized.lower():
            USER_SLEEP[user_id] = True
            await message.channel.send(
                "😴 *The cat‑DJ is sleeping now. Use “Soap, or !ask” to wake him.*"
            )
            return

        # Normal soap query – make sure the user is awake
        USER_SLEEP[user_id] = False
        await handle_query(message, sanitized)
        if not is_owner(message.author):
            LAST_QUERY_TIME[user_id] = time.time()
        return

    # ---------- 7️⃣ !ask command ----------
    if content_lower.startswith("!ask "):
        question = content[5:].strip()
        if not question:
            await message.channel.send("❗ You need to supply a question after `!ask`.")
            return
        USER_SLEEP[user_id] = False
        await handle_query(message, question)
        if not is_owner(message.author):
            LAST_QUERY_TIME[user_id] = time.time()
        return

    # ---------- 8️⃣ Normal text from a user who isn’t sleeping ----------
    if not content.startswith("!") and not message.author.bot:
        if is_owner(message.author) or \
           (time.time() - LAST_QUERY_TIME.get(user_id, 0) <= COOLDOWN_SEC):
            await handle_query(message, content)
            return

# ──────────────────────────────────────────────────────────────────────────────────────
#  Start the bot
# ──────────────────────────────────────────────────────────────────────────────────────
client.run(DISCORD_TOKEN)
