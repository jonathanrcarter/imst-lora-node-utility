var fs = require('fs');
var events = require('events');
var eventEmitter = new events.EventEmitter();
eventEmitter.setMaxListeners(2000);

var serialPort = require("serialport");
var SerialPort = require("serialport").SerialPort;

var CLI = require('clui'),
    clc = require('cli-color'),
    Spinner = CLI.Spinner,
    Progress = CLI.Progress;

var Line        = CLI.Line,
    LineBuffer  = CLI.LineBuffer;

const CRC16_INIT_VALUE = 0xFFFF //!< initial value for CRC algorithm
const CRC16_GOOD_VALUE = 0x0F47 //!< constant compare value for check
const CRC16_POLYNOM = 0x8408 //!< 16-BIT CRC CCITT POLYNOM


// LORA CONSTANTS
const DEVMGMT_ID = 0x01;
const LORAWAN_ID = 0x10;

const DEVMGMT_MSG_PING_REQ = 0x01;
const DEVMGMT_MSG_PING_RSP = 0x02;
const DEVMGMT_MSG_GET_DEVICE_INFO_REQ = 0x03;
const DEVMGMT_MSG_GET_DEVICE_INFO_RSP = 0x04;
const DEVMGMT_MSG_GET_FW_INFO_REQ = 0x05;
const DEVMGMT_MSG_GET_FW_INFO_RSP = 0x06;
const DEVMGMT_MSG_RESET_REQ = 0x07;
const DEVMGMT_MSG_RESET_RSP = 0x08;
const DEVMGMT_MSG_SET_OPMODE_REQ = 0x09;
const DEVMGMT_MSG_SET_OPMODE_RSP = 0x0A;
const DEVMGMT_MSG_GET_OPMODE_REQ = 0x0B;
const DEVMGMT_MSG_GET_OPMODE_RSP = 0x0C;
const DEVMGMT_MSG_SET_RTC_REQ = 0x0D;
const DEVMGMT_MSG_SET_RTC_RSP = 0x0E;
const DEVMGMT_MSG_GET_RTC_REQ = 0x0F;
const DEVMGMT_MSG_GET_RTC_RSP = 0x10;

const DEVMGMT_STATUS_OK = 0x00;                //Operation successful;
const DEVMGMT_STATUS_ERROR = 0x01;             //Operation failed;
const DEVMGMT_STATUS_CMD_NOT_SUPPORTED = 0x02; //Command is not supported;
const DEVMGMT_STATUS_WRONG_PARAMETER = 0x03;

const LORAWAN_MSG_ACTIVATE_DEVICE_REQ = 0x01;
const LORAWAN_MSG_ACTIVATE_DEVICE_RSP = 0x02;
const LORAWAN_MSG_GET_ACT_PARAMS_REQ = 0x03;
const LORAWAN_MSG_GET_ACT_PARAMS_RSP = 0x04;
const LORAWAN_MSG_SET_JOIN_PARAM_REQ = 0x05;
const LORAWAN_MSG_SET_JOIN_PARAM_RSP = 0x06;
const LORAWAN_MSG_GET_JOIN_PARAM_REQ = 0x07;
const LORAWAN_MSG_GET_JOIN_PARAM_RSP = 0x08;
const LORAWAN_MSG_JOIN_NETWORK_REQ = 0x09;
const LORAWAN_MSG_JOIN_NETWORK_RSP = 0x0A;
const LORAWAN_MSG_JOIN_NETWORK_TX_IND = 0x0B;
const LORAWAN_MSG_JOIN_NETWORK_IND = 0x0C;
const LORAWAN_MSG_SEND_UDATA_REQ = 0x0D;
const LORAWAN_MSG_SEND_UDATA_RSP = 0x0E;
const LORAWAN_MSG_SEND_UDATA_TX_IND = 0x0F;
const LORAWAN_MSG_RECV_UDATA_IND = 0x10;
const LORAWAN_MSG_SEND_CDATA_REQ = 0x11;
const LORAWAN_MSG_SEND_CDATA_RSP = 0x12;
const LORAWAN_MSG_SEND_CDATA_TX_IND = 0x13;
const LORAWAN_MSG_RECV_CDATA_IND = 0x14;
const LORAWAN_MSG_RECV_ACK_IND = 0x15;
const LORAWAN_MSG_RECV_NO_ACK = 0x16;
const LORAWAN_MSG_SET_RSTACK_CONFIG_REQ = 0x19;
const LORAWAN_MSG_SET_RSTACK_CONFIG_RSP = 0x1A;
const LORAWAN_MSG_GET_RSTACK_CONFIG_REQ = 0x1B;
const LORAWAN_MSG_GET_RSTACK_CONFIG_RSP = 0x1C;
const LORAWAN_MSG_DEACTIVATE_DEVICE_REQ = 0x21;
const LORAWAN_MSG_DEACTIVATE_DEVICE_RSP = 0x22;
const LORAWAN_MSG_FACTORY_RESET_REQ = 0x23;
const LORAWAN_MSG_FACTORY_RESET_RSP = 0x24;
const LORAWAN_MSG_SET_DEVICE_EUI_REQ = 0x25;
const LORAWAN_MSG_SET_DEVICE_EUI_RSP = 0x26;
const LORAWAN_MSG_GET_DEVICE_EUI_REQ = 0x27;
const LORAWAN_MSG_GET_DEVICE_EUI_RSP = 0x28;
const LORAWAN_MSG_GET_NWK_STATUS_REQ = 0x29;
const LORAWAN_MSG_GET_NWK_STATUS_RSP = 0x2A;

