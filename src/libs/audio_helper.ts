// node imports
import ChildProcess from 'node:child_process';
import Path from 'node:path';
import Fs from 'node:fs';
import Assert from 'node:assert';
import Os from 'node:os';

export class AudioHelper {
	/**
	 * Record audio from the microphone using the 'rec' command line tool. (part of the SoX package)
	 * - `brew install sox` to get the `rec` command line tool on macOS. On Linux, it should be available in the package manager.
	 * - it records in 16KHz Mono format with 16-bit signed integer encoding, which is the required format for whisper.cpp. 
	 * 
	 * 
	 * @returns A promise that resolves to a Buffer containing the recorded audio data in WAV format.
	 */
	static async recordMicrophone({
		verbose = false,
	}: {
		verbose?: boolean;
	} = {}): Promise<Buffer> {
		// Generate a unique temp file path
		const soundPath = Path.join(Os.tmpdir(), `sound-${Date.now()}-${Math.random().toString(36).slice(2)}.wav`);

		return new Promise<Buffer>((resolve, reject) => {
			// build the command to record audio from the microphone using the `rec` command line tool
			const child_cmd = `rec`;
			const child_args = ['-r', '16000', '-c', '1', '-b', '16', '-e', 'signed-integer', soundPath];

			// spawn the command
			const child = ChildProcess.spawn(child_cmd, child_args, {
				stdio: verbose ? 'inherit' : 'ignore',
			});

			// sanity check
			Assert.ok(process.stdin.isTTY, 'Standard input must be a TTY to listen for key presses');

			// Enable raw mode to listen for 'q' key press
			process.stdin.setRawMode(true);
			// Listen for 'q' key press to stop recording
			const onData = (key: Buffer) => {
				if (key.toString() === 'q') {
					child.kill();
				}
			}
			process.stdin.addListener('data', onData);
			// Listen to SIGINT (Ctrl+C) to stop recording
			const onSigInt = () => {
				child.kill();
			}
			process.addListener('SIGINT', onSigInt);

			// Listen for the child process to exit
			child.addListener('exit', function (code: number) {
				// Disable raw mode and stop listening for key presses
				process.stdin.setRawMode(false);
				process.stdin.pause();
				// child.removeListener('exit', onExit);
				// Stop listening for 'q' key press
				process.stdin.removeListener('data', onData);
				// Stop listening for SIGINT
				process.removeListener('SIGINT', onSigInt);
				// honor verbose option
				if (verbose) {
					console.log(`Child process exited with code ${code}`);
				}
				if (code === 0) {
					// Read the recorded audio file into a Buffer
					const soundBuffer = Fs.readFileSync(soundPath);
					// Delete the temporary audio file
					Fs.unlinkSync(soundPath);
					// Resolve the promise with the recorded audio data
					resolve(soundBuffer);
				} else {
					// Delete the temporary audio file
					Fs.unlinkSync(soundPath);
					// Reject the promise with an error
					reject(new Error(`Child process exited with code ${code}`));
				}
			});
		});
	}
}
