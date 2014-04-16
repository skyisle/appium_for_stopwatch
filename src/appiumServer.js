var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');

String.prototype.trim = function() {
	    return this.replace(/^\s+|\s+$/g, "");
};

function AppiumServer(port) {
	this.port = port;
	this.autConfig = {};
	console.log(port);
	this.autFile = path.join(__dirname, '../var', this.port.toString());
};

function date() {
	return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
}

function log(tag, message) {
	console.log(date() + ":" + "\t" + tag + "\t" + message.toString().replace(/^\s+|\s+$/g, ""));
}


AppiumServer.prototype.run = function () {
	var _this = this;

	fs.open(this.autFile, 'w', function (err, fd) {
		if (err) {
			console.log(err);
			return;
		} 
		fs.close(fd);
	});
	this.child = spawn('appium', [], {
		//detached : true,
	});

	this.child.on('close', function (code, signal) {
		log('CHILD', signal);
	});

	this.child.stdout.on('data', function (data) {
		log('SERVER', data);
	});

	this.child.stderr.on('data', function (data) {
		var message = data.toString();
		log('SERVER', data);

		if (message.indexOf("desiredCapabilities") >= 0) {
			log('SERVER', message);
			_this.parseAutConfig(message);
		} else if (message.indexOf("am ") >= 0) {
			log('SERVER', message);
			if (_this.autConfig['device'] == "selendroid") {
				if (message.indexOf("am instrument -e main_activity") >= 0) {
					var startTime = new Date();
					_this.setAutStartTime(startTime);
					fs.writeFile(_this.autFile, startTime.getTime(), function (err) {
						log('SERVER', err);
					});
					log('SERVER', startTime.toString() + " " + startTime.getMilliseconds());
				}
			} else {
				if (message.indexOf("am start -S") >= 0) {
					var startTime = new Date();
					_this.setAutStartTime(startTime);
					fs.writeFile(_this.autFile, startTime.getTime(), function (err) {
						log('SERVER', err);
					});
					log('SERVER', startTime.toString() + " " + startTime.getMilliseconds());
				}
			}
		}

	});
}

AppiumServer.prototype.parseAutConfig = function (data) {
	//{"desiredCapabilities":{"device":"selendroid","version":"4.3","app":"/Users/skplanet/Documents/Projects/Nodejs/appium_test_01/com.skmnc.gifticon-1.apk","app-package":"com.skmnc.gifticon","app-activity":".activity.MainActivity","browserName":"firefox","javascriptEnabled":true,"platform":"ANY"}}
	//{"desiredCapabilities":{"device":"Android","version":"4.3","app-package":"kr.co.ulike.tesports","app-activity":".IntroActivity","browserName":"firefox","javascriptEnabled":true,"platform":"ANY"}}
	var pattern = /({.*})/i;
	var matchArr = data.match(pattern);
	var sJson = matchArr[matchArr.length - 1];
	console.log("JSON " + sJson);
	var oJson = JSON.parse(sJson);
	this.autConfig = oJson['desiredCapabilities'];
	console.log(this.autConfig['device']);
}

AppiumServer.prototype.setAutStartTime = function (time) {
	//executing: "/Users/skplanet/adt-bundle-mac-x86_64-20131030/sdk/platform-tools/adb" -s 42f0d51eb3b44fd7 shell "am instrument -e main_activity 'com.skmnc.gifticon.activity.MainActivity' com.skmnc.gifticon.selendroid/io.selendroid.ServerInstrumentation"
	this.autStartTime = time;
}

module.exports = AppiumServer
