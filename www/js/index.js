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
 * ffe0:
 */
// TODO
/*
var rcvd = {
		"address":"B4:99:4C:56:76:9F",
		"status":"discovered",
		"services":[{
			"characteristics":[{
				"descriptors":[],
				"characteristicUuid":"2a00",
				"properties":{"read":true}
			},
			{
				"descriptors":[],
				"characteristicUuid":"2a01",
				"properties":{"read":true}
			},
			{
				"descriptors":[],
				"characteristicUuid":"2a02",
				"properties":{"write":true,"read":true}
			},
			{
				"descriptors":[],
				"characteristicUuid":"2a03",
				"properties":{"write":true,"read":true}
			},
			{
				"descriptors":[],
				"characteristicUuid":"2a04",
				"properties":{"read":true}
			}],
			"serviceUuid":"1800"
		},
		{
			"characteristics":[{
				"descriptors":[{"descriptorUuid":"2902"}],
				"characteristicUuid":"2a05",
				"properties":{"indicate":true}
			}],
			"serviceUuid":"1801"
		},
		{
			"characteristics":[{
				"descriptors":[{
					"descriptorUuid":"2902"
				},
				{
					"descriptorUuid":"2901"
				}],
				"characteristicsUuid":"ffe1",
				"properties":{
					"writeWithoutResponse":true,
					"read":true,
					"notify":true}
			}],
			"serviceUuid":"ffe0"
		}],
		"name":"HMSoft"
};
*/
// TODO

