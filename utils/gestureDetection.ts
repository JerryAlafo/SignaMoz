import { HolisticResults } from "../types/payloads";

export function hasGestureChanged(
  prevResults: HolisticResults,
  currentResults: HolisticResults,
  setStatus?: (status: string) => void
): boolean {
  if (!prevResults || !prevResults.multiHandLandmarks) return true;

  if (
    !currentResults.multiHandLandmarks ||
    currentResults.multiHandLandmarks.length === 0
  ) {
    setStatus?.("Nenhuma mão detectada na imagem");
    return false;
  }

  const totalLandmarks = currentResults.multiHandLandmarks.reduce(
    (acc, hand) => acc + hand.length,
    0
  );
  // Threshold muito reduzido para aceitar mais gestos (3 landmarks mínimos)
  // MediaPipe geralmente retorna 21 landmarks por mão, então 3 é muito baixo mas aceita gestos parciais
  if (totalLandmarks < 3) {
    return false;
  }

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

      if (countedPoints > 0) {
        const avgDistance = totalDistance / countedPoints;
        // Threshold reduzido para detecção mais sensível em tempo real (0.08 = 8%)
        if (avgDistance > 0.08) return true;
      }
    }
  }

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

    if (countedPoints > 0) {
      const avgDistance = poseDistance / countedPoints;
      // Threshold reduzido para detecção mais sensível em tempo real (0.1 = 10%)
      if (avgDistance > 0.1) return true;
    }
  }

  return false;
}

