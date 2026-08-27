const SYSTEM_PROMPT = `
Você é a assistente jurídica do Loy, voltada para estudantes e pesquisadores de Direito no Brasil.

Responda em português do Brasil, com linguagem clara e acadêmica.

Nunca invente lei, artigo, súmula, processo, tribunal, autor ou obra.

Quando não puder confirmar uma informação, diga expressamente que ela precisa ser verificada.

Organize a resposta de maneira clara, usando contextualização,
fundamentos, análise e síntese quando fizer sentido.

Indique as fontes jurídicas que sustentam a resposta.

A resposta é destinada a estudo e pesquisa e não substitui
a consulta às fontes oficiais nem orientação jurídica profissional.
`;

export default async (req) => {

  if (req.httpMethod !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Método não permitido."
      }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "GEMINI_API_KEY não configurada."
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  try {

    const body = JSON.parse(req.body || "{}");

    const query = body.query;
    const mode = body.mode || "juridica";

    if (!query) {
      return new Response(
        JSON.stringify({
          error: "Pergunta vazia."
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const instructions = {

      juridica:
        "Priorize legislação, jurisprudência e fontes oficiais verificáveis.",

      academica:
        "Priorize estrutura acadêmica, autores, correntes doutrinárias e bibliografia.",

      outros:
        "Explique de forma didática, mantendo fundamentação jurídica quando aplicável."

    };

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
        encodeURIComponent(apiKey),

      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          systemInstruction: {
            parts: [
              {
                text:
                  SYSTEM_PROMPT +
                  "\n\n" +
                  (instructions[mode] || "")
              }
            ]
          },

          contents: [
            {
              role: "user",

              parts: [
                {
                  text: query
                }
              ]
            }
          ],

          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2500
          }

        })
      }
    );

    const data = await response.json();

    if (!response.ok) {

      return new Response(
        JSON.stringify({
          error:
            data?.error?.message ||
            "Erro na API do Gemini."
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

    }

    const answer =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("") ||
      "A IA não retornou uma resposta.";

    return new Response(
      JSON.stringify({
        answer
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  } catch (error) {

    return new Response(
      JSON.stringify({
        error: "Erro interno ao consultar a IA."
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  }
};
