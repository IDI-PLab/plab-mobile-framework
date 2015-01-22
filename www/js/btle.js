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
 * The services available for the bluetooth device we should use are:
 * 1800: Generic Access {2a00,2a01,2a02,2a03,2a04}
 *         All characteristics are read only. @see https://developer.bluetooth.org/gatt/services/Pages/ServiceViewer.aspx?u=org.bluetooth.service.generic_access.xml
 * 1801: Generic Attribute {2a05}
 *         This tells if service has changed
 * ffe0: Default service currently used to communicate with bt device.
 */

/*
 * Reference, describes the object. comments within the comment imply added fields.
var plabBTMode = {
		id : "",
		name : "",
		status : {
			initialized : false,
			connected : false,
			ready : false,
			failure : false
		},
		
		// serviceInfo : {
		//	serviceUUID : "FFE0", // for the Service
		//	txUUID :  "FFE1", // for the TX Characteristic (Property = Notify)
		//	rxUUID : "FFE1" // for the RX Characteristic (Property = Write without response)
		//},
		
		// timers : {
		//	scanning : null,
		//	connecting : null
		// }
		// address : null
		
		// subscriptions : []
		// startSubscribe : function() {},
		
		//platforms : {
			iOS : "iOS",
			android : "Android"
		//},
		
		openMode : function () {},
		closeMode : function () {},
		
		listDevices : function (listCallback, scanTime) {},
		stopListDevices : function () {},
		
		connectDevice : function (id) {},
		disconnectDevice : function () {},
		
		send : function (text) {},
		receiveCallback : function (callback) {}
}
 *
 */
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
	btMode.serviceInfo = {
		serviceUUID : "FFE0", // for the Service
		txUUID :  "FFE1", // for the TX Characteristic (Property = Notify)
		rxUUID : "FFE1" // for the RX Characteristic (Property = Write without response)
	};
	btMode.subscriptions = [];
	btMode.platforms = {
		iOS : "iOS",
		android : "Android"
	};
	
	btMode.startSubscribe = function () {
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
							debugOut.notify.print("Mottok data: ");
							debugOut.notify.println(JSON.stringify(obj));
							// Pass to subscribers
							for (var i = 0; i < btMode.subscriptions.length; i++) {
								btMode.subscriptions[i](bluetoothle.bytesToString(bluetoothle.encodedStringToBytes(obj.value)));
							}
						} else if (obj.status == "subscribed") {
							// Everything good, and we may update status to ready
							debugOut.notify.print("Subscription done, Everything is good");
							btMode.status.ready = true;
							updateScreen();
						} else {
							debugOut.err.println("UnknownSubscribeStatus");
						}
					} catch (e) {
						debugOut.err.println("SubscribeFailure: " + e.message);
					}
				},
				function (obj) {
					debugOut.err.println("SubscribeFailure: " + obj.error + " - " + obj.message);
				},
				params
		);
		
	};
	
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
				
				// Call and clear scanners
				if (btMode.timers.scanning !== null) {
					clearTimeout(btMode.timers.scanning);
					btMode.timers.scanning = null;
					btMode.stopListDevices();
				}
			};
			
			// ------------------ SCAN ------------------------
			btMode.listDevices = function (listCallback, scanTime) {
				var scan = function() {
					if (btMode.status.initialized) {
						debugOut.notify.println("Starting scan");
						bluetoothle.startScan(
								function(obj) {
									debugOut.notify.println("Scan result: " + JSON.stringify(obj));
									if (obj.status == "scanResult") {
										// Create the descriptor
										var name = obj.name === null ? "? - " + obj.address : obj.name;
										var desc = plabBT.createDeviceDescriptor(obj.address, name);
										listCallback(desc);
									} else if (obj.status == "scanStarted") {
										btMode.timers.scanning = setTimeout(btMode.stopListDevices, scanTime);
									} else {
										debugOut.warn.println("StartScanFailure: Unknown status: " + obj.status);
									}
								},
								function(obj) {
									btMode.status.failure = true;
									debugOut.err.println("ScanFailure: " + obj.error + " - " + obj.message);
									updateScreen();
								},
								null
						);
					} else {
						debugOut.warn.println("Device not initialized, delaying scan!");
						setTimeout(scan, 500);
					}
				};
				scan();
			};
			btMode.stopListDevices = function () {
				bluetoothle.stopScan (
					function (obj) {
						if (obj.status !== "scanStopped") {
							debugOut.warn.println("StopScanFailure: Unknown status: " + obj.status);
						}
					},
					function(obj){
						if (obj.message === "Not scanning") {
							debugOut.warn.println("StopScanFailure: " + obj.error + " - " + obj.message);
						} else {
							debugOut.err.println("StopScanFailure: " + obj.error + " - " + obj.message);
						}
					}
				);
			};
			// ------------------ END SCAN ------------------------
			
			
			
			
			
			// ------------------ CONNECT ------------------
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
								// common function after discovery
								var common = function (success) {
									if (success) {
										debugOut.notify.println("btle: Connection successful");
										// Do callback
										successCallback();
										// Start message subscription
										btMode.startSubscribe();
										// We are not ready until subscription is done
									} else {
										// Alert that UART failed
										debugOut.err.println("DiscoverFailure: Failed to discover UART service");
										btMode.status.failure = true;
									}
								};
								
								// The path from here is platform dependent
								if (window.device.platform == btMode.platforms.iOS) {
									debugOut.notify.println("btle: iOS detected");
									// iOS: Discover only the service we want to connect to
									bluetoothle.services (
											function (obj) {
												// TODO Make more robust
												// Assuming correct service was discovered
												if (obj.status == "services") {
													var params = {
															"address" : btMode.address,
															"serviceUuid" : btMode.serviceInfo.serviceUUID,
															"characteristicUuids" : [ btMode.serviceInfo.txUUID, btMode.serviceInfo.rxUUID ]
													};
													bluetoothle.characteristics (
															function (obj) {
																// TODO Make more robust
																// Assuming correct characteristic discovered
																if (obj.status == "characteristics") {
																	var params1 = {
																			"address" : btMode.address,
																			"serviceUuid" : btMode.serviceInfo.serviceUUID,
																			"characteristicUuid" : btMode.serviceInfo.txUUID
																	};
																	var params2 = {
																			"address" : btMode.address,
																			"serviceUuid" : btMode.serviceInfo.serviceUUID,
																			"characteristicUuid" : btMode.serviceInfo.rxUUID
																	};
																	// Bruteforcer gjennom listen
																	bluetoothle.descriptors (
																			
																			function (obj) {
																				if (obj.status == "descriptors") {
																					bluetoothle.descriptors (
																							
																							function (obj1) {
																								if (obj1.status == "descriptors") {
																									common(true);
																								} else {
																									debugOut.err.println("DescriptorsFailure: Unknown status: " + obj1.status);
																									btMode.disconnectDevice();
																								}
																							},
																							
																							function (obj1) {
																								debugOut.err.println("DescriptorsFailure: " + obj1.error + " - " + obj1.message);
																								btMode.disconnectDevice ();
																							},
																							params2
																					);
																				} else {
																					debugOut.err.println("DescriptorsFailure: Unknown status: " + obj.status);
																					btMode.disconnectDevice ();
																				}
																			},
																			
																			function (obj) {
																				debugOut.err.println("DescriptorsFailure: " + obj.error + " - " + obj.message);
																				btMode.disconnectDevice ();
																			},
																			params1
																	);
																} else {
																	debugOut.err.println("CharacteristicsFailure: Unknown status: " + obj.status);
																	btMode.disconnectDevice ();
																}
															}, 
															function (obj) {
																debugOut.err.println("CharacteristicsFailure: " + obj.error + " - " + obj.message);
																btMode.disconnectDevice ();
															},
															params
													);
												} else {
													debugOut.err.println("ServicesFailure: Unknown status: " + obj.status);
													btMode.disconnectDevice ();
												}
											},
											function (obj) {
												debugOut.err.println("ServicesFailure: " + obj.error + " - " + obj.message);
												btMode.disconnectDevice ();
											},
											{"address":id , "serviceUuids":[btMode.serviceInfo.serviceUUID]}
									);
								} else if (window.device.platform == btMode.platforms.android) {
									debugOut.notify.println("btle: android detected");
									// android: discover discovers all services and descriptors
									bluetoothle.discover (
											function (obj) {
												if (obj.status == "discovered") {
													// TODO check if service is available
													common(true);
												} else {
													debugOut.err.println("DiscoverFailure: Unknown status: " + obj.status);
													btMode.disconnectDevice ();
												}
											},
											function (obj) {
												debugOut.err.println("DiscoverFailure: " + obj.error + " - " + obj.message);
												btMode.disconnectDevice ();
											},
											{"address" : id}
									);
								} else {
									// Greit aa si ifra om at dette ikke vil fungere, vi stoetter bare iOS/android
									alert ("This platform is not supported");
								}
								
							} else if (obj.status != "connecting") {
								// Holder paa med tilkobling enda, ikke gjoer noe spesielt
								btMode.status.connected = false;
								btMode.status.ready = false;
								updateScreen();
							}
						},
						function(obj) {
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
			
			
			// ------------------ DICCONNECT ------------------
			btMode.disconnectDevice = function () {
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
				if (btMode.status.connected || btMode.address !== null) {
					bluetoothle.disconnect(
						function (obj) {
							if (obj.status == "disconnected") {
								closeDev();
							} else if (obj.status == "disconnecting") {
								// Allowed to stand if needed later
							} else {
								// Allowed to stand if needed later
							}
						},
						function (obj) {
							// Ensure the connection is closed
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
					if (btMode.status.connected) {
						var params = {
								"address" : btMode.address,
								"value" : bluetoothle.bytesToEncodedString(bluetoothle.stringToBytes(text)),
								"serviceUuid" : btMode.serviceInfo.serviceUUID,
								"characteristicUuid" : btMode.serviceInfo.txUUID,
								"type" : "noResponse"
						};
						bluetoothle.write (
								function (obj) {},
								function (obj) {
									debugOut.err.println("WriteFailure: " + obj.error + " - " + obj.message);
								},
								params
						);
						/*
						 * This code was in the original app. It may be more safe.
						 * It is maintained for REFERENCE/HISTORIC VALUE ONLY
						bluetoothle.isConnected (
							function (conn) {
								if (conn.isConnected) {
									bluetoothle.write (
											function (obj) {},
											function (obj) {
												plab.notifyErrorString ("WriteFailure: " + obj.error + " - " + obj.message);
											},
											params
									);
								} else {
									plab.afterReconnect[plab.afterReconnect.length] = function() {
										plab.write(string);
									};
									plab.reconnect ();
								}
							}
						);
						*/
						
					} else {
						debugOut.warn.println("WriteFailure: Not connected");
					}
			};
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
						btMode.status.failure = true;
						debugOut.err.println("InitializeFailure: " + obj.error + " - " + obj.message);
						updateScreen();
					},
					
					{"request":false}
			);
		}
		// -------------- END INIT -------------------
		
	};
	debugOut.notify.println("[" + btMode.id + "]: Mode created");
	plabBT.addMode(btMode);
}

