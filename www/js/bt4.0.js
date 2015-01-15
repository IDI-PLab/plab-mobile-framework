/*
 * 
var plabBTMode = {
		id : "",
		name : "",
		status : {
			initialized : false,
			connected : false,
			ready : false,
			failure : false
		},
		
		// timers : { scanning : null }
		// address : null
		
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
	// See if necessary plugin is installed
	if (typeof bluetoothle === "undefined") {
		return;
	}
	
	// Creating a prototype object
	var btMode = Object.create(plabBTMode);
	btMode.id = "BlueTooth_4.0_randdusing";
	btMode.name = "BlueTooth LE";
	
	// Adding info since this is init
	btMode.status.started = false;
	btMode.status.scanning = false;
	btMode.timers = {
			scanning : null
	};
	btMode.address = null;
	
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
				btMode.timers.scanning = "";
				bluetoothle.startScan(
						function(obj) {
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
			btMode.connectDevice = function (id) {};
			// ------------------ END CONNECT ------------------
			// ------------------ DICCONNECT ------------------
			btMode.disconnectDevice = function () {
				var closeDev = function() {
					btMode.status.connected = false;
					btMode.status.ready = false;
					bluetoothle.close(
							function (obj) {
								if (obj.status == "closed") {
									// Allowed to stand if needed later
								} else {
									// Allowed to stand if needed later
								}
							},
							function (obj) {
								debugOut.err.println("CloseFailure: " + obj.error + " - " + obj.message);
							},
							{"address":btMode.address}
					);
				}
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
					btMode.status.ready = false;
				},
				disconnectFailure : function (obj) {
					// hundre prosent sikker paa at tilkobling er lukket
					plab.notifyErrorString ("DisconnectFailure: " + obj.error + " - " + obj.message);
					plab.closeDevice ();
				},
				closeSuccess : function (obj) {
					if (obj.status == "closed") {
						// Lar denne staa om vi trenger den senere
					} else {
						// Lar denne staa om vi trenger den senere
					}
				},
				closeFailure : function (obj) {
					plab.notifyErrorString ("CloseFailure: " + obj.error + " - " + obj.message);
				},
			};
			// ------------------ END DICCONNECT ------------------
			
			btMode.send = function (text) {};
			btMode.receiveCallback = function (callback) {};
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
	
	plabBT.modes[plabBT.modes.length] = btMode;
}

plabAddBT4_0(plab.out, plab.updateScreen);