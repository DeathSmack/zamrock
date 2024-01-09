import discord
from discord.ext import commands
import time
import aiohttp
import asyncio

intents = discord.Intents.all()
intents.guilds = True
intents.voice_states = True
intents.messages = True

bot = commands.Bot(command_prefix='$', intents=intents)

TOKEN = '`'
URL = "https://stream.zeno.fm/a10b9oqbgkevv"

bot.reboot_timer = None

@bot.event
async def on_ready():
    print('ZamRock Radio is online and ready.')

@bot.command()
async def nap(ctx):
    await rejoin(ctx)

@bot.command()
async def ping(ctx):
    start_time = time.time()
    try:
        async with aiohttp.ClientSession() as session:
            async with session.head('https://deathsmack.com/') as response: # URL to ping
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

    # Check if the user is in a voice channel
    if ctx.author.voice is None or ctx.author.voice.channel is None:
        await ctx.send('You are not in a voice channel...')
        return

    # Get the voice channel of the user who invoked the command
    voice_channel = ctx.author.voice.channel
    
    # Connect to the voice channel or move to if already connected to another channel
    voice_client = ctx.voice_client
    if voice_client is None:
        voice_client = await voice_channel.connect()
    elif voice_client.channel != voice_channel:
        await voice_client.move_to(voice_channel)
    
    # Continue with playing the audio if URL is valid
    if URL is None:
        await ctx.send("The URL is not valid.")
    elif not voice_client.is_playing():
        voice_client.stop()
        voice_client.play(discord.FFmpegPCMAudio(URL))
        await ctx.send(f'Now playing audio from [DeathSmack.com](http://deathsmack.com/)')
    else:
        await ctx.send('Bot is already playing audio.')

@bot.command()
async def rejoin(ctx):
    global URL

    # Check if the user is in a voice channel
    if ctx.author.voice is None or ctx.author.voice.channel is None:
        await ctx.send('You are not in a voice channel...')
        return
    
    # Get the voice channel of the user who invoked the command
    voice_channel = ctx.author.voice.channel

    # Trigger a reboot by stopping audio, disconnecting, and rejoining after 5 seconds
    voice_client = ctx.voice_client
    if voice_client is not None:
        voice_client.stop()
        await voice_client.disconnect()
        await ctx.send("Rebooting...")
        await asyncio.sleep(5)
        new_voice_client = await voice_channel.connect()
        new_voice_client.play(discord.FFmpegPCMAudio(URL))
        await asyncio.sleep(5)

@bot.command()
async def stop(ctx):
    if bot.voice_clients:
        bot.voice_clients[0].stop()
        await ctx.send('Stopped playing audio.')
    else:
        await ctx.send('Bot is not connected to a voice channel.')

@bot.command()
async def sleep(ctx):
    if bot.reboot_timer is None:
        bot.reboot_timer = asyncio.create_task(sleep_timer(ctx))
        await ctx.send("Sleep mode activated. Bot will reboot after 3 hours of inactivity.")
    else:
        await ctx.send("Sleep mode is already activated.")

async def sleep_timer(ctx):
    await asyncio.sleep(3 * 60 * 60)  # Wait for 3 hours
    bot.reboot_timer = None
    await rejoin(ctx)

@bot.command()
async def test(ctx):
    await ctx.send('Test command received and processed successfully.')

if __name__ == '__main__':
    bot.run('`')
