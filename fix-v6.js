(() => {
  const API_URL = "https://avani-ai-q7mq.onrender.com";
  const $ = id => document.getElementById(id);
  const qs = s => document.querySelector(s);
  const qsa = s => [...document.querySelectorAll(s)];
  const toast = t => { const e = $("toast"); if (!e) return; e.textContent = t; e.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove("show"), 2400); };

  function injectMobileCSS() {
    if ($("avani-v6-mobile")) return;
    const s = document.createElement("style"); s.id = "avani-v6-mobile";
    s.textContent = `
      .chat-tools{max-width:900px;margin:0 auto 8px;display:flex;gap:7px;justify-content:flex-end}
      .chat-tools button{border:1px solid #3b465c;background:#0e1522;color:#aeb8c8;border-radius:10px;padding:7px 10px;font-size:10px}
      .chat-tools button:hover{border-color:#7654cf;color:#fff;background:#171f30}
      .attachment-preview{max-width:900px;margin:0 auto 8px;display:none;align-items:center;gap:9px;padding:8px 10px;border:1px solid #29354b;background:#0d1421;border-radius:12px}
      .attachment-preview img{width:42px;height:42px;border-radius:9px;object-fit:cover;border:1px solid #33415a}
      .attachment-preview .meta{min-width:0;flex:1}.attachment-preview b,.attachment-preview small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.attachment-preview small{color:#78849a;margin-top:2px;font-size:9px}
      .attachment-preview button{border:0;background:transparent;color:#9aa6ba;font-size:18px;padding:5px 8px}
      @media(max-width:760px){
        body{overflow:hidden}.sidebar{position:fixed;left:-285px;top:0;bottom:0;height:100dvh;transition:left .22s ease;box-shadow:20px 0 60px #0009}.sidebar.open{left:0}.main{width:100%;min-width:0}.hamburger{display:block}.topbar{height:60px;padding:0 10px}.top-title{margin-left:8px}.top-actions{gap:4px}.top-actions button,.hamburger{width:36px;height:36px}.chat-scroll{padding:20px 10px 150px}.welcome{margin:8vh auto}.welcome h1{font-size:29px}.welcome p{font-size:11px;padding:0 20px}.message{max-width:100%;gap:6px;margin-bottom:12px}.bubble{max-width:calc(100vw - 72px);font-size:13px;padding:10px 12px;line-height:1.55}.msg-avatar{width:28px;height:28px}.composer-wrap{left:0;right:0;padding:7px 8px 9px}.quick{margin-bottom:6px}.quick button{font-size:9px;padding:6px 9px}.composer{border-radius:14px;padding:5px}.composer>button{width:36px;height:36px}.composer textarea{font-size:14px;min-height:38px;padding:9px 5px}.hint{font-size:8px}.section-head{padding:20px 14px 15px;display:block}.section-head h1{font-size:23px}.section-head p{font-size:10px;margin-top:4px}.section-head>.primary{margin-top:12px;width:100%}.map-layout,.coding-grid,.memory-grid,.vision-work{grid-template-columns:1fr;padding-left:14px;padding-right:14px}.dashboard-grid{grid-template-columns:1fr;padding:0 14px 22px}.map-layout{padding-bottom:22px}.map-card #map{height:340px}.side-card{padding:12px}.tool-grid{grid-template-columns:repeat(2,1fr)}.studio-grid{grid-template-columns:1fr;padding:0 14px}.studio-grid button{min-height:92px}.tool-hub{grid-template-columns:repeat(2,1fr);padding:0 14px}.tool-work{padding:12px 14px;display:grid;grid-template-columns:1fr}.agent-builder{margin:0 14px}.agent-steps{grid-template-columns:repeat(2,1fr)}.security-grid{grid-template-columns:1fr;padding:0 14px 22px}.file-drop{margin:0 14px 12px;padding:20px}.file-list{padding:0 14px 22px}.upload-zone{margin:0 14px 12px;padding:26px 15px}.voice-card{margin:15px 14px;padding:25px 16px}.voice-actions{flex-direction:column}.chat-tools,.attachment-preview{margin-left:0;margin-right:0}.profile-mini{padding:9px 7px}
      }
    `;
    document.head.appendChild(s);
  }

  function ensureChatControls() {
    const composerWrap = qs(".composer-wrap");
    if (!composerWrap || $("clearChatButton")) return;
    const tools = document.createElement("div");
    tools.className = "chat-tools";
    tools.innerHTML = `<button id="clearChatButton" title="Clear current chat">🧹 Clear chat</button><button id="clearAllChatsButton" title="Delete all saved chats">🗑️ Clear all</button>`;
    const preview = document.createElement("div");
    preview.className = "attachment-preview";
    preview.id = "attachmentPreview";
    preview.innerHTML = `<img id="attachmentThumb" alt=""><div class="meta"><b id="attachmentName">Image ready</b><small id="attachmentHint">Image will not be sent as text</small></div><button class="secondary" id="analyzeAttachment" title="Analyze image">Analyze</button><button id="removeAttachment" title="Remove">×</button>`;
    composerWrap.insertBefore(tools, composerWrap.firstChild);
    composerWrap.insertBefore(preview, composerWrap.querySelector(".composer"));
    $("clearChatButton").onclick = clearCurrentChat;
    $("clearAllChatsButton").onclick = clearAllChats;
    $("analyzeAttachment").onclick = ()=>{ const fi=$("fileInput"); const f=fi?.files?.[0]; if(f) sendImageToVision(f); else toast("Choose an image first"); };
    $("removeAttachment").onclick = clearAttachmentPreview;
  }

  function currentChatSafe(){
    const list = JSON.parse(localStorage.getItem("avaniChats") || "[]");
    const id = localStorage.getItem("avaniCurrentChat");
    return list.find(c => c.id === id) || list[0] || null;
  }
  function clearCurrentChat(){
    const c = typeof window.currentChat === "function" ? window.currentChat() : currentChatSafe();
    if(!c) return toast("No chat to clear");
    if(!confirm("Clear all messages from this chat?")) return;
    c.messages = []; c.title = "New Chat";
    if(typeof window.saveChats === "function") window.saveChats();
    else localStorage.setItem("avaniChats", JSON.stringify(JSON.parse(localStorage.getItem("avaniChats")||"[]").map(x=>x.id===c.id?c:x)));
    if(typeof window.renderChat === "function") window.renderChat();
    if(typeof window.renderHistory === "function") window.renderHistory();
    toast("Current chat cleared");
  }
  function clearAllChats(){
    if(!confirm("Delete all saved chats? This cannot be undone.")) return;
    localStorage.removeItem("avaniChats"); localStorage.removeItem("avaniCurrentChat");
    location.reload();
  }

  function showAttachment(file){
    const preview=$("attachmentPreview"), img=$("attachmentThumb");
    if(!preview||!img)return;
    preview.style.display="flex"; $("attachmentName").textContent=file.name; $("attachmentHint").textContent="Image selected · it stays out of the text message";
    const r=new FileReader(); r.onload=()=>{img.src=r.result; window.avaniPendingImage=r.result}; r.readAsDataURL(file);
  }
  function clearAttachmentPreview(){window.avaniPendingImage=null; const p=$("attachmentPreview"); if(p)p.style.display="none"; const fi=$("fileInput"); if(fi)fi.value="";}

  async function sendImageToVision(file){
    if(!file)return;
    const r=new FileReader();
    r.onload=async()=>{
      const data=r.result;
      try{
        const response=await fetch(`${API_URL}/api/vision`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({image:data,question:"Analyze this uploaded image. Describe what is visible, read useful text if possible, identify important details, and suggest what I can do next."})});
        const d=await response.json().catch(()=>({}));
        if(!response.ok) throw Error(d.error||`Vision error ${response.status}`);
        if(typeof window.showView==="function")window.showView("chat");
        if(typeof window.renderMessage==="function")window.renderMessage(`Image analysis:\n\n${d.reply||"No analysis returned."}`,"ai");
        clearAttachmentPreview();
      }catch(e){toast(`Image analysis failed: ${e.message}`)}
    };
    r.readAsDataURL(file);
  }

  function patchFileInput(){
    const fi=$("fileInput"); if(!fi)return;
    fi.onchange=async e=>{
      const files=[...e.target.files].slice(0,8);
      if(!files.length)return;
      const image=files.find(f=>f.type.startsWith("image/")||/\.(png|jpe?g|webp|gif)$/i.test(f.name));
      if(image){
        if(image.size>8*1024*1024)return toast("Image must be under 8MB");
        showAttachment(image);
        return;
      }
      if(typeof window.showView==="function")window.showView("files");
      const input=$("toolFileInput");
      if(input){
        const dt=new DataTransfer(); files.forEach(f=>dt.items.add(f)); input.files=dt.files; input.dispatchEvent(new Event("change",{bubbles:true}));
      }
    };
  }

  function patchMic(){
    const m=$("micButton"); if(!m)return;
    m.onclick=()=>{
      if(typeof window.requireUser==="function"&&!window.requireUser())return;
      const start=$("voiceStart");
      if(start){start.click();toast("Listening…");return;}
      toast("Voice input is not supported in this browser");
    };
  }

  document.addEventListener("DOMContentLoaded",()=>{
    injectMobileCSS(); ensureChatControls(); patchFileInput(); patchMic();
    setTimeout(()=>{ensureChatControls();patchFileInput();patchMic()},250);
  });
})();
