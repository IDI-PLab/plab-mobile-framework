/*
 * ADB for debug
 * adb logcat Cordova:* DroidGap:* CordovaLog:* *:S
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
try {
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
	btMode.name = "BlueTooth LE";
	
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
							// Nothing here
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
						debugOut.err.println("StopScanFailure: " + obj.error + " - " + obj.message);
					}
				);
			};
			// ------------------ END SCAN ------------------------
			
			
			
			
			
			// ------------------ CONNECT ------------------
			btMode.connectDevice = function (id, successCallback) {
				// Remember address
				btMode.address = id;
				
				// Stop scan if needed
				if (btMode.timers.scanning !== null){
					clearTimeout(btMode.timers.scanning);
					btMode.timers.scanning = null;
					btMode.stopListDevices();
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
								
								// common function after discovery
								var common = function (success) {
									if (success) {
										// Do callback
										successCallback();
										// Start message subscription
										btMode.startSubscribe();
									} else {
										// Alert that UART failed
										debugOut.err.println("DiscoverFailure: Failed to discover UART service");
										btMode.status.failure = true;
									}
								};
								
								// The path from here is platform dependent
								if (window.device.platform == plab.platforms.iOS) {
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
								} else if (window.device.platform == plab.platforms.android) {
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
			
			// TODO
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

document.addEventListener(
		"deviceready",
		function() {
			plabAddBT4_0(plab.out, plab.updateScreen);
		}, 
		false
);


} catch (e) {
	alert(e);
}