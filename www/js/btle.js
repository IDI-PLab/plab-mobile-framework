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
 * ---- THIS FILE USES THE com.randdusing.bluetoothle PLUGIN ------------------
 * ----------------------------------------------------------------------------
 * ---- It is an implementation of the plabBTMode interface that allows for ---
 * ---- communication with Bluetooth LE devices on Android and iOS. The -------
 * ---- service used for communication is identified with ffe0 ----------------
 * ----------------------------------------------------------------------------
 */

/*
 * The services available from the bluetooth device are (non standard nordic semiconductor):
 * 1800: Generic Access {2a00,2a01,2a02,2a03,2a04}
 *         All characteristics are read only. @see https://developer.bluetooth.org/gatt/services/Pages/ServiceViewer.aspx?u=org.bluetooth.service.generic_access.xml
 * 1801: Generic Attribute {2a05}
 *         This tells if service has changed
 * ffe0: Default service currently used to communicate with bt device.
 */
// TODO Add support for a more general services for serial communication.

/*
 * Reference: Describes the plabBTMode implementation, overview
 * 
 * LEGEND:
 *   '+' added property/method
 *   '-' unchanged property/method, empty
 *   ' ' changed property/method according to intended usage

var plabBTMode = {
		id : "",
		name : "",
		status : {
+			started : true/false,
+			scanning : true/false,
			initialized : false,
			connected : false,
			ready : false,
			failure : false
		},
		
+		supportedServices : {
+			"default" : {
+				serviceUUID : "FFE0",
+				txUUID :  "FFE1",
+				rxUUID : "FFE1"
+			},
+			"nordic" : {
+				serviceUUID : "6E400001-B5A3-F393-E0A9-E50E24DCCA9E",
+				txUUID :  "6E400002-B5A3-F393-E0A9-E50E24DCCA9E",
+				rxUUID : "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"
+			}
+		},
+		serviceInfo : {
+			serviceUUID : "FFE0",		// unique identifier for the Service used for communication
+			txUUID :  "FFE1", 			// unique identifier for the TX Characteristic (Property = Notify)
+			rxUUID : "FFE1" 			// unique identifier for the RX Characteristic (Property = Write without response)
+		},
		
+		timers : {
+			scanning : null,
+			connecting : null
+		}
+		address : null

+		postScanCallback : null/function(),	// Callback triggered after scan has completed
		
+		subscriptions : [],				// List of subscribers for messages from this mode
+		startSubscribe : function() {},	// Starts subscription to serial communication on device
		
+		platforms : {					// Code differs based on platform
+			iOS : "iOS",
+			android : "Android"
+		},
		
+		receiveString : "",				// Concatenate strings until newline is met.

+		discoveredService = function (success, successCallback) {},	// Called after services are discovered. Start serial communication.
+		discoverAndroid = function (id, successCallback) {},		// Android specific discovery
+		discoverIOS = function (id, successCallback) {},			// iOS specific discovery
		
		openMode : function () {},
		closeMode : function () {},
		
		listDevices : function (listCallback, scanTime, scanStoppedCallback) {},
		stopListDevices : function () {},
		
		connectDevice : function (id) {},
		disconnectDevice : function () {},
		
		send : function (text) {},
		receiveCallback : function (callback) {}
}
 */

/*
 * Adds this module to the main app. debugOut is where debug output is sent,
 * assumed to have three plabPrintStreams (err, warn, notify).
 * updateScreen should be the function responsible for redrawing the screen.
 * 
 * If necessary plugin is not installed, function will not add module.
 */
