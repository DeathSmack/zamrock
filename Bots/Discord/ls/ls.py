import os
import discord
import requests
from dotenv import load_dotenv

# ---------- Load configuration ----------
load_dotenv()
DISCORD_TOKEN   = os.getenv("DISCORD_TOKEN")
OPENWEBUI_URL   = os.getenv("OPENWEBUI_URL")
OPENWEBUI_MODEL = os.getenv("OPENWEBUI_MODEL", "gpt-3.5-turbo")
OPENWEBUI_TOKEN = os.getenv("OPENWEBUI_TOKEN")   # optional

if not DISCORD_TOKEN or not OPENWEBUI_URL:
    raise RuntimeError("DISCORD_TOKEN and OPENWEBUI_URL must be set in .env")

# ---------- Helper: talk to OpenWebUI ----------
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
        return "⚠️ _Could not get a response from the model._"

# ---------- Text‑splitting utilities ----------
MAX_CHUNK = 1990           # leave margin for safety

def chunk_text(text: str, limit: int = MAX_CHUNK) -> list[str]:
    """Yield successive substrings that are <= `limit` characters."""
    return [text[i : i + limit] for i in range(0, len(text), limit)]

async def send_chunks(channel, text: str):
    """Send a long reply in multiple messages if necessary."""
    for chunk in chunk_text(text):
        await channel.send(chunk)

# ---------- Discord bot ----------
intents = discord.Intents.default()
intents.messages = True
intents.message_content = True
client = discord.Client(intents=intents)

@client.event
async def on_ready():
    print(f"Logged in as {client.user} (id: {client.user.id})")
    print("Ready to answer messages!")

@client.event
async def on_message(message):
    # ignore messages from ourselves
    if message.author == client.user:
        return

    # command to show current model
    if message.content.startswith("!model"):
        await message.channel.send(f"Current model: **{OPENWEBUI_MODEL}**")

    print(f"Received message from {message.author}: {message.content}")

    # Simple command: !ask <question>
    if message.content.startswith("!ask "):
        question = message.content[5:].strip()
        if not question:
            await message.channel.send("❗ You need to supply a question after `!ask`.")
            return

        await message.channel.send("🤖 Thinking…")
        answer = query_openwebui(question)
        await send_chunks(message.channel, answer)

# ---------- Run ----------
client.run(DISCORD_TOKEN)