// Adding the btle module must be done after device is ready.
document.addEventListener(
		"deviceready",
		function() {
			plabAddBT4_0(plab.out, plab.updateScreen);
		}, 
		false
);

// The following code was previously held in index.js. It should not be there as it is technology dependent
// It is held here to show how reconnect was done in the original app. This is no longer valid of course.
// REFERENCE/HISTORIC VALUE ONLY
/*
//RECONNECT
// reconnect kjoeres hvis en tilkobling feiler og vi proever aa koble til igjen
reconnect : function () {
	if (!this.btInfo.reconnecting) {
		this.btInfo.reconnecting = true;
		bluetoothle.reconnect (plab.reconnectSuccess, plab.reconnectFailure);
		plab.timers.reconnect = setTimeout (reconnectTimeout, 5000);
	}
},
reconnectSuccess : function(obj) {
	if (obj.status == "connected") {
		plab.clearReconnectTimeout ();
		for (var i = 0; i < plab.afterReconnect.length; i++) {
			plab.afterReconnect[i] ();
		}
		plab.btInfo.reconnecting = false;
		plab.afterReconnect.length = 0;
	} else if (obj.status == "connecting") {
		// Lar denne staa om vi oppdager noe vi trenger den til.
	} else {
		plab.disconnectDevice ();
		plab.btInfo.reconnecting = false;
		plab.clearReconnectTimeout ();
	}
},
reconnectFailure : function (obj) {
	plab.clearReconnectTimeout ();
	plab.btInfo.connected = false;
	plab.btInfo.reconnecting = false;
	plab.btInfo.failed = true;
	plab.notifyErrorString ("ReconnectFailure: " + obj.error + " - " + obj.message);
	plab.updateScreen ();
},
reconnectTimeout : function () {
	plab.btInfo.connected = false;
	plab.btInfo.reconnecting = false;
	plab.btInfo.failed = true;
	plab.disconnectDevice ();
	plab.notifyErrorString ("ReconnectFailure: Timeout");
	plab.updateScreen ();
	plab.timers.reconnect = null;
},
clearReconnectTimeout : function () {
	if (this.timers.reconnect != null) {
		clearTimeout (this.timers.reconnect);
		this.timers.reconnect = null;
	}
},
*/