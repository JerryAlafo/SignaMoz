"use client";

type ErrorModalProps = {
  message: string;
  onClose: () => void;
  isOnline: boolean;
};

export function ErrorModal({ message, onClose, isOnline }: ErrorModalProps) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div className="pointer-events-auto animate-in fade-in duration-300 w-full max-w-sm">
        {/* Overlay escuro */}
        <div className="fixed inset-0 bg-black/50 -z-10" onClick={onClose} />

        <div
          className={`rounded-2xl shadow-2xl p-6 ${
            !isOnline
              ? "bg-yellow-50 border-2 border-yellow-400 text-yellow-900"
              : "bg-red-50 border-2 border-red-400 text-red-900"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 text-4xl">{!isOnline ? "🌐" : "⚠️"}</div>
            <div className="flex-1">
              <h3 className="font-bold text-base">
                {!isOnline ? "Sem Conexão de Internet" : "Erro"}
              </h3>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                {message}
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className={`w-full px-4 py-2 rounded-lg font-semibold text-white transition ${
                !isOnline
                  ? "bg-yellow-600 hover:bg-yellow-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