const LORAWAN_STATUS_OK = 0x00;                      //Operation successful;
const LORAWAN_STATUS_ERROR = 0x01;                   //Operation failed;
const LORAWAN_STATUS_CMD_NOT_SUPPORTED = 0x02;       //Command is not supported;
const LORAWAN_STATUS_WRONG_PARAMETER = 0x03;         //HCI message contains wrong parameter;
const LORAWAN_STATUS_WRONG_DEVICE_MODE = 0x04;       //Stack is running in a wrong mode;
const LORAWAN_STATUS_DEVICE_NOT_ACTIVATED = 0x05;    //Device is not activated;
const LORAWAN_STATUS_DEVICE_BUSY = 0x06;             //Device is busy, command rejected;
const LORAWAN_STATUS_QUEUE_FULL = 0x07;              //Message queue is full, command rejected;
const LORAWAN_STATUS_LENGTH_ERROR = 0x08;            //HCI message length is invalid;
const LORAWAN_STATUS_NO_FACTORY_SETTINGS = 0x09;     //Factory Settings EEPROM block missing;

const LORA_CHANNEL_0 = 0; // 868 100 000 Hz;
const LORA_CHANNEL_1 = 1; // 868 300 000 Hz;
const LORA_CHANNEL_2 = 2; // 868 500 000 Hz;
const LORA_CHANNEL_3 = 3; // 868 850 000 Hz;
const LORA_CHANNEL_4 = 4; // 869 050 000 Hz;
const LORA_CHANNEL_5 = 5; // 869 525 000 Hz;

const LORA_RATE_0 = 0; // LoRa / SF12 125 kHz 250;
const LORA_RATE_1 = 1; // LoRa / SF11 125 kHz 440;
const LORA_RATE_2 = 2; // LoRa / SF10 125 kHz 980;
const LORA_RATE_3 = 3; // LoRa / SF9 125 kHz 1760;
const LORA_RATE_4 = 4; // LoRa / SF8 125 kHz 3125;
const LORA_RATE_5 = 5; // LoRa / SF7 125 kHz 5470;
const LORA_RATE_6 = 6; // LoRa / SF7 250 kHz 11000;
const LORA_RATE_7 = 7; // FSK / 50kbps 50000;

const LORA_MODE_0 = 0; //Standard Application Mode / Default Mode;
const LORA_MODE_1 = 1; // Reserved;
const LORA_MODE_2 = 2; // Reserved;
const LORA_MODE_3 = 3; // Customer Mode;



var cmd =  (process.argv.length > 2) ? process.argv[2] : "";


/*
	read the sessuion file .imst.session to find any information therein
	*/

var session_file_exists = fs.existsSync("./.imst.session");
if (session_file_exists == true) {
	var session_vars = fs.readFileSync("./.imst.session","utf8").toString();
	try {
		var session_obj = JSON.parse(session_vars);
	} catch (E) {
		var session_obj = {};
	}
} else {
	var session_obj = {};
}

/* replace any missin parameters */
if (!session_obj.baud) session_obj.baud = "115200";
if (!session_obj.log) session_obj.log = "info";


/* 
	write the current session_obj to the .imst.session file 
	*/
function write_session_file() {
	fs.writeFileSync("./.imst.session", JSON.stringify(session_obj), "utf8");
}


/*
	process the commands 
	*/

