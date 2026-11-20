// ============================================================
//  CANLI DÜĞÜN — MÜZİK MOTORU
//  Tüm müzik tarayıcıda anlık ÜRETİLİR (davul, org, zurna sesi).
//  Hiçbir kayıt/şarkı dosyası çalınmaz → telif riski yok.
//  Her istek şarkının adı bir "tohum" olur: aynı isim = aynı ezgi.
// ============================================================
(function () {
  const M = {};
  let ctx = null, ana, muzikGain, efektGain, gurultu, kompRef;
  let calisiyor = false, zamanlayici = null;
  let sonrakiZaman = 0, adim = 0, olcu = 0;
  let tarz = null, ezgi = [], bas = [];
  let coskuDegeri = 0;          // 0..1 (beğeni ile artar)
  let davulZurnaBitis = 0;      // efsane şov süresince güçlü mod
  const dumZamanlari = [];

  // ---------- Makamlar (yarım ses aralıkları) ----------
  const MAKAMLAR = {
    hicaz: [0, 1, 4, 5, 7, 8, 10, 12, 13, 16],
    ussak: [0, 2, 3, 5, 7, 8, 10, 12, 14, 15],
    rast:  [0, 2, 4, 5, 7, 9, 10, 12, 14, 16],
  };

  // ---------- Ritim kalıpları: D=düm, t=tek, .=boş ----------
  const TARZLAR = [
    { ad: "Halay",      adimSayisi: 8, bpm: 118, kalip: "D.t.D.tt", makam: "hicaz", vurgu: [0, 4] },
    { ad: "9/8 Roman",  adimSayisi: 9, bpm: 128, kalip: "D.t.D.ttt", makam: "hicaz", vurgu: [0, 4] },
    { ad: "Çiftetelli", adimSayisi: 8, bpm: 104, kalip: "D.tt.tD.", makam: "ussak", vurgu: [0, 6] },
    { ad: "Horon",      adimSayisi: 7, bpm: 150, kalip: "D.tD.t.", makam: "rast",  vurgu: [0, 3] },
  ];

  // ---------- Tohumlu rastgele ----------
  function tohumla(metin) {
    let h = 2166136261;
    for (const c of String(metin)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    return function () {
      h += 0x6D2B79F5; let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function nota(derece, makam, kok = 62) {
    const s = MAKAMLAR[makam];
    const oktav = Math.floor(derece / 7);
    const d = ((derece % 7) + 7) % 7;
    const yarim = s[d] + oktav * 12;
    return 440 * Math.pow(2, (kok + yarim - 69) / 12);
  }

  // Bir şarkı: tarz + 4 ölçülük ezgi (A A' B A) üretir
  function sarkiUret(isim) {
    const r = tohumla(isim || "düğün");
    tarz = TARZLAR[Math.floor(r() * TARZLAR.length)];
    const n = tarz.adimSayisi;
    const motif = (uzunluk, baslangic) => {
      const m = []; let d = baslangic;
      for (let i = 0; i < uzunluk; i++) {
        if (r() < 0.18 && i > 0) { m.push(null); continue; }       // nota uzat / sus
        d += Math.round((r() - 0.5) * 3.2);
        d = Math.max(0, Math.min(9, d));
        m.push(d);
      }
      return m;
    };
    const A = motif(n * 2, 4 + Math.floor(r() * 2));
    const A2 = A.slice(); for (let i = n; i < A2.length; i++) if (A2[i] !== null && r() < 0.5) A2[i] = Math.max(0, A2[i] - 1);
    A2[A2.length - 1] = 0;
    const B = motif(n * 2, 6);
    ezgi = [...A, ...A2, ...B, ...A2];
    // Bas: her ölçü kök veya 5. derece
    bas = [0, 0, 3, 4, 0, 0, 4, 0].map(x => x);
    adim = 0; olcu = 0;
    return tarz.ad;
  }

  // ---------- Ses birimleri ----------
  function zarf(g, t, a, v, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  function gurultuOlustur() {
    const b = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
    const v = b.getChannelData(0);
    for (let i = 0; i < v.length; i++) v[i] = Math.random() * 2 - 1;
    return b;
  }

  function dum(t, guc = 1, hedef = muzikGain) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.18);
    zarf(g, t, 0.004, 0.9 * guc, 0.32);
    o.connect(g).connect(hedef); o.start(t); o.stop(t + 0.4);
    // deri sesi
    const n = ctx.createBufferSource(); n.buffer = gurultu;
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 900;
    const g2 = ctx.createGain(); zarf(g2, t, 0.002, 0.35 * guc, 0.08);
    n.connect(f).connect(g2).connect(hedef); n.start(t); n.stop(t + 0.12);
  }

  function tek(t, guc = 1, hedef = muzikGain) {
    const n = ctx.createBufferSource(); n.buffer = gurultu;
    const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 2600; f.Q.value = 0.8;
    const g = ctx.createGain(); zarf(g, t, 0.002, 0.45 * guc, 0.07);
    n.connect(f).connect(g).connect(hedef); n.start(t); n.stop(t + 0.1);
    const o = ctx.createOscillator(), g2 = ctx.createGain();
    o.type = "triangle"; o.frequency.value = 420;
    zarf(g2, t, 0.002, 0.18 * guc, 0.05);
    o.connect(g2).connect(hedef); o.start(t); o.stop(t + 0.08);
  }

  // Org/zurna lead: testere + kare dalga, vibrato, bant filtre
  function lead(t, frek, sure, zurna) {
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = zurna ? "bandpass" : "lowpass";
    f.frequency.value = zurna ? 1700 : 2400; f.Q.value = zurna ? 1.2 : 0.7;
    const vib = ctx.createOscillator(), vibG = ctx.createGain();
    vib.frequency.value = zurna ? 6.5 : 5.2; vibG.gain.value = frek * (zurna ? 0.012 : 0.006);
    vib.connect(vibG);
    const sesler = zurna ? ["sawtooth", "square"] : ["square", "sawtooth"];
    sesler.forEach((tip, i) => {
      const o = ctx.createOscillator();
      o.type = tip; o.frequency.setValueAtTime(frek * (i ? 1.003 : 1), t);
      vibG.connect(o.frequency);
      o.connect(f); o.start(t); o.stop(t + sure + 0.05);
    });
    vib.start(t); vib.stop(t + sure + 0.05);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(zurna ? 0.16 : 0.12, t + 0.015);
    g.gain.setValueAtTime(zurna ? 0.14 : 0.1, t + sure * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
    f.connect(g).connect(muzikGain);
  }

  function basNota(t, frek, sure) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 500;
    o.type = "square"; o.frequency.value = frek;
    zarf(g, t, 0.01, 0.13, sure);
    o.connect(f).connect(g).connect(muzikGain); o.start(t); o.stop(t + sure + 0.05);
  }

  function akor(t, kokDerece, makam) {
    [0, 2, 4].forEach(k => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "square"; o.frequency.value = nota(kokDerece + k, makam, 62);
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 1400;
      zarf(g, t, 0.005, 0.035, 0.12);
      o.connect(f).connect(g).connect(muzikGain); o.start(t); o.stop(t + 0.2);
    });
  }

  // ---------- Zamanlayıcı ----------
  function adimSuresi() {
    const dz = ctx.currentTime < davulZurnaBitis;
    const bpm = tarz.bpm * (1 + coskuDegeri * 0.28 + (dz ? 0.15 : 0));
    // bpm = dörtlük; adımlar sekizlik
    return 60 / bpm / 2;
  }

  function adimCal(t) {
    if (mp3Calan) { adim++; if (adim % tarz.adimSayisi === 0) olcu++; return; } // MP3 çalarken org susar
    const dz = t < davulZurnaBitis;
    const n = tarz.adimSayisi;
    const i = adim % n;
    const k = tarz.kalip[i];
    if (k === "D") { dum(t, dz ? 1.3 : 1); dumZamanlari.push(t); if (dumZamanlari.length > 16) dumZamanlari.shift(); }
    if (k === "t") tek(t, dz ? 1.2 : 0.9);
    if (k === "." && (dz || coskuDegeri > 0.6) && Math.random() < 0.5) tek(t, 0.45);
    if (dz && k === "." && Math.random() < 0.35) dum(t, 0.6);

    // Bas + akor (org)
    if (i === 0) basNota(t, nota(bas[olcu % bas.length] - 7, tarz.makam, 50), adimSuresi() * 3);
    if (tarz.vurgu.includes(i) && i !== 0) basNota(t, nota(bas[olcu % bas.length] - 7 + 4, tarz.makam, 50), adimSuresi() * 2);
    if (!dz && k !== "D" && i % 2 === 1) akor(t, bas[olcu % bas.length], tarz.makam);

    // Ezgi
    const e = ezgi[adim % ezgi.length];
    if (e !== null && e !== undefined) {
      let uzunluk = 1;
      while (ezgi[(adim + uzunluk) % ezgi.length] === null && uzunluk < 4) uzunluk++;
      lead(t, nota(e, tarz.makam, dz ? 74 : 62), adimSuresi() * uzunluk * 0.95, dz);
    }
    adim++;
    if (adim % n === 0) olcu++;
  }

  function dongu() {
    while (sonrakiZaman < ctx.currentTime + 0.12) {
      adimCal(sonrakiZaman);
      sonrakiZaman += adimSuresi();
    }
  }

  // ---------- Dışa açılan fonksiyonlar ----------
  M.baslat = function () {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const komp = kompRef = ctx.createDynamicsCompressor();
      ana = ctx.createGain(); ana.gain.value = 1;
      muzikGain = ctx.createGain(); muzikGain.gain.value = (window.AYAR?.muzikSes ?? 0.5);
      efektGain = ctx.createGain(); efektGain.gain.value = (window.AYAR?.efektSes ?? 0.7);
      muzikGain.connect(ana); efektGain.connect(ana); ana.connect(komp).connect(ctx.destination);
      gurultu = gurultuOlustur();
      if (!tarz) sarkiUret("Hoş Geldiniz Düğünümüze");
    }
    if (ctx.state === "suspended") ctx.resume();
    if (!calisiyor) {
      calisiyor = true;
      sonrakiZaman = ctx.currentTime + 0.1;
      zamanlayici = setInterval(dongu, 25);
    }
    return ctx.state;
  };

  // Video kaydı için oyunun tüm sesini (müzik + efekt) akış olarak ver
  M.kayitAkisi = function () { M.baslat(); const d = ctx.createMediaStreamDestination(); kompRef.connect(d); return d.stream; };

  M.durdur = function () { calisiyor = false; clearInterval(zamanlayici); };
  M.aktifMi = () => !!ctx && calisiyor && ctx.state === "running";
  M.sarki = function (isim) { return sarkiUret(isim); };
  M.tarzAdi = () => (tarz ? tarz.ad : "");
  M.cosku = function (v) { coskuDegeri = Math.max(0, Math.min(1, v)); };
  M.davulZurna = function (saniye) { if (ctx) davulZurnaBitis = ctx.currentTime + saniye; };

  // 0..1 arası "nabız": son düm'den bu yana geçen süreye göre (görsel senkron için)
  M.nabiz = function () {
    if (!ctx || !calisiyor) return 0;
    if (mp3Calan && analiz) {
      // Şarkının bas enerjisinden vuruş yakala → halay gerçek şarkıyla oynar
      analiz.getByteFrequencyData(fftBuf);
      let e = 0; for (let i = 1; i < 7; i++) e += fftBuf[i];
      e /= 6 * 255;
      enerjiOrt = enerjiOrt * 0.96 + e * 0.04;
      anlikNabiz = Math.max(anlikNabiz * 0.86, Math.min(1, Math.max(0, (e - enerjiOrt) * 5)));
      return anlikNabiz;
    }
    const now = ctx.currentTime;
    let son = null;
    for (let i = dumZamanlari.length - 1; i >= 0; i--) if (dumZamanlari[i] <= now) { son = dumZamanlari[i]; break; }
    if (son === null) return 0;
    return Math.exp(-(now - son) * 7);
  };
  M.vurusSuresi = () => (ctx && tarz ? adimSuresi() * 2 : 0.5);

  // ---------- Efekt sesleri ----------
  const e = (fn) => function (...a) { if (!ctx || ctx.state !== "running") return; fn(ctx.currentTime + 0.01, ...a); };

  M.zilgit = e(function (t) {               // "lililili" zılgıt
    const o = ctx.createOscillator(), g = ctx.createGain();
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    o.type = "triangle"; o.frequency.value = 1350;
    lfo.frequency.value = 11; lg.gain.value = 260;
    lfo.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.08);
    g.gain.setValueAtTime(0.2, t + 1.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);
    o.frequency.linearRampToValueAtTime(1550, t + 1.6);
    o.connect(g).connect(efektGain);
    o.start(t); lfo.start(t); o.stop(t + 1.8); lfo.stop(t + 1.8);
  });

  M.altin = e(function (t) {                // şıngır
    [2093, 2637, 3136].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      zarf(g, t + i * 0.06, 0.003, 0.18, 0.5);
      o.connect(g).connect(efektGain); o.start(t + i * 0.06); o.stop(t + i * 0.06 + 0.6);
    });
  });

  M.pat = e(function (t) {                  // havai fişek
    const n = ctx.createBufferSource(); n.buffer = gurultu;
    const f = ctx.createBiquadFilter(); f.type = "bandpass";
    f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(3000, t + 0.5);
    const g = ctx.createGain(); zarf(g, t, 0.3, 0.12, 0.25);
    n.connect(f).connect(g).connect(efektGain); n.start(t); n.stop(t + 0.6);
    const n2 = ctx.createBufferSource(); n2.buffer = gurultu;
    const g2 = ctx.createGain(); zarf(g2, t + 0.55, 0.002, 0.6, 0.5);
    const f2 = ctx.createBiquadFilter(); f2.type = "lowpass"; f2.frequency.value = 1800;
    n2.connect(f2).connect(g2).connect(efektGain); n2.start(t + 0.55); n2.stop(t + 1.1);
  });

  M.kismet = e(function (t) {               // eşleşme arpeji
    [0, 2, 4, 7, 9, 11].forEach((d, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "triangle"; o.frequency.value = nota(d, "rast", 72);
      zarf(g, t + i * 0.08, 0.005, 0.15, 0.6);
      o.connect(g).connect(efektGain); o.start(t + i * 0.08); o.stop(t + i * 0.08 + 0.7);
    });
  });

  M.blip = e(function (t, yuksek) {         // halaya katılma
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(yuksek ? 880 : 600, t);
    o.frequency.exponentialRampToValueAtTime(yuksek ? 1320 : 900, t + 0.08);
    zarf(g, t, 0.004, 0.12, 0.1);
    o.connect(g).connect(efektGain); o.start(t); o.stop(t + 0.15);
  });

  M.davulSilsile = e(function (t) {         // efsane girişi: davul çevirme
    for (let i = 0; i < 16; i++) dum(t + i * 0.07, 0.5 + i / 20, efektGain);
    dum(t + 1.2, 1.6, efektGain);
    tek(t + 1.2, 1.4, efektGain);
  });

  // ---------- Komik efektler ----------
  function osc(t, tip, f1, f2, sure, ses, hedef = efektGain, filtre) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tip; o.frequency.setValueAtTime(f1, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + sure);
    zarf(g, t, 0.01, ses, sure);
    if (filtre) { const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = filtre; o.connect(f).connect(g); } else o.connect(g);
    g.connect(hedef); o.start(t); o.stop(t + sure + 0.05);
    return o;
  }
  function gur(t, tip, frek, q, sure, ses, kayma) {
    const n = ctx.createBufferSource(); n.buffer = gurultu;
    const f = ctx.createBiquadFilter(); f.type = tip; f.frequency.setValueAtTime(frek, t); f.Q.value = q;
    if (kayma) f.frequency.exponentialRampToValueAtTime(kayma, t + sure);
    const g = ctx.createGain(); zarf(g, t, 0.003, ses, sure);
    n.connect(f).connect(g).connect(efektGain); n.start(t, Math.random() * 0.4); n.stop(t + sure + 0.05);
  }
  M.korna = e(function (t) {              // düt düt düüüt (konvoy)
    [[0, 0.16], [0.24, 0.16], [0.48, 0.6]].forEach(([d, l]) => [392, 494].forEach(f => osc(t + d, "square", f, 0, l, 0.07, efektGain, 1800)));
  });
  M.alkis = e(function (t) {
    for (let i = 0; i < 46; i++) gur(t + Math.random() * 1.7, "bandpass", 1000 + Math.random() * 1800, 1.1, 0.05, 0.06 + Math.random() * 0.1);
  });
  M.boing = e(function (t) {
    const o = osc(t, "sine", 140, 620, 0.35, 0.22);
    const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 22; lg.gain.value = 60;
    l.connect(lg).connect(o.frequency); l.start(t); l.stop(t + 0.4);
  });
  M.splat = e(function (t) { gur(t, "lowpass", 900, 0.7, 0.25, 0.6, 200); osc(t, "sine", 160, 50, 0.2, 0.4); });
  M.kasa = e(function (t) { gur(t, "highpass", 3000, 0.7, 0.03, 0.3); [1760, 2637].forEach((f, i) => osc(t + 0.07 + i * 0.05, "sine", f, 0, 0.5, 0.14)); });
  M.islik = e(function (t, yukari) {      // kayma düdüğü
    const o = osc(t, "sine", yukari ? 450 : 1900, yukari ? 1900 : 380, 0.75, 0.18);
    const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 7; lg.gain.value = 25;
    l.connect(lg).connect(o.frequency); l.start(t); l.stop(t + 0.8);
  });
  M.kapi = e(function (t) { dum(t, 1.5, efektGain); gur(t + 0.02, "bandpass", 700, 1.5, 0.35, 0.5, 200); });
  M.flas = e(function (t) { gur(t, "highpass", 4000, 0.7, 0.04, 0.35); osc(t + 0.03, "sine", 2800, 900, 0.18, 0.06); });
  M.ooh = e(function (t) {               // kalabalık "ooooh"
    const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 2.2;
    f.frequency.setValueAtTime(450, t); f.frequency.linearRampToValueAtTime(900, t + 0.6); f.frequency.linearRampToValueAtTime(600, t + 1.3);
    const g = ctx.createGain(); zarf(g, t, 0.15, 0.22, 1.2); f.connect(g).connect(efektGain);
    [170, 205, 232, 260, 300].forEach(fr => { const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(fr, t); o.frequency.linearRampToValueAtTime(fr * 1.12, t + 0.6); o.frequency.linearRampToValueAtTime(fr * 0.95, t + 1.3); o.connect(f); o.start(t); o.stop(t + 1.45); });
  });
  M.cizirti = e(function (t) { gur(t, "bandpass", 3200, 4, 0.18, 0.5, 300); gur(t + 0.18, "bandpass", 300, 4, 0.2, 0.45, 2400); });
  M.opucuk = e(function (t) { gur(t, "bandpass", 2600, 3, 0.04, 0.5); osc(t + 0.01, "sine", 1300, 600, 0.07, 0.12); });
  M.dusus = e(function (t) { M.islik(false); setTimeout(() => ctx && dum(ctx.currentTime, 1.3, efektGain), 700); });
  M.hey = e(function (t) { [0, 0.5].forEach(d => { dum(t + d, 1.4, efektGain); gur(t + d, "bandpass", 900, 0.8, 0.25, 0.35, 500); }); });

  // ---------- MP3 (sarkilar klasörü) ----------
  let mp3El = null, mp3Gain = null, analiz = null, fftBuf = null, mp3Calan = false, mp3Zaman = null;
  let muzikAcikMi = true, mp3SesDegeri = (window.AYAR?.mp3Ses ?? 0.9);
  let enerjiOrt = 0.2, anlikNabiz = 0;

  function seviyeleriUygula() {
    if (!ctx) return;
    const t = ctx.currentTime;
    muzikGain.gain.setTargetAtTime(muzikAcikMi && !mp3Calan ? (window.AYAR?.muzikSes ?? 0.5) : 0, t, 0.12);
    if (mp3Gain) mp3Gain.gain.setTargetAtTime(muzikAcikMi ? mp3SesDegeri : 0, t, 0.12);
  }

  // bitince(hataMi) şarkı bitince / çalınamazsa çağrılır
  M.mp3Cal = function (url, bitince) {
    M.baslat(); M.mp3Durdur();
    if (!mp3Gain) {
      mp3Gain = ctx.createGain(); analiz = ctx.createAnalyser(); analiz.fftSize = 256;
      fftBuf = new Uint8Array(analiz.frequencyBinCount);
      mp3Gain.connect(ana); mp3Gain.connect(analiz);
    }
    const el = new Audio(url); el.preload = "auto";
    ctx.createMediaElementSource(el).connect(mp3Gain);
    mp3El = el; mp3Calan = true; seviyeleriUygula();
    const bit = (hata) => { if (mp3El !== el) return; M.mp3Durdur(); bitince && bitince(!!hata); };
    el.onended = () => bit(false);
    el.onerror = () => bit(true);
    const sinir = window.AYAR?.mp3EnFazlaSaniye || 0;
    if (sinir > 0) mp3Zaman = setTimeout(() => {
      if (mp3El !== el) return;
      mp3Gain.gain.setTargetAtTime(0, ctx.currentTime, 0.6);   // yumuşak kısılma
      setTimeout(() => bit(false), 2500);
    }, sinir * 1000);
    el.play().catch(() => bit(true));
  };

  M.mp3Durdur = function () {
    clearTimeout(mp3Zaman);
    if (mp3El) { const el = mp3El; mp3El = null; el.onended = el.onerror = null; el.pause(); }
    mp3Calan = false; seviyeleriUygula();
  };
  M.mp3CaliyorMu = () => mp3Calan;
  M.mp3Ilerleme = () => (mp3El && mp3El.duration ? mp3El.currentTime / mp3El.duration : 0);

  // Oyunun TÜM müziğini (org + MP3) aç/kapa. Efekt sesleri (zılgıt, altın) devam eder.
  M.muzikAc = function (v) { muzikAcikMi = v === undefined ? !muzikAcikMi : !!v; seviyeleriUygula(); return muzikAcikMi; };
  M.muzikAcikMi = () => muzikAcikMi;
  M.sesDegistir = function (fark) {
    mp3SesDegeri = Math.max(0, Math.min(1, mp3SesDegeri + fark));
    if (window.AYAR) AYAR.muzikSes = Math.max(0, Math.min(1, (AYAR.muzikSes ?? 0.5) + fark * 0.6));
    seviyeleriUygula();
    return Math.round(mp3SesDegeri * 100);
  };
  M.sesSeviyesi = () => Math.round(mp3SesDegeri * 100);

  window.Muzik = M;
})();
