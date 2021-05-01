const Discord = require('discord.js')
const { executionAsyncResource } = require('async_hooks');
const fetch = require("node-fetch")
const ytdl = require('ytdl-core')
const { YTSearcher } = require('ytsearcher');
const searcher = new YTSearcher({
  key: process.env.YTKEY,
  revealkey: true
});

const client = new Discord.Client()
require('dotenv').config()
const startText='heysoupy'

client.on("ready",() => {
//console.log(`Sup bois!I am ${client.user.tag}'s bot`)
    console.log('Bot dev 5.1 running...')
})


function getQuote() {
    return fetch("https://zenquotes.io/api/random").then(res => {
        return res.json() 
    }).then(data => {
        return data[0]["q"] + " -" + data[0]["a"];

    })
}

client.on("guildCreate", guild => {
  console.log("Joined a new guild: " + guild.name);
})

const queue = new Map();


client.on("guildCreate", guild => {
  console.log("Joined a new guild: " + guild.name);
})
client.on("message",msg => {

    if(msg.author.bot) return;
    var xyz=msg.content

    if(xyz.includes("heysoupy status")) return msg.reply("I am busy da!")
    else if(msg.content=='$inspire') getQuote().then(quote => msg.channel.send(quote))
    if(msg.content=='ping') msg.reply("stop pinging da")


    if(!msg.content.startsWith(startText)) return;
    /* msg.mentions.users.forEach((k,v) => { msg.reply(v + 'is the id') console.log(v)})*/

    const mel = msg.content.slice(startText.length).trim().split(/\s+/g)
    //console.log(mel);
    const com = mel.shift().toLowerCase()
    if(!mel.length)msg.reply("What man")
    //console.log(com);
    const serverQueue = queue.get(msg.guild.id)
    switch(com){
      case 'play':
          execute(msg,serverQueue,mel);
          break;
      case 'stop':
          stop(msg,serverQueue);
          break;
      case 'skip':
          skip(msg,serverQueue);
          break;
      case 'pause':
          pause(serverQueue,msg);
          break;
      case 'resume':
          resume(serverQueue,msg);
    }

    // else msg.channel.send("Ay one proper command you can't type ah");*/  
})
async function execute(msg,serverQueue,mel)
{
  let vc=msg.member.voice.channel
  if(!vc) return msg.reply("Ay join one voice channel da")
  let result = await searcher.search(mel.join(" "),{type: "video"})
  const songInfo = await ytdl.getInfo(result.first.url)
  let songDetails = { 
    title: songInfo.videoDetails.title,
    url: songInfo.videoDetails.video_url,
    views: songInfo.videoDetails.viewCount
  };
  if(!serverQueue) 
  {
    const newQueue = {
      channel: msg.channel,
      vcchannel: vc,
      connection: null,
      songs: [],
      volume: 10,
      playing: true
    }
    queue.set(msg.guild.id,newQueue)
    newQueue.songs.push(songDetails)
    try{
      let check = await vc.join()
      newQueue.connection = check;
      play(msg.guild,newQueue.songs[0])
      //console.log(newQueue.connection)
    }
    catch(err) {
      console.log(err);
      queue.delete(msg.guild.id)
      return msg.channel.send("Ay something happened! Check console for error message...")
    }
  }
  else{
    serverQueue.songs.push(songDetails);
    msg.channel.send(`I added ${songDetails.title} to queue!`)
  }
  msg.channel.send(result.first.url);
  return;
}

function play(guild,song){
  const serverQueue = queue.get(guild.id)
  if(!song)
  {
    serverQueue.vcchannel.leave()
    queue.delete(guild.id);
    return;
  } 
  serverQueue.channel.send(`Now playing ${serverQueue.songs[0].title}`)
  serverQueue.connection.play(ytdl(song.url)).on("finish", () => {serverQueue.songs.shift(); play(guild,serverQueue.songs[0]);} )
}

function stop(msg,serverQueue)
{
  let vc=msg.member.voice.channel
  if(!vc) return msg.reply("Ay join one voice channel da")
  if(!serverQueue) return msg.channel.send("There's ntg playing lol")
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}
function skip(msg,serverQueue)
{
  let vc=msg.member.voice.channel
  if(!vc) return msg.reply("Ay join one voice channel da")
  if(!serverQueue) return msg.reply("There's ntg to skip lol")
  serverQueue.connection.dispatcher.end();
}
function pause(serverQueue,msg)
{
  if(!serverQueue.connection) return msg.reply("Ntg is playing da")
  let vc=msg.member.voice.channel
  if(!vc) return msg.reply("Ay join one voice channel da")
  if(serverQueue.connection.dispatcher.paused) return msg.reply("Its paused only")
  serverQueue.connection.dispatcher.pause();
  msg.channel.send("The song has been paused")
}
function resume(serverQueue,msg)
{
  if(!serverQueue.connection) return msg.reply("Ntg is playing da")
  let vc=msg.member.voice.channel
  if(!vc) return msg.reply("Ay join one voice channel da")
  if(serverQueue.connection.dispatcher.resumed) return msg.reply("Its paused only")
  serverQueue.connection.dispatcher.resume();
  msg.channel.send("The song has been resumed")
}
client.login(process.env.TOKEN)