if (cmd == "") {
	console.log("HELP");
	console.log("commands");

	console.log("* set the port / baud *");
	console.log("	imst ports ")
	console.log("	imst set port /dev/cu.usbserial-A702JTS6");
	console.log("	imst set baud 115200")
	console.log("	imst set log info")
	console.log(" ");
	console.log("* working with the imst *");
	console.log("	imst ping");
	console.log("	imst get info|firmware|status|rtc|mode");
	console.log("	imst factoryreset");
	console.log(" ");
	console.log("	ABP");
	console.log(" ");
	console.log("	imst get activation");
	console.log("	imst deactivate");
	console.log("	imst activation status");
	console.log(" ");
	console.log("	ADDRESS");
	console.log(" ");
	console.log("	imst get address");
	console.log("	imst set mode 3");
	console.log("	imst set address [6969010101010101]");
	console.log("	imst set mode 1");
	console.log(" ");
	console.log("	OTAA");
	console.log(" ");
	console.log("	imst get join");
	console.log("	imst set join [0102030405060708] [01020304050607080910111213141516]");
	console.log("	imst join ");
	console.log(" ");
	console.log("	SEND DATA");
	console.log(" ");
	console.log("	imst sendc [ confirmed message]");
	console.log("	imst sendu [ un-confirmed message]");
	console.log(" ");
	console.log("	RECEIVE DATA");
	console.log(" ");
	console.log("	imst read ");
	console.log("	imst watch ");
	console.log(" ");
} 

if (cmd == "sp") {
	var port =  (process.argv.length > 3) ? process.argv[3] : "";
	var speed =  (process.argv.length > 4) ? process.argv[4] : "";
	var msg =  (process.argv.length > 5) ? process.argv[5] : "";
	if (port == "" || msg == "") {
		console.log ("syntax sc [port] [speed] [message]")
	}
	send(port,speed, msg);

}
if (cmd == "set") {
	var cmd2 =  (process.argv.length > 3) ? process.argv[3] : "";
	if (cmd2 == "port") {
		var port =  (process.argv.length > 4) ? process.argv[4] : "";
			session_obj.port = port;
			write_session_file();
	}
	if (cmd2 == "baud") {
		var baud =  (process.argv.length > 4) ? process.argv[4] : "";
			session_obj.baud = baud;
			write_session_file();
	}
	if (cmd2 == "log") {
		var log =  (process.argv.length > 4) ? process.argv[4] : "";
			session_obj.log = log;
			write_session_file();
	}
}


