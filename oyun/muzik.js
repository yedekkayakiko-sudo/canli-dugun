// ============================================================
//  CANLI DÜĞÜN — MÜZİK MOTORU
//  Tüm müzik tarayıcıda anlık ÜRETİLİR (davul, org, zurna sesi).
//  Hiçbir kayıt/şarkı dosyası çalınmaz → telif riski yok.
//  Her istek şarkının adı bir "tohum" olur: aynı isim = aynı ezgi.
// ============================================================
(function () {
  const M = {};
  let ctx = null, ana, muzikGain, efektGain, gurultu;
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
      const komp = ctx.createDynamicsCompressor();
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

  M.durdur = function () { calisiyor = false; clearInterval(zamanlayici); };
  M.aktifMi = () => !!ctx && calisiyor && ctx.state === "running";
  M.sarki = function (isim) { return sarkiUret(isim); };
  M.tarzAdi = () => (tarz ? tarz.ad : "");
  M.cosku = function (v) { coskuDegeri = Math.max(0, Math.min(1, v)); };
  M.davulZurna = function (saniye) { if (ctx) davulZurnaBitis = ctx.currentTime + saniye; };

  // 0..1 arası "nabız": son düm'den bu yana geçen süreye göre (görsel senkron için)
  M.nabiz = function () {
    if (!ctx || !calisiyor) return 0;
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

  window.Muzik = M;
})();
