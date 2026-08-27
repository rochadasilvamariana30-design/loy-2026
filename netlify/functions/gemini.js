export default async (req) => {
  try {
    if (req.httpMethod !== "POST") {
      return new Response(
        JSON.stringify({
          error: "A função está funcionando, mas recebeu GET em vez de POST."
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
          error: "ERRO: GEMINI_API_KEY não está disponível para a Function."
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
    const query = body.query || "Responda apenas: API funcionando.";

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
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
                  text: query
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: "Gemini rejeitou a solicitação.",
          status: response.status,
          message: data?.error?.message || "Sem mensagem de erro."
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

    return new Response(
      JSON.stringify({
        success: true,
        message: "API funcionando!",
        answer: answer || "Gemini respondeu sem texto."
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
        error: "Erro na Function.",
        message: error?.message || "Erro desconhecido."
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
