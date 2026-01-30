import { SupportedLanguage } from "../types/sign-languages";

type TranslationPanelProps = {
  language: SupportedLanguage;
  currentWord: string;
  phrase: string[];
  useVisionAI: boolean;
  isOnline: boolean;
  onLanguageChange: (language: SupportedLanguage) => void;
  onVisionAIToggle: (enabled: boolean) => void;
};

export function TranslationPanel({
  language,
  currentWord,
  phrase,
  useVisionAI,
  isOnline,
  onLanguageChange,
  onVisionAIToggle,
}: TranslationPanelProps) {
  return (
    <div className="glass-card flex flex-col gap-3 sm:gap-4 rounded-2xl sm:rounded-3xl p-4 sm:p-5">
      <div className="flex flex-col items-center justify-center">
        <div>
          <p className="text-sm text-center text-slate-300">Tradução</p>
          <p className="text-lg text-center font-semibold text-white">
            Palavra atual
          </p>
        </div>
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
          className="rounded-full border border-white/15 bg-slate-800 px-3 py-2 text-sm text-white outline-none hover:bg-slate-700"
        >
          <option value="libras" className="bg-slate-800 text-white">
            Libras (Brasil)
          </option>
          <option value="lsm" className="bg-slate-800 text-white">
            Língua Gestual Moçambicana
          </option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={useVisionAI}
            onChange={(e) => onVisionAIToggle(e.target.checked)}
            className="rounded border-white/20 bg-slate-800"
          />
          Usar análise de imagem apenas com Vision AI
        </label>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-300">
          Palavra detectada
        </p>
        <p className="mt-2 text-2xl sm:text-3xl font-semibold text-white break-words">
          {currentWord || "Nenhuma palavra detectada"}
        </p>
        {currentWord === "desconhecido" && (
          <p className="mt-1 text-sm text-slate-300">
            Gesto não reconhecido. A imagem precisa mostrar mãos
            claramente fazendo um sinal de libras. Certifique-se de que as
            mãos estão visíveis e bem iluminadas.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-300">
          Frase em construção
        </p>
        <p className="mt-3 min-h-18 text-lg leading-relaxed text-white">
          {phrase.length
            ? phrase.join(" ")
            : "As palavras aparecerão aqui."}
        </p>
        <div className="mt-3 flex gap-2 text-xs text-slate-300">
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-100">
            Tempo real
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">
            MediaPipe Holistic + OpenRouter
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-300">Sobre SignaMoz</p>
            <p className="text-xs text-slate-400">
              Acessibilidade para pessoas surdas e mudas através de
              tecnologia.
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          SignaMoz usa inteligência artificial e visão computacional para
          traduzir linguagem de sinais em tempo real, promovendo inclusão
          digital e facilitando a comunicação entre comunidades surdas e
          ouvintes.
        </p>
        {!isOnline && (
          <div className="mt-3 rounded-lg bg-yellow-500/20 border border-yellow-500/50 px-3 py-2">
            <p className="text-xs text-yellow-100">
              🌐 Modo offline ativado - funcionalidade limitada
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

