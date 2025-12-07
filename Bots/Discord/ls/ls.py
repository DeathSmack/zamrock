import os
import discord
import asyncio
from dotenv import load_dotenv
import requests          # ← add this

# ── Load configuration ─────────────────────────────────────────────────────────────
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

# ── Helper: talk to OpenWebUI ───────────────────────────────────────────────────────
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

# ── Text‑splitting utilities ────────────────────────────────────────────────────────
MAX_CHUNK = 1990  # safe margin below Discord's 2000‑char limit
def chunk_text(text: str, limit: int = MAX_CHUNK) -> list[str]:
    return [text[i:i + limit] for i in range(0, len(text), limit)]

async def send_chunks(channel, text: str):
    for chunk in chunk_text(text):
        await channel.send(chunk)

# ── Discord bot ─────────────────────────────────────────────────────────────────────
intents = discord.Intents.default()
intents.message_content = True
client = discord.Client(intents=intents)

@client.event
async def on_ready():
    print(f"Logged in as {client.user} (id: {client.user.id})")
    print("Ready to answer messages!")

def is_owner(user: discord.User) -> bool:
    return str(user.id) == OWNER_ID

@client.event
async def on_message(message):
    # Ignore messages from the bot itself
    if message.author == client.user:
        return

    # Owner‑only command: !shutdown
    if message.content.startswith("!shutdown"):
        if not is_owner(message.author):
            await message.channel.send("❌ You don't have permission to use this command.")
            return
        await message.channel.send("🔒 Shutting down…")
        await client.close()
        return

    # Command to show current model
    if message.content.startswith("!model"):
        await message.channel.send(f"Current model: **{OPENWEBUI_MODEL}**")
        return

    # Command to show owner info
    if message.content.startswith("!owner"):
        owner = client.get_user(int(OWNER_ID))
        await message.channel.send(f"Bot owner: {owner} (ID: {OWNER_ID})")
        return

    # Simple command: !ask <question>
    if message.content.startswith("!ask "):
        question = message.content[5:].strip()
        if not question:
            await message.channel.send("❗ You need to supply a question after `!ask`.")
            return
        await message.channel.send("🤖 Thinking…")
        answer = query_openwebui(question)
        await send_chunks(message.channel, answer)

# ── Run the bot ────────────────────────────────────────────────────────────────────────
client.run(DISCORD_TOKEN)
