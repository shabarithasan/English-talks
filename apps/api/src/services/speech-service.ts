import type { Express } from "express";

export type TranscriptResult = {
  provider: string;
  fullText: string;
  confidence: number;
  languageCode: string;
  segments: Array<{
    startMs: number;
    endMs: number;
    text: string;
    speakerLabel?: string;
  }>;
};

type SpeechProviderInput = {
  audioFile?: Express.Multer.File;
  promptTitle?: string;
  sessionType: string;
};

interface SpeechProvider {
  transcribe(input: SpeechProviderInput): Promise<TranscriptResult>;
}

class LocalSpeechProvider implements SpeechProvider {
  async transcribe(input: SpeechProviderInput): Promise<TranscriptResult> {
    const estimatedSeconds = input.audioFile ? Math.max(20, Math.round(input.audioFile.size / 16_000)) : 45;
    const theme = input.promptTitle ?? "the IELTS topic";
    const sessionLabel = input.sessionType.toLowerCase().replace(/_/g, " ");
    const transcript = [
      `I would like to answer this ${sessionLabel} prompt about ${theme}.`,
      "First, I tried to give a direct opinion and then support it with a specific example.",
      "In my view, clear structure, varied vocabulary, and confident pacing are the most important parts of a strong answer.",
      "If I had more time, I would extend the example and compare it with a second perspective.",
    ].join(" ");

    const words = transcript.split(" ");
    const segmentSize = Math.max(8, Math.ceil(words.length / 3));
    const segments = Array.from({ length: Math.ceil(words.length / segmentSize) }, (_entry, index) => {
      const start = index * segmentSize;
      const end = start + segmentSize;
      const text = words.slice(start, end).join(" ");

      return {
        startMs: index * Math.floor((estimatedSeconds * 1000) / 3),
        endMs: (index + 1) * Math.floor((estimatedSeconds * 1000) / 3),
        text,
      };
    });

    return {
      provider: "local-speech-provider",
      fullText: transcript,
      confidence: 0.94,
      languageCode: "en",
      segments,
    };
  }
}

const speechProvider: SpeechProvider = new LocalSpeechProvider();

export async function transcribeAudio(input: SpeechProviderInput) {
  return speechProvider.transcribe(input);
}