if (cmd == "get") {
	var cmd2 =  (process.argv.length > 3) ? process.argv[3] : "";
	if (cmd2 == "info") {
		var packet = makeLoraPacket(DEVMGMT_ID,DEVMGMT_MSG_GET_DEVICE_INFO_REQ,"");
		send(session_obj.port,session_obj.baud, packet, 45, function(text,data) {
			// console.log("got text",text," got data",data);
			var type = data[4];						// 1 digit
			var dev_addr = data.slice(5,9);			// 4 digit device address
			var dev_id = data.slice(9,13);			// 4 digit device id
			var type_desc = "";
			if (type == 0x90) type_desc = "iM880A (obsolete)";
			if (type == 0x92) type_desc = "iM880A-L (128k)";
			if (type == 0x93) type_desc = "iU880A (128k)";
			if (type == 0x98) type_desc = "iM880B-L";

			console.log("");
			console.log("IMST DEVICE INFO");
			console.log("");
			console.log("	type 		: 0x"+type.toString(16));
			console.log("");
			console.log("	name		: "+type_desc);
			console.log("");
			console.log("	device addr 	: "+hex(dev_addr));
			console.log("");
			console.log("	device id 	: "+hex(dev_id));
			console.log("");


		});
	}

	if (cmd2 == "firmware") {
		var packet = makeLoraPacket(DEVMGMT_ID,DEVMGMT_MSG_GET_FW_INFO_REQ,"");
		send(session_obj.port,session_obj.baud, packet, 45, function(text,data) {
			// console.log("got text",text," got data",data);
			var minor = data[4];						// 1 digit
			var major = data[5];						// 1 digit

			var count = data.slice(6,8);				// 2 digit device address
			var date = data.slice(8,18);				// 10 digit device id
			var desc = data.slice(18,data.length-3);	// rest of the string

			console.log("");
			console.log("IMST DEVICE FIRMWARE INFO");
			console.log("");
			console.log("	version 	: "+major.toString()+"."+minor.toString());
			console.log("");
			console.log("	counter 	: "+hex(count));
			console.log("");
			console.log("	date  		: "+date.toString());
			console.log("");
			console.log("	name		: "+desc.toString());
			console.log("");


		});
	}
	if (cmd2 == "status") {
		var packet = makeLoraPacket(DEVMGMT_ID,DEVMGMT_MSG_GET_DEVICE_STATUS_REQ,"");
		send(session_obj.port,session_obj.baud, packet, 45, function(text,data) {
			console.log("got text",text," got data",data);
		});
	}

	if (cmd2 == "rtc") {
		var packet = makeLoraPacket(DEVMGMT_ID,DEVMGMT_MSG_GET_RTC_REQ,"");
		send(session_obj.port,session_obj.baud, packet, 45, function(text,data) {
			console.log("got text",text," got data",data);
		});
	}
	if (cmd2 == "mode") {
		var packet = makeLoraPacket(DEVMGMT_ID,DEVMGMT_MSG_GET_OPMODE_REQ,"");
		send(session_obj.port,session_obj.baud, packet, 45, function(text,data) {
			// console.log("got text",text," got data",data);
			var mode = data[4];						// 1 digit

			var mode_dec = "";
			if (mode == 0) mode_desc = "Application Mode";
			if (mode == 3) mode_desc = "Customer Mode";

			console.log("");
			console.log("IMST DEVICE OPERATION MODE");
			console.log("");
			console.log("	mode 	: "+mode.toString() + " - " +mode_desc);
			console.log("");
		});
	}
	if (cmd2 == "address") {
		var packet = makeLoraPacket(LORAWAN_ID,LORAWAN_MSG_GET_DEVICE_EUI_REQ,"");
		send(session_obj.port,session_obj.baud, packet, 45, function(text,data) {
			// console.log("got text",text," got data",data);

			var dev_addr = data.slice(4,12);				// 64 bit (4 byte) deviceid
			console.log("");
			console.log("IMST DEVICE EUI ");
			console.log("");
			console.log("	EUI 	: "+hex(dev_addr));
			console.log("");
		});
	}


	if (cmd2 == "activation") {
		var packet = makeLoraPacket(LORAWAN_ID,LORAWAN_MSG_GET_ACT_PARAMS_REQ,"");
		send(session_obj.port,session_obj.baud, packet, 45, function(text,data) {
			console.log("got text",text," got data",data);

			var dev_addr = data.slice(4,8);				// 32 bit (4 byte) deviceid
			var net_ses_key = data.slice(8,24);			// 128 bit (16 byte)
			var app_ses_key = data.slice(24,40);		// 128 bit (16 byte)

			console.log("");
			console.log("IMST ACTIVATION PARAMETERS");
			console.log("");
			console.log("	device id 		: "+hex(dev_addr));
			console.log("");
			console.log("	net ses key		: "+hex(net_ses_key));
			console.log("");
			console.log("	app ses key  		: "+hex(app_ses_key));
			console.log("");

		});
	}

	if (cmd2 == "join") {
		var cmd3 =  (process.argv.length > 4) ? process.argv[4] : "";
		if (cmd3 == "status") {
			// var packet = makeLoraPacket(LORAWAN_ID,LORAWAN_MSG_JOIN_NETWORK_IND,"");
			// send(session_obj.port,session_obj.baud, packet, 45, function(text,data) {
			// 	console.log("got text",text," got data",data);

			// 	var status = data[4]						// 1 byte
			// 	var newDeviceAddress = data.slice(5,9);		// 32 bit (4 byte)

			// 	var status_description = "Error - device not activated";
			// 	if (status == 0) status_description = " device successfully activated";
			// 	if (status == 1) status_description = " device successfully activated + Rx Channel Info attached";

			// 	console.log("");
			// 	console.log("IMST JOIN PARAMETERS");
			// 	console.log("");
			// 	console.log("	status 			: ",status);
			// 	console.log("");
			// 	console.log("	new device addr	: "+hex(newDeviceAddress));
			// 	console.log("");

			// });

		} else {

			var packet = makeLoraPacket(LORAWAN_ID,LORAWAN_MSG_GET_JOIN_PARAM_REQ,"");
			send(session_obj.port,session_obj.baud, packet, 45, function(text,data) {
				console.log("got text",text," got data",data);

				var AppEUI = data.slice(4,12);				// 64 bit (8 byte)
				var device_key = data.slice(12,28);			// 128 bit (16 byte)

				console.log("");
				console.log("IMST JOIN PARAMETERS");
				console.log("");
				console.log("	AppEUI 			: "+hex(AppEUI));
				console.log("");
				console.log("	device key		: "+hex(device_key));
				console.log("");

			});
		}
	}
}


