const input = document.getElementById("userInput");
const messages = document.getElementById("messages");

const API_URL = "https://avani-ai-q7mq.onrender.com/api/chat";

// ========================================
// AVANI STORAGE
// ========================================

let chats = JSON.parse(localStorage.getItem("avaniChats")) || [];
let currentChatId = localStorage.getItem("avaniCurrentChat");

let memory = JSON.parse(localStorage.getItem("avaniMemory")) || [];


// ========================================
// CREATE NEW CHAT
// ========================================

function createNewChat() {

    const chat = {
        id: Date.now().toString(),
        title: "New Chat",
        messages: []
    };

    chats.unshift(chat);

    currentChatId = chat.id;

    saveChats();

    renderChat();

    renderChatHistory();

    input.focus();
}


// ========================================
// SAVE CHATS
// ========================================

function saveChats() {

    localStorage.setItem(
        "avaniChats",
        JSON.stringify(chats)
    );

    localStorage.setItem(
        "avaniCurrentChat",
        currentChatId
    );
}


// ========================================
// GET CURRENT CHAT
// ========================================

function getCurrentChat() {

    return chats.find(
        chat => chat.id === currentChatId
    );
}


// ========================================
// RENDER CHAT
// ========================================

function renderChat() {

    const chat = getCurrentChat();

    if (!chat) {

        messages.innerHTML = `
            <div class="welcome">
                <div class="welcome-avatar">A</div>

                <h1>Hi, I'm Avani 👋</h1>

                <p>
                    Your personal AI assistant.
                    Ask me anything and let's get started.
                </p>
            </div>
        `;

        return;
    }


    messages.innerHTML = "";


    if (chat.messages.length === 0) {

        messages.innerHTML = `
            <div class="welcome">

                <div class="welcome-avatar">A</div>

                <h1>Hi, I'm Avani 👋</h1>

                <p>
                    Your personal AI assistant.
                    Ask me anything and let's get started.
                </p>

            </div>
        `;

        return;
    }


    chat.messages.forEach(message => {

        addMessage(
            message.text,
            message.sender,
            false
        );

    });
}


// ========================================
// ADD MESSAGE
// ========================================

function addMessage(text, sender, save = true) {

    const message = document.createElement("div");

    message.className =
        `message ${sender}`;


    const content =
        document.createElement("div");

    content.className =
        "message-content";


    content.textContent = text;


    message.appendChild(content);

    messages.appendChild(message);


    messages.scrollTop =
        messages.scrollHeight;


    if (save) {

        const chat = getCurrentChat();

        if (!chat) return;


        chat.messages.push({

            text: text,

            sender: sender,

            time: new Date().toISOString()

        });


        // First user message becomes title
        if (
            sender === "user" &&
            chat.title === "New Chat"
        ) {

            chat.title =
                text.length > 28
                    ? text.substring(0, 28) + "..."
                    : text;

        }


        saveChats();

        renderChatHistory();

    }


    return message;
}


// ========================================
// SEND MESSAGE
// ========================================

async function sendMessage() {

    const text =
        input.value.trim();


    if (text === "") return;


    // Automatically create chat
    if (!getCurrentChat()) {

        createNewChat();

    }


    addMessage(
        text,
        "user"
    );


    input.value = "";

    input.disabled = true;


    const thinking =
        addMessage(
            "Avani is thinking... 🤔",
            "ai",
            false
        );


    try {

        const response =
            await fetch(
                API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        message: text
                    })
                }
            );


        const data =
            await response.json();


        thinking.remove();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Something went wrong."
            );

        }


        addMessage(
            data.reply,
            "ai"
        );


        // Automatically detect useful memory
        detectMemory(text);


    } catch (error) {

        console.error(
            "Avani Error:",
            error
        );


        thinking.remove();


        addMessage(
            "Sorry 😔 Avani se connection nahi ho pa raha. Backend check karo.",
            "ai"
        );

    }


    input.disabled = false;

    input.focus();
}


// ========================================
// CHAT HISTORY
// ========================================

