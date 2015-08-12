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
 * ----------------------------------------------------------------------------
 * ---------------------- BT FUNCTIONALITY ------------------------------------
 * ----------------------------------------------------------------------------
 * ----------------------------------------------------------------------------
 */

/*
 * ----------------------------------------------------------------------------
 * ----------------- CORE BT --------------------------------------------------
 * ----------------------------------------------------------------------------
 */

/*
 * The plabBT object is the object responsible to communicate with the
 * different BT modules. It keeps track of which modules are installed and
 * which (if any) is currently active.
 */
var plabBT = {
		// The different installed modules are kept here
		modes : [],
		// The current active module
		mode : null,
		
		// Name of the last connected device
		deviceName : null,
		// Id of the last connected device. Not currently used, but connect to prev device may be added later
		deviceId : null,
		
		// listeners for incomming calls
		receiveMessageCallbacks : [],
		// listeners for on connected events
		onConnectedCallbacks : [],
		
		// Sets a new module as active (if known)
		setMode : function (id) {
			
			plab.out.notify.println("[plabBT]: setting mode: " + id);
			
			// Guarantee the previous set module is unloaded
			if (plabBT.mode !== null) {
				plabBT.unsetMode ();
			}
			
			// Look through all installed modes, if the id is recognized, set the mode
			for (var i = 0; i < plabBT.modes.length; i++) {
				if (id == plabBT.modes[i].id) {
					// Clear old message listeners
					plabBT.receiveMessageCallbacks = [];
					
					plabBT.mode = plabBT.modes[i];
					plabBT.mode.openMode();
					return;
				}
			}
		},
		
		
		// Tells the current active module to stand down and unsets the current module.
		unsetMode : function () {
			plab.out.notify.println("[plabBT]: unsetMode");
			if (plabBT.mode !== null) {
				plabBT.mode.closeMode();
				plabBT.mode = null;
				// Clear old message listeners
				plabBT.receiveMessageCallbacks = [];
			}
		},
		
		
		// Adds a new module, if not already present
		addMode : function (mode) {
			plab.out.notify.println("[plabBT]: addMode: " + mode.id);
			for (var i = 0; i < plabBT.modes.length; i++) {
				if (mode.id === plabBT.modes[i].id) {
					return;
				}
			}
			plabBT.modes[plabBT.modes.length] = mode;
			
			// A new mode has been installed -> the intro of the app should update.
			plab.updateIntro();
		},
		
		
		// Lists all devices detected by the module. Results are updated to the holder node provided.
		// Enforce listing stop after predefined time (scanTime in milliseconds)
		listDevices : function (holderNode, scanTime, scanStoppedCallback) {
			plab.out.notify.println("[plabBT]: Listing devices");
			if (plabBT.mode === null) {
				return;
			}
			plabBT.mode.listDevices(
					function(desc) {
						// li element to hold mode element
						var el = document.createElement("li");
						// Connect button
						var btn = document.createElement("button");
						// Text of connect button is language independent. It is name of device
						var btnVal = document.createTextNode(desc.name);
						btn.appendChild(btnVal);
						
						// The button needs an image that shows that it is a "next" button
						var im = document.createElement("img");
						var imsrc = document.createAttribute("src");
						imsrc.value = "img/next.png";
						im.setAttributeNode(imsrc);
						var imalt = document.createAttribute("alt");
						imalt.value = "Next";
						im.setAttributeNode(imalt);
						btn.appendChild(im);
						
						// Add the click event listener
						btn.addEventListener(
								"click",
								function() {
									plabBT.connectDevice(desc.id, desc.name, holderNode);
								}
						);
						// Add the elements to the list
						el.appendChild(btn);
						holderNode.appendChild(el);
					},
					scanTime,
					scanStoppedCallback
			);
		},
		
		
		// Force the current module to stop listing devices
		stopListDevices : function() {
			plab.out.notify.println("[plabBT]: stopListDevices");
			if (plabBT.mode !== null) {
				plabBT.mode.stopListDevices();
			}
		},
		
		
		// Create a device descriptor. Should be used by the different modules.
		createDeviceDescriptor : function (theId, theName) {
			return { id : theId, name : theName };
		},
		
		
		// Force the current module to attempt to connect to the device identified by id
		// id : the device identificator
		// name : the device name
		// holderNode : the holder element node of all connectible devices 
		connectDevice : function (id, name, holderNode) {
			plab.out.notify.println("[plabBT]: connectDevice: " + id + " : " + name);
			if (plabBT.mode === null) {
				plab.out.err.println("[plabBT]: connectDeviceFailure: mode was not set");
				return;
			}
			plabBT.deviceId = id;
			plabBT.deviceName = name;
			
			// Disable all device listed buttons
			var btns = holderNode.getElementsByTagName("button");
			plab.out.notify.println("Buttons discovered: " + btns.length + ", will be disabled");
			for (var i = 0; i < btns.length; i++) {
				btns[i].disabled = true;
			}
			// Disable possibility to update scan while connecting
			document.getElementById("plab-update-btn").disabled = true;
			// Do the actual connection
			plabBT.mode.connectDevice(id, plabBT.onConnected);
		},
		
		
		// Force the current module to disconnect from device
		disconnectDevice : function () {
			plab.out.notify.println("[plabBT]: disconnectDevice");
			if (plabBT.mode === null) {
				return;
			}
			plabBT.mode.disconnectDevice();
		},
		
		
		// If a module is set, this will force it to attempt sending of a string
		send : function (text) {
			plab.out.notify.println("[plabBT]: send text: " + text);
			if (plabBT.mode === null) {
				return;
			}
			// Adding newline after sent text. Ease the processing of sent message on the other side
			plabBT.mode.send(text + "\n");
		},
		
		
		// Register a callback function for the current module to make it listen for incomming messages.
		// Will be reset if module is changed
		receiveCallback : function (callback) {
			plab.out.notify.println("[plabBT]: receiveCallback; someone is listening");
			if (plabBT.mode === null) {
				return;
			}
			plabBT.receiveMessageCallbacks[plabBT.receiveMessageCallbacks.length] = callback;
			
		},
		removeReceiveCallback : function(callback) {
			var i = plabBT.receiveMessageCallbacks.indexOf(callback);
			if (i > -1) {
				plabBT.receiveMessageCallbacks.splice(i, 1);
			}
		},
		onReceiveMessage : function(str) {
			plabBT.receiveMessageCallbacks.forEach(function(callback) {
				callback(str);
			});
		},
		onConnected : function() {
			// Listen to messages from this device
			plabBT.mode.receiveCallback(plabBT.onReceiveMessage);
			
			// Do all registered callbacks
			plabBT.onConnectedCallbacks.forEach(function(callback) {
				callback();
			});
			
			// Go to next screen
			plab.showUserSelect();
		},
		addOnConnectedCallback : function(callback) {
			plabBT.onConnectedCallbacks[plabBT.onConnectedCallbacks.length] = callback;
		},
		removeOnConnectedCallback : function(callback) {
			var i = plabBT.onConnectedCallbacks.indexOf(callback);
			if (i > -1) {
				plabBT.onConnectedCallbacks.splice(i, 1);
			}
		}
}

