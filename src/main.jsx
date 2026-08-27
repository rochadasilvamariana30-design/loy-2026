import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const tabs = [
  { id: "juridica", label: "Pesquisas Jurídicas", icon: "⚖" },
  { id: "academica", label: "Artigos Acadêmicos", icon: "▤" },
  { id: "outros", label: "Outros", icon: "✦" }
];

const suggestions = {
  juridica: [
    "LGPD e responsabilidade civil",
    "Medidas protetivas",
    "Jurisprudência do STJ"
  ],
  academica: [
    "Direito e inteligência artificial",
    "Reforma trabalhista",
    "Responsabilidade civil"
  ],
  outros: [
    "Explique hermenêutica jurídica",
    "Diferença entre dolo e culpa",
    "O que é precedente?"
  ]
};

function App() {
  const [tab, setTab] = useState("juridica");
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState(() =>
    JSON.parse(localStorage.getItem("loy-history") || "[]")
  );

  const [groups, setGroups] = useState(() =>
    JSON.parse(localStorage.getItem("loy-groups") || "[]")
  );

  const [profileOpen, setProfileOpen] = useState(false);
  const [groupsOpen, setGroupsOpen] = useState(false);

  const [name, setName] = useState(
    () => localStorage.getItem("loy-name") || "Estudante"
  );

  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    localStorage.setItem("loy-history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem("loy-groups", JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem("loy-name", name);
  }, [name]);

  const currentTab = useMemo(
    () => tabs.find((item) => item.id === tab),
    [tab]
  );

  async function search(text = query) {
    const question = text.trim();

    if (!question) return;

    setQuery(question);
    setLoading(true);
    setAnswer("");

    try {
      const response = await fetch("/.netlify/functions/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: question,
          mode: tab
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Não foi possível consultar a IA."
        );
      }

      setAnswer(data.answer);

      setHistory((previous) => [
        {
          id: Date.now(),
          query: question,
          mode: tab,
          date: new Date().toLocaleString("pt-BR")
        },
        ...previous
      ].slice(0, 30));
    } catch (error) {
      setAnswer(
        "Não foi possível consultar a IA agora. Quando colocarmos o projeto na Netlify, vamos configurar a chave do Gemini para ativar essa função."
      );
    } finally {
      setLoading(false);
    }
  }

  function createGroup() {
    const newGroup = groupName.trim();

    if (!newGroup) return;

    setGroups((previous) => [
      {
        id: Date.now(),
        name: newGroup,
        members: 1,
        tasks: 0
      },
      ...previous
    ]);

    setGroupName("");
  }

  return (
    <div className="app">

      <header className="topbar">

        <div
          className="brand"
          onClick={() => {
            setAnswer("");
            setQuery("");
          }}
        >
          <div className="logo">L</div>

          <div>
            <strong>Loy</strong>
            <span>O futuro do direito começa aqui</span>
          </div>
        </div>

        <nav>
          <button
            onClick={() => {
              setGroupsOpen(false);
              document
                .getElementById("search")
                ?.scrollIntoView();
            }}
          >
            Pesquisar
          </button>

          <button onClick={() => setGroupsOpen(true)}>
            Meus grupos
          </button>

          <button onClick={() => setProfileOpen(true)}>
            Perfil
          </button>
        </nav>

      </header>

      <main>

        <section className="hero" id="search">

          <div className="eyebrow">
            PESQUISA JURÍDICA INTELIGENTE
          </div>

          <h1>
            O futuro do direito
            <br />
            <em>começa aqui.</em>
          </h1>

          <p>
            Pesquise, organize suas fontes e desenvolva
            trabalhos acadêmicos com inteligência artificial.
          </p>

          <div className="searchbox">

            <textarea
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (
                  (event.ctrlKey || event.metaKey) &&
                  event.key === "Enter"
                ) {
                  search();
                }
              }}
              placeholder="Digite sua dúvida, tema, lei ou caso..."
            />

            <button
              className="searchbtn"
              onClick={() => search()}
              disabled={loading}
            >
              {loading ? "Consultando..." : "Pesquisar →"}
            </button>

          </div>

          <div className="tabs">

            {tabs.map((item) => (
              <button
                className={
                  tab === item.id
                    ? "tab active"
                    : "tab"
                }
                key={item.id}
                onClick={() => setTab(item.id)}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}

          </div>

          <div className="chips">

            {suggestions[tab].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => search(suggestion)}
              >
                {suggestion}
              </button>
            ))}

          </div>

        </section>

        {answer && (
          <section className="answer-card">

            <div className="answer-head">

              <span>
                {currentTab.icon} Resultado da pesquisa
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
              Conteúdo gerado por IA. Verifique as fontes
              oficiais antes de utilizar em trabalhos acadêmicos.
            </small>

          </section>
        )}

        <section className="features">

          <div className="feature">
            <b>01</b>
            <h3>Pesquise</h3>
            <p>
              Encontre explicações e pesquisas estruturadas
              para seus estudos.
            </p>
          </div>

          <div className="feature">
            <b>02</b>
            <h3>Organize</h3>
            <p>
              Salve pesquisas, fontes e ideias para
              continuar seu trabalho.
            </p>
          </div>

          <div className="feature">
            <b>03</b>
            <h3>Colabore</h3>
            <p>
              Crie grupos e desenvolva trabalhos
              com seus colegas.
            </p>
          </div>

        </section>

        <section className="groups-banner">

          <div>

            <div className="eyebrow">
              NOVO NO LOY
            </div>

            <h2>
              Trabalhe sozinho ou com seu grupo.
            </h2>

            <p>
              Crie um espaço para sua pesquisa,
              convide colegas e organize as tarefas
              do trabalho.
            </p>

          </div>

          <button onClick={() => setGroupsOpen(true)}>
            Criar grupo →
          </button>

        </section>

        {history.length > 0 && (
          <section className="history">

            <div className="section-title">

              <h2>Pesquisas recentes</h2>

              <button
                onClick={() => setHistory([])}
              >
                Limpar
              </button>

            </div>

            {history.slice(0, 5).map((item) => (

              <button
                className="history-item"
                key={item.id}
                onClick={() => {
                  setTab(item.mode);
                  search(item.query);
                }}
              >

                <span>{item.query}</span>

                <small>{item.date}</small>

              </button>

            ))}

          </section>
        )}

      </main>

      <footer>
        <strong>Loy</strong>
        {" · "}
        O futuro do direito começa aqui
        {" · "}
        <span>
          Para estudo e pesquisa acadêmica.
        </span>
      </footer>

      {profileOpen && (

        <div
          className="modal-bg"
          onClick={() => setProfileOpen(false)}
        >

          <div
            className="modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="close"
              onClick={() => setProfileOpen(false)}
            >
              ×
            </button>

            <div className="avatar">
              L
            </div>

            <h2>Meu perfil</h2>

            <label>Nome</label>

            <input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
            />

            <label>
              Instituição de ensino
            </label>

            <input
              placeholder="Ex.: Mackenzie"
            />

            <label>Curso</label>

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
          onClick={() => setGroupsOpen(false)}
        >

          <div
            className="modal wide"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="close"
              onClick={() => setGroupsOpen(false)}
            >
              ×
            </button>

            <div className="eyebrow">
              ESPAÇOS DE TRABALHO
            </div>

            <h2>Meus grupos</h2>

            <div className="create-group">

              <input
                value={groupName}
                onChange={(event) =>
                  setGroupName(event.target.value)
                }
                placeholder="Nome do novo grupo"
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
                Você ainda não criou nenhum grupo.
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
                      {" · "}
                      {group.tasks} tarefa(s)
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
