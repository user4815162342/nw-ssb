#!/usr/local/bin/node

var readline = require('readline');
var path = require('path');
var fs = require('fs');

var spec = {}
var platformOptions = {};

// TODO: Should load any existing settings file first, once we have the
// title, to get defaults from it, so we can use this for editing.
// TODO: Downloading a favicon would be really cool, but I'm not sure 
// how that would work considering some of the URLs one might put in here
// are just login pages.
// TODO: Is there any way to make this driven from the GUI?
// FUTURE: Need to support Mac and Windows.

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var questionQueue = [{
    quest: "Enter Name of Application: ",
    cb: function(answer,cb) {
        if (!answer) {
            return cb("Application name required");
        }
        spec.title = answer;
        cb();
    }
},{
    quest: "Enter URL: ",
    cb: function(answer,cb) {
        if (!answer) {
            return cb("URL required");
        }
        spec.url = answer;
        cb();
    }
},{
    quest: "Enter path to icon (or enter for none): ",
    cb: function(answer,cb) {
        if (answer) {
            spec.icon = answer;
        }
        cb();
    }
},
{
    quest: "Do you wish to use a tray icon? [y/N]: ",
    cb: function(answer,cb) {
        if (["y","yes"].indexOf(answer) > -1) {
            spec["use-tray-icon"] = true;
        }
        questionQueue.push({
            quest: "Do you wish to minimize to the tray? [y/N]: ",
            cb: function(answer,cb) {
                if (["y","yes"].indexOf(answer) > -1) {
                    spec["minimize-to-tray"] = true;
                }
                cb();
            }
        });
        questionQueue.push({
            quest: "Do you wish to start hidden? [Y/n]: ",
            cb: function(answer,cb) {
                if (["n","no"].indexOf(answer) > -1) {
                    spec["start-hidden"] = false;
                }
                cb();
            }
        });
        cb();
    }
},
{
    quest: "Do you wish the close button to minimize the app instead? [y/N]: ",
    cb: function(answer,cb) {
        if (["y","yes"].indexOf(answer) > -1) {
            spec["minimize-on-close"] = true;
        }
        cb();
    }
},
{
    quest: "Do you wish to persist the window appearance between sessions? [Y/n]: ",
    cb: function(answer,cb) {
        if (["n","no"].indexOf(answer) === -1) {
            spec["persist-window-appearance"] = true;
        }
        cb();
    }
}
]


var createApp = function(cb) {
    rl.write("I'm sorry, but automated app generation is not available on this device.\n");
    cb();
}

switch (process.platform) {
    case "linux":
        questionQueue.push({
            quest: "What categories do you want the shortcut to display in? (semi-colon delimited list)",
            cb: function(answer,cb) {
                platformOptions.categories = answer;
                cb();
            }
        });
        createApp = function(cb) {
            var home = process.env.HOME;
            var configPath = path.join(process.env.HOME,".nw-ssb");
            var specPath = path.join(configPath,spec.title + ".json");
            var shortcutPath = path.join(process.env.HOME,".local","share","applications",spec.title + ".desktop");
            var shortcutText = "\n[Desktop Entry]\nVersion=1.0\nType=Application\nName=" + spec.title + "\nComment=\nExec=nw-ssb \"" + specPath + "\"\nIcon=" + spec.icon + "\nPath=\nTerminal=false\nStartupNotify=false\nCategories=" + platformOptions.categories + "\n";
            try {
                if (!fs.existsSync(configPath)) {
                    fs.mkdirSync(configPath);
                }
                rl.write("Writing to " + specPath + "\n");
                fs.writeFileSync(specPath,JSON.stringify(spec,null," "),{ encoding: 'utf8' });
                rl.write("Writing to " + shortcutPath + "\n");
                fs.writeFileSync(shortcutPath,shortcutText,{ encoding: 'utf8' });
            } catch (e) {
                return cb(e);
            }
            cb();
            
        }
        break;
    // FUTURE: Handle other platforms.
}

var done = function(err) {
    if (err) {
        console.error(err);
    }
    rl.close();
}

var run = function(err) {
    if (err) {
        console.error(err);
        done();
    } else if (questionQueue.length) {
        var question = questionQueue.shift();
        rl.question(question.quest,function(answer) {
            question.cb(answer,run);
        });
    } else {
        createApp(done);
    }
}

run();
