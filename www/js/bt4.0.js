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
		
		openMode : function () {},
		closeMode : function () {},
		
		listDevices : function (listCallback, scanTime) {},
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
	// Adding info if this is first run
	btMode.status.started = false;
	// Replacing the open mode function -> init the mode
	btMode.openMode = function () {
		if (btMode.status.started) {
			// TODO
		} else {
			// First run -> set up
			btMode.closeMode : function () {
				// Remove all listeners
				// TODO
				// Close open connections
				btMode.disconnectDevice();
				// Update status
				btMode.status.connected = false;
				btMode.status.ready = false;
				btMode.status.failure = false;
			};
			
			btMode.listDevices : function (listCallback, scanTime) {};
			btMode.connectDevice : function (id) {};
			btMode.disconnectDevice : function () {};
			
			btMode.send : function (text) {};
			btMode.receiveCallback : function (callback) {};
			// TODO
			
			// -------------- INIT -------------------
			if (!btMode.status.initialized) {
				bluetoothle.initialize(
						
						function(obj) {
							if (obj.status == "enabled") {
								btMode.status.initialized = true;
								updateScreen();
							} else {
								debugOut.err.println("InitializeFailure: Unknown status: " + obj.status);
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
		}
	};
	
	plabBT.modes[plabBT.modes.length] = btMode;
}

plabAddBT4_0(plab.out, plab.updateScreen);