if (cmd == "set") {
	var cmd2 =  (process.argv.length > 3) ? process.argv[3] : "";
	if (cmd2 == "mode") {

		var mode =  (process.argv.length > 4) ? process.argv[4] : "";
		if (mode == "application") mode = 0;
		if (mode == "customer") mode = 3;
		if (mode == "0") mode = 0;
		if (mode == "3") mode = 3;

		if (mode === 0 || mode == 3) {

			var msg = new Buffer([mode]).toString();

			var packet = makeLoraPacket(DEVMGMT_ID,DEVMGMT_MSG_SET_OPMODE_REQ,msg);
			send(session_obj.port,session_obj.baud, packet, 45, function(text,data) {
//				console.log("got text",text," got data",data);
			});
		}
	}

	if (cmd2 == "join") {

		var appeui =  (process.argv.length > 4) ? process.argv[4] : "";
		var devkey =  (process.argv.length > 5) ? process.argv[5] : "";
		if (appeui != "" && devkey != "") {

			var msg = new Buffer(24);
			var ptr = 0;
			for (var i=0; i < 8; i++) {
				msg[ptr++] = parseInt(appeui.substring(i*2,i*2+2),16);
			}
			for (var i=0; i < 16; i++) {
				msg[ptr++] = parseInt(devkey.substring(i*2,i*2+2),16);
			}

			var packet = makeLoraPacket(LORAWAN_ID,LORAWAN_MSG_SET_JOIN_PARAM_REQ,msg);
			send(session_obj.port,session_obj.baud, packet, 45, function(text,data) {
				// console.log("got text",text," got data",data);
			});
		}


	}

	if (cmd2 == "address") {

		var eui =  (process.argv.length > 4) ? process.argv[4] : "";
		if (eui != "") {

			var msg = new Buffer(8);
			var ptr = 0;
			for (var i=0; i < 8; i++) {
				msg[ptr++] = parseInt(eui.substring(i*2,i*2+2),16);
			}

			var packet = makeLoraPacket(LORAWAN_ID,LORAWAN_MSG_SET_DEVICE_EUI_REQ,msg);
			send(session_obj.port,session_obj.baud, packet, 45, function(text,data) {
				console.log("got text",text," got data",data);
			});
		}


	}


}

if (cmd == "read" || cmd == "watch") {
	read(session_obj.port,session_obj.baud, function(text,data) {
		console.log("got text",text," got data",data);
		var typ = data[1];
		var msgid = data[2];
		if (msgid == 0x16) {
			console.log ("RX timeout");
		}
		if (msgid == LORAWAN_MSG_JOIN_NETWORK_TX_IND) {
			console.log ("LORAWAN JOIN NETWORK TX IND");
			var status = data[4]						// 1 byte

			var status_description = "Error -packet not sent (err:"+status+")";
			if (status == 0) status_description = " radio packet sent";
			if (status == 1) status_description = " radio packet sent, Tx";

			console.log("");
			console.log("IMST JOIN PARAMETERS");
			console.log("");
			console.log("	status 			: ",status_description);
			console.log("");


		}
		if (msgid == LORAWAN_MSG_JOIN_NETWORK_IND) {
			console.log ("LORAWAN JOIN NETWORK IND");
				var status = data[4]						// 1 byte
				var newDeviceAddress = data.slice(5,9);		// 32 bit (4 byte)

				var status_description = "Error - device not activated (err:"+status+")";
				if (status == 0) status_description = " device successfully activated";
				if (status == 1) status_description = " device successfully activated + Rx Channel Info attached";

				console.log("");
				console.log("IMST JOIN PARAMETERS");
				console.log("");
				console.log("	status 			: ",status_description);
				console.log("");
				console.log("	new device addr	: "+hex(newDeviceAddress));
				console.log("");

		}
	});
}
if (cmd == "ping") {
	var packet = makeLoraPacket(DEVMGMT_ID,DEVMGMT_MSG_PING_REQ,"");
	send(session_obj.port,session_obj.baud, packet, 45);

}
if (cmd == "sendu") {

	var msg =  (process.argv.length > 3) ? process.argv[3] : "";
	if (msg == "") {
		console.log ("syntax send [msg]")
	}

	msg = new Buffer(msg)

	var chanel = new Buffer([0x01]);
	var msgBuffer = new Buffer(msg);
	msg = Buffer.concat([chanel,msgBuffer]);


	var packet = makeLoraPacket(LORAWAN_ID,LORAWAN_MSG_SEND_UDATA_REQ,msg);

	send(session_obj.port,session_obj.baud, packet, 45, function(text,data) {
		// console.log("got text",text," got data",data);

		var status = data[4];

		console.log("");
		console.log("IMST SET UN-CONFIRMED DATA");
		console.log("");
		console.log("	status 			: "+interpret_lora_status(status));
		console.log("");
	});

}

