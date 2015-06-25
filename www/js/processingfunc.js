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
		"library-key" : "plab-lib-loc",
		
		"cache-key" : "plab-processing-cache",

		"include-library" : false,
		"include-library-loc" : "",

		"include-additional-files" : [],

		"address-base" : "",
		"address-postfix" : "",
		"complete-address" : ""
	},
	cache : {
		clear : function() {
			window.localStorage.removeItem(plab.processingFunc.processingInfo["cache-key"]);
		},
		hasContent : function() {
			return window.localStorage.getItem(plab.processingFunc.processingInfo["cache-key"]) !== null;
		},
		loadSketchFromCache : function(canvas) {
			if (!plab.processingFunc.cache.hasContent()) {
				return;
			}
			// Load from cache
			var allCode = window.localStorage.getItem(plab.processingFunc.processingInfo["cache-key"]);
			// And run
			return new Processing(canvas, allCode);
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
							// Give a hint when loading fails due to same-origin issues
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
						spn.appendChild(document.createTextNode(plabLangSupport.getText(error)));
						outElements[index].appendChild(spn);
						if (status) {
							outElements[index].appendChild(document.createTextNode(status));
						}
					} else {
						outElements[index].className = "plab-ok";
					}
					if (loaded === sourcesCount) {
						if (errors.length === 0) {
							// This used to throw, but it was constantly getting in the
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
	startLoad : function() {
		// Reset the number of times we have tried to see if a responce has been
		// received
		plab.processingFunc.checkCount = 0;
		// Update counter of http request attempts.
		plab.processingFunc.attempt++;
		// Get the canvas that should be used
		var canvas = document.getElementById("plab-canvas");
		// Get the URL(s) that should be loaded
		var loadUrls = [];
		if (plab.processingFunc.processingInfo["include-library"]) {
			loadUrls[0] = plab.processingFunc.processingInfo["include-library-loc"];
		}
		loadUrls[loadUrls.length] = plab.processingFunc.processingInfo["complete-address"];
		for ( var i = 0; i < plab.processingFunc.processingInfo["include-additional-files"].length; i++) {
			loadUrls[loadUrls.length] = plab.processingFunc.processingInfo["include-additional-files"][i];
		}
		plab.out.notify.println("Loading files" + JSON.stringify(loadUrls));
		// Load the sketch to the canvas from the earlier built url, thereby
		// starting a http request
		plab.processingFunc.cache.loadAndCacheSketchFromSources(canvas, loadUrls);
		// Set the timer that checks if the sketch has been loaded
		plab.timers.processing = setTimeout(plab.processingFunc.showOrLoad, 500);
	},
	// the method that shows processing and if prudent start a new http request
	// for processing.
	showOrLoad : function() {
		// Gets the processing instance. Returned value is null if processing is
		// not loaded.
		var p = Processing.getInstanceById("plab-canvas");
		if (p != null) {
			// Get the canvas that will be used by processing
			var canvas = document.getElementById("plab-canvas");
			// Remember the instance so it may be unloaded
			plab.processingFunc.processingInstance = p;
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
				p.bindPLabBridge(plabPjsBridge);
			} catch (e) {
				alert(plabLangSupport.getText("processing-func-failure"));
				plab.out.err.println("BridgeBinding failure: " + e);
			}
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
				plab.processingFunc.startLoad();
			}
		}
	}
};
/*
plab.clearProcessingCache = function() {};
plab.loadSketchFromCache = function(canvas) {};
plab.loadAndCacheSketchFromSources = function(canvas, sources) {
	plab.clearProcessingCache();
};
var loadSketchFromSources = Processing.loadSketchFromSources = function(canvas,
		sources) {
	var code = [], errors = [], sourcesCount = sources.length, loaded = 0;

	function ajaxAsync(url, callback) {
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4) {
				var error;
				if (xhr.status !== 200 && xhr.status !== 0) {
					error = "Invalid XHR status " + xhr.status;
				} else if (xhr.responseText === "") {
					// Give a hint when loading fails due to same-origin issues
					// on file:/// urls
					if (("withCredentials" in new XMLHttpRequest())
							&& (new XMLHttpRequest()).withCredentials === false
							&& window.location.protocol === "file:") {
						error = "XMLHttpRequest failure, possibly due to a same-origin policy violation. You can try loading this page in another browser, or load it from http://localhost using a local webserver. See the Processing.js README for a more detailed explanation of this problem and solutions.";
					} else {
						error = "File is empty.";
					}
				}

				callback(xhr.responseText, error);
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
		function callback(block, error) {
			code[index] = block;
			++loaded;
			if (error) {
				errors.push(filename + " ==> " + error);
			}
			if (loaded === sourcesCount) {
				if (errors.length === 0) {
					// This used to throw, but it was constantly getting in the
					// way of debugging where things go wrong!
					return new Processing(canvas, code.join("\n"));
				} else {
					throw "Processing.js: Unable to load pjs sketch files: "
							+ errors.join("\n");
				}
			}
		}
		if (filename.charAt(0) === '#') {
			// trying to get script from the element
			var scriptElement = document.getElementById(filename.substring(1));
			if (scriptElement) {
				callback(scriptElement.text || scriptElement.textContent);
			} else {
				callback("", "Unable to load pjs sketch: element with id \'"
						+ filename.substring(1) + "\' was not found");
			}
			return;
		}

		ajaxAsync(filename, callback);
	}

	for ( var i = 0; i < sourcesCount; ++i) {
		loadBlock(i, sources[i]);
	}
};
*/