// TODO updateScreen is misleading. Should be something in the likes of "stateChangedCallback"
// TODO Notifications to debug should be prefixed with where they are from
function plabAddBT4_0(debugOut, updateScreen) {
	
	debugOut.notify.println("[BlueTooth_4.0_randdusing]: Attempting to create btle support");
	// See if necessary plugin is installed
	if (typeof bluetoothle === "undefined") {
		return;
	}
	
	
	debugOut.notify.println("[BlueTooth_4.0_randdusing]: creating mode");
	// Creating a prototype object
	var btMode = Object.create(plabBTMode);
	btMode.id = "BlueTooth_4.0_randdusing";
	btMode.name = "Bluetooth LE";
	
	// Adding info since this is init
	btMode.status.started = false;
	btMode.status.scanning = false;
	btMode.timers = {
			scanning : null,
			connecting : null
	};
	btMode.address = null;
	btMode.postScanCallback = null;
	btMode.supportedServices = {
		"default" : {
			serviceUUID : "FFE0",
			txUUID :  "FFE1",
			rxUUID : "FFE1"
		},
		"nordic" : {
			serviceUUID : "6E400001-B5A3-F393-E0A9-E50E24DCCA9E",
			txUUID :  "6E400002-B5A3-F393-E0A9-E50E24DCCA9E",
			rxUUID : "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"
		}
	};
	btMode.serviceInfo = {
		serviceUUID : "FFE0", 	// unique identifier for the Service used for communication
		txUUID :  "FFE1", 		// unique identifier for the TX Characteristic (Property = Notify)
		rxUUID : "FFE1" 		// unique identifier for the RX Characteristic (Property = Write without response)
	};
	// List of message subscribers
	btMode.subscriptions = [];
	// Platforms: identify the supported platforms. Code differs based on platform
	btMode.platforms = {
		iOS : "iOS",
		android : "Android"
	};
	// When receiving string, it is divided based on newline character.
	// receiveString used to concatenate temporary received string. 
	btMode.receiveString = "";
	
	
	/*
	 * startSubscribe: after connection is completed, we need to start
	 * listening to incoming messages. This function can be called to
	 * start subscription to the service providing the serial communication.
	 */
	btMode.startSubscribe = function () {
		// The info object for the subscription
		var params = {
				"address":btMode.address,
				"serviceUuid":btMode.serviceInfo.serviceUUID,
				"characteristicUuid":btMode.serviceInfo.rxUUID,
				"isNotification":true
		};
		
		// Callback functions for subscribe
		bluetoothle.subscribe(
				function (obj) {
					
					try {
						if (obj.status == "subscribedResult") {
							// Debug output
							debugOut.notify.print("Received data: ");
							debugOut.notify.println(JSON.stringify(obj));
							
							// Translate received message to real string
							var recString = bluetoothle.bytesToString(bluetoothle.encodedStringToBytes(obj.value));
							
							// See if we received an "end of message" (aka newline)
							if (recString.indexOf('\n') === -1) {
								btMode.receiveString += recString;
							} else {
								// We received at least one message. concat the old string with the new
								recString = btMode.receiveString + recString;
								// Split on newline
								var splitString = recString.split("\n");
								// Send all completed messages to listeners
								for (var i = 0; i < splitString.length - 1; i++) {
									// Pass split messages to subscribers
									debugOut.notify.println("Message passed on: " + splitString[i]);
									for (var j = 0; j < btMode.subscriptions.length; j++) {
										btMode.subscriptions[j](splitString[i]);
									}
								}
								// Remember string element after last split
								btMode.receiveString = splitString[splitString.length - 1];
							}
							
						} else if (obj.status == "subscribed") {
							// Everything good, and we may update status to ready
							debugOut.notify.print("Subscription done, Everything is good");
							btMode.status.ready = true;
							updateScreen();
						} else {
							// This should not occur. If it does, the plugin has changed behaviour
							debugOut.err.println("UnknownSubscribeStatus");
						}
						
					} catch (e) {
						debugOut.err.println("SubscribeFailure: " + e);
					}
				},
				function (obj) {
					debugOut.err.println("SubscribeFailure: " + obj.error + " - " + obj.message);
				},
				params
		);
		
	};
	
	// discoveredService: called after service has been totally discovered. Starts serial communication.
	btMode.discoveredService = function (success, successCallback) {
		if (success) {
			debugOut.notify.println("btle: Connection successful");
			// Do callback
			successCallback();
			// Start message subscription
			btMode.startSubscribe();
			// We are not ready until subscription is done
		} else {
			// Alert that service discovery has failed
			debugOut.err.println("DiscoverFailure: Failed to discover UART service");
			btMode.status.failure = true;
			updateScreen();
		}
	};
	
	// ------------------------------------------------------------------------
	// ---- START PLATFORM SPECIFIC DISCOVERY ---------------------------------
	// ------------------------------------------------------------------------
	
	// ---------------- START ANDROID -----------------------------------------
	// discoverAndroid: Android specific discovery
	btMode.discoverAndroid = function (id, successCallback) {
		debugOut.notify.println("btle: discoverAndroid called");
		bluetoothle.discover (
				function (obj) {
					debugOut.notify.println(JSON.stringify(obj));
					if (obj.status == "discovered") {
						// The device was discovered. Check if we found the correct connection data
						var found = {service : false, rx : false, tx : false};
						
						// Service, rx and tx uuids. Used for discovered confirmation.
						var sUuid = btMode.serviceInfo.serviceUUID.toUpperCase();
						var rxUuid = btMode.serviceInfo.rxUUID.toUpperCase();
						var txUuid = btMode.serviceInfo.txUUID.toUpperCase();
						
						// Find the service, and set found properties properly
						// --- START services
						obj.services.forEach(function(service) {
							if (service.serviceUuid.toUpperCase() == sUuid) {
								found.service = true;
								// Service found. Find rx and tx characteristics
								
								// --- START characteristics
								service.characteristics.forEach(function(characteristic){
									var uuid = characteristic.characteristicUuid.toUpperCase();
									
									if (uuid === txUuid) {
										if (typeof characteristic.properties.writeWithoutResponse !== "undefined" 
											&& characteristic.properties.writeWithoutResponse) {
											found.tx = true;
										}
									}
									
									if (uuid === rxUuid) {
										if (typeof characteristic.properties.notify !== "undefined" 
											&& characteristic.properties.notify) {
											found.rx = true;
										}
									}
								});	// --- END characteristics
							}
						});	// --- END services
						
						// Call post platform specific discovery functionality
						btMode.discoveredService(found.service && found.rx && found.tx, successCallback);
					} else {
						// TODO Something has failed. Tell post platform specific discovery.
						debugOut.err.println("DiscoverFailure: Unknown status: " + obj.status);
						btMode.disconnectDevice ();
					}
				},
				function (obj) {
					// TODO Something has failed. Tell post platform specific discovery.
					debugOut.err.println("DiscoverFailure: " + obj.error + " - " + obj.message);
					btMode.disconnectDevice ();
				},
				{"address" : id}
		);
	};
	// ---------------- END ANDROID -------------------------------------------
	
	// ---------------- START iOS ---------------------------------------------
	// discoverIOS: iOS specific discovery
	btMode.discoverIOS = function (id, successCallback) {
		debugOut.notify.println("btle: discoverIOS called");
		
		// Service, rx and tx uuids
		var sUuid = btMode.serviceInfo.serviceUUID.toUpperCase();
		var rxUuid = btMode.serviceInfo.rxUUID.toUpperCase();
		var txUuid = btMode.serviceInfo.txUUID.toUpperCase();
		// rx and tx uuid combined in an array
		var rntxUuid = rxUuid === txUuid ? [rxUuid] : [rxUuid, txUuid];
		
		// The parameters to service discovery
		var servicesParams = {"address":id , "serviceUuids":[sUuid]};
		// The parameters to characteristics discovery
		var characteristicParams = {"address":id , "serviceUuid":sUuid, "characteristicUuids":rntxUuid};
		
		// Do service discovery
		bluetoothle.services(
				function(obj){
					if (obj.status == "services" && obj.serviceUuids.length > 0) {
						// The service has been found. We can now discover characteristics
						
						bluetoothle.characteristics(
								function(obj){
									if (obj.status == "characteristics") {
										// Some characteristics have been found. Checking for both tx and rx correctness
										var found = {rx : false, tx : false};
										// --- START characteristics loop
										obj.characteristics.forEach(function(characteristic){
											var uuid = characteristic.characteristicUuid.toUpperCase();
											
											if (uuid === txUuid) {
												if (typeof characteristic.properties.writeWithoutResponse !== "undefined" 
													&& characteristic.properties.writeWithoutResponse) {
													found.tx = true;
												}
											}
											
											if (uuid === rxUuid) {
												if (typeof characteristic.properties.notify !== "undefined" 
													&& characteristic.properties.notify) {
													found.rx = true;
												}
											}
										});	// --- END characteristics loop
										
										// Assuming we do not need to discover descriptors, we are done
										btMode.discoveredService(found.rx && found.tx, successCallback);
									} else {
										// Something has failed. Tell post platform specific discovery.
										debugOut.err.println("CharacteristicsFailure: Unknown status: " + obj.status);
										btMode.discoveredService(false, successCallback);
										btMode.disconnectDevice();
									}
								},
								function(obj){
									// Something has failed. Tell post platform specific discovery.
									debugOut.err.println("CharacteristicsFailure: " + obj.error + " - " + obj.message);
									btMode.discoveredService(false, successCallback);
									btMode.disconnectDevice();
								},
								characteristicParams
						);
						
					} else {
						// Something has failed. Tell post platform specific discovery.
						debugOut.err.println("ServicesFailure: Unknown status: " + obj.status);
						btMode.discoveredService(false, successCallback);
						btMode.disconnectDevice ();
					}
				},
				
				function(obj){
					// Something has failed. Tell post platform specific discovery.
					debugOut.err.println("ServicesFailure: " + obj.error + " - " + obj.message);
					btMode.discoveredService(false, successCallback);
					btMode.disconnectDevice ();
				},
				
				servicesParams
		);
	};
	// ---------------- END iOS -----------------------------------------------
	
	// ------------------------------------------------------------------------
	// ---- END PLATFORM SPECIFIC DISCOVERY -----------------------------------
	// ------------------------------------------------------------------------
	
	// Replacing the open mode function -> init the mode
	btMode.openMode = function () {
		if (!btMode.status.started) {
			btMode.status.started = true;
			// First run -> set up
			btMode.closeMode = function () {
				// Remove all listeners
				// TODO
				// Close open connections
				btMode.disconnectDevice();
				
				// Update status
				btMode.status.connected = false;
				btMode.status.ready = false;
				btMode.status.failure = false;
				btMode.receiveString = "";
				
				// Call and clear scanners
				if (btMode.timers.scanning !== null) {
					clearTimeout(btMode.timers.scanning);
					btMode.timers.scanning = null;
					btMode.stopListDevices();
				}
			};
			
			// ------------------ SCAN ----------------------------------------
			
			// listDevices: scans and return callbacks for found devices.
			btMode.listDevices = function (listCallback, scanTime, scanStoppedCallback) {
				// Remember the callback that will be called after scan has stopped
				btMode.postScanCallback = scanStoppedCallback;
				// Holding scan results as an object storing the IDs of the found devices.
				// On some devices the startScan returns the same device multiple times.
				var scanResults = {};
				// Anonymous function that scans for devices. A device is only added once
				var scan = function() {
					// The btle state must be initialized
					
					if (btMode.status.initialized) {
						debugOut.notify.println("Starting scan");
						
						// Starting the actual scan for devices
						bluetoothle.startScan(
								function(obj) {
									// Scan successful function
									debugOut.notify.println("Scan result: " + JSON.stringify(obj));
									
									if (obj.status == "scanResult") {
										// If we have not identified this device before:
										if (typeof scanResults[obj.address] === "undefined") {
											scanResults[obj.address] = true;
											// Create the descriptor
											var name = obj.name === null ? "? - " + obj.address : obj.name;
											var desc = plabBT.createDeviceDescriptor(obj.address, name);
											listCallback(desc);
										}
									} else if (obj.status == "scanStarted") {
										btMode.timers.scanning = setTimeout(btMode.stopListDevices, scanTime);
									} else {
										debugOut.warn.println("StartScanFailure: Unknown status: " + obj.status);
									}
								},
								function(obj) {
									// Scan failure function
									btMode.status.failure = true;
									debugOut.err.println("ScanFailure: " + obj.error + " - " + obj.message);
									updateScreen();
								},
								null
						);
					} else {
						// If the btle status is not initialized, warn and wait for some time before scan
						debugOut.warn.println("Device not initialized, delaying scan!");
						setTimeout(scan, 500);
					}
				};
				scan();
			};
			
			// stopListDevices: stops the scan in progress, if scan is in progress
			btMode.stopListDevices = function () {
				// TODO status.scanning property is not used.
				bluetoothle.stopScan (
					function (obj) {
						// If a postScan callback exists, it should be called independent of status
						if (btMode.postScanCallback != null) {
							btMode.postScanCallback();
							btMode.postScanCallback = null; // Remove so it won't be called multiple times
						}
						// If an unknown status exists, tell debug
						if (obj.status !== "scanStopped") {
							debugOut.warn.println("StopScanFailure: Unknown status: " + obj.status);
						}
					},
					function(obj){
						if (obj.message === "Not scanning") {
							// If a postScan callback exists, it should be called
							if (btMode.postScanCallback != null) {
								btMode.postScanCallback(); // Remove so it won't be called multiple times
								btMode.postScanCallback = null;
							}
							// Tell debug
							debugOut.warn.println("StopScanFailure: " + obj.error + " - " + obj.message);
						} else {
							debugOut.err.println("StopScanFailure: " + obj.error + " - " + obj.message);
						}
					}
				);
			};
			// ------------------ END SCAN ------------------------
			
			
			
			
			
			// ------------------ CONNECT ------------------
			// connectDevice: connecting to device with id
			btMode.connectDevice = function (id, successCallback) {
				debugOut.notify.println("btle: connect to: " + id);
				// Remember address
				btMode.address = id;
				
				// Stop scan if needed
				if (btMode.timers.scanning !== null){
					clearTimeout(btMode.timers.scanning);
					btMode.timers.scanning = null;
					btMode.stopListDevices();
					debugOut.notify.println("btle: Scan stopped");
				}
				// Connect
				bluetoothle.connect (
						function(obj) {
							if (obj.status == "connected") {
								
								// Clear connect timeout
								if (btMode.timers.connecting !== null) {
									clearTimeout(btMode.timers.connecting);
									btMode.timers.connecting = null;
								}
								
								// Update status
								btMode.status.connected = true;
								btMode.status.failure = false;
								updateScreen();
								
								debugOut.notify.println("btle: Connection initialized");
								
								// -------- PLATFORM DEPENDENT CALLS ----------
								// The path from here is platform dependent
								if (window.device.platform == btMode.platforms.iOS) {
									btMode.discoverIOS(id, successCallback);
								} else if (window.device.platform == btMode.platforms.android) {
									btMode.discoverAndroid(id, successCallback);
								} else {
									// In case someone is building for non-iOS/non-Android, we can tell them that it won't work
									alert ("This platform is not supported");
								}
								//---------------------------------------------
								
							} else if (obj.status != "connecting") {
								// Still connecting. Do nothing special.
								btMode.status.connected = false;
								btMode.status.ready = false;
								updateScreen();
							}
						},
						
						function(obj) {
							// Connection failed
							btMode.status.connected = false;
							btMode.status.ready = false;
							btMode.status.failure = true;
							debugOut.err.println("ConnectFailure: " + obj.error + " - " + obj.message);
							// Clear connect timeout
							if (btMode.timers.connecting !== null) {
								clearTimeout(btMode.timers.connecting);
								btMode.timers.connecting = null;
							}
							updateScreen ();
						},
						
						{"address":id}
				);
				plab.timers.connect = setTimeout(btMode.stopListDevices, 5000);
			};
			// ------------------ END CONNECT ------------------
			
			
			// ------------------ DISCONNECT ------------------
			// disconnectDevice: Disconnects from connected device (if connected)
			btMode.disconnectDevice = function () {
				// closeDev: Anonymous function that is called after disconnect of device.
				// TODO Is anonymity the right way to go?
				// Will close the device, removing all traces of connection.
				var closeDev = function() {
					btMode.status.connected = false;
					btMode.status.ready = false;
					bluetoothle.close(
							function (obj) {
								if (obj.status == "closed") {
									btMode.address = null;
								} else {
									debugOut.warn("CloseFailure: Unknown status: " + obj.status);
								}
							},
							function (obj) {
								debugOut.err.println("CloseFailure: " + obj.error + " - " + obj.message);
							},
							{"address":btMode.address}
					);
				};
				
				// Do disconnect
				if (btMode.status.connected || btMode.address !== null) {
					bluetoothle.disconnect(
						function (obj) {
							if (obj.status == "disconnected") {
								// Do close
								closeDev();
							} else if (obj.status == "disconnecting") {
								// Allowed to stand if needed later
							} else {
								// Allowed to stand if needed later
							}
						},
						function (obj) {
							// Failure: Ensure the connection is closed
							debugOut.err.println("DisconnectFailure: " + obj.error + " - " + obj.message);
							closeDev();
						},
						{"address":btMode.address}
					);
				}
				btMode.status.ready = false;
			};
			// ------------------ END DICCONNECT ------------------
			
			
			
			// -------------- SEND / RECEIVE ------------
			btMode.send = function (text) {
					// Must be connected to send data
					if (btMode.status.connected) {
						// Build the info object that holds receiver and data
						var params = {
								"address" : btMode.address,
								"value" : bluetoothle.bytesToEncodedString(bluetoothle.stringToBytes(text)),
								"serviceUuid" : btMode.serviceInfo.serviceUUID,
								"characteristicUuid" : btMode.serviceInfo.txUUID,
								"type" : "noResponse"
						};
						// Write to the service characteristic
						bluetoothle.write (
								function (obj) {},
								function (obj) {
									debugOut.err.println("WriteFailure: " + obj.error + " - " + obj.message);
								},
								params
						);
						
					} else {
						debugOut.warn.println("WriteFailure: Not connected");
					}
			};
			
			// receiveCallback: add a function to be called when device sends us data
			btMode.receiveCallback = function (callback) {
				btMode.subscriptions[btMode.subscriptions.length] = callback;
			};
			// -------------- END SEND / RECEIVE ------------
		}
		
		// -------------- INIT -------------------
		if (!btMode.status.initialized) {
			bluetoothle.initialize(
					
					function(obj) {
						if (obj.status == "enabled") {
							btMode.status.initialized = true;
							updateScreen();
						} else {
							debugOut.warn.println("InitializeFailure: Unknown status: " + obj.status);
						}
					},
					
					function(obj) {
						// Failure to initialize
						btMode.status.failure = true;
						debugOut.err.println("InitializeFailure: " + obj.error + " - " + obj.message);
						updateScreen();
					},
					
					{"request":false}
			);
		}
		// -------------- END INIT -------------------
		
	};
	
	// Add mode to parent app
	debugOut.notify.println("[" + btMode.id + "]: Mode created");
	plabBT.addMode(btMode);
	// Add service change setting
	plab.settingsController.addSettingItem({
				"id" : "plab-btle-service",
				"text-key" : "btle-servive-select",
				
				"type" : "single-select",
				"options" : [{
				            	 "text-key" : "btle-default",
				            	 "value" : "default"
				            },
				            {
				            	 "text-key" : "btle-nordic",
				            	 "value" : "nordic"
				            }],
				"default-value" : "default",
				"description-text-key" : "btle-service-select-desc",
				"onValueChange" : function(string){
					btMode.serviceInfo = btMode.supportedServices[string];
				}
		});
	var serviceSet = plab.settingsController.getSettingValue("plab-btle-service");
	if (serviceSet !== null) {
		btMode.serviceInfo = btMode.supportedServices[serviceSet];
	}
}

// Adding the btle module must be done after device is ready.
document.addEventListener(
		"deviceready",
		function() {
			plabAddBT4_0(plab.out, plab.updateScreen);
		}, 
		false
);
