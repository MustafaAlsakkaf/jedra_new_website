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
    const label = submit.textContent;
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
      const data = new FormData(form);
      data.append('access_key', form.dataset.key);
      data.append('subject', `${form.dataset.subject} | ${data.get('lead_type') || ''}`);
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
        track('generate_lead', { form_name: form.dataset.lead, lead_type: data.get('lead_type') || '' });
        form.reset();
      } catch (err) {
        status.textContent = form.dataset.error;
        status.className = 'form-status err';
      } finally {
        submit.disabled = false;
        submit.textContent = label;
      }
    });
  });
})();