var plab = {
		
		// ---------------- OBJECT FIELDS --------------------------
		
		// States er alle tilstandene/ skjermene som vises i appen
		states : ["plab-intro","plab-connect","plab-user-select","plab-redirect"],
		// state er tilstanden vi er i akkurat nå
		state : null,
		// Ready er om vi kan kalle cordova funksjonalitet, om enheten er klar.
		ready : false,
		// Service info er riktig for adafruit ble. Ved annen maskinvare kan det være noedvendig å endre disse
		// Saavidt vi vet naa, stemmer det med UART for alle nordic semiconductor ble enheter
		serviceInfo : {
			serviceUUID : "FFE0", // for the Service
			txUUID :  "FFE1", // for the TX Characteristic (Property = Notify)
			rxUUID : "FFE1" // for the RX Characteristic (Property = Write without response)
		},
		
		// Timers er brukt for å holde styr på tilkoblings timeouts
		timers : {
			scan : null,
			connect : null,
			reconnect : null
		},
		
		btInfo : {
			initialized : false,
			failed : false,
			connected : false,
			reconnecting : false
		},
		
		platforms : {
			iOS : "iOS",
			android : "Android"
		},
		
		// TODO HACK / TESTCODE
		// Denne lagrer addressen til enheten vi er tilkoblet til.
		// Den brukes i forbindelse med tjenesteoppdagelse.
		// Tjenesteoppdagelsen er tenkt flyttet etterhvert, saa denne faar staa til da.
		btAddr : null,
		
		// ---------- METODER SOM KALLES ETTER RECONNECT ER KJOERT -----------
		afterReconnect : [],
		
		// ----------------------- USER FEEDBACK -----------------------------
		errorSubscribers : [],
		messageSubscribers : [],
		
		notifyErrorString : function (string) {
			for (var i = 0; i < plab.errorSubscribers.length; i++) {
				plab.errorSubscribers[i] (string);
			}
		},
		notifyMessage : function (string) {
			for (var i = 0; i < plab.messageSubscribers.length; i++) {
				plab.messageSubscribers[i] (string);
			}
		},
		
		
		// -------------------------- INITIALIZATION -----------------
		// Initialize er funksjonen som starter det hele
		initialize : function() {
			this.state = this.states[0];
			document.addEventListener("deviceready", this.onDeviceReady, false);
			this.showIntro();
		},
		// onDeviceReady er metoden som blir kjørt når det er trygt aa kalle cordova funksjoner
		onDeviceReady : function () {
			// plab.r... pga scope av kallet. Metoden kjoeres ikke som klassemetode.
			plab.receivedEvent ("deviceready");
		},
		// receivedEvent er funksjon som kalles naar vi mottar en livssykel event for appen 
		receivedEvent : function (id) {
			if (id == "deviceready") {
				this.ready = true;
				this.updateScreen ();
			}
		},
		
		// ------------------------- DISPLAY --------------------------
		// getStatus viser til hva com skal stå i statuslinja i appen
		getStatus : function() {
			var ret = "";
			switch (this.state) {
			case this.states[0] :
				ret = this.ready ? "ready" : "init";
				break;
			case this.states[1] :
				ret = this.btInfo.failed ? "failed" : (this.btInfo.initialized ? "ready" : "init");
				break;
			case this.states[2] :
				ret = "init";
				break;
			case this.states[3] :
				ret = "init";
				break;
			}
			return ret;
		},
		
		// updateScreen har ansvar for å tegne valgt skjerm
		updateScreen : function () {
			var cont = document.getElementById("plab-content");
			cont.className = this.state + "-select plab-" + this.getStatus() + "-select";
		},
		// showIntro er funksjonen vi skal kalle når vi skal vise intro skjermen
		showIntro : function () {
			this.state = this.states[0];
			this.updateScreen();
		},
		// showConnect er funksjonen vi skal vise bluetooth tilkoblindsskjermen 
		showConnect : function () {
			this.state = this.states[1];
			this.initBLE ();
			this.updateScreen ();
		},
		// showUserSelect er funksjonen vi skal kalle naar vi skal vise ntnu brukernavn velgeren 
		showUserSelect : function () {
			this.state = this.states[2];
			// TODO
			this.updateScreen ();
		},
		// showRedirect er funksjonen vi skal kalle når vi holder paa aa navigere til brukerside
		// TODO Denne er gjort obsolete naar vi kun skal bruke processing.js, og vil bli fjernet
		showRedirect : function () {
			this.state = this.states[3];
			// TODO
			this.updateScreen ();
		},
		// showProcessing er funksjonen som gjør vi går over til processing
		showProcessing : function () {
			// Hent referanser til elementene som trengs
			var usrName = document.getElementById("plab-username").value;
			var procLoc = "http://folk.ntnu.no/" + usrName.replace(/\s/g, "") + "/plab/plab.pde";
			var canvas = document.createElement ("canvas");
			canvas.id = "plab-canvas";
			var debug = document.getElementById ("plab-debug");
			//var canvas = document.getElementById("plab-canvas");
			// Gjør rammeverket usynlig
			document.body.className = "";
			// Setter inn canvasen
			document.body.insertBefore (canvas, document.body.firstChild);
			// Last processing
			Processing.loadSketchFromSources (canvas, [procLoc]);
			
			
			
			var i = 0;
			
			var funk = function () {
				var p = Processing.getInstanceById ("plab-canvas");
				if (p != null) {
					try {
						//
						// Make canvas fill screen
						var w = plabPjsBridge.getWidth ();
						var h = plabPjsBridge.getHeight ();
						canvas.width = w;
						canvas.height = h;
						p.bindPLabBridge (plabPjsBridge);
					} catch (e) {
						alert ("Kunne ikke binde overgang.\nEkstra funksjonalitet er utilgjengelig.");
					}
				} else {
					if (debug != null) {
						i++;
						debug.innerHTML = "funk fail, p==null " + i;
					}
					setTimeout (funk, 500);
				}
			};
			setTimeout (funk, 500);
		},
		
		
		// -------------------------------------------------------------------
		// ------------------------ BLUETOOTH --------------------------------
		// ----------- CONNECT -----------------------------------------------
		// Tilkobling til BLE spesifikke funksjoner
		// INIT
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
			
			// TODO Restart scan
			
			document.getElementById("plab-devices").innerHTML = "";
			bluetoothle.startScan(this.startScanSuccess, this.startScanFailure, null);
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
				// Lar denne stå om vi oppdager noe vi trenger den til.
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
			bluetoothle.disconnect (plab.disconnectSuccess, plab.disconnectFailure);
			plab.btInfo.connected = false;
			plab.btInfo.reconnecting = false;
		},
		disconnectSuccess : function (obj) {
			if (obj.status == "disconnected") {
				plab.closeDevice ();
			} else if (obj.status == "disconnecting") {
				// Lar denne stå hvis den trengs seinere
			} else {
				// Lar denne stå hvis den trengs seinere
			}
		},
		disconnectFailure : function (obj) {
			// hundre prosent sikker på at tilkobling er lukket
			plab.notifyErrorString ("DisconnectFailure: " + obj.error + " - " + obj.message);
			plab.closeDevice ();
		},
		// closeDevice er siste frakoblingsfunksjon
		closeDevice : function () {
			plab.btInfo.connected = false;
			plab.btInfo.reconnecting = false;
			bluetoothle.close (plab.closeSuccess, plab.closeFailure);
		},
		closeSuccess : function (obj) {
			if (obj.status == "closed") {
				// Lar denne stå om vi trenger den senere
			} else {
				// Lar denne stå om vi trenger den senere
			}
		},
		closeFailure : function (obj) {
			plab.notifyErrorString ("CloseFailure: " + obj.error + " - " + obj.message);
		},
		
		// ------------------ SERVICE DISCOVERY ------------------------------
		// COMMON
		postDiscovery : function (success) {
			if (success) {
				// Go to next screen
				plab.showUserSelect ();
				// Make subscription
				plab.startSubscribe ();
			} else {
				// TODO Update screen with failure to discover UART
				plab.notifyErrorString ("DiscoverFailure: Failed to discover UART service");
			}
		},
		
		// ANDROID DISCOVER
		discoverSuccess : function (obj) {
			try {
				if (obj.status == "discovered") {
					// TODO check if service is present
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
			// TODO Make more robust
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
			// TODO Make more robust
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
		/*
		descriptorsSuccess : function (obj) {},
		descriptorsFailure : function (obj) {
			plab.notifyErrorString ("DescriptorsFailure: " + obj.error + " - " + obj.message);
			plab.disconnectDevice ();
		},
		*/

		// -------------- SERVICE USE ----------------------------------------
		// SUBSCRIBE
		startSubscribe : function () {
			var params = {
					"serviceUuid":plab.serviceInfo.serviceUUID,
					"characteristicUuid":plab.serviceInfo.rxUUID,
					"isNotification":true
			};
			
			// Callback funksjonen for subscribes
			bluetoothle.subscribe(
					function (obj) {
						
						try {
							if (obj.status == "subscribedResult") {
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
		}/*,
		
		// -------------------------------------------------------------------
		// Tilkobling til NTNU bruker spesifikke funksjoner
		userSelected : function() {
			// TODO
		}*/
};


var plabPjsBridge = {
	getWidth : function () {
		return window.innerWidth;
	},
	getHeight : function () {
		return window.innerHeight;
	},
	write : function (string) {
		try {
		plab.write (string);
		} catch (e) {
			alert (e);
		}
	},
	subscribeRead : function (obj) {
		plab.messageSubscribers[plab.messageSubscribers.length] = obj.read;
	},
	subscribeError : function (obj) {
		plab.errorSubscribers[plab.errorSubscribers.length] = obj.read;
	}
};

/*
 * -------------------------DEBUG-----------------------
 */
plab.errorSubscribers[0] = function (string) {
	document.getElementById("plab-debug").innerHTML += string + "<br />";
}

var testing = {
	sendLong : function () {
		plab.write("hei. Dette er en kjempemye lengre en bare så du vet det. Tester masse rart her. æøå. Skjønner du");
	}, 
	sendShort : function () {
		plab.write("hei");
	},
	listenNow : function () {
		plab.messageSubscribers[plab.messageSubscribers.length] = function (string) {
			document.getElementById("test-out").innerHTML += string + "<br />";
		}
	}
};
/*
 * -----------------------END--------------------------
 */

plab.initialize();
/*
 * Her følger kode some er spesiell for rammeverksappen
 */

// TODO DET UNDER SKAL FJERNES: Det er ikke html vi skal hente, men rene *.pde filer

// Henter html data lagret på brukerens hjemmeområde.
// Vil evaluere alle script som ligger i html koden 
function fetchUserData(username) {
	
	// Bygg url som henter data
	var url = encodeURI("http://folk.ntnu.no/" + username + "/plab/");
	
	// Selve forespørselen vi skal sende
    var xmlhttp = new XMLHttpRequest();
	
    // Callback funksjonen som blir kallt når det er statusendringer
    // på forespørselen
    xmlhttp.onreadystatechange = function () {
    	// Litt debug output. Vil vise status. Kjekt å vite hvis forspørselen feiler 
    	var out = document.getElementById("plab-output");
    	out.innerHTML = "State: " + xmlhttp.readyState;
    	out.innerHTML += " Status: " + xmlhttp.status;
    	
    	// Sjekk om alt var i orden
        if(xmlhttp.readyState === 4){
            if (xmlhttp.status === 200) {
            	// Isåfall, fjern debug info
            	out.innerHTML = "";
            	// Finn elementet som skal inneholde data mottatt 
            	var cont = document.getElementById("content");
                cont.innerHTML = (xmlhttp.responseText);
                
                // Kjør alle script definert i html filen. 
                var scripts = cont.getElementsByTagName("script");
                for (var i = 0; i < scripts.length; i++) {
                	var scr = scripts[i];
                	if (scr.hasAttribute("src")) {
                		// TODO LAST EKSTERNE SKRIPT
                		// VIKTIG Å GJØRE NOE MED
                	} else {
                		eval(scr.innerHTML);
                	}
                }
                
                // Sjekke om funksjonen onEnter eksisterer, isåfall utfør den 
                if (typeof onEnter === "function") {
                	onEnter();
                }
            }
        }
    };
    // Fortell hvilken forespørsel type, og send den asynkront. Bruker POST for å forhindre caching 
    xmlhttp.open("POST", url , true);
    xmlhttp.send();
}



function userReady() {
	var user = document.getElementById("plab-username").value;
	fetchUserData(user);
}
