"use client";

import { useState } from "react";
import { useHolisticCapture } from "../hooks/useHolisticCapture";
import { useTranslation } from "../hooks/useTranslation";
import { ErrorModal } from "../components/ErrorModal";
import { Header } from "../components/Header";
import { CameraView } from "../components/CameraView";
import { TranslationPanel } from "../components/TranslationPanel";
import { MediaCapture } from "../components/MediaCapture";
import { InfoSection } from "../components/InfoSection";
import { Footer } from "../components/Footer";
import { HolisticResults } from "../types/payloads";
import { SupportedLanguage } from "../types/sign-languages";

export default function Home() {
  const [language, setLanguage] = useState<SupportedLanguage>("libras");
  const [orModel] = useState("openai/gpt-4o-mini");

  const {
    videoRef,
    canvasRef,
    startCapture,
    stopCapture,
    retryCapture,
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
      console.log("Vision AI detectou:", word);
      setWordFromVision(word);
    },
  });

  const {
    currentWord,
    phrase,
    translateGesture,
    clearPhrase,
    setWordFromVision,
  } = useTranslation({
    language,
    isOnline,
    model: orModel,
    setStatus,
    setError,
  });

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

  return (
    <div className="min-h-screen w-full text-white">
      <ErrorModal
        message={error}
        onClose={() => setError("")}
        isOnline={isOnline}
      />
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:gap-6 md:gap-8 lg:gap-10 px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8 lg:py-10">
        <Header
          isStreaming={isStreaming}
          isLoadingModel={isLoadingModel}
          error={error}
          isRecording={isRecording}
          facingMode={facingMode}
          onStartCapture={startCapture}
          onStopCapture={stopCapture}
          onRetryCapture={retryCapture}
          onSwitchCamera={switchCamera}
          onCapturePhoto={capturePhoto}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onClearPhrase={clearPhrase}
          onImageUpload={handleImageUpload}
          onVideoUpload={handleVideoUpload}
        />

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CameraView
              videoRef={videoRef}
              canvasRef={canvasRef}
              isStreaming={isStreaming}
              status={status}
            />
          </div>

          <div className="lg:col-span-1">
            <TranslationPanel
              language={language}
              currentWord={currentWord}
              phrase={phrase}
              useVisionAI={useVisionAI}
              isOnline={isOnline}
              onLanguageChange={setLanguage}
              onVisionAIToggle={setUseVisionAI}
            />
          </div>
        </div>

        <MediaCapture
          capturedImage={capturedImage}
          recordedVideo={recordedVideo}
        />

        <InfoSection />
      </div>

      <Footer />
    </div>
  );
}
