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
			"en-gb" : "Welcome. Please wait.",
			"no-nb" : "Velkommen. Vennligst vent."
		},
		"status-device-ready" : {
			"en-gb" : "Welcome. Device is ready.",
			"no-nb" : "Velkommen. Enhet er klar."
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
			"en-gb" : "Ready, not BT not connected",
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
					"Bluetooth\" to skip connection.",
			"no-nb" : "Dette er rammeverket for tilkobling av Bluetooth." +
					" Velg \"Koble til BT\" for \u00E5 koble til, eller " +
					"\"Bruk uten bluetooth\" for \u00E5 hoppe over."
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
			"en-gb" : "Input your NTNU username",
			"no-nb" : "Skriv inn NTNU bruker"
		},
		"redir-tell-state" : {
			"en-gb" : "Redirecting ...",
			"no-nb" : "Viderekobler ..."
		},
		"redir-reminder" : {
			"en-gb" : "Remember, the \"plab.pde\" file must be located " +
					"at \"your_web_folder/plab/\" at the NTNU user area.",
			"no-nb" : "Husk du m\u00E5 ha lagt \"plab.pde\" filen din i" +
					" \"web_mappen_din/plab/\" p\u00E5 NTNU sitt " +
					"brukeromr\u00E5de."
		},
		"redir-loc-desc" : {
			"en-gb" : "That is, you should see it by visiting ",
			"no-nb" : "Det vil si du skal se den om du g\u00E5r til "
		},
		"redir-location" : {
			"en-gb" : "folk.ntnu.no/[USERNAME]/plab/plab.pde",
			"no-nb" : "folk.ntnu.no/[BRUKER]/plab/plab.pde"
		},
		"without-bluetooth" : {
			"en-gb" : "Use without Bluetooth",
			"no-nb" : "Bruk uten Bluetooth"
		},
		"back" : {
			"en-gb" : "Back",
			"no-nb" : "Tilbake"
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
		// ----------- Settings -----------------------------------------------
		"domain-setting-definition" : {
			"en-gb" : "Processing source URL:",
			"no-nb" : "Processing kildefillokasjon:"
		},
		"setting-accept" : {
			"en-gb" : "Accept and save changes",
			"no-nb" : "Godta og lagre endringer"
		},
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