function renderChatHistory() {

    const sidebar =
        document.querySelector(
            ".sidebar"
        );


    if (!sidebar) return;


    let history =
        document.getElementById(
            "avaniHistory"
        );


    if (!history) {

        history =
            document.createElement(
                "div"
            );

        history.id =
            "avaniHistory";


        history.innerHTML = `
            <div class="history-title">
                Recent Chats
            </div>
        `;


        const newChatButton =
            sidebar.querySelector(
                "button"
            );


        if (newChatButton) {

            newChatButton.after(
                history
            );

        }

    }


    const title =
        history.querySelector(
            ".history-title"
        );


    history.innerHTML = "";

    history.appendChild(title);


    chats.forEach(chat => {

        const item =
            document.createElement(
                "div"
            );


        item.className =
            "history-item";


        if (
            chat.id === currentChatId
        ) {

            item.classList.add(
                "active"
            );

        }


        item.innerHTML = `
            <span>💬</span>
            <span class="history-name">
                ${escapeHTML(chat.title)}
            </span>
            <button
                class="delete-chat"
                title="Delete chat"
            >
                ×
            </button>
        `;


        item.addEventListener(
            "click",
            function(event) {

                if (
                    event.target.classList
                        .contains("delete-chat")
                ) {

                    deleteChat(
                        chat.id
                    );

                    return;

                }


                currentChatId =
                    chat.id;


                saveChats();

                renderChat();

                renderChatHistory();

            }
        );


        history.appendChild(item);

    });

}


// ========================================
// DELETE CHAT
// ========================================

function deleteChat(id) {

    const confirmed =
        confirm(
            "Delete this chat?"
        );


    if (!confirmed) return;


    chats =
        chats.filter(
            chat => chat.id !== id
        );


    if (currentChatId === id) {

        currentChatId =
            chats.length
                ? chats[0].id
                : null;

    }


    saveChats();

    renderChat();

    renderChatHistory();

}


// ========================================
// MEMORY SYSTEM
// ========================================

function detectMemory(text) {

    const patterns = [

        "mera naam",

        "my name is",

        "mujhe pasand",

        "i like",

        "i love",

        "main rehta",

        "i live",

        "mera favourite",

        "my favorite"

    ];


    const lower =
        text.toLowerCase();


    const found =
        patterns.some(
            pattern =>
                lower.includes(pattern)
        );


    if (!found) return;


    if (
        !memory.includes(text)
    ) {

        memory.push(text);

        localStorage.setItem(
            "avaniMemory",
            JSON.stringify(memory)
        );

    }

}


// ========================================
// SHOW MEMORY
// ========================================

function showMemory() {

    const old =
        document.getElementById(
            "memoryPanel"
        );


    if (old) {

        old.remove();

        return;

    }


    const panel =
        document.createElement(
            "div"
        );


    panel.id =
        "memoryPanel";


    panel.innerHTML = `
        <div class="memory-box">

            <div class="memory-header">

                <h2>🧠 Avani Memory</h2>

                <button id="closeMemory">
                    ×
                </button>

            </div>

            <p>
                Avani remembers useful information
                from this browser.
            </p>

            <div class="memory-list">

                ${
                    memory.length
                    ? memory.map(
                        item =>
                        `<div class="memory-item">
                            🧠 ${escapeHTML(item)}
                        </div>`
                    ).join("")
                    : `
                        <div class="empty-memory">
                            No memories yet.
                        </div>
                    `
                }

            </div>

            ${
                memory.length
                ? `
                    <button
                        id="clearMemory"
                        class="clear-memory"
                    >
                        Clear Memory
                    </button>
                `
                : ""
            }

        </div>
    `;


    document.body.appendChild(
        panel
    );


    document.getElementById(
        "closeMemory"
    ).onclick = () => {

        panel.remove();

    };


    const clearButton =
        document.getElementById(
            "clearMemory"
        );


    if (clearButton) {

        clearButton.onclick =
            () => {

                if (
                    confirm(
                        "Clear all Avani memories?"
                    )
                ) {

                    memory = [];

                    localStorage.removeItem(
                        "avaniMemory"
                    );

                    panel.remove();

                    showMemory();

                }

            };

    }

}


// ========================================
// HTML SECURITY
// ========================================

