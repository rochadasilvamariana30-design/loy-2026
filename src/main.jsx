```jsx
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

/* =========================================================
   MODOS DE PESQUISA
========================================================= */

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

/* =========================================================
   PERFIL
========================================================= */

const profileTypes = [
  "Estudante de Direito",
  "Pesquisador(a)",
  "Advogado(a)",
  "Profissional do Direito",
  "Professor(a)",
  "Outro"
];

/* =========================================================
   ÁREAS JURÍDICAS
========================================================= */

const legalAreas = [
  "Todas as áreas",
  "Direito Constitucional",
  "Direito Civil",
  "Direito Penal",
  "Direito Processual",
  "Direito do Trabalho",
  "Direito Empresarial",
  "Direito Tributário",
  "Direito Administrativo",
  "Direito Digital",
  "Direito do Consumidor",
  "Direito Internacional",
  "Direito Previdenciário"
];

/* =========================================================
   EXEMPLOS
========================================================= */

const examples = [
  "O que é responsabilidade civil objetiva?",
  "Explique a diferença entre dolo e culpa.",
  "Como funciona a LGPD?"
];

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function createId(prefix) {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}`;
}

function loadJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);

    if (!value) {
      return fallback;
    }

    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/* =========================================================
   APP
========================================================= */

function App() {
  /* =======================================================
     NAVEGAÇÃO
  ======================================================= */

  const [activePage, setActivePage] = useState("pesquisa");

  /* =======================================================
     PESQUISA
  ======================================================= */

  const [mode, setMode] = useState("juridica");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  /* =======================================================
     MODAIS
  ======================================================= */

  const [profileOpen, setProfileOpen] = useState(false);
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  /* =======================================================
     PERFIL
  ======================================================= */

  const [profile, setProfile] = useState(() =>
    loadJSON("loy-profile", {
      userId: createId("user"),
      name: "Estudante",
      username: "",
      email: "",
      type: "Estudante de Direito",
      area: "",
      bio: ""
    })
  );

  const [profileForm, setProfileForm] = useState(profile);

  /* =======================================================
     GRUPOS
  ======================================================= */

  const [groups, setGroups] = useState(() =>
    loadJSON("loy-groups", [])
  );

  const [newGroup, setNewGroup] = useState("");

  /* =======================================================
     CHAT COMPARTILHADO
  ======================================================= */

  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [groupMessage, setGroupMessage] = useState("");

  /* =======================================================
     HISTÓRICO
  ======================================================= */

  const [history, setHistory] = useState(() =>
    loadJSON("loy-history", [])
  );

  /* =======================================================
     ARTIGOS
  ======================================================= */

  const [articleSearch, setArticleSearch] = useState("");
  const [articleArea, setArticleArea] = useState("Todas as áreas");

  /*
     Estrutura preparada para artigos reais.

     Não colocamos artigos inventados aqui.
     Quando conectarmos uma fonte/API real, os resultados
     poderão ser inseridos nesta estrutura.
  */
  const [articles, setArticles] = useState(() =>
    loadJSON("loy-articles", [])
  );

  /* =======================================================
     PERSISTÊNCIA
  ======================================================= */

  useEffect(() => {
    localStorage.setItem(
      "loy-profile",
      JSON.stringify(profile)
    );
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(
      "loy-groups",
      JSON.stringify(groups)
    );
  }, [groups]);

  useEffect(() => {
    localStorage.setItem(
      "loy-history",
      JSON.stringify(history)
    );
  }, [history]);

  useEffect(() => {
    localStorage.setItem(
      "loy-articles",
      JSON.stringify(articles)
    );
  }, [articles]);

  /* =======================================================
     PERFIL
  ======================================================= */

  function openProfile() {
    setProfileForm(profile);
    setProfileOpen(true);
  }

  function updateProfileField(field, value) {
    setProfileForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function saveProfile() {
    const updatedProfile = {
      ...profileForm,

      userId: profile.userId,

      name:
        profileForm.name.trim() ||
        "Estudante",

      username:
        profileForm.username.trim(),

      email:
        profileForm.email.trim(),

      type:
        profileForm.type ||
        "Estudante de Direito",

      area:
        profileForm.area.trim(),

      bio:
        profileForm.bio.trim()
    };

    setProfile(updatedProfile);
    setProfileForm(updatedProfile);
    setProfileOpen(false);
  }

  function getInitial() {
    const name = profile.name?.trim();

    if (!name) {
      return "L";
    }

    return name.charAt(0).toUpperCase();
  }

  /* =======================================================
     NAVEGAR PARA UMA PÁGINA
  ======================================================= */

  function navigate(page) {
    setActivePage(page);

    setProfileOpen(false);
    setGroupsOpen(false);
    setHistoryOpen(false);

    window.setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }, 50);
  }

  /* =======================================================
     PESQUISA GEMINI
  ======================================================= */

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
          data.error ||
            "Erro ao consultar a IA."
        );
      }

      const generatedAnswer =
        data.answer ||
        "A IA não retornou uma resposta.";

      setAnswer(generatedAnswer);

      /* ================================================
         HISTÓRICO PESSOAL
      ================================================ */

      const historyItem = {
        id: createId("chat"),
        userId: profile.userId,
        question: query,
        answer: generatedAnswer,
        mode,
        createdAt:
          new Date().toISOString()
      };

      setHistory((current) => [
        historyItem,
        ...current
      ]);
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

  /* =======================================================
     NOVA PESQUISA
  ======================================================= */

  function newSearch() {
    setQuestion("");
    setAnswer("");
    navigate("pesquisa");
  }

  /* =======================================================
     HISTÓRICO
  ======================================================= */

  function openHistoryItem(item) {
    setQuestion(item.question);
    setAnswer(item.answer);
    setMode(item.mode || "juridica");

    setHistoryOpen(false);
    navigate("pesquisa");
  }

  function deleteHistoryItem(id) {
    setHistory((current) =>
      current.filter(
        (item) => item.id !== id
      )
    );
  }

  function clearHistory() {
    if (history.length === 0) {
      return;
    }

    const confirmed =
      window.confirm(
        "Deseja realmente apagar todo o histórico?"
      );

    if (!confirmed) {
      return;
    }

    setHistory([]);
    setAnswer("");
  }

  /* =======================================================
     GRUPOS
  ======================================================= */

  function createGroup() {
    const groupName =
      newGroup.trim();

    if (!groupName) {
      return;
    }

    const group = {
      groupId: createId("group"),
      userId: profile.userId,
      name: groupName,
      members: [
        {
          userId: profile.userId,
          name: profile.name,
          username: profile.username
        }
      ],
      messages: [],
      history: [],
      createdAt:
        new Date().toISOString()
    };

    setGroups((current) => [
      group,
      ...current
    ]);

    setNewGroup("");
    setSelectedGroupId(group.groupId);
  }

  function deleteGroup(groupId) {
    const confirmed =
      window.confirm(
        "Deseja realmente excluir este grupo?"
      );

    if (!confirmed) {
      return;
    }

    setGroups((current) =>
      current.filter(
        (group) =>
          group.groupId !== groupId
      )
    );

    if (selectedGroupId === groupId) {
      setSelectedGroupId(null);
    }
  }

  /* =======================================================
     CHAT COMPARTILHADO
  ======================================================= */

  function sendGroupMessage() {
    const message =
      groupMessage.trim();

    if (!message || !selectedGroupId) {
      return;
    }

    const newMessage = {
      messageId: createId("message"),
      userId: profile.userId,
      userName: profile.name,
      username: profile.username,
      text: message,
      createdAt:
        new Date().toISOString()
    };

    setGroups((current) =>
      current.map((group) => {
        if (
          group.groupId !==
          selectedGroupId
        ) {
          return group;
        }

        return {
          ...group,
          messages: [
            ...(group.messages || []),
            newMessage
          ]
        };
      })
    );

    setGroupMessage("");
  }

  function saveCurrentSearchToGroup(groupId) {
    if (
      !question.trim() ||
      !answer.trim()
    ) {
      return;
    }

    const item = {
      historyId:
        createId("group_history"),

      userId:
        profile.userId,

      userName:
        profile.name,

      question,

      answer,

      mode,

      createdAt:
        new Date().toISOString()
    };

    setGroups((current) =>
      current.map((group) => {
        if (
          group.groupId !== groupId
        ) {
          return group;
        }

        return {
          ...group,
          history: [
            ...(group.history || []),
            item
          ]
        };
      })
    );
  }

  function openGroup(groupId) {
    setSelectedGroupId(groupId);
  }

  const selectedGroup = groups.find(
    (group) =>
      group.groupId ===
      selectedGroupId
  );

  /* =======================================================
     ARTIGOS
  ======================================================= */

  const filteredArticles =
    useMemo(() => {
      return articles.filter(
        (article) => {
          const matchesSearch =
            !articleSearch.trim() ||
            `${article.title} ${article.author} ${article.summary}`
              .toLowerCase()
              .includes(
                articleSearch
                  .toLowerCase()
                  .trim()
              );

          const matchesArea =
            articleArea ===
              "Todas as áreas" ||
            article.area ===
              articleArea;

          return (
            matchesSearch &&
            matchesArea
          );
        }
      );
    }, [
      articles,
      articleSearch,
      articleArea
    ]);

  /* =======================================================
     DATA
  ======================================================= */

  function formatDate(dateString) {
    if (!dateString) {
      return "";
    }

    try {
      return new Date(
        dateString
      ).toLocaleString(
        "pt-BR",
        {
          dateStyle: "short",
          timeStyle: "short"
        }
      );
    } catch {
      return "";
    }
  }

  /* =======================================================
     HEADER
  ======================================================= */

  return (
    <div className="app">

      <header className="topbar">

        <div
          className="brand"
          onClick={newSearch}
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
            className={
              activePage === "pesquisa"
                ? "nav-active"
                : ""
            }
            onClick={() =>
              navigate("pesquisa")
            }
          >
            Pesquisar
          </button>

          <button
            className={
              activePage === "artigos"
                ? "nav-active"
                : ""
            }
            onClick={() =>
              navigate("artigos")
            }
          >
            Artigos
          </button>

          <button
            className={
              activePage === "grupos"
                ? "nav-active"
                : ""
            }
            onClick={() =>
              navigate("grupos")
            }
          >
            Grupos
          </button>

          <button
            className={
              activePage === "historico"
                ? "nav-active"
                : ""
            }
            onClick={() =>
              navigate("historico")
            }
          >
            Histórico
          </button>

          <button
            className="profile-nav"
            onClick={openProfile}
          >
            <span className="nav-avatar">
              {getInitial()}
            </span>

            Perfil
          </button>

        </nav>

      </header>

      {/* ===================================================
          PÁGINA DE PESQUISA
      =================================================== */}

      {activePage === "pesquisa" && (

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
              desenvolva trabalhos com
              inteligência artificial.
            </p>

            <div className="searchbox">

              <textarea
                value={question}
                onChange={(event) =>
                  setQuestion(
                    event.target.value
                  )
                }
                placeholder="Digite sua dúvida, tema, lei ou caso..."
              />

              <button
                className="searchbtn"
                onClick={() =>
                  search()
                }
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

              {examples.map(
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

          {answer && (

            <section className="answer-card">

              <div className="answer-head">

                <span>
                  Resultado da pesquisa
                </span>

                <div className="answer-actions">

                  <button
                    onClick={() =>
                      navigator.clipboard?.writeText(
                        answer
                      )
                    }
                  >
                    Copiar
                  </button>

                  {groups.length > 0 && (

                    <button
                      onClick={() =>
                        navigate("grupos")
                      }
                    >
                      Salvar no grupo
                    </button>

                  )}

                </div>

              </div>

              <div className="answer-body">
                {answer}
              </div>

              <small>
                O conteúdo gerado por IA deve
                ser conferido nas fontes oficiais.
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
                Centralize pesquisas, conversas
                e materiais importantes.
              </p>
            </div>

            <div className="feature">
              <b>03</b>

              <h3>
                Colabore
              </h3>

              <p>
                Crie grupos e trabalhe em
                conjunto através do chat compartilhado.
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
              onClick={() =>
                navigate("grupos")
              }
            >
              Criar grupo →
            </button>

          </section>

        </main>
      )}

      {/* ===================================================
          PÁGINA DE ARTIGOS
      =================================================== */}

      {activePage === "artigos" && (

        <main className="page-container">

          <section className="page-hero">

            <div className="eyebrow">
              PESQUISA ACADÊMICA
            </div>

            <h1>
              Artigos <em>jurídicos.</em>
            </h1>

            <p>
              Encontre pesquisas e produções
              acadêmicas com suas respectivas fontes.
            </p>

          </section>

          <section className="article-search-panel">

            <input
              value={articleSearch}
              onChange={(event) =>
                setArticleSearch(
                  event.target.value
                )
              }
              placeholder="Pesquisar por título, autor ou tema..."
            />

            <select
              value={articleArea}
              onChange={(event) =>
                setArticleArea(
                  event.target.value
                )
              }
            >

              {legalAreas.map(
                (area) => (
                  <option
                    key={area}
                    value={area}
                  >
                    {area}
                  </option>
                )
              )}

            </select>

          </section>

          {filteredArticles.length === 0 ? (

            <section className="empty-articles">

              <div className="article-empty-icon">
                📄
              </div>

              <h2>
                Nenhum artigo encontrado
              </h2>

              <p>
                Os artigos aparecerão aqui quando
                uma fonte acadêmica for conectada
                ao Loy.
              </p>

              <small>
                O Loy não cria fontes fictícias.
                Cada artigo deverá possuir sua
                referência original.
              </small>

            </section>

          ) : (

            <section className="articles-grid">

              {filteredArticles.map(
                (article) => (

                  <article
                    className="article-card"
                    key={article.articleId}
                  >

                    <div className="article-area">
                      {article.area}
                    </div>

                    <h2>
                      {article.title}
                    </h2>

                    <p className="article-author">
                      {article.author}
                    </p>

                    <p>
                      {article.summary}
                    </p>

                    <div className="article-source">

                      <span>
                        Fonte
                      </span>

                      <strong>
                        {article.source}
                      </strong>

                    </div>

                    <a
                      href={article.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ler artigo →
                    </a>

                  </article>

                )
              )}

            </section>
          )}

        </main>
      )}

      {/* ===================================================
          PÁGINA DE GRUPOS
      =================================================== */}

      {activePage === "grupos" && (

        <main className="page-container">

          <section className="page-hero">

            <div className="eyebrow">
              COLABORAÇÃO
            </div>

            <h1>
              Meus <em>grupos.</em>
            </h1>

            <p>
              Crie espaços de trabalho com
              chat compartilhado e histórico.
            </p>

          </section>

          <section className="group-create-panel">

            <input
              value={newGroup}
              onChange={(event) =>
                setNewGroup(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  createGroup();
                }
              }}
              placeholder="Nome do novo grupo"
            />

            <button
              className="primary"
              onClick={createGroup}
            >
              Criar grupo
            </button>

          </section>

          {groups.length === 0 ? (

            <section className="empty-state large">

              <div className="empty-icon">
                👥
              </div>

              <strong>
                Você ainda não possui grupos.
              </strong>

              <p>
                Crie um grupo para começar
                uma conversa compartilhada.
              </p>

            </section>

          ) : (

            <section className="groups-layout">

              <div className="group-list">

                {groups.map(
                  (group) => (

                    <div
                      className={
                        selectedGroupId ===
                        group.groupId
                          ? "group-card selected"
                          : "group-card"
                      }
                      key={group.groupId}
                      onClick={() =>
                        openGroup(
                          group.groupId
                        )
                      }
                    >

                      <div className="group-avatar">
                        {group.name
                          ?.charAt(0)
                          ?.toUpperCase() ||
                          "G"}
                      </div>

                      <div className="group-info">

                        <strong>
                          {group.name}
                        </strong>

                        <small>
                          {group.members?.length ||
                            1}{" "}
                          integrante(s)
                        </small>

                        <small>
                          {group.messages?.length ||
                            0} mensagem(ns)
                        </small>

                        <small>
                          {group.history?.length ||
                            0} pesquisa(s)
                        </small>

                      </div>

                      <button
                        className="delete-group"
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteGroup(
                            group.groupId
                          );
                        }}
                      >
                        ×
                      </button>

                    </div>

                  )
                )}

              </div>

              {selectedGroup ? (

                <section className="shared-chat">

                  <div className="chat-header">

                    <div>

                      <div className="eyebrow">
                        CHAT COMPARTILHADO
                      </div>

                      <h2>
                        {selectedGroup.name}
                      </h2>

                    </div>

                    <span>
                      {selectedGroup.members?.length ||
                        1}{" "}
                      integrante(s)
                    </span>

                  </div>

                  <div className="group-id">
                    ID do grupo:
                    {" "}
                    {selectedGroup.groupId}
                  </div>

                  <div className="chat-messages">

                    {(selectedGroup.messages ||
                      []).length === 0 ? (

                      <div className="chat-empty">

                        <div>
                          💬
                        </div>

                        <strong>
                          Comece a conversa
                        </strong>

                        <p>
                          As mensagens enviadas
                          aqui ficam salvas no
                          histórico compartilhado
                          deste grupo.
                        </p>

                      </div>

                    ) : (

                      selectedGroup.messages.map(
                        (message) => (

                          <div
                            className={
                              message.userId ===
                              profile.userId
                                ? "chat-message own"
                                : "chat-message"
                            }
                            key={
                              message.messageId
                            }
                          >

                            <div className="message-user">
                              {message.userName}
                              {message.userId ===
                                profile.userId &&
                                " · você"}
                            </div>

                            <div className="message-bubble">
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

                  <div className="chat-input">

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
                      placeholder="Escreva uma mensagem no grupo..."
                    />

                    <button
                      className="primary"
                      onClick={
                        sendGroupMessage
                      }
                    >
                      Enviar
                    </button>

                  </div>

                  {answer && (

                    <div className="group-save-search">

                      <strong>
                        Salvar a pesquisa atual
                        neste grupo
                      </strong>

                      <button
                        onClick={() =>
                          saveCurrentSearchToGroup(
                            selectedGroup.groupId
                          )
                        }
                      >
                        + Salvar pesquisa
                      </button>

                    </div>

                  )}

                  <div className="group-history">

                    <div className="section-title">

                      <h3>
                        Histórico do grupo
                      </h3>

                    </div>

                    {(
                      selectedGroup.history ||
                      []
                    ).length === 0 ? (

                      <p className="muted">
                        Nenhuma pesquisa salva
                        neste grupo.
                      </p>

                    ) : (

                      selectedGroup.history.map(
                        (item) => (

                          <button
                            className="group-history-item"
                            key={
                              item.historyId
                            }
                            onClick={() =>
                              openHistoryItem(
                                item
                              )
                            }
                          >

                            <strong>
                              {item.question}
                            </strong>

                            <small>
                              Por{" "}
                              {item.userName}
                              {" · "}
                              {formatDate(
                                item.createdAt
                              )}
                            </small>

                          </button>

                        )
                      )

                    )}

                  </div>

                </section>

              ) : (

                <section className="group-placeholder">

                  <div>
                    👥
                  </div>

                  <h2>
                    Selecione um grupo
                  </h2>

                  <p>
                    Escolha um grupo para abrir
                    o chat compartilhado.
                  </p>

                </section>

              )}

            </section>

          )}

        </main>
      )}

      {/* ===================================================
          PÁGINA HISTÓRICO
      =================================================== */}

      {activePage === "historico" && (

        <main className="page-container">

          <section className="page-hero">

            <div className="eyebrow">
              SUAS PESQUISAS
            </div>

            <h1>
              Meu <em>histórico.</em>
            </h1>

            <p>
              Todas as pesquisas feitas pelo
              seu perfil ficam organizadas aqui.
            </p>

          </section>

          <section className="history-page">

            <div className="history-page-header">

              <div>
                <strong>
                  {history.length}
                </strong>

                <span>
                  pesquisa(s) salva(s)
                </span>
              </div>

              {history.length > 0 && (

                <button
                  className="danger-button"
                  onClick={
                    clearHistory
                  }
                >
                  Limpar histórico
                </button>

              )}

            </div>

            {history.length === 0 ? (

              <div className="empty-state large">

                <div className="empty-icon">
                  ◌
                </div>

                <strong>
                  Nenhuma pesquisa ainda
                </strong>

                <p>
                  Faça uma pesquisa e ela será
                  salva automaticamente aqui.
                </p>

              </div>

            ) : (

              <div className="history-page-list">

                {history.map(
                  (item) => (

                    <div
                      className="history-page-item"
                      key={item.id}
                    >

                      <button
                        className="history-open"
                        onClick={() =>
                          openHistoryItem(
                            item
                          )
                        }
                      >

                        <div className="history-mode">
                          {item.mode ===
                          "juridica"
                            ? "⚖ Jurídica"
                            : item.mode ===
                              "academica"
                              ? "▤ Acadêmica"
                              : "✦ Outros"}
                        </div>

                        <strong>
                          {item.question}
                        </strong>

                        <small>
                          {formatDate(
                            item.createdAt
                          )}
                        </small>

                      </button>

                      <button
                        className="delete-small"
                        onClick={() =>
                          deleteHistoryItem(
                            item.id
                          )
                        }
                      >
                        ×
                      </button>

                    </div>

                  )
                )}

              </div>

            )}

          </section>

        </main>
      )}

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
            className="modal profile-modal"
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

            <div className="profile-header">

              <div className="avatar large">
                {profileForm.name
                  ?.charAt(0)
                  ?.toUpperCase() ||
                  "L"}
              </div>

              <div>

                <div className="eyebrow">
                  PERFIL DO USUÁRIO
                </div>

                <h2>
                  Meu perfil
                </h2>

              </div>

            </div>

            <div className="user-id-box">

              <span>
                ID único do usuário
              </span>

              <strong>
                {profile.userId}
              </strong>

            </div>

            <label>
              Nome
            </label>

            <input
              value={profileForm.name}
              onChange={(event) =>
                updateProfileField(
                  "name",
                  event.target.value
                )
              }
              placeholder="Seu nome"
            />

            <label>
              Nome de usuário
            </label>

            <input
              value={profileForm.username}
              onChange={(event) =>
                updateProfileField(
                  "username",
                  event.target.value
                )
              }
              placeholder="@seuusuario"
            />

            <label>
              E-mail
            </label>

            <input
              type="email"
              value={profileForm.email}
              onChange={(event) =>
                updateProfileField(
                  "email",
                  event.target.value
                )
              }
              placeholder="seuemail@email.com"
            />

            <label>
              Você é:
            </label>

            <select
              value={profileForm.type}
              onChange={(event) =>
                updateProfileField(
                  "type",
                  event.target.value
                )
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
              Área de interesse
            </label>

            <select
              value={
                profileForm.area ||
                ""
              }
              onChange={(event) =>
                updateProfileField(
                  "area",
                  event.target.value
                )
              }
            >

              <option value="">
                Selecione uma área
              </option>

              {legalAreas
                .filter(
                  (area) =>
                    area !==
                    "Todas as áreas"
                )
                .map(
                  (area) => (

                    <option
                      key={area}
                      value={area}
                    >
                      {area}
                    </option>

                  )
                )}

            </select>

            <label>
              Bio
            </label>

            <textarea
              className="profile-bio"
              value={profileForm.bio}
              onChange={(event) =>
                updateProfileField(
                  "bio",
                  event.target.value
                )
              }
              placeholder="Conte um pouco sobre você..."
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
          FOOTER
      =================================================== */}

      <footer>

        <strong>
          Loy
        </strong>

        {" · "}

        O futuro do direito começa aqui.

        <span>
          Para estudo e pesquisa acadêmica.
        </span>

      </footer>

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
```
