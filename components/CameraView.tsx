import { RefObject } from "react";

type CameraViewProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isStreaming: boolean;
  status: string;
};

export function CameraView({
  videoRef,
  canvasRef,
  isStreaming,
  status,
}: CameraViewProps) {
  return (
    <div className="glass-card overflow-hidden rounded-2xl sm:rounded-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 border-b border-white/5 px-3 py-3 sm:px-5 sm:py-4">
        <div>
          <p className="text-xs sm:text-sm text-slate-300">Câmera e captura</p>
          <p className="text-sm sm:text-base font-semibold text-white">
            Visualização ao vivo
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <span className="rounded-full bg-white/10 px-2 py-1 sm:px-3 text-xs font-semibold text-slate-200">
            {status}
          </span>
          <p className="text-xs text-slate-400 hidden sm:block">
            💡 Mãos visíveis na câmera
          </p>
        </div>
      </div>
      <div className="relative aspect-4/3 w-full bg-black/40">
        <video
          ref={videoRef}
          className="h-full w-full object-cover opacity-70"
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
        />
        {!isStreaming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
            <p className="text-lg font-semibold text-white">
              Toque em "Iniciar captura"
            </p>
            <p className="text-sm text-slate-200">
              A câmera frontal é recomendada para gestos pessoais.
              Certifique-se de usar HTTPS no celular.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

