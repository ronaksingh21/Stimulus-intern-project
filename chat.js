

// chat.js  – Phase‑3+ Enhancements  (v2  – quick‑reply fix)
// -----------------------------------------------------------------------------
//  ▸ Adds visible quick‑reply buttons underneath the scrolling chatbox.
//  ▸ Places the <div class="quick-replies"> *outside* the scroll area so it’s
//    always on screen, and applies basic styling via JS‑injected CSS classnames.
// -----------------------------------------------------------------------------
(function () {
    console.log("test");

    /* ========== DOM CACHE ========== */
    const chatbotToggler = document.querySelector('.chatbot-toggler');
    const closeBtn       = document.querySelector('.close-btn');
    const chatbot        = document.querySelector('.chatbot');  // container
    const chatbox        = document.querySelector('.chatbox');   // scroll area
    const chatInput      = document.querySelector('.chat-input textarea');
    const sendChatBtn    = document.querySelector('.chat-input span');
    const inputInitH     = chatInput.scrollHeight;

     /* ---------- CONVERSATION MEMORY ---------- */
    const MAX_HISTORY = 12;          // how many previous turns to keep
    const conversation = [];         // will hold { role, content } objects
    let userMessage = '';
    /* ========== CONFIG ========== */
    const QUICK_OPTIONS = [
      { label: 'About',      query: 'about us'            },
      { label: 'Services',   query: 'our services'        },
      { label: 'Contact',    query: 'contact us'          },
      { label: 'Free Call',  query: 'free consultation'   }
    ];
 
    /* ========== STATE MACHINE ========== */
    const state = { currentTopic: null, awaiting: null };
    /* ========== PRE DEFINED Q & A ========== */
    const predefinedQA = {
        "founder": "STIMULUS was founded by Ms. Anusha K.",
        "who is the founder": "STIMULUS was founded by Ms. Anusha K.",
        "who is the founder of stimulus": "STIMULUS was founded by Ms. Anusha K.",
        "about us":       `Go to our <a href="https://stimulus.org.in/about"   target="_blank">About page</a>.`,
        "our services":   `See the <a href="https://stimulus.org.in/services" target="_blank">Services page</a>.`,
        "contact us":     `Use the <a href="https://stimulus.org.in/contact"  target="_blank">Contact page</a>.`,
        "free consultation": `Request a free consultation <a href="https://stimulus.org.in/contact" target="_blank">here</a>.`,
        "default":        "I'm here to help you learn about STIMULUS. Ask about services, contact info, or request a free consultation!"
        
      };
      fetch('answers.json')
  .then(r => r.json())
  .then(json => Object.assign(predefinedQA, json))
  .catch(() => console.warn('answers.json missing – limited fallback answers'));

    const keywordMap = {
              consulting: ["business consulting", "consulting services", "consultation"],
              recruitment: ["recruitment", "hiring", "job opportunities", "talent"],
              advisory: ["business advisory", "advisory services", "advisory"],
              contact: ["contact", "email", "phone", "reach", "get in touch"],
              location: ["location", "address", "office", "where"],
              website: ["website", "site", "web", "online"],
              founder: ["founder", "anusha", "leader", "ceo"],
              services: ["services", "what do you do", "offerings"],
              success: ["success", "rate", "achievements", "results"],
              consultation: ["consultation", "free", "meeting", "discuss"]
            };
        
 
    
 
    
    const scrollBottom = () => chatbox.scrollTo({top:chatbox.scrollHeight,behavior:'smooth'});
 
    const createChatLi = (msg,cls) => {
      const li = document.createElement('li');
      li.className = `chat ${cls}`;
      li.innerHTML = cls==='outgoing'
        ? '<p></p>'
        : '<span class="material-symbols-outlined">smart_toy</span><p></p>';
      li.querySelector('p').innerHTML = msg;
      return li;
    };
 
    const showTypingIndicator = () => {
      const li = document.createElement('li');
      li.className = 'chat incoming';
      li.innerHTML = '<span class="material-symbols-outlined">smart_toy</span><div class="typing-indicator"><div class="typing-dots"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div></div>';
      chatbox.appendChild(li); scrollBottom(); return li;
    };
 
    /* ---------- QUICK‑REPLY UI  (always visible) ---------- */
    function removeQuickReplies () {
      const old = chatbot.querySelector('.quick-replies');
      if (old) old.remove();
    }
 
    function renderQuickReplies () {
      removeQuickReplies();
      const wrap = document.createElement('div');
      wrap.className = 'quick-replies';
      QUICK_OPTIONS.forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button'; btn.textContent = opt.label;
        btn.addEventListener('click', () => { chatInput.value = opt.query; handleChat(); });
        wrap.appendChild(btn);
      });
      chatbot.insertBefore(wrap, chatbot.querySelector('.chat-input')); // right above input
    }
 
    /* ---------- FALLBACK ANSWER ---------- */
    function findResponse (input) {
        const lower = input.toLowerCase().trim();
      
        // Exact phrase match first
        for (const [k, v] of Object.entries(predefinedQA))
          if (lower.includes(k)) return v;
      
        // Keyword category match
        for (const [cat, kws] of Object.entries(keywordMap))
          for (const kw of kws)
            if (lower.includes(kw))
              for (const [k, v] of Object.entries(predefinedQA))
                if (k.includes(cat)) return v;
      
        return predefinedQA.default;
      }
      
    /* ────────────  ❶  PREDEFINED Q & A  ──────────── */

  
  function qaBlock () {
    return Object.entries(predefinedQA)
      .map(([q, a]) => `Q: ${q}\nA: ${a}`)
      .join('\n');
  }

  function buildMessages(userText) {
    const systemPrompt = `
  You are STIMULUS’s AI assistant.
  
  RULES
  • Whenever you mention these URLs, wrap them in <a target="_blank">…</a> links:
    – https://stimulus.org.in/about
    – https://stimulus.org.in/services
    – https://stimulus.org.in/contact
    – the Kolhapur & Gurugram Google-maps addresses
  • Never output a bare URL.
  
  Reference Q & A:
  ${qaBlock()}
    `.trim();
 
    // keep only the most recent MAX_HISTORY turns
    const history = conversation.slice(-MAX_HISTORY);
    return [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userText }
    ];
  }

    /* ---------- AI BACKEND CALL (proxy) ---------- */
    async function aiCall(text) {
  console.log('>>> aiCall via proxy with:', text);

  const res = await fetch('http://localhost:3000/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: buildMessages(text) })
  });

  if (!res.ok) throw new Error(`Proxy error ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

      
      
      renderQuickReplies();
      console.log('Chatbot v2 loaded');
 

      function isExactMatch(userInput) {
        const lower = userInput.toLowerCase().trim();
        return Object.keys(predefinedQA).some(k => k === lower);
      }
      
    /* ---------- SEND GPT FIRST  ---------- */
    async function generateResponse(typingLi) {
        const quick = findResponse(userMessage);
      
        /* ───── take local answer ONLY on exact match ───── */
        if (isExactMatch(userMessage)) {
          typingLi.replaceWith(createChatLi(quick,'incoming'));
          conversation.push({role:'user',content:userMessage});
          conversation.push({role:'assistant',content:quick});
          renderQuickReplies();
          return;                   // ← skip GPT
        }
  try {
    const ai = await aiCall(userMessage);
    if (!ai.trim()) throw new Error('Empty');
    conversation.push({role:'user',content:userMessage});
    conversation.push({role:'assistant',content:ai});
    typingLi.replaceWith(createChatLi(ai.trim(),'incoming'));
  } catch (err) {
    const fb = findResponse(userMessage);
    conversation.push({role:'user',content:userMessage});
    conversation.push({role:'assistant',content:fb});
    typingLi.replaceWith(createChatLi(fb,'incoming'));
  } finally {
    renderQuickReplies();
  }
}



    /* ---------- STATE UPDATE ---------- */
    function updateState (msg) {
      if (/projects?/i.test(msg)) { state.currentTopic='projects'; state.awaiting='projectType'; }
      else if (state.awaiting==='projectType') {
        if (/live|ongoing/i.test(msg)) userMessage='Show me live projects';
        else if (/complete|past/i.test(msg)) userMessage='Show me completed projects';
        state.awaiting=null;
      }
    }
 
    /* ---------- SEND HANDLER ---------- */
    function handleChat () {
      userMessage = chatInput.value.trim(); if (!userMessage) return;
      updateState(userMessage); removeQuickReplies();
      chatInput.value=''; chatInput.style.height=`${inputInitH}px`;
      chatbox.appendChild(createChatLi(userMessage,'outgoing')); scrollBottom();
      const typingLi = showTypingIndicator();
      setTimeout(()=>generateResponse(typingLi),500);
    }
 
    /* ========== EVENTS ========== */
    chatInput.addEventListener('input',()=>{ chatInput.style.height=`${inputInitH}px`; chatInput.style.height=`${chatInput.scrollHeight}px`; });
    chatInput.addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey&&window.innerWidth>800){ e.preventDefault(); handleChat(); } });
    sendChatBtn.addEventListener('click',handleChat);
    closeBtn.addEventListener('click',()=>document.body.classList.remove('show-chatbot'));
    chatbotToggler.addEventListener('click',()=>document.body.classList.toggle('show-chatbot'));
  })();
 

