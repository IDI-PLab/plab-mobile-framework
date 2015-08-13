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
plab.plcup = {
	settingInfo : {
		groupId : "plcup-setting-group",
		enableId : "plcup-enable",
		timeoutId : "plcup-timeout"
	},
	timeout : null,
	states : {
		idle : 0,
		sentStartMessage : 1,
		sentRequestStart : 2,
		receivedAnswerStartToken : 3
	},
	state : -1,
	receivedAnswer : [],
	requestCode : false,
	
	init : function() {
		// Register settings
		plab.settingsController.addSettingItem({
			"id" : plab.plcup.settingInfo.groupId,
			"text-key" : "plcup-setting-definition",
			"type" : "group",
			"options" : [ {
				"id" : plab.plcup.settingInfo.enableId,
				"type" : "checkbox",
				"options" : [ {
					"text-key" : "plcup-setting-enable"
				} ],
				"default-value" : "false",
				"onValueChange" : plab.plcup.updateEnabledStatus
			}, {
				"id" : plab.plcup.settingInfo.timeoutId,
				"type" : "number",
				"options" : [ {
					"text-key" : "plcup-setting-timeout",
					"min" : "1",
					"max" : "30"
				} ],
				"default-value" : "5"
			} ],
			"description-text-key" : "plcup-setting-description"
		});
		// Update enabled status of PLCUP
		plab.plcup.updateEnabledStatus(plab.settingsController.getSettingValue("plcup-enable"));
		// Set state
		plab.plcup.state = plab.plcup.states.idle;
	},
	updateEnabledStatus : function(val) {
		if (val == "true") {
			plab.plcup.enable();
		} else {
			plab.plcup.disable();
		}
	},
	enable : function() {
		// register post connect callback
		plabBT.addOnConnectedCallback(plab.plcup.postConnect);
	},
	disable : function() {
		// Clean up on disable
		plabBT.removeOnConnectedCallback(plab.plcup.postConnect);
	},
	postConnect : function() {
		// Call directly after device has been connected. Read protocol.
		
		// 1. Clear all previous load buttons from DOM
		var plcupHolder = document.getElementById("plab-plcup-select");
		while (plcupHolder.firstChild) {
			plcupHolder.removeChild(plcupHolder.firstChild);
		}
		
		// 2. Insert note of loading into DOM
		var spn = document.createElement("span");
		var att = document.createAttribute("data-text-key");
		att.value = "plcup-loading";
		spn.setAttributeNode(att);
		var txt = document.createTextNode(plabLangSupport.getText("plcup-loading"));
		spn.appendChild(txt);
		plcupHolder.appendChild(spn);
		
		// 3. Listen to incomming messages
		plabBT.receiveCallback(plab.plcup.onReceiveMessage);
		
		// 4. Send PLCUP start message to device
		// empty line, ensure correct start
		plabBT.send("");
		// Protocol start
		plabBT.send("PLCUP/0.1");
		
		// 5. update state
		plab.plcup.state = plab.plcup.states.sentStartMessage;
		
		// 6. Read timeout time, convert to milliseconds and register timeout
		var time = plab.settingsController.getSettingValue(plab.plcup.settingInfo.timeoutId) * 1000;
		plab.plcup.timeout = setTimeout(plab.plcup.plcupFailure, time);
	},
	onReceiveMessage : function(str) {
		// Fetch DOM element
		var plcupHolder = document.getElementById("plab-plcup-select");
		
		
		switch (plab.plcup.state) {
		case plab.plcup.states.sentStartMessage:
			// Clear DOM
			while (plcupHolder.firstChild) {
				plcupHolder.removeChild(plcupHolder.firstChild);
			}
			// Clear error timeout
			if (plab.plcup.timeout !== null) {
				clearTimeout(plab.plcup.timeout);
				plab.plcup.timeout = null;
			}
			// based on message content, add elements to DOM or fail
			switch (str) {
			case "PLCUP COD":
				plab.plcup.addCodeButton(plcupHolder);
				break;
			case "PLCUP URI":
				plab.plcup.addURIButton(plcupHolder);
				break;
			case "PLCUP NON":
				break;
			case "PLCUP C/U":
				plab.plcup.addCodeButton(plcupHolder);
				plab.plcup.addURIButton(plcupHolder);
				break;
			case "PLCUP ERR":
				// Fallthrough
			default:
				plab.plcup.plcupFailure();
			}
			break;
		case plab.plcup.states.sentRequestStart:
			// Clear and restart error timeout
			if (plab.plcup.timeout !== null) {
				clearTimeout(plab.plcup.timeout);
				var time = plab.settingsController.getSettingValue(plab.plcup.settingInfo.timeoutId) * 1000;
				plab.plcup.timeout = setTimeout(plab.plcup.plcupFailure, time);
			}
			if (str == "PLCUP BEG") {
				plab.plcup.state = plab.plcup.states.receivedAnswerStartToken;
				plab.plcup.receivedAnswer = [];
			} else {
				plab.plcup.plcupFailure();
			}
			break;
		case plab.plcup.states.receivedAnswerStartToken:
			if (str == "PLCUP END") {
				plab.plcup.requestAnswerCompleted();
			} else if (str == "PLCUP ERR") {
				plab.plcup.plcupFailure();
			} else {
				// Clear and restart error timeout
				if (plab.plcup.timeout !== null) {
					clearTimeout(plab.plcup.timeout);
					var time = plab.settingsController.getSettingValue(plab.plcup.settingInfo.timeoutId) * 1000;
					plab.plcup.timeout = setTimeout(plab.plcup.plcupFailure, time);
				}
				plab.plcup.receivedAnswer[plab.plcup.receivedAnswer.length] = str;
			}
			break;
		case plab.plcup.states.idle:
			// Fallthrough
		default:
			// Should not receive message
			plab.plcup.plcupFailure();
		}
		//
	},
	
	addCodeButton : function(element) {
		var plcupHolder = document.getElementById("plab-plcup-select");
		
		var btn = document.createElement("button");
		
		var spn = document.createElement("span");
		var att = document.createAttribute("data-text-key");
		att.value = "plcup-load-from-code";
		spn.setAttributeNode(att);
		var txt = document.createTextNode(plabLangSupport.getText("plcup-load-from-code"));
		spn.appendChild(txt);
		btn.appendChild(spn);
		
		// <img src="img/next.png" alt="PLCUP code" />
		var img = document.createElement("img");
		att = document.createAttribute("src");
		att.value = "img/next.png";
		img.setAttributeNode(att);
		att = document.createAttribute("alt");
		att.value = "PLCUP code";
		img.setAttributeNode(att);
		btn.appendChild(img);
		
		btn.addEventListener("click", plab.plcup.requestLoadFromCode);
		
		plcupHolder.appendChild(btn);
	},
	addURIButton : function(element) {
		var plcupHolder = document.getElementById("plab-plcup-select");
		
		var btn = document.createElement("button");
		btn.classList.add("plab-need-internet");
		
		var spn = document.createElement("span");
		var att = document.createAttribute("data-text-key");
		att.value = "plcup-load-from-uri";
		spn.setAttributeNode(att);
		var txt = document.createTextNode(plabLangSupport.getText("plcup-load-from-uri"));
		spn.appendChild(txt);
		btn.appendChild(spn);
		
		// <img src="img/next.png" alt="PLCUP URI" />
		var img = document.createElement("img");
		att = document.createAttribute("src");
		att.value = "img/next.png";
		img.setAttributeNode(att);
		att = document.createAttribute("alt");
		att.value = "PLCUP URI";
		img.setAttributeNode(att);
		btn.appendChild(img);
		
		btn.addEventListener("click", plab.plcup.requestLoadFromURI);
		
		plcupHolder.appendChild(btn);
	},
	
	clearDomStateWorking : function() {
		var plcupHolder = document.getElementById("plab-plcup-select");
		while (plcupHolder.firstChild) {
			plcupHolder.removeChild(plcupHolder.firstChild);
		}
		
		var spn = document.createElement("span");
		var att = document.createAttribute("data-text-key");
		att.value = "plcup-working";
		spn.setAttributeNode(att);
		var txt = document.createTextNode(plabLangSupport.getText("plcup-working"));
		spn.appendChild(txt);
		plcupHolder.appendChild(spn);
	},
	
	requestLoadFromCode : function() {
		if (plab.plcup.state == plab.plcup.states.sentStartMessage) {
			// Clear dom and give message of working
			plab.plcup.clearDomStateWorking();
			// Set request type
			plab.plcup.requestCode = true;
			// Set state
			plab.plcup.state = plab.plcup.states.sentRequestStart;
			// Send load request
			plabBT.send("PLCUP G COD");
			// Start error timeout
			if (plab.plcup.timeout !== null) {
				clearTimeout(plab.plcup.timeout);
			}
			var time = plab.settingsController.getSettingValue(plab.plcup.settingInfo.timeoutId) * 1000;
			plab.plcup.timeout = setTimeout(plab.plcup.plcupFailure, time);
		}
	},
	requestLoadFromURI : function() {
		// Clear dom and give message of working
		plab.plcup.clearDomStateWorking();
		// Set request type
		plab.plcup.requestCode = false;
		// Set state
		plab.plcup.state = plab.plcup.states.sentRequestStart;
		// Send load request
		plabBT.send("PLCUP G URI");
		// Start error timeout
		if (plab.plcup.timeout !== null) {
			clearTimeout(plab.plcup.timeout);
		}
		var time = plab.settingsController.getSettingValue(plab.plcup.settingInfo.timeoutId) * 1000;
		plab.plcup.timeout = setTimeout(plab.plcup.plcupFailure, time);
	},
	
	requestAnswerCompleted : function() {
		// Clear error timeout
		if (plab.plcup.timeout !== null) {
			clearTimeout(plab.plcup.timeout);
			plab.plcup.timeout = null;
		}
		// Update state to idle
		plab.plcup.state = plab.plcup.states.idle;
		// Stop listening
		plabBT.removeReceiveCallback(plab.plcup.onReceiveMessage);
		// Ask for load
		plab.doShowProcessing(false, true, plab.plcup.requestCode, plab.plcup.receivedAnswer);
	},
	
	plcupFailure : function() {
		plab.out.warn.println("PLCUP Failed");
		// 1. clear timeout
		if (plab.plcup.timeout !== null) {
			clearTimeout(plab.plcup.timeout);
			plab.plcup.timeout = null;
		}
		// 2. Clear DOM area and tell about the failure
		// Clear
		var plcupHolder = document.getElementById("plab-plcup-select");
		while (plcupHolder.firstChild) {
			plcupHolder.removeChild(plcupHolder.firstChild);
		}
		
		// note of failure
		var spn = document.createElement("span");
		var att = document.createAttribute("data-text-key");
		att.value = "plcup-failure";
		spn.setAttributeNode(att);
		var txt = document.createTextNode(plabLangSupport.getText("plcup-failure"));
		spn.appendChild(txt);
		plcupHolder.appendChild(spn);
		
		// 3. Set state to idle
		plab.plcup.state = plab.plcup.states.idle;
		
		// 4. Disable listening to messages
		plabBT.removeReceiveCallback(plab.plcup.onReceiveMessage);
	}
};

document.addEventListener("deviceready", plab.plcup.init, false);