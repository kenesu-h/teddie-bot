const http = require("http");
const assert = require("assert");
const Discord = require("discord.js");
const ss = require("string-similarity");

// Constants
const DEPLOYED = true;
const PREFIX = "^";
const MONS = require("./monsters.json");
const EMOJIS = require("./emojis.json");
const ELEMENTS = ["Fire", "Water", "Thunder", "Ice", "Dragon"];
const AILMENTS = ["Poison", "Sleep", "Paralysis", "Blast", "Stun"];

// String.removeSpaces : -> String
// Removes all spaces from this string.
String.prototype.removeSpaces = function() {
    return this.replace(/\s/g, "");
}

// Tests
(function() {
    assert.equal("".removeSpaces(), "");
    assert.equal("Anjanath".removeSpaces(), "Anjanath");
    assert.equal("Fulgur Anjanath".removeSpaces(), "FulgurAnjanath");
})();


// String.normalize : -> String
// Returns a fully lowercase string without spaces
String.prototype.normalize = function() {
    return this.toLowerCase().removeSpaces();
}

// Tests
(function() {
    assert.equal("".normalize(), "");
    assert.equal("Anjanath".normalize(), "anjanath");
    assert.equal("Fulgur Anjanath".normalize(), "fulguranjanath");
})();


// [Array-of X].binarySearch : X [Y Z -> Integer] -> [Union X Boolean]
// Performs a binary search for an element in this sorted array.
// Returns the item if it is found, but returns false otherwise.
Array.prototype.binarySearch = function(elem, func) {
    var len = this.length;
    var mid = Math.floor(len / 2);

    if (len <= 0) {
        return false;
    }
    if (func(elem, this[mid]) == 0) {
        return this[mid];
    }
    if (func(elem, this[mid]) > 0) {
        return this.slice(mid + 1, len).binarySearch(elem, func);
    }
    if (func(elem, this[mid]) < 0) {
        return this.slice(0, mid).binarySearch(elem, func);
    }
}

// Tests
(function() {
    var testStrs = ["Anjanath", "Brachydios"];
    var testInts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    function compareStr(a, b) { return a.localeCompare(b); }
    function compareInt(a, b) {
        if (a < b) { return -1; }
        if (a > b) { return 1; }
        else { return 0 }
    }

    assert.equal([].binarySearch(""), false);
    assert.equal(testStrs.binarySearch("Anjanath", compareStr), "Anjanath");
    assert.equal(testStrs.binarySearch("Zinogre", compareStr), false);
    assert.equal(testInts.binarySearch(1, compareInt), true);
    assert.equal(testInts.binarySearch(0, compareInt), false);
})();


// compareMons : Monster Monster -> Integer
// Returns whether the name of monster A alphabetically goes before the name of monster B.
function compareMons(a, b) {
    return a["Monster"].localeCompare(b["Monster"]);
}

// Tests
(function() {
    var testMons = [
        { "Monster": "Anjanath" },
        { "Monster": "Brachydios" }
    ];

    assert.equal(compareMons(testMons[0], testMons[0]), 0);
    assert.equal(compareMons(testMons[0], testMons[1]), -1);
    assert.equal(compareMons(testMons[1], testMons[0]), 1);
})();


// compareNameToMon : String Monster -> Integer
// Returns whether the name of the monster alphabetically goes before the given name.
function compareNameToMon(a, b) {
    var parsedA = a.normalize();
    var parsedB = b["Monster"].normalize();
    return parsedA.localeCompare(parsedB);
}

// Tests
(function() {
    var testBrachy = { "Monster": "Brachydios" };

    assert.equal(compareNameToMon("Brachydios", testBrachy[0]), 0);
    assert.equal(compareNameToMon("Anjanath", testBrachy[0]), -1);
    assert.equal(compareNameToMon("Zinogre", testBrachy[0]), 1);
})();


// Sort the array of monsters in prep for future binary searches
const SORTED_MONS = MONS.sort(compareMons);

