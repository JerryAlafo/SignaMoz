import { useRef, useState } from "react";
import { translateWithOpenRouter } from "../services/openrouter";
import { GesturePayload, HolisticResults, Landmark } from "../types/payloads";
import { SupportedLanguage } from "../types/sign-languages";
import { useGestureBuffer } from "./useGestureBuffer";

const getTimestamp = () => performance.now();

type UseTranslationProps = {
  language: SupportedLanguage;
  isOnline: boolean;
  model: string;
  setStatus: (status: string) => void;
  setError?: (error: string) => void;
};

export function useTranslation({
  language,
  isOnline,
  model,
  setStatus,
  setError,
}: UseTranslationProps) {
  const lastInferenceRef = useRef<number>(0);
  const lastWordTimeRef = useRef<number>(0);
  const lastProcessedGestureRef = useRef<string>("");
  const { addFrame, clear: clearBuffer } = useGestureBuffer();
  const [currentWord, setCurrentWord] = useState("");
  const [phrase, setPhrase] = useState<string[]>([]);

  const translateGesture = async (
    results: HolisticResults,
    isFromImage = false
  ) => {
    const now = getTimestamp();

    // Para imagens, processar imediatamente
    if (isFromImage) {
      await processGesture(results, now);
      return;
    }

    // Verificar se há mãos detectadas
    const hasHands = results.multiHandLandmarks && results.multiHandLandmarks.length > 0;
    
    if (!hasHands) {
      // Atualizar status periodicamente
      if (now - lastInferenceRef.current > 3000) {
        setStatus("Aguardando detecção de mãos...");
        lastInferenceRef.current = now;
      }
      return;
    }

    // Usar buffer para agregar gestos estáveis
    const stableGesture = addFrame(results);
    
    if (stableGesture) {
      // Verificar se não processamos este gesto recentemente
      const gestureHash = getGestureHash(stableGesture);
      if (gestureHash === lastProcessedGestureRef.current) {
        return; // Já processamos este gesto
      }

      // Processar gesto estável
      lastProcessedGestureRef.current = gestureHash;
      await processGesture(stableGesture, now);
    }
  };

  const getGestureHash = (results: HolisticResults): string => {
    // Criar hash simples baseado nas posições das mãos
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      return "";
    }

    const hand = results.multiHandLandmarks[0];
    const keyPoints = [0, 4, 8, 12, 16, 20]; // Pontos-chave dos dedos
    const hash = keyPoints
      .map((idx) => {
        const p = hand[idx];
        return `${Math.round(p.x * 10)}_${Math.round(p.y * 10)}`;
      })
      .join("|");
    
    return hash;
  };

  const processGesture = async (results: HolisticResults, timestamp: number) => {
    // Throttle: não processar mais de uma vez a cada 2 segundos
    if (timestamp - lastInferenceRef.current < 2000) {
      return;
    }

    lastInferenceRef.current = timestamp;

    const handsCount = results.multiHandLandmarks?.length ?? 0;
    console.log(`[Tradução] Processando gesto estável com ${handsCount} mão(s)`);

    setStatus("Analisando gesto...");

    // Preparar payload simplificado (apenas mãos, mais eficiente)
    const payload: GesturePayload = {
      language,
      hands: results.multiHandLandmarks?.map((hand: Landmark[]) =>
        hand.map((p: Landmark) => [
          Number(p.x.toFixed(3)),
          Number(p.y.toFixed(3)),
          Number(p.z?.toFixed(3) ?? 0),
        ])
      ),
      pose: undefined, // Não enviar pose para reduzir payload
      timestamp: timestamp,
    };

    if (!isOnline) {
      setStatus("Capturando gestos (Offline)...");
      return;
    }

    // Processar de forma assíncrona
    translateWithOpenRouter({
      apiKey: undefined,
      model,
      language,
      payload,
    })
      .then((word) => {
        if (word && word.trim().length > 0) {
          pushWord(word);
          setStatus("Gesto traduzido! Continue fazendo gestos...");
        } else {
          setStatus("Gesto não reconhecido. Tente outro gesto...");
        }
      })
      .catch((err) => {
        console.error("Erro na tradução:", err);
        setStatus("Erro ao traduzir. Continuando captura...");
      });
  };

  const pushWord = (word: string) => {
    if (!word || word.trim().length === 0) {
      return;
    }

    const cleanWord = word.trim().toLowerCase();
    const now = getTimestamp();
    
    // Filtrar palavras muito curtas ou inválidas
    if (cleanWord.length < 2 || cleanWord === "desconhecido" || cleanWord === "unknown") {
      return;
    }

    setCurrentWord(cleanWord);
    setPhrase((prev) => {
      if (prev.length === 0) {
        lastWordTimeRef.current = now;
        return [cleanWord];
      }
      
      const lastWord = prev[prev.length - 1]?.toLowerCase();
      
      // Não adicionar se for a mesma palavra
      if (lastWord === cleanWord) return prev;
      
      // Evitar adicionar palavras muito rápido (mínimo 0.8s entre palavras diferentes)
      if (now - lastWordTimeRef.current < 800) {
        return prev;
      }
      
      lastWordTimeRef.current = now;
      return [...prev, cleanWord];
    });
  };

  const clearPhrase = () => {
    setPhrase([]);
    setCurrentWord("");
    clearBuffer();
    lastProcessedGestureRef.current = "";
  };

  const setWordFromVision = (word: string) => {
    setCurrentWord(word);
    lastInferenceRef.current = getTimestamp();
  };

  return {
    currentWord,
    phrase,
    translateGesture,
    clearPhrase,
    setWordFromVision,
  };
}

