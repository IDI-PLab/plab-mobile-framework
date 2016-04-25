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
// processingFunc : Deals with the actual loading of processing.
plab.processingFunc = {
	// processingInstance is the instance of processing that is currently
	// running, if any
	processingInstance : null,
	checkCount : 0,
	attempt : 0,
	// processingInfo will be filled to hold processing redirect info during
	// show and setting keys
	processingInfo : {
		"url-keys" : {
			"base" : "plab-base-url",
			"postfix" : "plab-postfix-url"
		},
		// Setting store keys
		"library-key" : "plab-lib-loc",
		"library-include" : "plab-include-library",

		// Cached sketch storage key
		"cache-key" : "plab-processing-cache",

		// Used data during load
		"include-library" : false,
		"include-library-loc" : "",

		// Multi-file allow select key
		"include-show-key" : "plab-show-multi-include",
		// Multi-file sketch file list
		"include-additional-files" : [],

		"address-base" : "",
		"address-postfix" : "",
		"complete-address" : ""
	},
	// When we retry loading of sketches, we need to remember if we were given som code or not.
	givenCode : null,

	// Cache: Store previous run sketch. Functionality to load from cache, and store to cache.
	cache : {
		clear : function() {
			window.localStorage.removeItem(plab.processingFunc.processingInfo["cache-key"]);
		},
		hasContent : function() {
			return window.localStorage.getItem(plab.processingFunc.processingInfo["cache-key"]) !== null;
		},
		loadSketchFromCache : function(canvas) {
			// Make sure we have content in the cache before continuing
			if (!plab.processingFunc.cache.hasContent()) {
				return;
			}
			// Load from cache
			var allCode = window.localStorage
					.getItem(plab.processingFunc.processingInfo["cache-key"]);
			// And run
			return new Processing(canvas, allCode);
		},
		loadAndCacheSketchFromCode : function(canvas, code) {
			// Clear old cache
			plab.processingFunc.cache.clear();
			
			// Load IncludeLib
			function ajaxAsync(url, callback) {
				var xhr = new XMLHttpRequest();
				xhr.onreadystatechange = function() {
					if (xhr.readyState === 4) {
						var error, status;
						if (xhr.status !== 200 && xhr.status !== 0) {
							error = "proc-err-xhr-status";
							status = xhr.status;
						} else if (xhr.responseText === "") {
							// Give a hint when loading fails due to same-origin
							// issues
							if (("withCredentials" in new XMLHttpRequest())
									&& (new XMLHttpRequest()).withCredentials === false
									&& window.location.protocol === "file:") {
								error = "proc-err-xhr-origin";
							} else {
								error = "proc-err-empty-file";
							}
						}

						callback(xhr.responseText, error, status);
					}
				};
				xhr.open("GET", url, true);
				if (xhr.overrideMimeType) {
					xhr.overrideMimeType("application/json");
				}
				xhr.setRequestHeader("If-Modified-Since",
						"Fri, 01 Jan 1960 00:00:00 GMT"); // no cache
				xhr.send(null);
			}
			
			function onLoaded(resp, error, status) {
				if (error) {
					plab.out.err.println("Failed to load lib/InterfacesInc.pde: " + error + " " + status);
				} else {
					code.splice(0, 0, resp);
				}
				var allCode = code.join("\n");
				// CACHE THE RESULTING CODE
				try {
					window.localStorage.setItem(
									plab.processingFunc.processingInfo["cache-key"],
									allCode
					);
				} catch (e) {
					plab.out.err.println("Could not cache processing code");
				}
				// And load processing
				return new Processing(canvas, allCode);
			}
			
			ajaxAsync("lib/InterfacesInc.pde", onLoaded);
		},
		// Modified from processing.js 1.4.15 loadSketchFromSources
		loadAndCacheSketchFromSources : function(canvas, sources) {
			// Clear old cache
			plab.processingFunc.cache.clear();
			// And do load
			var code = [], errors = [], sourcesCount = sources.length, loaded = 0, outElements = [];

			function ajaxAsync(url, callback) {
				var xhr = new XMLHttpRequest();
				xhr.onreadystatechange = function() {
					if (xhr.readyState === 4) {
						var error, status;
						if (xhr.status !== 200 && xhr.status !== 0) {
							error = "proc-err-xhr-status";
							status = xhr.status;
						} else if (xhr.responseText === "") {
							// Give a hint when loading fails due to same-origin
							// issues
							if (("withCredentials" in new XMLHttpRequest())
									&& (new XMLHttpRequest()).withCredentials === false
									&& window.location.protocol === "file:") {
								error = "proc-err-xhr-origin";
							} else {
								error = "proc-err-empty-file";
							}
						}

						callback(xhr.responseText, error, status);
					}
				};
				xhr.open("GET", url, true);
				if (xhr.overrideMimeType) {
					xhr.overrideMimeType("application/json");
				}
				xhr.setRequestHeader("If-Modified-Since",
						"Fri, 01 Jan 1960 00:00:00 GMT"); // no cache
				xhr.send(null);
			}

			function loadBlock(index, filename) {
				function callback(block, error, status) {
					code[index] = block;
					++loaded;
					if (error) {
						errors.push(filename + " ==> " + error);
						outElements[index].className = "plab-err";
						// Create error message
						var spn = document.createElement("span");
						var att = document.createAttribute("data-text-key");
						att.value = error;
						spn.setAttributeNode(att);
						spn.appendChild(document.createTextNode(plabLangSupport
								.getText(error)));
						outElements[index].appendChild(spn);
						if (status) {
							outElements[index].appendChild(document
									.createTextNode(status));
						}
					} else {
						outElements[index].className = "plab-ok";
					}
					if (loaded === sourcesCount) {
						if (errors.length === 0) {
							// This used to throw, but it was constantly getting
							// in the
							// way of debugging where things go wrong!
							var allCode = code.join("\n");
							// CACHE THE RESULTING CODE
							try {
								window.localStorage.setItem(plab.processingFunc.processingInfo["cache-key"], allCode);
							} catch (e) {
								plab.out.err.println("Could not cache processing code");
							}
							// And load processing
							return new Processing(canvas, allCode);
						} else {
							plab.out.err.println("Unable to load pjs sketch files: " + errors.join("\n"));
						}
					}
				}
				if (filename.charAt(0) === '#') {
					callback("", "proc-err-local-element", false);
					return;
				}

				ajaxAsync(filename, callback);
			}

			// Where we tell user what has happened
			var userOutput = document.getElementById("plab-sketch-locations");
			// clear previous output
			while (userOutput.firstChild) {
				userOutput.removeChild(userOutput.firstChild);
			}

			// Go through all source files, and load them
			for ( var i = 0; i < sourcesCount; ++i) {
				// Create div element to hold feedback
				outElements[i] = document.createElement("div");
				outElements[i].className = "plab-wait";
				// Create code element to hold location
				var loc = document.createElement("code");
				loc.appendChild(document.createTextNode(sources[i]));
				outElements[i].appendChild(loc);
				// Add element to correct location
				userOutput.appendChild(outElements[i]);
				// Load the data
				loadBlock(i, sources[i]);
			}
		}
	},
	// To unload the processing instance, we use a simple function
	unloadProcessing : function() {
		if (plab.processingFunc.processingInstance !== null) {
			plab.processingFunc.processingInstance.exit();
			plab.processingFunc.processingInstance = null;
			// Clear canvas
			var canvas = document.getElementById("plab-canvas");
			var context = canvas.getContext("2d");
			context.setTransform(1, 0, 0, 1, 0, 0);
			context.clearRect(0, 0, canvas.width, canvas.height);
			// Reshow screen
			document.body.classList.add("plab");
		}
	},
	// The definition of the function that starts the http request to load
	// processing.
	startLoadURLs : function() {
		
		// Get the URL(s) that should be loaded
		var loadUrls = [];
		if (plab.processingFunc.processingInfo["include-library"]) {
			loadUrls[loadUrls.length] = plab.processingFunc.processingInfo["include-library-loc"];
		}
		loadUrls[loadUrls.length] = plab.processingFunc.processingInfo["complete-address"];
		// Load additional files ONLY if additional files are visible in UI
		if (plab.settingsController.getSettingValue(plab.processingFunc.processingInfo["include-show-key"]) == "true") {
			for ( var i = 0; i < plab.processingFunc.processingInfo["include-additional-files"].length; i++) {
				loadUrls[loadUrls.length] = plab.processingFunc.processingInfo["include-additional-files"][i];
			}
		}
		
		plab.processingFunc.startLoadGivenURLs(loadUrls);
	},
	startLoadGivenURLs : function(loadUrls) {
		// Forget given code (if previously stored)
		plab.processingFunc.givenCode = null;

		// Add include file to urls
		loadUrls.splice(0, 0, "lib/InterfacesInc.pde");
		
		// Reset the number of times we have tried to see if a responce has been
		// received
		plab.processingFunc.checkCount = 0;
		// Update counter of http request attempts.
		plab.processingFunc.attempt++;
		// Get the canvas that should be used
		var canvas = document.getElementById("plab-canvas");
		
		plab.out.notify.println("Loading files" + JSON.stringify(loadUrls));
		// Load the sketch to the canvas from the earlier built url, thereby
		// starting a http request
		plab.processingFunc.cache.loadAndCacheSketchFromSources(canvas, loadUrls);
		// Set the timer that checks if the sketch has been loaded
		plab.timers.processing = setTimeout(plab.processingFunc.showOrLoad, 500);
	},
	// The definition of the function that starts loading Processing sketch from
	// cache
	startLoadCached : function() {
		// Forget given code (if previously stored)
		plab.processingFunc.givenCode = null;

		var canvas = document.getElementById("plab-canvas")
		var pInstance = plab.processingFunc.cache.loadSketchFromCache(canvas);
		if (pInstance) {
			plab.processingFunc.show(pInstance);
		}
	},
	startLoadGivenCode : function(codeArray) {
		// Reset the number of times we have tried to see if a responce has been
		// received
		plab.processingFunc.checkCount = 0;
		// Update counter of http request attempts.
		plab.processingFunc.attempt++;
		// Remember the given code
		plab.processingFunc.givenCode = codeArray;
		
		var canvas = document.getElementById("plab-canvas")
		plab.processingFunc.cache.loadAndCacheSketchFromCode(canvas, codeArray);
		plab.timers.processing = setTimeout(plab.processingFunc.showOrLoad, 500);
	},
	show : function(pInstance) {
		// Get the canvas that will be used by processing
		var canvas = document.getElementById("plab-canvas");
		// Remember the instance so it may be unloaded
		plab.processingFunc.processingInstance = pInstance;
		// Remove reference to processing countdown timer.
		plab.timers.processing = null;
		// Make the framework invisible
		document.body.classList.remove("plab");
		try {
			// The canvas should fill the screen
			var w = plabPjsBridge.getWidth();
			var h = plabPjsBridge.getHeight();
			canvas.width = w;
			canvas.height = h;
			// Attempt to inject object into processing sketch.
			pInstance.bindPLabBridge(plabPjsBridge);
		} catch (e) {
			alert(plabLangSupport.getText("processing-func-failure"));
			plab.out.err.println("BridgeBinding failure: " + e);
		}
	},
	// the method that shows processing and if prudent start a new http request
	// for processing.
	showOrLoad : function() {
		// Gets the processing instance. Returned value is null if processing is
		// not loaded.
		var pInstance = Processing.getInstanceById("plab-canvas");
		if (pInstance != null) {
			plab.processingFunc.show(pInstance);
		} else {
			// Get reference to connect attempt counter
			var attemptCounter = document.getElementById("plab-attempt");
			// The processing sketch was not loaded. Increment attempt counter
			plab.processingFunc.checkCount++;
			// Update visual representation of attempt counter
			if (attemptCounter != null) {
				attemptCounter.innerHTML = plab.processingFunc.attempt + " ("
						+ plab.processingFunc.checkCount + ")";
			}
			// if we have less than 20 attempts to view the current http
			// request, check again
			if (plab.processingFunc.checkCount < 20) {
				plab.timers.processing = setTimeout(
						plab.processingFunc.showOrLoad, 500);
			} else {
				// otherwise start a new http request to load processing.
				if (plab.processingFunc.givenCode === null) {
					plab.processingFunc.startLoadURLs();
				} else {
					plab.processingFunc.startLoadGivenCode(plab.processingFunc.givenCode);
				}
			}
		}
	}
};
