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
var plab = {
		// States er alle tilstandene/ skjermene som vises i appen
		states : ["plab-intro","plab-connect","plab-user-select","plab-redirect"],
		// state er tilstanden vi er i akkurat nå
		state : null,
		// Ready er om vi kan kalle cordova funksjonalitet, om enheten er klar.
		ready : false,
		// Service info er riktig for adafruit ble. Ved annen maskinvare kan det være nødvendig å endre disse
		serviceInfo : {
			serviceUUID : "6E400001-B5A3-F393-E0A9-E50E24DCCA9E", // for the Service
			txUUID :  "6E400002-B5A3-F393-E0A9-E50E24DCCA9E", // for the TX Characteristic (Property = Notify)
			rxUUID : "6E400003-B5A3-F393-E0A9-E50E24DCCA9E" // for the RX Characteristic (Property = Write without response)
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
		
		// Initialize er funksjonen som starter det hele
		initialize : function() {
			this.state = this.states[0];
			document.addEventListener("deviceready", this.onDeviceReady, false);
			this.showIntro();
		},
		
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
		
		// onDeviceReady er metoden som blir kjørt når det er trygt å kalle cordova funksjoner
		onDeviceReady : function () {
			// plab.r... pga scope av kallet. Metoden kjøres ikke som klassemetode.
			plab.receivedEvent ("deviceready");
		},
		// receivedEvent er funksjon som kalles når vi mottar en livssykel event for appen 
		receivedEvent : function (id) {
			if (id == "deviceready") {
				this.ready = true;
				this.updateScreen ();
			}
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
		// showUserSelect er funksjonen vi skal kalle når vi skal vise ntnu brukernavn velgeren 
		showUserSelect : function () {
			this.state = this.states[2];
			// TODO
			this.updateScreen ();
		},
		// showRedirect er funksjonen vi skal kalle når vi holder på å navigere til brukerside
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
			var canvas = document.getElementById("plab-canvas");
			// Gjør rammeverket usynlig
			document.getElementsByTagName("body")[0].className = "";
			// Last processing
			Processing.loadSketchFromSources (canvas, [procLoc]);
			
			// Make canvas fill screen
			var w = plabPjsBridge.getWidth ();
			var h = plabPjsBridge.getHeight ();
			canvas.width = w;
			canvas.height = h;
			
			var funk = function () {
				var p = Processing.getInstanceById ("plab-canvas");
				if (p != null) {
					try {
						p.bindPLabBridge (plabPjsBridge);
					} catch (e) {
						alert ("Kunne ikke binde overgang.\nEkstra funksjonalitet er utilgjengelig.");
					}
				} else {
					setTimeout (funk, 1000);
				}
			};
			funk ();
		},
		
		
		// -------------------------------------------------------------------
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
			plab.stopAndClearScanTimeout ();
		    var paramsObj = {"address":address};
			bluetoothle.connect (plab.connectSuccess, plab.connectFailure, paramsObj);
			plab.timers.connect = setTimeout(plab.connectTimeout, 5000);
		},
		connectSuccess : function(obj) {
			alert(JSON.stringify(obj));
			if (obj.status == "connected") {
				// TODO ------------------------------------------------------
				// TODO Trengs discovery før vi kan koble til mon tro. Fikses snart
				// Her ville vi trengt tjenesteoppdagelse for iOS hvis vi brydde oss om slikt
				plab.clearConnectTimeout ();
				plab.btInfo.connected = true;
				plab.btInfo.failed = false;
				plab.showUserSelect ();
				// Make subscription after 1 second, allow the connection time to finish
				setTimeout (plab.startSubscribe, 1000);
			} else if (obj.status != "connecting") {
				plab.btInfo.connected = false;
				plab.btInfo.failed = true;
				plab.updateScreen ();
			}
		},
		connectFailure : function(obj) {
			plab.btInfo.connected = false;
			plab.btInfo.failed = true;
			plab.notifyErrorString ("ConnectFailure: " + obj.error + " - " + obj.message);
			plab.clearConnectTimeout ();
			plab.updateScreen ();
		},
		connectTimeout : function () {
			plab.btInfo.connected = false;
			plab.btInfo.failed = true;
			plab.notifyErrorString ("ConnectFailure: Timeout");
			plab.updateScreen ();
			plab.timers.connect = null;
		},
		clearConnectTimeout : function () {
			if (this.timers.connect != null) {
				clearTimeout (this.timers.connect);
				this.timers.connect = null;
			}
		},
		//RECONNECT
		afterReconnect : [],
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

		// SUBSCRIBE
		startSubscribe : function () {
			var params = {
					"serviceUuid":plab.serviceInfo.serviceUUID,
					"characteristicUuid":plab.serviceInfo.rxUUID,
					"isNotification":true
					};
			
			// TODO REMOVE TESTCODE
			alert (JSON.stringify (params));
			
			bluetoothle.subscribe(
					function (obj) {
						// TODO REMOVE TESTCODE
						plab.notifyMessage (JSON.stringify (obj));
						
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
						// TODO REMOVE TESTCODE
						plab.notifyMessage (JSON.stringify (obj));
						
						plab.notifyErrorString ("SubscribeFailure: " + obj.error + " - " + obj.message);
					},
					params
			);
		},
		
		// WRITE
		write : function (string) {
			if (plab.btInfo.connected) {
				var params = {
						"value" : bluetoothle.bytesToEncodedString (bluetoothle.stringToBytes (message)),
						"serviceUuid" : plab.serviceInfo.serviceUUID,
						"characteristicUuid" : plab.serviceInfo.txUUID,
						"type" : "noResponse"
				};
				// TODO REMOVE TESTCODE
				plab.notifyMessage (JSON.stringify (params));
				
				bluetootle.isConnected (
					function (conn) {
						// TODO REMOVE TESTCODE
						plab.notifyMessage (JSON.stringify (conn));
						
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
		plab.write (string);
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