(() => {
  const dl = (window.dataLayer = window.dataLayer || []);
  const track = (event, data = {}) => dl.push({ event, ...data });

  // Mobile menu
  const btn = document.querySelector('.menu-btn');
  if (btn) {
    const setOpen = (open) => {
      document.body.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? btn.dataset.close : btn.dataset.open);
    };
    btn.addEventListener('click', () => setOpen(!document.body.classList.contains('menu-open')));
    document.querySelectorAll('.mobile-nav a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => e.key === 'Escape' && setOpen(false));
  }

  // Home hero: rotate through the available projects; pause on hover or focus; no autoplay for reduced motion
  document.querySelectorAll('[data-slides]').forEach((wrap) => {
    const slides = [...wrap.querySelectorAll('.slide')];
    const dots = [...wrap.querySelectorAll('.slide-dots button')];
    if (slides.length < 2) return;
    let i = 0;
    let timer = null;
    const show = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => {
        const on = k === i;
        s.classList.toggle('is-active', on);
        if (on) { s.removeAttribute('aria-hidden'); s.removeAttribute('tabindex'); } else { s.setAttribute('aria-hidden', 'true'); s.setAttribute('tabindex', '-1'); }
      });
      dots.forEach((d, k) => (k === i ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current')));
    };
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const play = () => { if (!still) { clearInterval(timer); timer = setInterval(() => show(i + 1), 6000); } };
    const stop = () => clearInterval(timer);
    dots.forEach((d, k) => d.addEventListener('click', () => { show(k); play(); }));
    wrap.addEventListener('mouseenter', stop);
    wrap.addEventListener('mouseleave', play);
    wrap.addEventListener('focusin', stop);
    wrap.addEventListener('focusout', play);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : play()));
    play();
  });

  // "Talk to an advisor" buttons go to the form on the current page when there is one
  const pageForm = document.querySelector('.contact-split');
  if (pageForm) {
    const target = '#' + pageForm.closest('section').id;
    document.querySelectorAll('[data-to-form]').forEach((a) => { a.href = target; });
  }

  // Highlights rail arrows
  document.querySelectorAll('[data-rail]').forEach((wrap) => {
    const rail = wrap.querySelector('.rail');
    const [prev, next] = wrap.querySelectorAll('.rail-btn');
    const rtl = getComputedStyle(rail).direction === 'rtl';
    const step = () => rail.querySelector('.rail-card').getBoundingClientRect().width + 18;
    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth - 2;
      const pos = Math.abs(rail.scrollLeft);
      prev.disabled = pos <= 2;
      next.disabled = pos >= max;
    };
    const go = (dir) => rail.scrollBy({ left: dir * step() * (rtl ? -1 : 1), behavior: 'smooth' });
    prev.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    rail.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  // Keep campaign parameters for the whole visit so a lead keeps its source
  const params = new URLSearchParams(location.search);
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid', 'ttclid', 'sccid'];
  let campaign = {};
  try { campaign = JSON.parse(sessionStorage.getItem('jedra_campaign') || '{}'); } catch (e) { /* storage blocked */ }
  keys.forEach((k) => params.get(k) && (campaign[k] = params.get(k)));
  if (!campaign.landing_page) campaign.landing_page = location.pathname;
  if (!campaign.referrer && document.referrer) campaign.referrer = document.referrer;
  try { sessionStorage.setItem('jedra_campaign', JSON.stringify(campaign)); } catch (e) { /* storage blocked */ }

  // Remember what the visitor was looking at, so a general form opens on the right request type
  let context = '';
  const here = location.pathname.replace(/^\/en/, '');
  try {
    if (here.startsWith('/developers/')) sessionStorage.setItem('jedra_context', 'developer');
    else if (here.startsWith('/properties/') || here.startsWith('/international/')) sessionStorage.setItem('jedra_context', 'project');
    context = sessionStorage.getItem('jedra_context') || '';
  } catch (e) { /* storage blocked */ }

  // Calls and WhatsApp clicks, for ad conversion tracking in Google Tag Manager
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (href.startsWith('tel:')) track('click_call', { link_location: a.dataset.loc || 'page' });
    else if (href.includes('wa.me/')) track('click_whatsapp', { link_location: a.dataset.loc || 'page' });
  });

  // Lead forms
  document.querySelectorAll('form[data-lead]').forEach((form) => {
    const status = form.querySelector('.form-status');
    const submit = form.querySelector('button[type="submit"]');
    let label = submit.textContent;
    const keyOf = (n) => { const el = form.querySelector(`input[name="${n}"]:checked`); return el ? el.dataset.key : ''; };
    // Show only the fields that fit the chosen request type (and project choice)
    const syncType = () => {
      form.querySelectorAll('[data-when]').forEach((el) => {
        el.hidden = !el.dataset.when.split(';').every((c) => { const [n, v] = c.split('='); return v.split(' ').includes(keyOf(n)); });
      });
      const picked = form.querySelector('input[name="request_type"]:checked');
      if (picked && picked.dataset.submit && !submit.disabled) { label = picked.dataset.submit; submit.textContent = label; }
    };
    // Preselect from the link the visitor followed, e.g. /contact/?request=developer or ?project=bonsai
    const pre = (n, k) => { const el = k && form.querySelector(`input[name="${n}"][data-key="${CSS.escape(k)}"]`); if (el) el.checked = true; };
    // Otherwise, a general form takes the visitor's earlier interest in this visit (developer pages or projects)
    if (!params.get('request') && keyOf('request_type') === 'general') pre('request_type', context);
    pre('request_type', params.get('request'));
    // A campaign named after a project (utm_campaign=bonsai-...) preselects that project
    const camp = (campaign.utm_campaign || '').toLowerCase();
    if (keyOf('project') === 'help') form.querySelectorAll('input[name="project"]').forEach((el) => { if (el.dataset.key !== 'help' && camp.includes(el.dataset.key)) el.checked = true; });
    pre('project', params.get('project'));
    form.addEventListener('change', (e) => e.target.type === 'radio' && syncType());
    syncType();
    form.syncType = syncType;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phone = form.querySelector('input[name="phone"]');
      const digits = phone.value.replace(/[^\d]/g, '');
      if (digits.length < 9) {
        status.textContent = form.dataset.invalidPhone;
        status.className = 'form-status err';
        phone.focus();
        return;
      }
      const missing = [...form.querySelectorAll('[required]')].find((el) => !el.closest('[hidden]') && el.type !== 'checkbox' && !el.value.trim());
      if (missing && missing.name !== 'phone') {
        status.textContent = form.dataset.needFields;
        status.className = 'form-status err';
        missing.focus();
        return;
      }
      const consent = form.querySelector('input[name="consent"]');
      if (consent && !consent.checked) {
        status.textContent = form.dataset.needConsent;
        status.className = 'form-status err';
        consent.focus();
        return;
      }
      form.querySelectorAll('[data-when][hidden] input, [data-when][hidden] select').forEach((el) => { el.disabled = true; });
      const data = new FormData(form);
      form.querySelectorAll('[data-when] input, [data-when] select').forEach((el) => { el.disabled = false; });
      // Record the optional marketing choice either way, so "no" is documented too
      const marketing = form.querySelector('input[name="marketing_consent"]');
      if (marketing) data.set('marketing_consent', marketing.checked ? 'yes' : 'no');
      const type = data.get('request_type') || '';
      const typeKey = keyOf('request_type');
      data.append('access_key', form.dataset.key);
      data.append('subject', `${form.dataset.subject} | ${type}${data.get('project') ? ' | ' + data.get('project') : ''}`);
      data.append('from_name', 'JEDRA website');
      data.append('page', location.href);
      Object.entries(campaign).forEach(([k, v]) => data.append(k, v));
      submit.disabled = true;
      submit.textContent = form.dataset.sending;
      status.textContent = '';
      try {
        const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'failed');
        status.textContent = form.dataset.success;
        status.className = 'form-status ok';
        // Brochure requests get the file right after the lead is saved
        if (typeKey === 'brochure' && form.dataset.brochure) {
          status.textContent = form.dataset.brochureReady + ' ';
          const a = document.createElement('a');
          a.href = form.dataset.brochure; a.target = '_blank'; a.rel = 'noopener'; a.className = 'more';
          a.textContent = form.dataset.brochureLink;
          status.append(a);
          track('brochure_download', { project: data.get('project') || '' });
        }
        track('generate_lead', { form_name: form.dataset.lead, request_type: type, project: data.get('project') || '' });
        form.reset();
        syncType();
      } catch (err) {
        status.textContent = form.dataset.error;
        status.className = 'form-status err';
      } finally {
        submit.disabled = false;
        submit.textContent = label;
      }
    });
  });
  // Project filters (progressive: without script every project is shown)
  document.querySelectorAll('[data-filter-scope]').forEach((scope) => {
    const buttons = scope.querySelectorAll('.filter');
    buttons.forEach((b) => b.addEventListener('click', () => {
      buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const f = b.dataset.filter;
      scope.querySelectorAll('[data-group]').forEach((g) => { g.hidden = f !== 'all' && g.dataset.group !== f; });
    }));
  });

  // "Book a visit" buttons pre-select the visit option in the project form
  document.querySelectorAll('[data-pick]').forEach((a) => a.addEventListener('click', () => {
    const form = document.querySelector('#request form');
    const radio = form && form.querySelector(`input[name="request_type"][data-key="${a.dataset.pick}"]`);
    if (radio) { radio.checked = true; form.syncType(); }
  }));
})();
