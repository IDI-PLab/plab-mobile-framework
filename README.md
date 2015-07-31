PLab Mobile Framework
=====================

This is a tool app for the programming lab courses at [NTNU][7].

It allows the students to connect to a Bluetooth or Bluetooth LE device with
their cell phone.

Communication is serial text based. An interface is provided so that the
students may communicate with the Bluetooth/ Bluetooth LE device through a
[Processing][2] sketch located on an external web server. Interpretation of the
sketch is done through [Processing.js][3].

Help, Further Documentation
---
For further documentation than what is found in this README, API help and
description of project architecture, see [the project wiki][11].

Help with the app user interface can also be found in [the project wiki][12].

![Screenshot](https://cloud.githubusercontent.com/assets/2333406/9002163/d4053e3c-3760-11e5-9a9e-581298379de8.png)

Prerequisites
---
To build one must have [Apache Cordova][1] installed. Check out how to use the
[command-line interface](http://cordova.apache.org/docs/en/4.0.0/guide_cli_index.mt.html)

Dependent Plugins
---

### Network Information
Internet connectivity checks are dependent on plugin
[cordova-plugin-network-information][8].

### Bluetooth LE Support
Depends on plugins [cordova-plugin-device][5] and
[com.randdusing.bluetoothle][4].

### Bluetooth Support (Android only)
Depends on plugin [com.megster.cordova.bluetoothserial][6].
As of version 2.0.0 this plugin will depend on plugin
[cordova-plugin-device][5] to filter out iOS devices.

### Vibration
Vibration of device is dependent on plugin
[cordova-plugin-vibration][9]

### Acceleration
Acceleration detection is dependent on plugin
[cordova-plugin-device-motion][10]

### Installation of Plugins With Command-Line Interface
In console, type:
* `cordova plugin add cordova-plugin-device`
* `cordova plugin add cordova-plugin-network-information`
* `cordova plugin add https://github.com/randdusing/BluetoothLE`
* `cordova plugin add com.megster.cordova.bluetoothserial`
* `cordova plugin add cordova-plugin-vibration`
* `cordova plugin add cordova-plugin-device-motion`

Installation and Build
---

### Adding Platforms
Add the platform you wish to build to (iOS or Android).
* `cordova platform add android`
* `cordova platform add ios`

### Adding Plugins
See section Dependent Plugins

### Build
Build to one or more platforms
* `cordova build`

### Run on Android Device
* `cordova run android`

This project is powered by
===
* [Apache Cordova][1]
* [Processing.js][3]

[1]: http://cordova.apache.org			"Cordova"
[2]: https://processing.org			"Processing"
[3]: http://processingjs.org			"Processing.js"
[4]: https://github.com/randdusing/BluetoothLE	"Randdusing BluetoothLE"
[5]: http://npmjs.com/package/cordova-plugin-device	"Cordova Device Plugin"
[6]: http://plugins.cordova.io/#/package/com.megster.cordova.bluetoothserial "Bluetooth serial"
[7]: http://www.ntnu.edu	"Norwegian University of Science and Technology - NTNU" 
[8]: http://www.npmjs.com/package/cordova-plugin-network-information	"Cordova Network Information Plugin"
[9]: http://www.npmjs.com/package/cordova-plugin-vibration	"Cordova Vibration Plugin"
[10]: http://www.npmjs.com/package/cordova-plugin-device-motion	"Cordova Device Motion Plugin"
[11]: https://github.com/IDI-PLab/plab-mobile-framework/wiki	"Project wiki"
[12]: https://github.com/IDI-PLab/plab-mobile-framework/wiki/User-Interface	"User Interface Description"
