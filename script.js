const input = document.getElementById("userInput");
const messages = document.getElementById("messages");
const sendButton = document.getElementById("sendButton");
const API_URL = "https://avani-ai-q7mq.onrender.com/api/chat";

let chats = JSON.parse(localStorage.getItem("avaniChats") || "[]");
let currentChatId = localStorage.getItem("avaniCurrentChat") || null;
let memory = JSON.parse(localStorage.getItem("avaniMemory") || "[]");
let voiceEnabled = localStorage.getItem("avaniVoice") === "true";

const $ = (id) => document.getElementById(id);

function saveState() {
    localStorage.setItem("avaniChats", JSON.stringify(chats));
    localStorage.setItem("avaniCurrentChat", currentChatId || "");
    localStorage.setItem("avaniMemory", JSON.stringify(memory));
    localStorage.setItem("avaniVoice", String(voiceEnabled));
}

function createNewChat() {
    const chat = { id: Date.now().toString(), title: "New Chat", messages: [] };
    chats.unshift(chat);
    currentChatId = chat.id;
    saveState();
    renderChat();
    renderChatHistory();
    input.focus();
    closeSidebar();
}

// Backward-compatible name used by older versions of the UI.
window.newChat = createNewChat;

function getCurrentChat() {
    return chats.find(chat => chat.id === currentChatId) || null;
}

function welcomeMarkup() {
    return `<div class="welcome">
        <div class="welcome-avatar">A</div>
        <h1>Hi, I'm Avani 👋</h1>
        <p>Your personal AI assistant.<br>Ask me anything and let's build something useful together.</p>
        <div class="welcome-badge">✦ Ready to help · Fast · Private local history</div>
    </div>`;
}

function renderChat() {
    const chat = getCurrentChat();
    messages.innerHTML = "";
    if (!chat || chat.messages.length === 0) {
        messages.innerHTML = welcomeMarkup();
        return;
    }
    chat.messages.forEach(item => addMessage(item.text, item.sender, false));
    scrollToBottom();
}

function addMessage(text, sender, save = true) {
    const message = document.createElement("div");
    message.className = `message ${sender}`;
    const content = document.createElement("div");
    content.className = "message-content";
    content.textContent = String(text ?? "");
    message.appendChild(content);
    messages.appendChild(message);
    scrollToBottom();

    if (save) {
        const chat = getCurrentChat();
        if (!chat) return message;
        chat.messages.push({ text: String(text ?? ""), sender, time: new Date().toISOString() });
        if (sender === "user" && chat.title === "New Chat") {
            chat.title = text.length > 32 ? text.substring(0, 32) + "…" : text;
        }
        saveState();
        renderChatHistory();
    }
    return message;
}

function scrollToBottom() {
    requestAnimationFrame(() => { messages.scrollTop = messages.scrollHeight; });
}

async function sendMessage(prefilledText = null) {
    const text = (prefilledText ?? input.value).trim();
    if (!text || input.disabled) return;

    if (!getCurrentChat()) createNewChat();
    addMessage(text, "user");
    input.value = "";
    autoResizeInput();
    setBusy(true);

    const thinking = document.createElement("div");
    thinking.className = "message ai";
    thinking.innerHTML = `<div class="message-content"><span class="thinking-dots">Avani is thinking <b>•</b><b>•</b><b>•</b></span></div>`;
    messages.appendChild(thinking);
    scrollToBottom();

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text })
        });
        let data = {};
        try { data = await response.json(); } catch (_) {}
        if (!response.ok) throw new Error(data.error || `Server error (${response.status})`);
        thinking.remove();
        const reply = data.reply || "I received your message, but no reply was returned.";
        addMessage(reply, "ai");
        detectMemory(text);
        speakReply(reply);
    } catch (error) {
        console.error("Avani Error:", error);
        thinking.remove();
        addMessage(`Sorry 😔 Avani se connection nahi ho pa raha.\n\n${error.message || "Please try again."}`, "ai");
    } finally {
        setBusy(false);
        input.focus();
    }
}

function setBusy(busy) {
    input.disabled = busy;
    if (sendButton) sendButton.disabled = busy;
}

