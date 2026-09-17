(() => {
  const API_URL="https://avani-ai-q7mq.onrender.com";
  const $=id=>document.getElementById(id);
  const qs=s=>document.querySelector(s);
  const qsa=s=>[...document.querySelectorAll(s)];
  const esc=t=>{const d=document.createElement("div");d.textContent=String(t??"");return d.innerHTML};
  const inline=t=>t.replace(/`([^`]+)`/g,"<code>$1</code>").replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/\*([^*]+)\*/g,"<em>$1</em>").replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  function formatAI(text){
    const raw=String(text??"");
    const parts=raw.split(/```([\w+-]*)\n?([\s\S]*?)```/g);
    let html="";
    for(let i=0;i<parts.length;i+=3){
      let body=parts[i]||"";
      body=esc(body).replace(/^### (.+)$/gm,"<h4>$1</h4>").replace(/^## (.+)$/gm,"<h3>$1</h3>").replace(/^# (.+)$/gm,"<h2>$1</h2>");
      const lines=body.split("\n");let out="",inList=false;
      for(const line of lines){
        const m=line.match(/^\s*[-*]\s+(.+)/);const n=line.match(/^\s*\d+[.)]\s+(.+)/);
        if(m||n){if(!inList){out+="<ul>";inList=true}out+=`<li>${inline((m||n)[1])}</li>`}else{if(inList){out+="</ul>";inList=false}if(line.trim())out+=`<p>${inline(line)}</p>`}
      }
      if(inList)out+="</ul>";
      html+=out;
      if(i+2<parts.length){const lang=esc(parts[i+1]||"code");const code=esc(parts[i+2]||"");html+=`<div class="code-block"><div class="code-head"><span>${lang||"code"}</span><button type="button" data-copy-code>Copy</button></div><pre><code>${code}</code></pre></div>`}
    }
    return html||"<p></p>";
  }
  function patchRenderer(){
    if(typeof window.renderMessage!=="function"||window.renderMessage.__premium)return;
    const original=window.renderMessage;
    function renderMessage(text,sender="ai",avatar=null,save=true){
      if(sender!=="ai")return original(text,sender,avatar,save);
      const wrap=document.createElement("div");wrap.className="message ai premium-message";
      const av=document.createElement("div");av.className="msg-avatar";av.textContent="A";
      const b=document.createElement("div");b.className="bubble rich-bubble";b.innerHTML=formatAI(text);
      wrap.append(av,b);$("messages")?.appendChild(wrap);$("messages")?.scrollTo({top:$ ("messages").scrollHeight,behavior:"smooth"});
      if(save&&!window.temporary){const c=typeof window.currentChat==="function"?window.currentChat():null;if(c){c.messages.push({text:String(text??""),sender:"ai",avatar:null,time:new Date().toISOString()});if(typeof window.saveChats==="function")window.saveChats();if(typeof window.renderHistory==="function")window.renderHistory()}}
      qsa("[data-copy-code]").forEach(btn=>{if(btn.dataset.bound)return;btn.dataset.bound="1";btn.onclick=async()=>{const code=btn.closest(".code-block")?.querySelector("pre")?.innerText||"";try{await navigator.clipboard.writeText(code);btn.textContent="Copied";setTimeout(()=>btn.textContent="Copy",1200)}catch{btn.textContent="Copy failed"}}});
      return wrap;
    }
    renderMessage.__premium=true;window.renderMessage=renderMessage;
  }
  function addHero(){
    const w=$("view-chat")?.querySelector(".chat-scroll");if(!w||w.dataset.hero)return;w.dataset.hero="1";
    const old=w.querySelector(".welcome");if(old)old.innerHTML=`<div class="hero-orb"><span>A</span><i></i></div><div class="hero-kicker">PERSONAL AI · V8</div><h1>How can I help you today?</h1><p>Chat, code, create, analyze files, explore maps and work faster with Avani.</p><div class="hero-chips"><button data-hero-prompt="Explain a topic in simple Hindi">✨ Explain</button><button data-hero-prompt="Help me build my project step by step">🚀 Build</button><button data-hero-prompt="Review and improve my code">💻 Code</button><button data-hero-prompt="Give me ideas for my next video">🎬 Create</button></div>`;
    qsa("[data-hero-prompt]").forEach(b=>b.onclick=()=>{const i=$("userInput");if(i){i.value=b.dataset.heroPrompt;i.focus();i.dispatchEvent(new Event("input"))}});
  }
  function patchTop(){const sub=$("viewSubtitle");if(sub)sub.textContent="AI Assistant · Ready";const brand=qs(".brand small");if(brand)brand.textContent="Intelligent workspace"}
  function patch(){patchRenderer();addHero();patchTop()}
  document.addEventListener("DOMContentLoaded",()=>{patch();setTimeout(patch,250);setTimeout(patch,800)});
})();