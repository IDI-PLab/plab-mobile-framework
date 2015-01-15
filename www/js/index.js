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
			} 
		},
		
		// ---------------- OBJECT FIELDS --------------------------
		
		// States er alle tilstandene/ skjermene som vises i appen
		states : ["plab-intro","plab-connect","plab-user-select","plab-redirect"],
		// state er tilstanden vi er i akkurat naa
		state : null,
		// Ready er om vi kan kalle cordova funksjonalitet, om enheten er klar.
		ready : false,
		// Service info er riktig for ble vi bruker. Ved annen maskinvare kan det vaere noedvendig aa endre disse
		/*serviceInfo : {
			serviceUUID : "FFE0", // for the Service
			txUUID :  "FFE1", // for the TX Characteristic (Property = Notify)
			rxUUID : "FFE1" // for the RX Characteristic (Property = Write without response)
		},*/
		
		// Timers er brukt for aa holde styr paa tilkoblings timeouts
		timers : {
		//	scan : null,
		//	connect : null,
		//	reconnect : null,
			processing : null
		},
		
		/*btInfo : {
			initialized : false,
			failed : false,
			connected : false,
			reconnecting : false
		},*/
		
		platforms : {
			iOS : "iOS",
			android : "Android"
		},
		
		// Denne lagrer addressen til enheten vi er tilkoblet til.
		// Den brukes i forbindelse med tjenesteoppdagelse.
		// Tjenesteoppdagelsen er tenkt flyttet etterhvert, saa denne faar staa til da.
		//btAddr : null,
		
		// ---------- METODER SOM KALLES ETTER RECONNECT ER KJOERT -----------
		//afterReconnect : [],
		
		// ----------------------- USER FEEDBACK -----------------------------
		errorSubscribers : [],
		//messageSubscribers : [],
		
		notifyErrorString : function (string) {
			// Send error out to debug output
			plab.out.err.println(string);
			
			// Notify others
			for (var i = 0; i < plab.errorSubscribers.length; i++) {
				plab.errorSubscribers[i] (string);
			}
		},
		/*notifyMessage : function (string) {
			
			// Notify others
			for (var i = 0; i < plab.messageSubscribers.length; i++) {
				plab.messageSubscribers[i] (string);
			}
		},*/
		
		
		// -------------------------- INITIALIZATION -----------------
		// Initialize er funksjonen som starter det hele
		initialize : function() {
			this.state = this.states[0];
			
			document.addEventListener("deviceready", this.onDeviceReady, false);
			this.showIntro();
		},
		// onDeviceReady er metoden som blir kjoert naar det er trygt aa kalle cordova funksjoner
		onDeviceReady : function () {
			// Init debug
			var n = document.getElementById ("plab-debug");
			plab.out.node = n;
			plab.out.notify = Object.create (plabPrintStream);
			plab.out.notify.node = n;
			plab.out.notify.className = "plab-notify";
			plab.out.warn = Object.create (plabPrintStream);
			plab.out.warn.node = n;
			plab.out.warn.className = "plab-warn";
			plab.out.err = Object.create (plabPrintStream);
			plab.out.err.node = n;
			plab.out.err.className = "plab-err";
			
			// Updating screen with installed bt support
			var element = document.getElementById("plab-first-select");
			for (var i = 0; i < plabBT.modes.length; i++) {
				var btn = document.createElement("button");
				var txt = document.createTextNode("Koble til " + plabBT.modes[i].name);
				btn.appendChild(txt);
				btn.addEventListener(
						"click", 
						function() {
							plabBT.setMode(plabBT.modes[i].id);
							plab.showConnect();
						}
				);
				element.insertBefore(btn, element.firstChild);
			}
			plab.ready = true;
			plab.updateScreen();
			
			// plab.r... pga scope av kallet. Metoden kjoeres ikke som klassemetode.
			// plab.receivedEvent ("deviceready");
		},
		// receivedEvent er funksjon som kalles naar vi mottar en livssykel event for appen 
		/*receivedEvent : function (id) {
			if (id == "deviceready") {
				this.ready = true;
				this.updateScreen ();
			}
		},*/
		
		// ------------------------- DISPLAY --------------------------
		// getStatus viser til hva com skal staa i statuslinja i appen
		getStatus : function() {
			var ret = "";
			switch (this.state) {
			case this.states[0] :
				ret = this.ready ? "ready" : "init";
				break;
			case this.states[1] :
				ret = (plabBT.mode === null || plabBT.mode.status.failure) ? "failed" : (plabBT.mode.status.initialized ? "ready" : "init");
				break;
			case this.states[2] :
				ret = (plabBT.mode !== null) && (plabBT.mode.status.connected && plabBT.mode.status.ready) ? "ready" : "init";
				break;
			case this.states[3] :
				ret = "init";
				break;
			}
			return ret;
		},
		
		// updateScreen har ansvar for aa tegne valgt skjerm
		updateScreen : function () {
			var cont = document.getElementById("plab-content");
			cont.className = this.state + "-select plab-" + this.getStatus() + "-select";
		},
		// showIntro er funksjonen vi skal kalle naar vi skal vise intro skjermen
		showIntro : function () {
			// Stopper lasting av processing, hvis det er startet.
			if (plab.timers.processing != null) {
				clearTimeout(plab.timers.processing);
				plab.timers.processing = null;
			}
			// Oppdaterer tilstand og skjerm
			this.state = this.states[0];
			this.updateScreen();
			// Ensure we are disconnected from device
			plabBT.disconnectDevice();
			/*if (this.btInfo.connected) {
				this.disconnectDevice ();
			}*/
		},
		// showConnect er funksjonen vi skal vise bluetooth tilkoblindsskjermen 
		showConnect : function () {
			this.state = this.states[1];
			// Clear scan list
			var li = document.getElementById("plab-devices");
			while (li.firstChild) {
				li.removeChild(li.firstChild);
			}
			
			this.updateScreen ();
			plabBT.listDevices(li, 10000);
			//this.initBLE ();
			
			this.updateScreen ();
		},
		// showUserSelect er funksjonen vi skal kalle naar vi skal vise ntnu brukernavn velgeren 
		showUserSelect : function () {
			this.state = this.states[2];
			var oldName = window.localStorage.getItem('plab-username');
			if (oldName != null) {
				document.getElementById('plab-username').value = oldName;
			}
			this.updateScreen ();
		},
		// showProcessing er funksjonen som gjoer vi gaar over til processing
		showProcessing : function () {
			
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
		},
		
		
		// -------------------------------------------------------------------
		// ------------------------ BLUETOOTH --------------------------------
		// ----------- CONNECT -----------------------------------------------
		// Tilkobling til BLE spesifikke funksjoner
		// INIT
		/*
		initBLE : function() {
			bluetoothle.initialize(this.initBLESuccess, this.initBLEFailure, {"request":false});
		},
		initBLESuccess : function(obj) {
			if (obj.status == "enabled") {
				plab.btInfo.initialized = true;
				plab.updateScreen();
				plab.updateBLEList();
			}
		},
		initBLEFailure : function(obj) {
			plab.btInfo.failed = true;
			plab.notifyErrorString ("InitFailure: " + obj.error + " - " + obj.message);
			plab.updateScreen();
		},
		updateBLEList : function() {
			
			if (this.timers.scan != null) {
				// Skanner allerede -> start paa nytt
				clearTimeout(this.timers.scan);
				this.timers.scan = null;
				
				document.getElementById("plab-scan-status").innerHTML = "Omstart av skann";
				
				bluetoothle.stopScan (
					function (obj) {
						if (obj.status == "scanStopped") {
							// Stoppet skannet. Start et nytt.
							document.getElementById("plab-devices").innerHTML = "";
							bluetoothle.startScan(plab.startScanSuccess, plab.startScanFailure, null);
						} else {
							plab.notifyErrorString ("StopScanFailure: Unknown status: " + obj.status);
						}
					},
					function(obj){
						plab.notifyErrorString ("StopScanFailure: " + obj.error + " - " + obj.message);
					}
				);
				//
			} else {
				
				// Skanner ikke
				document.getElementById("plab-devices").innerHTML = "";
				bluetoothle.startScan(plab.startScanSuccess, plab.startScanFailure, null);
			}
		},
		// SCAN
		startScanSuccess : function(obj) {
			if (obj.status == "scanResult") {
				// Hent lista
				var list = document.getElementById("plab-devices");
				// lag listeelement
				var el = document.createElement("li");
				// Lag tilkoblingsknapp
				var btn = document.createElement("button");
				var btnVal = document.createTextNode(obj.name == null ? "? - " + obj.address : obj.name);
				btn.appendChild(btnVal);
				btn.addEventListener("click", function() {
					plab.connectDevice(obj.address);
				});
				// Legge til elementene i lista
				el.appendChild(btn);
				list.appendChild(el);
			} else if (obj.status == "scanStarted") {
				document.getElementById("plab-scan-status").innerHTML = "Skanner";
				plab.timers.scan = setTimeout(plab.scanTimeout, 10000);
			}
		},
		startScanFailure : function(obj) {
			plab.btInfo.failed = true;
			plab.notifyErrorString ("ScanFailure: " + obj.error + " - " + obj.message);
			plab.updateScreen();
		},
		scanTimeout : function() {
			bluetoothle.stopScan (function(obj){}, function(obj){});
			plab.timers.scan = null;
			document.getElementById("plab-scan-status").innerHTML = "Skann ferdig";
		},
		stopAndClearScanTimeout : function() {
			if (this.timers.scan != null) {
				clearTimeout(this.timers.scan);
				this.scanTimeout();
			}
		},
		// CONNECT
		connectDevice : function(address) {
			// TODO se kommentar paa plab.btAddr
			plab.btAddr = address;
			plab.stopAndClearScanTimeout ();
		    var paramsObj = {"address":address};
			bluetoothle.connect (plab.connectSuccess, plab.connectFailure, paramsObj);
			plab.timers.connect = setTimeout(plab.connectTimeout, 5000);
		},
		// Blir kallt naar tilkobling er vellykket
		connectSuccess : function(obj) {
			if (obj.status == "connected") {
				
				plab.clearConnectTimeout ();
				plab.btInfo.connected = true;
				plab.btInfo.failed = false;
				plab.updateScreen ();
				
				// Veien videre bestemmes av plattform
				if (window.device.platform == plab.platforms.iOS) {
					// iOS: services finner kun den tjenesten vi vil koble til.
					var params = {
							"address" : plab.btAddr,
							"serviceUuids": [ plab.serviceInfo.serviceUUID ] 
					};
					bluetoothle.services (plab.servicesSuccess, plab.servicesFailure, params);
				} else if (window.device.platform == plab.platforms.android) {
					// android: discover finner alle tjenester med beskrivelse som er paa enheten.
					var params = {
							"address" : plab.btAddr
					};
					bluetoothle.discover (plab.discoverSuccess, plab.discoverFailure, params);
				} else {
					// Greit aa si ifra om at dette ikke vil fungere, vi stoetter bare iOS/android
					alert ("This platform is not supported");
				}
				
			} else if (obj.status != "connecting") {
				// Holder paa med tilkobling enda, ikke gjoer noe spesielt
				plab.btInfo.connected = false;
				plab.btInfo.failed = true;
				plab.updateScreen ();
			}
		},
		// connectFailure kalles hvis tilkobling til en enhet feiler av noen grunn
		connectFailure : function(obj) {
			plab.btInfo.connected = false;
			plab.btInfo.failed = true;
			plab.notifyErrorString ("ConnectFailure: " + obj.error + " - " + obj.message);
			plab.clearConnectTimeout ();
			plab.updateScreen ();
		},
		// Timout: connect har brukt for lang tid
		connectTimeout : function () {
			plab.btInfo.connected = false;
			plab.btInfo.failed = true;
			plab.notifyErrorString ("ConnectFailure: Timeout");
			plab.updateScreen ();
			plab.timers.connect = null;
		},
		// Soerg for at timeout funksjonen ikke kjoeres
		clearConnectTimeout : function () {
			if (this.timers.connect != null) {
				clearTimeout (this.timers.connect);
				this.timers.connect = null;
			}
		},
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
		
		// DISCONNECT
		disconnectDevice : function () {
			bluetoothle.disconnect (plab.disconnectSuccess, plab.disconnectFailure, {"address":plab.btAddr});
			plab.btInfo.connected = false;
			plab.btInfo.reconnecting = false;
		},
		disconnectSuccess : function (obj) {
			if (obj.status == "disconnected") {
				plab.closeDevice ();
			} else if (obj.status == "disconnecting") {
				// Lar denne staa hvis den trengs seinere
			} else {
				// Lar denne staa hvis den trengs seinere
			}
		},
		disconnectFailure : function (obj) {
			// hundre prosent sikker paa at tilkobling er lukket
			plab.notifyErrorString ("DisconnectFailure: " + obj.error + " - " + obj.message);
			plab.closeDevice ();
		},
		// closeDevice er siste frakoblingsfunksjon
		closeDevice : function () {
			plab.btInfo.connected = false;
			plab.btInfo.reconnecting = false;
			bluetoothle.close (plab.closeSuccess, plab.closeFailure, {"address":plab.btAddr});
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
		
		// ------------------ SERVICE DISCOVERY ------------------------------
		// COMMON
		postDiscovery : function (success) {
			if (success) {
				// Gaa til neste skjerm
				plab.showUserSelect ();
				// Gjennomfoer abbonement
				plab.startSubscribe ();
			} else {
				// Oppdater skjermen med info om feilet aa oppdage UART tjeneste
				// TODO Skal denne gi mer info/ endre mer enn det den gjoer?
				plab.notifyErrorString ("DiscoverFailure: Failed to discover UART service");
			}
		},
		
		// ANDROID DISCOVER
		discoverSuccess : function (obj) {
			try {
				if (obj.status == "discovered") {
					// TODO Sjekk om tjenesten er tilstede
					plab.postDiscovery (true);
				} else {
					plab.notifyErrorString ("DiscoverFailure: Unknown status: " + obj.status);
					plab.disconnectDevice ();
				}
			} catch (e) {
				alert (e);
			}
		},
		discoverFailure : function (obj) {
			plab.notifyErrorString ("DiscoverFailure: " + obj.error + " - " + obj.message);
			plab.disconnectDevice ();
		},
		// IOS DISCOVER
		servicesSuccess : function (obj) {
			// TODO Gjoer denne mer robust
			// Antar riktig tjeneste var oppdaget
			if (obj.status == "services") {
				var params = {
						"address" : plab.btAddr,
						"serviceUuid" : plab.serviceInfo.serviceUUID,
						"characteristicUuids" : [ plab.serviceInfo.txUUID, plab.serviceInfo.rxUUID ]
				};
				bluetoothle.characteristics (plab.characteristicsSuccess, plab.characteristicsFailure, params);
			} else {
				plab.notifyErrorString ("ServicesFailure: Unknown status: " + obj.status);
				plab.disconnectDevice ();
			}
			
		},
		servicesFailure : function (obj) {
			plab.notifyErrorString ("ServicesFailure: " + obj.error + " - " + obj.message);
			plab.disconnectDevice ();
		},
		characteristicsSuccess : function (obj) {
			// TODO Gjoer denne mer robust
			// Antar riktig characteristics var oppdaget
			if (obj.status == "characteristics") {
				var params1 = {
						"address" : plab.btAddr,
						"serviceUuid" : plab.serviceInfo.serviceUUID,
						"characteristicUuid" : plab.serviceInfo.txUUID
				};
				var params2 = {
						"address" : plab.btAddr,
						"serviceUuid" : plab.serviceInfo.serviceUUID,
						"characteristicUuid" : plab.serviceInfo.rxUUID
				};
				// Bruteforcer gjennom listen
				bluetoothle.descriptors (
						
						function (obj) {
							if (obj.status == "descriptors") {
								bluetoothle.descriptors (
										
										function (obj1) {
											if (obj1.status == "descriptors") {
												plab.postDiscovery (true);
											} else {
												plab.notifyErrorString ("DescriptorsFailure: Unknown status: " + obj1.status);
												plab.disconnectDevice ();
											}
										},
										
										function (obj1) {
											plab.notifyErrorString ("DescriptorsFailure: " + obj1.error + " - " + obj1.message);
											plab.disconnectDevice ();
										},
										params2
								);
							} else {
								plab.notifyErrorString ("DescriptorsFailure: Unknown status: " + obj.status);
								plab.disconnectDevice ();
							}
						},
						
						function (obj) {
							plab.notifyErrorString ("DescriptorsFailure: " + obj.error + " - " + obj.message);
							plab.disconnectDevice ();
						},
						params1
				);
			} else {
				plab.notifyErrorString ("CharacteristicsFailure: Unknown status: " + obj.status);
				plab.disconnectDevice ();
			}
		},
		characteristicsFailure : function (obj) {
			plab.notifyErrorString ("CharacteristicsFailure: " + obj.error + " - " + obj.message);
			plab.disconnectDevice ();
		},

		// -------------- SERVICE USE ----------------------------------------
		// SUBSCRIBE
		startSubscribe : function () {
			var params = {
					"address":plab.btAddr,
					"serviceUuid":plab.serviceInfo.serviceUUID,
					"characteristicUuid":plab.serviceInfo.rxUUID,
					"isNotification":true
			};
			
			// Callback funksjonen for subscribes
			bluetoothle.subscribe(
					function (obj) {
						
						try {
							if (obj.status == "subscribedResult") {
								// Debug output
								plab.out.notify.print("Mottok data: ");
								plab.out.notify.println(JSON.stringify(obj));
								// Send videre.
								plab.notifyMessage (bluetoothle.bytesToString(bluetoothle.encodedStringToBytes(obj.value)));
							} else if (obj.status == "subscribed") {
								// Ingenting her
							} else {
								plab.notifyErrorString ("UnknownSubscribeStatus");
							}
						} catch (e) {
							plab.notifyErrorString ("SubscribeFailure: " + e.message);
						}
					},
					function (obj) {
						plab.notifyErrorString ("SubscribeFailure: " + obj.error + " - " + obj.message);
					},
					params
			);
		},
		
		// WRITE
		write : function (string) {
			if (plab.btInfo.connected) {
				var params = {
						// TODO Se om denne ogsaa maa ha addresse
						"address" : plab.btAddr,
						"value" : bluetoothle.bytesToEncodedString (bluetoothle.stringToBytes (string)),
						"serviceUuid" : plab.serviceInfo.serviceUUID,
						"characteristicUuid" : plab.serviceInfo.txUUID,
						"type" : "noResponse"
				};
				
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
				
			} else {
				plab.notifyErrorString ("WriteFailure: Not connected");
			}
		}
};

*/

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
 * -----------------------END--------------------------
 */

plab.initialize();