function renderChatHistory() {
    const list = $("historyList");
    if (!list) return;
    list.innerHTML = "";
    if (!chats.length) {
        list.innerHTML = `<div class="empty-memory" style="padding:10px 5px;text-align:left">No chats yet</div>`;
        return;
    }
    chats.slice(0, 12).forEach(chat => {
        const item = document.createElement("div");
        item.className = `history-item${chat.id === currentChatId ? " active" : ""}`;
        item.innerHTML = `<span>💬</span><span class="history-name"></span><button class="delete-chat" title="Delete chat" aria-label="Delete chat">×</button>`;
        item.querySelector(".history-name").textContent = chat.title;
        item.addEventListener("click", event => {
            if (event.target.closest(".delete-chat")) {
                deleteChat(chat.id);
                return;
            }
            currentChatId = chat.id;
            saveState();
            renderChat();
            renderChatHistory();
            closeSidebar();
        });
        list.appendChild(item);
    });
}

function deleteChat(id) {
    chats = chats.filter(chat => chat.id !== id);
    if (currentChatId === id) currentChatId = chats[0]?.id || null;
    saveState();
    renderChat();
    renderChatHistory();
}

function clearCurrentChat() {
    const chat = getCurrentChat();
    if (!chat || chat.messages.length === 0) return;
    if (!confirm("Clear messages from this chat?")) return;
    chat.messages = [];
    chat.title = "New Chat";
    saveState();
    renderChat();
    renderChatHistory();
}

function detectMemory(text) {
    const lower = text.toLowerCase();
    const patterns = [
        /(?:mera naam|my name is|i am)\s+([^.!?\n]{2,50})/i,
        /(?:mujhe pasand|i like|i love)\s+([^.!?\n]{2,60})/i,
        /(?:mera favourite|my favorite)\s+([^.!?\n]{2,60})/i
    ];
    for (const pattern of patterns) {
        const match = lower.match(pattern);
        if (match && match[1]) {
            const original = text.match(pattern)?.[0] || text;
            const cleaned = original.trim();
            if (!memory.some(item => item.toLowerCase() === cleaned.toLowerCase())) {
                memory.unshift(cleaned);
                memory = memory.slice(0, 20);
                saveState();
            }
            break;
        }
    }
}

function showMemory() {
    const list = $("memoryList");
    if (!list) return;
    list.innerHTML = "";
    if (!memory.length) {
        list.innerHTML = `<div class="empty-memory">No saved memories yet.</div>`;
    } else {
        memory.forEach(item => {
            const row = document.createElement("div");
            row.className = "memory-item";
            row.textContent = item;
            list.appendChild(row);
        });
    }
    openModal("memoryModal");
}

function escapeHTML(value) {
    return String(value).replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[char]));
}

function openModal(id) { const modal = $(id); if (modal) modal.hidden = false; }
function closeModal(id) { const modal = $(id); if (modal) modal.hidden = true; }

function setupModals() {
    document.querySelectorAll("[data-close]").forEach(btn => btn.addEventListener("click", () => closeModal(btn.dataset.close)));
    document.querySelectorAll(".modal").forEach(modal => modal.addEventListener("click", e => { if (e.target === modal) modal.hidden = true; }));
    document.addEventListener("keydown", e => { if (e.key === "Escape") document.querySelectorAll(".modal:not([hidden])").forEach(m => m.hidden = true); });
}

function setupPrompts() {
    document.querySelectorAll("[data-prompt]").forEach(btn => btn.addEventListener("click", () => {
        input.value = btn.dataset.prompt;
        autoResizeInput();
        input.focus();
    }));
}

function autoResizeInput() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 150) + "px";
}

