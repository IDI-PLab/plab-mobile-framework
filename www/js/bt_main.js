var plabBT = {
		modes : [],
		mode : null,
		setMode : function (mode) {},
		unsetMode : function () {},
		addMode : function (mode) {},
		
		listDevices : function (holderNode, scanTime) {},
		createDeviceDescriptor : function (theId, theName) {
			return { id : theId, name : theName };
		},
		connectDevice : function (id) {},
		disconnectDevice : function () {},
		
		send : function (text) {},
		receiveCallback : function (callback) {}
}

var plabBTMode = {
		id : "",
		name : "",
		
		openMode : function () {},
		closeMode : function () {},
		
		listDevices : function (listCallback, scanTime) {},
		connectDevice : function (id) {},
		disconnectDevice : function () {},
		
		send : function (text) {},
		receiveCallback : function (callback) {}
}