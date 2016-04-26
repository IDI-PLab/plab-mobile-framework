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
To build one must have [Apache Cordova][1] installed. This document assume you are
familiar with using the Command Line Interface (CLI) of Cordova.

Dependent Plugins
---

### InAppBrowser
We require the inappbrowser to open external links in the system browser.
[cordova-plugin-inappbrowser][15]

### Whitelist
Android require whitelist plugin to load sketches from the web
[cordova-plugin-whitelist][13]

### Network Information
Internet connectivity checks are dependent on plugin
[cordova-plugin-network-information][8].

### Bluetooth LE Support
Depends on plugins [cordova-plugin-device][5] and
[cordova-plugin-bluetoothle][4], 
[Check out project source][14].

A word of caution: The iOS version of this app has not been tested after
updating to 3.x version of this plugin. So we recommend testing thoroughly
if a build to iOS is performed.

### Bluetooth Support (Android only)
Depends on plugin [cordova-plugin-bluetooth-serial][6].
As of version 2.0.0 of this app, use of this plugin will depend on
[cordova-plugin-device][5] to filter out iOS devices.

### Vibration
Vibration of device is dependent on plugin
[cordova-plugin-vibration][9]

### Acceleration
Acceleration detection is dependent on plugin
[cordova-plugin-device-motion][10]

### Installation of Plugins With Command-Line Interface
In console, type:
* `cordova plugin add cordova-plugin-inappbrowser`
* `cordova plugin add cordova-plugin-whitelist`
* `cordova plugin add cordova-plugin-device`
* `cordova plugin add cordova-plugin-network-information`
* `cordova plugin add cordova-plugin-bluetoothle`
* `cordova plugin add cordova-plugin-bluetooth-serial`
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
[4]: https://www.npmjs.com/package/cordova-plugin-bluetoothle	"Cordova Bluetooth LE Plugin"
[5]: http://npmjs.com/package/cordova-plugin-device	"Cordova Device Plugin"
[6]: https://www.npmjs.com/package/cordova-plugin-bluetooth-serial "Bluetooth Serial Plugin for PhoneGap"
[7]: http://www.ntnu.edu	"Norwegian University of Science and Technology - NTNU" 
[8]: http://www.npmjs.com/package/cordova-plugin-network-information	"Cordova Network Information Plugin"
[9]: http://www.npmjs.com/package/cordova-plugin-vibration	"Cordova Vibration Plugin"
[10]: http://www.npmjs.com/package/cordova-plugin-device-motion	"Cordova Device Motion Plugin"
[11]: https://github.com/IDI-PLab/plab-mobile-framework/wiki	"Project wiki"
[12]: https://github.com/IDI-PLab/plab-mobile-framework/wiki/User-Interface	"User Interface Description"
[13]: https://www.npmjs.com/package/cordova-plugin-whitelist	"Cordova Whitelist Plugin"
[14]: https://github.com/randdusing/BluetoothLE	"Randdusing BluetoothLE"
[15]: https://www.npmjs.com/package/cordova-plugin-inappbrowser	"Cordova InAppBrowser Plugin"
