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
 * This file should contain all translatable text within the app.
 */

/*
 * Special characters:
 * Æ: \u00C6 æ: \u00E6
 * Ø: \u00D8 ø: \u00F8
 * Å: \u00C5 å: \u00E5
 */

// plabLang : the object holding all translatable text. Some meta information
// about supported languages and current language is also included.
var plabLang = {
		// Information: Supported languages, which language we should default
		// to (must have translation for all keys, which language is currently
		// showing
		"meta" : {
			"supported-lang" : [
                {
                	"text-key" : "en-gb",
                	"icon" : "img/gb.png",
                	"value" : "en-gb"
                },
                {
                	"text-key" : "no-nb",
                	"icon" : "img/nor.png",
                	"value" : "no-nb"
                }
            ],
			"default-lang" : "en-gb",
			"current-lang" : "en-gb",
			"storage-key" : "plab-language"
		},
		
		// Unknown key: The text shown if an attempt to look up an illegal key
		// has been made 
		"unknown-key" : {
			"en-gb" : "???",
			"no-nb" : "???"
		},
		
		// --------------------------------------------------------------------
		// ---- All data; all translatable strings ----------------------------
		// --------------------------------------------------------------------
		
		"title" : {
			"en-gb" : "PLab Framework",
			"no-nb" : "PLab rammeverk"
		},
		"status-first-init" : {
			"en-gb" : "Welcome. Please wait",
			"no-nb" : "Velkommen. Vennligst vent"
		},
		"status-device-ready" : {
			"en-gb" : "Welcome. Device is ready",
			"no-nb" : "Velkommen. Enhet er klar"
		},
		"status-bt-init" : {
			"en-gb" : "Initialising BT",
			"no-nb" : "Initialiserer BT"
		},
		"status-bt-connect" : {
			"en-gb" : "Connecting BT",
			"no-nb" : "Koble til BT"
		},
		"status-bt-failed" : {
			"en-gb" : "Unable to connect",
			"no-nb" : "Kan ikke koble til"
		},
		"status-userselect-unconn" : {
			"en-gb" : "Ready, BT not connected",
			"no-nb" : "Klar, ikke tilkoblet BT"
		},
		"status-userselect-conn" : {
			"en-gb" : "Ready, connected BT",
			"no-nb" : "Klar, tilkoblet BT"
		},
		"status-redir-connect" : {
			"en-gb" : "Redirecting, attempt ",
			"no-nb" : "Viderekobler, fors\u00F8k "
		},
		"status-redir-ready" : {
			"en-gb" : "Ready",
			"no-nb" : "Klar"
		},
		"status-redir-failed" : {
			"en-gb" : "Redirect failed",
			"no-nb" : "Viderekobling feilet"
		},
		"greeting" : {
			"en-gb" : "This is a framework for conecting to Bluetooth. " +
					"Choose \"Connect\" to connect, or \"Use without " +
					"Bluetooth\" to skip connection",
			"no-nb" : "Dette er rammeverket for tilkobling av Bluetooth" +
					" Velg \"Koble til BT\" for \u00E5 koble til, eller " +
					"\"Bruk uten bluetooth\" for \u00E5 hoppe over"
		},
		"available-unit-list" : {
			"en-gb" : "Available units:",
			"no-nb" : "Tilgjengelige enheter:"
		},
		"update-button" : {
			"en-gb" : "Refresh",
			"no-nb" : "Oppdater"
		},
		"user-input-desc" : {
			"en-gb" : "Input sketch id. Meaning of this can be changed in settings. Default is NTNU user",
			"no-nb" : "Oppgi skisse id. Betydningen kan endres i innstillinger. Standard er NTNU bruker"
		},
		"user-input-include-lib" : {
			"en-gb" : "Include library file (defined in settings)",
			"no-nb" : "Inkluder biblioteksfil (definert i instillinger)"
		},
		"add-pde-file" : {
			"en-gb" : "Add a .pde file",
			"no-nb" : "Legg til en .pde fil"
		},
		"redir-tell-state" : {
			"en-gb" : "Redirecting ..",
			"no-nb" : "Viderekobler .."
		},
		"redir-reminder" : {
			"en-gb" : "Remember, the .pde file(s) must be located at the " +
					"correct address",
			"no-nb" : "Husk du m\u00E5 ha lagt .pde filen(e) din(e) p\u00E5" +
					" riktig adresse"
		},
		"without-bluetooth" : {
			"en-gb" : "Use without Bluetooth",
			"no-nb" : "Bruk uten Bluetooth"
		},
		"back" : {
			"en-gb" : "Back",
			"no-nb" : "Tilbake"
		},
		"rerun-last" : {
		"en-gb" : "Rerun last sketch",
		"no-nb" : "Kj\u00F8r forrige skisse"
		},
		"load-processing" : {
			"en-gb" : "Load Processing!",
			"no-nb" : "Last Processing!"
		},
		"back-to-start" : {
			"en-gb" : "Back to start",
			"no-nb" : "Tilbake til start"
		},
		"cancel" : {
			"en-gb" : "Cancel",
			"no-nb" : "Avbryt"
		},
		"powered-by" : {
			"en-gb" : "Powered by:",
			"no-nb" : "Drives av:"
		},
		// ----------- Processing functionality failure -----------------------
		"processing-func-failure" : {
			"en-gb" : "Could not bind bridge.\nExtra functionality unavailable",
			"no-nb" : "Kunne ikke binde overgang.\nEkstra funksjonalitet er utilgjengelig"
		},
		// ----------- Settings -----------------------------------------------
		"hide-settings" : {
			"en-gb" : "Hide settings",
			"no-nb" : "Skjul innstillinger"
		},
		"domain-setting-definition" : {
			"en-gb" : "Processing source URL:",
			"no-nb" : "Processing kildefillokasjon:"
		},
		"domain-setting-base" : {
			"en-gb" : "Input URL address base",
			"no-nb" : "Skriv inn adressestart"
		},
		"library-setting" : {
			"en-gb" : "Processing library location",
			"no-nb" : "Processing biblioteklokasjon"
		},
		"domain-setting-postfix" : {
			"en-gb" : "Input URL address end",
			"no-nb" : "Skriv inn adresseslutt"
		},
		"domain-setting-description" : {
			"en-gb" : "The final address for your sketch will be URL-base[USER_INPUT]URL-end",
			"no-nb" : "Den komplette addressen skissen er addressestart[BRUKER_INPUT]addresseslutt"
		},
		"btle-servive-select" : {
			"en-gb" : "Select BTLE service",
			"no-nb" : "Velg BTLE tjeneste"
		},
		"btle-default" : {
			"en-gb" : "Default service (FFE0)",
			"no-nb" : "Standardtjeneste (FFE0)"
		},
		"btle-nordic" : {
			"en-gb" : "Nordic Semiconductor service",
			"no-nb" : "Nordic Semiconductor tjeneste"
		},
		"btle-service-select-desc" : {
			"en-gb" : "Different devices use different services to connect",
			"no-nb" : "Ulike enheter bruker ulike tjenester for tilkobling"
		},
		// ------------ Ok -----------------------------------
		"ok" : {
			"en-gb" : "Ok",
			"no-nb" : "Ok"
		},
		// ------------ Processing loading -----------------------
		"proc-err-xhr-status" : {
			"en-gb" : "Invalid XHR status:",
			"no-nb" : "Ugyldig XHR status:"
		},
		"proc-err-xhr-origin" : {
			"en-gb" : "XHR failed, possibly same origin policy problem",
			"no-nb" : "XHR feilet, muligens samme opprinnelse problem"
		},
		"proc-err-empty-file" : {
			"en-gb" : "File was empty",
			"no-nb" : "Filen var tom"
		},
		"proc-err-local-element" : {
			"en-gb" : "Can not select local elements",
			"no-nb" : "Kan ikke velge lokale elementer"
		},
		// ---------- Open source repo location
		"opensource-location" : {
			"en-gb" : "Project is Open Source, see:",
			"no-nb" : "Prosjektet har \u00E5pen kildekode, se:"
		},
		// ---------- Connection status messages
		"connection-unknown" : {
			"en-gb" : "Unknown Internet connection",
			"no-nb" : "Ukjent Internet tilknyttning"
		},
		"connection-ethernet" : {
			"en-gb" : "Ethernet connection",
			"no-nb" : "Ethernet tilknyttning"
		},
		"connection-wifi" : {
			"en-gb" : "WiFi connection",
			"no-nb" : "WiFi tilknyttning"
		},
		"connection-2g" : {
			"en-gb" : "2G connection",
			"no-nb" : "2G tilknyttning"
		},
		"connection-3g" : {
			"en-gb" : "3G connection",
			"no-nb" : "3G tilknyttning"
		},
		"connection-4g" : {
			"en-gb" : "4G connection",
			"no-nb" : "4G tilknyttning"
		},
		"connection-cell" : {
			"en-gb" : "Generic cell connection",
			"no-nb" : "Generisk mobiltilknyttning"
		},
		"connection-none" : {
			"en-gb" : "No Internet connection",
			"no-nb" : "Ingen Internet tilgang"
		},
		// ----------- PLCUP protocol text ------------------------------------
		// Settings
		"plcup-setting-definition" : {
			"en-gb" : "PLCUP",
			"no-nb" : "PLCUP"
		},
		"plcup-setting-enable" : {
			"en-gb" : "Enable PLCUP",
			"no-nb" : "Sl\u00E5 p\u00E5 PLCUP"
		},
		"plcup-setting-timeout" : {
			"en-gb" : "PLCUP timeout",
			"no-nb" : "PLCUP tidsavbrudd"
		},
		"plcup-setting-description" : {
			"en-gb" : "PLCUP - Programming Lab Code URI Protocol. Automatic retrieve code or code location from connected device",
			"no-nb" : "PLCUP - Programming Lab Code URI Protocol. Automatisk henting av kode eller kodelokasjon fra tilkoblet enhet"
		},
		// in-app
		"plcup-loading" : {
			"en-gb" : "Loading PLCUP...",
			"no-nb" : "PLCUP laster..."
		},
		"plcup-failure" : {
			"en-gb" : "PLCUP failed!",
			"no-nb" : "PLCUP feilet!"
		},
		"plcup-load-from-code" : {
			"en-gb" : "Load fom PLCUP code",
			"no-nb" : "Last fra PLCUP kode"
		},
		"plcup-load-from-uri" : {
			"en-gb" : "Load fom PLCUP URI",
			"no-nb" : "Last fra PLCUP URI"
		},
		"plcup-working" : {
			"en-gb" : "PLCUP is working...",
			"no-nb" : "PLCUP arbeider..."
		},
		/*
		"" : {
			"en-gb" : "",
			"no-nb" : ""
		},
		*/
		// ----------- Dynamic language definitions ...........................
		"connect-to" : {
			"en-gb" : "Connect to ",
			"no-nb" : "Koble til "
		}
}


