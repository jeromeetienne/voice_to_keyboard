import { ElectronMain } from "../electron/electron_main";


async function main() {
	await ElectronMain.main();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});