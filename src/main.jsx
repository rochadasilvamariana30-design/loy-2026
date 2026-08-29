import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const modes = [
  {
    id: "juridica",
    name: "Pesquisas Jurídicas",
    icon: "⚖",
    description: "Leis, jurisprudência, súmulas e normas"
  },
  {
    id: "academica",
    name: "Artigos Acadêmicos",
    icon: "▤",
    description: "Pesquisa para TCC, artigos e trabalhos"
  },
  {
    id: "outros",
    name: "Outros",
    icon: "✦",
    description: "Dúvidas e explicações sobre Direito"
  }
];

const profileTypes = [
  "Estudante de Direito",
  "Pesquisador",
  "Advogado",
  "Professor",
  "Servidor público",
  "Outro"
];

const examples = {
  juridica: [
    "O que é responsabilidade civil objetiva?",
    "Explique a diferença entre dolo e culpa.",
    "Como funciona a LGPD?"
  ],
  academica: [
    "Artigos acadêmicos sobre responsabilidade civil",
    "Pesquisa sobre inteligência artificial no Direito",
    "Doutrina sobre direitos fundamentais"
  ],
  outros: [
    "Explique o princípio da legalidade.",
    "Qual a diferença entre prescrição e decadência?",
    "Explique o que é hermenêutica jurídica."
  ]
};

/* =========================================================
   ARTIGOS / FONTES
========================================================= */

const articles = [
  {
    id: "artigo-001",
    title: "Pesquisa de legislação e normas jurídicas",
    description:
      "Consulte legislação brasileira e documentos jurídicos por meio de uma fonte pública de referência.",
    source: "LexML Brasil",
    category: "Legislação",
    url: "https://www.lexml.gov.br/"
  },
  {
    id: "artigo-002",
    title: "Pesquisa de jurisprudência do STF",
    description:
      "Acesse decisões, processos e jurisprudência diretamente no portal oficial do Supremo Tribunal Federal.",
    source: "Supremo Tribunal Federal",
    category: "Jurisprudência",
    url: "https://jurisprudencia.stf.jus.br/"
  },
  {
    id: "artigo-003",
    title: "Pesquisa de jurisprudência do STJ",
    description:
      "Consulte jurisprudência e decisões diretamente no portal oficial do Superior Tribunal de Justiça.",
    source: "Superior Tribunal de Justiça",
    category: "Jurisprudência",
    url: "https://scon.stj.jus.br/SCON/"
  },
  {
    id: "artigo-004",
    title: "Portal de periódicos científicos",
    description:
      "Base para localizar produção científica e artigos acadêmicos relevantes para pesquisas.",
    source: "SciELO",
    category: "Artigos acadêmicos",
    url: "https://www.scielo.org/"
  }
];

/* =========================================================
   UTILITÁRIOS
========================================================= */

