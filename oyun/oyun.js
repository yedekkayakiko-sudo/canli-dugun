// ============================================================
//  CANLI DÜĞÜN — OYUN (hikâyeli sürüm)
//  Düğün aşamaları: Kapı Tutma → Nikah + Ayak Basma → Halay →
//  Takı Merasimi → Pasta + Gelin Çiçeği → Konvoy  → (yeni düğün)
//  Tuval: 1080x1920. Olaylar Oyun.olay({...}) ile gelir.
// ============================================================
(function () {
  const A = window.AYAR, K = window.Karakter;
  const W = 1080, H = 1920, PI = Math.PI, TAM = PI * 2;
  const tuval = document.getElementById("tuval");
  const c = tuval.getContext("2d");
  tuval.width = W; tuval.height = H;

  const FONT = "'Baloo 2', 'Segoe UI', system-ui, sans-serif";
  const simdi = () => performance.now() / 1000;
  const sinirla = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const sec = (l) => l[Math.floor(Math.random() * l.length)];
  const sayi = (n) => Math.round(n).toLocaleString("tr-TR");
  const kucuk = (s) => String(s || "").toLocaleLowerCase("tr");
  const yumusak = (u) => u * u * (3 - 2 * u);
  function ses(ad, ...a) { const m = window.Muzik; if (m && typeof m[ad] === "function") m[ad](...a); }
  const F = Object.assign({ kapi: 70, nikah: 50, ayakOy: 14, halay: 110, taki: 90, pastaOy: 22, cicekOy: 14, final: 14, duello: 16, kopma: 10 }, A.fazSureleri || {});

  // ------------------------------------------------------------
  //  DURUM
  // ------------------------------------------------------------
  const S = {
    kisiler: new Map(), kalabalik: [],
    bekarlar: [], ciftSirasi: [], siradakiCicek: null,
    cift: null,
    istekler: [], calan: { sarki: "Hoş Geldiniz", kimden: null, bas: 0, bitis: 0, tarz: "" },
    mp3Listesi: [], sonMp3: null, mp3Hata: -999,
    turNo: 1, faz: null, vurus: 0,
    coskuHam: 0, sonKopma: -999, kopma: null,
    halayBasi: null, dugunSahibi: null, pistKrali: null,
    parcaciklar: [], yazilar: [], ucanlar: [],
    kombolar: new Map(),
    anonslar: [], anons: null,
    kismetler: [], kismet: null,
    sahneler: [], sahne: null, sonSahneTip: null,
    sovlar: [], sov: null,
    duello: null,
    npc: {},                      // sahnedeki karakterlerin konuşma balonları
    takiDefteri: [], takiHedef: A.takiHedefi || 300,
    sonDedikodu: 0, sonRoast: 0, sonZilgit: 0, sonOoh: 0, sonFlas: 0,
    sarsinti: 0, sonKart: null, ozet: null,
  };

  // ------------------------------------------------------------
  //  KİŞİLER
  // ------------------------------------------------------------
  const resimler = new Map();
  function resim(url) {
    if (!url) return null;
    if (resimler.has(url)) return resimler.get(url);
    const img = new Image();
    img.referrerPolicy = "no-referrer";
    img.onerror = () => { img._hata = true; };
    img.src = url;
    resimler.set(url, img);
    return img;
  }
  function ozet(id) { let h = 0; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; }

  function kisi(o) {
    let k = S.kisiler.get(o.id);
    if (!k) {
      const h = ozet(o.id);
      const arketip = K.rastgeleArketip(null);
      k = { id: o.id, ad: o.ad || o.id, foto: null, arketip, unvan: sec(K.ARKETIPLER[arketip].unvanlar),
            ton: h % 360, ten: h % 6, tohum: (h % 1000) / 100, puanTur: 0, puanToplam: 0,
            sonAktif: simdi(), cx: rnd(100, 980), cy: H + 140, olcek: 1, yon: 1,
            hareket: null, hareketBitis: 0, ifade: null, ifadeBitis: 0, oto: "dur", otoBitis: 0,
            balon: null, cins: null, nisanli: false, yeniBitis: simdi() + 6, roast: false, sonOy: 0, ek: {} };
      S.kisiler.set(o.id, k);
    }
    if (o.ad) k.ad = o.ad;
    if (o.foto && !k.foto) k.foto = resim(o.foto);
    k.sonAktif = simdi();
    return k;
  }
  const NPC_GELIN = { id: "_gelin", ad: "Gelin Hanım", npc: true, ton: 330, ten: 0, tohum: 1.2, puanTur: 0, puanToplam: 0, ek: {} };
  const NPC_DAMAT = { id: "_damat", ad: "Damat Bey", npc: true, ton: 220, ten: 2, tohum: 3.4, puanTur: 0, puanToplam: 0, ek: {} };
  S.kisiler.set(NPC_GELIN.id, NPC_GELIN); S.kisiler.set(NPC_DAMAT.id, NPC_DAMAT);

  function kisaAd(k, n = 14) {
    if (!k) return "?";
    if (k.npc) return k.ad;
    const a = "@" + (k.ad || k.id);
    return a.length > n ? a.slice(0, n - 1) + "…" : a;
  }
  function cinsiyetAyarla(k, cins) {
    if (!cins || k.npc) return;
    k.cins = cins;
    const ak = K.ARKETIPLER[k.arketip];
    if (ak && ak.cins && ak.cins !== cins) { k.arketip = K.rastgeleArketip(cins); k.unvan = sec(K.ARKETIPLER[k.arketip].unvanlar); }
  }
  function aktifSayisi() { const t = simdi(); let n = 0; for (const k of S.kisiler.values()) if (!k.npc && t - k.sonAktif < 120) n++; return n; }
  function ciftteMi(id) { return S.cift && (S.cift.gelin === id || S.cift.damat === id); }

  // ------------------------------------------------------------
  //  KALABALIK
  // ------------------------------------------------------------
  function kalabalikEkle(k, oneAl = false) {
    if (k.npc || ciftteMi(k.id)) return;
    const i = S.kalabalik.indexOf(k.id);
    if (i >= 0) { if (oneAl && i > 0) { S.kalabalik.splice(i, 1); S.kalabalik.splice(onSira(k), 0, k.id); } return; }
    if (S.kalabalik.length >= (A.halayKapasite || 24)) {
      let enEski = -1, z = Infinity;
      S.kalabalik.forEach((id, j) => {
        const p = S.kisiler.get(id);
        const puan = p.sonAktif + (p.puanTur > 0 ? 600 : 0) + (p.nisanli ? 300 : 0);
        if (puan < z && id !== S.halayBasi && (!S.duello || (id !== S.duello.a && id !== S.duello.b))) { z = puan; enEski = j; }
      });
      if (enEski >= 0) S.kalabalik.splice(enEski, 1);
    }
    if (oneAl) S.kalabalik.splice(onSira(k), 0, k.id); else S.kalabalik.push(k.id);
    k.cx = Math.random() < 0.5 ? -80 : W + 80; k.cy = rnd(1500, 1800);
    k.yeniBitis = simdi() + 6;
    ses("blip", oneAl);
  }
  function onSira(k) {
    let j = 0;
    while (j < S.kalabalik.length && S.kisiler.get(S.kalabalik[j]).puanTur >= k.puanTur) j++;
    return j;
  }
  function halayBasiGuncelle() {
    let en = null;
    for (const id of S.kalabalik) { const p = S.kisiler.get(id); if (p.puanTur > 0 && (!en || p.puanTur > en.puanTur)) en = p; }
    const eski = S.halayBasi;
    S.halayBasi = en ? en.id : null;
    if (en && eski !== en.id) {
      S.kalabalik.splice(S.kalabalik.indexOf(en.id), 1); S.kalabalik.unshift(en.id);
      anons(`🧣 ${kisaAd(en, 20)} HALAY BAŞI oldu! Mendil onda!`, "#ff8a80");
    }
  }

  function hareketVer(k, h, sure = 5, ifade) {
    k.hareket = h; k.hareketBitis = simdi() + sure;
    if (ifade) { k.ifade = ifade; k.ifadeBitis = simdi() + sure; }
  }
  function ifadeVer(k, ifade, sure = 3) { k.ifade = ifade; k.ifadeBitis = simdi() + sure; }
  function konus(k, metin, sure = 4) { k.balon = { metin, bitis: simdi() + sure }; }
  function npcKonus(ad, metin, sure = 3.5) { S.npc[ad] = { metin, bitis: simdi() + sure }; }

  const OTO_HAREKET = {
    teyze: ["dur", "gobek", "kollar", "alkis", "dur"], amca: ["gobek", "kasik", "omuz", "dur"],
    kuzenE: ["omuz", "zipla", "kollar", "break", "dondu"], kuzenK: ["dur", "zipla", "kollar", "dondu"],
    cocuk: ["zipla", "dondu", "cilgin", "zipla"], dayi: ["kollar", "omuz", "gobek", "dondu"],
    nine: ["dur", "kollar", "kasik", "alkis"], abla: ["gobek", "kollar", "dondu", "gobek"],
  };

  function kalabalikKonumlari(t) {
    const n = S.kalabalik.length, sonuc = [];
    const halay = (S.faz && S.faz.ad === "halay") || S.kopma;
    if (halay) {
      const on = Math.min(n, 12), kay = Math.sin(t * 0.8) * 16;
      for (let i = 0; i < n; i++) {
        let x, y, s;
        if (i < on) { const u = on === 1 ? 0.5 : i / (on - 1); x = 85 + u * 910 + kay; y = 1840 - Math.sin(u * PI) * 70; s = 0.98; }
        else { const m = n - on, j = i - on, u = m === 1 ? 0.5 : j / (m - 1); x = 130 + u * 820 - kay; y = 1620 - Math.sin(u * PI) * 40; s = 0.86; }
        sonuc.push({ id: S.kalabalik[i], x, y, s, sira: i, satir: i < on ? 0 : 1 });
      }
    } else {
      const satirlar = [{ y: 1845, s: 1.0, n: 7 }, { y: 1690, s: 0.9, n: 8 }, { y: 1545, s: 0.8, n: 9 }];
      let i = 0;
      for (let r = 0; r < satirlar.length && i < n; r++) {
        const sat = satirlar[r], adet = Math.min(sat.n, n - i);
        for (let j = 0; j < adet; j++, i++) {
          const u = adet === 1 ? 0.5 : j / (adet - 1);
          const k = S.kisiler.get(S.kalabalik[i]);
          const genis = 840 - r * 40;
          sonuc.push({ id: S.kalabalik[i], x: 540 - genis / 2 + u * genis + Math.sin(k.tohum * 5) * 18 + (r % 2 ? 30 : 0), y: sat.y + Math.cos(k.tohum * 3) * 10, s: sat.s, sira: i, satir: r });
        }
      }
    }
    return sonuc;
  }

  // ------------------------------------------------------------
  //  EFEKT ÜRETİCİLERİ
  // ------------------------------------------------------------
  function parcacik(o) { if (S.parcaciklar.length < 800) S.parcaciklar.push(Object.assign({ omur: 2, yas: 0, don: rnd(-3, 3), aci: rnd(0, 6), yerc: 600 }, o)); }
  function patlama(x, y, adet, tip, renkler, guc = 1) {
    for (let i = 0; i < adet; i++) {
      const a = rnd(0, TAM), h = rnd(200, 650) * guc;
      parcacik({ x, y, vx: Math.cos(a) * h, vy: Math.sin(a) * h - 220, tip, renk: renkler[i % renkler.length], boyut: rnd(10, 22), omur: rnd(1, 1.8) });
    }
  }
  function havaiFisek(x = rnd(150, W - 150), y = rnd(500, 900)) {
    const renk = sec(["#ff5252", "#ffd740", "#69f0ae", "#40c4ff", "#e040fb", "#ffffff"]);
    for (let i = 0; i < 48; i++) { const a = (i / 48) * TAM, h = rnd(240, 420); parcacik({ x, y, vx: Math.cos(a) * h, vy: Math.sin(a) * h, tip: "kivilcim", renk, boyut: rnd(4, 8), omur: rnd(1, 1.6), yerc: 180 }); }
    ses("pat");
  }
  function konfeti(adet) {
    for (let i = 0; i < adet; i++) parcacik({ x: rnd(0, W), y: rnd(-200, -10), vx: rnd(-60, 60), vy: rnd(150, 350), tip: "konfeti", renk: `hsl(${rnd(0, 360)},90%,60%)`, boyut: rnd(10, 18), omur: rnd(4, 6), yerc: 40 });
  }
  function paraYagmuru(adet, x0 = 0, x1 = W) {
    for (let i = 0; i < adet; i++) parcacik({ x: rnd(x0, x1), y: rnd(-300, -20), vx: rnd(-40, 40), vy: rnd(150, 300), tip: "para", boyut: rnd(26, 38), omur: rnd(4, 6), yerc: 30, don: rnd(-4, 4) });
  }
  function yuzenYazi(metin, x, y, renk = "#fff", boyut = 40, omur = 2, pop = true) { S.yazilar.push({ metin, x, y, renk, boyut, omur, yas: 0, pop }); }
  function anons(metin, renk = "#ffd54a", oncelikli = false) {
    if (oncelikli) { S.anonslar = []; S.anons = { metin, renk, bas: simdi() }; return; }
    S.anonslar.push({ metin, renk }); if (S.anonslar.length > 6) S.anonslar.shift();
  }
  function ucur(o) { S.ucanlar.push(Object.assign({ yas: 0, sure: 1.1, yay: 260, boyut: 28 }, o)); }

  // ------------------------------------------------------------
  //  ÇİFT
  // ------------------------------------------------------------
  function ciftKur(gelinId, damatId, neden) {
    S.cift = { gelin: gelinId, damat: damatId, takilar: [], toplam: 0, nazar: false, kafadaPasta: false, reis: null };
    for (const id of [gelinId, damatId]) {
      const i = S.kalabalik.indexOf(id); if (i >= 0) S.kalabalik.splice(i, 1);
      const k = S.kisiler.get(id); if (k) k.nisanli = true;
    }
    const g = S.kisiler.get(gelinId), d = S.kisiler.get(damatId);
    if (neden) anons(neden.replace("{g}", kisaAd(g, 16)).replace("{d}", kisaAd(d, 16)), "#ffffff");
  }

  function ciftBelirle() {
    const aktif = () => S.kalabalik.map(id => S.kisiler.get(id)).filter(k => k && simdi() - k.sonAktif < 240);
    const kadinMi = (k) => k.cins ? k.cins === "k" : (K.ARKETIPLER[k.arketip] || {}).cins === "k";
    const birini = (liste, istenen, haric) => {
      const uygun = liste.filter(k => k.id !== haric);
      const tercih = uygun.filter(k => istenen === "k" ? kadinMi(k) : !kadinMi(k));
      return (tercih.length ? sec(tercih) : (uygun.length ? sec(uygun) : null));
    };
    const bekarKisiler = () => S.bekarlar.map(b => S.kisiler.get(b.id)).filter(Boolean);
    const bekardanCikar = (id) => { S.bekarlar = S.bekarlar.filter(b => b.id !== id); };

    if (S.siradakiCicek && S.kisiler.get(S.siradakiCicek)) {
      const k = S.kisiler.get(S.siradakiCicek); S.siradakiCicek = null;
      const rol = kadinMi(k) ? "gelin" : "damat";
      const es = birini(bekarKisiler(), rol === "gelin" ? "e" : "k", k.id) || birini(aktif(), rol === "gelin" ? "e" : "k", k.id);
      bekardanCikar(k.id); if (es) bekardanCikar(es.id);
      const esId = es ? es.id : (rol === "gelin" ? NPC_DAMAT.id : NPC_GELIN.id);
      if (rol === "gelin") ciftKur(k.id, esId, "💐 Çiçeği kapan {g} GELİN oldu! Damat: {d} 😂");
      else ciftKur(esId, k.id, "💐 Çiçeği kapan {d} DAMAT oldu! Gelin: {g} 😂");
      return;
    }
    const cift = S.ciftSirasi.shift();
    if (cift && S.kisiler.get(cift.gelin) && S.kisiler.get(cift.damat)) { ciftKur(cift.gelin, cift.damat, "💘 Kısmetli çift evleniyor: {g} & {d}!"); return; }
    const g = birini(bekarKisiler(), "k") || birini(aktif(), "k");
    const d = birini(bekarKisiler(), "e", g && g.id) || birini(aktif(), "e", g && g.id);
    if (g) bekardanCikar(g.id); if (d) bekardanCikar(d.id);
    if (g && d) ciftKur(g.id, d.id, "🎲 KURA ÇEKİLDİ! {g} ile {d} evleniyor (haberleri yok 😂)");
    else if (g) ciftKur(g.id, NPC_DAMAT.id, "🎲 KURA: {g} gelin oldu! Damat aranıyor 😂");
    else ciftKur(NPC_GELIN.id, NPC_DAMAT.id, null);
  }

  function ciftDagit() {
    if (!S.cift) return;
    for (const id of [S.cift.gelin, S.cift.damat]) {
      const k = S.kisiler.get(id);
      if (k && !k.npc) { k.nisanli = false; if (simdi() - k.sonAktif < 300) kalabalikEkle(k); }
    }
    S.cift = null;
  }

  // ------------------------------------------------------------
  //  ÇÖPÇATANLIK
  // ------------------------------------------------------------
  function bekarEkle(k, metin) {
    let cins = null;
    if (/(^|\s)(kız|kiz|k|kadın|kadin|bayan)(\s|$|!)/.test(metin)) cins = "k";
    else if (/(^|\s)(erkek|e|bay|adam)(\s|$|!)/.test(metin)) cins = "e";
    cinsiyetAyarla(k, cins);
    if (k.nisanli || ciftteMi(k.id)) { konus(k, "Ben zaten nişanlıyım 💍", 3); return; }
    kalabalikEkle(k);
    if (S.bekarlar.some(b => b.id === k.id)) return;
    let es = S.bekarlar.findIndex(b => cins && b.cins && b.cins !== cins);
    if (es < 0) es = S.bekarlar.findIndex(b => !cins || !b.cins || b.cins !== cins);
    if (es >= 0) {
      const b = S.bekarlar.splice(es, 1)[0], k2 = S.kisiler.get(b.id);
      let gelin = k, damat = k2;
      if (cins === "e" || b.cins === "k") { gelin = k2; damat = k; }
      gelin.nisanli = damat.nisanli = true;
      S.ciftSirasi.push({ gelin: gelin.id, damat: damat.id });
      S.kismetler.push({ a: gelin.id, b: damat.id });
    } else {
      S.bekarlar.push({ id: k.id, cins, zaman: simdi() });
      konus(k, "Kısmetimi arıyorum 💘", 4);
      ifadeVer(k, "kalp", 4);
    }
  }

  // ------------------------------------------------------------
  //  ŞARKI / MP3 / KUMANDA
  // ------------------------------------------------------------
  const FAZ_HAVASI = { kapi: "Gelin Alma Havası", nikah: "Nikah Havası", halay: "Halay Havası", taki: "Takı Havası", pasta: "Pasta Havası", final: "Konvoy Havası" };
  function norm(x) {
    return kucuk(x).replace(/\.(mp3|m4a|ogg|wav)$/, "")
      .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u").replace(/[âä]/g, "a")
      .replace(/[^a-z0-9]+/g, " ").trim();
  }
  function dosyaAdi(d) { return d.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ").trim(); }
  function eslestir(istek) {
    const q = norm(istek);
    if (A.videoModu || q.length < 2 || !S.mp3Listesi.length) return null;
    const kel = q.split(" ").filter(w => w.length >= 2);
    let en = null, enPuan = 0;
    for (const d of S.mp3Listesi) {
      const n = norm(d);
      const puan = n.includes(q) ? 1 : kel.length ? kel.filter(w => n.includes(w)).length / kel.length : 0;
      if (puan > enPuan) { enPuan = puan; en = d; }
    }
    return enPuan >= 0.6 ? en : null;
  }
  function listeYukle() {
    if (!/^https?:/.test(location.protocol) || A.videoModu) return;
    fetch("sarkilar.json", { cache: "no-store" }).then(r => r.ok ? r.json() : []).then(l => {
      if (!Array.isArray(l)) return;
      const ilk = !S.mp3Listesi.length && l.length;
      S.mp3Listesi = l;
      if (ilk && A.bosOldugundaMp3 && !S.calan.kimden && !S.calan.mp3) sarkiDegistir();
    }).catch(() => {});
  }
  function istekEkle(k, sarki) {
    sarki = sarki.replace(/\s+/g, " ").trim().slice(0, 34);
    if (sarki.length < 2) return;
    S.istekler = S.istekler.filter(i => i.kimden !== k.id);
    const dosya = eslestir(sarki);
    S.istekler.push({ sarki: dosya ? dosyaAdi(dosya) : sarki, dosya, kimden: k.id, oncelik: k.puanToplam > 0, zaman: simdi() });
    S.istekler.sort((a, b) => (b.oncelik - a.oncelik) || (a.zaman - b.zaman));
    S.istekler = S.istekler.slice(0, 12);
    konus(k, dosya ? `📀 ${dosyaAdi(dosya)} — listede var!` : `🎵 İstek: ${sarki}`, 4);
    if (!S.calan.kimden) sarkiDegistir();
  }
  function sarkiDegistir(secim) {
    const sira = secim || S.istekler.shift();
    const mp3Olur = window.Muzik && !A.videoModu && simdi() - S.mp3Hata > 15;
    let ad, kimden = null, dosya = null;
    if (sira) {
      kimden = sira.kimden || null;
      dosya = mp3Olur ? (sira.dosya || eslestir(sira.sarki)) : null;
      ad = dosya ? dosyaAdi(dosya) : sira.sarki;
    } else if (mp3Olur && A.bosOldugundaMp3 && S.mp3Listesi.length) {
      const aday = S.mp3Listesi.length > 1 ? S.mp3Listesi.filter(d => d !== S.sonMp3) : S.mp3Listesi;
      dosya = sec(aday); ad = dosyaAdi(dosya);
    } else {
      ad = (S.faz && FAZ_HAVASI[S.faz.ad]) || "Düğün Havası";
    }
    const calan = { sarki: ad, kimden, bas: simdi(), bitis: 0, mp3: !!dosya, secim: !!(sira && !sira.kimden) };
    S.calan = calan;
    if (dosya) {
      S.sonMp3 = dosya; calan.bitis = Infinity; calan.tarz = "📀 orijinal kayıt";
      Muzik.mp3Cal("sarkilar/" + encodeURIComponent(dosya), (hata) => { if (hata) S.mp3Hata = simdi(); if (S.calan === calan) calan.bitis = 0; });
    } else {
      if (window.Muzik) { Muzik.mp3Durdur(); calan.tarz = "🎹 " + Muzik.sarki(ad + (kimden ? "" : S.turNo)); }
      calan.bitis = simdi() + (kimden ? 80 : 75);
    }
    if (kimden) {
      const k = S.kisiler.get(kimden);
      anons(`${dosya ? "📀" : "🎹"} Çalıyor: "${ad}" — istek: ${kisaAd(k, 18)}`, "#b388ff");
      npcKonus("orgcu", `Bu şarkı ${kisaAd(k, 12)} için! 🎤`, 4);
    }
  }
  function komut(o) {
    const k = o && o.komut;
    if (k === "muzik") return window.Muzik && Muzik.muzikAc(o.acik);
    if (k === "sonraki") return sarkiDegistir();
    if (k === "cal" && o.dosya) return sarkiDegistir({ sarki: dosyaAdi(o.dosya), dosya: o.dosya });
    if (k === "sesArti") return window.Muzik && Muzik.sesDegistir(0.1);
    if (k === "sesEksi") return window.Muzik && Muzik.sesDegistir(-0.1);
    if (k === "turBitir") return fazBaslat(FAZLAR.length - 1);
    if (k === "sonrakiFaz") return fazBitir();
    if (k === "istekSil") { S.istekler.splice(o.sira || 0, 1); return; }
  }
  function durumOzeti() {
    const ad = (id) => { const k = S.kisiler.get(id); return k ? k.ad : null; };
    return {
      tip: "oyunDurum",
      calan: { sarki: S.calan.sarki, kimden: ad(S.calan.kimden), mp3: S.calan.mp3 },
      istekler: S.istekler.slice(0, 10).map(i => ({ sarki: i.sarki, kimden: ad(i.kimden), mp3: !!i.dosya, oncelik: i.oncelik })),
      muzikAcik: window.Muzik ? Muzik.muzikAcikMi() : true,
      ses: window.Muzik ? Muzik.sesSeviyesi() : 0,
      sarkilar: S.mp3Listesi, turNo: S.turNo,
      faz: S.faz ? FAZLAR[S.faz.i].baslik : "", kalan: S.faz ? Math.max(0, Math.round(fazKalan())) : null,
      halay: S.kalabalik.length,
    };
  }

  // ------------------------------------------------------------
  //  AŞAMALAR (FAZLAR)
  // ------------------------------------------------------------
  const FAZLAR = [
    { ad: "kapi",  ikon: "🚪", baslik: "KAPI TUTMA" },
    { ad: "nikah", ikon: "💍", baslik: "NİKAH" },
    { ad: "halay", ikon: "💃", baslik: "HALAY" },
    { ad: "taki",  ikon: "💰", baslik: "TAKI MERASİMİ" },
    { ad: "pasta", ikon: "🎂", baslik: "PASTA & ÇİÇEK" },
    { ad: "final", ikon: "🚗", baslik: "KONVOY" },
  ];

  function fazBaslat(i) {
    const f = FAZLAR[i], t = simdi();
    S.faz = { i, ad: f.ad, bas: t, adim: "", adimBas: t };
    const a = aktifSayisi();
    if (f.ad === "kapi") Object.assign(S.faz, { adim: "tutma", puan: 0, hedef: Math.max(A.kapiEnAz || 120, a * 30), acik: 0, itme: 0 });
    if (f.ad === "nikah") Object.assign(S.faz, { adim: "soru", evet: 0, hedef: sinirla(Math.round(a * 0.6), 4, 25), oylar: new Map(), dusunce: 0 });
    if (f.ad === "halay") Object.assign(S.faz, { adim: "halay", duelloYapildi: false });
    if (f.ad === "taki") Object.assign(S.faz, { adim: "taki", baslangic: S.cift ? S.cift.toplam : 0 });
    if (f.ad === "pasta") Object.assign(S.faz, { adim: "giris", bulastir: new Set(), hedef: sinirla(Math.round(a * 0.4), 3, 15), cicekciler: new Set(), cicekKimde: null, kesik: false, ustKat: true });
    if (f.ad === "final") { Object.assign(S.faz, { adim: "konvoy" }); ozetHazirla(); ses("korna"); }
    const mesaj = {
      kapi: "🚪 Gelinin kardeşi kapıyı tuttu! Beğen ve yaz, kapıyı açtır!",
      nikah: "💍 Nikah başlıyor! Gelin düşünüyor... 'EVET' yazın!",
      halay: "💃 HALAY ZAMANI! Yaz → halaya katıl!",
      taki: "💰 TAKI MERASİMİ başladı! Kaynana defterini açtı 📒",
      pasta: "🎂 Pasta geliyor! Sonra gelin çiçeği atılacak 💐",
      final: "🚗 Konvoy kalkıyor! Mutluluklar! 🎉",
    }[f.ad];
    anons(mesaj, "#ffd54a", true);
    if (!S.calan.kimden && !S.calan.mp3) sarkiDegistir();
    if (f.ad === "kapi") npcKonus("kardes", "Bahşiş yoksa gelin yok! 😎", 5);
    if (f.ad === "taki") npcKonus("kaynana", "Herkes takısını göstersin! 📒👀", 5);
  }

  function adimGec(adim) { S.faz.adim = adim; S.faz.adimBas = simdi(); }
  function adimSure() { return simdi() - S.faz.adimBas; }
  function fazSure() { return simdi() - S.faz.bas; }

  function fazKalan() {
    const f = S.faz; if (!f) return 0;
    const a = adimSure();
    switch (f.ad) {
      case "kapi": return f.adim === "tutma" ? F.kapi - a : 5 - a;
      case "nikah": return f.adim === "soru" ? F.nikah - a : f.adim === "ayakOy" ? F.ayakOy - a : 4 - a;
      case "halay": return F.halay - fazSure();
      case "taki": return F.taki - fazSure();
      case "pasta": return f.adim === "oy" ? F.pastaOy - a : f.adim === "cicekOy" ? F.cicekOy - a : 3 - a;
      case "final": return F.final - fazSure();
    }
    return 0;
  }

  function fazBitir() {
    const f = S.faz;
    if (f.ad === "final") { yeniDugun(); return; }
    // Aşamayı hızlıca sonuna getir
    if (f.ad === "kapi" && f.adim === "tutma") return kapiAc(true);
    if (f.ad === "nikah" && f.adim === "soru") return evetDendi(true);
    if (f.ad === "nikah" && f.adim === "ayakOy") return ayakSonuc();
    if (f.ad === "pasta" && (f.adim === "oy" || f.adim === "giris" || f.adim === "kesim")) return bulastirBasla();
    if (f.ad === "pasta" && f.adim === "cicekOy") return cicekAt();
    fazBaslat(f.i + 1);
  }

  function yeniDugun() {
    ciftDagit();
    S.turNo++;
    turSifirla();
    ciftBelirle();
    fazBaslat(0);
  }
  function turSifirla() {
    for (const k of S.kisiler.values()) { k.puanTur = 0; k.roast = false; k.ek = {}; }
    S.halayBasi = null; S.dugunSahibi = null; S.pistKrali = null; S.takiDefteri = []; S.duello = null;
  }

  // --- KAPI ---
  function kapiPuan(p, k) {
    const f = S.faz; if (!f || f.ad !== "kapi" || f.adim !== "tutma") return;
    f.puan += p; f.itme = simdi() + 0.6;
    const o = f.puan / f.hedef;
    if (o >= 1) return kapiAc(false);
    const satir = o < 0.25 ? "Bahşiş yoksa gelin yok! 😎" : o < 0.5 ? "Az bu az! 😤" : o < 0.75 ? "Hmm... biraz daha 🤑" : "Neredeyse... 🤏";
    if (!S.npc.kardes || S.npc.kardes.metin !== satir) npcKonus("kardes", satir, 4);
  }
  function kapiAc(zorla) {
    const f = S.faz; adimGec("acilis");
    npcKonus("kardes", zorla ? "Of tamam, sıkıldım 🙄 Geç!" : "Tamam enişte, geç! 💸", 4);
    ses("kapi"); setTimeout(() => { ses("zilgit"); ses("alkis"); }, 600);
    konfeti(60); anons("🚪 KAPI AÇILDI! Gelin geliyor! 👰", "#69f0ae", true);
    kalabalikHepsi((k) => hareketVer(k, "zipla", 3, "coskulu"));
  }

  // --- NİKAH ---
  const DUSUNCELER = ["Hmm... 🤔", "Bi annemi arayayım 📞", "Takılar yeterli mi? 💰", "Damat biraz kısa mı? 🤏", "Ya kaynana? 😬", "Bir dakika... 🧐", "Düşünüyorum... 💭"];
  function evetEkle(k, n = 1) {
    const f = S.faz; if (!f || f.ad !== "nikah" || f.adim !== "soru") return;
    f.evet += n;
    if (k) { hareketVer(k, "zipla", 2, "coskulu"); }
    if (f.evet >= f.hedef) evetDendi(false);
  }
  function evetDendi(zorla) {
    adimGec("evet");
    if (zorla) npcKonus("memur", "Sessizlik ikrar sayılır! 😅", 3);
    npcKonus("gelin", "EVEEEET!!! 😍", 3);
    ses("zilgit"); ses("alkis"); konfeti(90);
    yuzenYazi("EVEEET! 💍", 540, 760, "#ffd54a", 110, 2.6);
    kalabalikHepsi((k) => hareketVer(k, "zafer", 3, "coskulu"));
  }
  function ayakOy(k, kim) {
    const f = S.faz; if (!f || f.ad !== "nikah" || f.adim !== "ayakOy") return;
    f.oylar.set(k.id, kim); hareketVer(k, "zipla", 1.5);
  }
  function ayakSonuc() {
    const f = S.faz;
    let g = 0, d = 0; for (const v of f.oylar.values()) v === "gelin" ? g++ : d++;
    f.kazanan = g === d ? sec(["gelin", "damat"]) : (g > d ? "gelin" : "damat");
    if (S.cift) S.cift.reis = f.kazanan;
    adimGec("ayakSonuc");
    setTimeout(() => { ses("boing"); ses("ooh"); }, 900);
    setTimeout(() => ses("alkis"), 1500);
    anons(f.kazanan === "gelin" ? "👣 Gelin bastı! EVİN REİSİ: GELİN 👑😂" : "👣 Damat bastı! EVİN REİSİ: DAMAT 👑😂", "#ff80ab");
  }

  // --- PASTA ---
  function bulastirBasla() { const f = S.faz; f.kesik = true; adimGec("bulastir"); ses("ooh"); }
  function cicekAt() {
    const f = S.faz;
    let aday = [...f.cicekciler].map(id => S.kisiler.get(id)).filter(k => k && S.kalabalik.includes(k.id));
    if (!aday.length) aday = S.kalabalik.map(id => S.kisiler.get(id)).filter(k => simdi() - k.sonAktif < 120);
    const k = aday.length ? sec(aday) : null;
    f.cicekKimde = k ? k.id : null;
    adimGec("cicekAtis"); ses("islik", true);
    if (k) {
      const g = ciftKonumu().g;
      ucur({ tip: "cicek", x: g.x, y: g.y - 200, hx: () => k.cx, hy: () => k.cy - 170 * (k.olcek || 1), sure: 1.8, yay: 420, boyut: 50,
        varis: () => {
          S.siradakiCicek = k.id; hareketVer(k, "zafer", 5, "kalp");
          patlama(k.cx, k.cy - 180, 30, "kalp", ["#ff4081", "#ff80ab", "#fff"]);
          ses("zilgit"); ses("alkis");
          yuzenYazi(`💐 ÇİÇEĞİ ${kisaAd(k, 16)} KAPTI!`, 540, 820, "#ff80ab", 64, 3.5);
          anons(`💐 Çiçeği ${kisaAd(k, 18)} kaptı! SIRADAKİ DÜĞÜN ONUN! 💍`, "#ff80ab");
        } });
    }
  }

  // ------------------------------------------------------------
  //  RASTGELE OLAYLAR: düello, kopma, dedikodu, kaynana
  // ------------------------------------------------------------
  function kalabalikHepsi(fn) { for (const id of S.kalabalik) fn(S.kisiler.get(id)); }

  function duelloBaslat() {
    const aday = S.kalabalik.map(id => S.kisiler.get(id)).filter(k => simdi() - k.sonAktif < 120).sort(() => Math.random() - 0.5);
    if (aday.length < 2) return false;
    S.duello = { a: aday[0].id, b: aday[1].id, bas: simdi(), oylar: new Map(), bitti: false };
    anons(`⚔️ DANS DÜELLOSU: ${kisaAd(aday[0], 14)} vs ${kisaAd(aday[1], 14)} — '1' ya da '2' yaz!`, "#40c4ff");
    ses("hey");
    return true;
  }
  function duelloBitir() {
    const d = S.duello; if (!d || d.bitti) return;
    let a = 0, b = 0; for (const v of d.oylar.values()) v === 1 ? a++ : b++;
    const kazanan = a === b ? sec([d.a, d.b]) : (a > b ? d.a : d.b), kaybeden = kazanan === d.a ? d.b : d.a;
    d.bitti = true; d.kazanan = kazanan; d.bitis = simdi();
    const kz = S.kisiler.get(kazanan), kb = S.kisiler.get(kaybeden);
    S.pistKrali = kazanan;
    hareketVer(kz, "zafer", 5, "coskulu");
    hareketVer(kb, "dusme", 4, "baygin"); ses("dusus");
    anons(`👑 PİSTİN KRALI: ${kisaAd(kz, 18)}! ${kisaAd(kb, 14)} yere serildi 😵`, "#40c4ff");
    ses("alkis");
  }

  function kopmaBaslat() {
    S.kopma = { bas: simdi(), sure: F.kopma }; S.sonKopma = simdi(); S.coskuHam = (A.coskuIcinBegeni || 300) * 0.3;
    ses("hey"); ses("davulZurna", F.kopma); ses("zilgit");
    anons("🔥 KOPMA ANI! Herkes çıldırdı! 🔥", "#ff5252");
    kalabalikHepsi((k) => { k.oto = sec(["cilgin", "break", "zipla", "dondu", "gobek", "omuz"]); k.otoBitis = simdi() + 2; });
  }

  const DEDIKODU = [
    "{h} hâlâ evlenmedi mi? 🤔", "{h}, sıra sende! 💍", "Şu {h} nasıl oynuyor öyle! 😂", "Yemekler ne zaman gelecek? 🍗",
    "Gelinin elbisesi kiralık mı? 🤭", "{h} pek şık olmuş, maşallah 🧿", "{h}, sana da kısmet bakalım mı? 😏",
    "Damat biraz kısa mı ne? 🤏", "Takılar sayıldı mı? 📝", "{h} pastayı gözüne kestirdi 🎂👀",
    "Benim zamanımda düğün 3 gün sürerdi! 👵", "{h} halay başına geçsin! 💪", "Gelin {g} çok güzel olmuş 🧿",
    "Damat {d} heyecandan terlemiş 😅", "{h}, yemekten sonra kaçma! 😂", "Orgcu bu şarkıyı 3. kez çalıyor 🙄",
    "{h} geldi, takı nerde? 👀", "{h} bekar mı acaba? 💘",
  ];
  function dedikodu() {
    const liste = S.kalabalik.map(id => S.kisiler.get(id));
    if (liste.length < 2 || !S.cift) return;
    const konusan = liste.find(k => ["teyze", "nine", "abla"].includes(k.arketip) && !(k.balon && simdi() < k.balon.bitis) && Math.random() < 0.5) || sec(liste);
    const hedef = sec(liste.filter(k => k !== konusan));
    const g = S.kisiler.get(S.cift.gelin), d = S.kisiler.get(S.cift.damat);
    const metin = sec(DEDIKODU).replace("{h}", kisaAd(hedef, 14)).replace("{g}", kisaAd(g, 12)).replace("{d}", kisaAd(d, 12));
    konus(konusan, metin, 5);
    hareketVer(konusan, "konusma", 4);
    if (metin.includes(kisaAd(hedef, 14))) ifadeVer(hedef, "sok", 3);
  }

  function kaynanaTepki(k, coin, adet) {
    const satirlar = coin >= 999 ? ["CUMHURİYET! Bu aile zengin! 🤑", "Maşallah maşallah! 😍💰", "İşte takı budur! 🤩"]
      : coin >= 199 ? ["TAM altın! Maşallah 😍", "Isırdım, gerçekmiş! ✅", "Bu takı defterin başına! 📒"]
      : coin >= 99 ? ["YARIM altın! Fena değil 👍", "Isırdım... gerçek ✅", "Hıh, idare eder 🤨"]
      : ["ÇEYREK mi bu? 🤨", "Ufak ama olsun 🙄", "Isırayım... hmm 🧐"];
    npcKonus("kaynana", `${kisaAd(k, 12)}: ${sec(satirlar)}`, 3.5);
    S.npc.kaynanaIsir = simdi();
  }
  function kaynanaRoast() {
    const aday = S.kalabalik.map(id => S.kisiler.get(id)).filter(k => k.puanToplam === 0 && !k.roast && simdi() - k.sonAktif < 40);
    if (!aday.length) return;
    const k = sec(aday); k.roast = true;
    npcKonus("kaynana", sec([`${kisaAd(k, 14)} eli boş mu geldin? 👀`, `${kisaAd(k, 14)}, takın nerde? 📒`, `${kisaAd(k, 14)} defterde yoksun! 🤨`]), 4.5);
    ifadeVer(k, "gergin", 4); k.ek.terli = true; setTimeout(() => { k.ek.terli = false; }, 4000);
  }

  // ------------------------------------------------------------
  //  HEDİYE
  // ------------------------------------------------------------
  function kademeBul(ad, coin) {
    const ozel = (A.ozelHediyeler || {})[kucuk(ad)];
    if (ozel) return ozel === "pasta" ? "sahne" : ozel;
    let t = "mini";
    for (const k of A.kademeler) if (coin >= k.enAz) t = k.tur === "pasta" ? "sahne" : k.tur;
    return t;
  }
  function takiAdi(coin) { let s = A.takiAdlari[0]; for (const t of A.takiAdlari) if (coin >= t.enAz) s = t; return s; }
  function hediyeEmoji(ad) { const t = (A.testHediyeleri || []).find(h => kucuk(h.ad) === kucuk(ad)); return t ? t.emoji : "🎁"; }

  function hediye(o) {
    const k = kisi(o);
    const coin = Math.max(1, Number(o.coin) || 1);
    const adet = Math.max(1, Math.min(500, Number(o.adet) || 1));
    const toplam = coin * adet;
    k.puanTur += toplam; k.puanToplam += toplam;
    kalabalikEkle(k, true); halayBasiGuncelle();
    S.istekler.forEach(i => { if (i.kimden === k.id) i.oncelik = true; });
    const anahtar = k.id + "|" + o.hediye;
    const kb = S.kombolar.get(anahtar) || { sayi: 0, kisi: k.id, emoji: hediyeEmoji(o.hediye) };
    kb.sayi += adet; kb.bitis = simdi() + 3.5; kb.vurus = simdi(); S.kombolar.set(anahtar, kb);
    if (S.cift) S.cift.toplam += toplam;

    const f = S.faz;
    // Aşamaya özel etkiler
    if (f.ad === "kapi" && f.adim === "tutma") {
      for (let i = 0; i < Math.min(adet, 4); i++) ucur({ tip: "para", x: k.cx, y: k.cy - 150, hx: 640, hy: 1050, sure: 0.9 + i * 0.15, varis: () => ses("kasa") });
      kapiPuan(toplam * 5, k);
      hareketVer(k, "cilgin", 3, "coskulu");
      if (coin >= 10) anons(`💸 ${kisaAd(k, 16)} kardeşe bahşiş verdi: ${sayi(toplam)} coin!`, "#69f0ae");
      if (coin < 500) return;
    }
    if (f.ad === "nikah" && f.adim === "soru") { evetEkle(null, Math.min(3 * adet, 10)); npcKonus("memur", "Rüşvet kabul edildi 😂", 2.5); }

    const tur = kademeBul(o.hediye, coin);
    if (tur === "mini") {
      hareketVer(k, sec(["cilgin", "break", "dondu", "zipla"]), 4, sec(["coskulu", "cilgin", "kalp"]));
      for (let i = 0; i < Math.min(adet, 5); i++) { const p = ciftKonumu(); ucur({ tip: "gul", x: k.cx, y: k.cy - 160, hx: (i % 2 ? p.g.x : p.d.x) + rnd(-20, 20), hy: p.g.y - 120, sure: 0.8 + i * 0.12, yay: 200, boyut: 30 }); }
      patlama(k.cx, k.cy - 160, Math.min(6 + adet * 2, 28), coin <= 1 ? "gul" : "kalp", ["#ff1744", "#ff4081", "#ff80ab"]);
    } else if (tur === "nazar") {
      for (let i = 0; i < Math.min(12 + adet * 6, 60); i++) parcacik({ x: rnd(40, W - 40), y: rnd(-300, -20), vx: rnd(-30, 30), vy: rnd(200, 420), tip: "nazar", boyut: rnd(16, 30), omur: 5, yerc: 60 });
      if (S.cift) S.cift.nazar = true;
      anons(`🧿 ${kisaAd(k, 20)}: Nazar değmesin bu düğüne!`, "#4fc3f7");
      hareketVer(k, "kollar", 4, "mutlu");
    } else if (tur === "taki") {
      const ta = takiAdi(coin);
      for (let i = 0; i < Math.min(adet, 6); i++) altinFirlat(k, ta, i * 0.18);
      anons(`🎤 ${kisaAd(k, 18)} → ${adet > 1 ? adet + " x " : ""}${ta.ad}! Maşallah!`, ta.renk);
      kaynanaTepki(k, coin, adet);
      S.takiDefteri.unshift({ kimden: k.id, ad: ta.ad, renk: ta.renk, adet }); S.takiDefteri = S.takiDefteri.slice(0, 7);
      hareketVer(k, "kollar", 4, "coskulu");
      if (coin >= 199 && simdi() - S.sonZilgit > 2) { ses("zilgit"); S.sonZilgit = simdi(); }
    } else if (tur === "sahne") {
      altinFirlat(k, takiAdi(coin), 0);
      for (let i = 0; i < Math.min(adet, 3); i++) S.sahneler.push({ kisi: k.id });
      S.takiDefteri.unshift({ kimden: k.id, ad: takiAdi(coin).ad, renk: "#ff9800", adet }); S.takiDefteri = S.takiDefteri.slice(0, 7);
      hareketVer(k, "zafer", 5, "havali");
    } else if (tur === "efsane") {
      altinFirlat(k, takiAdi(coin), 0);
      S.sovlar.push({ tip: "efsane", kisi: k.id, sure: A.videoModu ? 10 : 14, coin: toplam });
      S.takiDefteri.unshift({ kimden: k.id, ad: "SET TAKIMI 👑", renk: "#ff6f00", adet }); S.takiDefteri = S.takiDefteri.slice(0, 7);
    }
    // Takı hedefi → gelin-damat takıdan yürüyemez
    if (S.cift && S.cift.toplam >= S.takiHedef && !S.cift.agir) {
      S.cift.agir = true;
      anons("💰 Takılar çok ağır! Gelin-damat yürüyemiyor! 😂", "#ffd54a");
      npcKonus("kaynana", "Bu kadar altını nereye koyacağız?! 🤑", 4);
    }
  }

  function altinFirlat(k, ta, gecikme) {
    if (!S.cift) return;
    const hedef = S.cift.takilar.length % 2 === 0 ? "g" : "d";
    ucur({ tip: "altin", renk: ta.renk, x: k.cx, y: k.cy - 160, hx: () => ciftKonumu()[hedef].x, hy: () => ciftKonumu()[hedef].y - 120 * ciftKonumu()[hedef].s, yas: -gecikme, sure: 1.1, boyut: 30,
      varis: (x, y) => {
        if (S.cift) S.cift.takilar.push({ renk: ta.renk, hedef, kimden: k.id });
        patlama(x, y, 14, "kivilcim", ["#ffd54a", "#fff59d", "#ffb300"]);
        yuzenYazi(ta.ad, x, y - 80, ta.renk, 36, 1.6);
        ses("altin");
      } });
  }

  // ------------------------------------------------------------
  //  SOHBET → OLAY
  // ------------------------------------------------------------
  function yasakli(m) { const k = kucuk(m); return (A.yasakliKelimeler || []).some(y => y && k.includes(kucuk(y))); }
  const HAREKET_KOMUT = [
    [/^(oyna|dans|oyna!+)$/, () => sec(["cilgin", "dondu", "kollar", "gobek", "omuz"]), "coskulu"],
    [/^(göbek|gobek|göbek at|gobek at)$/, "gobek", "mutlu"], [/^(zıpla|zipla|hopla)$/, "zipla", "coskulu"],
    [/^(kaşık|kasik)$/, "kasik", "mutlu"], [/^(break|breakdance|brek)$/, "break", "havali"],
    [/^(bayıl|bayil)$/, "dusme", "baygin"], [/^(ağla|agla)$/, "agla", "aglama"], [/^(omuz)$/, "omuz", "coskulu"],
    [/^(çıldır|cildir)$/, "cilgin", "cilgin"], [/^(alkış|alkis)$/, "alkis", "mutlu"], [/^(selam|merhaba|sa|selamün aleyküm)$/, "selam", "mutlu"],
  ];

  function olay(o) {
    if (!o || !o.id) return;
    const t = simdi();
    if (o.tip === "yorum") {
      const metin = String(o.metin || "").trim();
      if (!metin || yasakli(metin)) return;
      const k = kisi(o);
      const km = kucuk(metin).replace(/[!.?,]+$/g, "").trim();
      const f = S.faz;
      // İstek şarkı
      const istek = km.match(/^[!/.]?\s*(şarkı|sarki|istek|şarki|sarkı)\s*[:\-]?\s*(.+)$/);
      if (istek) { kalabalikEkle(k); istekEkle(k, metin.slice(metin.length - istek[2].length)); return; }
      // Bekar
      if (/\bbekar|bekâr/.test(km) || /^!?\s*(tanış|tanis)/.test(km)) { bekarEkle(k, km); return; }
      kalabalikEkle(k);
      // Aşama komutları
      if (f.ad === "kapi" && f.adim === "tutma") kapiPuan(3, k);
      if (f.ad === "nikah" && f.adim === "soru" && /\bevet\b/.test(km)) {
        if (t - k.sonOy > 1.2) { k.sonOy = t; evetEkle(k, 1); }
        konus(k, "EVET! 💍", 2); return;
      }
      if (f.ad === "nikah" && f.adim === "soru" && /\b(hayır|hayir)\b/.test(km) && t - S.sonOoh > 6) {
        S.sonOoh = t; ses("ooh"); npcKonus("gelin", `${kisaAd(k, 14)} 'hayır' mı dedi?! 😱`, 3); ifadeVer(k, "havali", 3); konus(k, "HAYIR! 😈", 2.5); return;
      }
      if (f.ad === "nikah" && f.adim === "ayakOy") {
        if (/\bgelin\b/.test(km)) { ayakOy(k, "gelin"); konus(k, "Gelin bassın! 👰", 2); return; }
        if (/\bdamat\b/.test(km)) { ayakOy(k, "damat"); konus(k, "Damat bassın! 🤵", 2); return; }
      }
      if (f.ad === "pasta" && f.adim === "oy" && /(bulaştır|bulastir|bulaş|bulas)/.test(km)) {
        f.bulastir.add(k.id); konus(k, "BULAŞTIR! 🎂😂", 2); hareketVer(k, "zipla", 2, "cilgin");
        if (f.bulastir.size >= f.hedef) bulastirBasla(); return;
      }
      if (f.ad === "pasta" && f.adim === "cicekOy" && /(çiçek|cicek)/.test(km)) {
        f.cicekciler.add(k.id); konus(k, "Çiçek benim! 💐", 2.5); hareketVer(k, "zafer", 3, "kalp"); return;
      }
      if (S.duello && !S.duello.bitti && /^[12]$/.test(km)) {
        S.duello.oylar.set(k.id, Number(km)); hareketVer(k, "zipla", 1.2); return;
      }
      // Karakter hareket komutları
      for (const [re, h, ifade] of HAREKET_KOMUT) {
        if (re.test(km)) {
          const hh = typeof h === "function" ? h() : h;
          hareketVer(k, hh, hh === "dusme" ? 3.5 : 6, ifade);
          if (hh === "dusme") ses("dusus");
          if (hh === "break" || hh === "cilgin") ses("boing");
          return;
        }
      }
      if (/^(zılgıt|zilgit|lililili|lilili)/.test(km)) {
        hareketVer(k, "kollar", 3, "coskulu"); konus(k, "Lililililiii! 🎉", 2.5);
        if (t - S.sonZilgit > 2.5) { ses("zilgit"); S.sonZilgit = t; } return;
      }
      if (/^(öp|op|öpücük|opucuk)$/.test(km)) { ifadeVer(k, "opucuk", 3); ses("opucuk"); patlama(k.cx, k.cy - 170, 8, "kalp", ["#ff4081"]); return; }
      konus(k, metin.length > 30 ? metin.slice(0, 29) + "…" : metin, A.balonSuresi || 5);
    } else if (o.tip === "hediye") {
      hediye(o);
    } else if (o.tip === "begeni") {
      const k = kisi(o);
      const adet = Math.max(1, Number(o.adet) || 1);
      S.coskuHam += adet;
      if (S.kalabalik.length < (A.halayKapasite || 24)) kalabalikEkle(k);
      kapiPuan(Math.min(adet, 50), k);
      for (let i = 0; i < Math.min(adet, 4); i++)
        parcacik({ x: rnd(920, 1050), y: rnd(1300, 1360), vx: rnd(-60, 20), vy: rnd(-350, -200), tip: "kalp", renk: "#ff4081", boyut: rnd(14, 24), omur: 1.6, yerc: -40 });
    } else if (o.tip === "takip") {
      const k = kisi(o); kalabalikEkle(k);
      anons(`📸 ${kisaAd(k, 20)} aileye katıldı! Aile fotoğrafı!`, "#69f0ae");
      if (t - S.sonFlas > 6) { S.sonFlas = t; S.flas = t; ses("flas"); }
      hareketVer(k, "selam", 4, "mutlu");
    } else if (o.tip === "paylasim") {
      const k = kisi(o); kalabalikEkle(k);
      anons(`📣 ${kisaAd(k, 20)} düğünü herkese duyurdu!`, "#40c4ff");
      konfeti(25); hareketVer(k, "zafer", 3, "coskulu");
    } else if (o.tip === "giris") {
      const k = kisi(o);
      if (S.anonslar.length < 2) yuzenYazi(`👋 ${kisaAd(k, 18)} düğüne geldi`, 540, 1320, "#e1bee7", 30, 2.2, false);
    }
  }

  // ------------------------------------------------------------
  //  SAHNE KONUMLARI (çift + komik sahneler)
  // ------------------------------------------------------------
  const SAHNE_TIPLERI = ["havaya", "kucak", "tango", "kaynana", "serenat"];
  const SAHNE_BASLIK = {
    havaya: "🙌 DAMADI HAVAYA ATIN!", kucak: "💪 GELİN DAMADI KUCAKLADI!", tango: "🌹 TANGO ZAMANI!",
    kaynana: "😤 KAYNANA ARAYA GİRDİ!", serenat: "🎤 DAMAT ŞARKI SÖYLÜYOR... 🙉",
  };

  function ciftKonumu() {
    const t = simdi(), f = S.faz, Y = 1250;
    const r = {
      g: { x: 450, y: Y, s: 1.5, hareket: "sallan", ifade: "mutlu", yon: 1, ek: {} },
      d: { x: 630, y: Y, s: 1.5, hareket: "sallan", ifade: "mutlu", yon: -1, ek: {} },
      gGizli: false, ekstra: null,
    };
    if (!f) return r;
    const agir = S.cift && S.cift.agir;
    if (f.ad === "kapi") {
      r.d = { x: 360, y: Y, s: 1.5, hareket: simdi() < f.itme ? "itme" : "dur", ifade: "gergin", yon: 1, ek: { terli: true } };
      if (f.adim === "tutma") r.gGizli = true;
      else { const u = sinirla(adimSure() / 1.8, 0, 1); r.g = { x: 640 - u * 180, y: Y, s: 1.5, hareket: "selam", ifade: "coskulu", yon: 1, ek: {} }; r.d.hareket = "zafer"; r.d.ifade = "kalp"; r.d.ek = {}; r.d.x = 360 + u * 260; r.d.yon = -1; }
    } else if (f.ad === "nikah") {
      r.g = { x: 270, y: Y, s: 1.5, hareket: "dusunme", ifade: "dusunceli", yon: 1, ek: {} };
      r.d = { x: 810, y: Y, s: 1.5, hareket: "dur", ifade: "gergin", yon: -1, ek: { terli: true } };
      if (f.adim === "evet") { r.g.hareket = "zafer"; r.g.ifade = "coskulu"; r.d.hareket = "zafer"; r.d.ifade = "kalp"; r.d.ek = {}; }
      if (f.adim === "ayakOy") { r.g.x = 430; r.d.x = 650; r.g.hareket = "dur"; r.g.ifade = "kizgin"; r.d.hareket = "dur"; r.d.ifade = "kizgin"; r.d.ek = {}; }
      if (f.adim === "ayakSonuc") {
        const u = adimSure();
        r.g.x = 450; r.d.x = 630; r.g.hareket = "dur"; r.d.hareket = "dur"; r.d.ek = {};
        const kazanan = f.kazanan === "gelin" ? r.g : r.d, kaybeden = f.kazanan === "gelin" ? r.d : r.g;
        if (u < 0.9) { kazanan.ifade = "kizgin"; kazanan.ek = { poz: Object.assign(K.poz("dur", 0, t, 0), { bR: 0.9 * (u / 0.9), y: -10 }) }; kaybeden.ifade = "normal"; }
        else { kazanan.hareket = "zafer"; kazanan.ifade = "havali"; kazanan.ek = { tac: true }; kaybeden.hareket = "zipla"; kaybeden.ifade = "aglama"; kaybeden.ek = { yildiz: u < 3 }; }
      }
    } else if (f.ad === "halay") {
      r.g.hareket = "halay"; r.d.hareket = "halay"; r.g.ifade = "coskulu"; r.d.ifade = "coskulu";
      if (S.duello && !S.duello.bitti) { r.g.x = 470; r.d.x = 610; r.g.s = r.d.s = 1.25; r.g.y = r.d.y = 1215; r.g.hareket = r.d.hareket = "alkis"; }
    } else if (f.ad === "taki") {
      r.g.hareket = "selam"; r.d.hareket = "dur"; r.g.ifade = "mutlu"; r.d.ifade = "mutlu";
      if (agir) { r.g.hareket = r.d.hareket = "egilme"; r.g.ifade = r.d.ifade = "gergin"; r.g.ek = { terli: true }; r.d.ek = { terli: true }; }
    } else if (f.ad === "pasta") {
      r.g = { x: 330, y: Y, s: 1.5, hareket: "dur", ifade: "mutlu", yon: 1, ek: {} };
      r.d = { x: 750, y: Y, s: 1.5, hareket: "dur", ifade: "mutlu", yon: -1, ek: { esya: "bicak" } };
      if (f.adim === "kesim") { const u = sinirla(adimSure() / 1.5, 0, 1); r.d.x = 750 - u * 120; r.g.x = 330 + u * 120; r.d.hareket = "elUzat"; }
      if (f.adim === "kesim") { r.d.x = 750; r.g.x = 330; }
      if (f.adim === "oy") { r.d.ek = { esya: "bicak" }; r.d.hareket = "dusunme"; r.d.ifade = "havali"; r.g.ifade = "sok"; }
      if (f.adim === "bulastir") {
        const u = adimSure();
        r.g.x = 320; r.d.x = Math.max(450, 750 - u * 280); r.d.yon = -1; r.d.ek = {};
        if (u < 1.2) { r.d.hareket = "elUzat"; r.d.ifade = "havali"; }
        else { r.g.ek = { kremali: true }; r.g.ifade = u < 2 ? "sok" : "kizgin"; r.d.hareket = "alkis"; r.d.ifade = "coskulu"; }
        if (u > 3.6) { r.d.ek = { kremali: true }; r.d.ifade = "baygin"; r.d.hareket = "dusunme"; r.g.hareket = "zafer"; r.g.ifade = "coskulu"; }
        if (u > 5) { r.g.ifade = r.d.ifade = "coskulu"; r.g.hareket = r.d.hareket = "cilgin"; }
      }
      if (f.adim === "cicekOy") { r.g = { x: 540, y: Y, s: 1.5, hareket: "zafer", ifade: "mutlu", yon: -1, ek: { esya: "cicek", kremali: true } }; r.d = { x: 760, y: Y, s: 1.4, hareket: "alkis", ifade: "coskulu", yon: -1, ek: { kremali: true } }; }
      if (f.adim === "cicekAtis" || f.adim === "cicekSonuc") { r.g = { x: 540, y: Y, s: 1.5, hareket: "zafer", ifade: "coskulu", yon: -1, ek: { kremali: true } }; r.d = { x: 760, y: Y, s: 1.4, hareket: "alkis", ifade: "coskulu", yon: -1, ek: { kremali: true } }; }
      if (S.cift && S.cift.kafadaPasta) r.d.ek.kafaPasta = true;
    } else if (f.ad === "final") {
      r.gGizli = true;
    }
    if (S.kopma && f.ad !== "final" && !r.gGizli) { r.g.hareket = "cilgin"; r.d.hareket = "cilgin"; r.g.ifade = r.d.ifade = "cilgin"; }

    // Komik sahne üstüne yazar
    const sh = S.sahne;
    if (sh && !r.gGizli) {
      const u = (t - sh.bas) / sh.sure, g = r.g, d = r.d;
      g.x = 430; d.x = 650; g.y = d.y = Y; g.s = d.s = 1.5; g.ek = {}; d.ek = {};
      if (sh.tip === "havaya") {
        const atis = Math.abs(Math.sin(u * PI * 4));
        d.y = Y - 40 - atis * 330; d.x = 560; d.hareket = "cilgin"; d.ifade = "sok"; d.ek = { poz: Object.assign(K.poz("cilgin", 0, t, 1), { tum: Math.sin(u * PI * 4) * 0.6, pivot: -90 }) };
        g.x = 330; g.hareket = "alkis"; g.ifade = "coskulu";
        r.ekstra = "atanlar";
      } else if (sh.tip === "kucak") {
        g.x = 520; g.hareket = "zafer"; g.ifade = "havali";
        if (u < 0.65) { d.x = 520; d.y = Y - 175 - Math.abs(Math.sin(t * 6)) * 12; d.ek = { poz: Object.assign(K.poz("sallan", 0, t, 0), { tum: -PI / 2, pivot: -90 }) }; d.ifade = "kalp"; g.ek = { poz: Object.assign(K.poz("zafer", 0, t, 0), { y: 0, rot: Math.sin(t * 8) * 0.15 }) }; }
        else { g.hareket = "dusme"; g.ifade = "baygin"; g.ek = { yildiz: true }; d.x = 640; d.hareket = "dusme"; d.ifade = "baygin"; d.ek = { yildiz: true }; }
      } else if (sh.tip === "tango") {
        g.x = 600; d.x = 470; d.yon = 1; g.yon = -1; d.ek = { esya: "cicek" };
        d.hareket = "elUzat"; d.ifade = "opucuk";
        g.ek = { poz: Object.assign(K.poz("sallan", 0, t, 0), { rot: -0.75 - Math.sin(u * PI) * 0.2, kL: [2.4, 2.8], kR: [1.4, 1.2] }) }; g.ifade = "kalp";
      } else if (sh.tip === "kaynana") {
        g.x = 330; d.x = 750; g.ifade = "sok"; d.ifade = "sok"; g.hareket = "dur"; d.hareket = "dur";
        r.ekstra = "kaynanaOrtada";
      } else if (sh.tip === "serenat") {
        d.x = 620; d.y = Y + 30; d.yon = -1; d.hareket = "konusma"; d.ifade = u < 0.55 ? "mutlu" : "coskulu"; d.ek = { esya: "mikrofon", poz: Object.assign(K.poz("konusma", 0, t, 0), { bL: 1.4, bR: -0.2, y: 26 }) };
        g.x = 440; g.hareket = u < 0.55 ? "sallan" : "agla"; g.ifade = u < 0.55 ? "kalp" : "aglama";
      }
    }
    if (S.cift && S.cift.agir && f.ad !== "taki" && !sh) { r.g.ek.terli = true; r.d.ek.terli = true; }
    return r;
  }

  // ------------------------------------------------------------
  //  GÜNCELLEME
  // ------------------------------------------------------------
  let sonT = simdi();
  function guncelle() {
    const t = simdi(), dt = Math.min(0.05, t - sonT); sonT = t;
    const vs = window.Muzik ? Muzik.vurusSuresi() : 0.5;
    S.vurus += dt / Math.max(0.2, vs);
    S.coskuHam *= Math.pow(0.9, dt);
    const cosku = sinirla(S.coskuHam / (A.coskuIcinBegeni || 300), 0, 1);
    window.Muzik && Muzik.cosku(cosku);
    if (cosku >= 1 && !S.kopma && t - S.sonKopma > 40 && S.faz.ad !== "final") kopmaBaslat();
    if (S.kopma && t - S.kopma.bas > S.kopma.sure) S.kopma = null;
    S.sarsinti = Math.max(0, S.sarsinti - dt * 3);
    if (S.kopma) S.sarsinti = Math.max(S.sarsinti, 0.4);

    if (t > S.calan.bitis) sarkiDegistir();
    S.bekarlar = S.bekarlar.filter(b => t - b.zaman < 300);

    fazGuncelle(t);

    // Düello
    if (S.duello) {
      const d = S.duello;
      if (!d.bitti && t - d.bas > F.duello) duelloBitir();
      if (d.bitti && t - d.bitis > 4) S.duello = null;
    }
    // Dedikodu & kaynana
    if (t - S.sonDedikodu > (A.videoModu ? 7 : rnd(14, 24)) && !S.sov && !S.kismet) { S.sonDedikodu = t; dedikodu(); }
    if (S.faz.ad === "taki" && t - S.sonRoast > 20 && fazSure() > 12) { S.sonRoast = t; kaynanaRoast(); }

    // Parçacıklar
    for (const p of S.parcaciklar) {
      p.yas += dt; p.vy += p.yerc * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.aci += p.don * dt;
      if (p.tip === "konfeti" || p.tip === "para") p.vx += Math.sin(t * 3 + p.y * 0.01) * 30 * dt;
    }
    S.parcaciklar = S.parcaciklar.filter(p => p.yas < p.omur && p.y < H + 100);
    // Uçanlar
    for (const u of S.ucanlar) {
      u.yas += dt;
      if (u.yas >= u.sure && !u.vardi) {
        u.vardi = true;
        const hx = typeof u.hx === "function" ? u.hx() : u.hx, hy = typeof u.hy === "function" ? u.hy() : u.hy;
        if (u.varis) u.varis(hx, hy);
      }
    }
    S.ucanlar = S.ucanlar.filter(u => !u.vardi);
    for (const y of S.yazilar) { y.yas += dt; y.y -= 36 * dt; }
    S.yazilar = S.yazilar.filter(y => y.yas < y.omur);
    for (const [k, v] of S.kombolar) if (t > v.bitis) S.kombolar.delete(k);

    // Anons
    if (S.anons && t - S.anons.bas > (S.anonslar.length > 2 ? 2.2 : 3.4)) S.anons = null;
    if (!S.anons && S.anonslar.length) S.anons = Object.assign(S.anonslar.shift(), { bas: t });

    // Kısmet
    if (S.kismet && t - S.kismet.bas > 4.2) S.kismet = null;
    if (!S.kismet && S.kismetler.length && !S.sov) {
      S.kismet = Object.assign(S.kismetler.shift(), { bas: t });
      ses("kismet");
      const a = S.kisiler.get(S.kismet.a), b = S.kisiler.get(S.kismet.b);
      anons(`💘 KISMET! ${kisaAd(a, 16)} ❤ ${kisaAd(b, 16)} — profillerine bakın 😉`, "#ff80ab");
    }

    // Komik sahneler
    if (S.sahne && t - S.sahne.bas > S.sahne.sure) S.sahne = null;
    if (!S.sahne && S.sahneler.length && !S.sov && !S.duello && !ciftMesgul()) {
      const s = S.sahneler.shift();
      const tip = sec(SAHNE_TIPLERI.filter(x => x !== S.sonSahneTip));
      S.sonSahneTip = tip;
      S.sahne = Object.assign(s, { tip, bas: t, sure: 6.5 });
      const k = S.kisiler.get(s.kisi);
      anons(`🎬 ${kisaAd(k, 18)} emretti: ${SAHNE_BASLIK[tip]}`, "#ffab40");
      if (tip === "havaya") { [0, 0.8, 1.6].forEach(d => setTimeout(() => ses("islik", true), d * 1000)); setTimeout(() => ses("alkis"), 2600); }
      if (tip === "kucak") { ses("ooh"); setTimeout(() => { ses("dusus"); }, 3800); setTimeout(() => ses("alkis"), 4800); }
      if (tip === "tango") { ses("opucuk"); setTimeout(() => ses("alkis"), 3500); }
      if (tip === "kaynana") { ses("cizirti"); npcKonus("kaynana", sec(["Daha nikah kıyılmadı, ayrı durun! 😤", "Oğlumu kimseye vermem! 😤", "Ben de dans edeceğim! 💃"]), 5); }
      if (tip === "serenat") { setTimeout(() => ses("cizirti"), 3500); setTimeout(() => ses("ooh"), 3700); }
      kalabalikHepsi((p) => { if (Math.random() < 0.5) ifadeVer(p, sec(["sok", "coskulu", "mutlu"]), 3); });
    }

    // Tam ekran şov
    if (S.sov && t - S.sov.bas > S.sov.sure) S.sov = null;
    if (!S.sov && S.sovlar.length) {
      S.sov = Object.assign(S.sovlar.shift(), { bas: t });
      if (S.sov.tip === "efsane") { S.dugunSahibi = S.sov.kisi; ses("davulSilsile"); ses("davulZurna", S.sov.sure); kalabalikHepsi((k) => hareketVer(k, "egilme", 4, "kalp")); }
    }
    if (S.sov && S.sov.tip === "efsane") {
      if (Math.random() < dt * 5) havaiFisek();
      if (Math.random() < dt * 4) paraYagmuru(3);
    }

    // Kalabalık konum + oto hareket
    for (const p of kalabalikKonumlari(t)) {
      const k = S.kisiler.get(p.id);
      const hiz = Math.min(1, dt * (Math.abs(p.x - k.cx) > 300 ? 2.2 : 3.5));
      k.cx += (p.x - k.cx) * hiz; k.cy += (p.y - k.cy) * hiz;
      k.olcek = p.s; k.sira = p.sira; k.satir = p.satir;
      k.yon = k.cx < 540 ? 1 : -1;
      if (t > k.otoBitis) {
        const liste = S.kopma ? ["cilgin", "break", "zipla", "dondu", "gobek", "omuz"] : (OTO_HAREKET[k.arketip] || ["dur"]);
        k.oto = sec(liste); k.otoBitis = t + rnd(3, 7);
      }
    }
  }

  function ciftMesgul() {
    const f = S.faz; if (!f) return true;
    return ["acilis", "evet", "ayakSonuc", "bulastir", "cicekAtis", "cicekSonuc", "kesim", "giris"].includes(f.adim) || f.ad === "final" || (f.ad === "kapi" && f.adim === "tutma");
  }

  function fazGuncelle(t) {
    const f = S.faz, a = adimSure();
    switch (f.ad) {
      case "kapi":
        if (f.adim === "tutma") { f.acik = 0; if (a > F.kapi) kapiAc(true); }
        else { f.acik = sinirla(a / 1.2, 0, 1); if (a > 5) fazBaslat(1); }
        break;
      case "nikah":
        if (f.adim === "soru") {
          if (a > F.nikah) evetDendi(true);
          const di = Math.floor(a / 2.6) % DUSUNCELER.length;
          if (di !== f.dusunce) { f.dusunce = di; npcKonus("gelin", DUSUNCELER[di], 2.5); }
          if (a > 1 && Math.floor(a) % 9 === 0 && (!S.npc.memur || t > S.npc.memur.bitis)) npcKonus("memur", "Kabul ediyor musunuz? 🧐", 3);
        } else if (f.adim === "evet" && a > 3) { adimGec("ayakOy"); anons("👣 AYAK BASMA! 'gelin' mi 'damat' mı? Yazın!", "#ff80ab", true); ses("hey"); }
        else if (f.adim === "ayakOy" && a > F.ayakOy) ayakSonuc();
        else if (f.adim === "ayakSonuc" && a > 4.5) fazBaslat(2);
        break;
      case "halay":
        if (!f.duelloYapildi && fazSure() > Math.min(30, F.halay * 0.3) && !S.sahne && !S.sov && S.kalabalik.length >= 3) { f.duelloYapildi = duelloBaslat() || true; }
        if (fazSure() > F.halay && !S.duello && !S.sahne) fazBaslat(3);
        break;
      case "taki":
        if (fazSure() > F.taki && !S.sahne) {
          const toplam = S.cift ? S.cift.toplam - f.baslangic : 0;
          npcKonus("kaynana", toplam > 0 ? `Toplam takı: ${sayi(toplam)} coin! 🤑📒` : "Kimse takı takmadı! Ayıp! 😤", 4);
          fazBaslat(4);
        }
        break;
      case "pasta":
        if (f.adim === "giris" && a > 2.5) { adimGec("kesim"); ses("alkis"); }
        else if (f.adim === "kesim" && a > 2.2) { f.kesik = true; adimGec("oy"); anons("🎂 'bulaştır' yazın → damat pastayı gelinin yüzüne bulaştırsın! 😂", "#ffab40", true); }
        else if (f.adim === "oy" && a > F.pastaOy) bulastirBasla();
        else if (f.adim === "bulastir") {
          if (!f.splat1 && a > 1.2) { f.splat1 = true; ses("splat"); ses("ooh"); patlama(320, 1000, 20, "krema", ["#fffdf5", "#ffe0f0"]); }
          if (!f.ucanKat && a > 2.4) { f.ucanKat = true; f.ustKat = false; const p = ciftKonumu(); ucur({ tip: "pastaKat", x: 540, y: 1010, hx: p.d.x, hy: p.d.y - 270, sure: 1.1, yay: 220, boyut: 60 }); }
          if (!f.splat2 && a > 3.6) { f.splat2 = true; if (S.cift) S.cift.kafadaPasta = true; ses("splat"); ses("alkis"); patlama(560, 900, 26, "krema", ["#fffdf5", "#ffe0f0"]); kalabalikHepsi((k) => hareketVer(k, "cilgin", 3, "coskulu")); }
          if (a > 7) { adimGec("cicekOy"); anons("💐 GELİN ÇİÇEĞİ! 'çiçek' yaz → kap, sıradaki düğün SENİN olsun!", "#ff80ab", true); ses("hey"); }
        }
        else if (f.adim === "cicekOy" && a > F.cicekOy) cicekAt();
        else if (f.adim === "cicekAtis" && a > 2.2) adimGec("cicekSonuc");
        else if (f.adim === "cicekSonuc" && a > 3.5) fazBaslat(5);
        break;
      case "final":
        if (Math.random() < 0.05) havaiFisek();
        if (fazSure() > F.final) yeniDugun();
        break;
    }
  }

  function ozetHazirla() {
    const ilk3 = [...S.kisiler.values()].filter(k => k.puanTur > 0 && !k.npc).sort((a, b) => b.puanTur - a.puanTur).slice(0, 3).map(k => k.id);
    S.ozet = { ilk3, cift: S.cift ? { ...S.cift } : null, turNo: S.turNo, reis: S.cift && S.cift.reis, kral: S.pistKrali, cicek: S.siradakiCicek };
  }

  // ------------------------------------------------------------
  //  ÇİZİM YARDIMCILARI
  // ------------------------------------------------------------
  function yuvarlak(x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function panel(x, y, w, h, renk = "rgba(40,10,40,0.78)", kenar = "rgba(255,215,120,0.55)", r = 24) {
    yuvarlak(x, y, w, h, r); c.fillStyle = renk; c.fill(); c.lineWidth = 3; c.strokeStyle = kenar; c.stroke();
  }
  function yazi(metin, x, y, boyut, renk = "#fff", hiza = "center", kalin = 800, cizgi = 6, maxW) {
    c.font = `${kalin} ${boyut}px ${FONT}`; c.textAlign = hiza; c.textBaseline = "middle";
    if (cizgi) { c.lineJoin = "round"; c.lineWidth = cizgi; c.strokeStyle = "rgba(0,0,0,0.85)"; c.strokeText(metin, x, y, maxW); }
    c.fillStyle = renk; c.fillText(metin, x, y, maxW);
  }
  function avatar(k, x, y, r, halka = "#fff", kalin = 4) {
    c.save(); c.beginPath(); c.arc(x, y, r, 0, TAM); c.closePath();
    const img = k && k.foto;
    if (img && img.complete && img.naturalWidth && !img._hata) { c.save(); c.clip(); c.drawImage(img, x - r, y - r, r * 2, r * 2); c.restore(); }
    else { c.fillStyle = `hsl(${k ? k.ton : 0},65%,55%)`; c.fill(); yazi(((k && k.ad) || "?").replace(/^@/, "").charAt(0).toLocaleUpperCase("tr"), x, y + r * 0.06, r * 1.1, "#fff", "center", 800, 0); }
    c.beginPath(); c.arc(x, y, r, 0, TAM); c.lineWidth = kalin; c.strokeStyle = halka; c.stroke(); c.restore();
  }
  function balon(metin, x, y, boyut = 24, renk = "#fff", yaziRenk = "#3b0a3f", maxW = 420) {
    c.font = `700 ${boyut}px ${FONT}`;
    const w = Math.min(maxW, c.measureText(metin).width + 30), h = boyut + 22;
    const bx = sinirla(x - w / 2, 10, W - w - 10);
    yuvarlak(bx, y - h, w, h, 16); c.fillStyle = renk; c.fill();
    c.beginPath(); c.moveTo(sinirla(x, bx + 16, bx + w - 16) - 10, y - 1); c.lineTo(sinirla(x, bx + 16, bx + w - 16) + 10, y - 1); c.lineTo(x, y + 12); c.fill();
    yazi(metin, bx + w / 2, y - h / 2, boyut, yaziRenk, "center", 700, 0, w - 18);
  }
  function altinCiz(x, y, r, renk = "#ffc107") {
    const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, "#fff8d0"); g.addColorStop(0.5, renk); g.addColorStop(1, "#a86b00");
    c.beginPath(); c.arc(x, y, r, 0, TAM); c.fillStyle = g; c.fill(); c.lineWidth = 2; c.strokeStyle = "#7a4d00"; c.stroke();
    c.beginPath(); c.arc(x, y, r * 0.62, 0, TAM); c.strokeStyle = "rgba(122,77,0,0.6)"; c.stroke();
  }
  function nazarCiz(x, y, r) { [["#0d47a1", 1], ["#fff", 0.68], ["#4fc3f7", 0.5], ["#000", 0.25]].forEach(([renk, o]) => { c.beginPath(); c.arc(x, y, r * o, 0, TAM); c.fillStyle = renk; c.fill(); }); }
  function paraCiz(x, y, b, aci) {
    c.save(); c.translate(x, y); c.rotate(aci); c.fillStyle = "#66bb6a"; c.fillRect(-b / 2, -b / 4, b, b / 2);
    c.strokeStyle = "#2e7d32"; c.lineWidth = 2; c.strokeRect(-b / 2 + 3, -b / 4 + 3, b - 6, b / 2 - 6);
    c.fillStyle = "#2e7d32"; c.beginPath(); c.arc(0, 0, b / 8, 0, TAM); c.fill(); c.restore();
  }

  function karakter(k, x, y, s, t, o = {}) {
    K.ciz(c, {
      x, y, s, arketip: o.arketip || k.arketip, ton: k.ton, ten: k.ten, tohum: k.tohum,
      hareket: o.hareket || "dur", ifade: o.ifade, t, vurus: S.vurus + (o.faz || 0), yon: o.yon || 1,
      konusuyor: o.konusuyor, ek: o.ek || {},
    });
  }

  function isimEtiketi(k, x, y, s, unvan, renk = "#fff") {
    const ad = kisaAd(k, 13), b = Math.round(22 * Math.max(0.85, s));
    c.font = `800 ${b}px ${FONT}`;
    const w = c.measureText(ad).width + 44, h = b + 10;
    yuvarlak(x - w / 2, y, w, h, h / 2); c.fillStyle = "rgba(20,4,26,0.72)"; c.fill();
    avatar(k, x - w / 2 + h / 2, y + h / 2, h / 2 - 2, renk, 2);
    yazi(ad, x - w / 2 + h + 2, y + h / 2 + 1, b, renk, "left", 800, 0);
    if (unvan) yazi(k.unvan, x, y + h + 13, Math.round(17 * Math.max(0.85, s)), "#f8bbd0", "center", 700, 4);
  }

  // ------------------------------------------------------------
  //  ÇİZİM — ARKA PLAN
  // ------------------------------------------------------------
  function arkaPlan(t, nabiz) {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#14041d"); g.addColorStop(0.35, "#2d0838"); g.addColorStop(0.65, "#3b0a3f"); g.addColorStop(1, "#12041c");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // Sahne fonu
    const sf = c.createLinearGradient(0, 470, 0, 1250);
    sf.addColorStop(0, "#4a1450"); sf.addColorStop(1, "#2a0a33");
    c.fillStyle = sf; c.fillRect(70, 470, W - 140, 790);
    c.fillStyle = "rgba(255,255,255,0.03)"; for (let x = 90; x < W - 70; x += 46) c.fillRect(x, 470, 18, 790);
    // Perdeler
    for (const yon of [-1, 1]) {
      const x0 = yon < 0 ? 0 : W;
      for (let i = 0; i < 4; i++) {
        c.fillStyle = i % 2 ? "#7f0f2c" : "#9c1838";
        c.beginPath(); c.moveTo(x0 + yon * -0, 440); c.lineTo(x0 - yon * (40 + i * 26), 440);
        c.quadraticCurveTo(x0 - yon * (60 + i * 22 + Math.sin(t + i) * 4), 900, x0 - yon * (30 + i * 18), 1290); c.lineTo(x0, 1290); c.closePath(); c.fill();
      }
    }
    // Üst saçak
    c.fillStyle = "#9c1838";
    c.beginPath(); c.moveTo(0, 430);
    for (let i = 0; i <= 12; i++) c.quadraticCurveTo(i * 90 - 45, 500, i * 90, 440);
    c.lineTo(W, 420); c.lineTo(0, 420); c.fill();
    c.fillStyle = "#ffd54a"; for (let i = 0; i <= 12; i++) { c.beginPath(); c.arc(i * 90, 444, 5, 0, TAM); c.fill(); }
    // Disko topu + ışınlar
    c.save(); c.globalCompositeOperation = "lighter";
    for (let i = 0; i < 6; i++) {
      const a = PI / 2 + Math.sin(t * 0.6 + i * 1.3) * 0.9;
      const renk = `hsla(${(i * 60 + t * 40) % 360},90%,60%,${0.05 + nabiz * 0.06})`;
      c.fillStyle = renk; c.beginPath(); c.moveTo(540, 520);
      c.lineTo(540 + Math.cos(a - 0.07) * 1800, 520 + Math.sin(a - 0.07) * 1800); c.lineTo(540 + Math.cos(a + 0.07) * 1800, 520 + Math.sin(a + 0.07) * 1800); c.fill();
    }
    c.restore();
    c.strokeStyle = "#9e9e9e"; c.lineWidth = 2; c.beginPath(); c.moveTo(540, 430); c.lineTo(540, 490); c.stroke();
    const dg = c.createRadialGradient(530, 510, 4, 540, 520, 34); dg.addColorStop(0, "#fff"); dg.addColorStop(1, "#7e8c9a");
    c.fillStyle = dg; c.beginPath(); c.arc(540, 522, 32, 0, TAM); c.fill();
    for (let i = 0; i < 12; i++) { const on = Math.sin(t * 7 + i * 1.9) > 0.5; if (on) { c.fillStyle = "#fff"; c.fillRect(540 - 26 + (i % 4) * 14, 505 + Math.floor(i / 4) * 12, 6, 6); } }
    // Pist
    c.save();
    c.beginPath(); c.moveTo(0, 1300); c.lineTo(W, 1300); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.clip();
    for (let r = 0; r < 9; r++) for (let k = -6; k < 14; k++) {
      const y0 = 1300 + r * r * 8 + r * 20, y1 = 1300 + (r + 1) * (r + 1) * 8 + (r + 1) * 20;
      const yay = (y) => (y - 1240) / 680 + 0.35;
      const x0a = W / 2 + (k * 120 - W / 2) * yay(y0), x1a = W / 2 + ((k + 1) * 120 - W / 2) * yay(y0);
      const x0b = W / 2 + (k * 120 - W / 2) * yay(y1), x1b = W / 2 + ((k + 1) * 120 - W / 2) * yay(y1);
      const yanik = (r + k) % 2 === 0, ton = (k * 40 + r * 25 + t * 60) % 360;
      c.fillStyle = yanik ? `hsla(${ton},80%,${28 + nabiz * 16 + (S.kopma ? 12 : 0)}%,0.55)` : "rgba(20,5,30,0.6)";
      c.beginPath(); c.moveTo(x0a, y0); c.lineTo(x1a, y0); c.lineTo(x1b, y1); c.lineTo(x0b, y1); c.closePath(); c.fill();
    }
    c.restore();
    // Sahne kenarı
    c.fillStyle = "#3e1046"; c.fillRect(0, 1250, W, 52);
    c.fillStyle = "#ffd54a"; c.fillRect(0, 1250, W, 5);
    for (let i = 0; i < 22; i++) { const on = (Math.floor(t * 4) + i) % 3 !== 0; c.fillStyle = on ? "#ffe082" : "#6d4c41"; c.beginPath(); c.arc(25 + i * 49, 1278, 6, 0, TAM); c.fill(); }
    // Ampuller
    ampulZinciri(t, 0, 455, W, 455, 30, nabiz);
  }
  function ampulZinciri(t, x0, y0, x1, y1, sarkma, nabiz) {
    c.strokeStyle = "rgba(255,255,255,0.25)"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, y0 + sarkma * 2, x1, y1); c.stroke();
    const renk = ["#ffd54a", "#ff5252", "#69f0ae", "#40c4ff", "#e040fb"];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const x = (1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * ((x0 + x1) / 2) + u * u * x1;
      const y = (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * (y0 + sarkma * 2) + u * u * y1 + 8;
      const yanik = (Math.floor(t * 3) + i) % 3 !== 0;
      c.beginPath(); c.arc(x, y, 6 + (yanik ? nabiz * 3 : 0), 0, TAM);
      c.fillStyle = yanik ? renk[i % 5] : "rgba(255,255,255,0.15)"; c.shadowColor = renk[i % 5]; c.shadowBlur = yanik ? 16 : 0; c.fill();
    }
    c.shadowBlur = 0;
  }
  function kemer(t, nabiz) {
    c.lineWidth = 26; c.strokeStyle = "rgba(255,255,255,0.1)";
    c.beginPath(); c.arc(540, 1250, 330, PI, 0); c.stroke();
    for (let i = 0; i <= 22; i++) {
      const a = PI + (i / 22) * PI, x = 540 + Math.cos(a) * 330, y = 1250 + Math.sin(a) * 330;
      c.beginPath(); c.arc(x, y, 20 + (i % 2) * 6 + nabiz * 3, 0, TAM); c.fillStyle = ["#f8bbd0", "#fff", "#f48fb1", "#ffcdd2"][i % 4]; c.fill();
      if (i % 3 === 0) { c.fillStyle = "#66bb6a"; c.beginPath(); c.ellipse(x + 14, y + 10, 10, 5, 0.6, 0, TAM); c.fill(); }
    }
  }

  // ------------------------------------------------------------
  //  ÇİZİM — ÜST BİLGİ (tek büyük talimat)
  // ------------------------------------------------------------
  const FAZ_RENK = { kapi: ["#6d1b7b", "#ff80ab"], nikah: ["#4a148c", "#ffd54a"], halay: ["#b71c1c", "#ffab40"], taki: ["#8d6e00", "#ffd54a"], pasta: ["#ad1457", "#fff59d"], final: ["#1b5e20", "#b9f6ca"] };
  function fazBilgisi() {
    const f = S.faz, kalan = Math.max(0, Math.ceil(fazKalan()));
    const sure = ` ⏱ ${kalan}`;
    const d = S.duello && !S.duello.bitti;
    if (d) {
      let a = 0, b = 0; for (const v of S.duello.oylar.values()) v === 1 ? a++ : b++;
      return { ikon: "⚔️", baslik: "DANS DÜELLOSU", cta: `'1' yaz → ${kisaAd(S.kisiler.get(S.duello.a), 12)}   '2' yaz → ${kisaAd(S.kisiler.get(S.duello.b), 12)}`, ikili: [a, b], etiket: [`1: ${a} oy`, `2: ${b} oy`], sure: ` ⏱ ${Math.max(0, Math.ceil(F.duello - (simdi() - S.duello.bas)))}` };
    }
    if (S.kopma) return { ikon: "🔥", baslik: "KOPMA ANI!", cta: "Herkes çıldırdı! Yaz → sen de katıl!", oran: 1 - (simdi() - S.kopma.bas) / S.kopma.sure, etiket: "🔥🔥🔥", sure: "" };
    switch (f.ad) {
      case "kapi": return f.adim === "tutma"
        ? { ikon: "🚪", baslik: "KAPI TUTMA", cta: "Kardeş kapıyı tuttu! ❤️ Beğen • 💬 Yaz • 🎁 Bahşiş ver", oran: f.puan / f.hedef, etiket: `Kapı %${Math.floor(Math.min(1, f.puan / f.hedef) * 100)} açıldı`, sure }
        : { ikon: "🚪", baslik: "KAPI AÇILDI!", cta: "Gelin geliyor! 👰 Zılgıtlar! 🎉", oran: 1, etiket: "🎉", sure: "" };
      case "nikah":
        if (f.adim === "soru") return { ikon: "💍", baslik: "NİKAH", cta: "Gelin düşünüyor... 'EVET' yaz! 💬", oran: f.evet / f.hedef, etiket: `EVET: ${Math.min(f.evet, f.hedef)} / ${f.hedef}`, sure };
        if (f.adim === "evet") return { ikon: "💍", baslik: "EVEEET!", cta: "Gelin evet dedi! 🎉", oran: 1, etiket: "💍", sure: "" };
        if (f.adim === "ayakOy") { let g = 0, d2 = 0; for (const v of f.oylar.values()) v === "gelin" ? g++ : d2++; return { ikon: "👣", baslik: "AYAK BASMA", cta: "Kim basacak? 'gelin' ya da 'damat' yaz!", ikili: [g, d2], etiket: [`👰 ${g}`, `🤵 ${d2}`], sure }; }
        return { ikon: "👣", baslik: f.kazanan === "gelin" ? "EVİN REİSİ: GELİN 👑" : "EVİN REİSİ: DAMAT 👑", cta: "😂😂😂", oran: 1, etiket: "", sure: "" };
      case "halay": {
        const cosku = sinirla(S.coskuHam / (A.coskuIcinBegeni || 300), 0, 1);
        return { ikon: "💃", baslik: "HALAY ZAMANI", cta: "Yaz → halaya katıl! 'göbek' 'zıpla' 'break' yaz → oyna!", oran: cosku, etiket: `❤️ Beğen → KOPMA ANI %${Math.round(cosku * 100)}`, sure };
      }
      case "taki": {
        const top = S.cift ? S.cift.toplam : 0;
        return { ikon: "💰", baslik: "TAKI MERASİMİ", cta: "🎁 Hediye at → geline ALTIN tak! Kaynana not alıyor 📒", oran: top / S.takiHedef, etiket: `💍 ${sayi(top)} / ${sayi(S.takiHedef)} coin`, sure };
      }
      case "pasta":
        if (f.adim === "oy") return { ikon: "🎂", baslik: "PASTA", cta: "'bulaştır' yaz → damat pastayı gelinin yüzüne bulaştırsın! 😂", oran: f.bulastir.size / f.hedef, etiket: `BULAŞTIR: ${f.bulastir.size} / ${f.hedef}`, sure };
        if (f.adim === "cicekOy") return { ikon: "💐", baslik: "GELİN ÇİÇEĞİ", cta: "'çiçek' yaz → kap, sıradaki gelin/damat SEN ol!", oran: 1 - fazKalan() / F.cicekOy, etiket: `💐 ${f.cicekciler.size} kişi bekliyor`, sure };
        if (f.adim === "cicekAtis" || f.adim === "cicekSonuc") return { ikon: "💐", baslik: "ÇİÇEK ATILDI!", cta: "Kim kaptı?! 😱", oran: 1, etiket: "", sure: "" };
        if (f.adim === "bulastir") return { ikon: "🎂", baslik: "BULAŞTIRDI! 😂", cta: "Gelin intikam alıyor... 😈", oran: 1, etiket: "", sure: "" };
        return { ikon: "🎂", baslik: "PASTA KESİMİ", cta: "Pasta geldi! 🎂", oran: 1, etiket: "", sure: "" };
      case "final": return { ikon: "🚗", baslik: "MUTLULUKLAR!", cta: "Sıradaki düğün geliyor... 'bekar' yaz, SEN evlen! 💘", oran: fazSure() / F.final, etiket: "", sure };
    }
    return { ikon: "", baslik: "", cta: "", oran: 0, etiket: "", sure: "" };
  }

  function ustBilgi(t, nabiz) {
    const b = fazBilgisi(), [r1, r2] = FAZ_RENK[S.faz.ad] || ["#4a148c", "#ffd54a"];
    const x = 24, y = 120, w = W - 48, h = 186;
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, r1); g.addColorStop(1, "rgba(25,5,30,0.95)");
    panel(x, y, w, h, g, r2, 28);
    // Adım noktaları
    FAZLAR.forEach((f, i) => {
      const cx = W - 70 - (FAZLAR.length - 1 - i) * 44, cy = y + 30;
      const su = i === S.faz.i, gecti = i < S.faz.i;
      c.globalAlpha = su ? 1 : gecti ? 0.7 : 0.35;
      yazi(f.ikon, cx, cy, su ? 34 : 26, "#fff", "center", 400, 0);
      c.globalAlpha = 1;
    });
    yazi(A.videoModu && A.hesapAdi ? `🔴 CANLI • @${A.hesapAdi}` : `💒 CANLI DÜĞÜN #${S.turNo}`, x + 26, y + 30, 26, "#ffffffcc", "left", 800, 4);
    const pop = 1 + nabiz * 0.04;
    c.save(); c.translate(x + 26, y + 80); c.scale(pop, pop);
    yazi(`${b.ikon} ${b.baslik}`, 0, 0, 58, r2, "left", 800, 8, w - 60);
    c.restore();
    yazi(b.cta, x + w / 2, y + 128, 33, "#fff", "center", 800, 6, w - 40);
    // Çubuk
    const bx = x + 26, by = y + 150, bw = w - 52, bh = 26;
    yuvarlak(bx, by, bw, bh, 13); c.fillStyle = "rgba(0,0,0,0.45)"; c.fill();
    if (b.ikili) {
      const [a1, a2] = b.ikili, top = Math.max(1, a1 + a2), o = a1 / top;
      yuvarlak(bx, by, Math.max(26, bw * (a1 + a2 ? o : 0.5)), bh, 13); c.fillStyle = "#ff4081"; c.fill();
      c.save(); yuvarlak(bx, by, bw, bh, 13); c.clip(); c.fillStyle = "#40c4ff"; c.fillRect(bx + bw * (a1 + a2 ? o : 0.5), by, bw, bh); c.restore();
      yazi(b.etiket[0], bx + 14, by + bh / 2 + 1, 20, "#fff", "left", 800, 4); yazi(b.etiket[1], bx + bw - 14, by + bh / 2 + 1, 20, "#fff", "right", 800, 4);
    } else {
      const o = sinirla(b.oran || 0, 0, 1);
      if (o > 0) { yuvarlak(bx, by, Math.max(26, bw * o), bh, 13); const gg = c.createLinearGradient(bx, 0, bx + bw, 0); gg.addColorStop(0, "#ff6f00"); gg.addColorStop(1, r2); c.fillStyle = gg; c.fill(); }
      yazi(b.etiket + (b.sure || ""), bx + bw / 2, by + bh / 2 + 1, 20, "#fff", "center", 800, 4);
    }
    if (b.ikili && b.sure) yazi(b.sure, bx + bw / 2, by + bh / 2 + 1, 20, "#fff", "center", 800, 4);
  }

  const IPUCLARI = [
    "💬 Yorum yaz → düğüne katıl, karakterin gelsin!",
    "🕺 'göbek' • 'zıpla' • 'break' • 'bayıl' yaz → karakterin oynasın",
    "💘 'bekar' yaz → kısmetini bul, sıradaki gelin-damat SEN ol",
    "🌹 Gül → çıldır  💍 10+ → altın tak  🎬 500+ → komik sahne",
    "🦁 5000+ coin → DAVUL-ZURNA ŞOVU + 👑 DÜĞÜN SAHİBİ",
    "🎵 '!şarkı şarkı adı' yaz → orgcuya istek",
    "🎉 'zılgıt' yaz → zılgıt çek!  😘 'öp' yaz → öpücük at",
  ];
  function bilgiSatiri(t) {
    // Lider + şarkı
    panel(24, 314, W - 48, 50, "rgba(20,4,26,0.7)", "rgba(255,215,120,0.35)", 20);
    const liste = [...S.kisiler.values()].filter(k => k.puanTur > 0 && !k.npc).sort((a, b) => b.puanTur - a.puanTur).slice(0, 3);
    let x = 44;
    yazi("🏆", x, 340, 26, "#fff", "left", 400, 0); x += 38;
    if (!liste.length) { yazi("İlk takıyı sen tak! 💍", x, 340, 23, "#ffd54a", "left", 800, 3); }
    liste.forEach((k, i) => {
      avatar(k, x + 14, 339, 14, ["#ffd700", "#cfd8dc", "#ffab91"][i], 2); x += 32;
      const m = `${kisaAd(k, 10)} ${sayi(k.puanTur)}`;
      c.font = `800 21px ${FONT}`; const w = Math.min(150, c.measureText(m).width);
      yazi(m, x, 340, 21, "#ffd54a", "left", 800, 3, 150); x += w + 14;
    });
    const sarki = `🎵 ${S.calan.sarki}`;
    yazi(sarki, W - 44, 340, 21, "#e1bee7", "right", 700, 3, Math.max(120, W - 44 - x - 10));
    // İpucu
    const i = Math.floor(t / 4) % IPUCLARI.length, faz = (t / 4) % 1;
    c.globalAlpha = faz < 0.08 ? faz / 0.08 : faz > 0.95 ? (1 - faz) / 0.05 : 1;
    yazi(IPUCLARI[i], W / 2, 392, 26, "#fff", "center", 800, 5, W - 60);
    c.globalAlpha = 1;
  }

  // ------------------------------------------------------------
  //  ÇİZİM — SAHNE
  // ------------------------------------------------------------
  function sahneCiz(t, nabiz) {
    const f = S.faz;
    if (f.ad !== "kapi") kemer(t, nabiz);
    if (f.ad === "kapi") kapiCiz(t);
    if (f.ad === "taki") takiDefteriCiz(t);
    orgcuCiz(t, nabiz);
    kaynanaCiz(t);
    if (f.ad === "nikah") { nikahMasasi(t, true); }
    const p = ciftKonumu();
    if (f.ad === "pasta") pastaCiz(t, p);
    if (f.ad === "kapi") kardesCiz(t);
    ciftCiz(t, p);
    if (f.ad === "nikah") nikahMasasi(t, false);
    if (f.ad === "final") arabaCiz(t);
    if (S.duello) duelloCiz(t);
    if (p.ekstra === "atanlar") atanlarCiz(t);
    if (p.ekstra === "kaynanaOrtada") { /* kaynanaCiz konumu değiştirir */ }
    if (S.sahne) { const u = (t - S.sahne.bas) / S.sahne.sure; c.globalAlpha = Math.min(1, u * 6, (1 - u) * 6); yazi(SAHNE_BASLIK[S.sahne.tip], 540, 560, 52, "#ffab40", "center", 800, 8, W - 60); const k = S.kisiler.get(S.sahne.kisi); yazi(`🎬 ${kisaAd(k, 18)} emretti`, 540, 616, 32, "#fff", "center", 800, 6); c.globalAlpha = 1; }
  }

  function ciftCiz(t, p) {
    if (!S.cift) return;
    const g = S.kisiler.get(S.cift.gelin), d = S.kisiler.get(S.cift.damat);
    const parca = [];
    if (!p.gGizli) parca.push(["gelin", g, p.g]);
    if (!(S.faz.ad === "final")) parca.push(["damat", d, p.d]);
    parca.sort((a, b) => a[2].y - b[2].y);
    for (const [rol, k, o] of parca) {
      const ek = Object.assign({}, o.ek);
      karakter(k, o.x, o.y, o.s, t, { arketip: rol, hareket: o.hareket, ifade: o.ifade, yon: o.yon, ek, konusuyor: S.npc[rol] && t < S.npc[rol].bitis });
      // Takı kurdelesi
      const tak = S.cift.takilar.filter(x => x.hedef === (rol === "gelin" ? "g" : "d"));
      if (tak.length && !ek.poz) kurdele(o.x, o.y - 100 * o.s, tak, o.s);
      if (ek.kafaPasta) { const hy = o.y - 205 * o.s; pastaKatCiz(o.x, hy, 0.55); }
      // İsim
      const ust = o.y - 250 * o.s;
      if (!ek.poz || rol === "gelin") {
        c.font = `800 26px ${FONT}`;
        yazi(`${rol === "gelin" ? "👰" : "🤵"} ${kisaAd(k, 14)}`, o.x, Math.max(470, ust - 30), 26, "#fff", "center", 800, 5);
      }
      if (S.cift.reis === (rol === "gelin" ? "gelin" : "damat") && S.faz.ad !== "nikah") yazi("👑 Evin reisi", o.x, Math.max(500, ust), 20, "#ffd54a", "center", 800, 4);
      const nb = S.npc[rol];
      if (nb && t < nb.bitis) balon(nb.metin, o.x, Math.max(560, ust - 50), 28, "#fff", "#3b0a3f", 460);
    }
    if (S.cift.nazar && !p.gGizli) nazarCiz(540, 980 + Math.sin(t * 2) * 6, 26);
    // Altın yığını
    const n = S.cift.takilar.length;
    if (n > 3 && S.faz.ad !== "final" && !p.gGizli) {
      const yig = Math.min(40, Math.floor(n / 2));
      for (let i = 0; i < yig; i++) { const sat = Math.floor(Math.sqrt(i * 2)); altinCiz(540 + ((i * 37) % 70) - 35 + sat * 2, 1238 - sat * 9, 11, "#ffc107"); }
    }
  }

  function kurdele(x, y, takilar, s) {
    c.save(); c.translate(x, y); c.scale(s, s); c.rotate(-0.55);
    c.fillStyle = "#c62828"; c.fillRect(-46, -8, 92, 16);
    const n = takilar.length, gos = Math.min(n, 8);
    for (let i = 0; i < gos; i++) altinCiz(-38 + i * 11, 0, 10, takilar[n - 1 - i].renk);
    c.restore();
    if (n > 8) yazi(`+${n - 8}`, x + 50 * s, y - 30 * s, 22, "#ffd54a", "center", 800, 4);
  }

  function orgcuCiz(t, nabiz) {
    const k = { ton: 280, ten: 3, tohum: 2 };
    const x = 125, y = 1245;
    karakter(k, x, y, 1.15, t, { arketip: "orgcu", hareket: "org", ifade: "havali", konusuyor: S.npc.orgcu && t < S.npc.orgcu.bitis });
    // Org
    c.fillStyle = "#212121"; yuvarlak(x - 95, y - 118, 190, 30, 6); c.fill();
    for (let i = 0; i < 15; i++) { const bas = Math.sin(t * 13 + i * 1.7) > 0.7; c.fillStyle = bas ? "#b388ff" : "#fff"; c.fillRect(x - 88 + i * 11.7, y - 113, 10, 21); }
    c.fillStyle = "#424242"; c.fillRect(x - 60, y - 88, 9, 88); c.fillRect(x + 50, y - 88, 9, 88);
    for (let i = 0; i < 3; i++) { const f = ((t * 0.6 + i / 3) % 1); c.globalAlpha = 1 - f; yazi(i % 2 ? "♪" : "♫", x - 30 + i * 30 + Math.sin(f * 6 + i) * 14, y - 330 - f * 120, 40, "#e1bee7", "center", 800, 0); }
    c.globalAlpha = 1;
    if (S.npc.orgcu && t < S.npc.orgcu.bitis) balon(S.npc.orgcu.metin, x + 60, y - 330, 24);
  }

  function kaynanaCiz(t) {
    const sh = S.sahne && S.sahne.tip === "kaynana";
    let x = 970, y = 1245, s = 1.2, h = "dur", ifade = "normal";
    if (sh) { const u = (t - S.sahne.bas) / S.sahne.sure; x = 970 - Math.min(1, u * 4) * 430; h = u < 0.25 ? "zipla" : "capraz"; ifade = "kizgin"; s = 1.45; }
    const isir = S.npc.kaynanaIsir && t - S.npc.kaynanaIsir < 1.2;
    const konusuyor = S.npc.kaynana && t < S.npc.kaynana.bitis;
    if (!sh) { h = isir ? "agla" : konusuyor ? "konusma" : (S.faz.ad === "taki" ? "dusunme" : "dur"); ifade = isir ? "sok" : (S.cift && S.cift.agir ? "kalp" : ifade); }
    karakter({ ton: 290, ten: 1, tohum: 5 }, x, y, s, t, { arketip: "kaynana", hareket: h, ifade, yon: -1, konusuyor, ek: { esya: sh ? null : "defter" } });
    if (isir) altinCiz(x - 6, y - 140 * s, 10);
    yazi("👵 KAYNANA", x, y + 18, 20, "#e1bee7", "center", 800, 4);
    if (konusuyor) balon(S.npc.kaynana.metin, Math.min(x, 900), y - 270 * s, 26, "#fff3e0", "#4a148c", 480);
  }

  function takiDefteriCiz(t) {
    const x = 24, y = 478, w = 300, h = 330;
    c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(-0.03);
    yuvarlak(-w / 2, -h / 2, w, h, 12); c.fillStyle = "#fff8e1"; c.fill();
    c.strokeStyle = "#8d6e63"; c.lineWidth = 3; c.stroke();
    c.fillStyle = "#c62828"; c.fillRect(-w / 2, -h / 2, w, 46);
    yazi("📒 KAYNANANIN DEFTERİ", 0, -h / 2 + 24, 22, "#fff", "center", 800, 0, w - 16);
    c.strokeStyle = "rgba(141,110,99,0.35)"; c.lineWidth = 1;
    for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(-w / 2 + 10, -h / 2 + 80 + i * 38); c.lineTo(w / 2 - 10, -h / 2 + 80 + i * 38); c.stroke(); }
    if (!S.takiDefteri.length) yazi("Henüz takı yok 😤", 0, 10, 24, "#8d6e63", "center", 700, 0);
    S.takiDefteri.forEach((d, i) => {
      const k = S.kisiler.get(d.kimden), yy = -h / 2 + 66 + i * 38;
      yazi(`${kisaAd(k, 11)}`, -w / 2 + 12, yy, 19, "#3e2723", "left", 800, 0, 140);
      yazi(`${d.adet > 1 ? d.adet + "x " : ""}${d.ad}`, w / 2 - 12, yy, 16, "#b26a00", "right", 800, 0, 140);
    });
    c.restore();
  }

  function kapiCiz(t) {
    const f = S.faz, acik = f.acik || 0;
    const x0 = 430, x1 = 850, y0 = 700, y1 = 1250;
    c.fillStyle = "#f3e5d8"; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    c.fillStyle = "#c97b63"; c.beginPath(); c.moveTo(x0 - 30, y0); c.lineTo((x0 + x1) / 2, y0 - 110); c.lineTo(x1 + 30, y0); c.closePath(); c.fill();
    c.fillStyle = "rgba(0,0,0,0.06)"; for (let yy = y0 + 20; yy < y1; yy += 40) c.fillRect(x0, yy, x1 - x0, 3);
    yazi("💒 GELİN EVİ", 640, y0 - 36, 30, "#fff", "center", 800, 5);
    // Balonlar
    [[x0 + 10, 760, "#ff4081"], [x0 + 40, 730, "#ffd54a"], [x1 - 10, 760, "#40c4ff"], [x1 - 40, 730, "#69f0ae"]].forEach(([bx, by, r]) => {
      const sal = Math.sin(t * 2 + bx) * 4;
      c.strokeStyle = "rgba(255,255,255,0.6)"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(bx + sal, by + 26); c.lineTo(bx, by + 90); c.stroke();
      c.fillStyle = r; c.beginPath(); c.ellipse(bx + sal, by, 22, 27, 0, 0, TAM); c.fill();
    });
    // Pencere + gelin bakıyor
    const px = 640, py = 790;
    c.fillStyle = "#4e342e"; c.beginPath(); c.arc(px, py, 46, 0, TAM); c.fill();
    c.save(); c.beginPath(); c.arc(px, py, 40, 0, TAM); c.clip();
    c.fillStyle = "#ffe0b2"; c.fillRect(px - 40, py - 40, 80, 80);
    if (f.adim === "tutma" && S.cift) {
      const g = S.kisiler.get(S.cift.gelin);
      const bak = Math.sin(t * 0.8) * 10;
      karakter(g, px + bak, py + 150 * 0.62 + 18, 0.62, t, { arketip: "gelin", hareket: "dur", ifade: ["sok", "mutlu", "kalp", "dusunceli"][Math.floor(t / 3) % 4] });
    }
    c.restore();
    c.strokeStyle = "#4e342e"; c.lineWidth = 5; c.beginPath(); c.moveTo(px - 40, py); c.lineTo(px + 40, py); c.moveTo(px, py - 40); c.lineTo(px, py + 40); c.stroke();
    // Kapı
    const kx = 520, ky = 880, kw = 240, kh = 370;
    c.fillStyle = "#4e342e"; c.fillRect(kx - 14, ky - 14, kw + 28, kh + 14);
    const ic = c.createLinearGradient(0, ky, 0, ky + kh); ic.addColorStop(0, "#ffecb3"); ic.addColorStop(1, "#ffb74d");
    c.fillStyle = ic; c.fillRect(kx, ky, kw, kh);
    const sall = f.adim === "tutma" && simdi() < f.itme ? Math.sin(t * 50) * 3 : 0;
    const pw = (kw / 2) * (1 - acik * 0.85);
    for (const [px0, yon] of [[kx, 1], [kx + kw, -1]]) {
      const x = yon > 0 ? px0 + sall : px0 - pw + sall;
      c.fillStyle = "#8d5524"; c.fillRect(x, ky, pw, kh);
      c.strokeStyle = "#5d3a1a"; c.lineWidth = 3;
      if (pw > 20) { c.strokeRect(x + 12, ky + 20, pw - 24, kh / 2 - 30); c.strokeRect(x + 12, ky + kh / 2 + 10, pw - 24, kh / 2 - 30); }
      c.fillStyle = "#ffd54a"; c.beginPath(); c.arc(yon > 0 ? x + pw - 14 : x + 14, ky + kh / 2, 6, 0, TAM); c.fill();
    }
    // Kurdele
    if (acik < 0.2) { c.fillStyle = "#e53935"; c.fillRect(kx, ky + kh / 2 - 8, kw, 16); }
  }

  function kardesCiz(t) {
    const f = S.faz, acik = f.adim !== "tutma";
    const u = acik ? sinirla(adimSure() / 1.5, 0, 1) : 0;
    const x = 640 + u * 220, y = 1250;
    const para = f.puan > 0;
    karakter({ ton: 220, ten: 4, tohum: 7 }, x, y, 1.3, t, { arketip: "kardes", hareket: acik ? "elUzat" : (para && Math.sin(t * 2) > 0 ? "elUzat" : "capraz"), ifade: acik ? "kalp" : "havali", yon: acik ? -1 : -1, konusuyor: S.npc.kardes && t < S.npc.kardes.bitis, ek: { esya: para ? "para" : null } });
    yazi("😎 GELİNİN KARDEŞİ", x, y + 18, 20, "#90caf9", "center", 800, 4);
    if (S.npc.kardes && t < S.npc.kardes.bitis) balon(S.npc.kardes.metin, x, y - 280, 30, "#e3f2fd", "#0d47a1", 440);
  }

  function nikahMasasi(t, arka) {
    if (arka) {
      karakter({ ton: 200, ten: 2, tohum: 4 }, 540, 1205, 1.25, t, { arketip: "memur", hareket: "konusma", ifade: "normal", konusuyor: S.npc.memur && t < S.npc.memur.bitis, ek: { esya: null } });
      return;
    }
    c.fillStyle = "#fafafa"; yuvarlak(370, 1110, 340, 140, 10); c.fill();
    c.fillStyle = "#e1bee7"; for (let i = 0; i < 10; i++) { c.beginPath(); c.arc(385 + i * 34, 1112, 17, 0, PI); c.fill(); }
    c.fillStyle = "#c62828"; c.fillRect(470, 1090, 140, 22); c.fillStyle = "#fff"; c.fillRect(540, 1090, 2, 22);
    c.fillStyle = "#8d6e63"; c.fillRect(640, 1060, 18, 40);
    [["#ff4081", 640, 1052], ["#fff", 656, 1046], ["#f8bbd0", 648, 1036]].forEach(([r, x, y]) => { c.fillStyle = r; c.beginPath(); c.arc(x, y, 12, 0, TAM); c.fill(); });
    yazi("NİKAH MEMURU", 540, 1180, 20, "#7b1fa2", "center", 800, 0);
    if (S.npc.memur && t < S.npc.memur.bitis) balon(S.npc.memur.metin, 540, 960, 28, "#ede7f6", "#311b92", 480);
  }

  function pastaKatCiz(x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s);
    yuvarlak(-75, -90, 150, 90, 14); c.fillStyle = "#fff"; c.fill();
    c.fillStyle = "#ec407a"; for (let j = 0; j < 7; j++) { c.beginPath(); c.arc(-62 + j * 21, -90, 9, 0, PI); c.fill(); }
    c.fillStyle = "#e53935"; c.beginPath(); c.arc(0, -98, 9, 0, TAM); c.fill();
    c.restore();
  }
  function pastaCiz(t, p) {
    const f = S.faz;
    const giris = f.adim === "giris" ? yumusak(sinirla(adimSure() / 2, 0, 1)) : 1;
    const x = 540 + (1 - giris) * 600, y = 1240;
    c.fillStyle = "#9e9e9e"; c.fillRect(x - 170, y - 16, 340, 16);
    [[300, 120, "#fce4ec"], [220, 105, "#f8bbd0"]].forEach(([w, h, r], i) => {
      const yy = y - 16 - i * 112;
      yuvarlak(x - w / 2, yy - h, w, h, 16); c.fillStyle = r; c.fill();
      c.fillStyle = "#ec407a"; for (let j = 0; j < 8; j++) { c.beginPath(); c.arc(x - w / 2 + 18 + j * (w - 36) / 7, yy - h, 10, 0, PI); c.fill(); }
    });
    if (f.ustKat !== false) pastaKatCiz(x, y - 240, 1);
    if (f.kesik) { c.fillStyle = "#6d4c41"; c.beginPath(); c.moveTo(x + 20, y - 16); c.lineTo(x + 60, y - 136); c.lineTo(x + 75, y - 136); c.lineTo(x + 35, y - 16); c.fill(); }
  }

  function arabaCiz(t) {
    const u = fazSure() / Math.min(8, F.final * 0.6);
    const x = W + 320 - u * (W + 700), y = 1215;
    if (x < -400) return;
    // Teneke kutular
    for (let i = 0; i < 3; i++) { const kx = x + 260 + i * 40, ky = y + 20 + Math.sin(t * 20 + i) * 4; c.strokeStyle = "#bdbdbd"; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 200, y); c.lineTo(kx, ky); c.stroke(); c.fillStyle = "#cfd8dc"; c.fillRect(kx - 9, ky - 12, 18, 24); }
    c.fillStyle = "#e53935"; yuvarlak(x - 210, y - 70, 420, 90, 26); c.fill();
    c.fillStyle = "#c62828"; c.beginPath(); c.moveTo(x - 130, y - 70); c.quadraticCurveTo(x - 90, y - 170, x, y - 172); c.quadraticCurveTo(x + 90, y - 170, x + 130, y - 70); c.fill();
    c.fillStyle = "#b3e5fc";
    yuvarlak(x - 112, y - 150, 100, 76, 14); c.fill(); yuvarlak(x + 12, y - 150, 100, 76, 14); c.fill();
    if (S.cift) {
      const g = S.kisiler.get(S.cift.gelin), d = S.kisiler.get(S.cift.damat);
      c.save(); yuvarlak(x - 112, y - 150, 100, 76, 14); c.clip(); karakter(g, x - 62, y - 120 + 150 * 0.5, 0.5, t, { arketip: "gelin", hareket: "selam", ifade: "coskulu" }); c.restore();
      c.save(); yuvarlak(x + 12, y - 150, 100, 76, 14); c.clip(); karakter(d, x + 62, y - 120 + 150 * 0.5, 0.5, t, { arketip: "damat", hareket: "selam", ifade: "coskulu", ek: { kremali: S.cift.kafadaPasta } }); c.restore();
    }
    c.fillStyle = "#fff"; c.fillRect(x - 210, y - 34, 420, 10);
    yazi("💍 ALLAH MESUT ETSİN 💍", x, y - 4, 24, "#fff", "center", 800, 4);
    for (const wx of [x - 130, x + 130]) { c.fillStyle = "#212121"; c.beginPath(); c.arc(wx, y + 20, 34, 0, TAM); c.fill(); c.fillStyle = "#9e9e9e"; c.beginPath(); c.arc(wx, y + 20, 14, 0, TAM); c.fill(); c.strokeStyle = "#616161"; c.lineWidth = 3; const a = t * 12; c.beginPath(); c.moveTo(wx + Math.cos(a) * 14, y + 20 + Math.sin(a) * 14); c.lineTo(wx - Math.cos(a) * 14, y + 20 - Math.sin(a) * 14); c.stroke(); }
    // Kurdele + balonlar
    c.strokeStyle = "#fff"; c.lineWidth = 4; c.beginPath(); c.moveTo(x - 200, y - 40); c.quadraticCurveTo(x - 160, y - 110, x - 120, y - 70); c.stroke();
    [["#ff4081", -170], ["#ffd54a", -195], ["#fff", -150]].forEach(([r, dx], i) => { const bx = x + dx - 20, by = y - 230 - i * 20 + Math.sin(t * 3 + i) * 6; c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - 190, y - 60); c.lineTo(bx, by + 24); c.stroke(); c.fillStyle = r; c.beginPath(); c.ellipse(bx, by, 20, 25, 0, 0, TAM); c.fill(); });
    if (Math.random() < 0.3) parcacik({ x: x + 220, y: y + 30, vx: rnd(40, 120), vy: rnd(-40, -10), tip: "duman", boyut: rnd(14, 26), omur: 1, yerc: -20 });
  }

  function duelloCiz(t) {
    const d = S.duello;
    const a = S.kisiler.get(d.a), b = S.kisiler.get(d.b);
    if (!a || !b) return;
    [[a, 230, "#ff4081", 1, "1"], [b, 850, "#40c4ff", -1, "2"]].forEach(([k, x, r, yon, no]) => {
      const sg = c.createRadialGradient(x, 1150, 10, x, 1150, 220); sg.addColorStop(0, "rgba(255,255,220,0.28)"); sg.addColorStop(1, "rgba(255,255,220,0)");
      c.fillStyle = sg; c.fillRect(x - 230, 700, 460, 560);
      const kazandi = d.bitti && d.kazanan === k.id, kaybetti = d.bitti && d.kazanan !== k.id;
      const h = kazandi ? "zafer" : kaybetti ? "dusme" : (k.hareket && simdi() < k.hareketBitis && k.hareket !== "dusme" ? k.hareket : sec(["break", "gobek", "cilgin", "omuz"].slice(0, 1 + (Math.floor(t / 2) % 4))) );
      karakter(k, x, 1250, 1.4, t, { hareket: d.bitti ? h : ["break", "gobek", "cilgin", "dondu"][(Math.floor(t / 2.5) + (no === "2" ? 2 : 0)) % 4], ifade: kazandi ? "havali" : kaybetti ? "baygin" : "cilgin", yon, ek: { tac: kazandi, yildiz: kaybetti } });
      yazi(no, x, 760, 90, r, "center", 800, 10);
      yazi(kisaAd(k, 14), x, 1290, 26, "#fff", "center", 800, 5);
    });
    yazi("VS", 540, 820, 80, "#ffd54a", "center", 800, 10);
  }

  function atanlarCiz(t) {
    const sh = S.sahne; if (!sh) return;
    for (let i = 0; i < 4; i++) {
      const x = 470 + i * 45, k = { ton: (i * 70 + 30) % 360, ten: i, tohum: i };
      karakter(k, x, 1255, 1.05, t, { arketip: i % 2 ? "kuzenE" : "dayi", hareket: "zafer", ifade: "coskulu" });
    }
  }

  // ------------------------------------------------------------
  //  ÇİZİM — KALABALIK
  // ------------------------------------------------------------
  function kalabalikCiz(t, nabiz) {
    const halay = (S.faz.ad === "halay" && !S.kopma);
    const sirali = S.kalabalik.map(id => S.kisiler.get(id)).sort((a, b) => a.cy - b.cy);
    if (halay) {
      const sira = S.kalabalik.map(id => S.kisiler.get(id));
      c.strokeStyle = "rgba(255,255,255,0.4)"; c.lineWidth = 5; c.lineCap = "round";
      for (let i = 1; i < sira.length; i++) {
        const a = sira[i - 1], b = sira[i];
        if (a.satir !== b.satir || Math.abs(a.cx - b.cx) > 160) continue;
        const sa = a.olcek || 1, sb = b.olcek || 1;
        c.beginPath(); c.moveTo(a.cx + 46 * sa * a.yon * (a.yon > 0 ? 1 : -1), a.cy - 128 * sa); c.lineTo(b.cx - 46 * sb, b.cy - 128 * sb); c.stroke();
      }
    }
    for (const k of sirali) {
      if (S.duello && (k.id === S.duello.a || k.id === S.duello.b)) continue;
      const s = (k.olcek || 1) * (k.id === S.halayBasi ? 1.12 : 1);
      let h = t < k.hareketBitis ? k.hareket : (halay ? "halay" : k.oto);
      if (S.sov && S.sov.tip === "efsane" && t < k.hareketBitis) h = k.hareket;
      const ifade = t < k.ifadeBitis ? k.ifade : (h === "cilgin" ? "cilgin" : h === "break" ? "havali" : (Math.sin(t * 0.3 + k.tohum * 3) > -0.3 ? "mutlu" : "normal"));
      const konusuyor = k.balon && t < k.balon.bitis;
      karakter(k, k.cx, k.cy, s, t, { hareket: h, ifade, yon: k.yon, konusuyor, faz: halay ? 0 : k.tohum * 0.13,
        ek: Object.assign({ tac: k.id === S.dugunSahibi || k.id === S.pistKrali, mendil: k.id === S.halayBasi }, k.ek) });
      const vurgulu = k.puanTur > 0;
      isimEtiketi(k, k.cx, k.cy + 6, s, t < k.yeniBitis, k.id === S.dugunSahibi ? "#ffd700" : vurgulu ? "#ffd54a" : k.nisanli ? "#ff80ab" : "#fff");
      if (k.id === S.halayBasi) yazi("🧣 HALAY BAŞI", k.cx, k.cy - 236 * s, 20, "#ff8a80", "center", 800, 4);
      if (k.id === S.pistKrali && k.id !== S.halayBasi) yazi("👑 PİSTİN KRALI", k.cx, k.cy - 236 * s, 20, "#40c4ff", "center", 800, 4);
      if (konusuyor) balon(k.balon.metin, k.cx, k.cy - 215 * s - (k.id === S.halayBasi ? 26 : 0), 22);
    }
    if (!S.kalabalik.length) yazi("💬 Yorum yaz, düğüne ilk SEN gel!", 540, 1680, 44, "#fff", "center", 800, 7);
  }

  // ------------------------------------------------------------
  //  ÇİZİM — EFEKTLER & ŞOVLAR
  // ------------------------------------------------------------
  function parcaciklarCiz() {
    for (const p of S.parcaciklar) {
      const a = 1 - p.yas / p.omur;
      c.globalAlpha = Math.min(1, a * 2);
      if (p.tip === "kalp") K.kalpSekli(c, p.x, p.y, p.boyut, p.renk);
      else if (p.tip === "gul") yazi("🌹", p.x, p.y, p.boyut * 1.4, "#fff", "center", 400, 0);
      else if (p.tip === "nazar") nazarCiz(p.x, p.y, p.boyut);
      else if (p.tip === "para") paraCiz(p.x, p.y, p.boyut, p.aci);
      else if (p.tip === "konfeti") { c.save(); c.translate(p.x, p.y); c.rotate(p.aci); c.fillStyle = p.renk; c.fillRect(-p.boyut / 2, -p.boyut / 4, p.boyut, p.boyut / 2); c.restore(); }
      else if (p.tip === "krema") { c.fillStyle = p.renk; c.beginPath(); c.arc(p.x, p.y, p.boyut * 0.7, 0, TAM); c.fill(); }
      else if (p.tip === "duman") { c.fillStyle = "rgba(200,200,200,0.5)"; c.beginPath(); c.arc(p.x, p.y, p.boyut * (1.5 - a), 0, TAM); c.fill(); }
      else { c.beginPath(); c.arc(p.x, p.y, p.boyut * a + 1, 0, TAM); c.fillStyle = p.renk; c.fill(); }
    }
    c.globalAlpha = 1;
  }

  function ucanlarCiz() {
    for (const u of S.ucanlar) {
      if (u.yas < 0) continue;
      const o = sinirla(u.yas / u.sure, 0, 1), e = 1 - Math.pow(1 - o, 2);
      const hx = typeof u.hx === "function" ? u.hx() : u.hx, hy = typeof u.hy === "function" ? u.hy() : u.hy;
      const x = u.x + (hx - u.x) * e, y = u.y + (hy - u.y) * e - Math.sin(o * PI) * u.yay;
      const b = u.boyut * (1 + Math.sin(o * PI) * 0.4);
      if (u.tip === "altin") altinCiz(x, y, b, u.renk);
      else if (u.tip === "para") paraCiz(x, y, b * 1.3, o * 8);
      else if (u.tip === "gul") yazi("🌹", x, y, b * 1.4, "#fff", "center", 400, 0);
      else if (u.tip === "cicek") { c.save(); c.translate(x, y); c.rotate(o * 12); c.scale(2, 2); [["#43a047", 0, 8, 4], ["#ff4081", -6, -4, 7], ["#fff", 6, -6, 7], ["#f8bbd0", 0, -12, 7], ["#ff80ab", -8, -14, 6]].forEach(([r, xx, yy, rr]) => { c.fillStyle = r; c.beginPath(); c.arc(xx, yy, rr, 0, TAM); c.fill(); }); c.restore(); }
      else if (u.tip === "pastaKat") { c.save(); c.translate(x, y); c.rotate(o * 6); pastaKatCiz(0, 40, 0.8); c.restore(); }
    }
  }

  function kombolarCiz() {
    const t = simdi();
    for (const v of S.kombolar.values()) {
      if (v.sayi < 2) continue;
      const k = S.kisiler.get(v.kisi); if (!k || ciftteMi(k.id)) continue;
      const p = 1 + Math.max(0, 0.4 - (t - v.vurus)) * 1.2;
      yazi(`${v.emoji} x${v.sayi}`, k.cx + 70, k.cy - 250 * (k.olcek || 1), 40 * p, "#ffeb3b", "center", 800, 7);
    }
  }

  function anonsCiz(t) {
    if (!S.anons) return;
    const g = t - S.anons.bas, giris = Math.min(1, g / 0.25), y = 1330;
    c.globalAlpha = giris;
    panel(30 + (1 - giris) * 200, y - 36, W - 60, 72, "rgba(0,0,0,0.8)", S.anons.renk, 22);
    yazi(S.anons.metin, W / 2 + (1 - giris) * 200, y, 30, S.anons.renk, "center", 800, 5, W - 100);
    c.globalAlpha = 1;
  }

  function kismetCiz(t) {
    const m = S.kismet; if (!m) return;
    const g = t - m.bas, a = S.kisiler.get(m.a), b = S.kisiler.get(m.b);
    const giris = Math.min(1, g / 0.8), cikis = g > 3.6 ? (g - 3.6) / 0.6 : 0;
    c.globalAlpha = 1 - cikis;
    c.fillStyle = "rgba(60,0,30,0.75)"; c.fillRect(0, 430, W, 870);
    const e = 1 - Math.pow(1 - giris, 3);
    const ax = -200 + (380 + 200) * e, bx = W + 200 - (W + 200 - 700) * e;
    karakter(a, ax, 1150, 1.5, t, { hareket: "zafer", ifade: "kalp", yon: 1 });
    karakter(b, bx, 1150, 1.5, t, { hareket: "zafer", ifade: "kalp", yon: -1 });
    if (giris >= 1) { K.kalpSekli(c, 540, 900, 110 * (1 + Math.sin(g * 10) * 0.08), "#ff1744"); if (Math.random() < 0.3) parcacik({ x: 540 + rnd(-40, 40), y: 900, vx: rnd(-200, 200), vy: rnd(-400, -150), tip: "kalp", renk: "#ff80ab", boyut: rnd(14, 26), omur: 1.5, yerc: 300 }); }
    yazi("💘 KISMET! 💘", 540, 560, 84, "#ff80ab", "center", 800, 10);
    yazi(`${kisaAd(a, 14)}  ❤  ${kisaAd(b, 14)}`, 540, 650, 42, "#fff", "center", 800, 7, W - 60);
    yazi("Birbirinizin profiline bakın 😉", 540, 1200, 34, "#ffd54a", "center", 800, 6);
    yazi("Sıradaki düğün sizin olabilir! 💍", 540, 1245, 28, "#f8bbd0", "center", 700, 5);
    c.globalAlpha = 1;
  }

  function sovCiz(t, nabiz) {
    const s = S.sov; if (!s || s.tip !== "efsane") return;
    const g = t - s.bas, kalan = s.sure - g;
    c.globalAlpha = Math.max(0, Math.min(1, g / 0.4, kalan / 0.5));
    const k = S.kisiler.get(s.kisi);
    const ton = (t * 120) % 360;
    const gr = c.createRadialGradient(540, 900, 50, 540, 900, 1100);
    gr.addColorStop(0, `hsla(${ton},90%,40%,0.88)`); gr.addColorStop(1, "rgba(10,0,10,0.94)");
    c.fillStyle = gr; c.fillRect(0, 0, W, H);
    c.save(); c.translate(540, 900); c.rotate(t * 0.6);
    for (let i = 0; i < 12; i++) { c.rotate(PI / 6); c.fillStyle = `rgba(255,215,0,${0.08 + nabiz * 0.06})`; c.beginPath(); c.moveTo(0, 0); c.lineTo(-80, -1300); c.lineTo(80, -1300); c.fill(); }
    c.restore();
    yazi("🥁 DAVUL - ZURNA! 🎺", 540, 330, 84, "#fff", "center", 800, 10);
    karakter(k, 540, 1260, 2.7 + nabiz * 0.1, t, { hareket: g < 1.5 ? "zafer" : ["zafer", "gobek", "kollar", "break"][Math.floor(g / 2.5) % 4], ifade: "havali", ek: { tac: true, esya: "para" } });
    karakter({ ton: 0, ten: 3, tohum: 1 }, 170, 1500, 1.7, t, { arketip: "davulcu", hareket: "davul", ifade: "coskulu", ek: { esya: "tokmak" } });
    c.fillStyle = "#c62828"; c.beginPath(); c.ellipse(170 + 10, 1500 - 120 * 1.7, 58, 70, 0, 0, TAM); c.fill(); c.strokeStyle = "#ffd54a"; c.lineWidth = 6; c.stroke();
    c.strokeStyle = "#fff"; c.lineWidth = 3; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(170 + 10 + i * 20, 1500 - 120 * 1.7 - 66); c.lineTo(170 + 10 - i * 20, 1500 - 120 * 1.7 + 66); c.stroke(); }
    karakter({ ton: 0, ten: 1, tohum: 2 }, 910, 1500, 1.7, t, { arketip: "zurnaci", hareket: "zurna", ifade: "coskulu", yon: -1, ek: { esya: "zurna" } });
    yazi("DÜĞÜN SAHİBİ", 540, 1360, 78, "#ffd700", "center", 800, 10);
    yazi(kisaAd(k, 20), 540, 1450, 64, "#fff", "center", 800, 9);
    yazi(`${sayi(s.coin)} coin • MAŞALLAH!`, 540, 1530, 44, "#ffd54a", "center", 800, 7);
    yazi("Herkes eğilsin! 🙇", 540, 1600, 36, "#fff", "center", 800, 6);
    c.globalAlpha = 1;
  }

  function finalOzetCiz(t) {
    if (S.faz.ad !== "final") return;
    const g = fazSure() - Math.min(8, F.final * 0.6) + 0.5;
    if (g < 0 || !S.ozet) return;
    c.globalAlpha = Math.min(1, g / 0.6);
    c.fillStyle = "rgba(20,0,25,0.9)"; c.fillRect(0, 430, W, 1490);
    const o = S.ozet;
    yazi(`🎊 DÜĞÜN #${o.turNo} BİTTİ! 🎊`, 540, 520, 64, "#ffd54a", "center", 800, 9);
    let y = 610;
    if (o.cift) {
      const a = S.kisiler.get(o.cift.gelin), b = S.kisiler.get(o.cift.damat);
      yazi(`Mutluluklar ${kisaAd(a, 12)} & ${kisaAd(b, 12)}! 💍`, 540, y, 38, "#fff", "center", 800, 6, W - 60); y += 54;
      yazi(`Toplam takı: ${sayi(o.cift.toplam)} coin`, 540, y, 34, "#ffd54a", "center", 800, 6); y += 50;
    }
    if (o.reis) { yazi(`👑 Evin reisi: ${o.reis === "gelin" ? "GELİN" : "DAMAT"}`, 540, y, 32, "#ff80ab", "center", 800, 5); y += 46; }
    if (o.kral) { yazi(`🕺 Pistin kralı: ${kisaAd(S.kisiler.get(o.kral), 16)}`, 540, y, 32, "#40c4ff", "center", 800, 5); y += 46; }
    if (S.siradakiCicek) { yazi(`💐 Sıradaki düğün: ${kisaAd(S.kisiler.get(S.siradakiCicek), 16)}`, 540, y, 32, "#f8bbd0", "center", 800, 5); y += 46; }
    y += 30;
    yazi("🏆 EN CÖMERT TAKI SAHİPLERİ", 540, y, 42, "#ffd54a", "center", 800, 7); y += 80;
    ["🥇", "🥈", "🥉"].forEach((m, i) => {
      const k = S.kisiler.get(o.ilk3[i]); if (!k) return;
      yazi(m, 230, y, 70, "#fff", "center", 400, 0);
      karakter(k, 350, y + 70, 0.75, t, { hareket: "zafer", ifade: "coskulu" });
      yazi(kisaAd(k, 16), 430, y - 12, 42, "#fff", "left", 800, 7);
      yazi(`${sayi(k.puanTur)} coin`, 430, y + 30, 30, "#ffd54a", "left", 800, 5);
      y += 160;
    });
    if (!o.ilk3.length) { yazi("Bu düğünde takı takan olmadı 😢", 540, y + 20, 36, "#fff", "center", 800, 6); }
    yazi("Sıradaki düğün başlıyor... 'bekar' yaz! 💘", 540, 1820, 36, "#ff80ab", "center", 800, 6, W - 60);
    c.globalAlpha = 1;
  }

  function yazilarCiz() {
    for (const y of S.yazilar) {
      const a = y.yas / y.omur;
      c.globalAlpha = 1 - Math.max(0, a - 0.7) / 0.3;
      const p = y.pop ? 1 + Math.max(0, 0.25 - y.yas) * 2.4 : 1;
      c.save(); c.translate(y.x, y.y); c.scale(p, p); yazi(y.metin, 0, 0, y.boyut, y.renk, "center", 800, Math.max(5, y.boyut / 10), W - 40); c.restore();
    }
    c.globalAlpha = 1;
  }

  function sonKartCiz(t) {
    const g = t - S.sonKart;
    c.globalAlpha = Math.min(1, g / 0.5);
    c.fillStyle = "rgba(20,0,25,0.94)"; c.fillRect(0, 0, W, H);
    yazi("💒 HER AKŞAM", 540, 470, 72, "#ffd54a", "center", 800, 9);
    yazi("CANLI DÜĞÜN!", 540, 570, 104, "#fff", "center", 800, 11);
    [["💬", "Yorum yaz → karakterin düğüne gelsin"], ["💘", "\"bekar\" yaz → gelin-damat SEN ol"], ["🕺", "\"göbek\" \"break\" yaz → oyna"], ["💍", "Hediye at → geline altın tak"], ["👑", "Aslan at → DÜĞÜN SAHİBİ ol"]]
      .forEach(([e, m], i) => yazi(`${e} ${m}`, 540, 740 + i * 82, 46, "#f8bbd0", "center", 800, 7, W - 80));
    const p = 1 + Math.sin(g * 6) * 0.04;
    c.save(); c.translate(540, 1270); c.scale(p, p);
    yuvarlak(-420, -75, 840, 150, 75); c.fillStyle = "#ff1744"; c.fill();
    yazi(`👉 @${A.hesapAdi || "hesabım"} TAKİP ET`, 0, 4, 60, "#fff", "center", 800, 0, 780);
    c.restore();
    yazi("Canlıda görüşürüz! 🎉", 540, 1430, 46, "#fff", "center", 800, 7);
    c.globalAlpha = 1;
  }

  // ------------------------------------------------------------
  //  ANA DÖNGÜ
  // ------------------------------------------------------------
  function ciz() {
    const t = simdi();
    const nabiz = window.Muzik ? Muzik.nabiz() : (Math.sin(t * 6) * 0.5 + 0.5) * 0.4;
    c.save();
    if (S.sarsinti > 0) c.translate(rnd(-1, 1) * 10 * S.sarsinti, rnd(-1, 1) * 10 * S.sarsinti);
    arkaPlan(t, nabiz);
    sahneCiz(t, nabiz);
    kalabalikCiz(t, nabiz);
    kombolarCiz();
    ucanlarCiz();
    if (S.kopma) { c.fillStyle = `hsla(${(t * 400) % 360},100%,50%,${0.08 + nabiz * 0.1})`; c.fillRect(0, 0, W, H); }
    c.restore();
    ustBilgi(t, nabiz);
    bilgiSatiri(t);
    kismetCiz(t);
    anonsCiz(t);
    finalOzetCiz(t);
    sovCiz(t, nabiz);
    parcaciklarCiz();
    yazilarCiz();
    if (S.flas && t - S.flas < 0.5) { c.fillStyle = `rgba(255,255,255,${0.8 * (1 - (t - S.flas) / 0.5)})`; c.fillRect(0, 0, W, H); }
    if (S.sonKart) sonKartCiz(t);
  }

  function dongu() {
    try { guncelle(); ciz(); } catch (e) { console.error(e); }
    requestAnimationFrame(dongu);
  }

  // Başlangıç
  ciftBelirle();
  fazBaslat(0);
  listeYukle(); setInterval(listeYukle, 20000);
  requestAnimationFrame(dongu);

  window.Oyun = {
    olay, durum: S, komut, durumOzeti, eslestir,
    turuBitir: () => komut({ komut: "turBitir" }),
    yeniDugun: () => yeniDugun(),
    sonrakiFaz: () => fazBitir(),
    sarkiAtla: () => sarkiDegistir(),
    sonKart: () => { S.sonKart = simdi(); },
    fazAdi: () => S.faz ? S.faz.ad + ":" + S.faz.adim : "",
    sifirla: () => location.reload(),
  };
})();
