function plabAddBT4_0() {
	// Creating a prototype object
	var btMode = Object.create(plabBTMode);
	btMode.id = "BlueTooth_4.0_randdusing";
	btMode.name = "BlueTooth LE";
	// Replacing the open mode function -> init the mode
	btMode.openMode = function () {
		// TODO
	};
	
	plabBT.modes[plabBT.modes.length] = btMode;
}