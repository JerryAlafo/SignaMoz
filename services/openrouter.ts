"use client";

import { LANGUAGE_LABELS, SupportedLanguage } from "../types/sign-languages";
import { GesturePayload } from "../types/payloads";

export type OpenRouterRequest = {
  apiKey?: string;
  model: string;
  language: SupportedLanguage;
  payload: GesturePayload;
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_KEYS = [
  "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",
];

const FALLBACK_MODELS = [
  "openai/gpt-4o-mini",
  "openai/gpt-4o-mini-3k",
  "google/gemini-flash-1.5",
  "openai/gpt-3.5-turbo",
  "anthropic/claude-3-haiku",
  "meta-llama/llama-3.1-8b-instruct",
  "microsoft/wizardlm-2-8x22b",
];

export async function translateWithOpenRouter({
  apiKey,
  model,
  language,
  payload,
}: OpenRouterRequest) {
  const keysToTry = apiKey ? [apiKey] : DEFAULT_KEYS;
  if (keysToTry.length === 0) throw new Error("Serviço temporariamente indisponível. Tente novamente mais tarde ou entre em contacto.");

  let lastError: string | undefined;

  for (const key of keysToTry) {
    const modelsToTry = [model, ...FALLBACK_MODELS].filter(Boolean);

    for (const mdl of modelsToTry) {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        };

        if (typeof window !== "undefined") {
          headers["HTTP-Referer"] = window.location.origin;
          headers["X-Title"] = "Signa Moz + Libras";
        }

        const res = await fetch(OPENROUTER_URL, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: mdl,
            temperature: 0.1,
            max_tokens: 30,
            messages: [
              {
                role: "system",
                content: `Você é um especialista em reconhecimento de linguagem de sinais. Analisará landmarks de pose, mão e rosto do MediaPipe Holistic.

IMPORTANTE: 
- Responda APENAS com UMA palavra em português (minúsculas)
- Analise cuidadosamente os landmarks das mãos (hands) - são os mais importantes
- Se houver landmarks de mão claros indicando um gesto específico, identifique a palavra
- Gestos comuns incluem: olá (mão aberta acenando), obrigado (mão aberta movendo), comer (dedos na boca), beber (mão em copo), casa (mão em telhado), ajuda (mãos abertas), amor (mãos no coração)
- Se landmarks mostrarem mão aberta, pode ser "olá" ou "obrigado"
- Se landmarks mostrarem mão na boca/região, pode ser "comer" ou "beber"  
- Se landmarks mostrarem mão no peito/coração, pode ser "amor" ou "obrigado"
- Se landmarks mostrarem mão acima da cabeça, pode ser "casa" ou "teto"
- Se não houver landmarks de mão claros ou não corresponderem a gestos conhecidos, retorne "desconhecido"
- NUNCA invente gestos - baseie-se apenas nos landmarks fornecidos
- Se os dados de mão forem vazios ou muito poucos pontos, retorne "desconhecido"

Exemplo: "olá" (não "Olá" ou "você disse olá" ou "hm, parece ser...")`,
              },
              {
                role: "user",
                content: `Analise estes landmarks do MediaPipe Holistic para a linguagem ${LANGUAGE_LABELS[language]} e retorne apenas a palavra que representa este gesto:

MÃOS: ${payload.hands ? JSON.stringify(payload.hands).substring(0, 500) : "Nenhuma"}
POSE: ${payload.pose ? JSON.stringify(payload.pose).substring(0, 300) : "Nenhuma"}

Palavra:`,
              },
            ],
          }),
        });

        if (!res.ok) {
          lastError = await res.text();
          continue;
        }

        const data = await res.json();
        let word = data?.choices?.[0]?.message?.content?.trim() ?? "";
        
        // Se resposta vazia, continuar para próximo modelo
        if (!word) {
          console.warn(`Resposta vazia do modelo ${mdl}`);
          continue;
        }
        
        // Limpar a resposta
        word = word.toLowerCase().trim();
        
        // Remover pontuação comum
        word = word.replace(/[.!?,;:\-"'`]/g, "").trim();
        
        // Remover artigos e preposições comuns se vierem no início
        word = word.replace(/^(o|a|os|as|um|uma|uns|umas|de|do|da|dos|das|para|por)\s+/i, "").trim();
        
        // Se ficou vazio após limpeza, continuar
        if (!word) {
          console.warn(`Resposta vazia após limpeza do modelo ${mdl}`);
          continue;
        }
        
        // Aceitar qualquer resposta não-vazia, desde que seja uma palavra válida
        // (sem números ou caracteres especiais)
        if (/^[a-záéíóúàâãêôõç\s]+$/i.test(word)) {
          console.log(`Palavra detectada: "${word}"`);
          return word;
        }
        
        // Se resposta inválida, continuar para o próximo modelo
        console.warn(`Resposta inválida: "${word}"`);
        continue;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        continue;
      }
    }
  }

  throw new Error(lastError || "Erro ao reconhecer o gesto. Tente novamente ou entre em contacto se o problema persistir.");
}