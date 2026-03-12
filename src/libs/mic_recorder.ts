// node imports
import ChildProcess from 'node:child_process';
import Path from 'node:path';
import Fs from 'node:fs';
import Os from 'node:os';

export class MicRecorder {
	private soundPath: string;
	private child: ChildProcess.ChildProcess | null = null;
	private resolveStop: ((buffer: Buffer) => void) | null = null;
	private rejectStop: ((err: Error) => void) | null = null;
	private readonly verbose: boolean;

	constructor({ verbose = false }: { verbose?: boolean } = {}) {
		this.verbose = verbose;
		this.soundPath = Path.join(Os.tmpdir(), `sound-${Date.now()}-${Math.random().toString(36).slice(2)}.wav`);
	}

	startRecording(): void {
		if (this.child !== null) throw new Error('Already recording');

		const child_cmd = 'rec';
		const child_args = ['-r', '16000', '-c', '1', '-b', '16', '-e', 'signed-integer', this.soundPath];

		const child = ChildProcess.spawn(child_cmd, child_args, {
			stdio: this.verbose ? 'inherit' : 'ignore',
		});
		this.child = child;

		child.on('exit', (code: number | null) => {
			if (this.verbose) console.log(`rec exited with code ${code}`);

			// code === null means the process was killed by a signal (our stopRecording() call) — treat as success
			const fileExists = Fs.existsSync(this.soundPath);
			if ((code === 0 || code === null) && fileExists) {
				const soundBuffer = Fs.readFileSync(this.soundPath);
				Fs.unlinkSync(this.soundPath);
				this.resolveStop?.(soundBuffer);
			} else {
				if (Fs.existsSync(this.soundPath)) Fs.unlinkSync(this.soundPath);
				this.rejectStop?.(new Error(`rec exited with code ${code}`));
			}

			this.child = null;
			this.resolveStop = null;
			this.rejectStop = null;
		});
	}

	stopRecording(): Promise<Buffer> {
		return new Promise<Buffer>((resolve, reject) => {
			if (this.child === null) {
				reject(new Error('No recording in progress'));
				return;
			}
			this.resolveStop = resolve;
			this.rejectStop = reject;
			this.child.kill();
		});
	}
}

///////////////////////////////////////////////////////////////////////////////
// minitest — runs only when executed directly
///////////////////////////////////////////////////////////////////////////////
if (require.main === module) {
	(async () => {
		console.log('MicRecorder minitest — recording for 3 seconds…');
		const recorder = new MicRecorder({ verbose: true });
		recorder.startRecording();
		await new Promise(resolve => setTimeout(resolve, 3000));
		const buffer = await recorder.stopRecording();
		console.log(`Recording stopped. Buffer size: ${buffer.length} bytes`);
		console.log('minitest passed ✓');
	})();
}
