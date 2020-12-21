'use strict'
require("dotenv").config()
const Discord = require("discord.js")
const colors = require("colors/safe")
const fs = require('fs')
let numbers = require("./json/numbers.json")
const client = new Discord.Client()


function chooseItem() {
	return random(numbers.length);
}

function random() {
  var min, max, num = 0;
	if (arguments.length == 1) {
		// Between 0 and max
		max = arguments[0];
		min = 0;
	} else if (arguments.length == 2) {
		// between min and max
		min = arguments[0];
		max = arguments[1];
	} else {
		// a decimal between 0 and 1 by default
		return Math.random();
	}

	num = Math.floor(Math.random() * (max - min)) + min;
	return num;
}

/**
 *
 * @param {Discord.Message} message
 */
function drawWinner(message) {
  let newIndex;
  let winner = null
  if(message.author.id != process.env.PRIDARK_ID) {
    message.reply("You are not permitted to draw the winner of the giveaway")
    return false
  } else {
    newIndex;
    winner = null
    while(winner == null) {
      newIndex = chooseItem(numbers)
      if(numbers[newIndex] != null) {
        winner = numbers[newIndex]
      }
    }
  }
  message.channel.send(`Winner is <@${winner}> with the number ${newIndex + 1}`)
}

/**
 *
 * @param {Discord.Message} message
 * @param {Number[]} args
 */
function startGiveaway(message, args) {
  if(message.author.id != process.env.PRIDARK_ID) {
    message.reply("You are not permitted to start the giveaway")
    return false
  } else {
    let upperVal = 100
    if(args.length == 1) {
      upperVal = parseInt(args[0])
    }
    for(var i = numbers.length; i < upperVal; i++) {
      numbers.push(null)
    }
    fs.writeFileSync('./json/numbers.json', JSON.stringify(numbers, null, ' '));
    message.channel.send(`Giveaway started. Please pick a number from 1 to ${upperVal}. Patron members can pick **2** numbers. Non-patrons can pick **1** number. No duplicates allowed.`)
  }
}

/**
 *
 * @param {Discord.Message} message
 */
function resetNumbers(message) {
  if(message.author.id != process.env.PRIDARK_ID) {
    message.reply("You are not permitted to reset the giveaway")
    return false
  } else {
    numbers = []
    fs.writeFileSync('./json/numbers.json', JSON.stringify(numbers, null, ' '));
  }
}

/**
 * @param {Discord.Message} message
 * @returns {Boolean}
 */
function isPatron(message) {
  console.log("In ");
  let isPatronFlag = false;
  if ( message.member.roles.cache.has("693838539871486033") || message.member.roles.cache.has("541112658519261184") ) {
    isPatronFlag = false
  } else {
    isPatronFlag = true;
  }

  return isPatronFlag
}

/**
 *
 * @param {Discord.Message} message
 * @param {Number} maxPicks
 */
function hasNotPicked(message, maxPicks) {
  let hasNotPickedFlag = true
  let pickedCount = 0
  for(var p = 0; p < numbers.length; p++) {
    if(numbers[p] == message.author.id) {
      pickedCount += 1
    }
    if(pickedCount == maxPicks) {
      hasNotPickedFlag = false
    } else {
      hasNotPickedFlag = true
    }
  }

  return hasNotPickedFlag
}

function checkInputs(message, args, isPatron) {
  let validInput = true
  console.log(`Args length: ${args.length}`);
  if(isPatron) { // Is the user a Patron
    if(args.length == 0) { // Patrons have 2 numbers to pick, they picked none
      validInput = false
      message.reply("Please pick 2 numbers")
    }
    else if (args.length == 1) { // Patron has picked a number
      if(hasNotPicked(message, 2)) { //Does this number put them at 2?
        validInput = true
      }
      else { //They have one more number
        message.reply("You can select one more number")
        validInput = true
      }
    }
    else if(args.length == 2) { // They have selected 2 numbers
      if(hasNotPicked(message, 1)) { // Would 2 numbers put them over their max?
        // Hadn't picked yet
        validInput = true
      }
      else {
        //Over max
        message.reply("You picked one number too many. Please pick only 1 more number.")
        validInput = false
      }
    }
  }

  else { // Npnpatrons can only pick 1 number
    if(args.length == 0) {
      validInput = false
      message.reply("Please pick 1 number")
    }
    else if (args.length == 1) {
      validInput = true
    }
    else if (args.length > 1) {
      validInput = false
      message.reply("You have picked too many numbers. Please pick only 1")
    }
  }

  return validInput
}

/**
 *
 * @param {Number} pick
 * @param {Discord.Message} message
 */
function inRange(pick, message) {
  if(pick > numbers.length) {
    message.channel.send(`Number must be between 1 and ${numbers.length}`)
    return false
  }

  return true
}

