function plabAddBT4_0() {
	// See if necessary plugin is installed
	if (typeof bluetoothle === "undefined") {
		return;
	}
	// Creating a prototype object
	var btMode = Object.create(plabBTMode);
	btMode.id = "BlueTooth_4.0_randdusing";
	btMode.name = "BlueTooth LE";
	// Replacing the open mode function -> init the mode
	btMode.openMode = function () {
		if (btMode.status.initialized) {
			// TODO
		} else {
			// First run -> set up
			// TODO
		}
		// TODO
	};
	
	plabBT.modes[plabBT.modes.length] = btMode;
}