// String.validateMon : -> Monster
// Ensure that the given name is a valid (enough) monster name.
// If so, return the matching monster.
// If that fails, return false.
String.prototype.validateMon = function() {
    return SORTED_MONS.binarySearch(this, compareNameToMon);
}

// Tests
(function() {
    assert.deepEqual("Anjanath".validateMon(), MONS[7]);
    assert.deepEqual("Khezu".validateMon(), false);
})();


// Number.toStars : -> String
// Return this number of star emojis. If given 0, produce an X instead.
Number.prototype.toStars = function() {
    var output = "";

    if (this > 0) {
        for (var i = 0; i < this; i++) {
            output = output + "\u2605";
        }
    } else {
        output = "\u2715";
    }
    return output;
}

// Tests
(function() {
    assert.equal((0).toStars(), "\u2715");
    assert.equal((1).toStars(), "\u2605");
    assert.equal((2).toStars(), "\u2605\u2605");
})();


// String.splitWeakness : -> [Array-of String]
// Splits a varying weakness into an array of two values (one before, one after)
String.prototype.splitWeakness = function() {
    var arr = this.split("(");
    var output = [];

    for (var i = 0; i < arr.length; i++) {
        output.push(arr[i].replace(/[{()}]/g, ""));
    }
    return output;
}

// Tests
assert.deepEqual("".splitWeakness(), [""]);
assert.deepEqual("0(1)".splitWeakness(), ["0", "1"]);
assert.deepEqual("0(2)(4)".splitWeakness(), ["0", "2", "4"]);

// Object.weakToString : -> String
// Return the given weaknesses of this monster into a single string 
Object.prototype.weakToString = function(weak) {
    var output = "";

    for (var i = 0; i < weak.length; i++) {
        var currVal = this[weak[i]];
        if (typeof currVal == "string") {
            var splitVal = currVal.splitWeakness();
            output = output + EMOJIS[weak[i]] + " " + Number(splitVal[0]).toStars() +
                        "(" + Number(splitVal[1]).toStars() + ")" + "\n";
        } else {
            output = output + EMOJIS[weak[i]] + " " + currVal.toStars() + "\n";
        }
    }
    return output;
}

// Tests
assert.equal("Anjanath".validateMon().weakToString(ELEMENTS),
    EMOJIS["Fire"] + " \u2715\n" +
    EMOJIS["Water"] + " \u2605\u2605\u2605\n" +
    EMOJIS["Thunder"] + " \u2605\u2605\n" +
    EMOJIS["Ice"] + " \u2605\u2605\n" +
    EMOJIS["Dragon"] + " \u2605\n");
assert.equal("Fulgur Anjanath".validateMon().weakToString(ELEMENTS),
    EMOJIS["Fire"] + " \u2605\u2605\n" +
    EMOJIS["Water"] + " \u2605\u2605(\u2605\u2605\u2605)\n" +
    EMOJIS["Thunder"] + " \u2715\n" +
    EMOJIS["Ice"] + " \u2605\u2605\u2605(\u2605\u2605)\n" +
    EMOJIS["Dragon"] + " \u2605\n");

// Object.createEmbed : -> RichEmbed
// Creates an embed with the monster's weaknesses and what they inflict. Include notes if they exist.
Object.prototype.createEmbed = function() {
    var embed = new Discord.RichEmbed()
        .setTitle(this["Monster"])
        .setColor(0x9B4937)
        // .setThumbnail(icon)
        .addField("Elements:", this.weakToString(ELEMENTS) + this["Notes"], true)
        .addBlankField(true)
        .addField("Ailments:", this.weakToString(AILMENTS), true);
    if (this["Statuses"]) {
        embed = embed.addField("Inflicts:", this["Statuses"]);
    }
    return embed;
}

// Tests
// Cannot test as the sheer amount of properties a Discord.js RichEmbed has is a ton and depends on the
// bot being online to some extent.
// Consult Discord.js documentation for reference.