if (cmd == "sendc") {

	var msg =  (process.argv.length > 3) ? process.argv[3] : "";
	if (msg == "") {
		console.log ("syntax send [msg]")
	}

	msg = new Buffer(msg)

	var chanel = new Buffer([0x01]);
	var msgBuffer = new Buffer(msg);
	msg = Buffer.concat([chanel,msgBuffer]);


	var packet = makeLoraPacket(LORAWAN_ID,LORAWAN_MSG_SEND_CDATA_REQ,msg);

	send(session_obj.port,session_obj.baud, packet, 45, function(text,data) {
		// console.log("got text",text," got data",data);

		var status = data[4];

		console.log("");
		console.log("IMST SET CONFIRMED DATA");
		console.log("");
		console.log("	status 			: "+interpret_lora_status(status));
		console.log("");

	});

}

if (cmd == "join") {
	var packet = makeLoraPacket(LORAWAN_ID,LORAWAN_MSG_JOIN_NETWORK_REQ,"");
	send(session_obj.port,session_obj.baud, packet, 45,function(text,data) {
		console.log("got text",text," got data",data);
	});

}
if (cmd == "deactivate") {
	var packet = makeLoraPacket(LORAWAN_ID,LORAWAN_MSG_DEACTIVATE_DEVICE_REQ,"");
	send(session_obj.port,session_obj.baud, packet, 45,function(text,data) {
		console.log("got text",text," got data",data);
	});

}
if (cmd == "activation") {
	var cmd2 =  (process.argv.length > 3) ? process.argv[3] : "";
	if (cmd2 == "status") {
		var packet = makeLoraPacket(LORAWAN_ID,LORAWAN_MSG_GET_NWK_STATUS_REQ,"");
		send(session_obj.port,session_obj.baud, packet, 45,function(text,data) {
			// console.log("got text",text," got data",data);

			var status = data[4];				// 1 byte
			var status_description = "";
			if (status == 0) status_description = "device inactive";
			if (status == 1) status_description = "active (ABP)";
			if (status == 2) status_description = "active (OTA)";

			console.log("");
			console.log("IMST ACTIVATION STATUS");
			console.log("");
			console.log("	status 			: "+status_description);
			console.log("");

		});
	}
}


if (cmd == "factoryreset") {
	var packet = makeLoraPacket(LORAWAN_ID,LORAWAN_MSG_FACTORY_RESET_REQ,"");
	send(session_obj.port,session_obj.baud, packet, 45,function(text,data) {
				 console.log("got text",text," got data",data);
			});

}

if (cmd == "su") {
	var dst =  (process.argv.length > 3) ? process.argv[3] : "";
	var msgid =  (process.argv.length > 4) ? process.argv[4] : "";
	var msg =  (process.argv.length > 5) ? process.argv[5] : "";
	if (msg == "") {
		console.log ("syntax sc [dst] [msgid] [msg]")
	}

	var packet = makeLoraPacket(dst,msgid,msg);

	send(session_obj.port,session_obj.baud, packet, 45);

}
if (cmd == "ports") {
	var Ports = [];
	var getPorts = function() {
		serialPort.list(function (err, ports) {
			Ports = ports;
			for (var i in ports) {
				console.log(ports[i].comName);
			}
		});
	}
	getPorts();

}

function hex(buf) {
	var retval = "";
	for (var i=0; i < buf.length; i++) {
		retval += ("00"+buf[i].toString(16)).substr(-2);
	}
	return retval;
}