/*
 * ----------------------------------------------------------------------------
 * ------------- MODULE INTERFACE BT ------------------------------------------
 * ----------------------------------------------------------------------------
 */

/*
 * plabBTMode is a prototype object for a bt module. It must implement all
 * functions specified here, and must hold identifiers and names as described
 * here.
 */
var plabBTMode = {
		// Unique identifier for the module
		id : "",
		// Name of the module. What is displayed in the app
		name : "",
		// Status: Connection status
		status : {
			// Device initialized
			initialized : false,
			// Device connected
			connected : false,
			// Device ready to send/receive messages
			ready : false,
			// Device failed somehow
			failure : false
		},
		
		// Start the module. Initialize and ready for interaction
		openMode : function () {},
		// Stop the module. Close all connections and remove all listeners
		closeMode : function () {},
		
		// List the devices ready for connection. scanTime describes max time this function should run.
		// listCallback should be called with a descriptor created by plabBT.createDeviceDescriptor
		// scanStoppedCallback should be called after listing of devices have completed
		listDevices : function (listCallback, scanTime, scanStoppedCallback) {},
		// Force the device to stop looking for other devices
		stopListDevices : function () {},
		
		// Connect to a device identified by id. Call successCallback if successful
		connectDevice : function (id, successCallback) {},
		// Disconnect from the device currently connected to
		disconnectDevice : function () {},
		
		// Send a string to the current device
		send : function (text) {},
		// Register a callback function to listen for incomming messages from device
		receiveCallback : function (callback) {}
}

/*
 * ----------------------------------------------------------------------------
 * ----------------------------------------------------------------------------
 * ---------------------- END BT ----------------------------------------------
 * ----------------------------------------------------------------------------
 * ----------------------------------------------------------------------------
 */