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
plab.accelerometer = {
		watchId : null,
		listeners : [],
		updateInterval : 10000,
		updateListener : function() {
			if (plab.accelerometer.watchId !== null) {
				navigator.accelerometer.clearWatch(plab.accelerometer.watchId);
			}
			var options = { frequency : plab.accelerometer.updateInterval };
			plab.accelerometer.watchId = navigator.accelerometer.watchAcceleration(
					plab.accelerometer.onSuccess,
					plab.accelerometer.onError,
					options
			);
		},
		addListener : function(listener) {
			plab.accelerometer.listeners[plab.accelerometer.listeners.length] = listener;
			if (watchId === null) {
				plab.accelerometer.updateListener();
			}
		},
		removeListener : function(listener) {
			var i = plab.accelerometer.listeners.indexOf(listener);
			if (i > -1) {
				plab.accelerometer.listeners.splice(i, 1);
			}
			if (array.length === 0 && plab.accelerometer.watchId !== null) {
				navigator.accelerometer.clearWatch(plab.accelerometer.watchId);
				plab.accelerometer.watchId = null;
			}
		},
		setUpdateInterval : function(time) {
			if (time !== plab.accelerometer.updateInterval) {
				plab.accelerometer.updateInterval = time;
				plab.accelerometer.updateListener();
			}
		},
		onSuccess : function(obj) {
			plab.accelerometer.listeners.forEach(function(listener) {
				listener.deviceAcceleration(obj);
			});
		},
		onError : function() {
			plab.out.err.println("Accelerometer watch failed!");
		}
};