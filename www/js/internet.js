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
plab.internet = {
	info : {},
	init : function() {
		// Check if necessary plugin is installed
		if (typeof Connection === "undefined" || typeof navigator.connection === "undefined") {
			plab.out.err.println("Failed to init internet connection");
		}
		
		// Populate info object
		plab.internet.info[Connection.UNKNOWN] = {
			"text-key" : "connection-unknown",
			"class-name" : "plab-warn",
			"online" : true
		};
		plab.internet.info[Connection.ETHERNET] = {
			"text-key" : "connection-ethernet",
			"class-name" : "plab-ok",
			"online" : true
		};
		plab.internet.info[Connection.WIFI] = {
			"text-key" : "connection-wifi",
			"class-name" : "plab-ok",
			"online" : true
		};
		plab.internet.info[Connection.CELL_2G] = {
			"text-key" : "connection-2g",
			"class-name" : "plab-warn",
			"online" : true
		};
		plab.internet.info[Connection.CELL_3G] = {
			"text-key" : "connection-3g",
			"class-name" : "plab-warn",
			"online" : true
		};
		plab.internet.info[Connection.CELL_4G] = {
			"text-key" : "connection-4g",
			"class-name" : "plab-warn",
			"online" : true
		};
		plab.internet.info[Connection.CELL] = {
			"text-key" : "connection-cell",
			"class-name" : "plab-warn",
			"online" : true
		};
		plab.internet.info[Connection.NONE] = {
			"text-key" : "connection-none",
			"class-name" : "plab-err",
			"online" : false
		};
		
		// register listeners
		document.addEventListener("online", plab.internet.update, false);
		document.addEventListener("offline", plab.internet.update, false);
		
		// Do initial update
		plab.internet.update();
	},
	update : function() {
		// Get the required info object
		var infoObj = plab.internet.info[navigator.connection.type];
		// Get the DOM element containing info
		var domEl = document.getElementById("plab-connection-state");
		// Set css class of object
		domEl.className = infoObj["class-name"];
		// Update css class list of body
		if (infoObj["online"]) {
			document.body.classList.remove("plab-offline");
			document.body.classList.add("plab-online");
		} else {
			document.body.classList.remove("plab-online");
			document.body.classList.add("plab-offline");
		}
		// Set text content and update
		domEl.setAttribute("data-text-key", infoObj["text-key"]);
		plabLangSupport.updateFromNode(domEl.parentNode);
	}
};