// netlify/functions/gemini.js

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { pergunta } = JSON.parse(event.body || "{}");

  if (!pergunta || !pergunta.trim()) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Pergunta vazia." }),
    };
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  const MODEL = "gemini-2.5-flash"; // ou o modelo que vocês já usam

  const systemInstruction = `
Você é um assistente jurídico. Responda APENAS com base em resultados reais de busca (Google Search grounding).

REGRAS OBRIGATÓRIAS:
1. NUNCA cite artigo, lei ou jurisprudência que não tenha vindo de uma fonte real encontrada na busca.
2. NUNCA invente número de artigo, nome de lei, data ou link.
3. Toda citação DEVE vir acompanhada da fonte (nome do site/publicação).
4. Se a busca não retornar nenhuma fonte confiável e relevante à pergunta, responda apenas:
"Infelizmente não encontramos esse artigo :("
5. Você pode explicar/traduzir para linguagem simples o conteúdo encontrado, mas sem adicionar fatos que não estejam nas fontes.
6. Não dê opinião jurídica pessoal nem preveja resultado de processo.
7. Foque apenas em leis, artigos e explicações — nada de conteúdo fora do escopo jurídico.
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
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
            temperature: 0, // reduz criatividade/alucinação ao máximo
          },
        }),
      }
    );

    const data = await response.json();

    const candidate = data?.candidates?.[0];
    const groundingChunks =
      candidate?.groundingMetadata?.groundingChunks || [];

    // Regra chave: se não veio NENHUMA fonte real, não confiamos no texto do modelo.
    if (groundingChunks.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          texto: "Infelizmente não encontramos esse artigo :(",
          fontes: [],
        }),
      };
    }

    const texto = candidate?.content?.parts?.map((p) => p.text).join("") || "";

    const fontes = groundingChunks
      .map((chunk) => ({
        titulo: chunk?.web?.title || "Fonte",
        url: chunk?.web?.uri || null,
      }))
      .filter((f) => f.url);

    return {
      statusCode: 200,
      body: JSON.stringify({ texto, fontes }),
    };
  } catch (err) {
    console.error("Erro Gemini:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        texto: "Infelizmente não encontramos esse artigo :(",
        fontes: [],
      }),
    };
  }
};