function interpret_lora_status(status) {
	if (status == LORAWAN_STATUS_OK) return "Operation successful";
	if (status == LORAWAN_STATUS_ERROR) return "Operation failed";
	if (status == LORAWAN_STATUS_CMD_NOT_SUPPORTED) return  "Command is not supported";
	if (status == LORAWAN_STATUS_WRONG_PARAMETER) return  "HCI message contains wrong parameter";
	if (status == LORAWAN_STATUS_WRONG_DEVICE_MODE) return  "Stack is running in a wrong mode";
	if (status == LORAWAN_STATUS_DEVICE_NOT_ACTIVATED) return  "Device is not activated";
	if (status == LORAWAN_STATUS_DEVICE_BUSY) return  "Device is busy, command rejected";
	if (status == LORAWAN_STATUS_QUEUE_FULL) return  "Message queue is full, command rejected";
	return (" Error code "+status);
// WiM	
// WiMOD LoRaWAN EndNode Modem - HCI Specification
// Appendix
// WiMOD_LoRaWAN_EndNode_Modem_HCI_Spec.docx, Wireless Solutions, V1.7 page 47 of 57
// LORAWAN_STATUS_LENGTH_ERROR 0x08 HCI message length is invalid or
// radio payload size is too large
// LORAWAN_STATUS_NO_FACTORY_SETTINGS 0x09 Factory Settings EEPROM block
// missing
// LORAWAN_STATUS_CHANNEL_BLOCKED 0x0A Channel blocked by Duty Cycle
// LORAWAN_STATUS_CHANNEL_NOT AVAILABLE 0x0B No channel available (e.g. no
// channel defined for the configured
// spreading factor)	
}

function makeLoraPacket(dst,msgid,msg) {

	if (session_obj.log == "debug") console.log("makeLoraPacket : DST ",dst, "MSGID",msgid, "msg", msg, " type", (typeof msg));
	const packet = new Buffer(msg.length+7);
	packet[0] = 0xc0;
	packet[1] = dst;
	packet[2] = msgid;
//	packet[3] = 0x01;
	for (var i=0; i < msg.length; i++) {
		//packet[4+i] = msg.charCodeAt(i);
		if (typeof msg === "string") {
			// type string
			packet[3+i] = msg.charCodeAt(i);
		} else {
			// type buffer
			packet[3+i] = msg[i];
		}
	}

	var CRC16 = require('crc16');


	var crc16 = CRC16_Calc(packet, 1, 3+msg.length, CRC16_INIT_VALUE);
	var crc16 = CRC16_Calc(packet, 1, 2+msg.length, CRC16_INIT_VALUE);

	// console.log(crc16);
	crc16 = ~crc16;
	// console.log(crc16);



	packet[3+msg.length] = crc16&0xFF;
	packet[3+msg.length+1] = crc16>>8;
	packet[3+msg.length+2] = 0xC0;

	if (session_obj.log == "debug") console.log("made lora packet ",packet);
	return packet;

}
// void lora_send_message(uint8_t dst, uint8_t msgid, uint8_t* tx, uint8_t len)
// {
//   len++;
//   uint8_t packet[len+6];
//   packet[0] = 0xC0;
//   packet[1] = dst;
//   packet[2] = msgid;
//   packet[3] = 0x01;
//   uint8_t i=0;
//   for(i=0;i<len;i++)
//   {
//     packet[i+4] = *tx++;
//   }
//   uint16_t crc16 = CRC16_Calc(&packet[1], 2+len, CRC16_INIT_VALUE);
//   crc16 = ~crc16;
  
//   packet[3+len] = crc16&0xFF;
//   packet[3+len+1] = crc16>>8;
//   packet[3+len+2] = 0xC0;
//   DEBUG("... Transmitting packet");

//   i=0;
//   while(i++<45) Serial1.write(0x00);
//   Serial1.write(packet,3+len+3);
// }

