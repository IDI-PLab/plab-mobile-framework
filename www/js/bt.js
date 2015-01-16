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
 * Reference: Describes the plabBTMode
 * plabBTMode = {
		id : "",
		name : "",
		status : {
			initialized : false,
			connected : false,
			ready : false,
			failure : false
		},
		
		openMode : function () {},
		closeMode : function () {},
		
		listDevices : function (listCallback, scanTime) {},
		stopListDevices : function () {},
		
		connectDevice : function (id, successCallback) {},
		disconnectDevice : function () {},
		
		send : function (text) {},
		receiveCallback : function (callback) {}
} 
 */

function plabAddBTSerial(debugOut, updateScreen) {
	debugOut.notify.println("Adding buetoothSerial version");
	if (typeof bluetoothSerial === "undefined") {
		return;
	}
	var btMode = Object.create(plabBTMode);
	btMode.id = "BluetoothSerial-com.megster";
	btMode.name = "BlueTooth";
	// TODO
	plabBT.addMode(btMode);
	debugOut.notify.println("buetoothSerial added");
}

document.addEventListener(
		"deviceready",
		function() {
			plabAddBTSerial(plab.out, plab.updateScreen);
		}, 
		false
);
