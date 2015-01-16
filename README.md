plab-mobile-framework
=====================

This is a tool app for the programming lab courses at NTNU.

It allows the students to connect to a Bluetooth LE device with their cell phone.
They can communicate with the Bluetooth LE device through a Processing sketch.
The sketch is interpreted via Processing.js.

To build one must have Cordova installed.
For bluetooth le:
Dependent on plugins org.apache.cordova.device and com.randdusing.bluetoothle
For bluetooth:
Dependent on plugin com.megster.cordova.bluetoothserial
To install them type:
 - cordova plugin add org.apache.cordova.device
 - cordova plugin add https://github.com/randdusing/BluetoothLE
 - cordova plugin add com.megster.cordova.bluetoothserial

Add the platform you wish to build to (iOS or Android)
Then build and you should be ready to go.
