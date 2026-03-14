import { ElectronMain } from "../electron/electron_main";
import { AppConfigManager } from '../libs/app_config';


async function main() {
	// load the app configuration
	const appConfigManager = new AppConfigManager();
	const appConfig = await appConfigManager.load() ?? AppConfigManager.getDefaultConfig();

	// run the app
	await ElectronMain.main(appConfig);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});