// ----------------------------------------------------------------------------
// -- Support functionality for languages -------------------------------------
//-----------------------------------------------------------------------------
// plabLangSupport : the object holding all functions needed to support
// multiple languages in app.
var plabLangSupport = {
		// getText(key) : gets string for the current language associated with
		// key
		getText : function(key) {
			var textNode;
			if (plabLang.hasOwnProperty(key)) {
				textNode = plabLang[key];
			} else {
				textNode = plabLang["unknown-key"];
			}
			if (textNode.hasOwnProperty(plabLang.meta["current-lang"])) {
				return textNode[plabLang.meta["current-lang"]];
			}
			return textNode[plabLan.meta["default-lang"]];
		},
		// setLanguage(lang) : if lang is a legal identifier of supported
		// languages, the current language is set to this language and all
		// translatable text is updated. Which language is set is also stored.
		setLanguage : function(lang) {
			// Cancel if language is unknown
			for (var i = 0; i < plabLang.meta["supported-lang"].length; i++) {
				if (plabLang.meta["supported-lang"].value === lang)
					return;
			}
			// Cancel if the selected language is equal to set language
			if (plabLang.meta["current-lang"] === lang)
				return;
			plabLang.meta["current-lang"] = lang;
			// Store set language
			window.localStorage.setItem(plabLang.meta["storage-key"], lang);
			plabLangSupport.updateAll();
		},
		// loadLanguage() : loads the previous stored language and updates all
		// translatable text
		loadLanguage : function() {
			var newLang = window.localStorage.getItem(plabLang.meta["storage-key"]);
			if (newLang !== null)
				plabLang.meta["current-lang"] = newLang;
			plabLangSupport.updateAll();
		},
		// updateAll() : updates all translatable text to the current set
		// language
		updateAll : function() {
			plabLangSupport.updateFromNode(document);
		},
		// updateFromNode(node) : updates all translatable text to current set
		// language from the dom node given as argument
		updateFromNode : function(node) {
			var nodeList = node.getElementsByTagName("*");
			for (var i = 0; i < nodeList.length; i++) {
				var current = nodeList[i];
				if (current.hasAttribute("data-text-key")) {
					// Get the key name
					var key = current.getAttribute("data-text-key");
					// Remove all current text nodes
					var child = current.firstChild;
					while (child) {
						var next = child.nextSibling;
						if (child.nodeType === 3) {
							current.removeChild(child);
						}
						child = next;
					}
					// Create text node and insert before the first child (if any)
					var textNode = document.createTextNode(plabLangSupport.getText(key));
					if (current.firstChild) {
						current.insertBefore(textNode, current.firstChild);
					} else {
						current.appendChild(textNode);
					}
				}
			}
		}
}

// Unforetunately, we must wait until device is ready to do dom changes.
document.addEventListener(
		"deviceready",
		plabLangSupport.loadLanguage, 
		false
);