function setupInput() {
    input.addEventListener("input", autoResizeInput);
    input.addEventListener("keydown", e => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    $("sendButton")?.addEventListener("click", () => sendMessage());
    $("newChatButton")?.addEventListener("click", createNewChat);
    $("clearChatButton")?.addEventListener("click", clearCurrentChat);
}

function setupNavigation() {
    $("chatNav")?.addEventListener("click", () => { closeSidebar(); input.focus(); });
    $("memoryNav")?.addEventListener("click", showMemory);
    $("settingsNav")?.addEventListener("click", () => openModal("settingsModal"));
    $("clearMemoryButton")?.addEventListener("click", () => {
        if (!memory.length) return;
        if (confirm("Clear all saved Avani memory?")) { memory = []; saveState(); showMemory(); }
    });
}

function setupSettings() {
    const theme = $("themeToggle");
    const quick = $("quickPromptToggle");
    const voice = $("voiceSettingToggle");
    if (theme) {
        theme.checked = localStorage.getItem("avaniTheme") !== "light";
        theme.addEventListener("change", () => {
            localStorage.setItem("avaniTheme", theme.checked ? "dark" : "light");
            document.body.classList.toggle("light-mode", !theme.checked);
        });
    }
    if (quick) {
        quick.checked = localStorage.getItem("avaniQuickPrompts") !== "off";
        quick.addEventListener("change", () => {
            localStorage.setItem("avaniQuickPrompts", quick.checked ? "on" : "off");
            $("quickPrompts").style.display = quick.checked ? "flex" : "none";
        });
        if (!quick.checked) $("quickPrompts").style.display = "none";
    }
    if (voice) {
        voice.checked = voiceEnabled;
        voice.addEventListener("change", () => { voiceEnabled = voice.checked; saveState(); updateVoiceButton(); });
    }
    document.body.classList.toggle("light-mode", localStorage.getItem("avaniTheme") === "light");
}

function updateVoiceButton() {
    const button = $("voiceToggle");
    if (!button) return;
    button.textContent = voiceEnabled ? "🔊" : "🔇";
    button.classList.toggle("active", voiceEnabled);
    button.title = voiceEnabled ? "Voice replies on" : "Voice replies off";
    const setting = $("voiceSettingToggle");
    if (setting) setting.checked = voiceEnabled;
}

function speakReply(text) {
    if (!voiceEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 1200));
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
}

function setupVoice() {
    updateVoiceButton();
    $("voiceToggle")?.addEventListener("click", () => {
        voiceEnabled = !voiceEnabled;
        saveState();
        updateVoiceButton();
        if (!voiceEnabled && "speechSynthesis" in window) window.speechSynthesis.cancel();
    });

    const mic = $("micButton");
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!mic) return;
    if (!SpeechRecognition) {
        mic.title = "Voice input is not supported in this browser";
        return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => { mic.classList.add("active"); mic.textContent = "⏺️"; };
    recognition.onend = () => { mic.classList.remove("active"); mic.textContent = "🎙️"; };
    recognition.onerror = () => { mic.classList.remove("active"); mic.textContent = "🎙️"; };
    recognition.onresult = event => {
        input.value = event.results[0][0].transcript;
        autoResizeInput();
        input.focus();
    };
    mic.addEventListener("click", () => recognition.start());
}

function setupFileAttach() {
    const button = $("attachButton");
    const fileInput = $("fileInput");
    if (!button || !fileInput) return;
    button.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", async () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            const clipped = text.length > 12000 ? text.slice(0, 12000) + "\n[File clipped at 12,000 characters]" : text;
            input.value = `Please analyze this file: ${file.name}\n\n${clipped}`;
            autoResizeInput();
            input.focus();
        } catch (error) {
            addMessage("I couldn't read that file in the browser.", "ai");
        }
        fileInput.value = "";
    });
}

function setupMobileSidebar() {
    $("sidebarToggle")?.addEventListener("click", () => {
        $("sidebar")?.classList.add("open");
        $("mobileOverlay")?.classList.add("show");
    });
    $("mobileOverlay")?.addEventListener("click", closeSidebar);
}

function closeSidebar() {
    $("sidebar")?.classList.remove("open");
    $("mobileOverlay")?.classList.remove("show");
}

// Start the app.
if (!currentChatId || !getCurrentChat()) {
    currentChatId = chats[0]?.id || null;
}
saveState();
renderChat();
renderChatHistory();
setupInput();
setupPrompts();
setupNavigation();
setupSettings();
setupVoice();
setupFileAttach();
setupMobileSidebar();
setupModals();
autoResizeInput();
