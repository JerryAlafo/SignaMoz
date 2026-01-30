import { useRef } from "react";
import { HolisticResults } from "../types/payloads";

/**
 * Sistema de buffer para agregação de gestos estáveis
 * Agrega múltiplos frames antes de considerar um gesto "completo"
 */
export function useGestureBuffer() {
  const bufferRef = useRef<HolisticResults[]>([]);
  const bufferSize = 5; // Agregar 5 frames (~200ms a 30fps)
  const stabilityThreshold = 0.05; // Threshold para considerar gesto estável

  const addFrame = (results: HolisticResults): HolisticResults | null => {
    // Adicionar ao buffer
    bufferRef.current.push(results);
    
    // Manter apenas os últimos N frames
    if (bufferRef.current.length > bufferSize) {
      bufferRef.current.shift();
    }

    // Se buffer não está cheio, ainda não temos gesto estável
    if (bufferRef.current.length < bufferSize) {
      return null;
    }

    // Verificar estabilidade: se os últimos frames são similares
    const isStable = checkStability(bufferRef.current);
    
    if (isStable) {
      // Retornar o frame médio (último frame do buffer)
      const stableFrame = bufferRef.current[bufferSize - 1];
      // Limpar buffer após processar
      bufferRef.current = [];
      return stableFrame;
    }

    return null;
  };

  const checkStability = (frames: HolisticResults[]): boolean => {
    if (frames.length < 2) return false;

    // Comparar os últimos 3 frames
    const recentFrames = frames.slice(-3);
    
    for (let i = 1; i < recentFrames.length; i++) {
      const prev = recentFrames[i - 1];
      const curr = recentFrames[i];
      
      if (!areFramesSimilar(prev, curr, stabilityThreshold)) {
        return false;
      }
    }

    return true;
  };

  const areFramesSimilar = (
    frame1: HolisticResults,
    frame2: HolisticResults,
    threshold: number
  ): boolean => {
    // Comparar mãos
    const hands1 = frame1.multiHandLandmarks || [];
    const hands2 = frame2.multiHandLandmarks || [];

    if (hands1.length !== hands2.length) return false;
    if (hands1.length === 0) return false;

    // Comparar cada mão
    for (let i = 0; i < hands1.length; i++) {
      const hand1 = hands1[i];
      const hand2 = hands2[i];

      if (hand1.length !== hand2.length) return false;

      let totalDiff = 0;
      let count = 0;

      for (let j = 0; j < hand1.length; j++) {
        const dx = Math.abs(hand1[j].x - hand2[j].x);
        const dy = Math.abs(hand1[j].y - hand2[j].y);
        const dz = Math.abs((hand1[j].z || 0) - (hand2[j].z || 0));
        totalDiff += Math.sqrt(dx * dx + dy * dy + dz * dz);
        count++;
      }

      const avgDiff = totalDiff / count;
      if (avgDiff > threshold) return false;
    }

    return true;
  };

  const clear = () => {
    bufferRef.current = [];
  };

  return { addFrame, clear };
}

