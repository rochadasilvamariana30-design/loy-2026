```js
// netlify/functions/gemini.cjs

const MODEL = "gemini-3.5-flash-lite";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// Domínios confiáveis para pesquisa jurídica/acadêmica
const DOMINIOS_CONFIAVEIS = [
  "planalto.gov.br",
  "stf.jus.br",
  "stj.jus.br",
  "jusbrasil.com.br",
  "lexml.gov.br",
  "camara.leg.br",
  "senado.leg.br",
  "scielo.org",
  "scielo.br",
  "gov.br",
  "jus.br",
  "leg.br",
];

function fonteConfiavel(url) {
  if (!url) return false;

  return DOMINIOS_CONFIAVEIS.some((dominio) =>
    url.includes(dominio)
  );
}

const MENSAGEM_FALLBACK =
  "Infelizmente não encontramos esse artigo :(";

function montarInstrucao(mode) {
  const base = `
Você é Loy, um assistente jurídico. Responda APENAS com base em resultados reais de busca (Google Search grounding).

REGRAS OBRIGATÓRIAS:
1. NUNCA cite artigo, lei, súmula ou jurisprudência que não tenha vindo de uma fonte real encontrada na busca.
2. NUNCA invente número de artigo, nome de lei, data ou link.
3. Toda citação de artigo/lei DEVE vir acompanhada do nome da fonte.
4. Se não houver nenhuma fonte confiável relevante à pergunta, responda apenas:
"${MENSAGEM_FALLBACK}"
5. Explique o conteúdo encontrado em linguagem acessível, sem adicionar fatos que não estejam nas fontes.
6. Não dê opinião jurídica pessoal nem preveja resultado de processo.
`;

  if (mode === "academica") {
    return (
      base +
      `\n7. Foco em artigos acadêmicos, doutrina e produção científica sobre Direito.`
    );
  }

  if (mode === "outros") {
    return (
      base +
      `\n7. Foco em explicações didáticas sobre conceitos e princípios de Direito, sempre embasadas em fontes reais.`
    );
  }

  return (
    base +
    `\n7. Foco em leis, jurisprudência, súmulas e normas jurídicas — nada fora desse escopo.`
  );
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({
        error: "Método não permitido.",
      }),
    };
  }

  let query;
  let mode;

  try {
    const body = JSON.parse(event.body || "{}");

    query = body.query;
    mode = body.mode || "juridica";
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Corpo da requisição inválido.",
      }),
    };
  }

  if (!query || !query.trim()) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Pergunta vazia.",
      }),
    };
  }

  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    console.error(
      "GEMINI_API_KEY não configurada no ambiente."
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        answer: MENSAGEM_FALLBACK,
      }),
    };
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY,
      },

      body: JSON.stringify({
        system_instruction: {
          parts: [
            {
              text: montarInstrucao(mode),
            },
          ],
        },

        contents: [
          {
            role: "user",
            parts: [
              {
                text: query,
              },
            ],
          },
        ],

        tools: [
          {
            google_search: {},
          },
        ],

        generationConfig: {
          temperature: 0,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Erro da API Gemini:",
        JSON.stringify(data)
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          answer: MENSAGEM_FALLBACK,
        }),
      };
    }

    const candidate = data?.candidates?.[0];

    const groundingChunks =
      candidate?.groundingMetadata?.groundingChunks || [];

    const fontesConfiaveis = groundingChunks
      .map((chunk) => ({
        titulo: chunk?.web?.title || "Fonte",
        url: chunk?.web?.uri || null,
      }))
      .filter(
        (f) => f.url && fonteConfiavel(f.url)
      );

    if (fontesConfiaveis.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          answer: MENSAGEM_FALLBACK,
        }),
      };
    }

    let texto =
      candidate?.content?.parts
        ?.map((p) => p.text)
        .join("") || "";

    if (!texto.trim()) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          answer: MENSAGEM_FALLBACK,
        }),
      };
    }

    const listaFontes = fontesConfiaveis
      .map(
        (f) => `- ${f.titulo}: ${f.url}`
      )
      .join("\n");

    texto += `\n\nFontes:\n${listaFontes}`;

    return {
      statusCode: 200,
      body: JSON.stringify({
        answer: texto,
      }),
    };
  } catch (err) {
    console.error(
      "Erro ao consultar Gemini:",
      err.message,
      err.stack
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        answer: MENSAGEM_FALLBACK,
      }),
    };
  }
};
```