function escapeHTML(text) {

    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ========================================
// ADD EXTRA UI STYLES
// ========================================

const extraStyles =
document.createElement("style");


extraStyles.textContent = `

#avaniHistory {

    margin-top: 14px;

    max-height: 330px;

    overflow-y: auto;

}


.history-title {

    font-size: 12px;

    color: #8f96aa;

    padding: 8px 12px;

}


.history-item {

    display: flex;

    align-items: center;

    gap: 8px;

    padding: 10px 12px;

    margin: 4px 0;

    border-radius: 10px;

    cursor: pointer;

    color: #dce1ef;

    font-size: 13px;

    transition: 0.2s;

}


.history-item:hover {

    background: rgba(255,255,255,0.07);

}


.history-item.active {

    background: rgba(100,70,220,0.22);

}


.history-name {

    flex: 1;

    overflow: hidden;

    white-space: nowrap;

    text-overflow: ellipsis;

}


.delete-chat {

    border: none;

    background: transparent;

    color: #777;

    cursor: pointer;

    font-size: 18px;

}


.delete-chat:hover {

    color: #ff5f6d;

}


#memoryPanel {

    position: fixed;

    inset: 0;

    background: rgba(0,0,0,0.65);

    display: flex;

    align-items: center;

    justify-content: center;

    z-index: 9999;

    backdrop-filter: blur(8px);

}


.memory-box {

    width: min(460px, 90%);

    max-height: 70vh;

    overflow-y: auto;

    background: #111522;

    border: 1px solid rgba(130,100,255,0.4);

    border-radius: 18px;

    padding: 22px;

    box-shadow: 0 20px 60px rgba(0,0,0,0.5);

}


.memory-header {

    display: flex;

    align-items: center;

    justify-content: space-between;

}


.memory-header h2 {

    margin: 0;

}


#closeMemory {

    border: none;

    background: transparent;

    color: white;

    font-size: 28px;

    cursor: pointer;

}


.memory-box p {

    color: #9ca4b8;

    font-size: 14px;

}


.memory-item {

    background: rgba(255,255,255,0.05);

    padding: 12px;

    border-radius: 10px;

    margin: 8px 0;

    color: #e8ebf5;

}


.empty-memory {

    color: #888;

    text-align: center;

    padding: 25px;

}


.clear-memory {

    width: 100%;

    margin-top: 15px;

    padding: 11px;

    border: none;

    border-radius: 10px;

    background: #d84a5b;

    color: white;

    cursor: pointer;

}


`;

document.head.appendChild(
    extraStyles
);


// ========================================
// NEW CHAT BUTTON
// ========================================

const newChatButton =
    document.querySelector(
        ".sidebar button"
    );


if (newChatButton) {

    newChatButton.onclick =
        createNewChat;

}


// ========================================
// MEMORY BUTTON
// ========================================

const sidebarItems =
    document.querySelectorAll(
        ".sidebar *"
    );


sidebarItems.forEach(element => {

    if (
        element.textContent.trim()
            === "Memory"
    ) {

        element.addEventListener(
            "click",
            showMemory
        );

    }

});


// ========================================
// ENTER KEY
// ========================================

input.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();

        }

    }
);


// ========================================
// START AVANI
// ========================================

if (!currentChatId && chats.length) {

    currentChatId =
        chats[0].id;

}


if (!currentChatId) {

    createNewChat();

} else {

    saveChats();

    renderChat();

    renderChatHistory();

}


input.focus();

// Professional response layout and settings
function formatAvaniReply(text) {
  const normalized = String(text || "").trim().replace(/\r/g, "");
  if (normalized.includes("\n\n")) return normalized;
  const sentences = normalized.match(/[^.!?।]+[.!?।]+|[^.!?।]+$/g) || [normalized];
  if (sentences.length < 4) return normalized;
  const groups = [];
  for (let i = 0; i < sentences.length; i += 2) groups.push(sentences.slice(i, i + 2).join(" ").trim());
  return groups.join("\n\n");
}

