// netlify/functions/gemini.js

const MODEL = "gemini-3.6-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// Domínios jurídicos confiáveis (ajuste conforme necessidade)
const DOMINIOS_CONFIAVEIS = [
  "planalto.gov.br",
  "stf.jus.br",
  "stj.jus.br",
  "jusbrasil.com.br",
  "lexml.gov.br",
  "camara.leg.br",
  "senado.leg.br",
];

function fonteConfiavel(url) {
  if (!url) return false;
  return DOMINIOS_CONFIAVEIS.some((dominio) => url.includes(dominio));
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Método não permitido." }),
    };
  }

  let pergunta;
  try {
    const body = JSON.parse(event.body || "{}");
    pergunta = body.pergunta;
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Corpo da requisição inválido." }),
    };
  }

  if (!pergunta || !pergunta.trim()) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Pergunta vazia." }),
    };
  }

  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    console.error("GEMINI_API_KEY não configurada no ambiente.");
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Chave da API não configurada no servidor.",
      }),
    };
  }

  const systemInstruction = `
Você é um assistente jurídico. Responda APENAS com base em resultados reais de busca (Google Search grounding).

REGRAS OBRIGATÓRIAS:
1. NUNCA cite artigo, lei ou jurisprudência que não tenha vindo de uma fonte real encontrada na busca.
2. NUNCA invente número de artigo, nome de lei, data ou link.
3. Toda citação DEVE vir acompanhada da fonte (nome do site/publicação).
4. Se não houver fonte confiável relevante à pergunta, responda apenas:
"Infelizmente não encontramos esse artigo :("
5. Você pode explicar/traduzir para linguagem simples o conteúdo encontrado, mas sem adicionar fatos que não estejam nas fontes.
6. Não dê opinião jurídica pessoal nem preveja resultado de processo.
7. Foque apenas em leis, artigos e explicações jurídicas — nada fora desse escopo.
`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY,
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: pergunta }],
          },
        ],
        tools: [{ google_search: {} }],
        generationConfig: {
          temperature: 0,
        },
      }),
    });

    const data = await response.json();

    // Se a API retornou erro (modelo errado, key inválida, etc), repassa o erro real
    if (!response.ok) {
      console.error("Erro da API Gemini:", JSON.stringify(data));
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: data?.error?.message || "Erro desconhecido na API Gemini.",
        }),
      };
    }

    const candidate = data?.candidates?.[0];
    const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];

    const fontes = groundingChunks
      .map((chunk) => ({
        titulo: chunk?.web?.title || "Fonte",
        url: chunk?.web?.uri || null,
      }))
      .filter((f) => f.url && fonteConfiavel(f.url));

    // Sem nenhuma fonte confiável -> força a mensagem padrão
    if (fontes.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          texto: "Infelizmente não encontramos esse artigo :(",
          fontes: [],
