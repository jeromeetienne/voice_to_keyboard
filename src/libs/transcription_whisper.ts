// npm import
import { downloadWhisperModel, installWhisperCpp, transcribe, toCaptions, Language } from '@remotion/install-whisper-cpp';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	Class
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

export type TranscriptionModelName = "medium.en" | "base" | "base.en" | "large-v1" | "large-v2" | "large-v3" | "large-v3-turbo" | "medium" | "small" | "small.en" | "tiny" | "tiny.en";


/**
 * from https://www.remotion.dev/docs/install-whisper-cpp/
 * from https://huggingface.co/openai/whisper-medium
 */
export class TranscriptionWhisper {

	/**
	 * Transcribe an audio file to captions using whisper.cpp. The audio file MUST be a wav file in 16KHz PCM Mono format. You can use 
	 * the convertToWav16kMono function in this class to convert an audio file to the required format.
	 * 
	 * **NOTE: This function may be long as it may need to install whisper.cpp and download the whisper model the 
	 * first time it is run.**
	 * 
	 * @param whisperPath path to the whisper.cpp installation directory. This is where the whisper.cpp binary and models will be installed. 
	 * @param audioWavPath path to .wav file - the file MUST be a wav file in 16KHz PCM Mono
	 * @param options.verbose if true, will print the output of the various steps (installing whisper.cpp, downloading model, transcribing). Default is false.
	 * @param options.modelName the whisper model to use. Default is 'medium.en'. See https://www.remotion.dev/docs/install-whisper-cpp/#models for available models. "medium.en" is a good default for English audio. If you are transcribing non-English audio, you may want to use "medium" or a model without the ".en" suffix.
	 * @param options.language the language of the audio. This is used to help whisper.cpp transcribe better. Default is 'en' (English). See https://www.remotion.dev/docs/install-whisper-cpp/#languages for available languages
	 */
	static async transcribe(whisperPath: string, audioWavPath: string, {
		verbose = false,
		modelName = 'medium.en',
		language = 'en'
	}: {
		verbose?: boolean;
		modelName?: TranscriptionModelName,
		language?: Language;
	} = {}): Promise<string> {
		// install if needed
		await this.installIfNeeded(whisperPath, { verbose, modelName });

		// transcribe
		const whisperCppOutput = await transcribe({
			model: modelName,
			whisperPath: whisperPath,
			whisperCppVersion: '1.5.5',
			inputPath: audioWavPath,
			language: language,
			tokenLevelTimestamps: true,
			splitOnWord: false,
			printOutput: verbose ? true : false,
		});

		// Optional: Apply remotion recommended postprocessing
		const { captions } = toCaptions({
			whisperCppOutput,
		});

		const transcribedText = captions.map((caption) => caption.text).join('');

		// return the transcription
		return transcribedText
	}


	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Private functions
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Install whisper.cpp and the whisper model if they are not already installed.
	 * @param whisperPath path to the whisper.cpp installation directory. This is where the whisper.cpp binary and models will be installed.
	 * @param verbose 
	 */
	static async installIfNeeded(whisperPath: string, {
		verbose = false,
		modelName = 'medium.en',
	}: {
		verbose?: boolean;
		modelName?: TranscriptionModelName,
	} = {}) {
		// Install whisper.cpp if needed
		const whisperAlreadyExisted = await installWhisperCpp({
			to: whisperPath,
			version: '1.5.5',
			printOutput: verbose ? true : false,
		});

		// Download the whisper model if needed
		const modelAlreadyExisted = await downloadWhisperModel({
			model: modelName,
			folder: whisperPath,
			printOutput: verbose ? true : false,
		});
	}
}