// Message.sendMonInfo : String String -> [Union Message RichEmbed]
// Takes in a monster's name and returns information about them depending on what is specified.
Object.prototype.sendMonInfo = function(cmd, name) {
    var msg;

    if (name) {
        var mon = name.validateMon();
        if (mon) {
            if (cmd == "weak") {
                msg = mon.createEmbed();
            }
        } else {
            msg = "Sorry, that monster wasn't found. Please check your spelling and try again.";
        }
    } else {
        msg = "**Syntax:** " + prefix + cmd + " <monster name>";
    }

    this.channel.send(msg);
}

// Tests
// Cannot test as the sheer amount of properties a Discord.js Message has is a ton and depends on the
// bot being online to some extent.
// Consults Discord.js documentation for reference.


/*
// Configuration
const help = [
    ">>> This bot is very much a work in progress and is pretty much intended only for Monster Hunter, so there won't be a ton of commands to play around with.",
    "",
    "**Available Commands:**",
    "_Monster Hunter_",
    "`Please note that these commands only support monsters in World and Iceborne.`",
    ["weak <monster name>", "Displays a given monster's weaknesses as well as the status effects they inflict."],
    "",
    "_Other_",
    ["chili", "Sends a picture of Robert's amazing chili."]
]

// sendHelp : Message -> Message
// DMs all commands and how to use them to the requesting person.
function sendHelp(msg) {
    var appended = "";
    for (var line in help) {
        if (Array.isArray(help[line])) {
            appended = appended + "\\`" + prefix + help[line][0] + "` - " + help[line][1] + "\n";
        } else {
            appended = appended + help[line] + "\n";
        }
    }
    msg.author.send(appended);
}

// appendStatuses : Array -> String
// Append all inflicted statuses into a single string. If there are no statuses, return "none."
function appendStatuses(statuses) {
    var appended = "";
    if (statuses.length === 1) {
        var status = statuses[0];
        appended = appended + elemToEmoji(status) + " " + status;
    } else {
        for (var i = 0; i < statuses.length; i++) {
            var currStatus = statuses[i];
            appended = appended + elemToEmoji(currStatus) + " " + currStatus
            // End the string with a period if on the last status.
            if (i === (statuses.length - 1)) {
                appended = appended + ".";
                // If not, continue the string with a comma.
            } else {
                appended = appended + ", ";
            }
        }
    }
    if (!appended) {
        appended = "None.";
    }
    return appended;
}

*/

// sendChili : Message -> Message
// Send a picture of Robert's amazing chili.
function sendChili(msg) {
    msg.channel.send("https://cdn.glitch.com/45250890-355e-4348-a4de-be859b8ed289%2Fimage0.jpg?v=1577314319341")
        .catch(console.error);
}

// Run the bot ONLY if it is deployed
if (DEPLOYED) {
    const express = require("express");
    const app = express();
    const client = new Discord.Client();

    // Pings the bot every now and then to prevent Glitch from taking it down.
    // Note: Glitch will still automatically disconnect the bot after 12 hours of activity.
    app.get("/", (request, response) => {
        console.log(Date.now() + " Ping Received");
        response.sendStatus(200);
    })

    app.listen(process.env.PORT);
    setInterval(() => {
        http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
    }, 280000)

    // Things to be done when logged into Discord.
    client.on("ready", () => {
        console.log(`Logged into Discord as ${client.user.tag}.`);
        client.user.setActivity(`${prefix}help.`, { type: "LISTENING" });
    });

    // Things to be done for incoming messages.
    client.on("message", async msg => {
        // Ignore messages under the following conditions:
        // - If it is from a bot.
        // - If it doesn't have the prefix.
        if (msg.author.bot || msg.content.indexOf(PREFIX) !== 0) return;

        const args = msg.content.slice(PREFIX.length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();

        // Commands
        if (command === "help") {
            sendHelp(msg);
        }
        if (command === "weak") {
            const arg = args.join(" ");
            sendMonInfo("weak", msg, arg);
        }
        if (command === "chili") {
            sendChili(msg);
        }
    });

    client.login(process.env.TOKEN);
}