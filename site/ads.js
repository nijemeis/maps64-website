/* Maps 64 ads: Google AdSense H5 Games Ads (ad breaks between games) plus display banners
   on desktop only (under the game screen and on the Jukebox page).

   Nothing loads until ADS_CONFIG.client is filled in. Modes, per browser tab:
     ?ads=preview  stand-ins only, without contacting Google
     ?ads=test     Google's test ads (H5 test interstitials), for checking the real flow
     ?ads=off      back to normal: real ads (none until Google has approved the site) */
const ADS_CONFIG = {
  client: 'ca-pub-5351647549501846',  // AdSense publisher id; empty = no ads at all
  everyLevels: 2,                // offer an ad break after every 2nd finished level
  frequency: '120s',             // and never more often than this (Google may show fewer)
  slots: { game: '', jukebox: '' },  // display ad unit ids for the desktop banners
};

const Ads = {
  mode: (() => {
    try {
      const q = new URLSearchParams(location.search).get('ads');
      if (q === 'preview' || q === 'test') sessionStorage.setItem('maps64.admode', q);
      if (q === 'off') sessionStorage.removeItem('maps64.admode');
      return sessionStorage.getItem('maps64.admode') || 'live';
    } catch (e) { return 'live'; }
  })(),
  get preview(){ return this.mode === 'preview'; },
  get test(){ return this.mode === 'test'; },
  live: false, loaded: false, showing: false, levels: 0,

  init(){
    if (this.preview || !ADS_CONFIG.client) return;
    this.live = true;
    window.adsbygoogle = window.adsbygoogle || [];
    window.adBreak = window.adConfig = o => window.adsbygoogle.push(o);
    const s = document.createElement('script');
    s.async = true; s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADS_CONFIG.client;
    s.dataset.adFrequencyHint = ADS_CONFIG.frequency;
    if (this.test) s.dataset.adbreakTest = 'on';
    s.onload = () => { this.loaded = true; };
    s.onerror = () => { this.live = false; };  // blocked by an ad blocker: the game just carries on
    document.head.appendChild(s);
    adConfig({ preloadAdBreaks: 'on', sound: 'on' });
  },

  // banners only on a desktop-sized screen with a mouse; on phones nothing is inserted
  desktop(){ return matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)').matches; },

  // fill a banner container; returns true when something was placed
  banner(el, slot, {w = 728, h = 90} = {}){
    if (!el || !this.desktop()) return false;
    if (this.preview){
      el.innerHTML = `<div class="ad-ph" style="width:${w}px;max-width:100%;height:${h}px">Ad · ${w} × ${h} · desktop only<small>preview of the banner space</small></div>`;
    } else if (this.live && ADS_CONFIG.slots[slot]){
      el.innerHTML = `<ins class="adsbygoogle" style="display:inline-block;width:${w}px;max-width:100%;height:${h}px"
        data-ad-client="${ADS_CONFIG.client}" data-ad-slot="${ADS_CONFIG.slots[slot]}"${this.test ? ' data-adtest="on"' : ''}></ins>`;
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } else return false;
    el.hidden = false; return true;
  },

  // an ad break between games; `done` always runs afterwards, ad or no ad
  breakThen(name, done){
    if (++this.levels < ADS_CONFIG.everyLevels) return done();
    if (this.preview){ this.levels = 0; return this.mockBreak(done); }
    if (!this.live || !this.loaded) return done();
    let finished = false, started = false;
    const fin = () => { if (finished) return; finished = true; this.resume(); done(); };
    adBreak({ type: 'next', name,
      beforeAd: () => { started = true; this.levels = 0; this.pause(); },
      afterAd: () => this.resume(),
      adBreakDone: fin });
    setTimeout(() => { if (!started) fin(); }, 1500);  // never leave the player waiting on a missing ad
  },

  pause(){ this.showing = true; if (typeof Snd !== 'undefined' && Snd.master) Snd.master.gain.setTargetAtTime(0, Snd.ac.currentTime, .02); },
  resume(){ this.showing = false; if (typeof Snd !== 'undefined' && Snd.master) Snd.master.gain.setTargetAtTime(Snd.on ? .55 : 0, Snd.ac.currentTime, .02); },

  // preview: a stand-in for Google's full-screen ad, every time so you can see it
  mockBreak(done){
    this.pause();
    const o = document.createElement('div'); o.className = 'ad-break';
    o.innerHTML = `<div class="ad-break-box"><div class="ad-break-k">Ad break · preview</div>
      <div class="ad-break-t">Google shows a full-screen ad here</div>
      <p>Only between games: after every ${ADS_CONFIG.everyLevels === 2 ? '2nd' : ADS_CONFIG.everyLevels + 'th'} level, and at most once every ${ADS_CONFIG.frequency.replace('s', ' seconds')}. Music and controls pause and the game continues straight after.</p>
      <button class="ad-break-b" disabled>Continue in <span>5</span></button></div>`;
    document.body.appendChild(o);
    const b = o.querySelector('button'); let n = 5;
    const close = () => { o.remove(); this.resume(); done(); };
    const iv = setInterval(() => { n--; if (n > 0) b.querySelector('span').textContent = n; else { clearInterval(iv); b.disabled = false; b.textContent = 'Continue ▸'; b.focus(); } }, 1000);
    b.onclick = close;
  },
};
// shared styles for the banner placeholders and the preview ad break (uses the page's colour tokens)
document.head.insertAdjacentHTML('beforeend', `<style>
.ad-ph{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border:1px dashed var(--acc);border-radius:4px;color:var(--acc);font-size:13px;background:color-mix(in srgb,var(--acc) 6%,transparent)}
.ad-ph small{font-size:11px;color:var(--faint)}
.ad-break{position:fixed;inset:0;z-index:50;display:grid;place-items:center;padding:16px;background:rgba(5,10,7,.92)}
.ad-break-box{max-width:420px;padding:24px;border:1px dashed var(--acc);border-radius:8px;background:var(--bg);text-align:center}
.ad-break-k{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold)}
.ad-break-t{font-size:22px;font-weight:500;margin:8px 0}
.ad-break p{color:var(--muted);font-size:14px;line-height:1.45;margin:0 0 16px}
.ad-break-b{font-family:inherit;font-size:14px;color:var(--bg);background:var(--acc);border:0;border-radius:6px;padding:8px 14px;cursor:pointer}
.ad-break-b:disabled{background:var(--line);color:var(--muted);cursor:default}
</style>`);
Ads.init();
