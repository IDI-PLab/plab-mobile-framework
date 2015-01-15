try {
var plabBT = {
		modes : [],
		mode : null,
		setMode : function (id) {
			
			if (plabBT.mode !== null) {
				plabBT.unsetMode ();
			}
			
			for (var i = 0; i < plabBT.modes.length; i++) {
				if (id == plabBT.modes[i].id) {
					plabBT.mode = plabBT.modes[i];
					plabBT.mode.openMode();
					return;
				}
			}
		},
		unsetMode : function () {
			if (plabBT.mode !== null) {
				plabBT.mode.closeMode();
				plabBT.mode = null;
			}
		},
		addMode : function (mode) {
			for (var i = 0; i < plabBT.modes.length; i++) {
				if (mode.id === plabBT.modes[i].id) {
					return;
				}
			}
			plabBT.modes[plabBT.modes.length] = mode;
		},
		
		
		listDevices : function (holderNode, scanTime) {
			if (plabBT.mode === null) {
				return;
			}
			plabBT.mode.listDevices(
					function(desc) {
						// list element to hold element
						var el = document.createElement("li");
						// Connect button
						var btn = document.createElement("button");
						var btnVal = document.createTextNode(desc.name);
						btn.appendChild(btnVal);
						// Add the click event listener
						btn.addEventListener(
								"click",
								function() {
									plabBT.connectDevice(desc.id);
								}
						);
						// Legge til elementene i lista
						el.appendChild(btn);
						holderNode.appendChild(el);
					},
					10000
			);
		},
		createDeviceDescriptor : function (theId, theName) {
			return { id : theId, name : theName };
		},
		connectDevice : function (id) {
			if (plabBT.mode === null) {
				return;
			}
			plabMode.connectDevice(id, function() {
				// TODO
			});
		},
		disconnectDevice : function () {
			if (plabBT.mode === null) {
				return;
			}
			plabBT.mode.disconnectDevice();
		},
		
		send : function (text) {
			if (plabBT.mode === null) {
				return;
			}
			plabBT.mode.send(text);
		},
		receiveCallback : function (callback) {
			if (plabBT.mode === null) {
				return;
			}
			plabBT.mode.receiveCallback(callback);
		}
}

var plabBTMode = {
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
} catch (e) {
	alert(e);
}