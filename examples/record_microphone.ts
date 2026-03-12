// node imports
import Path from 'node:path';
import Fs from 'node:fs';
import ChildProcess from 'node:child_process';
import Assert from 'node:assert';


/**
 * Record audio from the microphone using the 'rec' command line tool.
 * - `brew install sox` to get the `rec` command line tool on macOS. On Linux, it should be available in the package manager.
 * 
 * 
 * @returns A promise that resolves to a Buffer containing the recorded audio data in WAV format.
 */
async function recordMicrophone(): Promise<Buffer> {
	const soundPath = Path.resolve(__dirname, '../outputs/output_tmp.wav');
	return new Promise<Buffer>((resolve, reject) => {
		const child = ChildProcess.spawn('rec', [soundPath], {
			stdio: 'inherit',
		});

		Assert.ok(process.stdin.isTTY, 'Standard input must be a TTY to listen for key presses');
		// Enable raw mode to listen for 'q' key press
		const onData = (key: Buffer) => {
			if (key.toString() === 'q') {
				child.kill();
			}
		}
		process.stdin.setRawMode(true);
		process.stdin.addListener('data', onData);

		function onExit(code: number) {
			process.stdin.setRawMode(false);
			process.stdin.pause();
			child.removeListener('exit', onExit);
			process.stdin.removeListener('data', onData);
			console.log(`Child process exited with code ${code}`);
			if (code === 0) {
				const soundBuffer = Fs.readFileSync(soundPath);
				Fs.unlinkSync(soundPath);
				resolve(soundBuffer);
			} else {
				Fs.unlinkSync(soundPath);
				reject(new Error(`Child process exited with code ${code}`));
			}
		}

		child.addListener('exit', onExit);
	});
}


async function main() {
	// Record audio from the microphone
	const soundBuffer = await recordMicrophone();

	// Save the recorded audio to a file
	const soundPath = Path.resolve(__dirname, '../outputs/output.wav');
	await Fs.promises.writeFile(soundPath, soundBuffer);
	console.log(`Sound recorded and saved to ${soundPath}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});