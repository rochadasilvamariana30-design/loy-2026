import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const modes = [
  {
    id: "juridica",
    name: "Pesquisas Jurídicas",
    icon: "⚖"
  },
  {
    id: "academica",
    name: "Artigos Acadêmicos",
    icon: "▤"
  },
  {
    id: "outros",
    name: "Outros",
    icon: "✦"
  }
];

const examples = [
  "O que é responsabilidade civil objetiva?",
  "Explique a diferença entre dolo e culpa.",
  "Como funciona a LGPD?"
];

function App() {
  const [mode, setMode] = useState("juridica");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);
  const [groupsOpen, setGroupsOpen] = useState(false);

  const [name, setName] = useState(
    localStorage.getItem("loy-name") || "Estudante"
  );

  const [groups, setGroups] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("loy-groups") || "[]"
      );
    } catch {
      return [];
    }
  });

  const [newGroup, setNewGroup] = useState("");

  useEffect(() => {
    localStorage.setItem("loy-name", name);
  }, [name]);

  useEffect(() => {
    localStorage.setItem(
      "loy-groups",
      JSON.stringify(groups)
    );
  }, [groups]);

  async function search(text = question) {
    const query = text.trim();

    if (!query) {
      return;
    }

    setQuestion(query);
    setLoading(true);
    setAnswer("");

    try {
      const response = await fetch(
        "/.netlify/functions/gemini",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            query,
            mode
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Erro ao consultar a IA."
        );
      }

      setAnswer(
        data.answer || "A IA não retornou uma resposta."
      );

    } catch (error) {
      console.error(error);

      setAnswer(
        "Não foi possível consultar a IA. " +
        "A conexão com o serviço ainda precisa ser configurada."
      );

    } finally {
      setLoading(false);
    }
  }

  function createGroup() {
    const group = newGroup.trim();

    if (!group) {
      return;
    }

    setGroups([
      ...groups,
      {
        id: Date.now(),
        name: group,
        members: 1
      }
    ]);

    setNewGroup("");
  }

  return (
    <div className="app">

      <header className="topbar">

        <div
          className="brand"
          onClick={() => {
            setQuestion("");
            setAnswer("");
          }}
        >

          <div className="logo">
            L
          </div>

          <div>
            <strong>Loy</strong>

            <span>
              O futuro do direito começa aqui
            </span>
          </div>

        </div>

        <nav>

          <button
            onClick={() => {
              setGroupsOpen(false);
              setProfileOpen(false);

              document
                .getElementById("pesquisa")
                ?.scrollIntoView({
                  behavior: "smooth"
                });
            }}
          >
            Pesquisar
          </button>

          <button
            onClick={() => setGroupsOpen(true)}
          >
            Meus grupos
          </button>

          <button
            onClick={() => setProfileOpen(true)}
          >
            Perfil
          </button>

        </nav>

      </header>

      <main>

        <section
          className="hero"
          id="pesquisa"
        >

          <div className="eyebrow">
            PESQUISA JURÍDICA INTELIGENTE
          </div>

          <h1>
            O futuro do direito
            <br />
            <em>começa aqui.</em>
          </h1>

          <p>
            Pesquise, organize seus estudos e
            desenvolva trabalhos com inteligência
            artificial.
          </p>

          <div className="searchbox">

            <textarea
              value={question}
              onChange={(event) =>
                setQuestion(event.target.value)
              }
              placeholder="Digite sua dúvida, tema, lei ou caso..."
            />

            <button
              className="searchbtn"
              onClick={() => search()}
              disabled={loading}
            >
              {loading
                ? "Consultando..."
                : "Pesquisar →"}
            </button>

          </div>

          <div className="tabs">

            {modes.map((item) => (

              <button
                key={item.id}
                className={
                  mode === item.id
                    ? "tab active"
                    : "tab"
                }
                onClick={() =>
                  setMode(item.id)
                }
              >

                <span>
                  {item.icon}
                </span>

                {item.name}

              </button>

            ))}

          </div>

          <div className="chips">

            {examples.map((example) => (

              <button
                key={example}
                onClick={() => search(example)}
              >
                {example}
              </button>

            ))}

          </div>

        </section>

        {answer && (

          <section className="answer-card">

            <div className="answer-head">

              <span>
                Resultado da pesquisa
              </span>

              <button
                onClick={() =>
                  navigator.clipboard?.writeText(answer)
                }
              >
                Copiar
              </button>

            </div>

            <div className="answer-body">
              {answer}
            </div>

            <small>
              O conteúdo gerado por IA deve ser
              conferido nas fontes oficiais.
            </small>

          </section>

        )}

        <section className="features">

          <div className="feature">
            <b>01</b>

            <h3>
              Pesquise
            </h3>

            <p>
              Encontre respostas estruturadas
              para seus estudos jurídicos.
            </p>
          </div>

          <div className="feature">
            <b>02</b>

            <h3>
              Organize
            </h3>

            <p>
              Centralize ideias e pesquisas
              importantes para seus trabalhos.
            </p>
          </div>

          <div className="feature">
            <b>03</b>

            <h3>
              Colabore
            </h3>

            <p>
              Crie grupos e desenvolva trabalhos
              com outros estudantes.
            </p>
          </div>

        </section>

        <section className="groups-banner">

          <div>

            <div className="eyebrow">
              TRABALHO COLABORATIVO
            </div>

            <h2>
              Estude sozinho ou em grupo.
            </h2>

            <p>
              Crie grupos para trabalhos,
              pesquisas acadêmicas e projetos
              colaborativos.
            </p>

          </div>

          <button
            onClick={() => setGroupsOpen(true)}
          >
            Criar grupo →
          </button>

        </section>

      </main>

      <footer>

        <strong>Loy</strong>

        {" · "}

        O futuro do direito começa aqui.

        <span>
          Para estudo e pesquisa acadêmica.
        </span>

      </footer>

      {profileOpen && (

        <div
          className="modal-bg"
          onClick={() =>
            setProfileOpen(false)
          }
        >

          <div
            className="modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="close"
              onClick={() =>
                setProfileOpen(false)
              }
            >
              ×
            </button>

            <div className="avatar">
              L
            </div>

            <h2>
              Meu perfil
            </h2>

            <label>
              Nome
            </label>

            <input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
            />

            <label>
              Instituição
            </label>

            <input
              placeholder="Ex.: Universidade"
            />

            <label>
              Curso
            </label>

            <input
              placeholder="Ex.: Direito"
            />

            <button
              className="primary"
              onClick={() =>
                setProfileOpen(false)
              }
            >
              Salvar perfil
            </button>

          </div>

        </div>

      )}

      {groupsOpen && (

        <div
          className="modal-bg"
          onClick={() =>
            setGroupsOpen(false)
          }
        >

          <div
            className="modal wide"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="close"
              onClick={() =>
                setGroupsOpen(false)
              }
            >
              ×
            </button>

            <div className="eyebrow">
              ESPAÇOS DE TRABALHO
            </div>

            <h2>
              Meus grupos
            </h2>

            <div className="create-group">

              <input
                value={newGroup}
                onChange={(event) =>
                  setNewGroup(event.target.value)
                }
                placeholder="Nome do grupo"
              />

              <button
                className="primary"
                onClick={createGroup}
              >
                Criar
              </button>

            </div>

            {groups.length === 0 ? (

              <p className="muted">
                Você ainda não possui grupos.
              </p>

            ) : (

              groups.map((group) => (

                <div
                  className="group-item"
                  key={group.id}
                >

                  <div>

                    <strong>
                      {group.name}
                    </strong>

                    <small>
                      {group.members} integrante(s)
                    </small>

                  </div>

                  <button>
                    Entrar →
                  </button>

                </div>

              ))

            )}

          </div>

        </div>

      )}

    </div>
  );
}

createRoot(
  document.getElementById("root")
).render(<App />);
