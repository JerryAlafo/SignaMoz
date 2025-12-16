"use client";

import { useEffect, useRef, useState } from "react";
import { HolisticResults } from "../types/payloads";

type UseHolisticCaptureProps = {
  onResults?: (results: HolisticResults, isFromImage?: boolean) => void;
  onVisionResult?: (word: string) => void;
};

type MediaPipeCamera = {
  start: () => void;
  stop?: () => void;
};

type MediaPipeHolistic = {
  setOptions: (options: Record<string, unknown>) => void;
  onResults: (cb: (results: HolisticResults) => void) => void;
  send: (input: { image: HTMLVideoElement | HTMLCanvasElement | ImageData }) => Promise<void>;
};

type MPWindow = Window &
  typeof globalThis & {
    DrawingUtils: new (ctx: CanvasRenderingContext2D) => {
      drawConnectors: (
        landmarks: unknown,
        connections: unknown,
        style?: Record<string, unknown>
      ) => void;
      drawLandmarks: (
        landmarks: unknown,
        style?: Record<string, unknown>
      ) => void;
    };
    HAND_CONNECTIONS: unknown;
    POSE_CONNECTIONS: unknown;
    FACEMESH_TESSELATION: unknown;
    Holistic: new (options: {
      locateFile: (file: string) => string;
    }) => MediaPipeHolistic;
    Camera: new (
      video: HTMLVideoElement,
      config: {
        onFrame: () => Promise<void>;
        width: number;
        height: number;
      }
    ) => MediaPipeCamera;
  };

