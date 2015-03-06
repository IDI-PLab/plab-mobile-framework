PLab Mobile Framework
=====================

This is a tool app for the programming lab courses at NTNU.

It allows the students to connect to a Bluetooth or Bluetooth LE device with
their cell phone.

Communication is serial text based. An interface is provided so that the
students may communicate with the Bluetooth/ Bluetooth LE device through a
[Processing][2] sketch located on an external web server. Interpretation of the
sketch is done through [Processing.js][3].

Prerequisites
---
To build one must have [Apache Cordova][1] installed. How to use the
[command-line interface](http://cordova.apache.org/docs/en/4.0.0/guide_cli_index.mt.html)

Dependent Plugins
---

### Bluetooth LE
Depends on plugins [org.apache.cordova.device][5] and
[com.randdusing.bluetoothle][4].

### Bluetooth
Depends on plugin [com.megster.cordova.bluetoothserial][6]

### Installation of Plugins in Console
In console, type:
* `cordova plugin add org.apache.cordova.device`
* `cordova plugin add https://github.com/randdusing/BluetoothLE`
* `cordova plugin add com.megster.cordova.bluetoothserial`

Build
---

### Adding Platforms
Add the platform you wish to build to (iOS or Android).
* `cordova platform add android`
* `cordova platform add ios`

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
[5]: http://plugins.cordova.io/#/package/org.cordova.device	"device"
[6]: http://plugins.cordova.io/#/package/com.megster.cordova.bluetoothserial "Bluetooth serial"
