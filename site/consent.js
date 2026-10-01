/* Maps 64: Google tag (Google Ads, AW-18487562500) with Consent Mode v2.
   Everything starts denied; a small bar asks once, and the choice is kept in localStorage
   (maps64.consent = granted | denied). Until a visitor accepts, Google only gets cookieless
   pings. Any element with [data-cookie-settings] reopens the bar. */
const GTAG_ID = 'AW-18487562500';
// set to true once the GDPR message in AdSense (Privacy & messaging) is published: Google's message
// then asks for consent (and sets Consent Mode itself), and this bar stays hidden
const USE_GOOGLE_CMP = false;

window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }

const Consent = {
  get(){ try { return localStorage.getItem('maps64.consent'); } catch (e) { return null; } },
  set(v){
    try { localStorage.setItem('maps64.consent', v); } catch (e) {}
    const g = v === 'granted' ? 'granted' : 'denied';
    gtag('consent', 'update', {ad_storage: g, ad_user_data: g, ad_personalization: g, analytics_storage: g});
    this.hide();
  },
  hide(){ document.getElementById('consentBar')?.remove(); },
  show(){
    if (document.getElementById('consentBar')) return;
    const bar = document.createElement('div'); bar.id = 'consentBar'; bar.setAttribute('role', 'dialog'); bar.setAttribute('aria-label', 'Cookies');
    bar.innerHTML = `<p>Maps 64 uses cookies from Google to measure its ads. <a href="privacy.html">Privacy</a></p>
      <div><button data-c="denied">Decline</button><button data-c="granted">Accept</button></div>`;
    bar.querySelectorAll('button').forEach(b => b.onclick = e => { e.stopPropagation(); this.set(b.dataset.c); });
    bar.addEventListener('keydown', e => e.stopPropagation());   // Space/Enter here never reach the game
    document.body.appendChild(bar);
  },
};

// defaults first, then the stored choice, then load the tag
gtag('consent', 'default', {ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', wait_for_update: 500});
{ const c = Consent.get(); if (c === 'granted' || c === 'denied') { const g = c === 'granted' ? 'granted' : 'denied'; gtag('consent', 'update', {ad_storage: g, ad_user_data: g, ad_personalization: g, analytics_storage: g}); } }
gtag('js', new Date());
gtag('config', GTAG_ID);
{ const s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GTAG_ID; document.head.appendChild(s); }

document.head.insertAdjacentHTML('beforeend', `<style>
#consentBar{position:fixed;left:50%;bottom:max(12px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:60;width:min(560px,calc(100% - 24px));display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:10px 12px 10px 14px;border:1px solid var(--acc,#9ad26a);border-radius:8px;background:var(--bg,#0d1510);box-shadow:0 8px 30px rgba(0,0,0,.5);font-family:"Pixelify Sans",ui-monospace,monospace;color:var(--text,#e3eed6)}
#consentBar p{margin:0;font-size:14px;line-height:1.4;flex:1 1 240px}
#consentBar a{color:var(--acc,#9ad26a)}
#consentBar div{display:flex;gap:8px}
#consentBar button{font-family:inherit;font-size:14px;padding:6px 14px;border-radius:6px;cursor:pointer;border:1px solid var(--acc,#9ad26a);background:transparent;color:var(--acc,#9ad26a)}
</style>`);

addEventListener('DOMContentLoaded', () => {
  if (!USE_GOOGLE_CMP && !Consent.get()) Consent.show();
  document.querySelectorAll('[data-cookie-settings]').forEach(el => el.addEventListener('click', e => {
    e.preventDefault();
    if (USE_GOOGLE_CMP){ window.googlefc = window.googlefc || {}; (googlefc.callbackQueue = googlefc.callbackQueue || []).push(() => googlefc.showRevocationMessage()); }
    else Consent.show();
  }));
});