function read(SP,speed,fn) {
	var serialport = new SerialPort(SP,{
		baudrate : speed,	// 9600
		parser: serialPort.parsers.raw,
		buffersize : 200
	});
	var retval = "";
	var retvalD = new Buffer("");
    var countdown = new Spinner("Reading serial data");
	serialport.on('data', function(data){
		retval += data.toString();
		retvalD = Buffer.concat([retvalD,data]);
		if (data.length > 0) {
    		countdown.message("read ",data);
			if (retval.indexOf("\0") > -1) {

				if ( cmd == "watch") {
					retval = "";
					retvalD = new Buffer("");
				} else {
		    		countdown.stop();
					serialport.close();
				}

				/* if callback was passed to function use it */
				if (fn) {
					fn(retval,retvalD);
				} else {
					console.log("returned [",retvalD,"]");
				}
			}
		}
	});

	serialport.on('open', function(){
		countdown.start();
		serialport.drain(function() {
			console.log("drained");
		})
	});

}
function send(SP,speed, cmd, zeros,fn) {
	// console.log(SP);
	// console.log(cmd);

	var serialport = new SerialPort(SP,{
		baudrate : speed,	// 9600
		parser: serialPort.parsers.raw,
		buffersize : 200
	});

	
	/* create an empty retval as string for the accumulated response */

	var retval = "";


	/* create an empty retval as string for the accumulated response */

	var retvalD = new Buffer("");


	/* create a countdown timer UI element */

    var countdown = new Spinner("Reading serial data");


    /* ceate the on data received listener on seralport */

	serialport.on('data', function(data){

		
		/* concattenate the date to the retval as string and retvald as buffer */

		retval += data.toString();
		retvalD = Buffer.concat([retvalD,data]);

		if (data.length > 0) {

			/* update the countdown timer message */

    		countdown.message("read " + data.toString());

			// console.log("* ", data);
			// console.log("* ", data.toString());
			// console.log(") ", retval);


			if (retval.indexOf("\0") > -1) {

				/* stop the countdown on screen timer */

	    		countdown.stop();

	    		/* if log is debug then display the retval buffer */

				if (session_obj.log == "debug") console.log("returned [",retvalD,"]");

				/* close the serial port */

				serialport.close();

				/* if callback was passed to function use it */
				if (fn) {
					fn(retval,retvalD);
				} else {
					console.log("returned [",retvalD,"]");
				}
			}

		}
	});

	/* set up the on open listener for seral port */

	serialport.on('open', function(){
		if (session_obj.log == "debug") console.log('Serial Port Opend, sending ',cmd);

		if (zeros) {
			for (var i=0; i < zeros ; i++) {
				serialport.write(0x00, function(err,results) {
				});
			}
		}

		serialport.flush();

		serialport.write(cmd, function(err,results) {
			if (err) {
				console.log('err ' + err);
			}
			if (session_obj.log == "debug") console.log('results ' + results);

    		countdown.start();


			serialport.drain(function(){
				// setTimeout(sendnext,timeTillNextSend);
				// sendnext();
//				serialport.close();
			});
		});
	});
	serialport.on('close', function(){
		if (session_obj.log == "debug") console.log('Serial Port Closed');
	});

}


//------------------------------------------------------------------------------
//
// Section Code
//
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//
// CRC16_Calc
//
//------------------------------------------------------------------------------
//!
//! @brief calculate CRC16
//!
//------------------------------------------------------------------------------
//!
//! This function calculates the CRC16 value according to f the standard
//! 16-BIT CRC CCITT polynomial G(x) = 1 + x^5 + x^12 + x^16
//!
//! <!------------------------------------------------------------------------->
//! @param[in] data pointer to data block
//! @param[in] length number of bytes
//! @param[in] initVal CRC16 initial value
//! <!------------------------------------------------------------------------->
//! @retVal crc16 crc
//------------------------------------------------------------------------------

function CRC16_Calc (data, start, length, initVal) {
     // init crc
	var crc = initVal;
    // iterate over all bytes
    for (var i=0; i < length; i++) {
    	var bits = 8;
    	var byte = data[start+i];

	    // iterate over all bits per byte
	    while(bits--) {
		    if((byte & 1) ^ (crc & 1)) {
	            crc = (crc >> 1) ^ CRC16_POLYNOM;
		    } else {
	            crc >>= 1;
	        }
            byte >>= 1;
		}
    }
    return crc;
}

//------------------------------------------------------------------------------
//
// CRC16_Check
//
//------------------------------------------------------------------------------
//!
//! @brief calculate & test CRC16
//!
//------------------------------------------------------------------------------
//!
//! This function checks a data block with attached CRC16
//!
//! <!------------------------------------------------------------------------->
//! @param[in] data pointer to data block
//! @param[in] length number of bytes (including CRC16)
//! @param[in] initVal CRC16 initial value
//! <!------------------------------------------------------------------------->
//! @retVal true CRC16 ok -> data block ok
//! @retVal false CRC16 failed -> data block corrupt
//------------------------------------------------------------------------------
function  CRC16_Check (data, start, length, initVal)
{
	// calculate ones complement of CRC16
	var crc = ~CRC16_Calc(data, start, length, initVal);
	if (crc == CRC16_GOOD_VALUE) return true;
	return false;
}