function generateId(prefix = "id") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 10)}`;
}

function loadJSON(key, fallback) {
  try {
    const saved = localStorage.getItem(key);

    if (!saved) {
      return fallback;
    }

    return JSON.parse(saved);
  } catch {
    return fallback;
  }
}

function formatDate(dateValue) {
  try {
    return new Date(dateValue).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "";
  }
}

/* =========================================================
   APP
========================================================= */

function App() {
  const [mode, setMode] = useState("juridica");

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [articlesOpen, setArticlesOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  /* =======================================================
     PERFIL
  ======================================================= */

  const [profile, setProfile] = useState(() =>
    loadJSON("loy-profile", {
      id: generateId("user"),
      name: "Estudante",
      type: "Estudante de Direito",
      institution: "",
      course: "Direito"
    })
  );

  const [profileDraft, setProfileDraft] = useState(profile);

  /* =======================================================
     HISTÓRICO DE CHAT
  ======================================================= */

  const [history, setHistory] = useState(() =>
    loadJSON("loy-chat-history", [])
  );

  /* =======================================================
     GRUPOS
  ======================================================= */

  const [groups, setGroups] = useState(() =>
    loadJSON("loy-groups", [])
  );

  const [newGroup, setNewGroup] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMessage, setGroupMessage] = useState("");

  /* =======================================================
     SALVAMENTO
  ======================================================= */

  useEffect(() => {
    localStorage.setItem("loy-profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(
      "loy-chat-history",
      JSON.stringify(history)
    );
  }, [history]);

  useEffect(() => {
    localStorage.setItem(
      "loy-groups",
      JSON.stringify(groups)
    );
  }, [groups]);

  /* =======================================================
     DADOS DERIVADOS
  ======================================================= */

  const currentMode = useMemo(
    () => modes.find((item) => item.id === mode),
    [mode]
  );

  const currentExamples = examples[mode] || [];

  const userInitial = profile.name
    ? profile.name.charAt(0).toUpperCase()
    : "L";

  /* =======================================================
     NAVEGAÇÃO
  ======================================================= */

  function goHome() {
    setQuestion("");
    setAnswer("");
    setSelectedGroup(null);

    document
      .getElementById("pesquisa")
      ?.scrollIntoView({
        behavior: "smooth"
      });
  }

  /* =======================================================
     PESQUISA GEMINI
  ======================================================= */

  async function search(text = question) {
    const query = text.trim();

    if (!query || loading) {
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

      const result =
        data.answer ||
        "A IA não retornou uma resposta.";

      setAnswer(result);

      /* -----------------------------------------------
         SALVA A CONVERSA
      ------------------------------------------------ */

      const chat = {
        id: generateId("chat"),
        userId: profile.id,
        question: query,
        answer: result,
        mode,
        modeName: currentMode?.name || mode,
        createdAt: new Date().toISOString()
      };

      setHistory((previous) => [chat, ...previous]);
    } catch (error) {
      console.error(error);

      setAnswer(
        "Não foi possível consultar a IA. Verifique a conexão com o serviço."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     ENTER NO CAMPO DE PESQUISA
  ======================================================= */

  function handleSearchKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      search();
    }
  }

  /* =======================================================
     COPIAR
  ======================================================= */

  async function copyAnswer() {
    if (!answer) {
      return;
    }

    try {
      await navigator.clipboard.writeText(answer);
    } catch (error) {
      console.error(error);
    }
  }

  /* =======================================================
     PERFIL
  ======================================================= */

  function openProfile() {
    setProfileDraft({ ...profile });
    setProfileOpen(true);
  }

  function saveProfile() {
    const cleanProfile = {
      ...profileDraft,
      id: profile.id,
      name:
        profileDraft.name?.trim() ||
        "Usuário Loy",
      institution:
        profileDraft.institution?.trim() || "",
      course:
        profileDraft.course?.trim() || "Direito"
    };

    setProfile(cleanProfile);
    setProfileOpen(false);
  }

  /* =======================================================
     GRUPOS
  ======================================================= */

  function createGroup() {
    const groupName = newGroup.trim();

    if (!groupName) {
      return;
    }

    const group = {
      id: generateId("group"),
      name: groupName,
      ownerId: profile.id,
      ownerName: profile.name,
      code: Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase(),
      members: [
        {
          id: profile.id,
          name: profile.name,
          type: profile.type
        }
      ],
      chatHistory: [],
      createdAt: new Date().toISOString()
    };

    setGroups((previous) => [
      group,
      ...previous
    ]);

    setNewGroup("");
    setSelectedGroup(group.id);
  }

  function enterGroup(groupId) {
    setSelectedGroup(groupId);
  }

  function leaveGroup() {
    setSelectedGroup(null);
  }

  function deleteGroup(groupId) {
    const confirmed = window.confirm(
      "Deseja realmente excluir este grupo?"
    );

    if (!confirmed) {
      return;
    }

    setGroups((previous) =>
      previous.filter(
        (group) => group.id !== groupId
      )
    );

    if (selectedGroup === groupId) {
      setSelectedGroup(null);
    }
  }

  /* =======================================================
     CHAT COMPARTILHADO DO GRUPO
  ======================================================= */

  async function sendGroupMessage() {
    const message = groupMessage.trim();

    if (!message || !selectedGroup) {
      return;
    }

    const group = groups.find(
      (item) => item.id === selectedGroup
    );

    if (!group) {
      return;
    }

    const userMessage = {
      id: generateId("message"),
      userId: profile.id,
      userName: profile.name,
      type: "user",
      text: message,
      createdAt: new Date().toISOString()
    };

    /* Mostra imediatamente a mensagem no grupo */

    setGroups((previous) =>
      previous.map((item) =>
        item.id === selectedGroup
          ? {
              ...item,
              chatHistory: [
                ...(item.chatHistory || []),
                userMessage
              ]
            }
          : item
      )
    );

    setGroupMessage("");

    try {
      const response = await fetch(
        "/.netlify/functions/gemini",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            query: message,
            mode: "juridica",
            groupId: group.id,
            groupName: group.name,
            sharedChat: true
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Erro ao consultar a IA."
        );
      }

      const aiMessage = {
        id: generateId("message"),
        userId: "loy-ai",
        userName: "Loy IA",
        type: "ai",
        text:
          data.answer ||
          "A IA não retornou uma resposta.",
        createdAt: new Date().toISOString()
      };

      setGroups((previous) =>
        previous.map((item) =>
          item.id === selectedGroup
            ? {
                ...item,
                chatHistory: [
                  ...(item.chatHistory || []),
                  aiMessage
                ]
              }
            : item
        )
      );
    } catch (error) {
      console.error(error);

      const errorMessage = {
        id: generateId("message"),
        userId: "loy-system",
        userName: "Loy",
        type: "system",
        text:
          "Não foi possível consultar a IA neste momento.",
        createdAt: new Date().toISOString()
      };

      setGroups((previous) =>
        previous.map((item) =>
          item.id === selectedGroup
            ? {
                ...item,
                chatHistory: [
                  ...(item.chatHistory || []),
                  errorMessage
                ]
              }
            : item
        )
      );
    }
  }

  /* =======================================================
     HISTÓRICO
  ======================================================= */

  function openHistoryChat(chat) {
    setMode(chat.mode);
    setQuestion(chat.question);
    setAnswer(chat.answer);
    setHistoryOpen(false);

    setTimeout(() => {
      document
        .getElementById("resultado")
        ?.scrollIntoView({
          behavior: "smooth"
        });
    }, 100);
  }

  function clearHistory() {
    const confirmed = window.confirm(
      "Deseja apagar todo o histórico de pesquisas?"
    );

    if (!confirmed) {
      return;
    }

    setHistory([]);
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="app">

      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="topbar">

        <div
          className="brand"
          onClick={goHome}
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

          <button onClick={goHome}>
            Pesquisar
          </button>

          <button
            onClick={() =>
              setHistoryOpen(true)
            }
          >
            Histórico
          </button>

          <button
            onClick={() =>
              setArticlesOpen(true)
            }
          >
            Artigos
          </button>

          <button
            onClick={() =>
              setGroupsOpen(true)
            }
          >
            Meus grupos
          </button>

          <button
            className="profile-nav"
            onClick={openProfile}
          >
            <span className="nav-avatar">
              {userInitial}
            </span>
            Perfil
          </button>

        </nav>

      </header>

      {/* ===================================================
          CONTEÚDO
      =================================================== */}

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
            Pesquise, organize seus estudos,
            encontre fontes jurídicas e desenvolva
            seus trabalhos com inteligência artificial.
          </p>

          {/* PERFIL RESUMIDO */}

          <div className="profile-mini">

            <div className="profile-mini-avatar">
              {userInitial}
            </div>

            <div>
              <strong>
                Olá, {profile.name}
              </strong>

              <span>
                {profile.type}
              </span>
            </div>

            <button onClick={openProfile}>
              Editar perfil
            </button>

          </div>

          {/* BUSCA */}

          <div className="searchbox">

            <div className="search-context">
              <span>
                {currentMode.icon}
              </span>

              <div>
                <strong>
                  {currentMode.name}
                </strong>

                <small>
                  {currentMode.description}
                </small>
              </div>
            </div>

            <textarea
              value={question}
              onChange={(event) =>
                setQuestion(event.target.value)
              }
              onKeyDown={handleSearchKeyDown}
              placeholder="Digite sua dúvida, tema, lei ou caso..."
            />

            <div className="search-footer">

              <span>
                Enter para pesquisar · Shift + Enter
                para nova linha
              </span>

              <button
                className="searchbtn"
                onClick={() => search()}
                disabled={
                  loading ||
                  !question.trim()
                }
              >
                {loading
                  ? "Consultando..."
                  : "Pesquisar →"}
              </button>

            </div>

          </div>

          {/* ABAS */}

          <div className="tabs">

            {modes.map((item) => (
              <button
                key={item.id}
                className={
                  mode === item.id
                    ? "tab active"
                    : "tab"
                }
                onClick={() => {
                  setMode(item.id);
                  setAnswer("");
                }}
              >
                <span>
                  {item.icon}
                </span>

                {item.name}
              </button>
            ))}

          </div>

          {/* SUGESTÕES */}

          <div className="chips">

            {currentExamples.map(
              (example) => (
                <button
                  key={example}
                  onClick={() =>
                    search(example)
                  }
                >
                  {example}
                </button>
              )
            )}

          </div>

        </section>

        {/* =================================================
            RESULTADO
        ================================================= */}

        {answer && (

          <section
            className="answer-card"
            id="resultado"
          >

            <div className="answer-head">

              <div>
                <span>
                  Resultado da pesquisa
                </span>

                <small>
                  {currentMode.name}
                </small>
              </div>

              <button
                onClick={copyAnswer}
              >
                Copiar
              </button>

            </div>

            <div className="question-preview">
              <strong>
                Sua pergunta
              </strong>

              <p>
                {question}
              </p>
            </div>

            <div className="answer-body">
              {answer}
            </div>

            <small className="disclaimer">
              Conteúdo gerado por inteligência
              artificial. Confira as informações
              nas fontes oficiais antes de utilizá-las
              em trabalhos acadêmicos ou decisões
              profissionais.
            </small>

          </section>

        )}

        {/* =================================================
            FUNCIONALIDADES
        ================================================= */}

        <section className="features">

          <div className="feature">
            <b>01</b>

            <h3>
              Pesquise
            </h3>

            <p>
              Consulte temas jurídicos utilizando
              inteligência artificial e organize suas
              pesquisas.
            </p>
          </div>

          <div className="feature">
            <b>02</b>

            <h3>
              Organize
            </h3>

            <p>
              Seu histórico fica salvo para que você
              possa retomar suas pesquisas quando quiser.
            </p>
          </div>

          <div className="feature">
            <b>03</b>

            <h3>
              Colabore
            </h3>

            <p>
              Crie grupos de estudo e utilize o chat
              compartilhado para trabalhos acadêmicos.
            </p>
          </div>

        </section>

        {/* =================================================
            GRUPOS
        ================================================= */}

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
              colaborativos com um chat compartilhado.
            </p>

          </div>

          <button
            onClick={() =>
              setGroupsOpen(true)
            }
          >
            Criar grupo →
          </button>

        </section>

      </main>

      {/* ===================================================
          FOOTER
      =================================================== */}

      <footer>

        <strong>Loy</strong>

        {" · "}

        O futuro do direito começa aqui.

        <span>
          Para estudo e pesquisa acadêmica.
        </span>

        <button
          className="footer-about"
          onClick={() =>
            setAboutOpen(true)
          }
        >
          Sobre o Loy
        </button>

      </footer>

      {/* ===================================================
          MODAL PERFIL
      =================================================== */}

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

            <div className="profile-modal-header">

              <div className="avatar">
                {userInitial}
              </div>

              <div>
                <div className="eyebrow">
                  CONTA LOY
                </div>

                <h2>
                  Meu perfil
                </h2>
              </div>

            </div>

            <div className="unique-id">
              <span>ID único do usuário</span>

              <strong>
                {profile.id}
              </strong>
            </div>

            <label>
              Nome
            </label>

            <input
              value={profileDraft.name}
              onChange={(event) =>
                setProfileDraft({
                  ...profileDraft,
                  name: event.target.value
                })
              }
              placeholder="Seu nome"
            />

            <label>
              Você é
            </label>

            <select
              value={profileDraft.type}
              onChange={(event) =>
                setProfileDraft({
                  ...profileDraft,
                  type: event.target.value
                })
              }
            >

              {profileTypes.map(
                (type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                )
              )}

            </select>

            <label>
              Instituição
            </label>

            <input
              value={
                profileDraft.institution
              }
              onChange={(event) =>
                setProfileDraft({
                  ...profileDraft,
                  institution:
                    event.target.value
                })
              }
              placeholder="Ex.: Universidade Presbiteriana Mackenzie"
            />

            <label>
              Curso
            </label>

            <input
              value={profileDraft.course}
              onChange={(event) =>
                setProfileDraft({
                  ...profileDraft,
                  course:
                    event.target.value
                })
              }
              placeholder="Ex.: Direito"
            />

            <button
              className="primary full"
              onClick={saveProfile}
            >
              Salvar perfil
            </button>

          </div>

        </div>

      )}

      {/* ===================================================
          MODAL HISTÓRICO
      =================================================== */}

      {historyOpen && (

        <div
          className="modal-bg"
          onClick={() =>
            setHistoryOpen(false)
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
                setHistoryOpen(false)
              }
            >
              ×
            </button>

            <div className="eyebrow">
              SUAS PESQUISAS
            </div>

            <div className="modal-title-row">

              <h2>
                Histórico de chat
              </h2>

              {history.length > 0 && (
                <button
                  className="danger-button"
                  onClick={clearHistory}
                >
                  Limpar histórico
                </button>
              )}

            </div>

            {history.length === 0 ? (

              <div className="empty-state">
                <div>
                  💬
                </div>

                <h3>
                  Nenhuma pesquisa ainda
                </h3>

                <p>
                  Suas conversas com a Loy aparecerão
                  aqui automaticamente.
                </p>
              </div>

            ) : (

              <div className="history-list">

                {history.map(
                  (chat) => (

                    <button
                      className="history-card"
                      key={chat.id}
                      onClick={() =>
                        openHistoryChat(chat)
                      }
                    >

                      <div className="history-card-top">

                        <span className="history-mode">
                          {chat.modeName}
                        </span>

                        <small>
                          {formatDate(
                            chat.createdAt
                          )}
                        </small>

                      </div>

                      <strong>
                        {chat.question}
                      </strong>

                      <p>
                        {chat.answer
                          .replace(/\n/g, " ")
                          .substring(0, 180)}
                        {chat.answer.length > 180
                          ? "..."
                          : ""}
                      </p>

                    </button>

                  )
                )}

              </div>

            )}

          </div>

        </div>

      )}

      {/* ===================================================
          MODAL ARTIGOS
      =================================================== */}

      {articlesOpen && (

        <div
          className="modal-bg"
          onClick={() =>
            setArticlesOpen(false)
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
                setArticlesOpen(false)
              }
            >
              ×
            </button>

            <div className="eyebrow">
              FONTES JURÍDICAS
            </div>

            <h2>
              Artigos e fontes
            </h2>

            <p className="muted intro">
              Encontre fontes jurídicas e acadêmicas
              para complementar suas pesquisas.
            </p>

            <div className="articles-list">

              {articles.map(
                (article) => (

                  <article
                    className="article-card"
                    key={article.id}
                  >

                    <div className="article-icon">
                      📚
                    </div>

                    <div className="article-content">

                      <div className="article-category">
                        {article.category}
                      </div>

                      <h3>
                        {article.title}
                      </h3>

                      <p>
                        {article.description}
                      </p>

                      <div className="article-source">
                        Fonte:{" "}
                        <strong>
                          {article.source}
                        </strong>
                      </div>

                      <a
                        href={article.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Acessar fonte →
                      </a>

                    </div>

                  </article>

                )
              )}

            </div>

          </div>

        </div>

      )}

      {/* ===================================================
          MODAL GRUPOS
      =================================================== */}

      {groupsOpen && (

        <div
          className="modal-bg"
          onClick={() =>
            setGroupsOpen(false)
          }
        >

          <div
            className="modal extra-wide"
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

            {!selectedGroup ? (

              <>

                <div className="eyebrow">
                  ESPAÇOS DE TRABALHO
                </div>

                <h2>
                  Meus grupos
                </h2>

                <p className="muted">
                  Cada grupo possui um ID único e
                  seu próprio histórico de chat.
                </p>

                <div className="create-group">

                  <input
                    value={newGroup}
                    onChange={(event) =>
                      setNewGroup(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter"
                      ) {
                        createGroup();
                      }
                    }}
                    placeholder="Nome do grupo"
                  />

                  <button
                    className="primary"
                    onClick={createGroup}
                  >
                    Criar grupo
                  </button>

                </div>

                {groups.length === 0 ? (

                  <div className="empty-state small">

                    <div>
                      👥
                    </div>

                    <h3>
                      Você ainda não possui grupos
                    </h3>

                    <p>
                      Crie um grupo para começar
                      um espaço colaborativo.
                    </p>

                  </div>

                ) : (

                  <div className="groups-list">

                    {groups.map(
                      (group) => (

                        <div
                          className="group-item"
                          key={group.id}
                        >

                          <div className="group-info">

                            <div className="group-avatar">
                              {group.name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>

                              <strong>
                                {group.name}
                              </strong>

                              <small>
                                ID: {group.id}
                              </small>

                              <small>
                                Código:{" "}
                                {group.code}
                              </small>

                              <small>
                                {
                                  group.members
                                    ?.length || 1
                                }{" "}
                                integrante(s)
                              </small>

                            </div>

                          </div>

                          <div className="group-actions">

                            <button
                              onClick={() =>
                                enterGroup(
                                  group.id
                                )
                              }
                            >
                              Chat compartilhado →
                            </button>

                            <button
                              className="delete-button"
                              onClick={() =>
                                deleteGroup(
                                  group.id
                                )
                              }
                            >
                              Excluir
                            </button>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                )}

              </>

            ) : (

              /* ===========================================
                 CHAT DO GRUPO
              =========================================== */

              (() => {

                const group =
                  groups.find(
                    (item) =>
                      item.id === selectedGroup
                  );

                if (!group) {
                  return null;
                }

                return (

                  <div className="group-chat">

                    <div className="group-chat-header">

                      <button
                        className="back-button"
                        onClick={leaveGroup}
                      >
                        ← Grupos
                      </button>

                      <div>

                        <div className="eyebrow">
                          CHAT COMPARTILHADO
                        </div>

                        <h2>
                          {group.name}
                        </h2>

                        <span>
                          Código do grupo:{" "}
                          <strong>
                            {group.code}
                          </strong>
                        </span>

                      </div>

                    </div>

                    <div className="group-chat-notice">
                      💬 Este é o espaço de conversa
                      compartilhada do grupo.
                    </div>

                    <div className="group-messages">

                      {!group.chatHistory ||
                      group.chatHistory.length ===
                        0 ? (

                        <div className="empty-state small">

                          <div>
                            💬
                          </div>

                          <h3>
                            O chat está vazio
                          </h3>

                          <p>
                            Envie a primeira mensagem
                            para iniciar a pesquisa
                            colaborativa.
                          </p>

                        </div>

                      ) : (

                        group.chatHistory.map(
                          (message) => (

                            <div
                              className={
                                `group-message ${
                                  message.type
                                }`
                              }
                              key={message.id}
                            >

                              <div className="message-author">
                                {message.userName}
                              </div>

                              <div className="message-text">
                                {message.text}
                              </div>

                              <small>
                                {formatDate(
                                  message.createdAt
                                )}
                              </small>

                            </div>

                          )
                        )

                      )}

                    </div>

                    <div className="group-composer">

                      <textarea
                        value={groupMessage}
                        onChange={(event) =>
                          setGroupMessage(
                            event.target.value
                          )
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" &&
                            !event.shiftKey
                          ) {
                            event.preventDefault();
                            sendGroupMessage();
                          }
                        }}
                        placeholder="Escreva uma mensagem para o grupo..."
                      />

                      <button
                        className="primary"
                        onClick={
                          sendGroupMessage
                        }
                        disabled={
                          !groupMessage.trim()
                        }
                      >
                        Enviar →
                      </button>

                    </div>

                  </div>

                );
              })()

            )}

          </div>

        </div>

      )}

      {/* ===================================================
          MODAL SOBRE
      =================================================== */}

      {aboutOpen && (

        <div
          className="modal-bg"
          onClick={() =>
            setAboutOpen(false)
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
                setAboutOpen(false)
              }
            >
              ×
            </button>

            <div className="avatar">
              L
            </div>

            <h2>
              Sobre o Loy
            </h2>

            <p className="about-text">
              O Loy é uma plataforma de pesquisa
              jurídica com inteligência artificial
              criada para auxiliar estudos, pesquisas
              acadêmicas e trabalhos na área do Direito.
            </p>

            <div className="about-warning">
              <strong>
                Atenção
              </strong>

              <p>
                As respostas são geradas por
                inteligência artificial e devem ser
                verificadas nas fontes oficiais.
                O Loy não substitui orientação jurídica
                profissional.
              </p>
            </div>

            <button
              className="primary full"
              onClick={() =>
                setAboutOpen(false)
              }
            >
              Entendi
            </button>

          </div>

        </div>

      )}

    </div>
  );
}

/* =========================================================
   RENDER
========================================================= */

createRoot(
  document.getElementById("root")
).render(
  <App />
);
