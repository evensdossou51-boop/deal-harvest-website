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

  function searchLocalProducts(query){
    const q = query.toLowerCase();
    const matches = (window.ALL_PRODUCTS || []).filter(p =>
      p.name && p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))
    ).slice(0,6); // limit preview
    return matches;
  }

  function renderLocalResults(query){
    const safeQ = escapeHtml(query);
    const matches = searchLocalProducts(query);
    const container = document.createElement('div');
    container.className = 'ai-result-card';
    const title = document.createElement('div');
    title.className = 'ai-result-title';
    title.textContent = `Results on DealHarvest for "${safeQ}"`;
    const list = document.createElement('div');
    list.className = 'ai-result-list';
    if (matches.length === 0){
      list.innerHTML = '<div class="ai-empty">No matching products found.</div>';
    } else {
      list.innerHTML = matches.map(p => {
        const chips = [
          `<span class=\"chip chip-store\">${escapeHtml(p.store)}</span>`,
          p.category ? `<span class=\"chip chip-category\">${escapeHtml(p.category)}</span>` : ''
        ].join(' ');
        return `<button type=\"button\" class=\"ai-mini-product\" data-product-id=\"${p.id}\">🛒 ${escapeHtml(p.name.substring(0,50))}<div class=\"mini-meta\">${chips}</div></button>`;
      }).join('');
    }
    const actions = document.createElement('div');
    actions.className = 'ai-actions';
    const applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.className = 'ai-btn';
    applyBtn.textContent = 'Filter Page';
    applyBtn.addEventListener('click', ()=> {
      try {
        const searchInput = document.querySelector('#searchForm .search-input');
        if (searchInput){ searchInput.value = query; }
        if (window.currentFilters){ window.currentFilters.search = query; }
        if (typeof window.applyFiltersAndRender === 'function'){ window.applyFiltersAndRender(); }
        speak(`Filtering products for ${query}`);
        logEvent('voice_avatar_result_apply', { query_length: query.length });
        highlightFirstResult(matches);
      } catch(err){ console.warn('Filter apply error', err); }
    });
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'ai-btn secondary';
    clearBtn.textContent = 'Clear';
    clearBtn.addEventListener('click', ()=> {
      const searchInput = document.querySelector('#searchForm .search-input');
      if (searchInput){ searchInput.value=''; }
      if (window.currentFilters){ window.currentFilters.search=''; }
      if (typeof window.applyFiltersAndRender === 'function'){ window.applyFiltersAndRender(); }
      hideResults();
    });
    actions.appendChild(applyBtn);
    actions.appendChild(clearBtn);
    container.appendChild(title);
    container.appendChild(list);
    container.appendChild(actions);
    results.innerHTML='';
    results.appendChild(container);
    results.hidden=false;
    // product button deep link
    results.querySelectorAll('.ai-mini-product').forEach(btn => {
      btn.addEventListener('click', ()=> {
        const pid = btn.getAttribute('data-product-id');
        const product = (window.ALL_PRODUCTS||[]).find(p=>String(p.id)===pid);
        if (product){ speak(product.name); }
        // Auto-apply when user taps a product
        const searchInput = document.querySelector('#searchForm .search-input');
        if (searchInput){ searchInput.value = query; }
        if (window.currentFilters){ window.currentFilters.search = query; }
        if (typeof window.applyFiltersAndRender === 'function'){ window.applyFiltersAndRender(); }
        highlightFirstResult([product]);
      });
    });
    // Auto-apply immediately (user can still Clear)
    const searchInput = document.querySelector('#searchForm .search-input');
    if (searchInput){ searchInput.value = query; }
    if (window.currentFilters){ window.currentFilters.search = query; }
    if (typeof window.applyFiltersAndRender === 'function'){ window.applyFiltersAndRender(); }
    highlightFirstResult(matches);
  }

  function highlightFirstResult(list){
    if (!list || list.length === 0) return;
    const first = list[0];
    // Wait a tick for DOM render
    setTimeout(()=>{
      const card = document.querySelector(`.product-card .product-name`);
      // naive scroll to top; could refine to actual matched card
      if (card){ window.scrollTo({ top: card.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' }); }
      // temporary highlight effect
      const grid = document.getElementById('productsGrid');
      if (grid){ grid.classList.add('voice-highlight'); setTimeout(()=> grid.classList.remove('voice-highlight'), 1500); }
    }, 150);
  }

  // Microphone consent persistence
  const MIC_CONSENT_KEY = 'dealharvest_mic_consent';
  function getMicConsent(){ try { return localStorage.getItem(MIC_CONSENT_KEY) === 'granted'; } catch(_) { return false; } }
  function setMicConsent(){ try { localStorage.setItem(MIC_CONSENT_KEY, 'granted'); } catch(_){} logEvent('voice_avatar_mic_consent'); }
  function requestMicConsent(){
    const existing = document.getElementById('micConsentDialog');
    if (existing) return;
    const dlg = document.createElement('div');
    dlg.id = 'micConsentDialog';
    dlg.className = 'ai-mic-dialog';
    dlg.innerHTML = '<div class="ai-mic-dialog-inner">\n      <h3>Enable Voice Search?</h3>\n      <p>DealHarvest will access your microphone locally to capture a short search phrase. No audio is sent to our servers.</p>\n      <div class="ai-mic-actions">\n        <button type="button" class="ai-btn" id="micAllowBtn">Allow</button>\n        <button type="button" class="ai-btn secondary" id="micCancelBtn">Cancel</button>\n      </div>\n    </div>';
    document.body.appendChild(dlg);
    document.getElementById('micAllowBtn').addEventListener('click', ()=>{ setMicConsent(); dlg.remove(); startListening(); });
    document.getElementById('micCancelBtn').addEventListener('click', ()=>{ dlg.remove(); speak('Voice search cancelled. You can enable it anytime.'); });
  }
  function startListening(){
    if (!supportsSpeech) { showTextFallback(); return; }
    if (!getMicConsent()){ requestMicConsent(); return; }
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

  // Consent tooltip on first hover/focus
  let consentShown = false;
  function showConsentNotice(){
    if (consentShown) return;
    consentShown = true;
    const notice = document.createElement('div');
    notice.className = 'ai-consent-notice';
    notice.innerHTML = '<strong>Voice Search</strong><br>We use your microphone in your browser to capture a short search phrase. Audio is not sent to our servers.';
    document.body.appendChild(notice);
    requestAnimationFrame(()=> notice.classList.add('visible'));
    setTimeout(()=>{ notice.classList.remove('visible'); setTimeout(()=> notice.remove(), 400); }, 6000);
  }
  avatar.addEventListener('pointerenter', showConsentNotice);
  avatar.addEventListener('focus', showConsentNotice);
  // If consent already granted, skip tooltip.
  if (getMicConsent()) consentShown = true;

  // Speech handlers
  if (recognition) {
    recognition.onresult = (event)=>{
      stopListening();
      const userQuery = (event.results && event.results[0] && event.results[0][0] && event.results[0][0].transcript) || '';
      if (!userQuery) { speak('Sorry, I did not catch that.'); return; }
  speak(`Searching DealHarvest for ${userQuery}.`);
  logEvent('voice_avatar_query', { query_length: userQuery.length });
  renderLocalResults(userQuery);
    };
    recognition.onend = ()=>{ setLoading(false); };
    let failureCount = 0;
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
      failureCount++;
      if (failureCount >= 3) {
        avatar.classList.add('disabled');
        avatar.setAttribute('aria-disabled','true');
        avatar.title = 'Voice search temporarily disabled due to repeated errors.';
      }
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
  // Public helper to reset disabled state
  window.resetVoiceAvatarFailures = function(){
    const cls = 'disabled';
    avatar.classList.remove(cls);
    avatar.removeAttribute('aria-disabled');
    avatar.title = '';
  };
})();
