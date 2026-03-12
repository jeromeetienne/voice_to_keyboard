import { app, Tray, Menu, nativeImage } from "electron";
import path from "path";


let tray: Tray;

app.whenReady().then(async () => {
	tray = new Tray(path.join(__dirname, "../../test_assets/icon2.png"));

	const menu = Menu.buildFromTemplate([
		{ label: "Start", click: () => console.log("start") },
		{ label: "Stop", click: () => console.log("stop") },
		{ type: "separator" },
		{ role: "quit" }
	]);

	tray.setContextMenu(menu);
	tray.setToolTip("My menu bar app");

	const sleepAsync = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
	while (true) {
		tray.setImage(nativeImage.createFromPath(path.join(__dirname, "../../test_assets/icon2.png")));
		await sleepAsync(1000);
		tray.setImage(nativeImage.createFromPath(path.join(__dirname, "../../test_assets/icon1.png")));
		await sleepAsync(1000);
	}
});