export default async (req) => {
  try {
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
          error: "A Netlify não encontrou GEMINI_API_KEY."
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const body = JSON.parse(req.body || "{}");
    const query = body.query || "";

    if (!query) {
      return new Response(
        JSON.stringify({
          error: "Nenhuma pergunta foi enviada."
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
        encodeURIComponent(apiKey),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    "Responda em português do Brasil. " +
                    "Você é uma assistente para estudantes de Direito. " +
                    "Não invente fontes jurídicas. " +
                    "Explique de forma clara e acadêmica.\n\n" +
                    query
                }
              ]
            }
          ]
        })
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return new Response(
        JSON.stringify({
          error:
            data?.error?.message ||
            "O Gemini retornou um erro.",
          status: geminiResponse.status
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const answer =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answer) {
      return new Response(
        JSON.stringify({
          error: "O Gemini respondeu, mas não retornou texto."
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

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
        error: error?.message || "Erro desconhecido."
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
