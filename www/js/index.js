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

var plab = {
		// ---------------- DEBUG OUTPUT ---------------------------
		out : {
			logLevel : 2,
			node : null,
			notify : null,
			warn : null,
			err : null,
			clear : function () {
				if (this.node == null) {
					return;
				}
				while (this.node.firstChild) {
					this.node.removeChild(this.node.firstChild);
				}
			},
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
		
		// ---------------- OBJECT FIELDS --------------------------
		
		// States er alle tilstandene/ skjermene som vises i appen
		states : ["plab-intro","plab-connect","plab-user-select","plab-redirect"],
		// state er tilstanden vi er i akkurat naa
		state : null,
		// Ready er om vi kan kalle cordova funksjonalitet, om enheten er klar.
		ready : false,
		
		// Timers er brukt for aa holde styr paa tilkoblings timeouts
		timers : {
			processing : null
		},
		
		// ----------------------- USER FEEDBACK -----------------------------
		errorSubscribers : [],
		
		notifyErrorString : function (string) {
			// Send error out to debug output
			plab.out.err.println(string);
			
			// Notify others
			for (var i = 0; i < plab.errorSubscribers.length; i++) {
				plab.errorSubscribers[i] (string);
			}
		},
		
		
		// -------------------------- INITIALIZATION -----------------
		// Initialize er funksjonen som starter det hele
		initialize : function() {
			plab.state = plab.states[0];
			
			document.addEventListener("deviceready", plab.onDeviceReady, false);
			document.addEventListener("pause", plab.onPause, false);
		},
		// onDeviceReady er metoden som blir kjoert naar det er trygt aa kalle cordova funksjoner
		onDeviceReady : function () {
			// Init debug
			var n = document.getElementById ("plab-debug");
			plab.out.init(n);
			
			// App is already initialized, do not reload
			document.addEventListener("resume", function(){}, false);
			
			plab.ready = true;

			plab.showIntro();
		},
		
		onPause : function () {
			plab.out.notify.println("onPause called");
			// If bluetooth has been set up, make sure it disconnects and releases resources
			if (typeof plabBT !== "undefined") {
				plabBT.unsetMode();
			}
		},
		
		// onBackButton should only be registered as a callback when we are not in intro 
		onBackButton : function () {
			plab.showIntro();
		},
		// A field to make onBackButton register only once
		onBackRegistered : false,
		// function that registers onBackButton
		registerBackButton : function () {
			if (!plab.onBackRegistered) {
				document.addEventListener("backbutton", plab.onBackButton, false);
				plab.onBackRegistered = true;
			}
		},
		// function that unregisters onBackButton
		unregisterBackButton : function () {
			if (plab.onBackRegistered) {
				document.removeEventListener("backbutton", plab.onBackButton, false);
				plab.onBackRegistered = false;
			}
		},
		
		// ------------------------- DISPLAY --------------------------
		// getStatus viser til hva com skal staa i statuslinja i appen
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
		
		// updateScreen har ansvar for aa tegne valgt skjerm
		updateScreen : function () {
			var cont = document.getElementById("plab-content");
			if (cont !== null) {
				cont.className = plab.state + "-select plab-" + plab.getStatus() + "-select";
			}
		},
		// updateIntro is responsible for updating the installed bt supports and make them selectable
		updateIntro : function () {
			// Updating screen with installed bt support
			var element = document.getElementById("plab-first-select");
			while (element.firstChild) {
				element.removeChild(element.firstChild);
			}
			for (var i = 0; i < plabBT.modes.length; i++) {
				var btn = document.createElement("button");
				var txt = document.createTextNode("Koble til " + plabBT.modes[i].name);
				btn.modeId = plabBT.modes[i].id;
				btn.appendChild(txt);
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
		
		// showIntro er funksjonen vi skal kalle naar vi skal vise intro skjermen
		showIntro : function () {
			// De register back button call
			plab.unregisterBackButton();
			
			plab.out.notify.println("showIntro");
			// Stopper lasting av processing, hvis det er startet.
			if (plab.timers.processing != null) {
				clearTimeout(plab.timers.processing);
				plab.timers.processing = null;
			}
			// If we were in scan mode, we ensure scan stop
			if (plab.state === plab.states[1]) {
				plabBT.stopListDevices();
			}
			// Oppdaterer tilstand og skjerm
			plab.state = plab.states[0];
			plab.updateScreen();
			// Unset mode to make sure everything is closed
			plabBT.unsetMode();
		},
		// showConnect er funksjonen vi skal vise bluetooth tilkoblindsskjermen 
		showConnect : function () {
			// Register back button call
			plab.registerBackButton();
			
			plab.out.notify.println("showConnect");
			plab.state = plab.states[1];
			// Clear scan list
			var li = document.getElementById("plab-devices");
			while (li.firstChild) {
				li.removeChild(li.firstChild);
			}
			
			plab.updateScreen ();
			plabBT.listDevices(li, 10000);
			//this.initBLE ();
			
			plab.updateScreen ();
		},
		// showUserSelect er funksjonen vi skal kalle naar vi skal vise ntnu brukernavn velgeren 
		showUserSelect : function () {
			// Register back button call
			plab.registerBackButton();
			
			plab.out.notify.println("showUserSelect");
			plab.state = plab.states[2];
			var oldName = window.localStorage.getItem('plab-username');
			if (oldName != null) {
				document.getElementById('plab-username').value = oldName;
			}
			
			// If we are connected to a device, show the name of the device
			if (plabBT.mode !== null) {
				var txt = "";
				if (plabBT.mode.status.connected && plabBT.deviceName !== null) {
					txt = plabBT.deviceName;
				}
				document.getElementById("plab-device-name").innerHTML = txt;
			}
			
			plab.updateScreen ();
		},
		// showProcessing er funksjonen som gjoer vi gaar over til processing
		showProcessing : function () {
			
			// Register back button call
			plab.registerBackButton();
			
			plab.out.notify.println("showProcessing");
			
			// Setter state til redirect state og oppdaterer skjermen
			plab.state = plab.states[3];
			plab.updateScreen ();
			
			// Hent referanser til elementene som trengs
			var usrName = document.getElementById("plab-username").value;
			var procLoc = "http://folk.ntnu.no/" + usrName.replace(/\s/g, "") + "/plab/plab.pde";
			var canvas = document.createElement ("canvas");
			canvas.id = "plab-canvas";
			var attemptCounter = document.getElementById ("plab-attempt");
			
			// Lagre det innskrevne brukernavnet
			window.localStorage.setItem('plab-username', usrName);
			
			// Setter inn canvasen
			document.body.insertBefore (canvas, document.body.firstChild);
			
			// attempt -> hvilket forsoek det er paa aa laste processing sketch
			var attempt = 0;
			// Skal holde load funksjonen
			var startLoad;
			// Funksjonalitet for aa sjekke om processing er lastet
			var i = 0;
			var funk = function () {
				
				var p = Processing.getInstanceById ("plab-canvas");
				if (p != null) {
					// Funksjonen skal kun kalles naar timeren har talt ned, husk aa nullstille
					plab.timers.processing = null;
					// Gjoer rammeverket usynlig
					document.body.className = "";
					try {
						// Canvas skal fylle skjermen
						var w = plabPjsBridge.getWidth ();
						var h = plabPjsBridge.getHeight ();
						canvas.width = w;
						canvas.height = h;
						p.bindPLabBridge (plabPjsBridge);
					} catch (e) {
						alert ("Kunne ikke binde overgang.\nEkstra funksjonalitet er utilgjengelig.");
						plab.out.err.println("BridgeBinding failure: " + e);
					}
				} else {
					i++;
					if (attemptCounter != null) {
						attemptCounter.innerHTML = attempt + " (" + i + ")";
					}
					if (i < 20) {
						plab.timers.processing = setTimeout (funk, 500);
					} else {
						startLoad ();
					}
				}
			};
			
			// Funksjonen som faktisk starter aa laste processing
			startLoad = function () {
				// Nullstill sjekk om processing er lasta timer og inkrementer forsoeksnummer
				i = 0;
				attempt++;
				// Last skissa
				Processing.loadSketchFromSources (canvas, [procLoc]);
				// Sett sjekk paa om skissa er lasta til aa starte
				plab.timers.processing = setTimeout (funk, 500);
			};
			
			// Last processing
			startLoad ();
		}
};



/*
 * plabPjsBridge, processing - javascript bru. Objektet som injiseres i processing skissen.
 * Bindeleddet mellom denne koden og brukerspesifikk kode.
 */
var plabPjsBridge = {
	getWidth : function () {
		return window.innerWidth;
	},
	getHeight : function () {
		return window.innerHeight;
	},
	write : function (string) {
		try {
			plabBT.send(string);
		} catch (e) {
			alert (e);
		}
	},
	subscribeRead : function (obj) {
		plabBT.receiveCallback(obj.read);
	},
	subscribeError : function (obj) {
		plab.errorSubscribers[plab.errorSubscribers.length] = obj.read;
	}
};

/*
 * -------------------------------------------------------------
 * -------------------------------------------------------------
 * -----------------------END MAIN APP--------------------------
 * -------------------------------------------------------------
 * -------------------------------------------------------------
 * 
 * -------------------------------------------------------------
 * -------------------------------------------------------------
 * -----------------------BT------------------------------------
 * -------------------------------------------------------------
 * -------------------------------------------------------------
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
			
			if (plabBT.mode !== null) {
				plabBT.unsetMode ();
			}
			
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
			
			plab.updateIntro();
		},
		
		// Lists all devices detected by the module. Results are updated to the holder node provided.
		// Enforce listing stop after predefined time (scanTime in milliseconds)
		listDevices : function (holderNode, scanTime) {
			plab.out.notify.println("[plabBT]: Listing devices");
			if (plabBT.mode === null) {
				return;
			}
			plabBT.mode.listDevices(
					function(desc) {
						// list element to hold element
						var el = document.createElement("li");
						// Connect button
						var btn = document.createElement("button");
						var btnVal = document.createTextNode(desc.name);
						btn.appendChild(btnVal);
						// Add the click event listener
						btn.addEventListener(
								"click",
								function() {
									plabBT.connectDevice(desc.id, desc.name);
								}
						);
						// Legge til elementene i lista
						el.appendChild(btn);
						holderNode.appendChild(el);
					},
					scanTime
			);
		},
		// Force the current module to stop listing devices
		stopListDevices : function() {
			plab.out.notify.println("[plabBT]: stopListDevices");
			if (plabBT.mode !== null) {
				plabBT.mode.stopListDevices();
			}
		},
		// Create a devuce descriptor. Should be used by the different modules.
		createDeviceDescriptor : function (theId, theName) {
			return { id : theId, name : theName };
		},
		// Force the current module to attempt to connect to the device identified by id
		connectDevice : function (id, name) {
			plab.out.notify.println("[plabBT]: connectDevice: " + id + " : " + name);
			plabBT.deviceId = id;
			plabBT.deviceName = name;
			if (plabBT.mode === null) {
				return;
			}
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
 * plabBTMode is a prototype object for a bt module. It must implement all
 * functions specified here, and must hold identifiers and names as given
 * described here.
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
		listDevices : function (listCallback, scanTime) {},
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
 * -------------------------------------------------------------
 * -------------------------------------------------------------
 * -----------------------END BT--------------------------------
 * -------------------------------------------------------------
 * -------------------------------------------------------------
 */

// -------------------------------------------------------------
// -------------- Startup --------------------------------------
// -------------------------------------------------------------
plab.initialize();
