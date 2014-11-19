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
		// States er alle tilstandene/ skrjermene som vises i appen
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
		onDeviceReady : function() {
			// plab.r... pga scope av kallet. Metoden kjøres ikke som klassemetode.
			plab.receivedEvent("deviceready");
		},
		// receivedEvent er funksjon som kalles når vi mottar en livssykel event for appen 
		receivedEvent : function(id) {
			if (id == "deviceready") {
				this.ready = true;
				this.updateScreen();
			}
		},
		// updateScreen har ansvar for å tegne valgt skjerm
		updateScreen : function() {
			var cont = document.getElementById("plab-content");
			cont.className = this.state + "-select plab-" + this.getStatus() + "-select";
		},
		// showIntro er funksjonen vi skal kalle når vi skal vise intro skjermen
		showIntro : function() {
			this.state = this.states[0];
			this.updateScreen();
		},
		// showConnect er funksjonen vi skal vise bluetooth tilkoblindsskjermen 
		showConnect : function() {
			this.state = this.states[1];
			// TODO
			this.updateScreen();
		},
		// showUserSelect er funksjonen vi skal kalle når vi skal vise ntnu brukernavn velgeren 
		showUserSelect : function() {
			this.state = this.states[2];
			// TODO
			this.updateScreen();
		},
		// showRedirect er funksjonen vi skal kalle når vi holder på å navigere til brukerside
		showRedirect : function() {
			this.state = this.states[3];
			// TODO
			this.updateScreen();
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
			plab.updateScreen();
		},
		updateBLEList : function() {
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
			plab.updateScreen();
		},
		scanTimeout : function() {
			bluetoothle.stopScan (function(obj){}, function(obj){});
			plab.timers.scan = null;
		},
		stopAndClearScanTimeout : function() {
			if (this.timer.scan != null) {
				clearTimeout(this.timers.scan);
				this.scanTimeout();
			}
		},
		// CONNECT
		connectDevice : function(address) {
			this.stopAndClearScanTimeout();
		    var paramsObj = {"address":address};
			bluetoothle.connect(this.connectSuccess, this.connectFailure, paramsObj);
			this.timers.connect = setTimeout(this.connectTimeout, 5000);
		},
		connectSuccess : function(obj) {
			if (obj.status == "connected") {
				// Her ville vi trengt tjenesteoppdagelse for iOS hvis vi brydde oss om slikt
				plab.clearConnectTimeout ();
				plab.btInfo.connected = true;
				plab.btInfo.failed = false;
				plab.showUserSelect ();
				plab.startSubscribe ();
			} else if (obj.status != "connecting") {
				plab.btInfo.connected = false;
				plab.btInfo.failed = true;
				plab.updateScreen ();
			}
		},
		connectFailure : function(obj) {
			plab.btInfo.connected = false;
			plab.btInfo.failed = true;
			plab.clearConnectTimeout ();
			plab.updateScreen ();
		},
		connectTimeout : function () {
			plab.btInfo.connected = false;
			plab.btInfo.failed = true;
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
			plab.updateScreen ();
		},
		reconnectTimeout : function () {
			plab.btInfo.connected = false;
			plab.btInfo.reconnecting = false;
			plab.btInfo.failed = true;
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
			// Lar denne stå om vi trenger den senere
		},
		
		// SUBSCRIBE
		startSubscribe : function () {
			var params = {
					"serviceUuid":plab.serviceInfo.serviceUUID,
					"characteristicUuid":plab.serviceInfo.rxUUID,
					"isNotification":true
					};
			
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
		
		// -------------------------------------------------------------------
		// Tilkobling til NTNU bruker spesifikke funksjoner
		userSelected : function() {
			// TODO
		}
};

var plabPjsBridge {
	getWidth : function () {
		return window.innerWidth;
	},
	getHeight : function () {
		return window.innerHeight;
	},
	write : function (string) {
		// TODO
	},
	subscribeRead : function (obj) {
		messageSubscribers[messageSubscribers.length] = obj.read;
	},
	subscribeError : function (obj) {
		errorSubscribers[errorSubscribers.length] = obj.read;
	}
}

plab.initialize();

/*
 * Her følger kode some er spesiell for rammeverksappen
 */

var ref;

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