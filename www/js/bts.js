/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/*
 * ----------------------------------------------------------------------------
 * ---- THIS FILE USES THE com.megster.cordova.bluetoothserial PLUGIN ---------
 * ----------------------------------------------------------------------------
 * ---- It is an implementation of the plabBTMode interface that allows for ---
 * ---- communication with regular Bluetooth devices on Android, and for ------
 * ---- Bluetooth LE devices on iOS exposing a service with identifier --------
 * ---- 6E400001-B5A3-F393-E0A9-E50E24DCCA9E ----------------------------------
 * ----------------------------------------------------------------------------
 */


/*
 * Reference: Describes the plabBTMode implementation, overview
 * 
 * LEGEND:
 *   '+' added property/method
 *   '-' unchanged property/method, empty
 *   ' ' changed property/method according to intended usage

plabBTMode = {
		id : "",
		name : "",
		status : {
+			started : true/false
			initialized : false,
			connected : false,
			ready : false,
			failure : false
		},
		
+		subscribers : [],
		
		openMode : function () {},
		closeMode : function () {},
		
		listDevices : function (listCallback, scanTime) {},
-		stopListDevices : function () {},
		
		connectDevice : function (id, successCallback) {},
		disconnectDevice : function () {},
		
		send : function (text) {},
		receiveCallback : function (callback) {}
} 
 */

/*
 * Adds this module to the main app. debugOut is where debug output is sent,
 * assumed to have three plabPrintStreams (err, warn, notify).
 * updateScreen should be the function responsible for redrawing the screen.
 */
function plabAddBTSerial(debugOut, updateScreen) {
	debugOut.notify.println("Adding buetoothSerial version");
	if (typeof bluetoothSerial === "undefined") {
		return;
	}
	debugOut.notify.println("bluetoothSerial plugin detected");
	
	// Creating the module object, and setting the must have fields
	var btMode = Object.create(plabBTMode);
	btMode.id = "BluetoothSerial-com.megster";
	btMode.name = "Bluetooth";
	
	// Adding additional fields since this is init
	btMode.status.started = false;
	btMode.subscribers = [];
	
	// start subscribe call
	var startSubscription = function() {
		bluetoothSerial.subscribe(
				'\n',
				function(data){
					debugOut.notify.println("bluetoothSerial received message: " + data);
					// Tell all subscribers about the data
					// TODO Ensure the ending newline is removed.
					btMode.subscribers.forEach(function(subscriber){subscriber(data);});
				},
				function(){
					debugOut.err.println("bluetoothSerial could not start a subscription");
					btMode.status.failure = true;
					btMode.status.ready = false;
				}
		);
	}
	
	btMode.openMode = function() {
		// Check if bt is enabled
		bluetoothSerial.isEnabled(
				function() {
					debugOut.notify.println("bluetoothserial reports enabled device");
					btMode.status.initialized = true;
					btMode.status.failure = false;
					updateScreen();
				},
				function() {
					debugOut.err.println("bluetoothserial reports disabled device");
					btMode.status.initialized = false;
					btMode.status.failure = true;
					updateScreen();
				}
		);
		
		// Is this first run?
		if (!btMode.status.started) {
			
			btMode.status.started = true;
			
			btMode.closeMode = function () {
				if (btMode.status.connected){
					if (btMode.status.ready) {
						// Unsubscribe
						bluetoothSerial.unsubscribe(
								function(){
									debugOut.notify.println("bluetoothSerial unsubscribed");
									// Remeber to disconnect
									btMode.disconnectDevice();
									updateScreen();
								},
								function(){
									debug.warn.println("bluetoothSerial failed to unsubscribe");
									// Remeber to disconnect
									btMode.disconnectDevice();
									updateScreen();
								}
						);
					} else {
						// Disconnect
						btMode.disconnectDevice();
					}
				}
			};
			
			btMode.listDevices = function (listCallback, scanTime) {
				bluetoothSerial.list(
						function(list) {
							debugOut.notify.println("bluetoothSerial received list of devices");
							list.forEach(function(device) {
								var n = device.name === null ? "? - " + device.id : device.name;
								var desc = plabBT.createDeviceDescriptor(device.id, n);
								listCallback(desc);
							});
						},
						function() {
							debugOut.err.println("bluetoothSerial could not list devices");
						}
				);
			};
			// btMode.stopListDevices = function () {}; -  N/A
			
			btMode.connectDevice = function (id, successCallback) {
				bluetoothSerial.connect(
						id,
						function() {
							debugOut.notify.println("Device connected");
							btMode.status.connected = true;
							startSubscription();
							btMode.status.ready = true;
							btMode.status.failure = false;
							successCallback();
						},
						function() {
							debugOut.warn.println("Device not connected");
							btMode.status.connected = true;
							btMode.status.ready = true;
							btMode.status.failure = true;
							updateScreen();
						}
				);
				debugOut.notify.println("Attempted connection");
			};
			btMode.disconnectDevice = function () {
				bluetoothSerial.disconnect(
						function(){
							btMode.status.ready = false;
							btMode.status.connected = false;
							btMode.status.failure = false;
							debugOut.notify.println("bluetoothSerial disconnected");
							updateScreen();
						},
						function(){
							btMode.status.ready = false;
							btMode.status.connected = false;
							btMode.status.failure = true;
							debugOut.err.println("bluetoothSerial failed to disconnect");
							updateScreen();
						}
				);
			};
			
			btMode.send = function (text) {
				bluetoothSerial.write(
						text,
						function(){
							debugOut.notify.println("bluetoothSerial sent: " + text);
						},
						function(){
							debugOut.err.println("bluetoothSerial failed to send data");
						}
				);
			};
			btMode.receiveCallback = function (callback) {
				btMode.subscribers[btMode.subscribers.length] = callback;
			};
		}
		
	};

	plabBT.addMode(btMode);
	debugOut.notify.println("buetoothSerial added");
	
}



/*
 * ----------------------------------------------------------------------------
 * -------- ADDING THIS MODULE TO MAIN APP ------------------------------------
 * ----------------------------------------------------------------------------
 */
document.addEventListener(
		"deviceready",
		function() {
			plabAddBTSerial(plab.out, plab.updateScreen);
		}, 
		false
);
