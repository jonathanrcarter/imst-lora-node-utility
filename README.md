# imst-lora-node-utility
imst lora node utility

This is a nodejs utility for setting up IMST LORA modules via the UART interface.  it means you don't have to install Wimod End node studio if you are a mac user.

It is a command like utility as follows 

commands
* set the port / baud *
	imst ports 
	imst set port /dev/cu.usbserial-A702JTS6
	imst set baud 115200
	imst set log info
 
* working with the imst *
	imst ping
	imst get info|firmware|status|rtc|mode
	imst factoryreset
 
	ABP
 
	imst get activation
	imst deactivate
	imst activation status
 
	ADDRESS
 
	imst get address
	imst set mode 3
	imst set address [6969010101010101]
	imst set mode 1
 
	OTAA
 
	imst get join
	imst set join [0102030405060708] [01020304050607080910111213141516]
	imst join 
 
	SEND DATA
 
	imst sendc [ confirmed message]
	imst sendu [ un-confirmed message]
 
	RECEIVE DATA
 
	imst read 
	imst watch 
	
	
