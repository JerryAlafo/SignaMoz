// Dicionário de gestos conhecidos em Libras e LSM
// Mapeados por análise de landmarks comuns

export const GESTURE_DATABASE = {
  libras: {
    // Gestos de saudação
    "olá": "Mão aberta, movendo lateralmente perto da cabeça",
    "oi": "Mão aberta, movendo para cima e para baixo",
    "bom dia": "Gesto de 'bom' + gesticular 'dia'",
    "boa tarde": "Gesto de 'bom' + gesticular 'tarde'",
    "boa noite": "Gesto de 'bom' + gesticular 'noite'",
    
    // Gestos de cortesia
    "obrigado": "Mão aberta movendo para frente do corpo",
    "de nada": "Aceno com a mão",
    "por favor": "Mão no peito com movimento suave",
    
    // Gestos comuns
    "sim": "Cabeça balançando para cima e para baixo ou gesto de afirmação",
    "não": "Cabeça balançando para os lados",
    "ajuda": "Mãos abertas pedindo auxílio",
    "desculpa": "Mão no peito com expressão de arrependimento",
    
    // Ações
    "comer": "Dedos com movimento em direção à boca",
    "beber": "Mão em formato de xícara perto da boca",
    "dormir": "Cabeça reclinada em mão",
    "trabalho": "Movimento de mãos em atividade",
    
    // Família
    "pai": "Mão na testa",
    "mãe": "Mão no queixo",
    "filho": "Mão na cabeça de uma criança imaginária",
    "filha": "Mão na cabeça + gesto feminino",
    "irmão": "Dois dedos indicadores lado a lado",
    "irmã": "Dois dedos indicadores lado a lado + gesto feminino",
    "avó": "Mão no queixo movendo para baixo",
    "avô": "Mão na testa movendo para baixo",
    
    // Lugares
    "casa": "Mãos em formato de teto",
    "escola": "Mãos juntas como um livro",
    
    // Emoções
    "feliz": "Sorriso com movimento das mãos para cima",
    "triste": "Sobrancelhas franzidas com movimento para baixo",
    "alegre": "Movimento rápido das mãos",
    "cansado": "Mão na testa com expressão de cansaço",
    "raiva": "Punhos cerrados com movimento agressivo",
    "medo": "Mãos em frente ao rosto, recuando",
    
    // Saúde
    "dor": "Dedos em formato de pinca apontando o local da dor",
    "saúde": "Dedos em V tocando braço",
    "médico": "Sinal de pulso + movimento de exame",
    "hospital": "Sinal de cruz",
    
    // Outros
    "água": "Dedos em formato de W movendo da boca para baixo",
    "comida": "Mão em formato de colher perto da boca",
    "amor": "Mãos no coração",
    "pessoa": "Mãos abertas movendo para baixo",
    "coisa": "Mão indicando objeto",
  },
  lsm: {
    // Gestos de saudação (LSM - Língua Gestual Moçambicana)
    "olá": "Mão aberta acenando",
    "oi": "Aceno simples com a mão",
    "bom": "Polegar para cima ou gesto positivo",
    "dia": "Mão indicando o sol",
    "noite": "Gesto de escuridão ou mão na cabeça",
    
    // Gestos de cortesia
    "obrigado": "Mão no peito com movimento para frente",
    "por favor": "Mãos em posição de pedido",
    
    // Gestos comuns
    "sim": "Afirmação com cabeça ou gesto positivo",
    "não": "Negação com cabeça ou gesto negativo",
    "ajuda": "Mãos oferecendo apoio",
    
    // Ações
    "comer": "Movimento de mão para a boca",
    "beber": "Mão em xícara",
    "dormir": "Cabeça em mão",
    "trabalho": "Movimento de trabalho",
    
    // Família
    "pai": "Gesto masculino + família",
    "mãe": "Gesto feminino + família",
    "filho": "Gesto pequeno + família",
    "filha": "Gesto pequeno feminino + família",
    "irmão": "Comparação entre dois",
    "irmã": "Comparação feminina",
    
    // Lugares
    "casa": "Estrutura de teto",
    "escola": "Livro aberto",
    
    // Emoções
    "feliz": "Sorriso com movimento para cima",
    "triste": "Expressão triste com movimento para baixo",
    "alegre": "Movimento energético",
    "cansado": "Movimento lento e pesado",
  }
};

export function isKnownGesture(word: string, language: "libras" | "lsm"): boolean {
  const normalizedWord = word.toLowerCase().trim();
  return normalizedWord in GESTURE_DATABASE[language];
}

export function getGestureDescription(word: string, language: "libras" | "lsm"): string | null {
  const normalizedWord = word.toLowerCase().trim();
  const languageDb = GESTURE_DATABASE[language] as Record<string, string>;
  return languageDb[normalizedWord] || null;
}

export function recognizeGestureOffline(word: string, language: "libras" | "lsm"): string | null {
  if (isKnownGesture(word, language)) {
    return word.toLowerCase().trim();
  }
  return null;
}
