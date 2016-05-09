# imst-lora-node-utility
imst lora node utility

This is a nodejs utility for setting up IMST LORA modules via the UART interface.  it means you don't have to install Wimod End node studio if you are a mac user.

It is a command like utility as follows 
<pre>
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
</pre>	

In order to Join using OTAA the sequence of commands would be as follows , not the address is the first of the join parameters but switched around front to back (little endian).  You have to set the IMST into customer mode before you can set the address an then back again to application mode.

<pre>
	imst set mode customer
	imst set address "6969010101010103"
	imst set mode application
	imst set join "0201010101016969" "69690101010101016969000000000003"
	imst join 
	imst activation status

</pre>

##Hardware

I has a break out board created to make all of this easier for me where you cna solder the IMST to the board and us gives you 4 pins that you can connect an FTDI connecter to.  If you want one of these (or many) contact me and I can send one or have one made for $5 each.


