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
 * --------- HELPER OBJECT PROTOTYPES -----------------------------------------
 * ----------------------------------------------------------------------------
 */

/*
 * plabPrintStream is an object that allow you to write debug information to a
 * html element. Coloring is done through css with the className attribute.
 * Each message is wrapped in a span element, and if a println() is called,
 * the element is followed by an br element. It is used in this project during
 * development and testing.
 */
var plabPrintStream = {
		// The node that will be written to
		node : null,
		// css class type of stream
		className : "",
		// wrap string in a span node and print
		print : function (text) {
			if (this.node == null) {
				return;
			}
			var o = document.createElement("span");
			o.className = this.className;
			o.appendChild (document.createTextNode(text));
			console.log(text);
			this.node.appendChild (o);
		},
		// print the text and add a br node. See print
		println : function (text) {
			if (this.node == null) {
				return;
			}
			this.print(text);
			this.node.appendChild (document.createElement("br"));
		}
}

/*
 * ----------------------------------------------------------------------------
 * ----------------------------------------------------------------------------
 * -------------- CORE APP START ----------------------------------------------
 * ----------------------------------------------------------------------------
 * ----------------------------------------------------------------------------
 */

/*
 * plab is the main app object.
 */
var plab = {
		// --------------------------------------------------------------------
		// ---------------- DEBUG OUTPUT --------------------------------------
		// --------------------------------------------------------------------
		out : {
			// Log level indicates which messages are sent to their respective
			// streams. >= 0 -> error messages, >= 1 -> warnings, >= 2 -> notifications.
			logLevel : 1,
			// node : common html element to write to
			node : null,
			// The plabPrintStreams associated with each debug type.
			notify : null,
			warn : null,
			err : null,
			// Clears all content of the html element node we write to
			clear : function () {
				if (this.node == null) {
					return;
				}
				while (this.node.firstChild) {
					this.node.removeChild(this.node.firstChild);
				}
			},
			// init : initialize the complete outstream hierarchy.
			init : function (outNode) {
				this.node = outNode;
				this.err = Object.create (plabPrintStream);
				this.warn = Object.create (plabPrintStream);
				this.notify = Object.create (plabPrintStream);
				this.warn.className = "plab-warn";
				this.err.className = "plab-err";
				this.notify.className = "plab-notify";
				if (this.logLevel >= 0) {
					this.err.node = outNode;
					if (this.logLevel >= 1) {
						this.warn.node = outNode;
						if (this.logLevel >= 2) {
							this.notify.node = outNode;
						}
					}
				}
			}
		},
		
		// --------------------------------------------------------------------
		// ---------------- APP OBJECT FIELDS ---------------------------------
		// --------------------------------------------------------------------
		
		// states : all the states available in the app (can be directly translated to screens)
		states : ["plab-intro","plab-connect","plab-user-select","plab-redirect"],
		// state : current state
		state : null,
		// ready : has cordova functionality been initialized?
		ready : false,
		
		// timers : used for keeping track of different timed events.
		// Current version only holds a timer for redirect to processing.
		timers : {
			processing : null
		},
		
		// ---------- PROCESSING FUNCTIONALITY --------------------------------
		// --- Located in processingfunc.js
		
		
		// --------------------------------------------------------------------
		// ----------------------- USER ERROR FEEDBACK ------------------------
		// --------------------------------------------------------------------
		errorSubscribers : [],
		
		notifyErrorString : function (string) {
			// Send error out to debug output
			plab.out.err.println(string);
			
			// Notify subscribers
			for (var i = 0; i < plab.errorSubscribers.length; i++) {
				plab.errorSubscribers[i] (string);
			}
		},
		
		
		// --------------------------------------------------------------------
		// -------------------------- INITIALIZATION --------------------------
		// --------------------------------------------------------------------
		// initialize : the function called first, even before cordova
		// functionality has become available.
		initialize : function() {
			plab.state = plab.states[0];
			
			// Register callback for when cordova functionality is ready
			document.addEventListener("deviceready", plab.onDeviceReady, false);
			// Register onPause event listener. This is called when app goes out of memory,
			// and here will disconnect app and make app ready to exit.
			document.addEventListener("pause", plab.onPause, false);
		},
		// onDeviceReady : the method called when cordova is set up, and its functionality is safe to call.
		onDeviceReady : function () {
			// Init debug
			var n = document.getElementById ("plab-debug");
			plab.out.init(n);
			
			// App is already initialized, do not reload. onResume is normally
			// called whenever the app is put back in focus. To avoid unnecessary
			// initializations and still connected when first screen is shown,
			// we add an empty method as this callback.
			document.addEventListener("resume", plab.onResume, false);
			
			// Time to add some fundamental settings
			// Root domain/ default sketch
			plab.settingsController.addSettingItem(
					{
						"id" : "plab-domain-group",
						"text-key" : "domain-setting-definition",
						"type" : "group",
						"options" : [{
									"id" : plab.processingFunc.processingInfo["url-keys"].base,
									"type" : "url",
									"options" : [{"text-key" : "domain-setting-base"}],
									"default-value" : "http://folk.ntnu.no/"
								},
								{
									"id" : plab.processingFunc.processingInfo["url-keys"].postfix,
									"type" : "url",
									"options" : [{"text-key" : "domain-setting-postfix"}],
									"default-value" : "/plab/plab.pde"
								}],
						"description-text-key" : "domain-setting-description"
					}
			);
			// Library file location
			plab.settingsController.addSettingItem(
					{
						"id" : plab.processingFunc.processingInfo["library-key"],
						"type" : "url",
						"options" : [{"text-key" : "library-setting"}],
						"default-value" : "http://"
					}
			);
			
			// cordova functionality is safe
			plab.ready = true;

			// Show the first screen
			plab.showIntro();
		},
		
		// --------------------------------------------------------------------
		// ---------- OTHER EVENT CALLBACKS -----------------------------------
		// --------------------------------------------------------------------
		onResume : function () {
			// Does nothing
		},
		
		onPause : function () {
			plab.out.notify.println("onPause called");
			// Removes the empty onResume callback. This makes the app reinitialize when it
			// gets focus again.
			document.removeEventListener("resume", plab.onResume, false);
			// If bluetooth has been set up, make sure it disconnects and releases resources
			if (typeof plabBT !== "undefined") {
				plabBT.unsetMode();
			}
		},
		
		// onBackButton should only be registered as a callback when we are not in intro
		// Used in Andoroid systems.
		onBackButton : function () {
			plab.showIntro();
		},
		// A field to make onBackButton register only once
		onBackRegistered : false,
		// method that registers onBackButton
		registerBackButton : function () {
			if (!plab.onBackRegistered) {
				document.addEventListener("backbutton", plab.onBackButton, false);
				plab.onBackRegistered = true;
			}
		},
		// method that unregisters onBackButton
		unregisterBackButton : function () {
			if (plab.onBackRegistered) {
				document.removeEventListener("backbutton", plab.onBackButton, false);
				plab.onBackRegistered = false;
			}
		},
		
		// ---------- BLUETOOTH SCAN EVENT CALLBACKS --------------------------
		startScan : function() {
			// Set update button to disabled
			document.getElementById("plab-update-btn").disabled = true;
			
			// Clear scan result list
			var li = document.getElementById("plab-devices");
			while (li.firstChild) {
				li.removeChild(li.firstChild);
			}
			
			// Start listing devices. Add callback to call after scan is complete
			plabBT.listDevices(li, 10000, plab.stoppedScan);
		},
		stoppedScan : function() {
			document.getElementById("plab-update-btn").disabled = false;
		},
		
		// --------------------------------------------------------------------
		// ------------------------- DISPLAY OF SCREENS -----------------------
		// --------------------------------------------------------------------
		
		// -------------- STATUS AND UPDATE DRAWING ---------------------------
		// getStatus : gives the status line class. Only partial name.
		getStatus : function() {
			var ret = "";
			switch (plab.state) {
			case plab.states[0] :
				ret = this.ready ? "ready" : "init";
				break;
			case plab.states[1] :
				ret = (plabBT.mode === null || plabBT.mode.status.failure) ? "failed" : (plabBT.mode.status.initialized ? "ready" : "init");
				break;
			case plab.states[2] :
				ret = (plabBT.mode !== null) && (plabBT.mode.status.connected && plabBT.mode.status.ready) ? "ready" : "init";
				break;
			case plab.states[3] :
				ret = "init";
				break;
			}
			return ret;
		},
		
		// updateScreen : responsible for redrawing the current shown
		// screen (as defined by state and getStatus())
		updateScreen : function () {
			var cont = document.getElementById("plab-content");
			if (cont !== null) {
				cont.className = plab.state + "-select plab-" + plab.getStatus() + "-select";
			}
		},
		// updateIntro is responsible for updating the installed bt supports and make them selectable
		updateIntro : function () {
			// Get element holding buttons
			var element = document.getElementById("plab-first-select");
			// Remove all old child elements
			while (element.firstChild) {
				element.removeChild(element.firstChild);
			}
			// Insert new buttons for all bt modes installed.
			for (var i = 0; i < plabBT.modes.length; i++) {
				var btn = document.createElement("button");
				var spn = document.createElement("span");
				var att = document.createAttribute("data-text-key");
				att.value = "connect-to";
				spn.setAttributeNode(att);
				var txt = document.createTextNode(plabLangSupport.getText("connect-to"));
				spn.appendChild(txt);
				btn.appendChild(spn);
				// Name of mode is assumed to be language independent
				txt = document.createTextNode(plabBT.modes[i].name);
				btn.modeId = plabBT.modes[i].id;
				btn.appendChild(txt);
				
				// The button needs an image that shows that it is a "next" button
				var im = document.createElement("img");
				var imsrc = document.createAttribute("src");
				imsrc.value = "img/next.png";
				im.setAttributeNode(imsrc);
				var imalt = document.createAttribute("alt");
				imalt.value = "Next";
				im.setAttributeNode(imalt);
				btn.appendChild(im);
				
				btn.addEventListener(
						"click", 
						function(evt) {
							plab.out.notify.println("[select bt]: Setting mode " + evt.target.modeId);
							plabBT.setMode(evt.target.modeId);
							plab.showConnect();
						}
				);
				element.insertBefore(btn, element.firstChild);
			}
		},
		
		// --------- SHOW SPECIFIC SCREEN, LOGIC CONTROL ----------------------
		
		// showIntro : method to call to show the introduction screen.
		showIntro : function () {
			// TODO The unloading of processing should be moved to a better location
			plab.processingFunc.unloadProcessing();
			
			// De register back button call. This is the final screen, and we should 
			// not be able to go any further back in-app
			plab.unregisterBackButton();
			
			plab.out.notify.println("showIntro");
			// Stop the loading of processing, if it is currently loading.
			if (plab.timers.processing != null) {
				clearTimeout(plab.timers.processing);
				plab.timers.processing = null;
			}
			// If we were in scan mode, we ensure scan stop
			if (plab.state === plab.states[1]) {
				plabBT.stopListDevices();
			}
			// Update the state and screen
			plab.state = plab.states[0];
			plab.updateScreen();
			
			// Unset bt mode to make sure everything in selected mode is closed
			plabBT.unsetMode();
		},
		
		// showConnect : method responsible for showing the bluetooth select screen.
		showConnect : function () {
			// Register back button call, it is now natural to have a back call.
			plab.registerBackButton();
			
			plab.out.notify.println("showConnect");
			// Update state
			plab.state = plab.states[1];
			
			// Start the scan after devices and update screen
			plab.startScan();
			plab.updateScreen ();
		},
		
		// showUserSelect : method responsible for showing user select screen
		showUserSelect : function () {
			// Register back button call. May already have been registered, so use the safe call.
			plab.registerBackButton();
			
			plab.out.notify.println("showUserSelect");
			// update state
			plab.state = plab.states[2];
			// Check for stored user name. If found, fill in user select field with the stored name
			var oldName = window.localStorage.getItem('plab-user-input');
			if (oldName != null) {
				document.getElementById('plab-user-input').value = oldName;
			}
			
			// Check for stored library include. If found, fill in include checkbox with the stored name
			var oldInc = window.localStorage.getItem('plab-include-library');
			plab.out.notify.println("Old include: " + oldInc);
			if (oldInc != null) {
				oldInc = oldInc == "true";	// Just gotta love javascript..
				document.getElementById('plab-include-library').checked = oldInc;
			}
			
			// Force select file to be empty and ready to add
			plab.processingFunc.processingInfo["include-additional-files"] = [];
			var selList = document.getElementById("plab-addfile-list");
			while (selList.firstChild) {
				selList.removeChild(selList.firstChild);
			}
			document.getElementById("plab-addfile").className = "plab-addfile";
			
			// If we are connected to a device, show the name of the device
			if (plabBT.mode !== null) {
				var txt = "";
				if (plabBT.mode.status.connected && plabBT.deviceName !== null) {
					txt = plabBT.deviceName;
				}
				document.getElementById("plab-device-name").innerHTML = txt;
			}
			
			// Ensure the screen is drawn.
			plab.updateScreen ();
		},
		// showProcessing : the method resposible for setting up processing screen.
		showProcessing : function () {
			// Register back button call. May already have been registered, so use the safe call.
			plab.registerBackButton();
			
			plab.out.notify.println("showProcessing");
			
			// Set state to redirect state and update the screen
			plab.state = plab.states[3];
			plab.updateScreen ();
			
			// Get content of user select element and include library element.
			var usrInput = document.getElementById("plab-user-input").value;
			var includeLib = document.getElementById("plab-include-library").checked;
			// Build location url for processing. Remove whitespace characters from user input and addresses
			plab.processingFunc.processingInfo["address-base"] = plab.settingsController.getSettingValue(plab.processingFunc.processingInfo["url-keys"].base).replace(/\s/g, "");
			plab.processingFunc.processingInfo["address-postfix"] = plab.settingsController.getSettingValue(plab.processingFunc.processingInfo["url-keys"].postfix).replace(/\s/g, "");
			plab.processingFunc.processingInfo["complete-address"] = plab.processingFunc.processingInfo["address-base"] + usrInput.replace(/\s/g, "") + plab.processingFunc.processingInfo["address-postfix"];
			
			plab.processingFunc.processingInfo["include-library"] = includeLib;
			plab.processingFunc.processingInfo["include-library-loc"] = plab.settingsController.getSettingValue(plab.processingFunc.processingInfo["library-key"]).replace(/\s/g, "");
			/*
			// Update the location so the app reflects which address it is requesting
			document.getElementById("plab-redir-location").innerHTML = plab.processingFunc.processingInfo["complete-address"];*/
			// Store the user name so it will be set next attempted load.
			window.localStorage.setItem('plab-user-input', usrInput);
			// Store include lib, so it will be set next attempted load
			window.localStorage.setItem('plab-include-library', includeLib);
			
			// Reset attempt counter
			plab.processingFunc.attempt = 0;
			
			// Start loading of processing
			plab.processingFunc.startLoad ();
		},
		// ----------- HIDE / SHOW SPECIFIC ITEMS -----------------------------
		showAddFile : function() {
			// Update file locations
			document.getElementById("plab-addfile-prefix").innerHTML = plab.settingsController.getSettingValue(plab.processingFunc.processingInfo["url-keys"].base).replace(/\s/g, "");
			document.getElementById("plab-addfile-postfix").innerHTML = plab.settingsController.getSettingValue(plab.processingFunc.processingInfo["url-keys"].postfix).replace(/\s/g, "");
			// Show select inputs
			document.getElementById("plab-addfile").className = "plab-addfile-select";
		},
		acceptAddFile : function() {
			// Build file location
			var addr = plab.settingsController.getSettingValue(plab.processingFunc.processingInfo["url-keys"].base).replace(/\s/g, "");
			addr += document.getElementById("plab-user-input-addfile").value.replace(/\s/g, "");
			addr += plab.settingsController.getSettingValue(plab.processingFunc.processingInfo["url-keys"].postfix).replace(/\s/g, "");
			// Add it to load list, and show it to user
			var pos = plab.processingFunc.processingInfo["include-additional-files"].length;
			plab.processingFunc.processingInfo["include-additional-files"][pos] = addr;
			var li = document.createElement("li");
			var code = document.createElement("code");
			var txt = document.createTextNode(addr);
			code.appendChild(txt);
			li.appendChild(code);
			document.getElementById("plab-addfile-list").appendChild(li);
			// hide select inputs
			document.getElementById("plab-addfile").className = "plab-addfile";
		},
		hideBackButton : function() {
			document.getElementById("plab-back-button").classList.add("plab-hidden");
		},
		showBackButton : function() {
			document.getElementById("plab-back-button").classList.remove("plab-hidden");
		}
};

