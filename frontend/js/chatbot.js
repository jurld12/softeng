/**
 * Healio patient dashboard chatbot
 */

(function () {
  const CHAT_STORAGE_KEY = "healio_chatbot_session_v1";
  const STARTER_QUESTIONS = [
    "What do my latest vitals mean?",
    "Help me understand my medications",
    "What should I ask at my next appointment?",
    "How can I improve my daily health routine?",
  ];

  const DEFAULT_CONTEXT = [
    "vitals",
    "medications",
    "appointments",
    "reminders",
  ];

  const chatbotState = {
    initialized: false,
    sending: false,
    open: false,
    messages: [],
    contextTypes: [...DEFAULT_CONTEXT],
  };

  document.addEventListener("DOMContentLoaded", initializeChatbot);

  function initializeChatbot() {
    if (chatbotState.initialized || !shouldEnableChatbot()) {
      return;
    }

    if (!ensureChatbotUi()) {
      return;
    }

    chatbotState.initialized = true;
    restoreSessionMessages();
    attachChatbotHandlers();
    renderChatMessages();
    updateChatContextToggles();
  }

  function shouldEnableChatbot() {
    return (
      window.location.pathname.endsWith("dashboard-v2.html") &&
      localStorage.getItem(CONFIG.STORAGE_KEYS.USER_ROLE) === "patient" &&
      !!localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN) &&
      !!document.querySelector(".dashboard-header") &&
      !!document.querySelector(".main-content")
    );
  }

  function ensureChatbotUi() {
    const actionsContainer = document.querySelector(
      ".dashboard-header .d-flex.gap-2",
    );
    const mainContent = document.querySelector(".main-content");

    if (!actionsContainer || !mainContent) {
      return false;
    }

    if (!document.getElementById("chatbotLauncher")) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn-icon";
      button.id = "chatbotLauncher";
      button.setAttribute("aria-label", "Open Healio assistant");
      button.innerHTML = '<i class="bi bi-chat-dots"></i>';
      actionsContainer.insertBefore(button, actionsContainer.firstChild);
    }

    if (!document.getElementById("chatbotDrawer")) {
      mainContent.insertAdjacentHTML(
        "beforeend",
        `
                <aside class="healio-chatbot-drawer" id="chatbotDrawer" aria-hidden="true">
                    <div class="healio-chatbot-card">
                        <div class="healio-chatbot-header">
                            <div>
                                <div class="healio-chatbot-eyebrow">Healio Assistant</div>
                                <h2 class="healio-chatbot-title">Health help, kept simple</h2>
                                <p class="healio-chatbot-subtitle">I can explain your Healio info and suggest questions for your doctor.</p>
                            </div>
                            <button type="button" class="btn btn-sm btn-light" id="chatbotCloseButton" aria-label="Close assistant">
                                <i class="bi bi-x-lg"></i>
                            </button>
                        </div>
                        <div class="healio-chatbot-disclaimer">
                            Informational only. No diagnosis or medication changes.
                        </div>
                        <div class="healio-chatbot-context" id="chatbotContextToggles"></div>
                        <div class="healio-chatbot-starters" id="chatbotStarters"></div>
                        <div class="healio-chatbot-messages" id="chatbotMessages"></div>
                        <form class="healio-chatbot-form" id="chatbotForm">
                            <textarea id="chatbotInput" class="form-control" rows="3" maxlength="4000" placeholder="Ask about your vitals, medications, appointments, or general health questions..."></textarea>
                            <div class="healio-chatbot-formbar">
                                <div class="healio-chatbot-status" id="chatbotStatus">Session-only chat. Nothing is saved to your account.</div>
                                <button type="submit" class="btn btn-primary" id="chatbotSendButton">
                                    <i class="bi bi-send me-2"></i>Send
                                </button>
                            </div>
                        </form>
                    </div>
                </aside>
            `,
      );
    }

    return true;
  }

  function attachChatbotHandlers() {
    document
      .getElementById("chatbotLauncher")
      ?.addEventListener("click", toggleDrawer);
    document
      .getElementById("chatbotCloseButton")
      ?.addEventListener("click", closeDrawer);
    document
      .getElementById("chatbotForm")
      ?.addEventListener("submit", handleSubmit);
    document
      .getElementById("chatbotInput")
      ?.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          handleSubmit(event);
        }
      });
  }

  function toggleDrawer() {
    chatbotState.open = !chatbotState.open;
    renderDrawerState();
  }

  function closeDrawer() {
    chatbotState.open = false;
    renderDrawerState();
  }

  function renderDrawerState() {
    const drawer = document.getElementById("chatbotDrawer");
    if (!drawer) {
      return;
    }

    drawer.classList.toggle("is-open", chatbotState.open);
    drawer.setAttribute("aria-hidden", chatbotState.open ? "false" : "true");
  }

  function restoreSessionMessages() {
    try {
      const stored = sessionStorage.getItem(CHAT_STORAGE_KEY);
      if (!stored) {
        chatbotState.messages = [
          {
            role: "assistant",
            text: "I can help explain your Healio information and suggest questions to ask your doctor.",
          },
        ];
        persistMessages();
        return;
      }

      const parsed = JSON.parse(stored);
      chatbotState.messages =
        Array.isArray(parsed) && parsed.length ? parsed : [];
    } catch (error) {
      chatbotState.messages = [];
    }

    if (!chatbotState.messages.length) {
      chatbotState.messages.push({
        role: "assistant",
        text: "I can help explain your Healio information and suggest questions to ask your doctor.",
      });
    }
  }

  function persistMessages() {
    sessionStorage.setItem(
      CHAT_STORAGE_KEY,
      JSON.stringify(chatbotState.messages.slice(-20)),
    );
  }

  function renderChatMessages() {
    renderStarterQuestions();
    const container = document.getElementById("chatbotMessages");
    if (!container) {
      return;
    }

    container.innerHTML = chatbotState.messages
      .map(
        (message) => `
            <article class="healio-chatbot-message healio-chatbot-message--${message.role}">
                <div class="healio-chatbot-bubble">${escapeHtml(message.text)}</div>
            </article>
        `,
      )
      .join("");

    container.scrollTop = container.scrollHeight;
  }

  function renderStarterQuestions() {
    const container = document.getElementById("chatbotStarters");
    if (!container) {
      return;
    }

    container.innerHTML = STARTER_QUESTIONS.map(
      (question) => `
            <button type="button" class="healio-chatbot-chip" data-chatbot-question="${escapeAttribute(question)}">${escapeHtml(question)}</button>
        `,
    ).join("");

    container.querySelectorAll("[data-chatbot-question]").forEach((button) => {
      button.addEventListener("click", () => {
        document.getElementById("chatbotInput").value =
          button.getAttribute("data-chatbot-question") || "";
        submitMessage();
      });
    });
  }

  function updateChatContextToggles() {
    const container = document.getElementById("chatbotContextToggles");
    if (!container) {
      return;
    }

    const options = [
      ["vitals", "Vitals"],
      ["medications", "Meds"],
      ["appointments", "Appointments"],
      ["reminders", "Reminders"],
    ];

    container.innerHTML = options
      .map(
        ([value, label]) => `
            <label class="healio-chatbot-toggle">
                <input type="checkbox" value="${value}" ${chatbotState.contextTypes.includes(value) ? "checked" : ""}>
                <span>${label}</span>
            </label>
        `,
      )
      .join("");

    container.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        chatbotState.contextTypes = Array.from(
          container.querySelectorAll("input:checked"),
        ).map((input) => input.value);
      });
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await submitMessage();
  }

  async function submitMessage() {
    if (chatbotState.sending) {
      return;
    }

    const input = document.getElementById("chatbotInput");
    const rawMessage = (input?.value || "").trim();
    if (!rawMessage) {
      return;
    }

    chatbotState.open = true;
    renderDrawerState();
    chatbotState.sending = true;
    setStatus("Thinking...");
    setSendButtonState();

    chatbotState.messages.push({ role: "user", text: rawMessage });
    persistMessages();
    renderChatMessages();
    input.value = "";

    try {
      const response = await fetch(
        getApiUrl(CONFIG.ENDPOINTS.PATIENT_CHATBOT),
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            message: rawMessage,
            conversation: chatbotState.messages.slice(-10),
            context_types: chatbotState.contextTypes,
          }),
        },
      );

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          payload.detail || "Unable to reach the Healio assistant right now.",
        );
      }

      chatbotState.messages.push({
        role: "assistant",
        text: payload.reply || "I was unable to answer that just now.",
      });
      persistMessages();
      renderChatMessages();
      setStatus(
        payload.should_escalate
          ? "Safety guidance triggered. Please follow the assistant guidance and contact your doctor."
          : formatUsedContext(payload.used_context),
      );
    } catch (error) {
      chatbotState.messages.push({
        role: "assistant",
        text:
          error.message || "Unable to reach the Healio assistant right now.",
      });
      persistMessages();
      renderChatMessages();
      setStatus("Assistant unavailable right now.");
    } finally {
      chatbotState.sending = false;
      setSendButtonState();
    }
  }

  function setStatus(text) {
    const status = document.getElementById("chatbotStatus");
    if (status) {
      status.textContent = text;
    }
  }

  function setSendButtonState() {
    const button = document.getElementById("chatbotSendButton");
    if (!button) {
      return;
    }

    button.disabled = chatbotState.sending;
    button.innerHTML = chatbotState.sending
      ? '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Sending'
      : '<i class="bi bi-send me-2"></i>Send';
  }

  function formatUsedContext(items) {
    if (!Array.isArray(items) || !items.length) {
      return "Session-only chat. Nothing is saved to your account.";
    }

    return `Used context: ${items.join(", ")}`;
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, "<br>");
  }

  function escapeAttribute(text) {
    return text.replace(/"/g, "&quot;");
  }
})();
