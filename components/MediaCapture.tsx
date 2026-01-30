type MediaCaptureProps = {
  capturedImage: string | null;
  recordedVideo: string | null;
};

export function MediaCapture({
  capturedImage,
  recordedVideo,
}: MediaCaptureProps) {
  if (!capturedImage && !recordedVideo) return null;

  return (
    <div className="glass-card overflow-hidden rounded-3xl">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
        <div>
          <p className="text-sm text-slate-300">Mídia capturada</p>
          <p className="text-base font-semibold text-white">
            {capturedImage ? "Foto capturada" : "Vídeo gravado"}
          </p>
        </div>
      </div>
      <div className="p-4">
        {capturedImage && (
          <img
            src={capturedImage}
            alt="Foto capturada"
            className="max-w-full h-auto rounded-lg"
          />
        )}
        {recordedVideo && (
          <video controls className="max-w-full h-auto rounded-lg">
            <source src={recordedVideo} type="video/mp4" />
          </video>
        )}
      </div>
    </div>
  );
}