export function useHolisticCapture({ onResults, onVisionResult }: UseHolisticCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const holisticRef = useRef<MediaPipeHolistic | null>(null);
  const cameraRef = useRef<MediaPipeCamera | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState("Pronto para iniciar");
  const [error, setError] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" && navigator.onLine);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [useVisionAI, setUseVisionAI] = useState(true); // Habilitado por padrão
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const drawingUtilsReadyRef = useRef(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      stopCapture();
    };
  }, []);

  const loadScript = (src: string, id: string) =>
    new Promise<void>((resolve, reject) => {
      if (document.getElementById(id)) return resolve();
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.id = id;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
      document.body.appendChild(script);
    });

  const loadMediaPipe = async () => {
    setIsLoadingModel(true);
    try {
      await loadScript(
        "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js",
        "mp-camera"
      );
      await loadScript(
        "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js",
        "mp-drawing"
      );
      await loadScript(
        "https://cdn.jsdelivr.net/npm/@mediapipe/holistic/holistic.js",
        "mp-holistic"
      );
      
      // Aguardar um pouco para os scripts serem totalmente carregados
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verificar se DrawingUtils foi carregado corretamente (opcional para processamento)
      const anyWindow = window as MPWindow;
      try {
        if (typeof anyWindow.DrawingUtils === "function") {
          drawingUtilsReadyRef.current = true;
        } else {
          console.warn("DrawingUtils não disponível, continuando sem ele");
          drawingUtilsReadyRef.current = false;
        }
      } catch (e) {
        console.warn("Erro ao verificar DrawingUtils:", e);
        drawingUtilsReadyRef.current = false;
      }
    } catch (err) {
      drawingUtilsReadyRef.current = false;
      throw err;
    } finally {
      setIsLoadingModel(false);
    }
  };

  const drawLandmarks = (results: HolisticResults) => {
    try {
      const canvasEl = canvasRef.current;
      const videoEl = videoRef.current;
      if (!canvasEl || !videoEl) return;

      canvasEl.width = videoEl.videoWidth;
      canvasEl.height = videoEl.videoHeight;

      const ctx = canvasEl.getContext("2d");
      if (!ctx) return;

      ctx.save();
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);

      const anyWindow = window as MPWindow;
      
      // Verificar se DrawingUtils está disponível
      if (!drawingUtilsReadyRef.current || typeof anyWindow.DrawingUtils !== "function") {
        ctx.restore();
        return;
      }

      const drawingUtils = new anyWindow.DrawingUtils(ctx);

      if (results.poseLandmarks) {
        drawingUtils.drawConnectors(
          results.poseLandmarks,
          anyWindow.POSE_CONNECTIONS,
          { color: "#3BC9F5", lineWidth: 4 }
        );
      }

      if (results.faceLandmarks) {
        drawingUtils.drawConnectors(
          results.faceLandmarks,
          anyWindow.FACEMESH_TESSELATION,
          { color: "rgba(255,255,255,0.2)", lineWidth: 1 }
        );
      }

      if (results.multiHandLandmarks) {
        for (const hand of results.multiHandLandmarks) {
          drawingUtils.drawConnectors(hand, anyWindow.HAND_CONNECTIONS, {
            color: "#7C3AED",
            lineWidth: 4,
          });
          drawingUtils.drawLandmarks(hand, {
            color: "#F5D0FE",
            lineWidth: 2,
            radius: 2.5,
          });
        }
      }

      ctx.restore();
    } catch (err) {
      console.error("Erro ao desenhar landmarks:", err);
      // Continuar capturando mesmo com erro de desenho
    }
  };

  const stopCapture = () => {
    try {
      cameraRef.current?.stop?.();
    } catch {
      // ignore
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    holisticRef.current = null;
    cameraRef.current = null;
    streamRef.current = null;
    setIsStreaming(false);
    setStatus("Captura encerrada");
  };

  const startCapture = async () => {
    if (isStreaming) return;
    setError("");
    setStatus("Solicitando câmera...");

    if (typeof window === "undefined") return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Câmera não suportada neste dispositivo.");
      return;
    }

    // Verificar se está em contexto seguro (HTTPS ou localhost)
    if (!window.isSecureContext) {
      setError(
        "A câmera requer uma conexão segura (HTTPS). Para testar no celular:\n" +
        "1. Use um túnel HTTPS como ngrok (ngrok http 3000)\n" +
        "2. Ou implante a aplicação em um servidor HTTPS"
      );
      return;
    }

    try {
      // Verificar conexão de internet para carregar scripts
      if (!navigator.onLine) {
        setError("Sem conexão de internet. Alguns recursos podem estar limitados.");
        // Continuar mesmo sem internet, pode usar cache
      }

      try {
        await loadMediaPipe();
      } catch (loadErr) {
        console.warn("Erro ao carregar MediaPipe:", loadErr);
        setError("Aviso: Alguns recursos do MediaPipe não puderam ser carregados. Tentando continuar...");
        // Continuar mesmo com erro de carregamento
      }

      // Tentar múltiplas combinações de constraints em ordem de preferência
      const constraintOptions = [
        // Opção 1: Facing mode selecionado com resolução ideal
        { video: { facingMode, width: { ideal: 960 }, height: { ideal: 720 } } },
        // Opção 2: Facing mode selecionado com resolução menor
        { video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } } },
        // Opção 3: Facing mode selecionado sem resolução
        { video: { facingMode } },
        // Opção 4: Facing mode oposto
        { video: { facingMode: facingMode === "user" ? "environment" : "user", width: { ideal: 960 }, height: { ideal: 720 } } },
        // Opção 5: Facing mode oposto menor
        { video: { facingMode: facingMode === "user" ? "environment" : "user", width: { ideal: 640 }, height: { ideal: 480 } } },
        // Opção 6: Facing mode oposto sem resolução
        { video: { facingMode: facingMode === "user" ? "environment" : "user" } },
        // Opção 7: Sem facing mode (fallback)
        { video: { width: { ideal: 640 }, height: { ideal: 480 } } },
        // Opção 8: Fallback total
        { video: true },
      ];

      let stream: MediaStream | null = null;
      let lastError: Error | null = null;

      for (const constraints of constraintOptions) {
        try {
          setStatus(`Tentando acessar câmera...`);
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          setStatus("Câmera acessada com sucesso");
          break; // Sucesso! Sair do loop
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.warn(`Falha com constraints ${JSON.stringify(constraints)}, tentando próxima opção...`, err);
          // Continuar para a próxima opção
        }
      }

      if (!stream) {
        throw lastError || new Error("Não foi possível acessar a câmera com nenhuma configuração");
      }

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("Vídeo não disponível");
      video.srcObject = stream;
      await video.play();

      const anyWindow = window as MPWindow;
      
      try {
        const holistic = new anyWindow.Holistic({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
        });

        holistic.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          refineFaceLandmarks: true,
          minDetectionConfidence: 0.3,
          minTrackingConfidence: 0.3,
        });

        holistic.onResults((results: HolisticResults) => {
          try {
            drawLandmarks(results);
            onResults?.(results);
          } catch (err) {
            console.error("Erro ao processar resultados:", err);
          }
        });
        holisticRef.current = holistic;

        const camera = new anyWindow.Camera(video, {
          onFrame: async () => {
            try {
              await holistic.send({ image: video });
            } catch (sendErr) {
              console.error("Erro ao enviar frame:", sendErr);
            }
          },
          width: 960,
          height: 720,
        });

        cameraRef.current = camera;
        camera.start();
        setIsStreaming(true);
        setStatus("Capturando gestos...");
        setError(""); // Limpar erros anteriores
      } catch (holisticErr) {
        const message = holisticErr instanceof Error ? holisticErr.message : "Erro ao inicializar Holistic";
        console.error("Erro Holistic:", holisticErr);
        setError(`Erro ao inicializar modelo: ${message}`);
        stopCapture();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao iniciar a câmera.";
      console.error("Erro de câmera:", err);
      
      // Mensagens de erro mais específicas
      if (message.includes("NotReadableError")) {
        setError(
          "A câmera não conseguiu iniciar. Tente:\n" +
          "1. Fechar outros aplicativos que usam câmera\n" +
          "2. Recarregar a página\n" +
          "3. Reiniciar o navegador"
        );
      } else if (message.includes("Permission denied") || message.includes("NotAllowedError")) {
        setError("Permissão de câmera negada. Verifique as configurações do navegador e tente novamente.");
      } else if (message.includes("NotFoundError")) {
        setError("Nenhuma câmera disponível encontrada neste dispositivo.");
      } else if (message.includes("AbortError")) {
        setError("O acesso à câmera foi cancelado. Tente novamente.");
      } else {
        setError(`Erro ao iniciar câmera: ${message}`);
      }
      
      stopCapture();
    }
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const retryCapture = async () => {
    setError("");
    setStatus("Tentando novamente...");
    await new Promise(resolve => setTimeout(resolve, 1000)); // Pequena pausa
    await startCapture();
  };

  const switchCamera = async () => {
    if (isStreaming) {
      toggleFacingMode();
      await stopCapture();
      await startCapture();
    }
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageDataUrl = canvas.toDataURL('image/png');
    setCapturedImage(imageDataUrl);
    setStatus("Foto capturada!");
  };

  const startRecording = () => {
    if (!streamRef.current || isRecording) return;

    recordedChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9'
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const videoUrl = URL.createObjectURL(blob);
      setRecordedVideo(videoUrl);
      setStatus("Vídeo gravado!");
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    setStatus("Gravando vídeo...");

    // Parar automaticamente após 5 segundos
    setTimeout(() => {
      stopRecording();
    }, 5000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processImage = async (imageFile: File) => {
    setStatus("Processando imagem...");
    try {
      if (useVisionAI) {
        // Usar IA Vision diretamente
        await processImageWithVisionAI(imageFile);
      } else {
        // Usar MediaPipe + IA tradicional
        await processImageWithVisionAI(imageFile); // Temporariamente usar Vision AI também
      }
    } catch (err) {
      console.error("Erro ao processar imagem:", err);
      setError("Erro ao processar imagem");
    }
  };

  const processVideo = async (videoFile: File) => {
    setStatus("Processando vídeo...");
    try {
      // Para vídeos, por enquanto apenas mostrar mensagem
      void(videoFile); // Evitar warning de parâmetro não usado
      setStatus("Processamento de vídeo ainda não implementado. Use imagens por enquanto.");
    } catch (err) {
      console.error("Erro ao processar vídeo:", err);
      setError("Erro ao processar vídeo");
    }
  };

  const processImageWithVisionAI = async (imageFile: File) => {
    setStatus("Analisando imagem com IA Vision...");
    try {
      // Verificar se o arquivo é uma imagem válida
      if (!imageFile.type.startsWith('image/')) {
        throw new Error("Arquivo não é uma imagem válida");
      }
      
      if (imageFile.size < 1000) {
        throw new Error("Imagem muito pequena, pode estar corrompida");
      }
      
      console.log("Processando imagem:", imageFile.name, "Tipo:", imageFile.type, "Tamanho:", imageFile.size, "bytes");
      // Converter imagem para base64
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remover o prefixo "data:image/jpeg;base64," etc.
          const base64 = result.split(',')[1];
          console.log("Imagem convertida para base64, tamanho:", base64.length, "caracteres");
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });
      
      console.log("Enviando para OpenRouter Vision AI:", {
        model: "openai/gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Qual gesto de LIBRAS está nesta imagem? Responda apenas com uma palavra: olá, obrigado, comer, beber, amor, eu, você, pai, mãe, casa, ajuda, bom, dois, cinco, ou "desconhecido".`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${imageFile.type};base64,${imageBase64}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 20,
        temperature: 0.1
      });
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || "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"}`,
          "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
          "X-Title": "Signa Moz + Libras",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o", // Modelo com melhor capacidade de visão
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Você é um especialista em reconhecimento de Libras (Linguagem Brasileira de Sinais). Analise esta imagem e identifique o gesto de linguagem de sinais.

INSTRUÇÕES IMPORTANTES:
- Foque nas mãos e sua posição/forma
- Analise o contexto completo da imagem
- Responda APENAS com uma palavra em português minúscula da lista abaixo
- Se não houver gestos claros de libras ou não reconhecer, retorne "desconhecido"

GESTOS SUPORTADOS:
- olá (mão aberta acenando)
- obrigado (mão aberta movendo da esquerda para direita)
- comer (dedo indicador tocando os lábios)
- beber (mão em formato de concha próximo à boca)
- amor (mão aberta sobre o peito)
- por favor (mão aberta com palma para cima)
- eu (punho fechado batendo no peito)
- você (dedo indicador apontando)
- pai (mão em L na testa)
- mãe (mão em L no queixo)
- casa (mão aberta acima da cabeça em telhado)
- ajuda (mãos abertas se aproximando)
- bom (mão fechada com polegar para cima)
- dois (dedos indicador e médio em V)
- cinco (mão aberta com dedos juntos)
- três (mão em C)
- ok (polegar e indicador em círculo)
- um (mão fechada com polegar estendido)

DICAS:
- Procure pelas mãos primeiro
- Considere posição relativa ao corpo
- Gestos simples geralmente usam uma mão
- Se mãos estiverem neutras (ao lado), pode não ser gesto

Responda apenas com a palavra exata ou "desconhecido".`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${imageFile.type};base64,${imageBase64}`,
                    detail: "high"
                  }
                }
              ]
            }
          ],
          max_tokens: 10,
          temperature: 0.1
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro da API:", response.status, errorText);
        throw new Error("Erro ao processar a imagem. Tente novamente ou entre em contacto se o problema persistir.");
      }

      const data = await response.json();
      const rawWord = data?.choices?.[0]?.message?.content?.trim() || "";
      console.log("Resposta bruta da Vision AI:", rawWord);
      let word = rawWord.toLowerCase();
      
      word = word.replace(/[.!?,;:\-"'`()\[\]{}]/g, "").trim().toLowerCase();
      
      const allowedWords = new Set([
        "olá", "obrigado", "comer", "beber", "amor", "por favor", "eu", "você", 
        "pai", "mãe", "casa", "ajuda", "bom", "dois", "cinco", "três", "ok", "um"
      ]);
      
      if (word && allowedWords.has(word)) {
        console.log("Palavra detectada pela Vision AI:", word);
        // Chamar callback específico para Vision AI
        if (onVisionResult) {
          onVisionResult(word);
        }
        setStatus("Imagem analisada com sucesso!");
        return word;
      }
      
      console.log("Palavra não reconhecida, retornando 'desconhecido'");
      // Mesmo para "desconhecido", chamar o callback
      if (onVisionResult) {
        onVisionResult("desconhecido");
      }
      setStatus("Imagem analisada com sucesso!");
      return "desconhecido";
      
      setStatus("Imagem analisada com sucesso!");
    } catch (err) {
      console.error("Erro ao processar imagem com Vision AI:", err);
      setError("Erro ao analisar imagem");
    }
  };

  return {
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
  };
}