function addMessage(text, sender, save = true) {
  const message = document.createElement("div");
  message.className = `message ${sender}`;
  const content = document.createElement("div");
  content.className = "message-content";
  const rawText = String(text || "").trim();
  const displayText = sender === "ai" ? formatAvaniReply(rawText) : rawText;
  const paragraphs = displayText.split(/\n\s*\n+/).filter(Boolean);
  if (sender === "ai" && paragraphs.length > 1) {
    paragraphs.forEach(paragraph => {
      const block = document.createElement("p");
      block.textContent = paragraph.replace(/\n+/g, " ").trim();
      content.appendChild(block);
    });
  } else content.textContent = displayText;
  message.appendChild(content);
  messages.appendChild(message);
  messages.scrollTop = messages.scrollHeight;
  if (save) {
    const chat = getCurrentChat();
    if (!chat) return message;
    chat.messages.push({ text: rawText, sender, time: new Date().toISOString() });
    if (sender === "user" && chat.title === "New Chat") chat.title = rawText.length > 28 ? rawText.substring(0, 28) + "..." : rawText;
    saveChats();
    renderChatHistory();
  }
  return message;
}

function showSettings() {
  const old = document.getElementById("avaniSettingsPanel");
  if (old) return old.remove();
  const panel = document.createElement("div");
  panel.id = "avaniSettingsPanel";
  panel.innerHTML = `<div class="memory-box"><div class="memory-header"><h2>⚙️ Settings</h2><button id="closeSettings">×</button></div><p>Avani stores chats and memory only in this browser.</p><div class="memory-item">✓ Chat history: on</div><div class="memory-item">✓ Memory: on</div><div class="memory-item">✓ Structured answers: on</div></div>`;
  document.body.appendChild(panel);
  document.getElementById("closeSettings").onclick = () => panel.remove();
}

document.querySelectorAll(".sidebar *").forEach(element => {
  if (element.textContent.trim() === "Settings") element.addEventListener("click", showSettings);
});
document.querySelector(".header-button")?.addEventListener("click", showSettings);


// Rich Markdown replies with free browser voice
let avaniVoiceEnabled = JSON.parse(localStorage.getItem("avaniVoiceEnabled") || "true");

function appendInlineMarkdown(target, text) {
  String(text).split(/(\*\*[^*]+\*\*)/g).forEach(part => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      const strong = document.createElement("strong");
      strong.textContent = part.slice(2, -2);
      target.appendChild(strong);
    } else target.appendChild(document.createTextNode(part));
  });
}

