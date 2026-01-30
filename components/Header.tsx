import {
  IconPlay,
  IconStop,
  IconRefresh,
  IconCamera,
  IconVideo,
} from "./Icons";

type HeaderProps = {
  isStreaming: boolean;
  isLoadingModel: boolean;
  error: string;
  isRecording: boolean;
  facingMode: "user" | "environment";
  onStartCapture: () => void;
  onStopCapture: () => void;
  onRetryCapture: () => void;
  onSwitchCamera: () => void;
  onCapturePhoto: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClearPhrase: () => void;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onVideoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export function Header({
  isStreaming,
  isLoadingModel,
  error,
  isRecording,
  facingMode,
  onStartCapture,
  onStopCapture,
  onRetryCapture,
  onSwitchCamera,
  onCapturePhoto,
  onStartRecording,
  onStopRecording,
  onClearPhrase,
  onImageUpload,
  onVideoUpload,
}: HeaderProps) {
  const buttonBaseClass =
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 min-h-[48px] text-sm font-semibold transition whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="rounded-full bg-white/10 px-2 py-1 sm:px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
          Inclusão Digital
        </span>
        <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-100">
          Libras + LGM
        </span>
        <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs font-semibold text-sky-100">
          IA Avançada
        </span>
      </div>
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Tradução de linguagem de sinais em tempo real
        </h1>
        <p className="max-w-3xl text-lg text-slate-200">
          Capte Libras (Brasil) ou Língua Gestual Moçambicana. A câmera
          reconhece os gestos e nossa IA identifica a palavra provável —
          montamos a frase na hora.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onStartCapture}
          disabled={isStreaming || isLoadingModel}
          className={`${buttonBaseClass} bg-emerald-500 text-emerald-950 hover:bg-emerald-400`}
        >
          <IconPlay />
          {isLoadingModel ? "Carregando modelo..." : "Iniciar captura"}
        </button>
        {error && (
          <button
            onClick={onRetryCapture}
            disabled={isStreaming || isLoadingModel}
            className={`${buttonBaseClass} bg-blue-500 text-blue-950 hover:bg-blue-400`}
          >
            <IconRefresh />
            Tentar novamente
          </button>
        )}
        {isStreaming && (
          <button
            onClick={onSwitchCamera}
            disabled={isLoadingModel}
            className={`${buttonBaseClass} bg-purple-500 text-purple-950 hover:bg-purple-400`}
          >
            <IconCamera />
            {facingMode === "user" ? "Usar traseira" : "Usar frontal"}
          </button>
        )}
        {isStreaming && (
          <button
            onClick={onCapturePhoto}
            disabled={isLoadingModel}
            className={`${buttonBaseClass} bg-green-500 text-green-950 hover:bg-green-400`}
          >
            📸 Capturar foto
          </button>
        )}
        {isStreaming && (
          <button
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={isLoadingModel}
            className={`${buttonBaseClass} ${
              isRecording
                ? "bg-gray-500 text-gray-950 hover:bg-gray-400"
                : "bg-red-500 text-red-950 hover:bg-red-400"
            }`}
          >
            <IconVideo />
            {isRecording ? "Parar gravação" : "Gravar vídeo"}
          </button>
        )}
        <button
          onClick={onStopCapture}
          disabled={!isStreaming}
          className={`${buttonBaseClass} bg-slate-700 text-white hover:bg-slate-600`}
        >
          <IconStop />
          Parar
        </button>
        <button
          onClick={onClearPhrase}
          className={`${buttonBaseClass} border border-white/10 text-slate-200 hover:border-white/30`}
        >
          <IconRefresh />
          Limpar frase
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4">
        <label
          className={`${buttonBaseClass} bg-blue-500 text-blue-950 hover:bg-blue-400 cursor-pointer`}
        >
          📁 Upload imagem
          <input
            type="file"
            accept="image/*"
            onChange={onImageUpload}
            className="hidden"
          />
        </label>
        <label
          className={`${buttonBaseClass} bg-orange-500 text-orange-950 hover:bg-orange-400 cursor-pointer`}
        >
          🎥 Upload vídeo
          <input
            type="file"
            accept="video/*"
            onChange={onVideoUpload}
            className="hidden"
          />
        </label>
      </div>
    </header>
  );
}
