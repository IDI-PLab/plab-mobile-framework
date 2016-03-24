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
 +		postConnectSuccessCallback : null/function(),	// Callback triggered after connection has successfully completed

 +		subscriptions : [],				// List of subscribers for messages from this mode
 +		startSubscribe : function(address) {},	// Starts subscription to serial communication on device
 +		subscribeSuccess : function(params) {},
 +		subscribeFailure : function(params) {},

 +		platforms : {					// Code differs based on platform
 +			iOS : "iOS",
 +			android : "Android"
 +		},

 +		receiveString : "",				// Concatenate strings until newline is met.
 +		discoverSuccess : function(params) {},			// params = {"address" : ""}
 +		discoverFailure : function(params) {},			// params = {"address" : "", "error":"", "message":""}
 +		discoverAndroid : function (address) {},		// Android specific discovery
 +		discoverIOS : function (address) {},			// iOS specific discovery

 openMode : function () {},
 closeMode : function () {},

 listDevices : function (listCallback, scanTime, scanStoppedCallback) {},
 stopListDevices : function () {},

 connectDevice : function (id, successCallback) {},
 disconnectDevice : function () {},

 +		connectSuccess : function(params) {},
 +		connectFailure : function(params) {},

 +		disconnectSuccess = function(params) {};
 +		disconnectFailure = function(params) {};
 +		disconnectByAddress : function(address) {},
 +		closeByAddress : function(address) {},
 +		closeSuccess = function(params) {};
 +		closeFailure = function(params) {};

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
function plabAddBT4_0(debugOut, updateScreen) {

	debugOut.notify
			.println("[BlueTooth_4.0_randdusing]: Attempting to create btle support");
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
	btMode.postConnectSuccessCallback = null;
	btMode.supportedServices = {
		"default" : {
			serviceUUID : "FFE0",
			txUUID : "FFE1",
			rxUUID : "FFE1"
		},
		"nordic" : {
			serviceUUID : "6E400001-B5A3-F393-E0A9-E50E24DCCA9E",
			txUUID : "6E400002-B5A3-F393-E0A9-E50E24DCCA9E",
			rxUUID : "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"
		}
	};
	btMode.serviceInfo = {
		serviceUUID : "FFE0", // unique identifier for the Service used for communication
		txUUID : "FFE1", // unique identifier for the TX Characteristic (Property = Notify)
		rxUUID : "FFE1" // unique identifier for the RX Characteristic (Property = Write without response)
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
	 * startSubscribe: after connection is completed, we need to start listening
	 * to incoming messages. This function can be called to start subscription
	 * to the service providing the serial communication.
	 */
	btMode.startSubscribe = function(address) {
		debugOut.notify.println("Subscribe called");
		// The info object for the subscription
		var params = {
			"address" : address,
			"service" : btMode.serviceInfo.serviceUUID,
			"characteristic" : btMode.serviceInfo.rxUUID,
			"isNotification" : true
		};

		// do subscribe
		bluetoothle.subscribe(btMode.subscribeSuccess, btMode.subscribeFailure, params);

	};


	btMode.subscribeSuccess = function(params) {
		if (params.status == "subscribedResult") {
			// Debug output
			debugOut.notify.print("Received data: ");
			debugOut.notify.println(JSON.stringify(params));

			btMode.status.failure = false;

			// Translate received message to real string
			var recString = bluetoothle.bytesToString(bluetoothle.encodedStringToBytes(params.value));

			// See if we received an "end of message" (aka newline)
			if (recString.indexOf('\n') === -1) {
				btMode.receiveString += recString;
			} else {

				// We received at least one message. concat the old string with the new
				recString = btMode.receiveString + recString;
				// Split on newline
				var splitString = recString.split("\n");

				// Send all completed messages to listeners
				for ( var i = 0; i < splitString.length - 1; i++) {
					// Pass split messages to subscribers
					debugOut.notify.println("Message passed on: " + splitString[i]);
					for ( var j = 0; j < btMode.subscriptions.length; j++) {
						btMode.subscriptions[j](splitString[i]);
					}
				}
				// Remember string element after last split
				btMode.receiveString = splitString[splitString.length - 1];
			}

		} else if (params.status == "subscribed") {
			// Everything good, and we may update status to ready
			debugOut.notify.print("Subscription done");
			btMode.status.failure = false;
			btMode.status.ready = true;
			updateScreen();
			if (btMode.postConnectSuccessCallback !== null) {
				btMode.postConnectSuccessCallback();
				btMode.postConnectSuccessCallback = null;
			}
		} else {
			// This should not occur.
			debugOut.err.println("UnknownSubscribeStatus");
			btMode.status.ready = false;
			btMode.status.failure = true;
			updateScreen();
			btMode.postConnectSuccessCallback = null;
			btMode.disconnectByAddress(params.address);
		}
	};


	btMode.subscribeFailure = function(params) {
		debugOut.err.println("SubscribeFailure: " + obj.error + " - " + obj.message);
		btMode.status.ready = false;
		btMode.status.failure = true;
		updateScreen();
		btMode.postConnectSuccessCallback = null;
		// Since we do not know the address from anywhere else, we must try to
		// disconnect
		btMode.disconnectDevice();
	};


	// discoveredService: called after service has been totally discovered.
	// Starts serial communication.
	btMode.discoverSuccess = function(params) {
		// params = {"address" : ""}
		btMode.startSubscribe(params.address);
	};


	btMode.discoverFailure = function(params) {
		// params = {"address" : "", "error":"", "message":""}
		debugOut.err.println("Discovery of " + params.address + " failed: " + params.error + " - " + params.message);
		btMode.postConnectSuccessCallback = null;
		btMode.status.ready = false;
		btMode.status.failure = true;
		updateScreen();
		disconnectByAddress(params.address);
	};



	// ------------------------------------------------------------------------
	// ---- START PLATFORM SPECIFIC DISCOVERY ---------------------------------
	// ------------------------------------------------------------------------

	// ---------------- START ANDROID -----------------------------------------
	// discoverAndroid: Android specific discovery
	btMode.discoverAndroid = function(address) {
		debugOut.notify.println("btle: discoverAndroid called");
		bluetoothle.discover(
			function(obj) {
				debugOut.notify.println(JSON.stringify(obj));
				if (obj.status == "discovered") {
					// The device was discovered. Check if we found the correct connection data
					var found = {
						service : false,
						rx : false,
						tx : false
					};

					// Service, rx and tx uuids. Used for discovered confirmation.
					var sUuid = btMode.serviceInfo.serviceUUID.toUpperCase();
					var rxUuid = btMode.serviceInfo.rxUUID.toUpperCase();
					var txUuid = btMode.serviceInfo.txUUID.toUpperCase();

					// Find the service, and set found properties properly
					// --- START services
					obj.services.forEach(function(service) {
						debugOut.notify.println("Service");
						if (service.uuid.toUpperCase() == sUuid) {
							found.service = true;
							// Service found. Find rx and tx characteristics

							// --- START characteristics
							service.characteristics.forEach(function(characteristic) {
								debugOut.notify.println("Characteristic");
								var uuid = characteristic.uuid.toUpperCase();

								if (uuid === txUuid) {
									// Pleonasm aka code bloat?
									if (typeof characteristic.properties.writeWithoutResponse !== "undefined"
											&& characteristic.properties.writeWithoutResponse) {
										found.tx = true;
									}
								}

								if (uuid === rxUuid) {
									// Pleonasm aka code bloat?
									if (typeof characteristic.properties.notify !== "undefined"
											&& characteristic.properties.notify) {
										found.rx = true;
									}
								}
							}); // --- END characteristics
						}
					}); // --- END services

					// Call post platform specific discovery
					// functionality
					if (found.service && found.rx && found.tx) {
						btMode.discoverSuccess({"address" : obj.address});
					} else {
						btMode.discoverFailure({
							"address" : obj.address,
							"error" : "ServiceNotFound",
							"message" : "Service: " + found.service
									+ " RX: " + found.rx + " TX: "
									+ found.tx
						});
					}
				} else {
					btMode.discoverFailure({
						"address" : obj.address,
						"error" : "unknown status",
						"message" : obj.status
					});
				}
			},
			
			function(obj) {
				btMode.discoverFailure({
					"address" : address,
					"error" : obj.error,
					"message" : obj.message
				});
			},
			
			{ "address" : address }
		);
	};
	// ---------------- END ANDROID -------------------------------------------

	// ---------------- START iOS ---------------------------------------------
	// discoverIOS: iOS specific discovery
	btMode.discoverIOS = function(address) {
		debugOut.notify.println("btle: discoverIOS called");

		// Service, rx and tx uuids
		var sUuid = btMode.serviceInfo.serviceUUID.toUpperCase();
		var rxUuid = btMode.serviceInfo.rxUUID.toUpperCase();
		var txUuid = btMode.serviceInfo.txUUID.toUpperCase();
		// rx and tx uuid combined in an array
		var rntxUuid = rxUuid === txUuid ? [ rxUuid ] : [ rxUuid, txUuid ];

		// The parameters to service discovery
		var servicesParams = {
			"address" : address,
			"services" : [ sUuid ]
		};
		// The parameters to characteristics discovery
		var characteristicParams = {
			"address" : address,
			"service" : sUuid,
			"characteristics" : rntxUuid
		};

		// Do service discovery
		bluetoothle.services(
			function(obj) {
				if (obj.status == "services" && obj.services.length > 0) {

					// The service has been found. We can now
					// discover
					// characteristics
					bluetoothle.characteristics(
						function(obj) {
							if (obj.status == "characteristics") {
								// Some characteristics
								// have been found.
								// Checking for both tx
								// and rx
								// correctness
								var found = {
									rx : false,
									tx : false
								};
								// --- START characteristics loop
								obj.characteristics.forEach(function(characteristic) {
									var uuid = characteristic.uuid.toUpperCase();

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
								}); // --- END characteristics loop

								// Assuming we do not need to discover descriptors, we are done
								if (found.rx && found.tx) {
									btMode.discoverSuccess({"address" : obj.address});
								} else {
									btMode.discoverFailure({
										"address" : obj.address,
										"error" : "CharacteristicNotFound",
										"message" : "RX: " + found.rx + " TX: " + found.tx
									});
								}
							} else {
								btMode.discoverFailure({
									"address" : obj.address,
									"error" : "unknown status",
									"message" : obj.status
								});
							}
						},
						
						function(obj) {
							btMode.discoverFailure({
								"address" : address,
								"error" : obj.error,
								"message" : obj.message
							});
						}, characteristicParams
					);
					// if (obj.status == "services" &&
					// obj.services.length >
					// 0) {
				} else {
					if (obj.services.length <= 0) {
						btMode.discoverFailure({
							"address" : obj.address,
							"error" : "ServiceNotFound",
							"message" : "Service was not discovered"
						});
					} else {
						btMode.discoverFailure({
							"address" : obj.address,
							"error" : "unknown status",
							"message" : obj.status
						});
					}
				}
			},

			function(obj) {
				btMode.discoverFailure({
					"address" : address,
					"error" : obj.error,
					"message" : obj.message
				});
			},

			servicesParams
		);
	};
	// ---------------- END iOS -----------------------------------------------

	// ------------------------------------------------------------------------
	// ---- END PLATFORM SPECIFIC DISCOVERY -----------------------------------
	// ------------------------------------------------------------------------

	// Replacing the open mode function -> init the mode
	btMode.openMode = function() {
		if (!btMode.status.started) {
			btMode.status.started = true;
			// First run -> set up
			btMode.closeMode = function() {
				// Remove all listeners
				btMode.subscriptions = [];
				// Close open connections
				btMode.disconnectDevice();

				// Update status
				btMode.status.connected = false;
				btMode.status.ready = false;
				btMode.status.failure = false;
				btMode.receiveString = "";

				// Call and clear scanning
				btMode.stopListDevices();
			};

			// ------------------ SCAN ----------------------------------------

			// listDevices: scans and return callbacks for found devices.
			btMode.listDevices = function(listCallback, scanTime,
					scanStoppedCallback) {
				// Remember the callback that will be called after scan has
				// stopped
				btMode.postScanCallback = scanStoppedCallback;
				// Holding scan results as an object storing the IDs of the
				// found devices.
				// On some devices the startScan returns the same device
				// multiple times.
				var scanResults = {};
				// Anonymous function that scans for devices. A device is only
				// added once
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
									btMode.status.scanning = true;
									btMode.timers.scanning = setTimeout(
											btMode.stopListDevices,
											scanTime);
								} else {
									debugOut.err
											.println("StartScanFailure: Unknown status: "
													+ obj.status);
								}
							},
							
							function(obj) {
								// Scan failure function
								btMode.status.failure = true;
								debugOut.err
										.println("ScanFailure: "
												+ obj.error + " - "
												+ obj.message);
								updateScreen();
							},
							
							null
						);
					} else {
						// If the btle status is not initialized, warn and wait
						// for some time before scan
						debugOut.warn.println("Device not initialized, delaying scan!");
						setTimeout(scan, 500);
					}
				};
				setTimeout(scan, 500);
			};

			// stopListDevices: stops the scan in progress, if scan is in
			// progress
			btMode.stopListDevices = function() {
				// Stop stop scan callback
				if (btMode.timers.scanning !== null) {
					clearTimeout(btMode.timers.scanning);
					btMode.timers.scanning = null;
				}

				if (btMode.status.scanning) {
					bluetoothle.stopScan(
						function(obj) {
							// If a postScan callback exists, it should be called independent of status
							if (btMode.postScanCallback != null) {
								btMode.postScanCallback();
								btMode.postScanCallback = null; // Remove so it won't be called multiple times
							}
							// If an unknown status exists, tell debug
							if (obj.status !== "scanStopped") {
								debugOut.warn.println("StopScanFailure: Unknown status: " + obj.status);
							}
							btMode.status.scanning = false;
						},
						function(obj) {
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
							btMode.status.scanning = false;
						}
					);
				}
			};
			// ------------------ END SCAN ------------------------

			// ------------------ CONNECT ------------------
			// connectDevice: connecting to device with id
			btMode.connectDevice = function(id, successCallback) {
				if (btMode.address !== null) {
					debugOut.warn.println("Tried to connect to device while still connected! Now disconnecting");
					btMode.disconnectDevice();
					return;
				}
				debugOut.notify.println("btle: connect to: " + id);
				// Remember address
				btMode.address = id;

				// Remember callback
				btMode.postConnectSuccessCallback = successCallback;

				// Stop scan if needed
				btMode.stopListDevices();
				// Connect
				var params = { "address" : id };
				bluetoothle.connect(btMode.connectSuccess, btMode.connectFailure, params);
				// In case connect does not return in time, we set a timeout of 5 seconds before disconnect
				btMode.timers.connecting = setTimeout(btMode.disconnectDevice, 5000);
			};

			// Connect callbacks
			btMode.connectSuccess = function(params) {
				if (params.status == "connected") {

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
						btMode.discoverIOS(params.address);
					} else if (window.device.platform == btMode.platforms.android) {
						btMode.discoverAndroid(params.address);
					} else {
						// In case someone is building for
						// non-iOS/non-Android, we can tell them
						// that it won't work
						alert("This platform is not supported");
					}
					// ---------------------------------------------

				} else if (params.status == "connecting") {
					bebugOut.notify.println("Device is connecting");
					// Still connecting. Do nothing special.
					btMode.status.connected = false;
					btMode.status.ready = false;
					updateScreen();
				} else if (params.status == "disconnected") {
					// Device suddenly disconnected. We should close it (we do
					// no attempt at reconnection)
					debugOut.warn.println("Device unexpectedly disconnected");
					btMode.status.connected = false;
					btMode.status.ready = false;
					updateScreen();
					btMode.closeByAddress(params.address);
				} else {
					debugOut.err.println("ConnectUnknownStatus" + params.status);
				}
			};

			btMode.connectFailure = function(params) {
				// Connection failed
				btMode.status.connected = false;
				btMode.status.ready = false;
				btMode.status.failure = true;
				debugOut.err.println("ConnectFailure: " + params.error + " - "
						+ params.message);
				// Clear connect timeout
				if (btMode.timers.connecting !== null) {
					clearTimeout(btMode.timers.connecting);
					btMode.timers.connecting = null;
				}
				updateScreen();
			};

			// ------------------ END CONNECT ------------------

			// ------------------ DISCONNECT ------------------
			// disconnectDevice: Disconnects from connected device (if connected)
			btMode.disconnectDevice = function() {
				if (btMode.address === null) {
					debugOut.warn.println("Disconnect called, but address was not set");
				} else {
					btMode.disconnectByAddress(btMode.address);
				}
			};

			// Disconnect callbacks
			btMode.disconnectSuccess = function(params) {
				if (params.status == "disconnected") {
					debugOut.notify.println("Disconnected from " + params.name);
					btMode.closeByAddress(params.address);
				} else if (params.status == "disconnecting") {
					debugOut.notify.println("Disconnecting from " + params.name + ", address " + params.address);
				} else {
					debugOut.err.println("Disconnect failure: Unknown status: " + params.status);
					btMode.status.failure = true;
					updateScreen();
					return;
				}

				btMode.status.ready = false;
				btMode.status.failure = false;
				if (btMode.address == params.address) {
					btMode.address = null;
					btMode.status.connected = false;
				}
				updateScreen();
			};

			btMode.disconnectFailure = function(params) {
				debugOut.err.println("DisconnectFailure: " + params.error + " - " + params.message);
				btMode.status.failure = true;
				if (btMode.address !== null) {
					var addr = btMode.address;
					btMode.address = null;
					btMode.closeByAddress(addr);
				}
				updateScreen();
			};

			// Do disconnect
			btMode.disconnectByAddress = function(address) {
				debugOut.notify.println("Disconnecting from: " + address);
				var params = { "address" : address };
				bluetoothle.disconnect(btMode.disconnectSuccess, btMode.disconnectFailure, params);
			};

			// Do close device (after disconnect)
			btMode.closeByAddress = function(address) {
				debugOut.notify.println("Closing device: " + address);
				var params = { "address" : address };
				bluetoothle.close(btMode.closeSuccess, btMode.closeFailure, params);
			};

			// Close callbacks
			btMode.closeSuccess = function(params) {
				if (params.status == "closed") {
					debugOut.notify.println("Close successful");
					btMode.status.ready = false;
					btMode.status.connected = false;
					btMode.status.failure = false;
				} else {
					debugOut.err.println("Close failure: Unknown status: " + params.status);
					btMode.status.failure = true;
				}
				updateScreen();
			};

			btMode.closeFailure = function(params) {
				debugOut.err.println("CloseFailure: " + params.error + " - " + params.message);
				btMode.status.failure = true;
				updateScreen();
			};

			// ------------------ END DICCONNECT ------------------

			// -------------- SEND / RECEIVE ------------
			btMode.send = function(text) {
				// Must be connected to send data
				if (btMode.status.connected) {
					// Build the info object that holds receiver and data
					var params = {
						"address" : btMode.address,
						"value" : bluetoothle.bytesToEncodedString(bluetoothle
								.stringToBytes(text)),
						"service" : btMode.serviceInfo.serviceUUID,
						"characteristic" : btMode.serviceInfo.txUUID,
						"type" : "noResponse"
					};
					// Write to the service characteristic
					bluetoothle.write(
						function(obj) {},
						
						function(obj) {
							debugOut.err.println("WriteFailure: " + obj.error + " - " + obj.message);
						},
						
						params
					);

				} else {
					debugOut.warn.println("WriteFailure: Not connected");
				}
			};

			// receiveCallback: add a function to be called when device sends us
			// data
			btMode.receiveCallback = function(callback) {
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

				{ "request" : false }
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
		"options" : [
			{
				"text-key" : "btle-default",
				"value" : "default"
			},
			{
				"text-key" : "btle-nordic",
				"value" : "nordic"
			}
		],
		"default-value" : "default",
		"description-text-key" : "btle-service-select-desc",
		"onValueChange" : function(string) {
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