/*
 * ----------------------------------------------------------------------------
 * ------ PROCESSING - JAVASCRIPT INJECTION OBJECT ----------------------------
 * ----------------------------------------------------------------------------
 */

/*
 * plabPjsBridge, processing - javascript bridge. The object that is injected
 * into the processing sketch. The bridge between the user defined code and all
 * functionality delivered by this app.
 */
var plabPjsBridge = {
	// getWidth : gets the width of the visible screen
	getWidth : function () {
		return window.innerWidth;
	},
	// getHeight : gets the height of the visible screen
	getHeight : function () {
		// TODO Check on height now that we have a back button
		return window.innerHeight;
	},
	// write : send a message to the connected bluetooth device
	write : function (string) {
		try {
			plabBT.send(string);
		} catch (e) {
			alert (e);
		}
	},
	// subscribeRead : register a object holding a callback that will be called when a message is received
	subscribeRead : function (obj) {
		plabBT.receiveCallback(obj.read);
	},
	// subscribeError : register a object holding a callback that will be called when an error occurs
	// TODO This should be removed from the interface in a future version
	subscribeError : function (obj) {
		plab.errorSubscribers[plab.errorSubscribers.length] = obj.read;
	},
	// disconnect : disconnects from the current bluetooth device and returns app to intro screen.
	disconnect : function() {
		plab.showIntro();
	},
	// hideBackButton : Hides the back button
	hideBackButton : function() {
		plab.hideBackButton();
	},
	// showBackButton : shows the back button
	showBackButton : function() {
		plab.showBackButton();
	}
};

/*
 * ----------------------------------------------------------------------------
 * ----------------------------------------------------------------------------
 * ---------------------- END CORE APP ----------------------------------------
 * ----------------------------------------------------------------------------
 * ----------------------------------------------------------------------------
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
			plabBT.mode.connectDevice(id, plab.showUserSelect);
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
			plabBT.mode.receiveCallback(callback);
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

// ----------------------------------------------------------------------------
// -------------- START APP ---------------------------------------------------
// ----------------------------------------------------------------------------
plab.initialize();
