import discord
from discord.ext import commands
import time
import aiohttp

intents = discord.Intents.all()
intents.guilds = True
intents.voice_states = True
intents.messages = True

bot = commands.Bot(command_prefix='$', intents=intents)

TOKEN = 'https://deathsmack.com'
URL = "https://deathsmack.com"  # URL to ping

@bot.event
async def on_ready():
    print(f'{bot.user.name} is online and ready.')

@bot.event
async def on_ready():
    print(f'{bot.user.name} is online and ready.')

@bot.command()
async def ping(ctx):
    async with ctx.typing():
        start_time = time.time()
        try:
            async with aiohttp.ClientSession() as session:
                async with session.head('https://deathsmack.com') as response:
                    if response.status == 200:
                        latency = (time.time() - start_time) * 1000
                        await ctx.send(f'Pong! Your ping to ZamRock server: {latency:.2f}ms')
                    else:
                        await ctx.send('Oops! DeathSmack.com seems to be down.')
        except aiohttp.ClientError:
            await ctx.send('Oops! Something went wrong while trying to ping DeathSmack.com.')
            
@bot.command()
async def play(ctx):
    global URL
    voice_channel = bot.get_channel(1234567890)  # Channel ID to connect to
    
    if ctx.voice_client is None:
        await voice_channel.connect()
    
    if URL is None or not bot.voice_clients[0].is_playing():
        voice_client = bot.voice_clients[0]
        voice_client.stop()
        voice_client.play(discord.FFmpegPCMAudio(URL))
        await ctx.send(f'Now playing audio from {URL}')
    else:
        await ctx.send('Bot is currently playing a URL.')

@bot.command()
async def stop(ctx):
    if bot.voice_clients:
        bot.voice_clients[0].stop()
        await ctx.send('Stopped playing audio.')
    else:
        await ctx.send('Bot is not connected to a voice channel.')

@bot.command()
async def test(ctx):
    await ctx.send('Test command received and processed successfully.')

bot.run('https://deathsmack.com')
