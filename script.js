const input=document.getElementById("userInput");
const messages=document.getElementById("messages");
const API_URL="https://avani-ai-q7mq.onrender.com/api/chat";
let chats=JSON.parse(localStorage.getItem("avaniChats"))||[];
let currentChatId=localStorage.getItem("avaniCurrentChat")||null;
let memory=JSON.parse(localStorage.getItem("avaniMemory"))||[];
let voiceReplies=localStorage.getItem("avaniVoice")==="true";
let quickPrompts=localStorage.getItem("avaniQuickPrompts")!=="false";
let recognition=null;
let userProfile=JSON.parse(localStorage.getItem("avaniUserProfile"))||null;
const $=id=>document.getElementById(id);

function saveProfile(){localStorage.setItem("avaniUserProfile",JSON.stringify(userProfile))}
function saveChats(){localStorage.setItem("avaniChats",JSON.stringify(chats));localStorage.setItem("avaniCurrentChat",currentChatId||"")}
function escapeHTML(text){const d=document.createElement("div");d.textContent=String(text??"");return d.innerHTML}
function getCurrentChat(){return chats.find(c=>c.id===currentChatId)}
function showToast(text){const toast=$("toast");if(!toast)return;toast.textContent=text;toast.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove("show"),2400)}
function showModal(id){const el=$(id);if(el)el.hidden=false}
function closeModal(id){const el=$(id);if(el)el.hidden=true}
function welcomeHTML(){return `<div class="welcome"><div class="welcome-avatar">A</div><span class="welcome-badge">✦ NEXT-GEN AI WORKSPACE</span><h1>Hi, I'm Avani 👋</h1><p>Ask questions, write, code, plan projects, explore ideas and learn step by step.</p></div>`}
function createNewChat(){const chat={id:Date.now().toString(),title:"New Chat",messages:[]};chats.unshift(chat);currentChatId=chat.id;saveChats();renderChat();renderChatHistory();input.focus();closeSidebar()}
function renderChat(){const chat=getCurrentChat();messages.innerHTML=chat&&chat.messages.length?"":welcomeHTML();if(chat)chat.messages.forEach(m=>addMessage(m.text,m.sender,false,m.avatar));messages.scrollTop=messages.scrollHeight}
function addMessage(text,sender="ai",save=true,avatar=null){const message=document.createElement("div");message.className=`message ${sender}`;const content=document.createElement("div");content.className="message-content";const avatarEl=document.createElement("div");avatarEl.className="message-avatar";if(sender==="user"){avatarEl.textContent=avatar?"":"👤";if(avatar){avatarEl.style.backgroundImage=`url("${avatar.replace(/"/g,"%22")}")`;avatarEl.textContent=""}}else{avatarEl.textContent="A"}message.append(avatarEl,content);content.textContent=String(text??"");messages.appendChild(message);messages.scrollTop=messages.scrollHeight;if(save){const chat=getCurrentChat();if(!chat)return;chat.messages.push({text:String(text??""),sender,time:new Date().toISOString(),avatar});if(sender==="user"&&chat.title==="New Chat")chat.title=text.length>32?text.slice(0,32)+"…":text;saveChats();renderChatHistory()}return message}
function renderChatHistory(){const list=$("historyList");if(!list)return;list.innerHTML="";if(!chats.length){list.innerHTML='<div class="empty-memory">No chats yet</div>';return}chats.slice(0,12).forEach(chat=>{const item=document.createElement("div");item.className=`history-item ${chat.id===currentChatId?"active":""}`;item.innerHTML=`<span>💬</span><span class="history-name">${escapeHTML(chat.title)}</span><button class="delete-chat" title="Delete chat">×</button>`;item.onclick=e=>{if(e.target.closest(".delete-chat")){deleteChat(chat.id);return}currentChatId=chat.id;saveChats();renderChat();renderChatHistory();closeSidebar()};list.appendChild(item)})}
function deleteChat(id){if(!confirm("Delete this chat?"))return;chats=chats.filter(c=>c.id!==id);if(currentChatId===id)currentChatId=chats[0]?.id||null;saveChats();renderChat();renderChatHistory()}
function detectMemory(text){const patterns=[/my name is\s+(.+)/i,/mera naam\s+(.+)/i,/i like\s+(.+)/i,/mujhe pasand\s+(.+)/i,/my favorite\s+(.+)/i,/mera favourite\s+(.+)/i];for(const p of patterns){const m=text.match(p);if(m){const value=m[1].trim().replace(/[.!?]+$/,'');if(value&&value.length<100&&!memory.includes(value)){memory.unshift(value);memory=memory.slice(0,20);localStorage.setItem("avaniMemory",JSON.stringify(memory))}}}}
function renderMemory(){const list=$("memoryList");if(!list)return;if(!memory.length){list.innerHTML='<div class="empty-memory">No saved memories yet.</div>';return}list.innerHTML=memory.map(x=>`<div class="memory-item">🧠 ${escapeHTML(x)}</div>`).join("")}
function speak(text){if(!voiceReplies||!("speechSynthesis"in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);const voices=speechSynthesis.getVoices();const female=voices.find(v=>/female|zira|samantha|google uk english female|google us english/i.test(`${v.name} ${v.voiceURI}`))||voices.find(v=>/^en|^hi/i.test(v.lang));if(female)u.voice=female;u.rate=.96;u.pitch=1.08;speechSynthesis.speak(u)}
function setupSpeech(){if(!("webkitSpeechRecognition"in window||"SpeechRecognition"in window))return;const SR=window.SpeechRecognition||window.webkitSpeechRecognition;recognition=new SR();recognition.lang="hi-IN";recognition.interimResults=false;recognition.onstart=()=>$("micButton").classList.add("recording");recognition.onend=()=>$("micButton").classList.remove("recording");recognition.onerror=()=>$("micButton").classList.remove("recording");recognition.onresult=e=>{input.value=e.results[0][0].transcript;resizeInput();input.focus()}}
function buildHistory(){const chat=getCurrentChat();if(!chat)return[];return chat.messages.slice(-24).map(m=>({role:m.sender==="user"?"user":"assistant",content:String(m.text||"")}))}
function setChatLocked(locked){input.disabled=locked;$("sendButton").disabled=locked;$("attachButton").disabled=locked;$("inputBox").classList.toggle("locked",locked);input.placeholder=locked?"Sign in to chat with Avani...":"Message Avani..."}
async function sendMessage(){const text=input.value.trim();if(!text)return;if(!userProfile){openAuth();showToast("Sign in to start chatting");return}if(!getCurrentChat())createNewChat();const history=buildHistory();addMessage(text,"user",true,userProfile.photo);input.value="";resizeInput();input.disabled=true;$("sendButton").disabled=true;const thinking=addMessage("Avani is thinking…","ai",false);try{const response=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:text,history})});let data={};try{data=await response.json()}catch{}if(!response.ok)throw new Error(data.error||`Server error (${response.status})`);thinking.remove();const reply=data.reply||data.message||"I couldn't generate a reply.";addMessage(reply,"ai");detectMemory(text);speak(reply)}catch(error){thinking.remove();addMessage(`I couldn't connect to Avani right now. ${error.message||"Please try again."}`,"ai");showToast("AI connection failed")}finally{input.disabled=false;$("sendButton").disabled=false;input.focus()}}
function resizeInput(){input.style.height="auto";input.style.height=Math.min(input.scrollHeight,150)+"px"}
function openAuth(edit=false){if(edit&&userProfile){$("profileName").value=userProfile.name||"";$("profileEmail").value=userProfile.email||"";$("profilePhoto").value="";setPreview(userProfile.photo,userProfile.name)}else{$("profileName").value="";$("profileEmail").value="";$("profilePhoto").value="";setPreview(null,"")}showModal("authModal");setTimeout(()=>$("profileName")?.focus(),40)}
function setPreview(photo,name){const el=$("profilePreview");if(!el)return;if(photo){el.style.backgroundImage=`url("${photo.replace(/"/g,"%22")}")`;el.textContent=""}else{el.style.backgroundImage="none";el.textContent=(name||"?").charAt(0).toUpperCase()}}
function saveUserProfile(){const name=$("profileName").value.trim();const email=$("profileEmail").value.trim();const photo=$("profilePhoto").files[0];if(!name){showToast("Please enter your name");$("profileName").focus();return}if(email&&(!/^\S+@\S+\.\S+$/.test(email))){showToast("Please enter a valid email");$("profileEmail").focus();return}const finish=data=>{userProfile={name,email,photo:data||userProfile?.photo||null};saveProfile();closeModal("authModal");updateProfileUI();setChatLocked(false);if(!getCurrentChat())createNewChat();showToast(`Welcome, ${name} 👋`)};if(photo){if(!photo.type.startsWith("image/")||photo.size>4*1024*1024){showToast("Choose an image under 4MB");return}const r=new FileReader();r.onload=()=>finish(r.result);r.readAsDataURL(photo)}else finish(null)}
function updateProfileUI(){const nameEl=$("userName"),avatar=$("userAvatar"),status=$("userStatus");if(!nameEl||!avatar)return;if(userProfile){nameEl.textContent=userProfile.name||"User";status.textContent=userProfile.email||"Signed in locally";avatar.textContent="";avatar.style.backgroundImage=userProfile.photo?`url("${userProfile.photo.replace(/"/g,"%22")}")`:"none";if(!userProfile.photo)avatar.textContent=(userProfile.name||"U").charAt(0).toUpperCase();updateProfileModal()}else{nameEl.textContent="Guest";status.textContent="Sign in to continue";avatar.style.backgroundImage="none";avatar.textContent="?"}}
function updateProfileModal(){if(!userProfile)return;$("profileBigName").textContent=userProfile.name||"User";$("profileBigEmail").textContent=userProfile.email||"Local profile";const el=$("profileBigAvatar");el.style.backgroundImage=userProfile.photo?`url("${userProfile.photo.replace(/"/g,"%22")}")`:"none";el.textContent=userProfile.photo?"":(userProfile.name||"U").charAt(0).toUpperCase()}
function logout(){userProfile=null;localStorage.removeItem("avaniUserProfile");closeModal("profileModal");updateProfileUI();setChatLocked(true);showToast("Signed out");setTimeout(()=>openAuth(),180)}
function closeSidebar(){$("sidebar")?.classList.remove("open");$("mobileOverlay")?.classList.remove("show")}
function toggleTheme(enabled){document.body.classList.toggle("light-mode",enabled);localStorage.setItem("avaniLight",enabled?"true":"false")}
function applySettings(){const light=localStorage.getItem("avaniLight")==="true";toggleTheme(light);$("themeToggle").checked=light;$("quickPromptToggle").checked=quickPrompts;$("voiceSettingToggle").checked=voiceReplies;$("quickPrompts").style.display=quickPrompts?"flex":"none"}
function studioPrompt(type){const prompts={image:"Create a detailed AI image prompt for this idea. Include subject, environment, lighting, camera, composition, style and negative prompt.",video:"Create a cinematic AI video prompt for this idea. Include scene, camera movement, subject motion, lighting, duration and transition.",code:"Act as my senior coding assistant. Review the code/problem I provide, find the bug, explain it simply and give the corrected code.",write:"Act as my professional writing assistant. Turn my idea into polished, natural, ready-to-use content with a strong opening and clear structure."};return prompts[type]||prompts.write}

