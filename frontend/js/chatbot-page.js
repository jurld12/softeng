(function () {
    const CHAT_STORAGE_KEY = 'healio_chatbot_session_v1';
    const STARTER_QUESTIONS = [
        'What do my latest vitals mean?',
        'Help me understand my medications',
        'What should I ask at my next appointment?',
        'How can I improve my daily health routine?'
    ];

    const DEFAULT_CONTEXT = ['vitals', 'medications', 'appointments', 'reminders'];

    const chatbotState = {
        sending: false,
        messages: [],
        contextTypes: [...DEFAULT_CONTEXT]
    };

    document.addEventListener('DOMContentLoaded', initializeChatbotPage);

    function checkAuthentication() {
        if (typeof ensureAuthenticated === 'function') {
            return ensureAuthenticated({
                requiredRole: 'patient',
                allowMissingRole: true
            });
        }

        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
        const role = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_ROLE);

        if (!token) {
            window.location.href = 'login-v2.html';
            return false;
        }

        if (role && role !== 'patient') {
            alert('Access denied. This page is for patients only.');
            window.location.href = 'login-v2.html';
            return false;
        }

        return true;
    }

    window.logout = async function () {
        if (typeof performLogout === 'function') {
            await performLogout();
            return;
        }

        try {
            await fetch(getApiUrl(CONFIG.ENDPOINTS.LOGOUT), {
                method: 'POST',
                headers: getAuthHeaders()
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
            localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_ROLE);
            localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_ID);
            localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_NAME);
            window.location.href = 'login-v2.html';
        }
    };

    async function initializeChatbotPage() {
        if (!checkAuthentication()) {
            return;
        }

        await loadCurrentUser();
        restoreSessionMessages();
        renderContextToggles();
        renderStarterQuestions();
        renderMessages();
        attachHandlers();
    }

    async function loadCurrentUser() {
        try {
            const response = await fetch(getApiUrl('/auth/me'), {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                if (typeof handleUnauthorizedResponse === 'function' && handleUnauthorizedResponse(response)) {
                    return;
                }
                return;
            }

            const user = await response.json();
            const userName = user?.name || 'User';

            const nameEl = document.getElementById('sidebarUserName');
            const emailEl = document.getElementById('sidebarUserEmail');
            if (nameEl) nameEl.textContent = userName;
            if (emailEl) emailEl.textContent = user?.email || '';

            const avatars = document.querySelectorAll('img[alt="Profile"]');
            avatars.forEach((avatar) => {
                avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=7c3aed&color=fff`;
            });
        } catch (error) {
            console.error('Error loading current user:', error);
        }
    }

    function restoreSessionMessages() {
        try {
            const stored = sessionStorage.getItem(CHAT_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    chatbotState.messages = parsed;
                }
            }
        } catch (error) {
            chatbotState.messages = [];
        }

        if (!chatbotState.messages.length) {
            chatbotState.messages = [
                {
                    role: 'assistant',
                    text: 'I can help explain your Healio information and suggest questions to ask your doctor.'
                }
            ];
            persistMessages();
        }
    }

    function persistMessages() {
        sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatbotState.messages.slice(-20)));
    }

    function attachHandlers() {
        const form = document.getElementById('chatbotPageForm');
        const input = document.getElementById('chatbotPageInput');
        const clearButton = document.getElementById('chatbotPageClearButton');

        form?.addEventListener('submit', handleSubmit);
        input?.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSubmit(event);
            }
        });

        clearButton?.addEventListener('click', function () {
            chatbotState.messages = [
                {
                    role: 'assistant',
                    text: 'Session reset. Ask me anything about your Healio information.'
                }
            ];
            persistMessages();
            renderMessages();
            setStatus('Session cleared.');
        });
    }

    function renderContextToggles() {
        const container = document.getElementById('chatbotPageContextToggles');
        if (!container) {
            return;
        }

        const options = [
            ['vitals', 'Vitals'],
            ['medications', 'Meds'],
            ['appointments', 'Appointments'],
            ['reminders', 'Reminders']
        ];

        container.innerHTML = options.map(([value, label]) => `
            <label class="healio-chatbot-toggle">
                <input type="checkbox" value="${value}" ${chatbotState.contextTypes.includes(value) ? 'checked' : ''}>
                <span>${label}</span>
            </label>
        `).join('');

        container.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
            checkbox.addEventListener('change', () => {
                chatbotState.contextTypes = Array.from(container.querySelectorAll('input:checked')).map((input) => input.value);
            });
        });
    }

    function renderStarterQuestions() {
        const container = document.getElementById('chatbotPageStarters');
        if (!container) {
            return;
        }

        container.innerHTML = STARTER_QUESTIONS.map((question) => `
            <button type="button" class="healio-chatbot-chip" data-chatbot-question="${escapeAttribute(question)}">${escapeHtml(question)}</button>
        `).join('');

        container.querySelectorAll('[data-chatbot-question]').forEach((button) => {
            button.addEventListener('click', () => {
                const input = document.getElementById('chatbotPageInput');
                if (!input) {
                    return;
                }
                input.value = button.getAttribute('data-chatbot-question') || '';
                input.focus();
                submitMessage();
            });
        });
    }

    function renderMessages() {
        const container = document.getElementById('chatbotPageMessages');
        if (!container) {
            return;
        }

        container.innerHTML = chatbotState.messages.map((message) => {
            const role = message.role === 'user' ? 'user' : 'assistant';
            return `
                <article class="healio-chatbot-message healio-chatbot-message--${role}">
                    <div class="healio-chatbot-bubble">${escapeHtml(message.text || '')}</div>
                </article>
            `;
        }).join('');

        container.scrollTop = container.scrollHeight;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        await submitMessage();
    }

    async function submitMessage() {
        if (chatbotState.sending) {
            return;
        }

        const input = document.getElementById('chatbotPageInput');
        const rawMessage = (input?.value || '').trim();
        if (!rawMessage) {
            return;
        }

        chatbotState.sending = true;
        setSendButtonState();
        setStatus('Thinking...');

        chatbotState.messages.push({ role: 'user', text: rawMessage });
        persistMessages();
        renderMessages();

        if (input) {
            input.value = '';
        }

        try {
            const response = await fetch(getApiUrl(CONFIG.ENDPOINTS.PATIENT_CHATBOT), {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    message: rawMessage,
                    conversation: chatbotState.messages.slice(-10),
                    context_types: chatbotState.contextTypes
                })
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                if (typeof handleUnauthorizedResponse === 'function' && handleUnauthorizedResponse(response)) {
                    return;
                }
                throw new Error(payload.detail || 'Unable to reach the Healio assistant right now.');
            }

            chatbotState.messages.push({
                role: 'assistant',
                text: payload.reply || 'I was unable to answer that just now.'
            });

            setStatus(
                payload.should_escalate
                    ? 'Safety guidance triggered. Please follow the assistant guidance and contact your doctor.'
                    : formatUsedContext(payload.used_context)
            );
        } catch (error) {
            chatbotState.messages.push({
                role: 'assistant',
                text: error.message || 'Unable to reach the Healio assistant right now.'
            });
            setStatus('Assistant unavailable right now.');
        } finally {
            chatbotState.sending = false;
            setSendButtonState();
            persistMessages();
            renderMessages();
        }
    }

    function setStatus(text) {
        const status = document.getElementById('chatbotPageStatus');
        if (status) {
            status.textContent = text;
        }
    }

    function setSendButtonState() {
        const button = document.getElementById('chatbotPageSendButton');
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
            return 'Session-only chat. Nothing is saved to your account.';
        }

        return `Used context: ${items.join(', ')}`;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/\n/g, '<br>');
    }

    function escapeAttribute(text) {
        return text.replace(/"/g, '&quot;');
    }
})();
