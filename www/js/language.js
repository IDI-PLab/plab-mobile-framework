/*
 		{
			"en-gb" : "",
			"no-nb" : ""
		}
 */

var plabLang = {
		"meta" : {
			"supported-lang" : ["en-gb", "no-nb"],
			"default-lang" : "en-gb",
			"current-lang" : "en-gb"
		},
		
		"unknown-key" : {
			"en-gb" : "???",
			"no-nb" : "???"
		},
		
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
		}
}

var plabLangSupport = {
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
		setLanguage : function(lang) {
			if (plabLang.meta["supported-lang"].indexOf(lang) < 0)
				return;
			plabLang.meta["current-lang"] = lang;
			// TODO Store current language
			plabLangSupport.updateAll();
		},
		loadLanguage : function() {
			// TODO Load the language
			plabLangSupport.updateAll();
		},
		updateAll : function() {
			plabLangSupport.updateFromNode(document);
		},
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

// TODO REMOVE : this should only be used while developing
function test() {
	alert("ok");
	try {
		plabLangSupport.updateAll();
	} catch (e) {
		alert(e);
		alert(JSON.stringify(e));
	}
	alert("nok");
}
//test();
// Unforetunately, we must wait until device is ready to do dom changes.
document.addEventListener(
		"deviceready",
		test, 
		false
);
