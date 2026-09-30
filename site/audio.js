/* Maps 64 audio: a small Web Audio chip synth (pulse waves 12.5/25/50 %, triangle bass,
   noise drums), the menu tunes and the sound effects. All music is original.

   Tunes come in sets: each set is one melody arranged four ways (SETS lists them).
   A tune is a loop of bars of `spb` steps (16 = 4/4 in 16ths, 12 = 3/4):
     mel     one string per bar, `spb` space-separated tokens: a note (C5, F#4 — sharps only),
             '.' holds the previous note, '-' is a rest
     chords  one [root, third, fifth] per bar; the arpeggio and the bass play from it
     arp     pattern up | down | updown, pulse width w, volume, mul (octave multiplier), every (steps)
     bass    pump (root on 8ths, octave jumps on beats) | drive (16ths) | slow (long notes on 1 and 3)
             | walk (root, third, fifth, third on the beats) | waltz (root on 1, chord on 2 and 3)
     stab    optional offbeat chord stabs {w, vol}
     drums   one char per step and voice, 'x' = hit: k kick, s snare, h hat, p hand drum
     echo    optional lead echo: d steps later at v × the volume
     tr      optional transpose in semitones (lets arrangements share one melody)
     fx      optional weather: rain (chance of a drop per step), thunder (bars that start with a
             rumble), wind (a gust every other bar) */
