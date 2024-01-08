@bot.command(name='play')
async def play(ctx, url: str, text: str):
    # Get the voice channel of your own server
    voice_channel = ctx.author.voice.channel
    voice_client = discord.utils.get(bot.voice_clients, guild=ctx.guild)
  
    if not voice_client:
        await voice_channel.connect()
    else:
        await voice_client.move_to(voice_channel)

    vc = ctx.guild.voice_client

    # Get the voice channel of the other server
    other_guild = bot.get_guild(other_server_id)
    other_voice_channel = bot.get_channel(other_voice_channel_id)

    if other_voice_channel is None:  # Check if the voice channel exists
        await ctx.send("Invalid voice channel ID for the other server.")
        return

    other_voice_client = discord.utils.get(bot.voice_clients, guild=other_guild)

    if not other_voice_client:
        await other_voice_channel.connect()
    else:
        await other_voice_client.move_to(other_voice_channel)

    other_vc = other_guild.voice_client

    if url.startswith('https://zeno.fm/'):
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers)
        html_content = response.text
        soup = BeautifulSoup(html_content, 'html.parser')
        track_name = soup.find("div", class_="nameartist").get_text(strip=True)
        
        await ctx.send(f'Now playing: {track_name}')

        # Play the audio in your own server
        vc.play(discord.FFmpegPCMAudio(url), after=lambda e: print('Done'))
        vc.is_playing()

        # Play the audio in the other server
        other_vc.play(discord.FFmpegPCMAudio(url), after=lambda e: print('Done'))
        other_vc.is_playing()
    else:
        await ctx.send("Invalid Zeno FM URL.")