function recordPicks(pickedNumber, message) {
  if(numbers[pickedNumber-1] != null) {
    message.channel.send(`${pickedNumber} has already been chosen by ${client.users.get(numbers[pickedNumber-1]). username}`)
  } else {
    numbers[pickedNumber-1] = message.author.id
    message.channel.send(`${pickedNumber} has been picked by ${message.author.username}`)
  }
}


function pickNumbers(message, args) {
  let firstNumber = parseInt(args[0])
  let secondNumber = parseInt(args[1])
  console.log(secondNumber)
  if(numbers.length == 0) {
    message.channel.send("I'm sorry, there is currently no giveaway going on right now")
    return false
  }
  if(message.author.id != process.env.PRIDARK_ID) {
    // Check roles
    let patronFlag = isPatron(message)
    if (patronFlag) { // author is a Patron
      console.log(`Patron? ${patronFlag}`);
      if(hasNotPicked(message, 2)) { // They haven't picked yet
        console.log("Hasn't picked yet");
        if(checkInputs(message, args, patronFlag)) { // inputs are good
          console.log("Inputs have passed");
          // Inputs are good
          if(inRange(firstNumber, message)) {
            recordPicks(firstNumber, message)
          }
          if(!isNaN(secondNumber) && inRange(secondNumber, message)) {
            recordPicks(secondNumber, message)
          }
        }
      } else {
        let pickedNumbers = []
        for(let i = 0; i < numbers.length; i++) {
          if(numbers[i] == message.author.id) {
            pickedNumbers.push(i+1)
          }
        }
        message.reply(`You have already picked numbers ${pickedNumbers.join(" and ")} in this giveaway`)
      }
    } else { // Author is not a patron
      console.log(`Patron? ${patronFlag}`);
      if(hasNotPicked(message, 1)) { // They haven't picked yet
        if(checkInputs(message, args, patronFlag)) {
          //inputs are good
          if(inRange(firstNumber)) {
            recordPicks(firstNumber, message)
          }
        }
      } else {
        let picked = 0
        for(let i = 0; i < numbers.length; i++) {
          if(numbers[i] == message.author.id) {
            picked = i+1
          }
        }
        message.reply(`You have already picked number ${picked} in this giveaway`)
      }
    }

  } else {
    message.reply("The creator shouldn't enter their own contest. That would be unfair!")
  }
  fs.writeFileSync('./json/numbers.json', JSON.stringify(numbers, null, ' '));
}

function sendHelp(message) {
  message.channel.send("**Trigger**: `pri!`\n**Commands Pridark can use:**\n─ `draw`: draws the winner of the giveaway.\n─ `reset`: resets the giveaway.\n─ `start [x]`: starts the giveaway given an optional number to end at. Example: `pri!start 200` makes it go from 1 to 200\n**Contestant Commands:**\n─ `pick m [n]`: Nonpatrons can pick 1 number, while patrons can pick 2\n─ `view`: Views all remaining numbers in the current giveaway list\n**Global Commands**\n─ `ping`: Pings the bot\n─ `help`: Send this help")

}

/**
 *
 * @param {Discord.Message} message
 */
function viewRemainingNumbers(message) {
  let remaining = []
  for(var i = 0; i < numbers.length; i++) {
    if(numbers[i] == null) {
      remaining.push(i+1)
    }
  }
  if(remaining.length == 0) {
    message.channel.send(`No numbers remain!`)
  } else {
    message.channel.send(`Remaining numbers are: \`${remaining.join(', ')}\``)
  }
}



client.on("ready", () => {
  client.startDate = new Date().toLocaleString('en-US',{hour12: false})

	console.log(colors.brightCyan("Started: ") + colors.brightBlue(client.startDate))
	console.log(colors.brightGreen("Connected!"))
	console.log(colors.brightCyan("Logged in as: ") + colors.brightWhite(client.user.tag) + " - " + colors.brightMagenta(`@${client.user.id}`))
})


client.on("message", message => {
  if(message.content.startsWith(process.env.TRIGGER) && message.author.id != client.user.id) { //Test if the message starts with the command trigger and if the author wasn't the bot
      if(message.channel.id == process.env.CHANNEL_ID) {
      let tokens = message.content.split(' ')
      let mainCommand = tokens[0].slice(process.env.TRIGGER.length)
      tokens.shift()
      let args = tokens
      console.log(`Command: ${mainCommand}; Arguments: ${args}`)

      switch(mainCommand) {
        case 'ping':
          message.reply("**Pong!**")
          break
        case 'draw':
          drawWinner(message)
          break
        case 'start':
          startGiveaway(message, args)
          break
        case 'reset':
          resetNumbers(message)
          break
        case 'pick':
          pickNumbers(message, args)
          break
        case 'help':
          sendHelp(message)
          break
        case 'view':
          viewRemainingNumbers(message)
          break
        default:
          //nothing
      }
    } else {
      message.channel.send(`You aren't in the correct channel. Please try <#${process.env.CHANNEL_ID}>`)
    }
  }

})



client.login(process.env.TOKEN)