const NOTE = n => { const m = n.match(/^([A-G])(#?)(\d)$/); const i = {C:-9,D:-7,E:-5,F:-4,G:-2,A:0,B:2}[m[1]] + (m[2]?1:0) + (m[3]-4)*12; return 440*Math.pow(2,i/12); };

const SETS = [
  {id:'heli', name:'Heli Theme', desc:'The title tune and three takes on it'},
  {id:'compass', name:'Compass Theme', desc:'A second melody, arranged four ways'},
  {id:'weather', name:'Weather Theme', desc:'A third melody through four kinds of weather'},
];

// the Weather melody (D major), shared by the Weather arrangements that transpose it with `tr`
const WX_MEL = ['A5 . A5 . F#5 . A5 . B5 . . . A5 . . .','F#5 . . . E5 . D5 . E5 . . . - - - -','D5 . D5 . B4 . D5 . E5 . . . D5 . B4 .','A4 . . . . . . . C#5 . E5 . A5 . . .',
         'A5 . A5 . F#5 . A5 . D6 . . . B5 . A5 .','C#6 . . . A5 . F#5 . E5 . . . C#5 . . .','D5 . E5 . F#5 . . . G5 . F#5 . E5 . D5 .','E5 . . . . . . . - - - - A4 . C#5 .'];
const WX_CHORDS = [['D4','F#4','A4'],['B3','D4','F#4'],['G3','B3','D4'],['A3','C#4','E4'],['D4','F#4','A4'],['F#3','A3','C#4'],['G3','B3','D4'],['A3','C#4','E4']];

const TUNES = [
  { id:'theme', set:'heli', name:'Maps 64 Theme', bpm:150,
    mel:['E5 . . . A5 . . . G5 . E5 . C5 . D5 .','C5 . . . A4 . . . C5 . F5 . E5 . C5 .','E5 . . . G5 . . . C6 . . . B5 . G5 .','D5 . . . . . . . B4 . D5 . G5 . . .',
         'A5 . . . E5 . A5 . C6 . B5 . A5 . G5 .','F5 . . . A5 . . . C6 . A5 . F5 . E5 .','D5 . G5 . B5 . D6 . B5 . G5 . D5 . B4 .','G#5 . . . . . . . E5 . . . - - - -'],
    chords:[['A3','C4','E4'],['F3','A3','C4'],['C4','E4','G4'],['G3','B3','D4'],['A3','C4','E4'],['F3','A3','C4'],['G3','B3','D4'],['E3','G#3','B3']],
    arp:{pattern:'up', w:.125, vol:.03}, bass:'pump', lead:{w:.25, vol:.075},
    drums:{k:'x...x...x...x...', s:'....x.......x...'} },

  // bright and bouncy, C major
  { id:'cloud', set:'heli', name:'Cloud Hopper', bpm:160,
    mel:['C5 . E5 . G5 . . . E5 . G5 . C6 . . .','B5 . . . A5 . G5 . D5 . . . G5 . . .','A5 . . . C6 . B5 . A5 . E5 . . . C5 .','F5 . A5 . C6 . A5 . G5 . F5 . E5 . D5 .',
         'E5 . G5 . C6 . . . D6 . C6 . B5 . G5 .','B5 . D6 . . . B5 . G5 . A5 . B5 . . .','C6 . A5 . F5 . A5 . G5 . F5 . E5 . F5 .','G5 . . . D5 . . . G5 . - - - - - -'],
    chords:[['C4','E4','G4'],['G3','B3','D4'],['A3','C4','E4'],['F3','A3','C4'],['C4','E4','G4'],['G3','B3','D4'],['F3','A3','C4'],['G3','B3','D4']],
    arp:{pattern:'updown', w:.125, vol:.028}, bass:'drive', lead:{w:.25, vol:.07},
    drums:{k:'x.......x.x.....', s:'....x.......x...', h:'x.x.x.x.x.x.x.x.'} },

  // slow and moody, D minor, with an echo on the lead
  { id:'night', set:'heli', name:'Night Flight', bpm:100,
    mel:['A4 . . . . . D5 . F5 . . . E5 . D5 .','D5 . . . . . . . - - F5 . D5 . A#4 .','C5 . . . . . A4 . C5 . F5 . . . A5 .','G5 . . . . . . . E5 . . . C5 . . .',
         'D5 . . . F5 . . . A5 . . . D6 . . .','C6 . . . A#5 . . . A5 . . . F5 . . .','G5 . . . A#5 . . . D6 . . . C6 . A#5 .','A5 . . . . . . . C#5 . . . E5 . . .'],
    chords:[['D3','F3','A3'],['A#2','D3','F3'],['F3','A3','C4'],['C3','E3','G3'],['D3','F3','A3'],['A#2','D3','F3'],['G3','A#3','D4'],['A2','C#3','E3']],
    arp:{pattern:'down', w:.125, vol:.03, mul:2}, bass:'slow', lead:{w:.5, vol:.06}, echo:{d:3, v:.35},
    drums:{k:'x.........x.....', s:'........x.......', h:'..x...x...x...x.'} },

  // desert flavour, E phrygian dominant, hand drums
  { id:'mirage', set:'heli', name:'Mirage', bpm:132,
    mel:['E5 . F5 . G#5 . . . A5 . G#5 . F5 . E5 .','F5 . . . A5 . C6 . . . A5 . G#5 . A5 .','G#5 . . . B5 . . . E6 . D6 . C6 . B5 .','A5 . . . F5 . D5 . F5 . A5 . D6 . C6 .',
         'B5 . . . G#5 . E5 . F5 . G#5 . A5 . B5 .','C6 . . . A5 . F5 . A5 . C6 . F6 . E6 .','D6 . . . B5 . G5 . A5 . B5 . C6 . B5 .','A5 . G#5 . F5 . E5 . . . . . - - - -'],
    chords:[['E3','G#3','B3'],['F3','A3','C4'],['E3','G#3','B3'],['D3','F3','A3'],['E3','G#3','B3'],['F3','A3','C4'],['G3','B3','D4'],['E3','G#3','B3']],
    arp:{pattern:'updown', w:.25, vol:.022}, bass:'pump', lead:{w:.125, vol:.07},
    drums:{k:'x.....x...x.....', s:'....x.......x...', p:'x..x..x...x..x..'} },

  // ---- Compass set: one melody (dotted, heroic) in four arrangements ----
  { id:'compass', set:'compass', name:'Compass', bpm:138,
    mel:['G4 . . B4 D5 . . . G5 . . . F#5 . G5 .','E5 . . . . . D5 . B4 . . . - - D5 .','E5 . . G5 E5 . . . C5 . . . D5 . E5 .','F#5 . . . A5 . . . D5 . . . - - - -',
         'G5 . . B5 G5 . . . E5 . . . D5 . E5 .','C6 . . . B5 . A5 . G5 . . . E5 . G5 .','A5 . . . C#6 . . . E6 . . . D6 . C#6 .','D6 . . . A5 . F#5 . D5 . . . - - - -'],
    chords:[['G3','B3','D4'],['E3','G3','B3'],['C4','E4','G4'],['D3','F#3','A3'],['E3','G3','B3'],['C4','E4','G4'],['A3','C#4','E4'],['D3','F#3','A3']],
    arp:{pattern:'up', w:.125, vol:.028}, bass:'pump', lead:{w:.25, vol:.075},
    drums:{k:'x.......x.......', s:'....x.......x..x', h:'x.x.x.x.x.x.x.x.'} },

  // laid back, offbeat chord stabs and a walking bass, down a tone to F
  { id:'tradewinds', set:'compass', name:'Trade Winds', bpm:112,
    mel:['F4 . . A4 C5 . . . F5 . . . E5 . F5 .','D5 . . . . . C5 . A4 . . . - - C5 .','D5 . . F5 D5 . . . A#4 . . . C5 . D5 .','E5 . . . G5 . . . C5 . . . - - - -',
         'F5 . . A5 F5 . . . D5 . . . C5 . D5 .','A#5 . . . A5 . G5 . F5 . . . D5 . F5 .','G5 . . . B5 . . . D6 . . . C6 . B5 .','C6 . . . G5 . E5 . C5 . . . - - - -'],
    chords:[['F3','A3','C4'],['D3','F3','A3'],['A#3','D4','F4'],['C3','E3','G3'],['D3','F3','A3'],['A#3','D4','F4'],['G3','B3','D4'],['C3','E3','G3']],
    stab:{w:.5, vol:.03}, bass:'walk', lead:{w:.5, vol:.055}, echo:{d:2, v:.25},
    drums:{k:'x.......x.......', s:'........x.......', h:'..x...x...x...x.', p:'.......x.......x'} },

  // the melody in 3/4, gentle, with an echo
  { id:'aurora', set:'compass', name:'Aurora Waltz', bpm:150, spb:12,
    mel:['G4 . . B4 D5 . . . G5 . F#5 .','E5 . . . . . D5 . B4 . . .','E5 . . G5 E5 . . . C5 . D5 .','F#5 . . . A5 . . . D5 . . .',
         'G5 . . B5 G5 . . . E5 . D5 .','C6 . . . B5 . A5 . G5 . E5 .','A5 . . . C#6 . . . E6 . C#6 .','D6 . . . A5 . . . F#5 . D5 .'],
    chords:[['G3','B3','D4'],['E3','G3','B3'],['C4','E4','G4'],['D3','F#3','A3'],['E3','G3','B3'],['C4','E4','G4'],['A3','C#4','E4'],['D3','F#3','A3']],
    bass:'waltz', lead:{w:.125, vol:.07}, echo:{d:3, v:.3},
    drums:{k:'x...........', h:'....x...x...'} },

  // the melody in G minor, pushing and dark
  { id:'storm', set:'compass', name:'Storm Front', bpm:120,
    mel:['G4 . . A#4 D5 . . . G5 . . . F#5 . G5 .','D#5 . . . . . D5 . A#4 . . . - - D5 .','D#5 . . G5 D#5 . . . C5 . . . D5 . D#5 .','F#5 . . . A5 . . . D5 . . . - - - -',
         'G5 . . A#5 G5 . . . D#5 . . . D5 . D#5 .','C6 . . . A#5 . A5 . G5 . . . D#5 . G5 .','A5 . . . C6 . . . F6 . . . D#6 . D6 .','D6 . . . A5 . F#5 . D5 . . . - - - -'],
    chords:[['G3','A#3','D4'],['D#3','G3','A#3'],['C4','D#4','G4'],['D3','F#3','A3'],['D#3','G3','A#3'],['C4','D#4','G4'],['F3','A3','C4'],['D3','F#3','A3']],
    arp:{pattern:'updown', w:.125, vol:.03}, bass:'drive', lead:{w:.5, vol:.068},
    drums:{k:'x...x...x...x...', s:'....x.......x...', h:'..x...x...x...x.'} },

  // ---- Weather set: one lilting pentatonic melody with a raindrop motif, four kinds of weather ----
  { id:'sunny', set:'weather', name:'Sunny Spells', bpm:144, mel:WX_MEL, chords:WX_CHORDS,
    arp:{pattern:'updown', w:.125, vol:.028}, bass:'pump', lead:{w:.25, vol:.072},
    drums:{k:'x...x...x...x...', s:'....x.......x...', h:'..x...x...x...x.'} },

  // singing in the rain: up a minor third to F, bouncy walking bass and offbeat stabs, rain all the way
  { id:'drizzle', set:'weather', name:'Drizzle', bpm:126, tr:3, mel:WX_MEL, chords:WX_CHORDS,
    arp:{pattern:'up', w:.125, vol:.016, mul:4, every:2}, stab:{w:.5, vol:.022}, bass:'walk', lead:{w:.25, vol:.066}, echo:{d:2, v:.22},
    drums:{k:'x.......x.......', s:'....x.......x...', h:'..x...x...x...x.'}, fx:{rain:.4} },

  // a fresh breeze: down to G, flute-like triangle lead, skipping drums and wind gusts
  { id:'breeze', set:'weather', name:'Fresh Breeze', bpm:132, tr:-7, mel:WX_MEL, chords:WX_CHORDS,
    arp:{pattern:'updown', w:.25, vol:.022, mul:4}, bass:'pump', lead:{w:'triangle', vol:.17}, echo:{d:3, v:.25},
    drums:{k:'x.....x...x.....', s:'....x.......x...', h:'x.x.x.x.x.x.x.x.'}, fx:{wind:true} },

  // thunderstorm: D dorian, heavy drums, rumbles and rain
  { id:'thunder', set:'weather', name:'Thunderhead', bpm:126,
    mel:['A5 . A5 . F5 . A5 . B5 . . . A5 . . .','F5 . . . E5 . D5 . E5 . . . - - - -','D5 . D5 . B4 . D5 . E5 . . . D5 . B4 .','A4 . . . . . . . C#5 . E5 . A5 . . .',
         'A5 . A5 . F5 . A5 . D6 . . . B5 . A5 .','C6 . . . A5 . F5 . E5 . . . C5 . . .','D5 . E5 . F5 . . . G5 . F5 . E5 . D5 .','E5 . . . . . . . - - - - A4 . C#5 .'],
    chords:[['D3','F3','A3'],['C3','E3','G3'],['G3','B3','D4'],['A2','C#3','E3'],['D3','F3','A3'],['F3','A3','C4'],['G3','B3','D4'],['A2','C#3','E3']],
    arp:{pattern:'updown', w:.125, vol:.03}, bass:'drive', lead:{w:.5, vol:.065},
    drums:{k:'x.....x.x.......', s:'....x.......x...', h:'x.x.x.x.x.x.x.x.'}, fx:{thunder:[0,4], rain:.3} },
];

const Snd = {
  ac:null, on: localStorage.getItem('maps64.sound') !== 'off',
  tuneIx: Math.max(0, TUNES.findIndex(t => t.id === (localStorage.getItem('maps64.music') || 'theme'))),
  musicOff: localStorage.getItem('maps64.music') === 'off',
  init(){
    if (this.ac) { if (this.ac.state !== 'running') this.ac.resume().catch(()=>{}); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ac = this.ac = new AC();
    this.master = ac.createGain(); this.master.gain.value = this.on ? .55 : 0; this.master.connect(ac.destination);
    this.mus = ac.createGain(); this.mus.gain.value = .5; this.mus.connect(this.master);
    this.sfx = ac.createGain(); this.sfx.gain.value = .8; this.sfx.connect(this.master);
    this.pw = {}; [.125,.25,.5].forEach(d => { const n=32, re=new Float32Array(n), im=new Float32Array(n); for (let k=1;k<n;k++) re[k]=2/(k*Math.PI)*Math.sin(k*Math.PI*d); this.pw[d]=ac.createPeriodicWave(re,im); });
    const b = this.noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = b.getChannelData(0); for (let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    const src = ac.createBufferSource(); src.buffer=b; src.loop=true;
    const lp = ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=520;
    const chop = ac.createGain(); chop.gain.value=.5;
    this.lfo = ac.createOscillator(); this.lfo.type='square'; this.lfo.frequency.value=13;
    const lg = ac.createGain(); lg.gain.value=.5; this.lfo.connect(lg).connect(chop.gain);
    this.rot = ac.createGain(); this.rot.gain.value=0;
    src.connect(lp).connect(chop).connect(this.rot).connect(this.sfx); src.start(); this.lfo.start();
    if (this.wantMusic) this.startMusic();
  },
  setOn(v){ this.on=v; localStorage.setItem('maps64.sound', v?'on':'off'); if (this.master) this.master.gain.setTargetAtTime(v?.55:0, this.ac.currentTime, .02); },
  tone(f, t, d, {w=.25, vol=.1, bus, slide}={}){
    const ac=this.ac; if(!ac) return; const o=ac.createOscillator();
    if (typeof w === 'number') o.setPeriodicWave(this.pw[w]); else o.type=w;
    o.frequency.setValueAtTime(f,t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t+d);
    const g=ac.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+.005); g.gain.setValueAtTime(vol,t+Math.max(.006,d*.6)); g.gain.linearRampToValueAtTime(0,t+d);
    o.connect(g).connect(bus||this.sfx); o.start(t); o.stop(t+d+.02);
  },
  noise(t, d, {vol=.2, f=1800, bus}={}){
    const ac=this.ac; if(!ac) return; const s=ac.createBufferSource(); s.buffer=this.noiseBuf;
    const bp=ac.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=f; bp.Q.value=.8;
    const g=ac.createGain(); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.001,t+d);
    s.connect(bp).connect(g).connect(bus||this.sfx); s.start(t, Math.random()*.5); s.stop(t+d+.02);
  },
  now(){ return this.ac ? this.ac.currentTime : 0; },
  // filtered noise that swells in and fades out (wind, thunder)
  swell(t, d, {f=600, f2=f, vol=.06, att=d/2, type='bandpass', q=1, bus}={}){
    const ac=this.ac; if(!ac) return; const s=ac.createBufferSource(); s.buffer=this.noiseBuf; s.loop=true;
    const fl=ac.createBiquadFilter(); fl.type=type; fl.Q.value=q; fl.frequency.setValueAtTime(f,t); fl.frequency.linearRampToValueAtTime(f2,t+d);
    const g=ac.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+att); g.gain.linearRampToValueAtTime(0,t+d);
    s.connect(fl).connect(g).connect(bus||this.sfx); s.start(t, Math.random()*.5); s.stop(t+d+.02);
  },
  blip(){ this.tone(990, this.now(), .045, {w:.5, vol:.06}); },
  pass(){ this.tone(1480, this.now(), .04, {w:.125, vol:.04}); },
  ok(){ const t=this.now(); this.tone(660,t,.05,{w:.5,vol:.07}); this.tone(1320,t+.05,.08,{w:.5,vol:.07}); },
  back(){ const t=this.now(); this.tone(660,t,.05,{w:.5,vol:.06}); this.tone(440,t+.05,.07,{w:.5,vol:.06}); },
  correct(){ const t=this.now(); ['C5','E5','G5','C6','G5','C6'].forEach((n,i)=>this.tone(NOTE(n),t+i*.065,.09,{w:.25,vol:.1})); },
  wrong(){ const t=this.now(); this.tone(196,t,.14,{w:'sawtooth',vol:.07}); this.tone(147,t+.14,.26,{w:'sawtooth',vol:.07,slide:98}); },
  timeout(){ const t=this.now(); this.noise(t,.5,{vol:.25,f:600}); this.tone(392,t,.5,{w:.5,vol:.06,slide:98}); },
  tick(){ this.tone(1760, this.now(), .03, {w:.5, vol:.05}); },
  beep(hi){ this.tone(hi?880:440, this.now(), hi?.22:.12, {w:.25, vol:.1}); },
  fanfare(good){ const t=this.now(); const seq = good ? ['C5','C5','G5','E5','C6','.','G5','C6'] : ['E4','D#4','D4','C#4']; seq.forEach((n,i)=>{ if(n!=='.') this.tone(NOTE(n), t+i*.12, good&&i===seq.length-1?.5:.13, {w:.25,vol:.1}); }); },
  rotor(level, rate){ if(!this.ac) return; const t=this.ac.currentTime; this.rot.gain.setTargetAtTime(level, t, .08); this.lfo.frequency.setTargetAtTime(rate, t, .1); },

  /* ---- music ---- */
  get tune(){ return this.musicOff ? null : TUNES[this.tuneIx] || TUNES[0]; },
  tuneName(){ return this.tune ? this.tune.name : 'Off'; },
  // choose a tune by index, or -1 for no music; restarts the loop if music is playing
  setTune(i){
    this.musicOff = i < 0; if (i >= 0) this.tuneIx = i;
    localStorage.setItem('maps64.music', i < 0 ? 'off' : TUNES[i].id);
    const want = this.wantMusic; this.stopMusic(); if (want) this.startMusic();
  },
  // cycle through the tunes and then "off"
  nextTune(){ this.setTune(this.musicOff ? 0 : this.tuneIx + 1 < TUNES.length ? this.tuneIx + 1 : -1); },
  startMusic(){
    this.wantMusic=true; const T=this.tune; if(!this.ac || this.timer || !T) return;
    this.cur=T; this.spb=T.spb||16; this.stepLen=60/T.bpm/4; this.trk=Math.pow(2,(T.tr||0)/12); this.mel=T.mel.join(' ').split(' '); this.steps=this.mel.length;
    this.step=0; this.nextT=this.ac.currentTime+.08; this.timer=setInterval(()=>this.sched(),25);
  },
  stopMusic(){ this.wantMusic=false; clearInterval(this.timer); this.timer=null; },
  sched(){ while (this.nextT < this.ac.currentTime + .12) { this.play(this.step, this.nextT); this.nextT += this.stepLen; this.step = (this.step+1) % this.steps; } },
  play(s, t){
    const T=this.cur, S=this.stepLen, bar=Math.floor(s/this.spb), pos=s%this.spb, M=this.mus, k=this.trk, N=n=>NOTE(n)*k;
    const ch=T.chords[bar], root=N(ch[0]);
    const a=T.arp; if (a && pos%(a.every||1)===0){
      const ix = a.pattern==='down' ? 2-pos%3 : a.pattern==='updown' ? [0,1,2,1][pos%4] : pos%3;
      this.tone(N(ch[ix])*(a.mul||2), t, S*.9*(a.every||1), {w:a.w, vol:a.vol, bus:M});
    }
    if (T.bass==='pump' && pos%2===0) this.tone(root/(pos%4===0?2:1), t, S*1.7, {w:'triangle', vol:.2, bus:M});
    else if (T.bass==='drive') this.tone(root/(pos%2===0?2:1), t, S*.8, {w:'triangle', vol:.17, bus:M});
    else if (T.bass==='slow' && (pos===0||pos===8)) this.tone(root/2, t, S*7.5, {w:'triangle', vol:.2, bus:M});
    else if (T.bass==='walk' && pos%4===0) this.tone(N(ch[[0,1,2,1][pos/4]])/2, t, S*3.4, {w:'triangle', vol:.2, bus:M});
    else if (T.bass==='waltz'){
      if (pos===0) this.tone(root/2, t, S*3.6, {w:'triangle', vol:.2, bus:M});
      else if (pos===4||pos===8) [1,2].forEach(i=>this.tone(N(ch[i]), t, S*1.8, {w:.5, vol:.025, bus:M}));
    }
    if (T.stab && pos%4===2) ch.forEach(n=>this.tone(N(n)*2, t, S*1.2, {w:T.stab.w, vol:T.stab.vol, bus:M}));
    const D=T.drums||{}, hit = k => D[k] && D[k][pos]==='x';
    if (hit('k')) this.tone(150, t, .09, {w:'sine', vol:.22, bus:M, slide:45});
    if (hit('s')) this.noise(t, .09, {vol:.12, f:2600, bus:M});
    if (hit('h')) this.noise(t, .03, {vol:.045, f:8000, bus:M});
    if (hit('p')) this.noise(t, .07, {vol:.11, f:900, bus:M});
    const F=T.fx; if (F){
      if (F.rain && Math.random()<F.rain) this.noise(t+Math.random()*S, .025, {vol:.02+Math.random()*.035, f:3000+Math.random()*5000, bus:M});
      if (F.thunder && pos===0 && F.thunder.includes(bar)){ this.noise(t, .3, {vol:.12, f:900, bus:M}); this.swell(t, 2.6, {f:220, f2:90, vol:.4, att:.06, type:'lowpass', bus:M}); }
      if (F.wind && pos===0 && bar%2===0) this.swell(t, S*this.spb*2, {f:450, f2:1100, vol:.05, q:2.5, bus:M});
    }
    const tk = this.mel[s]; if (tk!=='.' && tk!=='-') {
      let len=1; while (this.mel[(s+len)%this.steps]==='.') len++;
      const L=T.lead; this.tone(N(tk), t, S*len*.95, {w:L.w, vol:L.vol, bus:M});
      if (T.echo) this.tone(N(tk), t+S*T.echo.d, S*Math.min(len,T.echo.d)*.9, {w:L.w, vol:L.vol*T.echo.v, bus:M});
    }
  },
};