document.addEventListener("DOMContentLoaded",()=>{
  if(!currentChatId&&chats.length)currentChatId=chats[0].id;
  renderChat();renderChatHistory();updateProfileUI();setChatLocked(!userProfile);setupSpeech();applySettings();
  if(!userProfile)setTimeout(()=>openAuth(),250);
  $("newChatButton").onclick=()=>{if(!userProfile){openAuth();return}createNewChat()};
  $("sendButton").onclick=sendMessage;
  $("attachButton").onclick=()=>{if(!userProfile){openAuth();return}$("fileInput").click()};
  $("fileInput").onchange=()=>{const f=$("fileInput").files[0];if(!f)return;if(f.size>2*1024*1024){showToast("Please choose a file under 2MB");return}const reader=new FileReader();reader.onload=()=>{input.value=`Please analyze this file:\n\n${String(reader.result).slice(0,30000)}`;resizeInput();input.focus()};reader.readAsText(f)};
  $("micButton").onclick=()=>{if(!userProfile){openAuth();return}if(recognition){try{recognition.start()}catch{}}else showToast("Voice input is not supported in this browser")};
  $("voiceToggle").onclick=()=>{voiceReplies=!voiceReplies;localStorage.setItem("avaniVoice",voiceReplies);$("voiceToggle").textContent=voiceReplies?"🔊":"🔇";$("voiceToggle").classList.toggle("active",voiceReplies);if(voiceReplies)speak("Voice replies are on.")};
  $("voiceToggle").textContent=voiceReplies?"🔊":"🔇";$("voiceToggle").classList.toggle("active",voiceReplies);
  $("memoryNav").onclick=()=>{renderMemory();showModal("memoryModal")};
  $("settingsNav").onclick=()=>{applySettings();showModal("settingsModal")};
  $("studioNav").onclick=()=>showModal("studioModal");
  $("chatNav").onclick=()=>closeSidebar();
  $("sidebarToggle").onclick=()=>{$("sidebar").classList.add("open");$("mobileOverlay").classList.add("show")};
  $("mobileOverlay").onclick=closeSidebar;
  $("clearChatButton").onclick=()=>{const c=getCurrentChat();if(c){c.messages=[];c.title="New Chat";saveChats();renderChat();renderChatHistory();showToast("Chat cleared")}};
  $("clearMemoryButton").onclick=()=>{memory=[];localStorage.removeItem("avaniMemory");renderMemory();showToast("Memory cleared")};
  $("saveProfileButton").onclick=saveUserProfile;
  $("profileButton").onclick=()=>{if(userProfile){updateProfileModal();showModal("profileModal")}else openAuth()};
  $("editProfileButton").onclick=()=>{closeModal("profileModal");openAuth(true)};
  $("logoutButton").onclick=logout;
  $("authCloseButton").onclick=()=>{if(userProfile)closeModal("authModal")};
  $("themeToggle").onchange=e=>toggleTheme(e.target.checked);
  $("quickPromptToggle").onchange=e=>{quickPrompts=e.target.checked;localStorage.setItem("avaniQuickPrompts",quickPrompts);applySettings()};
  $("voiceSettingToggle").onchange=e=>{voiceReplies=e.target.checked;localStorage.setItem("avaniVoice",voiceReplies);$("voiceToggle").textContent=voiceReplies?"🔊":"🔇";$("voiceToggle").classList.toggle("active",voiceReplies)};
  document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
  document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m&&m.id!=="authModal")m.hidden=true}));
  document.querySelectorAll("[data-prompt]").forEach(b=>b.onclick=()=>{if(!userProfile){openAuth();return}input.value=b.dataset.prompt;resizeInput();input.focus()});
  document.querySelectorAll("[data-studio]").forEach(b=>b.onclick=()=>{const text=studioPrompt(b.dataset.studio);$("studioOutput").textContent="Prompt ready — click below to send it to Avani.";const old=$("studioOutput").querySelector("button");if(old)old.remove();const send=document.createElement("button");send.className="secondary-button";send.type="button";send.textContent="Use this workflow in chat";send.style.marginTop="10px";send.onclick=()=>{if(!userProfile){openAuth();return}closeModal("studioModal");input.value=text;resizeInput();input.focus()};$("studioOutput").appendChild(send)});
  $("profilePhoto").onchange=()=>{const f=$("profilePhoto").files[0];if(f&&f.size<=4*1024*1024){const r=new FileReader();r.onload=()=>setPreview(r.result,$("profileName").value);r.readAsDataURL(f)}else if(f)showToast("Choose an image under 4MB")};
  $("profileName").oninput=e=>{if(!$("profilePhoto").files.length&&!userProfile)setPreview(null,e.target.value)};
  input.addEventListener("input",resizeInput);
  input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage()}});
});
