import discord
from discord.ext import commands
import time
import aiohttp

intents = discord.Intents.all()
intents.guilds = True
intents.voice_states = True
intents.messages = True

bot = commands.Bot(command_prefix='$', intents=intents)

TOKEN = 'https://deathsmack.com/'
URL = "https://stream.zeno.fm/a10b9oqbgkevv"  # URL to play

@bot.event
async def on_ready():
    print(f'{bot.user.name} is online and ready.')

@bot.event
async def on_message(message):
    if message.author.bot or not message.content.startswith(bot.command_prefix):
        return
    
    await bot.process_commands(message)

@bot.command()
async def ping(ctx):
    start_time = time.time()
    
    async with aiohttp.ClientSession() as session:
        async with session.get("https://deathsmack.com") as response:
            latency = time.time() - start_time
            if response.status == 200:
                await ctx.send(f"Pong! Ping to DeathSmack.com: {latency*1000:.2f}ms")
            else:
                await ctx.send("Oops! DeathSmack.com seems to be down.")
        
@bot.command()
async def play(ctx):
    global URL
    voice_channel = bot.get_channel(1193440450904850502)  # Channel ID to connect to
    
    if ctx.voice_client is None:
        await voice_channel.connect()
    
    if URL is None or not bot.voice_clients[0].is_playing():
        voice_client = bot.voice_clients[0]
        voice_client.stop()
        voice_client.play(discord.FFmpegPCMAudio(URL))
        await ctx.send('Now playing our assortment of mixtapes from [DeathSmack.com](https://deathsmack.com/)')
    else:
        await ctx.send('Bot is currently playing a URL.')

@bot.command()
async def stop(ctx):
    if bot.voice_clients:
        bot.voice_clients[0].stop()
        await ctx.send('Stopped playing.')
    else:
        await ctx.send('Bot is not connected to a voice channel.')

@bot.command()
async def test(ctx):
    await ctx.send('Test command received and processed successfully.')

bot.run('https://deathsmack.com/')
