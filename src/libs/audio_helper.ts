// node imports
import ChildProcess from 'node:child_process';
import Path from 'node:path';
import Fs from 'node:fs';


export class AudioHelper {

	/**
	 * Record audio from the microphone using the 'rec' command line tool.
	 * - `brew install sox` to get the `rec` command line tool on macOS. On Linux, it should be available in the package manager.
	 * 
	 * 
	 * @returns A promise that resolves to a Buffer containing the recorded audio data in WAV format.
	 */
	static async recordMicrophone(): Promise<Buffer> {
		const ignoreSigint = () => {
			console.log('Received SIGINT, ignoring...');
		};
		process.on('SIGINT', ignoreSigint);
		// TODO make this file temporary and delete it after reading
		const soundPath = Path.resolve(__dirname, '../../outputs/output_tmp.wav');
		return new Promise<Buffer>((resolve, reject) => {

			// Launch 'rec output.wav' command line
			const child = ChildProcess.spawn('rec', [soundPath], {
				stdio: 'inherit',
			});

			child.on('exit', (code) => {
				// Remove the SIGINT listener when the child process exits
				process.off('SIGINT', ignoreSigint);
				if (code === 0) {
					// Read the recorded audio file into a Buffer
					const soundBuffer = Fs.readFileSync(soundPath);
					// Delete the temporary file after reading
					Fs.unlinkSync(soundPath);
					// Resolve the promise with the audio data
					resolve(soundBuffer);
				} else {
					// Delete the temporary file after reading
					Fs.unlinkSync(soundPath);
					// Reject the promise if the child process exited with an error code
					reject(new Error(`Child process exited with code ${code}`));
				}
			});
		});
	}
}