function speakAvani(text) {
  if (!avaniVoiceEnabled || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(String(text).replace(/\*\*/g, "").replace(/[#*_]/g, " "));
  const voices = window.speechSynthesis.getVoices();
  utterance.voice = voices.find(voice => /hi-IN|en-IN/i.test(voice.lang)) || voices.find(voice => /en/i.test(voice.lang)) || null;
  utterance.lang = utterance.voice?.lang || "en-IN";
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}

function addMessage(text, sender, save = true) {
  const message = document.createElement("div");
  message.className = `message ${sender}`;
  const content = document.createElement("div");
  content.className = "message-content";
  const rawText = String(text || "").trim();

  if (sender === "ai") {
    rawText.split(/\n\s*\n+/).filter(Boolean).forEach(block => {
      const lines = block.split("\n").map(line => line.trim()).filter(Boolean);
      const isList = lines.some(line => /^[-*]\s+/.test(line));
      if (isList) {
        const list = document.createElement("ul");
        lines.forEach(line => {
          const item = document.createElement("li");
          appendInlineMarkdown(item, line.replace(/^[-*]\s+/, ""));
          list.appendChild(item);
        });
        content.appendChild(list);
      } else {
        const paragraph = document.createElement("p");
        appendInlineMarkdown(paragraph, lines.join(" "));
        content.appendChild(paragraph);
      }
    });
  } else content.textContent = rawText;

  message.appendChild(content);
  messages.appendChild(message);
  messages.scrollTop = messages.scrollHeight;
  if (save) {
    const chat = getCurrentChat();
    if (!chat) return message;
    chat.messages.push({ text: rawText, sender, time: new Date().toISOString() });
    if (sender === "user" && chat.title === "New Chat") chat.title = rawText.length > 28 ? rawText.substring(0, 28) + "..." : rawText;
    saveChats();
    renderChatHistory();
    if (sender === "ai") speakAvani(rawText);
  }
  return message;
}

const voiceButton = document.createElement("button");
voiceButton.className = "header-button";
voiceButton.id = "voiceToggle";
voiceButton.title = "Toggle Avani voice";
function updateVoiceButton() { voiceButton.textContent = avaniVoiceEnabled ? "🔊" : "🔇"; }
updateVoiceButton();
voiceButton.onclick = () => {
  avaniVoiceEnabled = !avaniVoiceEnabled;
  localStorage.setItem("avaniVoiceEnabled", JSON.stringify(avaniVoiceEnabled));
  if (!avaniVoiceEnabled) window.speechSynthesis?.cancel();
  updateVoiceButton();
};
document.querySelector(".chat-header")?.insertBefore(voiceButton, document.querySelector(".header-button"));


// Make Markdown replies look like a real AI conversation
(function () {
  const richReplyStyle = document.createElement("style");
  richReplyStyle.textContent = ".message-content p{margin:0}.message-content p+p{margin-top:12px}.message-content ul{margin:10px 0 0;padding-left:22px}.message-content li+li{margin-top:9px}.message-content strong{font-weight:700;color:#fff}";
  document.head.appendChild(richReplyStyle);
})();

function addMessage(text, sender, save = true) {
  const message = document.createElement("div");
  message.className = `message ${sender}`;
  const content = document.createElement("div");
  content.className = "message-content";
  const rawText = String(text || "").trim();

  if (sender === "ai") {
    const lines = rawText.replace(/\s+-\s+(?=\*\*)/g, "\n- ").split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    let list = null;
    lines.forEach(line => {
      const bullet = line.match(/^[-*]\s+(.+)/);
      if (bullet) {
        if (!list) { list = document.createElement("ul"); content.appendChild(list); }
        const item = document.createElement("li");
        appendInlineMarkdown(item, bullet[1]);
        list.appendChild(item);
      } else {
        list = null;
        const paragraph = document.createElement("p");
        appendInlineMarkdown(paragraph, line);
        content.appendChild(paragraph);
      }
    });
  } else {
    content.textContent = rawText;
  }

  message.appendChild(content);
  messages.appendChild(message);
  messages.scrollTop = messages.scrollHeight;
  if (save) {
    const chat = getCurrentChat();
    if (!chat) return message;
    chat.messages.push({ text: rawText, sender, time: new Date().toISOString() });
    if (sender === "user" && chat.title === "New Chat") chat.title = rawText.length > 28 ? rawText.substring(0, 28) + "..." : rawText;
    saveChats();
    renderChatHistory();
    if (sender === "ai") speakAvani(rawText);
  }
  return message;
}


// Complete free browser voice and professional reply formatting
var avaniVoiceEnabled = JSON.parse(localStorage.getItem("avaniVoiceEnabled") || "true");
function appendInlineMarkdown(target, text) {
  String(text).split(/(\*\*[^*]+\*\*)/g).forEach(part => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      const strong = document.createElement("strong");
      strong.textContent = part.slice(2, -2);
      target.appendChild(strong);
    } else target.appendChild(document.createTextNode(part));
  });
}
function speakAvani(text) {
  if (!avaniVoiceEnabled || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(String(text).replace(/\*\*/g, "").replace(/[#*_]/g, " "));
  const voices = window.speechSynthesis.getVoices();
  utterance.voice = voices.find(voice => /hi-IN|en-IN/i.test(voice.lang)) || voices.find(voice => /en/i.test(voice.lang)) || null;
  utterance.lang = utterance.voice ? utterance.voice.lang : "en-IN";
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}
(function addVoiceControl() {
  if (document.getElementById("voiceToggle")) return;
  const voiceButton = document.createElement("button");
  voiceButton.className = "header-button";
  voiceButton.id = "voiceToggle";
  voiceButton.title = "Voice on/off";
  const updateVoiceButton = () => { voiceButton.textContent = avaniVoiceEnabled ? "🔊" : "🔇"; };
  updateVoiceButton();
  voiceButton.onclick = () => {
    avaniVoiceEnabled = !avaniVoiceEnabled;
    localStorage.setItem("avaniVoiceEnabled", JSON.stringify(avaniVoiceEnabled));
    if (!avaniVoiceEnabled) window.speechSynthesis.cancel();
    updateVoiceButton();
  };
  document.querySelector(".chat-header")?.insertBefore(voiceButton, document.querySelector(".header-button"));
})();
