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
  send: (input: { image: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement | ImageData }) => Promise<void>;                                                                  
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
  const [useVisionAI, setUseVisionAI] = useState(true); // Habilitado por padr├úo
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
          console.warn("DrawingUtils n├úo dispon├¡vel, continuando sem ele");
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
      
      // Verificar se DrawingUtils est├í dispon├¡vel
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
    setStatus("Solicitando c├ómera...");

    if (typeof window === "undefined") return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("C├ómera n├úo suportada neste dispositivo.");
      return;
    }

    // Verificar se est├í em contexto seguro (HTTPS ou localhost)
    if (!window.isSecureContext) {
      setError(
        "A c├ómera requer uma conex├úo segura (HTTPS). Para testar no celular:\n" +
        "1. Use um t├║nel HTTPS como ngrok (ngrok http 3000)\n" +
        "2. Ou implante a aplica├º├úo em um servidor HTTPS"
      );
      return;
    }

    try {
      // Verificar conex├úo de internet para carregar scripts
      if (!navigator.onLine) {
        setError("Sem conex├úo de internet. Alguns recursos podem estar limitados.");
        // Continuar mesmo sem internet, pode usar cache
      }

      try {
        await loadMediaPipe();
      } catch (loadErr) {
        console.warn("Erro ao carregar MediaPipe:", loadErr);
        setError("Aviso: Alguns recursos do MediaPipe n├úo puderam ser carregados. Tentando continuar...");
        // Continuar mesmo com erro de carregamento
      }

      // Tentar m├║ltiplas combina├º├╡es de constraints em ordem de prefer├¬ncia
      const constraintOptions = [
        // Op├º├úo 1: Facing mode selecionado com resolu├º├úo ideal
        { video: { facingMode, width: { ideal: 960 }, height: { ideal: 720 } } },
        // Op├º├úo 2: Facing mode selecionado com resolu├º├úo menor
        { video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } } },
        // Op├º├úo 3: Facing mode selecionado sem resolu├º├úo
        { video: { facingMode } },
        // Op├º├úo 4: Facing mode oposto
        { video: { facingMode: facingMode === "user" ? "environment" : "user", width: { ideal: 960 }, height: { ideal: 720 } } },
        // Op├º├úo 5: Facing mode oposto menor
        { video: { facingMode: facingMode === "user" ? "environment" : "user", width: { ideal: 640 }, height: { ideal: 480 } } },
        // Op├º├úo 6: Facing mode oposto sem resolu├º├úo
        { video: { facingMode: facingMode === "user" ? "environment" : "user" } },
        // Op├º├úo 7: Sem facing mode (fallback)
        { video: { width: { ideal: 640 }, height: { ideal: 480 } } },
        // Op├º├úo 8: Fallback total
        { video: true },
      ];

      let stream: MediaStream | null = null;
      let lastError: Error | null = null;

      for (const constraints of constraintOptions) {
        try {
          setStatus(`Tentando acessar c├ómera...`);
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          setStatus("C├ómera acessada com sucesso");
          break; // Sucesso! Sair do loop
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.warn(`Falha com constraints ${JSON.stringify(constraints)}, tentando pr├│xima op├º├úo...`, err);
          // Continuar para a pr├│xima op├º├úo
        }
      }

      if (!stream) {
        throw lastError || new Error("N├úo foi poss├¡vel acessar a c├ómera com nenhuma configura├º├úo");
      }

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("V├¡deo n├úo dispon├¡vel");
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
        err instanceof Error ? err.message : "Erro ao iniciar a c├ómera.";
      console.error("Erro de c├ómera:", err);
      
      // Mensagens de erro mais espec├¡ficas
      if (message.includes("NotReadableError")) {
        setError(
          "A c├ómera n├úo conseguiu iniciar. Tente:\n" +
          "1. Fechar outros aplicativos que usam c├ómera\n" +
          "2. Recarregar a p├ígina\n" +
          "3. Reiniciar o navegador"
        );
      } else if (message.includes("Permission denied") || message.includes("NotAllowedError")) {
        setError("Permiss├úo de c├ómera negada. Verifique as configura├º├╡es do navegador e tente novamente.");
      } else if (message.includes("NotFoundError")) {
        setError("Nenhuma c├ómera dispon├¡vel encontrada neste dispositivo.");
      } else if (message.includes("AbortError")) {
        setError("O acesso ├á c├ómera foi cancelado. Tente novamente.");
      } else {
        setError(`Erro ao iniciar c├ómera: ${message}`);
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
      setStatus("V├¡deo gravado!");
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    setStatus("Gravando v├¡deo...");

    // Parar automaticamente ap├│s 5 segundos
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
        // Usar MediaPipe para extrair landmarks e depois traduzir
        await processImageWithMediaPipe(imageFile);
      }
    } catch (err) {
      console.error("Erro ao processar imagem:", err);
      setError("Erro ao processar imagem");
    }
  };

  const processVideo = async (videoFile: File) => {
    setStatus("Processando v├¡deo...");
    try {
      // Para v├¡deos, por enquanto apenas mostrar mensagem
      void(videoFile); // Evitar warning de par├ómetro n├úo usado
      setStatus("Processamento de v├¡deo ainda n├úo implementado. Use imagens por enquanto.");
    } catch (err) {
      console.error("Erro ao processar v├¡deo:", err);
      setError("Erro ao processar v├¡deo");
    }
  };

  const processImageWithVisionAI = async (imageFile: File) => {
    setStatus("Analisando imagem com IA Vision...");
    try {
      // Verificar se o arquivo ├⌐ uma imagem v├ílida
      if (!imageFile.type.startsWith('image/')) {
        throw new Error("Arquivo n├úo ├⌐ uma imagem v├ílida");
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
                text: `Qual gesto de LIBRAS est├í nesta imagem? Responda apenas com uma palavra: ol├í, obrigado, comer, beber, amor, eu, voc├¬, pai, m├úe, casa, ajuda, bom, dois, cinco, ou "desconhecido".`
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
      console.log("Enviando imagem para an├ílise de vis├úo...");

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
          "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
          "X-Title": "Signa Moz + Libras",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3-haiku", // Modelo com capacidade de vis├úo
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Você é um especialista em reconhecimento de Linguagem Brasileira de Sinais (Libras) ou Língua Gestual Moçambicana.

INSTRUÇÕES CRÍTICAS:
- Analise cuidadosamente a posição, forma e movimento das MÃOS na imagem
- Foque PRIMARIAMENTE nas mãos - elas são o elemento mais importante
- Identifique o gesto/sinal que as mãos estão fazendo
- Responda APENAS com UMA palavra em português (minúsculas) que melhor descreve o gesto
- Seja ESPECÍFICO e DESCRITIVO - use palavras comuns em português
- Exemplos de gestos comuns:
  * Mão aberta acenando ou levantada = "olá", "oi", "cumprimento"
  * Mão fechada em punho = "não", "negativo", "parar"
  * Dedos na boca = "comer", "fome", "alimento"
  * Mão no peito/coração = "amor", "eu", "coração"
  * Mão acima da cabeça = "casa", "alto", "céu"
  * Mão em forma de L ou V = "vitória", "paz", "dois"
  * Mão apontando = "você", "ali", "lá"
  * Mãos juntas = "obrigado", "por favor", "agradecer"
  * Mão fechada com polegar para cima = "bom", "ok", "sim"
  * Mão com dedos estendidos = "cinco", "número", "contar"

IMPORTANTE:
- Se você CONSEGUE identificar um gesto claro, retorne a palavra correspondente
- NÃO retorne "desconhecido" a menos que realmente não consiga identificar NADA
- Use sua melhor interpretação baseada no que vê nas mãos
- Palavras aceitas: qualquer palavra em português que descreva o gesto (olá, obrigado, comer, beber, amor, casa, ajuda, bom, sim, não, eu, você, pai, mãe, etc.)

Responda APENAS com a palavra em português (minúsculas), sem pontuação, sem explicações.`,
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
          temperature: 0.2
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
      
      if (!rawWord) {
        console.warn("Resposta vazia da Vision AI");
        if (onVisionResult) {
          onVisionResult("desconhecido");
        }
        setStatus("Não foi possível analisar a imagem");
        return "desconhecido";
      }
      
      // Limpar a resposta: remover pontuação e espaços extras
      const word = rawWord
        .toLowerCase()
        .replace(/[.!?,;:\-"'`()\[\]{}]/g, "")
        .trim();
      
      // Extrair primeira palavra se houver múltiplas
      const firstWord = word.split(/\s+/)[0];
      
      // Verificar se é uma palavra válida em português (apenas letras e acentos)
      if (firstWord && firstWord.length >= 2 && /^[a-záéíóúàâãêôõç]+$/i.test(firstWord)) {
        // Não aceitar "desconhecido" a menos que seja realmente isso
        if (firstWord === "desconhecido" || firstWord === "unknown") {
          console.log("Gesto não reconhecido na imagem");
          if (onVisionResult) {
            onVisionResult("desconhecido");
          }
          setStatus("Gesto não reconhecido na imagem");
          return "desconhecido";
        }
        
        console.log("Palavra detectada pela Vision AI:", firstWord);
        if (onVisionResult) {
          onVisionResult(firstWord);
        }
        setStatus(`Gesto reconhecido: ${firstWord}`);
        return firstWord;
      }
      
      console.log("Resposta inválida da Vision AI:", rawWord);
      if (onVisionResult) {
        onVisionResult("desconhecido");
      }
      setStatus("Não foi possível interpretar o gesto");
      return "desconhecido";
    } catch (err) {
      console.error("Erro ao processar imagem com Vision AI:", err);
      setError("Erro ao analisar imagem");
      throw err;
    }
  };

  const processImageWithMediaPipe = async (imageFile: File) => {
    setStatus("Extraindo landmarks com MediaPipe...");
    try {
      // Carregar MediaPipe se necessário
      await loadMediaPipe();
      
      // Criar elemento de imagem
      const img = new Image();
      const imageUrl = URL.createObjectURL(imageFile);
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = imageUrl;
      });

      const anyWindow = window as MPWindow;
      
      // Criar instância do Holistic
      const holistic = new anyWindow.Holistic({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
      });

      holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        refineFaceLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        staticImageMode: true, // Modo estático para imagens
      });

      // Processar imagem
      await new Promise<void>((resolve) => {
        holistic.onResults((results: HolisticResults) => {
          console.log("MediaPipe detectou:", {
            hands: results.multiHandLandmarks?.length ?? 0,
            pose: results.poseLandmarks?.length ?? 0,
          });
          
          // Passar resultados para tradução
          if (onResults) {
            onResults(results, true);
          }
          resolve();
        });
        
        holistic.send({ image: img });
      });

      // Limpar
      URL.revokeObjectURL(imageUrl);
      setStatus("Imagem processada com MediaPipe");
    } catch (err) {
      console.error("Erro ao processar imagem com MediaPipe:", err);
      setError("Erro ao processar imagem com MediaPipe. Tentando Vision AI...");
      // Fallback para Vision AI
      await processImageWithVisionAI(imageFile);
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

