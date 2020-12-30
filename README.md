# HomeKit integration for Denon AVR-1705 and Samsung UE46C5105
This repository contains code and plans for enabling HomeKit integration for some ancient hardware.
It consists of three parts: 1) schematics for hardware, 2) code for an Arduino Leonardo, 3) a Homebridge plugin that exposes the functionality on iOS/macOS devices.

## Building
### 1. Hardware
There are three things you need to build:
- [A hardware modification to the Denon AVR-1705 to add an IR-in-port](Schematics/denon-hardware-modification.md)
- [An Ex-Link cable for the Samsung UE46C5105](Schematics/samsung-exlink-cable.md)
- [A little Ardunio Shield to drive the IR diode, and connectors for everything](Schematics/arduino-shield.md)

## Running
### 2. Arduino Code
This one is pretty straight forward, just upload the code from the `Source/Arduino` directory to an Arduino Leonardo and you're good to go.

The code could probably be modified to work with other boards, but that was the board at hand with multiple hardware serial ports and some spare external interrupt pins to get the IR up and running quickly.
The IR code was also hand rolled just for fun, and any IR library would most likely do a better job than I have done :)

### 3. Homebridge Plugin
Follow [the guide](https://github.com/homebridge/homebridge-raspbian-image/wiki/Getting-Started) to install Homebridge on a Raspberry Pi, then clone this repository on the Pi.
In the `Source/Plugin` directory, run `npm install`, `npm build` and `sudo npm link`.
Then go to the running Homebridge UI (probably at http://homebridge.local) and restart the server.

The accessories are exposed as external accessories because there is a one-television-per-bridge limit, so they need to be paired manually (not scanning QR code) in the _Home app_.