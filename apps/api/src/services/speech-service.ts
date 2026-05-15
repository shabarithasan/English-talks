export async function transcribeAudio(audioFile?: Express.Multer.File) {
  if (!audioFile) {
    return "No audio uploaded yet. This placeholder response allows the frontend flow to be integrated before cloud STT is wired in.";
  }

  const estimatedSeconds = Math.max(15, Math.round(audioFile.size / 16_000));

  return `Transcription placeholder: received ${audioFile.originalname} (${estimatedSeconds} seconds estimated). Replace this with Google, Azure, or Whisper-based streaming speech recognition.`;
}

