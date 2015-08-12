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
settingItem = {
		"id" : "string", // Unique key for storage. Not used for group.
		"text-key" : "string", // Optional
		"icon" : "relative-URL", // Optional
		
		"type" : "single-select/text/group/url/number/checkbox", // Radiogroup may be added later
		"options" : [{
		            	 "text-key" : "string". // Optional
		            	 "icon" : "relative-URL", // Optional
		            	 "value" : "string", // Only used for single-select. Others use default
		            	 "min" : number, // Only used for number. Optional
		            	 "max" : number // Only used for number. Optional
		            } ], // Or array of settingItem if group is specified
		"default-value" : "value-string", // Same as selected for single-select
		"description-text-key" : "string",
		"onValueChange" : function(string){} // Optional. Should not store or alter value. Not used for group
}
*/

plab.settingsController = {
		visible : false,
		showSettings : function () {
			plab.settingsController.visible = true;
			document.body.classList.add("plab-show-menu");
		},
		hideSettings : function () {
			plab.settingsController.visible = false;
			document.body.classList.remove("plab-show-menu");
		},
		toggleSettings : function () {
			if (plab.settingsController.visible) {
				plab.settingsController.hideSettings();
			} else {
				plab.settingsController.showSettings();
			}
		},
		addSettingItem : function (item) {
			var settingNode = this.createSettingNode(item);
			if (item.type !== "group") {
				val = this.getSettingValue(item.id);
				if (val == null) {
					if (typeof item["default-value"] !== "undefined") {
						this.setSettingValue(item.id, item["default-value"]);
					} else {
						this.setSettingValue(item.id, "");
					}
				}
			}
			document.getElementById("plab-settings-menu").appendChild(settingNode);
		},
		
		getSettingValue : function(id) {
			return window.localStorage.getItem(id);
		},
		setSettingValue : function(id, val) {
			window.localStorage.setItem(id,val);
		},
		
		createSettingNode : function(item) {
			var sett;
			switch (item.type) {
			case "single-select":
				sett = this.createSingleSelectNode(item);
				break;
			case "text":
			case "url":
			case "number":
			case "checkbox":
				sett = this.createTextNumberCheckboxOrUrlNode(item);
				break;
			case "group":
				var div = document.createElement("div");
				this.createSettingHead(item, div);
				for (var i = 0; i < item.options.length; i++) {
					div.appendChild(this.createSettingNode(item.options[i]));
				}
				sett = div;
				break;
			default:
				throw "Unkown setting type";
			}
			
			if (typeof item["description-text-key"] !== "undefined") {
				var spn = document.createElement("span");
				var key = item["description-text-key"];
				spn.className = "plab-setting-description";
				this.createSetAttributeNode("data-text-key", key, spn);
				var txt = document.createTextNode(plabLangSupport.getText(key));
				spn.appendChild(txt);
				sett.appendChild(spn);
			}
			
			return sett;
		},
		createSettingHead : function(item, holderNode) {
			holderNode.className = "plab-setting";
			
			if (typeof item["text-key"] !== "undefined") {
				holderNode.appendChild(this.createHeaderTextKeyNode(item["text-key"]));
			}
			if (typeof item["icon"] !== "undefined") {
				holderNode.appendChild(this.createImageNode(item["icon"]));
			}
		},
		createSingleSelectNode : function(item) {
			var div = document.createElement("div");
			this.createSettingHead(item, div);
			
			var val = this.getSettingValue(item.id);
			if (val === null){
				val = typeof item["default-value"] !== "undefined" ? item["default-value"] : "";
				this.setSettingValue(item.id, val);
			}
			
			var sel = document.createElement("select");
			for (var i = 0; i < item.options.length; i++) {
				sel.appendChild(this.createSingleOptionNode(item.options[i], item.options[i].value == val));
			}
			
			this.createSetAttributeNode("id", item.id, sel);
			
			sel.addEventListener("change", function() {
				var str = document.getElementById(item.id).value;
				window.localStorage.setItem(item.id, str);
				if (typeof item.onValueChange === "function")
					item.onValueChange(str);
			});
			
			div.appendChild(sel);
			return div;
		},
		createTextNumberCheckboxOrUrlNode : function(item) {
			var div = document.createElement("div");
			this.createSettingHead(item,div);
			
			if (typeof item.options[0]["text-key"] !== "undefined") {
				div.appendChild(this.createLabelTextKeyNode(item.options[0]["text-key"], item.id));
			}
			if (typeof item.options[0]["icon"] !== "undefined") {
				div.appendChild(this.createImageNode(item.options[0]["icon"]));
			}
			var inp = document.createElement("input");
			this.createSetAttributeNode("type", item.type, inp);
			this.createSetAttributeNode("id", item.id, inp);
			
			if (item.type === "number") {
				if (typeof item.options[0]["min"] !== "undefined") {
					this.createSetAttributeNode("min", item.options[0]["min"], inp)
				}
				if (typeof item.options[0]["max"] !== "undefined") {
					this.createSetAttributeNode("max", item.options[0]["max"], inp)
				}
			}
			
			var val = this.getSettingValue(item.id);
			if (val === null){
				if (item.type === "checkbox") {
					val = typeof item["default-value"] !== "undefined" ? item["default-value"] : "false";
				} else {
					val = typeof item["default-value"] !== "undefined" ? item["default-value"] : "";
				}
				this.setSettingValue(item.id, val);
			}
			if (item.type === "checkbox") {
				val = val == "true";	// Javascript is nice...
				inp.checked = val;
			} else {
				this.createSetAttributeNode("value", val, inp);
			}
			
			inp.addEventListener("change", function() {
				var str = "";
				if (item.type === "checkbox") {
					str = document.getElementById(item.id).checked ? "true" : "false";
				} else {
					str = document.getElementById(item.id).value;
				}
				window.localStorage.setItem(item.id, str);
				if (typeof item.onValueChange === "function")
					item.onValueChange(str);
			});
			
			div.appendChild(inp);
			return div;
		},
		
		createSingleOptionNode : function(option, selected) {
			var opt = document.createElement("option");
			this.createSetAttributeNode("value", option["value"], opt);
			if (selected) {
				this.createSetAttributeNode("selected", "true", opt);
			}
			if (typeof option["text-key"] !== "undefined") {
				opt.appendChild(this.createDataTextKeyNode(option["text-key"]));
			}
			if (typeof option["icon"] !== "undefined") {
				opt.appendChild(this.createImageNode(option["icon"]));
			}
			return opt;
		},
		
		createDataTextKeyNode : function(key) {
			var spn = document.createElement("span");
			this.createSetAttributeNode("data-text-key", key, spn);
			var txt = document.createTextNode(plabLangSupport.getText(key));
			spn.appendChild(txt);
			return spn;
		},
		createLabelTextKeyNode : function(key, name) {
			var lbl = document.createElement("label");
			this.createSetAttributeNode("data-text-key", key, lbl);
			this.createSetAttributeNode("for", name, lbl);
			var txt = document.createTextNode(plabLangSupport.getText(key));
			lbl.appendChild(txt);
			return lbl;
		},
		createImageNode : function(location) {
			var im = document.createElement("img");
			this.createSetAttributeNode("src", location, im);
			return im;
		},
		createHeaderTextKeyNode : function(key) {
			var h = document.createElement("h3");
			this.createSetAttributeNode("data-text-key", key, h);
			var txt = document.createTextNode(plabLangSupport.getText(key));
			h.appendChild(txt);
			return h;
		},
		
		createSetAttributeNode : function (attribute, value, element) {
			var att = document.createAttribute(attribute);
			att.value = value;
			element.setAttributeNode(att);
		}
}