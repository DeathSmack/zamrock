# --------------------------------------------------------------
#  Discord → OpenAI bot
#  • !ask stays a normal command
#  • any message that contains the word “Soap” (case‑insensitive)
#    is forwarded to the model **only if the user has asked a question
#    in the last 5 minutes** (or is the owner – owners bypass the time check).
#  • normal text is answered after a recent !ask, keeping the 5‑min
#    contextual window.
#  • prints every event to the terminal for quick debugging.
# --------------------------------------------------------------

import os
import time
import discord
import asyncio
import requests
from dotenv import load_dotenv

# ------------------------------------------------------------------
#  Load configuration
# ------------------------------------------------------------------
load_dotenv()
DISCORD_TOKEN   = os.getenv("DISCORD_TOKEN")
OPENWEBUI_URL   = os.getenv("OPENWEBUI_URL")
OPENWEBUI_MODEL = os.getenv("OPENWEBUI_MODEL", "gpt-3.5-turbo")
OPENWEBUI_TOKEN = os.getenv("OPENWEBUI_TOKEN")   # optional
OWNER_ID        = os.getenv("OWNER_ID")          # Discord user ID of the bot owner

if not DISCORD_TOKEN or not OPENWEBUI_URL:
    raise RuntimeError("DISCORD_TOKEN and OPENWEBUI_URL must be set in .env")
if not OWNER_ID:
    raise RuntimeError("OWNER_ID must be set in .env")

# ------------------------------------------------------------------
#  Helper: talk to OpenWebUI
# ------------------------------------------------------------------
def query_openwebui(prompt: str) -> str:
    """Send the prompt to the OpenWebUI model and return the response."""
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

# ------------------------------------------------------------------
#  Text‑splitting utilities
# ------------------------------------------------------------------
MAX_CHUNK = 1990  # safe margin below Discord's 2000‑char limit
def chunk_text(text: str, limit: int = MAX_CHUNK) -> list[str]:
    return [text[i:i + limit] for i in range(0, len(text), limit)]

async def send_chunks(channel, text: str):
    for chunk in chunk_text(text):
        await channel.send(chunk)

# ------------------------------------------------------------------
#  Discord bot setup
# ------------------------------------------------------------------
intents = discord.Intents.default()
intents.message_content = True
client = discord.Client(intents=intents)

@client.event
async def on_ready():
    print(f"Logged in as {client.user} (id: {client.user.id})")
    print("Ready to answer messages!")

def is_owner(user: discord.User) -> bool:
    return str(user.id) == OWNER_ID

# ------------------------------------------------------------------
#  Contextual‑window tracking (5‑minute rule)
# ------------------------------------------------------------------
COOLDOWN_SEC = 5 * 60                # 5 minutes in seconds
LAST_QUERY_TIME = {}                # user_id -> last !ask timestamp

# Helper that sends a query and replies
async def handle_query(message: discord.Message, prompt: str):
    """Send the prompt to OpenAI and send back the answer (chunked)."""
    print(f"[{time.strftime('%H:%M:%S')}] Asking model on behalf of {message.author}")
    await message.channel.send("🤖 Thinking…")
    answer = query_openwebui(prompt)
    await send_chunks(message.channel, answer)

# ------------------------------------------------------------------
#  Main message handler
# ------------------------------------------------------------------
@client.event
async def on_message(message: discord.Message):
    # Ignore the bot's own messages
    if message.author == client.user:
        return

    # ---- DEBUG: log every incoming message ----
    print(f"[{time.strftime('%H:%M:%S')}] {message.author} said: {message.content}")

    content = message.content.strip()
    content_lower = content.lower()

    # 1️⃣ Owner‑only shutdown
    if content_lower.startswith("!shutdown"):
        if not is_owner(message.author):
            await message.channel.send("❌ You don't have permission to use this command.")
            return
        await message.channel.send("🔒 Shutting down…")
        await client.close()
        return

    # 2️⃣ Show model
    if content_lower.startswith("!model"):
        await message.channel.send(f"Current model: **{OPENWEBUI_MODEL}**")
        return

    # 3️⃣ Show owner info
    if content_lower.startswith("!owner"):
        owner = client.get_user(int(OWNER_ID))
        await message.channel.send(f"Bot owner: {owner} (ID: {OWNER_ID})")
        return

    # 4️⃣ “Soap” rule – trigger only if user has asked within last 5 min
    if "soap" in content_lower:          # case‑insensitive match
        user_id = message.author.id
        # Owners bypass the cooldown rule
        within_cooldown = is_owner(message.author) or \
                          (time.time() - LAST_QUERY_TIME.get(user_id, 0) <= COOLDOWN_SEC)
        if within_cooldown:
            print(f"[DEBUG] 'Soap' detected – forwarding to model for {message.author}")
            await handle_query(message, content)   # forward the raw message
            return
        else:
            # If outside cooldown, do *not* respond
            print(f"[DEBUG] 'Soap' detected but cooldown expired for {message.author}")
            return

    # 5️⃣ !ask command (normal command)
    if content_lower.startswith("!ask "):
        question = content[5:].strip()
        if not question:
            await message.channel.send("❗ You need to supply a question after `!ask`.")
            return
        await handle_query(message, question)
        # Update last ask timestamp (owners are exempt)
        if not is_owner(message.author):
            LAST_QUERY_TIME[message.author.id] = time.time()
        return

    # 6️⃣ Contextual answering – any *normal* text after a recent !ask
    if not content.startswith("!") and not message.author.bot:
        user_id = message.author.id
        if is_owner(message.author) or \
           (time.time() - LAST_QUERY_TIME.get(user_id, 0) <= COOLDOWN_SEC):
            await handle_query(message, content)
            return

# ------------------------------------------------------------------
#  Start the bot
# ------------------------------------------------------------------
client.run(DISCORD_TOKEN)
