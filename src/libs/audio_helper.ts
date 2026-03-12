// node imports
import ChildProcess from 'node:child_process';
import Path from 'node:path';
import Fs from 'node:fs';

// npm imports
import ffmpegStaticPath from 'ffmpeg-static';


export class AudioHelper {
	/**
	 * Convert an audio file to a 16KHz mono wav file using ffmpeg. The output file is required for the whisper.cpp transcriber.
	 * 
	 * @param inputAudioPath input audio path readable by 'ffmpeg-static' npm package
	 * @param outputAudioPath output audio path of the .wav
	 * @returns 
	 */
	static async convertToWav16kMono(inputAudioPath: string, outputAudioPath: string) {
		const ffmpegPath = ffmpegStaticPath;
		const command = `${ffmpegPath} -i "${inputAudioPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${outputAudioPath}" -y`;
		return new Promise<void>((resolve, reject) => {
			ChildProcess.exec(command, (error, stdout, stderr) => {
				if (error) {
					reject(`Error converting audio: ${error.message}`);
				} else {
					resolve();
				}
			});
		});
	}

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
		console.log('start ignoring SIGINT')
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
				console.log('stop ignoring SIGINT')
				console.log(`Child process exited with code ${code}`);
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
