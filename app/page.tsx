"use client";

import { useRef, useState } from "react";
import { useHolisticCapture } from "../hooks/useHolisticCapture";
import { ErrorModal } from "../components/ErrorModal";
import { translateWithOpenRouter } from "../services/openrouter";
import { GesturePayload, HolisticResults, Landmark } from "../types/payloads";
import { SupportedLanguage } from "../types/sign-languages";

const getTimestamp = () => performance.now();

function IconPlay() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-current"
    >
      <path d="M6 4.5v15l12-7.5L6 4.5Z" />
    </svg>
  );
}

function IconStop() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-current"
    >
      <path d="M6 6h12v12H6z" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-current"
    >
      <path d="M4 4v6h6l-2.3-2.3A6 6 0 1 1 6.7 17l-1.4 1.4A8 8 0 1 0 11 4H4Z" />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-current"
    >
      <path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
      <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
    </svg>
  );
}

function IconVideo() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-current"
    >
      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
    </svg>
  );
}

export default function Home() {
  const lastInferenceRef = useRef<number>(0);
  const lastResultsRef = useRef<HolisticResults | null>(null);

  const [language, setLanguage] = useState<SupportedLanguage>("libras");
  const [currentWord, setCurrentWord] = useState("");
  const [phrase, setPhrase] = useState<string[]>([]);
  const [orModel] = useState("openai/gpt-4o-mini");

  const {
    videoRef,
    canvasRef,
    startCapture,
    stopCapture,
    retryCapture,
    toggleFacingMode,
    switchCamera,
    capturePhoto,
    startRecording,
    stopRecording,
    processImage,
    processVideo,
    useVisionAI,
    setUseVisionAI,
    facingMode,
    capturedImage,
    isRecording,
    recordedVideo,
    status,
    setStatus,
    error,
    setError,
    isStreaming,
    isLoadingModel,
    isOnline,
  } = useHolisticCapture({
    onResults: (results: HolisticResults) => translateGesture(results, false),
    onVisionResult: (word: string) => {
      // Quando Vision AI detecta uma palavra, definir diretamente
      console.log("Vision AI detectou:", word);
      setCurrentWord(word);
      lastInferenceRef.current = getTimestamp();
    },
  });

  // Função dummy - não usada mais (todas detecções vêm da API)

  const translateGesture = async (
    results: HolisticResults,
    isFromImage = false
  ) => {
    const now = getTimestamp();

    // Para imagens, sempre processar (não há limite de tempo)
    if (!isFromImage) {
      // Intervalo mínimo de 6 segundos entre detecções
      if (now - lastInferenceRef.current < 6000) return;
    }

    // Validar se há mudança significativa em relação ao frame anterior
    if (!isFromImage && lastResultsRef.current) {
      const hasSignificantChange = hasGestureChanged(
        lastResultsRef.current,
        results
      );
      if (!hasSignificantChange) {
        return; // Não há gesto novo, apenas posição estática
      }
    }

    lastInferenceRef.current = now;
    lastResultsRef.current = results;

    const payload: GesturePayload = {
      language,
      hands: results.multiHandLandmarks?.map((hand: Landmark[]) =>
        hand.map((p: Landmark) => [
          Number(p.x.toFixed(4)),
          Number(p.y.toFixed(4)),
          Number(p.z.toFixed(4)),
        ])
      ),
      pose: results.poseWorldLandmarks
        ?.slice(0, 18)
        .map((p: Landmark) => [
          Number(p.x.toFixed(4)),
          Number(p.y.toFixed(4)),
          Number(p.z.toFixed(4)),
        ]),
      timestamp: now,
    };

    // Verificar se há mãos detectadas para imagens
    if (isFromImage && (!payload.hands || payload.hands.length === 0)) {
      setCurrentWord("desconhecido");
      setStatus(
        "Nenhuma mão detectada na imagem. Tente uma imagem que mostre mãos fazendo gestos."
      );
      return;
    }

    try {
      if (!isOnline) {
        // Modo offline: não traduzir, apenas mostrar status
        setStatus("Capturando gestos (Offline)...");
        return;
      }

      setStatus("Consultando OpenRouter...");
      const word = await translateWithOpenRouter({
        apiKey: undefined,
        model: orModel,
        language,
        payload,
      });
      if (word) {
        pushWord(word);
      }
      setStatus("Capturando gestos...");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao consultar OpenRouter";
      console.error(err);
      setError(message);
      setStatus("Erro na tradução. Tentando novamente.");
    }
  };

  const pushWord = (word: string) => {
    // Não adicionar palavras vazias
    if (!word || word.trim().length === 0) {
      return;
    }

    setCurrentWord(word || "—");
    // Apenas adiciona se for uma palavra diferente da última
    // e não adiciona duplicatas da mesma palavra em sequência
    setPhrase((prev) => {
      if (prev.length === 0) return [word];
      const lastWord = prev[prev.length - 1];
      // Não adiciona se a última palavra for igual
      if (lastWord === word) return prev;
      return [...prev, word];
    });
  };

  const clearPhrase = () => {
    setPhrase([]);
    setCurrentWord("");
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processVideo(file);
    }
  };

  // Detectar se houve mudança significativa nos landmarks
  const hasGestureChanged = (
    prevResults: HolisticResults,
    currentResults: HolisticResults
  ): boolean => {
    // Para imagens processadas, sempre processar se houver landmarks
    if (!prevResults || !prevResults.multiHandLandmarks) return true;

    // Se não há mãos na imagem atual, não processar
    if (
      !currentResults.multiHandLandmarks ||
      currentResults.multiHandLandmarks.length === 0
    ) {
      setStatus("Nenhuma mão detectada na imagem");
      return false;
    }

    // Se há mãos mas são muito poucas, não processar
    const totalLandmarks = currentResults.multiHandLandmarks.reduce(
      (acc, hand) => acc + hand.length,
      0
    );
    if (totalLandmarks < 10) {
      setStatus("Mãos detectadas mas insuficientes para reconhecimento");
      return false;
    }

    // Calcular distância euclidiana entre landmarks das mãos
    // Requer movimento MUITO significativo
    if (currentResults?.multiHandLandmarks && prevResults?.multiHandLandmarks) {
      for (
        let i = 0;
        i <
        Math.min(
          prevResults.multiHandLandmarks.length,
          currentResults.multiHandLandmarks.length
        );
        i++
      ) {
        const prevHand = prevResults.multiHandLandmarks[i];
        const currHand = currentResults.multiHandLandmarks[i];

        let totalDistance = 0;
        let countedPoints = 0;

        for (let j = 0; j < Math.min(prevHand.length, currHand.length); j++) {
          // Só contar se ambos pontos são visíveis
          if (
            (prevHand[j].visibility ?? 0) > 0.5 &&
            (currHand[j].visibility ?? 0) > 0.5
          ) {
            const dx = currHand[j].x - prevHand[j].x;
            const dy = currHand[j].y - prevHand[j].y;
            const dz = (currHand[j].z ?? 0) - (prevHand[j].z ?? 0);
            totalDistance += Math.sqrt(dx * dx + dy * dy + dz * dz);
            countedPoints++;
          }
        }

        // Calcular distância média por ponto
        if (countedPoints > 0) {
          const avgDistance = totalDistance / countedPoints;
          // Requer movimento > 0.25 (25%) por ponto em média - muito rigoroso
          if (avgDistance > 0.25) return true;
        }
      }
    }

    // Se havia pose antes, verificar se mudou significativamente
    if (currentResults?.poseLandmarks && prevResults?.poseLandmarks) {
      let poseDistance = 0;
      let countedPoints = 0;

      for (
        let i = 0;
        i <
        Math.min(
          prevResults.poseLandmarks.length,
          currentResults.poseLandmarks.length
        );
        i++
      ) {
        // Só contar se ambos pontos são visíveis
        if (
          (prevResults.poseLandmarks[i].visibility ?? 0) > 0.5 &&
          (currentResults.poseLandmarks[i].visibility ?? 0) > 0.5
        ) {
          const dx =
            currentResults.poseLandmarks[i].x - prevResults.poseLandmarks[i].x;
          const dy =
            currentResults.poseLandmarks[i].y - prevResults.poseLandmarks[i].y;
          const dz =
            (currentResults.poseLandmarks[i].z ?? 0) -
            (prevResults.poseLandmarks[i].z ?? 0);
          poseDistance += Math.sqrt(dx * dx + dy * dy + dz * dz);
          countedPoints++;
        }
      }

      // Calcular distância média
      if (countedPoints > 0) {
        const avgDistance = poseDistance / countedPoints;
        // Requer movimento > 0.30 (30%) por ponto em média
        if (avgDistance > 0.3) return true;
      }
    }

    return false;
  };

  return (
    <div className="min-h-screen w-full text-white">
      <ErrorModal
        message={error}
        onClose={() => setError("")}
        isOnline={isOnline}
      />
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 sm:px-8">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
              Inclusão Digital
            </span>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-100">
              Libras + LGM
            </span>
            <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs font-semibold text-sky-100">
              MediaPipe + OpenRouter
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Tradução de linguagem de sinais em tempo real
            </h1>
            <p className="max-w-3xl text-lg text-slate-200">
              Capte Libras (Brasil) ou Língua Gestual Moçambicana. A câmera lê
              os gestos com MediaPipe e o OpenRouter devolve a palavra provável
              — montamos a frase na hora.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={startCapture}
              disabled={isStreaming || isLoadingModel}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <IconPlay />
              {isLoadingModel ? "Carregando modelo..." : "Iniciar captura"}
            </button>
            {error && (
              <button
                onClick={retryCapture}
                disabled={isStreaming || isLoadingModel}
                className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-3 text-sm font-semibold text-blue-950 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <IconRefresh />
                Tentar novamente
              </button>
            )}
            {isStreaming && (
              <button
                onClick={switchCamera}
                disabled={isLoadingModel}
                className="inline-flex items-center gap-2 rounded-full bg-purple-500 px-5 py-3 text-sm font-semibold text-purple-950 transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <IconCamera />
                {facingMode === "user" ? "Usar traseira" : "Usar frontal"}
              </button>
            )}
            {isStreaming && (
              <button
                onClick={capturePhoto}
                disabled={isLoadingModel}
                className="inline-flex items-center gap-2 rounded-full bg-green-500 px-5 py-3 text-sm font-semibold text-green-950 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                📸 Capturar foto
              </button>
            )}
            {isStreaming && (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoadingModel}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
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
              onClick={stopCapture}
              disabled={!isStreaming}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <IconStop />
              Parar
            </button>
            <button
              onClick={clearPhrase}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/30"
            >
              <IconRefresh />
              Limpar frase
            </button>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <label className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-3 text-sm font-semibold text-blue-950 transition hover:bg-blue-400 cursor-pointer">
              📁 Upload imagem
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            <label className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-orange-950 transition hover:bg-orange-400 cursor-pointer">
              🎥 Upload vídeo
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
              />
            </label>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="glass-card col-span-2 overflow-hidden rounded-3xl">
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <div>
                <p className="text-sm text-slate-300">Câmera e captura</p>
                <p className="text-base font-semibold text-white">
                  Visualização ao vivo
                </p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
                {status}
              </span>
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
                    Toque em “Iniciar captura”
                  </p>
                  <p className="text-sm text-slate-200">
                    A câmera frontal é recomendada para gestos pessoais.
                    Certifique-se de usar HTTPS no celular.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card flex flex-col gap-4 rounded-3xl p-5">
            <div className="flex flex-col items-center justify-center">
              <div>
                <p className="text-sm text-center text-slate-300">Tradução</p>
                <p className="text-lg text-center font-semibold text-white">
                  Palavra atual
                </p>
              </div>
              <select
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value as SupportedLanguage)
                }
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
                  onChange={(e) => setUseVisionAI(e.target.checked)}
                  className="rounded border-white/20 bg-slate-800"
                />
                Usar IA Vision (sem MediaPipe)
              </label>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-300">
                Palavra detectada
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">
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
        </div>

        {(capturedImage || recordedVideo) && (
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
        )}

        <section className="glass-card grid grid-cols-1 gap-6 rounded-3xl p-6 md:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-white">Como funciona</p>
            <p className="mt-2 text-sm text-slate-200">
              MediaPipe captura pontos de mãos, rosto e corpo. Enviamos esses
              pontos para o OpenRouter, que devolve a palavra provável em
              português.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Dicas de captura</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-200">
              <li>• Boa luz e fundo simples ajudam na detecção.</li>
              <li>• Enquadre mãos e rosto; prefira câmera traseira.</li>
              <li>• Gestos firmes facilitam a inferência.</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              Dicas para upload de imagem
            </p>
            <ul className="mt-2 space-y-1 text-sm text-slate-200">
              <li>• Use imagens com mãos claramente visíveis</li>
              <li>• Foque em gestos de libras específicos</li>
              <li>• Boa iluminação e fundo contrastante</li>
              <li>• Mãos devem estar em primeiro plano</li>
              <li>• Ative "Usar IA Vision" para análise direta da imagem</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Privacidade</p>
            <p className="mt-2 text-sm text-slate-200">
              Toda conversa tida desaparece no instante que a pagina faz
              refresh, nao guardadmos nada.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
