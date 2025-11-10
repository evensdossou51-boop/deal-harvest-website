// Voice Search Widget for DealHarvest
(function(){
  'use strict';

  const avatar = document.getElementById('ai-avatar');
  const results = document.getElementById('ai-results');
  if (!avatar || !results) return; // Abort if containers not present

  // Helpers
  function escapeHtml(str){
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }
  function logEvent(name, params){
    try { if (typeof window.gtag === 'function') { window.gtag('event', name, params || {}); } } catch(_){}
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const supportsSpeech = !!SpeechRecognition;
  const supportsTTS = !!window.speechSynthesis;
  let recognition = null;

  if (supportsSpeech) {
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
  }

  function speak(text){
    if (!supportsTTS) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch(err) { console.warn('TTS error', err); }
  }

  function showResults(html){
    results.innerHTML = html;
    results.hidden = false;
  }
  function hideResults(){
    results.hidden = true;
    results.innerHTML = '';
  }
  function setLoading(loading){
    avatar.classList.toggle('loading', !!loading);
  }

  function buildEbaySearchUrl(query){
    // Rely on EPN Smart Links to auto-monetize standard eBay links already included in index.html
    return 'https://www.ebay.com/sch/i.html?_nkw=' + encodeURIComponent(query);
  }

  function renderLink(query){
    const safeQ = escapeHtml(query);
    const container = document.createElement('div');
    container.className = 'ai-result-card';
    const title = document.createElement('div');
    title.className = 'ai-result-title';
    title.textContent = `Search results for "${safeQ}"`;
    const desc = document.createElement('div');
    desc.className = 'ai-result-desc';
    desc.textContent = 'Open in a new tab to view results on eBay';
    const link = document.createElement('a');
    link.className = 'ai-result-link';
    link.href = buildEbaySearchUrl(query);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Open eBay results';

    container.appendChild(title);
    container.appendChild(desc);
    container.appendChild(link);

    results.innerHTML = '';
    results.appendChild(container);
    results.hidden = false;
  }

  function startListening(){
    if (!supportsSpeech) { showTextFallback(); return; }
    try { recognition.abort(); } catch(_){}
    setLoading(true);
    speak('Hi! What are you looking for today?');
    logEvent('voice_avatar_start');
    try { recognition.start(); } catch(err) { setLoading(false); }
  }

  function stopListening(){
    if (recognition) { try { recognition.stop(); } catch(_){} }
    setLoading(false);
  }

  // Avatar interactions
  avatar.addEventListener('click', startListening);
  avatar.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startListening(); }
  });
  document.addEventListener('click', (e)=>{
    if (!results.contains(e.target) && !avatar.contains(e.target)) hideResults();
  });

  // Speech handlers
  if (recognition) {
    recognition.onresult = (event)=>{
      stopListening();
      const userQuery = (event.results && event.results[0] && event.results[0][0] && event.results[0][0].transcript) || '';
      if (!userQuery) { speak('Sorry, I did not catch that.'); return; }
      speak(`Let me find the best deals for ${userQuery} on eBay.`);
      logEvent('voice_avatar_query', { query_length: userQuery.length });
      renderLink(userQuery);
    };
    recognition.onend = ()=>{ setLoading(false); };
    recognition.onerror = (event)=>{
      console.warn('Speech recognition error:', event && event.error);
      setLoading(false);
      if (event && (event.error === 'not-allowed' || event.error === 'permission-denied')){
        speak('Microphone access is blocked. You can type your search instead.');
        showTextFallback();
      } else {
        speak('Sorry, I did not catch that. Try again or type your search.');
      }
      logEvent('voice_avatar_error', { error: event && event.error });
    };
  }

  function showTextFallback(){
    const html = [
      '<div class="ai-result-card">',
      '  <label for="aiTextInput" class="ai-result-title">Type your search</label>',
      '  <input id="aiTextInput" type="text" class="ai-text-input" placeholder="Search deals on eBay"/>',
      '  <div class="ai-actions">',
      '    <button id="aiTextSearchBtn" class="ai-btn">Search</button>',
      '  </div>',
      '</div>'
    ].join('');
    showResults(html);
    const btn = document.getElementById('aiTextSearchBtn');
    const input = document.getElementById('aiTextInput');
    if (btn && input){
      btn.addEventListener('click', ()=>{
        const q = (input.value || '').trim();
        if (!q) return;
        renderLink(q);
      });
      input.addEventListener('keydown',(e)=>{ if (e.key==='Enter'){ e.preventDefault(); btn.click(); }});
      input.focus();
    }
  }
})();
