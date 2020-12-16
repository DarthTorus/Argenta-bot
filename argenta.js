'use strict'
require("dotenv").config()
const Discord = require("discord.js")
const colors = require("colors/safe")

const client = new Discord.Client()

client.on("ready", () => {
  client.startDate = new Date().toLocaleString('en-US',{hour12: false})

	console.log(colors.brightCyan("Started: ") + colors.brightBlue(client.startDate))
	console.log(colors.brightGreen("Connected!"))
	console.log(colors.brightCyan("Logged in as: ") + colors.brightWhite(client.user.tag) + " - " + colors.brightMagenta(`@${client.user.id}`))
})

client.on("message", message => {
  if(message.content.startsWith(process.env.TRIGGER) && message.author.id != client.user.id) { //Test if the message starts with the command trigger and if the author wasn't the bot
    let tokens = message.content.split(' ')
    let mainCommand = tokens[0].slice(2)
    tokens.shift()
    let args = tokens


    switch(mainCommand) {
      case 'ping':
        message.reply("**Pong!**")
        break;
      case 'draw':
        drawWinner(message)
        break
      case 'start':
        startPoll(message, args)
        break
      case 'reset':
        restNumbers(message, args)
        break;
      case 'pick':
        pickNumbers(message, args)
      default:
        //nothing
    }



  }




})



client.login(process.env.TOKEN)