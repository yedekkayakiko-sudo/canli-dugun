// ============================================================
//  CANLI DÜĞÜN — OYUN
//  Tuval: 1080x1920 (TikTok dikey). Olaylar Oyun.olay({...}) ile gelir.
// ============================================================
(function () {
  const A = window.AYAR;
  const W = 1080, H = 1920;
  const tuval = document.getElementById("tuval");
  const c = tuval.getContext("2d");
  tuval.width = W; tuval.height = H;

  const FONT = "'Baloo 2', 'Segoe UI', system-ui, sans-serif";
  const simdi = () => performance.now() / 1000;
  const sinirla = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const sayi = (n) => Math.round(n).toLocaleString("tr-TR");
  const kucuk = (s) => String(s || "").toLocaleLowerCase("tr");

  // ------------------------------------------------------------
  //  DURUM
  // ------------------------------------------------------------
  const S = {
    kisiler: new Map(),
    halay: [],
    bekarlar: [],
    ciftSirasi: [],
    cift: null,                 // {gelin, damat, takilar:[], toplam}
    istekler: [],
    calan: { sarki: "Hoş Geldiniz Düğünümüze", kimden: null, bitis: 0, tarz: "" },
    turNo: 1, turBitis: 0,
    takiToplam: 0, takiHedef: A.takiHedefi,
    coskuHam: 0,
    halayBasi: null, dugunSahibi: null,
    parcaciklar: [], ucanAltinlar: [], yazilar: [],
    kombolar: new Map(),
    anonslar: [], anons: null,
    kismetler: [], kismet: null,
    sovlar: [], sov: null, dansBekliyor: false,
    mp3Listesi: [], sonMp3: null, mp3Hata: -999,
    tabloSekme: 0,
  };

  // ------------------------------------------------------------
  //  KİŞİLER & AVATAR
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

  function renkTon(id) {
    let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return h;
  }

  function kisi(o) {
    let k = S.kisiler.get(o.id);
    if (!k) {
      k = { id: o.id, ad: o.ad || o.id, foto: null, ton: renkTon(o.id), puanTur: 0, puanToplam: 0,
            sonAktif: simdi(), cx: W / 2, cy: H + 100, balon: null, nisanli: false };
      S.kisiler.set(o.id, k);
    }
    if (o.ad) k.ad = o.ad;
    if (o.foto && !k.foto) k.foto = resim(o.foto);
    k.sonAktif = simdi();
    return k;
  }

  function kisaAd(k, n = 14) {
    const a = "@" + (k.ad || k.id);
    return a.length > n ? a.slice(0, n - 1) + "…" : a;
  }

  // ------------------------------------------------------------
  //  YARDIMCI ÇİZİM
  // ------------------------------------------------------------
  function yuvarlak(x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  function panel(x, y, w, h, renk = "rgba(40,10,40,0.72)", kenar = "rgba(255,215,120,0.55)") {
    yuvarlak(x, y, w, h, 26);
    c.fillStyle = renk; c.fill();
    c.lineWidth = 3; c.strokeStyle = kenar; c.stroke();
  }

  function yazi(metin, x, y, boyut, renk = "#fff", hiza = "center", kalin = 800, cizgi = 6, maxW) {
    c.font = `${kalin} ${boyut}px ${FONT}`;
    c.textAlign = hiza; c.textBaseline = "middle";
    if (cizgi) { c.lineJoin = "round"; c.lineWidth = cizgi; c.strokeStyle = "rgba(0,0,0,0.85)"; c.strokeText(metin, x, y, maxW); }
    c.fillStyle = renk; c.fillText(metin, x, y, maxW);
  }

  function avatar(k, x, y, r, halka = "#fff", halkaKalin = 5) {
    c.save();
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.closePath();
    const img = k && k.foto;
    if (img && img.complete && img.naturalWidth && !img._hata) {
      c.save(); c.clip(); c.drawImage(img, x - r, y - r, r * 2, r * 2); c.restore();
    } else {
      c.fillStyle = `hsl(${k ? k.ton : 0},65%,55%)`; c.fill();
      yazi(((k && k.ad) || "?").replace(/^@/, "").charAt(0).toLocaleUpperCase("tr"), x, y + r * 0.06, r * 1.1, "#fff", "center", 800, 0);
    }
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
    c.lineWidth = halkaKalin; c.strokeStyle = halka; c.stroke();
    c.restore();
  }

  function kalpCiz(x, y, s, renk) {
    c.save(); c.translate(x, y); c.scale(s / 30, s / 30);
    c.beginPath();
    c.moveTo(0, 10);
    c.bezierCurveTo(-30, -12, -12, -32, 0, -16);
    c.bezierCurveTo(12, -32, 30, -12, 0, 10);
    c.fillStyle = renk; c.fill(); c.restore();
  }

  function nazarCiz(x, y, r) {
    [["#0d47a1", 1], ["#fff", 0.68], ["#4fc3f7", 0.5], ["#000", 0.25]].forEach(([renk, o]) => {
      c.beginPath(); c.arc(x, y, r * o, 0, Math.PI * 2); c.fillStyle = renk; c.fill();
    });
  }

  function altinCiz(x, y, r, renk = "#ffc107") {
    const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, "#fff8d0"); g.addColorStop(0.5, renk); g.addColorStop(1, "#a86b00");
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = g; c.fill();
    c.lineWidth = 2; c.strokeStyle = "#7a4d00"; c.stroke();
    c.beginPath(); c.arc(x, y, r * 0.62, 0, Math.PI * 2); c.strokeStyle = "rgba(122,77,0,0.6)"; c.stroke();
  }

  // ------------------------------------------------------------
  //  EFEKT ÜRETİCİLERİ
  // ------------------------------------------------------------
  function parcacik(o) { if (S.parcaciklar.length < 700) S.parcaciklar.push(Object.assign({ omur: 2, yas: 0, don: rnd(-3, 3), aci: 0, yerc: 600 }, o)); }

  function patlama(x, y, adet, tip, renkler) {
    for (let i = 0; i < adet; i++) {
      const a = rnd(0, Math.PI * 2), h = rnd(200, 700);
      parcacik({ x, y, vx: Math.cos(a) * h, vy: Math.sin(a) * h - 200, tip, renk: renkler[i % renkler.length], boyut: rnd(10, 22), omur: rnd(1, 2) });
    }
  }

  function havaiFisek() {
    const x = rnd(150, W - 150), y = rnd(350, 900);
    const renk = ["#ff5252", "#ffd740", "#69f0ae", "#40c4ff", "#e040fb", "#fff"][Math.floor(rnd(0, 6))];
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2, h = rnd(250, 420);
      parcacik({ x, y, vx: Math.cos(a) * h, vy: Math.sin(a) * h, tip: "kivilcim", renk, boyut: rnd(4, 8), omur: rnd(1, 1.6), yerc: 180 });
    }
    window.Muzik && Muzik.pat();
  }

  function konfeti(adet) {
    for (let i = 0; i < adet; i++)
      parcacik({ x: rnd(0, W), y: rnd(-200, -10), vx: rnd(-60, 60), vy: rnd(150, 350), tip: "konfeti",
        renk: `hsl(${rnd(0, 360)},90%,60%)`, boyut: rnd(10, 18), omur: rnd(4, 6), yerc: 40 });
  }

  function yuzenYazi(metin, x, y, renk = "#fff", boyut = 40, omur = 2) {
    S.yazilar.push({ metin, x, y, renk, boyut, omur, yas: 0 });
  }

  function anons(metin, renk = "#ffd54a") {
    S.anonslar.push({ metin, renk });
    if (S.anonslar.length > 8) S.anonslar.shift();
  }

  // ------------------------------------------------------------
  //  HALAY
  // ------------------------------------------------------------
  function halayaEkle(k, oneAl = false) {
    const i = S.halay.indexOf(k.id);
    if (i >= 0) {
      if (oneAl && i > 0) { S.halay.splice(i, 1); S.halay.splice(halayOnSira(k), 0, k.id); }
      return;
    }
    if (S.halay.length >= A.halayKapasite) {
      // En uzun süredir sessiz ve hediyesiz olanı çıkar
      let enEski = -1, enEskiZaman = Infinity;
      S.halay.forEach((id, j) => {
        const p = S.kisiler.get(id);
        const z = p.sonAktif + (p.puanTur > 0 ? 600 : 0) + (p.nisanli ? 300 : 0);
        if (z < enEskiZaman && id !== S.halayBasi) { enEskiZaman = z; enEski = j; }
      });
      if (enEski >= 0) S.halay.splice(enEski, 1);
    }
    if (oneAl) S.halay.splice(halayOnSira(k), 0, k.id);
    else S.halay.push(k.id);
    k.cx = rnd(200, 880); k.cy = H + 80;
    window.Muzik && Muzik.blip(oneAl);
  }

  // Hediye atanlar: puana göre öne dizilir (halay başı her zaman 0. sırada)
  function halayOnSira(k) {
    let j = 0;
    while (j < S.halay.length) {
      const p = S.kisiler.get(S.halay[j]);
      if (p.puanTur < k.puanTur) break;
      j++;
    }
    return j;
  }

  function halayBasiGuncelle() {
    let en = null;
    for (const id of S.halay) { const p = S.kisiler.get(id); if (p.puanTur > 0 && (!en || p.puanTur > en.puanTur)) en = p; }
    const eski = S.halayBasi;
    S.halayBasi = en ? en.id : null;
    if (en && eski !== en.id) {
      S.halay.splice(S.halay.indexOf(en.id), 1); S.halay.unshift(en.id);
      anons(`🧣 ${kisaAd(en, 20)} artık HALAY BAŞI! Mendil onda!`, "#ff8a80");
    }
  }

  function halayKonumlari() {
    const n = S.halay.length, t = simdi();
    const on = Math.min(n, 11);
    const sonuc = [];
    const kay = Math.sin(t * 0.8) * 18;
    for (let i = 0; i < n; i++) {
      let x, y, olcek;
      if (i < on) {
        const u = on === 1 ? 0.5 : i / (on - 1);
        x = 95 + u * 890 + kay; y = 1730 - Math.sin(u * Math.PI) * 95; olcek = 1;
      } else {
        const m = n - on, j = i - on;
        const u = m === 1 ? 0.5 : j / (m - 1);
        x = 150 + u * 780 - kay; y = 1565 - Math.sin(u * Math.PI) * 50; olcek = 0.78;
      }
      sonuc.push({ id: S.halay[i], x, y, olcek, sira: i });
    }
    return sonuc;
  }

  // ------------------------------------------------------------
  //  ÇÖPÇATANLIK
  // ------------------------------------------------------------
  function bekarEkle(k, metin) {
    if (k.nisanli || (S.cift && (S.cift.gelin === k.id || S.cift.damat === k.id))) {
      k.balon = { metin: "Ben zaten nişanlıyım 💍", bitis: simdi() + 3 }; return;
    }
    let cins = null;
    if (/(^|\s)(kız|kiz|k|kadın|kadin|bayan|bayan)(\s|$|!)/.test(metin)) cins = "k";
    else if (/(^|\s)(erkek|e|bay|adam)(\s|$|!)/.test(metin)) cins = "e";
    const var_ = S.bekarlar.find(b => b.id === k.id);
    if (var_) { if (cins) var_.cins = cins; return; }
    halayaEkle(k);
    // Uygun eş ara: karşı cins önce, sonra cinsiyetsizler
    let es = S.bekarlar.findIndex(b => cins && b.cins && b.cins !== cins);
    if (es < 0) es = S.bekarlar.findIndex(b => !cins || !b.cins || b.cins !== cins);
    if (es >= 0) {
      const b = S.bekarlar.splice(es, 1)[0];
      const k2 = S.kisiler.get(b.id);
      let gelin = k, damat = k2;
      if (cins === "e" || b.cins === "k") { gelin = k2; damat = k; }
      gelin.nisanli = damat.nisanli = true;
      S.ciftSirasi.push({ gelin: gelin.id, damat: damat.id });
      S.kismetler.push({ a: gelin.id, b: damat.id });
      if (!S.cift) sonrakiCift();
    } else {
      S.bekarlar.push({ id: k.id, cins, zaman: simdi() });
      k.balon = { metin: "Kısmetimi arıyorum 💘", bitis: simdi() + 4 };
    }
  }

  function sonrakiCift() {
    const yeni = S.ciftSirasi.shift();
    if (!yeni) { S.cift = null; return; }
    S.cift = { gelin: yeni.gelin, damat: yeni.damat, takilar: [], toplam: 0, bas: simdi() };
    const g = S.kisiler.get(yeni.gelin), d = S.kisiler.get(yeni.damat);
    anons(`💒 Gelin ${kisaAd(g, 18)} & Damat ${kisaAd(d, 18)} piste! TAKI MERASİMİ başlıyor!`, "#ffffff");
    window.Muzik && Muzik.zilgit();
    konfeti(80);
  }

  // ------------------------------------------------------------
  //  İSTEK ŞARKI
  // ------------------------------------------------------------
  const VARSAYILAN_HAVALAR = ["Düğün Havası", "Halay Zamanı", "Oyun Havası", "Gelin Alma Havası", "Kına Havası", "Davul Zurna Havası"];
  function istekEkle(k, sarki) {
    sarki = sarki.replace(/\s+/g, " ").trim().slice(0, 34);
    if (sarki.length < 2) return;
    S.istekler = S.istekler.filter(i => i.kimden !== k.id);
    const dosya = eslestir(sarki);
    S.istekler.push({ sarki: dosya ? dosyaAdi(dosya) : sarki, dosya, kimden: k.id, oncelik: k.puanToplam > 0, zaman: simdi() });
    S.istekler.sort((a, b) => (b.oncelik - a.oncelik) || (a.zaman - b.zaman));
    S.istekler = S.istekler.slice(0, 12);
    k.balon = { metin: dosya ? `📀 ${dosyaAdi(dosya)} — listede var!` : `🎵 İstek: ${sarki}`, bitis: simdi() + 4 };
    if (!S.calan.kimden) sarkiDegistir();
  }

  // ---------- Şarkı klasörü (oyun/sarkilar) ----------
  function norm(x) {
    return kucuk(x).replace(/\.(mp3|m4a|ogg|wav)$/, "")
      .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u").replace(/[âä]/g, "a")
      .replace(/[^a-z0-9]+/g, " ").trim();
  }
  function dosyaAdi(d) { return d.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ").trim(); }

  // İzleyicinin yazdığını klasördeki dosya adlarıyla karşılaştır (Türkçe karakter / yazım farkına dayanıklı)
  function eslestir(istek) {
    const q = norm(istek);
    if (q.length < 2 || !S.mp3Listesi.length) return null;
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
    if (!/^https?:/.test(location.protocol)) return;   // dosyadan açıldıysa liste yok
    fetch("sarkilar.json", { cache: "no-store" }).then(r => r.ok ? r.json() : []).then(l => {
      if (!Array.isArray(l)) return;
      const ilk = !S.mp3Listesi.length && l.length;
      S.mp3Listesi = l;
      // İlk kez şarkı bulunduysa ve istek çalmıyorsa hemen listeden başla
      if (ilk && A.bosOldugundaMp3 && !S.calan.kimden && !S.calan.mp3) sarkiDegistir();
    }).catch(() => {});
  }

  function sarkiDegistir(secim) {
    const sira = secim || S.istekler.shift();
    const mp3Olur = window.Muzik && simdi() - S.mp3Hata > 15;
    let ad, kimden = null, dosya = null;
    if (sira) {
      kimden = sira.kimden || null;
      dosya = mp3Olur ? (sira.dosya || eslestir(sira.sarki)) : null;
      ad = dosya ? dosyaAdi(dosya) : sira.sarki;
    } else if (mp3Olur && A.bosOldugundaMp3 && S.mp3Listesi.length) {
      const aday = S.mp3Listesi.length > 1 ? S.mp3Listesi.filter(d => d !== S.sonMp3) : S.mp3Listesi;
      dosya = aday[Math.floor(Math.random() * aday.length)];
      ad = dosyaAdi(dosya);
    } else {
      ad = VARSAYILAN_HAVALAR[Math.floor(Math.random() * VARSAYILAN_HAVALAR.length)];
    }
    const calan = { sarki: ad, kimden, bas: simdi(), bitis: 0, mp3: !!dosya, secim: !!(sira && !sira.kimden) };
    S.calan = calan;
    if (dosya) {
      S.sonMp3 = dosya;
      calan.bitis = Infinity; calan.tarz = "📀 orijinal kayıt";
      Muzik.mp3Cal("sarkilar/" + encodeURIComponent(dosya), (hata) => {
        if (hata) S.mp3Hata = simdi();
        if (S.calan === calan) calan.bitis = 0;
      });
    } else {
      if (window.Muzik) { Muzik.mp3Durdur(); calan.tarz = "🎹 " + Muzik.sarki(ad); }
      calan.bitis = simdi() + (kimden ? 80 : 70);
    }
    if (kimden) {
      const k = S.kisiler.get(kimden);
      anons(`${dosya ? "📀" : "🎹"} Çalıyor: "${ad}" — istek: ${kisaAd(k, 18)}`, "#b388ff");
    }
  }

  // Yayıncı kumandası / klavye komutları
  function komut(o) {
    const k = o && o.komut;
    if (k === "muzik") return window.Muzik && Muzik.muzikAc(o.acik);
    if (k === "sonraki") return sarkiDegistir();
    if (k === "cal" && o.dosya) return sarkiDegistir({ sarki: dosyaAdi(o.dosya), dosya: o.dosya });
    if (k === "sesArti") return window.Muzik && Muzik.sesDegistir(0.1);
    if (k === "sesEksi") return window.Muzik && Muzik.sesDegistir(-0.1);
    if (k === "turBitir") { S.turBitis = 0; return; }
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
      sarkilar: S.mp3Listesi,
      turNo: S.turNo,
      kalan: isFinite(S.turBitis) ? Math.max(0, Math.round(S.turBitis - simdi())) : null,
      halay: S.halay.length,
    };
  }

  // ------------------------------------------------------------
  //  HEDİYE
  // ------------------------------------------------------------
  function kademeBul(ad, coin) {
    const ozel = A.ozelHediyeler[kucuk(ad)];
    if (ozel) return ozel;
    let t = "mini";
    for (const k of A.kademeler) if (coin >= k.enAz) t = k.tur;
    return t;
  }

  function takiAdi(coin) {
    let s = A.takiAdlari[0];
    for (const t of A.takiAdlari) if (coin >= t.enAz) s = t;
    return s;
  }

  function hediyeEmoji(ad) {
    const t = A.testHediyeleri.find(h => kucuk(h.ad) === kucuk(ad));
    return t ? t.emoji : "🎁";
  }

  function hediye(o) {
    const k = kisi(o);
    const coin = Math.max(1, Number(o.coin) || 1);
    const adet = Math.max(1, Math.min(500, Number(o.adet) || 1));
    const toplam = coin * adet;
    k.puanTur += toplam; k.puanToplam += toplam;
    halayaEkle(k, true);
    halayBasiGuncelle();
    S.takiToplam += toplam;
    if (S.cift) S.cift.toplam += toplam;
    S.istekler.forEach(i => { if (i.kimden === k.id) i.oncelik = true; });

    // Kombo sayacı
    const anahtar = k.id + "|" + o.hediye;
    const kb = S.kombolar.get(anahtar) || { sayi: 0, kisi: k.id, emoji: hediyeEmoji(o.hediye) };
    kb.sayi += adet; kb.bitis = simdi() + 3.5; kb.vurus = simdi();
    S.kombolar.set(anahtar, kb);

    const tur = kademeBul(o.hediye, coin);
    const x = k.cx, y = k.cy - 60;
    if (tur === "mini") {
      patlama(x, y, Math.min(6 + adet * 2, 30), coin <= 1 ? "gul" : "kalp", ["#ff1744", "#ff4081", "#ff80ab"]);
    } else if (tur === "nazar") {
      for (let i = 0; i < Math.min(12 + adet * 6, 60); i++)
        parcacik({ x: rnd(40, W - 40), y: rnd(-300, -20), vx: rnd(-30, 30), vy: rnd(200, 420), tip: "nazar", boyut: rnd(16, 30), omur: 5, yerc: 60 });
      anons(`🧿 ${kisaAd(k, 20)}: Nazar değmesin bu düğüne!`, "#4fc3f7");
    } else if (tur === "taki") {
      const ta = takiAdi(coin);
      for (let i = 0; i < Math.min(adet, 6); i++) altinFirlat(k, ta, i * 0.18);
      anons(`🎤 ${kisaAd(k, 18)}'dan ${S.cift ? "gelinimize" : "düğüne"} ${adet > 1 ? adet + " x " : ""}${ta.ad}! Maşallah!`, ta.renk);
      if (coin >= 199 && window.Muzik) Muzik.zilgit();
    } else if (tur === "pasta") {
      altinFirlat(k, takiAdi(coin), 0);
      for (let i = 0; i < Math.min(adet, 3); i++) S.sovlar.push({ tip: "pasta", kisi: k.id, sure: 8 });
    } else if (tur === "efsane") {
      altinFirlat(k, takiAdi(coin), 0);
      S.sovlar.push({ tip: "efsane", kisi: k.id, sure: 16, coin: toplam });
    }

    // Takı hedefi
    if (S.takiToplam >= S.takiHedef && !S.dansBekliyor) {
      S.takiHedef = Math.round(S.takiHedef * A.takiHedefiCarpan);
      S.takiToplam = 0;
      S.dansBekliyor = true;   // hediye şovları bitince başlar
    }
  }

  function altinFirlat(k, ta, gecikme) {
    const hedef = S.cift ? (S.cift.takilar.length % 2 === 0 ? "g" : "d") : "k";
    S.ucanAltinlar.push({ x: k.cx, y: k.cy - 60, hedef, ta, kimden: k.id, yas: -gecikme, sure: 1.1 });
  }

  function altinHedefKonumu(h) {
    if (h === "g") return { x: 455, y: 900 };
    if (h === "d") return { x: 625, y: 900 };
    return { x: 540, y: 840 };
  }

  // ------------------------------------------------------------
  //  OLAY GİRİŞİ (köprüden ve test panelinden)
  // ------------------------------------------------------------
  function yasakli(m) { const k = kucuk(m); return A.yasakliKelimeler.some(y => y && k.includes(kucuk(y))); }

  function olay(o) {
    if (!o || !o.id) return;
    if (o.tip === "yorum") {
      const metin = String(o.metin || "").trim();
      if (!metin || yasakli(metin)) return;
      const k = kisi(o);
      const km = kucuk(metin);
      const istek = km.match(/^[!/.]?\s*(şarkı|sarki|istek|şarki|sarkı)\s*[:\-]?\s*(.+)$/);
      if (istek) { halayaEkle(k); istekEkle(k, metin.slice(metin.length - istek[2].length)); return; }
      if (/\bbekar|bekâr/.test(km) || /^!?\s*tanış|^!?\s*tanis/.test(km)) { bekarEkle(k, km); k.balon = k.balon || { metin, bitis: simdi() + A.balonSuresi }; return; }
      halayaEkle(k);
      k.balon = { metin: metin.length > 30 ? metin.slice(0, 29) + "…" : metin, bitis: simdi() + A.balonSuresi };
    } else if (o.tip === "hediye") {
      hediye(o);
    } else if (o.tip === "begeni") {
      const k = kisi(o);
      const adet = Math.max(1, Number(o.adet) || 1);
      S.coskuHam += adet;
      if (S.halay.length < A.halayKapasite) halayaEkle(k);
      for (let i = 0; i < Math.min(adet, 5); i++)
        parcacik({ x: rnd(900, 1050), y: rnd(1250, 1330), vx: rnd(-60, 20), vy: rnd(-350, -200), tip: "kalp", renk: "#ff4081", boyut: rnd(14, 24), omur: 1.6, yerc: -40 });
    } else if (o.tip === "takip") {
      const k = kisi(o); halayaEkle(k);
      anons(`🎉 ${kisaAd(k, 20)} aileye katıldı! Hoş geldin!`, "#69f0ae");
    } else if (o.tip === "paylasim") {
      const k = kisi(o); halayaEkle(k);
      anons(`📣 ${kisaAd(k, 20)} düğünü herkese duyurdu!`, "#40c4ff");
      konfeti(25);
    } else if (o.tip === "giris") {
      const k = kisi(o);
      if (S.anonslar.length < 2) yuzenYazi(`👋 ${kisaAd(k, 18)} düğüne geldi`, 540, 1335, "#e1bee7", 30, 2.2);
    }
  }

  // ------------------------------------------------------------
  //  TUR (DÜĞÜN) YÖNETİMİ
  // ------------------------------------------------------------
  function turBaslat() {
    S.turBitis = simdi() + A.turSuresi;
    for (const k of S.kisiler.values()) k.puanTur = 0;
    S.halayBasi = null; S.dugunSahibi = null;
  }

  function turBitir() {
    const ilk3 = [...S.kisiler.values()].filter(k => k.puanTur > 0).sort((a, b) => b.puanTur - a.puanTur).slice(0, 3).map(k => k.id);
    S.sovlar.push({ tip: "tursonu", sure: 8, ilk3, cift: S.cift ? { ...S.cift } : null, turNo: S.turNo });
    S.turBitis = Infinity;
  }

  // ------------------------------------------------------------
  //  GÜNCELLEME
  // ------------------------------------------------------------
  let sonT = simdi();
  function guncelle() {
    const t = simdi(), dt = Math.min(0.05, t - sonT); sonT = t;

    // Coşku
    S.coskuHam *= Math.pow(0.9, dt);
    const cosku = sinirla(S.coskuHam / A.coskuIcinBegeni, 0, 1);
    window.Muzik && Muzik.cosku(cosku);

    // Tur
    if (t > S.turBitis && !S.sov) turBitir();

    // Şarkı
    if (t > S.calan.bitis) sarkiDegistir();

    // Bekarları zaman aşımı (5 dk)
    S.bekarlar = S.bekarlar.filter(b => t - b.zaman < 300);

    // Parçacıklar
    for (const p of S.parcaciklar) {
      p.yas += dt; p.vy += p.yerc * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.aci += p.don * dt;
      if (p.tip === "konfeti") p.vx += Math.sin(t * 3 + p.y * 0.01) * 20 * dt;
    }
    S.parcaciklar = S.parcaciklar.filter(p => p.yas < p.omur && p.y < H + 100);

    // Uçan altınlar
    for (const a of S.ucanAltinlar) {
      a.yas += dt;
      if (a.yas >= a.sure && !a.vardi) {
        a.vardi = true;
        const h = altinHedefKonumu(a.hedef);
        if (S.cift && a.hedef !== "k") S.cift.takilar.push({ renk: a.ta.renk, hedef: a.hedef, kimden: a.kimden });
        patlama(h.x, h.y, 14, "kivilcim", ["#ffd54a", "#fff59d", "#ffb300"]);
        yuzenYazi(a.ta.ad, h.x, h.y - 70, a.ta.renk, 36, 1.6);
        window.Muzik && Muzik.altin();
      }
    }
    S.ucanAltinlar = S.ucanAltinlar.filter(a => !a.vardi);

    // Yazılar
    for (const y of S.yazilar) { y.yas += dt; y.y -= 40 * dt; }
    S.yazilar = S.yazilar.filter(y => y.yas < y.omur);

    // Kombolar
    for (const [k, v] of S.kombolar) if (t > v.bitis) S.kombolar.delete(k);

    // Anons kuyruğu
    if (S.anons && t - S.anons.bas > (S.anonslar.length > 2 ? 2.2 : 3.4)) S.anons = null;
    if (!S.anons && S.anonslar.length) S.anons = Object.assign(S.anonslar.shift(), { bas: t });

    // Kısmet
    if (S.kismet && t - S.kismet.bas > 4.2) S.kismet = null;
    if (!S.kismet && S.kismetler.length) {
      S.kismet = Object.assign(S.kismetler.shift(), { bas: t });
      window.Muzik && Muzik.kismet();
      const a = S.kisiler.get(S.kismet.a), b = S.kisiler.get(S.kismet.b);
      anons(`💘 KISMET! ${kisaAd(a, 16)} ❤ ${kisaAd(b, 16)} — profillerine bakın 😉`, "#ff80ab");
    }

    // Şovlar
    if (S.sov && t - S.sov.bas > S.sov.sure) {
      if (S.sov.tip === "tursonu") { S.turNo++; sonrakiCift(); turBaslat(); }
      S.sov = null;
    }
    if (!S.sov && !S.sovlar.length && S.dansBekliyor) { S.dansBekliyor = false; S.sovlar.push({ tip: "dans", sure: 10 }); }
    if (!S.sov && S.sovlar.length) {
      S.sov = Object.assign(S.sovlar.shift(), { bas: t });
      if (S.sov.tip === "efsane") { S.dugunSahibi = S.sov.kisi; window.Muzik && (Muzik.davulSilsile(), Muzik.davulZurna(S.sov.sure)); }
      if (S.sov.tip === "pasta" || S.sov.tip === "dans") window.Muzik && Muzik.zilgit();
      if (S.sov.tip === "tursonu") window.Muzik && Muzik.zilgit();
    }
    if (S.sov) {
      const gecen = t - S.sov.bas;
      if (S.sov.tip === "pasta" && gecen > 2.5 && Math.random() < dt * 5) havaiFisek();
      if (S.sov.tip === "efsane" && Math.random() < dt * 6) havaiFisek();
      if (S.sov.tip === "efsane" && Math.random() < dt * 3) konfeti(6);
      if (S.sov.tip === "dans" && Math.random() < dt * 8)
        parcacik({ x: rnd(300, 780), y: rnd(700, 1100), vx: rnd(-40, 40), vy: rnd(-200, -80), tip: "kalp", renk: "#ff4081", boyut: rnd(18, 34), omur: 2, yerc: 0 });
      if (S.sov.tip === "tursonu" && Math.random() < dt * 3) havaiFisek();
    }

    // Kişi konumları (yumuşak geçiş)
    for (const p of halayKonumlari()) {
      const k = S.kisiler.get(p.id);
      k.cx += (p.x - k.cx) * Math.min(1, dt * 4);
      k.cy += (p.y - k.cy) * Math.min(1, dt * 4);
      k.olcek = p.olcek; k.sira = p.sira;
    }
  }

  // ------------------------------------------------------------
  //  ÇİZİM — ARKA PLAN & SAHNE
  // ------------------------------------------------------------
  function arkaPlan(t, nabiz) {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#1a0526"); g.addColorStop(0.45, "#3b0a3f"); g.addColorStop(1, "#12041c");
    c.fillStyle = g; c.fillRect(0, 0, W, H);

    // Işık spotları
    for (let i = 0; i < 3; i++) {
      const x = W * (0.2 + i * 0.3) + Math.sin(t * 0.7 + i * 2) * 140;
      const sg = c.createRadialGradient(x, 1500, 10, x, 1500, 520);
      const ton = (t * 40 + i * 120) % 360;
      sg.addColorStop(0, `hsla(${ton},90%,60%,${0.16 + nabiz * 0.12})`); sg.addColorStop(1, "hsla(0,0%,0%,0)");
      c.fillStyle = sg; c.fillRect(0, 1000, W, 920);
    }

    // Pist (perspektif kareli zemin)
    c.save();
    c.beginPath(); c.moveTo(0, 1360); c.lineTo(W, 1360); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.clip();
    for (let r = 0; r < 9; r++) for (let k = -6; k < 14; k++) {
      const y0 = 1360 + r * r * 8 + r * 20, y1 = 1360 + (r + 1) * (r + 1) * 8 + (r + 1) * 20;
      const yay = (y) => (y - 1300) / 620 + 0.35;
      const x0a = W / 2 + (k * 120 - W / 2) * yay(y0), x1a = W / 2 + ((k + 1) * 120 - W / 2) * yay(y0);
      const x0b = W / 2 + (k * 120 - W / 2) * yay(y1), x1b = W / 2 + ((k + 1) * 120 - W / 2) * yay(y1);
      const yanik = (r + k) % 2 === 0;
      const ton = (k * 40 + r * 25 + t * 60) % 360;
      c.fillStyle = yanik ? `hsla(${ton},80%,${30 + nabiz * 18}%,0.55)` : "rgba(20,5,30,0.6)";
      c.beginPath(); c.moveTo(x0a, y0); c.lineTo(x1a, y0); c.lineTo(x1b, y1); c.lineTo(x0b, y1); c.closePath(); c.fill();
    }
    c.restore();

    // Ampul zincirleri
    ampulZinciri(t, 0, 115, W, 115, 55, nabiz);
    ampulZinciri(t, 0, 640, W, 640, 40, nabiz);
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
      c.beginPath(); c.arc(x, y, 7 + (yanik ? nabiz * 3 : 0), 0, Math.PI * 2);
      c.fillStyle = yanik ? renk[i % 5] : "rgba(255,255,255,0.15)";
      c.shadowColor = renk[i % 5]; c.shadowBlur = yanik ? 18 : 0; c.fill();
    }
    c.shadowBlur = 0;
  }

  // ------------------------------------------------------------
  //  ÇİZİM — ÜST BANT (NASIL OYNANIR)
  // ------------------------------------------------------------
  const IPUCLARI = [
    ["💬", "Yorum yaz → HALAYA KATIL!"],
    ["💘", "\"bekar\" yaz → KISMETİNİ BUL!"],
    ["👰", "Eşleşen çift → sıradaki GELİN-DAMAT!"],
    ["🌹", "Gül at → halayın EN ÖNÜNE geç"],
    ["💍", "10+ coin → geline ALTIN TAK"],
    ["🎂", "500+ PASTA  •  🦁 5000+ DAVUL-ZURNA"],
    ["🎵", "\"!şarkı şarkı adı\" → İSTEK YAP"],
    ["❤️", "Beğen → halay HIZLANSIN!"],
  ];
  function ustBant(t) {
    panel(30, 150, W - 60, 112, "rgba(120,15,60,0.85)", "#ffd54a");
    const kalan = Math.max(0, S.turBitis - t);
    const dk = Math.floor(kalan / 60), sn = Math.floor(kalan % 60);
    yazi(`💒 CANLI DÜĞÜN #${S.turNo}`, 60, 180, 30, "#ffd54a", "left", 800, 5);
    yazi(isFinite(kalan) ? `⏱ ${dk}:${String(sn).padStart(2, "0")}` : "⏱ —", W - 60, 180, 30, kalan < 30 ? "#ff5252" : "#fff", "right", 800, 5);
    const i = Math.floor(t / 3.6) % IPUCLARI.length;
    const faz = (t / 3.6) % 1;
    const kay = faz < 0.08 ? (1 - faz / 0.08) * 40 : 0;
    c.globalAlpha = faz < 0.08 ? faz / 0.08 : 1;
    yazi(`${IPUCLARI[i][0]} ${IPUCLARI[i][1]}`, W / 2, 228 + kay, 46, "#fff", "center", 800, 7, W - 100);
    c.globalAlpha = 1;
  }

  // ------------------------------------------------------------
  //  ÇİZİM — LİDERLİK & İSTEK PANOSU
  // ------------------------------------------------------------
  function liderlik(t) {
    const x = 30, y = 280, w = 500, h = 345;
    panel(x, y, w, h);
    const sekme = Math.floor(t / 8) % 2;
    yazi("💰 EN CÖMERT TAKI SAHİPLERİ", x + w / 2, y + 34, 29, "#ffd54a", "center", 800, 5, w - 30);
    yazi(sekme === 0 ? "◉ BU DÜĞÜN   ○ GECENİN" : "○ BU DÜĞÜN   ◉ GECENİN", x + w / 2, y + 70, 22, "#f8bbd0", "center", 700, 4);
    const alan = sekme === 0 ? "puanTur" : "puanToplam";
    const liste = [...S.kisiler.values()].filter(k => k[alan] > 0).sort((a, b) => b[alan] - a[alan]).slice(0, 5);
    const madalya = ["🥇", "🥈", "🥉", "4", "5"];
    if (!liste.length) yazi("İlk takıyı sen tak! 💍", x + w / 2, y + 200, 32, "#fff", "center", 800, 5);
    liste.forEach((k, i) => {
      const ry = y + 115 + i * 47;
      if (i === 0) { yuvarlak(x + 12, ry - 22, w - 24, 44, 14); c.fillStyle = "rgba(255,213,74,0.18)"; c.fill(); }
      yazi(madalya[i], x + 38, ry, i < 3 ? 30 : 24, "#fff", "center", 800, i < 3 ? 0 : 4);
      avatar(k, x + 86, ry, 19, i === 0 ? "#ffd54a" : "#fff", 3);
      yazi(kisaAd(k, 15), x + 116, ry, 27, "#fff", "left", 700, 4, 250);
      yazi(`${sayi(k[alan])} 🪙`, x + w - 22, ry, 26, "#ffd54a", "right", 800, 4);
    });
  }

  function istekPanosu(t, nabiz) {
    const x = 550, y = 280, w = 500, h = 345;
    panel(x, y, w, h);
    yazi("🎵 İSTEK ŞARKILAR", x + w / 2, y + 34, 30, "#b388ff", "center", 800, 5);
    // Şimdi çalan
    yuvarlak(x + 14, y + 60, w - 28, 92, 18);
    c.fillStyle = `rgba(124,77,255,${0.25 + nabiz * 0.25})`; c.fill();
    yazi("▶ ŞİMDİ ÇALIYOR", x + 30, y + 80, 20, "#e1bee7", "left", 700, 3);
    yazi(S.calan.sarki, x + 30, y + 112, 32, "#fff", "left", 800, 5, w - 60);
    const kimden = S.calan.kimden ? "istek: " + kisaAd(S.kisiler.get(S.calan.kimden), 16) : S.calan.secim ? "yayıncının seçimi" : S.calan.mp3 ? "çalma listesi" : "orgcunun seçimi";
    yazi(`${kimden}  •  ${S.calan.tarz || ""}`, x + 30, y + 140, 19, "#ce93d8", "left", 600, 3, w - 60);
    const ilerleme = S.calan.mp3 ? Muzik.mp3Ilerleme() : sinirla((t - (S.calan.bas || t)) / Math.max(1, S.calan.bitis - (S.calan.bas || t)), 0, 1);
    c.fillStyle = "rgba(255,255,255,0.2)"; c.fillRect(x + 30, y + 155, w - 60, 4);
    c.fillStyle = "#b388ff"; c.fillRect(x + 30, y + 155, (w - 60) * ilerleme, 4);

    S.istekler.slice(0, 4).forEach((r, i) => {
      const ry = y + 190 + i * 36;
      const k = S.kisiler.get(r.kimden);
      yazi(`${r.oncelik ? "⭐" : `${i + 1}.`}${r.dosya ? "📀" : ""} ${r.sarki}`, x + 26, ry, 24, r.oncelik ? "#ffd54a" : "#fff", "left", 700, 4, 300);
      yazi(kisaAd(k, 12), x + w - 22, ry, 20, "#ce93d8", "right", 600, 3);
    });
    if (!S.istekler.length) yazi("!şarkı <şarkı adı> yaz", x + w / 2, y + 240, 28, "#fff", "center", 700, 4);
    const L = S.mp3Listesi, faz = Math.floor(t / 3.5);
    const alt = L.length && faz % 2 ? `📀 Listede: ${dosyaAdi(L[Math.floor(faz / 2) % L.length])}` : "⭐ Hediye atanın isteği öne geçer";
    yazi(alt, x + w / 2, y + h - 20, 19, "#f8bbd0", "center", 600, 3, w - 30);
  }

  // ------------------------------------------------------------
  //  ÇİZİM — KARAKTERLER
  // ------------------------------------------------------------
  function insan(k, x, y, s, t, nabiz, rol) {
    // rol: "gelin" | "damat" | "halay" | "orgcu"
    c.save(); c.translate(x, y); c.scale(s, s);
    const bob = -nabiz * 10;
    const adimFaz = Math.sin(t * Math.PI * 2 / (window.Muzik ? Muzik.vurusSuresi() * 2 : 1) + (k ? k.sira || 0 : 0) * 0.3);
    const ton = k ? k.ton : 200;

    // Bacaklar
    c.strokeStyle = rol === "gelin" ? "#fff" : "#222"; c.lineWidth = 12; c.lineCap = "round";
    if (rol !== "gelin") {
      const tekme = rol === "halay" ? Math.max(0, adimFaz) * 28 : 0;
      c.beginPath(); c.moveTo(-10, -60 + bob); c.lineTo(-14, 0); c.stroke();
      c.beginPath(); c.moveTo(10, -60 + bob); c.lineTo(14 + tekme, -tekme * 0.8); c.stroke();
    }
    // Gövde
    if (rol === "gelin") {
      c.beginPath(); c.moveTo(-22, -125 + bob); c.lineTo(22, -125 + bob); c.lineTo(62, 0); c.lineTo(-62, 0); c.closePath();
      const g = c.createLinearGradient(0, -125, 0, 0); g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#f3e5f5");
      c.fillStyle = g; c.fill(); c.strokeStyle = "#e1bee7"; c.lineWidth = 3; c.stroke();
    } else {
      yuvarlak(-26, -130 + bob, 52, 76, 16);
      c.fillStyle = rol === "damat" ? "#1c1c2e" : rol === "orgcu" ? "#5d4037" : `hsl(${ton},70%,48%)`; c.fill();
      if (rol === "damat") { c.fillStyle = "#fff"; c.beginPath(); c.moveTo(-8, -130 + bob); c.lineTo(8, -130 + bob); c.lineTo(0, -100 + bob); c.fill();
        c.fillStyle = "#c62828"; c.beginPath(); c.moveTo(-9, -126 + bob); c.lineTo(9, -126 + bob); c.lineTo(0, -116 + bob); c.fill(); }
    }
    // Kollar (halayda: yanlara açık, omuz omuza)
    c.strokeStyle = rol === "gelin" ? "#fce4ec" : (rol === "damat" ? "#1c1c2e" : `hsl(${ton},70%,40%)`);
    c.lineWidth = 11;
    if (rol === "halay") {
      c.beginPath(); c.moveTo(-22, -118 + bob); c.lineTo(-46, -128 + bob - nabiz * 6); c.stroke();
      c.beginPath(); c.moveTo(22, -118 + bob); c.lineTo(46, -128 + bob - nabiz * 6); c.stroke();
    } else if (rol === "orgcu") {
      const el = Math.sin(t * 14) * 6;
      c.beginPath(); c.moveTo(-20, -115); c.lineTo(-30 + el, -75); c.stroke();
      c.beginPath(); c.moveTo(20, -115); c.lineTo(30 - el, -75); c.stroke();
    } else {
      const sall = Math.sin(t * 3) * 14;
      c.beginPath(); c.moveTo(-22, -118 + bob); c.lineTo(-40, -150 + bob + sall); c.stroke();
      c.beginPath(); c.moveTo(22, -118 + bob); c.lineTo(40, -150 + bob - sall); c.stroke();
    }
    c.restore();
  }

  function halayCiz(t, nabiz) {
    const kon = halayKonumlari();
    // Arka sıra önce
    const sirali = kon.slice().sort((a, b) => a.y - b.y);
    // El ele çizgileri (aynı sıradaki komşular)
    c.strokeStyle = "rgba(255,255,255,0.35)"; c.lineWidth = 5;
    for (let i = 1; i < kon.length; i++) {
      if ((i < 11) !== (i - 1 < 11)) continue;
      const a = S.kisiler.get(kon[i - 1].id), b = S.kisiler.get(kon[i].id);
      c.beginPath(); c.moveTo(a.cx + 40 * a.olcek, a.cy - 126 * a.olcek - nabiz * 10); c.lineTo(b.cx - 40 * b.olcek, b.cy - 126 * b.olcek - nabiz * 10); c.stroke();
    }
    for (const p of sirali) {
      const k = S.kisiler.get(p.id);
      const s = (k.olcek || 1) * (p.id === S.halayBasi ? 1.18 : 1);
      insan(k, k.cx, k.cy, s, t, nabiz, "halay");
      const bx = k.cx, by = k.cy - 160 * s - nabiz * 10 * s;
      const altin = k.puanTur > 0;
      avatar(k, bx, by, 32 * s, p.id === S.dugunSahibi ? "#ffd700" : altin ? "#ffd54a" : k.nisanli ? "#ff80ab" : "#fff", altin ? 6 : 4);
      if (p.id === S.dugunSahibi) yazi("👑", bx, by - 48 * s, 40 * s, "#fff", "center", 800, 0);
      if (p.id === S.halayBasi) {
        // Mendil
        const sal = Math.sin(t * 9) * 0.6;
        c.save(); c.translate(k.cx - 50 * s, k.cy - 140 * s); c.rotate(-0.8 + sal);
        c.fillStyle = "#e53935"; c.fillRect(-4, -46, 30, 30); c.restore();
        yazi("HALAY BAŞI", k.cx, k.cy + 22, 20, "#ff8a80", "center", 800, 4);
      }
      if (k.nisanli && p.id !== S.halayBasi) yazi("💍", bx + 30 * s, by - 26 * s, 22, "#fff", "center", 800, 0);
      yazi(kisaAd(k, 13), k.cx, k.cy + (p.id === S.halayBasi ? 46 : 22), 22 * Math.max(0.85, s), altin ? "#ffd54a" : "#fff", "center", 800, 5);
      // Yorum balonu
      if (k.balon && simdi() < k.balon.bitis) balonCiz(k.balon.metin, bx, by - 50 * s);
    }
  }

  function balonCiz(metin, x, y) {
    c.font = `700 24px ${FONT}`;
    const w = Math.min(380, c.measureText(metin).width + 30), h = 44;
    const bx = sinirla(x - w / 2, 10, W - w - 10);
    yuvarlak(bx, y - h, w, h, 16); c.fillStyle = "rgba(255,255,255,0.95)"; c.fill();
    c.beginPath(); c.moveTo(x - 10, y); c.lineTo(x + 10, y); c.lineTo(x, y + 12); c.fill();
    yazi(metin, bx + w / 2, y - h / 2, 24, "#3b0a3f", "center", 700, 0, w - 20);
  }

  function sahne(t, nabiz) {
    // Çiçekli kemer
    c.save();
    c.lineWidth = 26; c.strokeStyle = "rgba(255,255,255,0.12)";
    c.beginPath(); c.arc(540, 1040, 270, Math.PI, 0); c.stroke();
    for (let i = 0; i <= 18; i++) {
      const a = Math.PI + (i / 18) * Math.PI;
      const x = 540 + Math.cos(a) * 270, y = 1040 + Math.sin(a) * 270;
      c.beginPath(); c.arc(x, y, 18 + (i % 2) * 6 + nabiz * 3, 0, Math.PI * 2);
      c.fillStyle = ["#f8bbd0", "#fff", "#f48fb1", "#ffcdd2"][i % 4]; c.fill();
    }
    c.restore();
    // Sahne zemini
    c.fillStyle = "rgba(255,255,255,0.08)";
    c.beginPath(); c.ellipse(540, 1080, 330, 50, 0, 0, Math.PI * 2); c.fill();

    const cf = S.cift;
    const g = cf ? S.kisiler.get(cf.gelin) : null, d = cf ? S.kisiler.get(cf.damat) : null;
    const dansSov = S.sov && S.sov.tip === "dans";
    let gx = 455, dx = 625;
    if (dansSov) { const a = (t - S.sov.bas) * 2.4; gx = 540 + Math.cos(a) * 90; dx = 540 - Math.cos(a) * 90; }
    insan(g, gx, 1075, 1.25, t, nabiz, "gelin");
    insan(d, dx, 1075, 1.25, t, nabiz, "damat");
    // Kafalar
    const hy = 1075 - 195 - nabiz * 12;
    if (cf) {
      avatar(g, gx, hy, 52, "#fff", 6); avatar(d, dx, hy, 52, "#1c1c2e", 6);
      // Duvak
      c.fillStyle = "rgba(255,255,255,0.55)";
      c.beginPath(); c.moveTo(gx - 50, hy - 30); c.quadraticCurveTo(gx, hy - 85, gx + 50, hy - 30); c.lineTo(gx + 70, hy + 90); c.lineTo(gx - 70, hy + 90); c.closePath(); c.fill();
      avatar(g, gx, hy, 52, "#fff", 6);
      yazi("👑", gx, hy - 62, 36, "#fff", "center", 800, 0);
      yazi("🎩", dx, hy - 62, 38, "#fff", "center", 800, 0);
      // Takı kurdeleleri
      kurdele(gx, 960 - nabiz * 12, cf.takilar.filter(x => x.hedef === "g"));
      kurdele(dx, 960 - nabiz * 12, cf.takilar.filter(x => x.hedef === "d"));
      yazi(`👰 ${kisaAd(g, 14)}`, 300, 720, 30, "#fff", "center", 800, 5, 260);
      yazi(`🤵 ${kisaAd(d, 14)}`, 680, 720, 30, "#fff", "center", 800, 5, 260);
      yazi(`💍 Takılan: ${sayi(cf.toplam)} coin`, 540, 1118, 28, "#ffd54a", "center", 800, 5);
    } else {
      [gx, dx].forEach(x => { c.beginPath(); c.arc(x, hy, 52, 0, Math.PI * 2); c.fillStyle = "rgba(255,255,255,0.15)"; c.fill(); yazi("?", x, hy, 60, "#fff", "center", 800, 4); });
      yazi("Gelin & Damat aranıyor!", 540, 720, 34, "#fff", "center", 800, 6);
      yazi("💘 \"bekar\" yaz → SEN OL!", 540, 1118, 32, "#ff80ab", "center", 800, 6);
    }
  }

  function kurdele(x, y, takilar) {
    c.save(); c.translate(x, y); c.rotate(-0.5);
    c.fillStyle = "#c62828"; c.fillRect(-60, -9, 120, 18);
    const n = takilar.length, gosterilen = Math.min(n, 9);
    for (let i = 0; i < gosterilen; i++) altinCiz(-48 + i * 12, 0, 13, takilar[n - 1 - i].renk);
    c.restore();
    if (n > 9) yazi(`+${n - 9}`, x + 60, y - 30, 24, "#ffd54a", "center", 800, 4);
  }

  function orgcu(t, nabiz) {
    const x = 145, y = 1205;
    // Org standı
    insan({ ton: 30, sira: 0 }, x, y - 20, 1.05, t, nabiz * 0.5, "orgcu");
    c.beginPath(); c.arc(x, y - 175 - nabiz * 5, 34, 0, Math.PI * 2); c.fillStyle = "#ffcc80"; c.fill();
    c.fillStyle = "#3e2723"; c.beginPath(); c.arc(x, y - 185, 34, Math.PI, 0); c.fill();
    c.fillStyle = "#111"; c.fillRect(x - 12, y - 182, 8, 5); c.fillRect(x + 4, y - 182, 8, 5);
    c.fillStyle = "#3e2723"; c.fillRect(x - 14, y - 162, 28, 5); // bıyık
    // Klavye
    c.fillStyle = "#212121"; yuvarlak(x - 105, y - 100, 210, 34, 6); c.fill();
    for (let i = 0; i < 16; i++) {
      const bas = Math.sin(t * 13 + i * 1.7) > 0.7;
      c.fillStyle = bas ? "#b388ff" : "#fff"; c.fillRect(x - 98 + i * 12.4, y - 95, 10.5, 24);
    }
    c.fillStyle = "#424242"; c.fillRect(x - 60, y - 66, 10, 66); c.fillRect(x + 50, y - 66, 10, 66);
    // Notalar
    for (let i = 0; i < 3; i++) {
      const f = ((t * 0.6 + i / 3) % 1);
      c.globalAlpha = 1 - f;
      yazi(i % 2 ? "♪" : "♫", x - 40 + i * 40 + Math.sin(f * 6 + i) * 15, y - 230 - f * 160, 42, "#e1bee7", "center", 800, 0);
    }
    c.globalAlpha = 1;
    yazi("🎹 ORGCU", x, y + 22, 24, "#e1bee7", "center", 800, 4);
  }

  function bekarKutusu(t) {
    const x = 830, y = 680, w = 225, h = 520;
    panel(x, y, w, h, "rgba(80,10,50,0.7)", "rgba(255,128,171,0.7)");
    yazi("💘 BEKARLAR", x + w / 2, y + 30, 26, "#ff80ab", "center", 800, 4);
    const liste = S.bekarlar.slice(-5);
    if (!liste.length) yazi("\"bekar\" yaz", x + w / 2, y + 80, 22, "#fff", "center", 700, 3);
    liste.forEach((b, i) => {
      const k = S.kisiler.get(b.id); const ry = y + 76 + i * 46;
      avatar(k, x + 30, ry, 18, b.cins === "k" ? "#ff80ab" : b.cins === "e" ? "#40c4ff" : "#fff", 3);
      yazi(kisaAd(k, 10), x + 56, ry, 20, "#fff", "left", 700, 3, w - 66);
    });
    yazi("💍 SIRADAKİ ÇİFTLER", x + w / 2, y + 330, 21, "#ffd54a", "center", 800, 4);
    const sira = S.ciftSirasi.slice(0, 3);
    if (!sira.length) yazi("—", x + w / 2, y + 375, 22, "#fff", "center", 700, 3);
    sira.forEach((p, i) => {
      const a = S.kisiler.get(p.gelin), b = S.kisiler.get(p.damat), ry = y + 375 + i * 46;
      avatar(a, x + 32, ry, 18, "#ff80ab", 3); avatar(b, x + 62, ry, 18, "#40c4ff", 3);
      yazi(`${(a.ad || "").slice(0, 6)}❤${(b.ad || "").slice(0, 6)}`, x + 86, ry, 17, "#fff", "left", 700, 3, w - 92);
    });
  }

  function hedefCubugu(t, nabiz) {
    const x = 30, y = 1250, w = W - 60, h = 58;
    panel(x, y, w, h, "rgba(30,5,30,0.8)", "#ffd54a");
    const oran = sinirla(S.takiToplam / S.takiHedef, 0, 1);
    yuvarlak(x + 6, y + 6, (w - 12) * oran, h - 12, 20);
    const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, "#ff6f00"); g.addColorStop(1, "#ffd54a");
    c.fillStyle = g; c.fill();
    yazi(`💍 TAKI HEDEFİ ${sayi(S.takiToplam)}/${sayi(S.takiHedef)} → GELİN-DAMAT ÖZEL DANSI!`, W / 2, y + h / 2 + 2, 28, "#fff", "center", 800, 5, w - 30);
    // Coşku
    const cosku = sinirla(S.coskuHam / A.coskuIcinBegeni, 0, 1);
    yuvarlak(x, y + h + 10, w, 26, 13); c.fillStyle = "rgba(30,5,30,0.7)"; c.fill();
    yuvarlak(x, y + h + 10, Math.max(26, w * cosku), 26, 13); c.fillStyle = `rgba(255,64,129,${0.6 + nabiz * 0.4})`; c.fill();
    yazi(`❤️ COŞKU %${Math.round(cosku * 100)} — beğen, halay hızlansın!`, W / 2, y + h + 23, 20, "#fff", "center", 800, 4);
  }

  // ------------------------------------------------------------
  //  ÇİZİM — EFEKTLER & ŞOVLAR
  // ------------------------------------------------------------
  function parcaciklarCiz() {
    for (const p of S.parcaciklar) {
      const a = 1 - p.yas / p.omur;
      c.globalAlpha = Math.min(1, a * 2);
      if (p.tip === "kalp") kalpCiz(p.x, p.y, p.boyut, p.renk);
      else if (p.tip === "gul") { yazi("🌹", p.x, p.y, p.boyut * 1.4, "#fff", "center", 400, 0); }
      else if (p.tip === "nazar") nazarCiz(p.x, p.y, p.boyut);
      else if (p.tip === "konfeti") { c.save(); c.translate(p.x, p.y); c.rotate(p.aci); c.fillStyle = p.renk; c.fillRect(-p.boyut / 2, -p.boyut / 4, p.boyut, p.boyut / 2); c.restore(); }
      else { c.beginPath(); c.arc(p.x, p.y, p.boyut * a + 1, 0, Math.PI * 2); c.fillStyle = p.renk; c.fill(); }
    }
    c.globalAlpha = 1;
  }

  function ucanAltinlarCiz() {
    for (const a of S.ucanAltinlar) {
      if (a.yas < 0) continue;
      const u = sinirla(a.yas / a.sure, 0, 1);
      const h = altinHedefKonumu(a.hedef);
      const e = 1 - Math.pow(1 - u, 2);
      const x = a.x + (h.x - a.x) * e, y = a.y + (h.y - a.y) * e - Math.sin(u * Math.PI) * 260;
      altinCiz(x, y, 26 + Math.sin(u * Math.PI) * 14, a.ta.renk);
    }
  }

  function kombolarCiz() {
    const t = simdi();
    for (const v of S.kombolar.values()) {
      if (v.sayi < 2) continue;
      const k = S.kisiler.get(v.kisi);
      const p = 1 + Math.max(0, 0.4 - (t - v.vurus)) * 1.2;
      yazi(`${v.emoji} x${v.sayi}`, k.cx + 60, k.cy - 230, 40 * p, "#ffeb3b", "center", 800, 7);
    }
  }

  function anonsCiz(t) {
    if (!S.anons) return;
    const g = t - S.anons.bas;
    const giris = Math.min(1, g / 0.25);
    const y = 1190;
    c.globalAlpha = giris;
    panel(40 + (1 - giris) * 200, y - 38, W - 80, 76, "rgba(0,0,0,0.78)", S.anons.renk);
    yazi(S.anons.metin, W / 2 + (1 - giris) * 200, y, 32, S.anons.renk, "center", 800, 5, W - 120);
    c.globalAlpha = 1;
  }

  function kismetCiz(t) {
    const m = S.kismet; if (!m) return;
    const g = t - m.bas;
    const a = S.kisiler.get(m.a), b = S.kisiler.get(m.b);
    const giris = Math.min(1, g / 0.8), cikis = g > 3.6 ? (g - 3.6) / 0.6 : 0;
    c.globalAlpha = 1 - cikis;
    c.fillStyle = "rgba(60,0,30,0.6)"; c.fillRect(0, 640, W, 620);
    const e = 1 - Math.pow(1 - giris, 3);
    const ax = -150 + (390 + 150) * e, bx = W + 150 - (W + 150 - 690) * e;
    avatar(a, ax, 870, 105, "#ff80ab", 10);
    avatar(b, bx, 870, 105, "#40c4ff", 10);
    if (giris >= 1) {
      const p = 1 + Math.sin(g * 10) * 0.08;
      kalpCiz(540, 875, 90 * p, "#ff1744");
      if (Math.random() < 0.3) parcacik({ x: 540 + rnd(-40, 40), y: 900, vx: rnd(-200, 200), vy: rnd(-400, -150), tip: "kalp", renk: "#ff80ab", boyut: rnd(14, 26), omur: 1.5, yerc: 300 });
    }
    yazi("💘 KISMET! 💘", 540, 720, 76, "#ff80ab", "center", 800, 9);
    yazi(`${kisaAd(a, 14)}  ❤  ${kisaAd(b, 14)}`, 540, 1020, 40, "#fff", "center", 800, 7, W - 60);
    yazi("Birbirinizin profiline bakın 😉", 540, 1068, 32, "#ffd54a", "center", 800, 6);
    yazi("Sıradaki GELİN-DAMAT siz olabilirsiniz!", 540, 1110, 28, "#f8bbd0", "center", 700, 5);
    c.globalAlpha = 1;
  }

  function sovCiz(t, nabiz) {
    const s = S.sov; if (!s) return;
    const g = t - s.bas, kalan = s.sure - g;
    const alfa = Math.min(1, g / 0.4, kalan / 0.5);
    c.globalAlpha = Math.max(0, alfa);
    if (s.tip === "pasta") {
      const k = S.kisiler.get(s.kisi);
      c.fillStyle = "rgba(20,0,20,0.6)"; c.fillRect(0, 0, W, H);
      const yuk = Math.min(1, g / 1.5);
      const by = 1500 - yuk * 420;
      // 3 katlı pasta
      [[300, 120, "#fce4ec"], [230, 110, "#f8bbd0"], [160, 100, "#fff"]].forEach(([w, h, renk], i) => {
        const y = by - i * 105;
        yuvarlak(540 - w / 2, y - h, w, h, 18); c.fillStyle = renk; c.fill();
        c.fillStyle = "#ec407a"; for (let j = 0; j < 8; j++) { c.beginPath(); c.arc(540 - w / 2 + 18 + j * (w - 36) / 7, y - h, 10, 0, Math.PI); c.fill(); }
      });
      yazi("💑", 540, by - 360, 70, "#fff", "center", 400, 0);
      if (g > 2.5) {
        // Bıçak kesimi
        c.save(); c.translate(600, by - 300); c.rotate(0.5 + Math.min(1, (g - 2.5) * 2) * 0.6);
        c.fillStyle = "#cfd8dc"; c.fillRect(0, -6, 150, 12); c.fillStyle = "#6d4c41"; c.fillRect(-50, -9, 50, 18); c.restore();
      }
      avatar(k, 540, 560, 120, "#ffd54a", 10);
      yazi("🎂 DEV PASTA KESİMİ! 🎂", 540, 380, 70, "#ffd54a", "center", 800, 9);
      yazi(`${kisaAd(k, 18)} ikram etti!`, 540, 720, 54, "#fff", "center", 800, 8);
      if (S.cift) yazi(`Gelin & damat pastayı kesiyor 🔪`, 540, 1600, 36, "#f8bbd0", "center", 800, 6);
    } else if (s.tip === "efsane") {
      const k = S.kisiler.get(s.kisi);
      const ton = (t * 120) % 360;
      const gr = c.createRadialGradient(540, 900, 50, 540, 900, 1100);
      gr.addColorStop(0, `hsla(${ton},90%,40%,0.85)`); gr.addColorStop(1, "rgba(10,0,10,0.92)");
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // Işın
      c.save(); c.translate(540, 820); c.rotate(t * 0.6);
      for (let i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.fillStyle = `rgba(255,215,0,${0.08 + nabiz * 0.06})`; c.beginPath(); c.moveTo(0, 0); c.lineTo(-80, -1200); c.lineTo(80, -1200); c.fill(); }
      c.restore();
      const p = 1 + nabiz * 0.12;
      avatar(k, 540, 820, 170 * p, "#ffd700", 14);
      yazi("👑", 540, 820 - 210 * p, 120, "#fff", "center", 800, 0);
      yazi("🥁 DAVUL - ZURNA! 🎺", 540, 330, 84, "#fff", "center", 800, 10);
      yazi("DÜĞÜN SAHİBİ", 540, 1080, 80, "#ffd700", "center", 800, 10);
      yazi(kisaAd(k, 20), 540, 1170, 66, "#fff", "center", 800, 9);
      yazi(`${sayi(s.coin)} coin • MAŞALLAH!`, 540, 1250, 44, "#ffd54a", "center", 800, 7);
      // Davulcu & zurnacı
      [[200, "🥁"], [880, "🎺"]].forEach(([x, e], i) => {
        const z = Math.abs(Math.sin(t * 9 + i)) * 30;
        yazi(e, x, 1520 - z - nabiz * 30, 150, "#fff", "center", 400, 0);
        yazi(i ? "ZURNACI" : "DAVULCU", x, 1640, 34, "#fff", "center", 800, 6);
      });
    } else if (s.tip === "dans") {
      c.fillStyle = "rgba(0,0,0,0.45)"; c.fillRect(0, 0, W, 640); c.fillRect(0, 1240, W, H - 1240);
      const sg = c.createRadialGradient(540, 950, 20, 540, 950, 400);
      sg.addColorStop(0, "rgba(255,255,220,0.35)"); sg.addColorStop(1, "rgba(255,255,220,0)");
      c.fillStyle = sg; c.fillRect(0, 600, W, 700);
      yazi("💃 GELİN-DAMAT ÖZEL DANSI! 🕺", 540, 500, 58, "#ffd54a", "center", 800, 9);
      yazi("Takı hedefi doldu, alkışlar!", 540, 570, 36, "#fff", "center", 800, 6);
    } else if (s.tip === "tursonu") {
      c.fillStyle = "rgba(20,0,25,0.88)"; c.fillRect(0, 0, W, H);
      yazi(`🎊 DÜĞÜN #${s.turNo} BİTTİ! 🎊`, 540, 330, 76, "#ffd54a", "center", 800, 9);
      if (s.cift) {
        const a = S.kisiler.get(s.cift.gelin), b = S.kisiler.get(s.cift.damat);
        avatar(a, 400, 560, 100, "#ff80ab", 8); avatar(b, 680, 560, 100, "#40c4ff", 8);
        kalpCiz(540, 565, 60, "#ff1744");
        yazi(`Mutluluklar ${kisaAd(a, 12)} & ${kisaAd(b, 12)}!`, 540, 710, 42, "#fff", "center", 800, 7, W - 60);
        yazi(`Toplam takı: ${sayi(s.cift.toplam)} coin`, 540, 770, 38, "#ffd54a", "center", 800, 6);
      }
      yazi("🏆 BU DÜĞÜNÜN EN CÖMERTLERİ", 540, 900, 46, "#ffd54a", "center", 800, 7);
      ["🥇", "🥈", "🥉"].forEach((m, i) => {
        const k = S.kisiler.get(s.ilk3[i]); if (!k) return;
        const y = 1010 + i * 140;
        yazi(m, 230, y, 80, "#fff", "center", 400, 0);
        avatar(k, 360, y, 55, "#ffd54a", 6);
        yazi(kisaAd(k, 16), 440, y - 14, 46, "#fff", "left", 800, 7);
        yazi(`${sayi(k.puanTur)} coin`, 440, y + 32, 32, "#ffd54a", "left", 800, 5);
      });
      if (!s.ilk3.length) yazi("Bu düğünde takı takan olmadı 😢", 540, 1050, 38, "#fff", "center", 800, 6);
      const sonraki = S.ciftSirasi[0];
      yazi(sonraki ? "Sıradaki düğün başlıyor… 💒" : "Sıradaki gelin-damat SEN ol: \"bekar\" yaz! 💘", 540, 1520, 38, "#ff80ab", "center", 800, 6, W - 60);
    }
    c.globalAlpha = 1;
  }

  function yazilarCiz() {
    for (const y of S.yazilar) {
      c.globalAlpha = 1 - y.yas / y.omur;
      yazi(y.metin, y.x, y.y, y.boyut, y.renk, "center", 800, 6);
    }
    c.globalAlpha = 1;
  }

  // ------------------------------------------------------------
  //  ANA DÖNGÜ
  // ------------------------------------------------------------
  function ciz() {
    const t = simdi();
    const nabiz = window.Muzik ? Muzik.nabiz() : (Math.sin(t * 6) * 0.5 + 0.5) * 0.4;
    arkaPlan(t, nabiz);
    ustBant(t);
    liderlik(t);
    istekPanosu(t, nabiz);
    sahne(t, nabiz);
    orgcu(t, nabiz);
    bekarKutusu(t);
    hedefCubugu(t, nabiz);
    halayCiz(t, nabiz);
    if (!S.halay.length) yazi("💬 Yorum yaz, halaya ilk SEN katıl!", 540, 1620, 44, "#fff", "center", 800, 7);
    kombolarCiz();
    ucanAltinlarCiz();
    kismetCiz(t);
    anonsCiz(t);
    sovCiz(t, nabiz);
    parcaciklarCiz();
    yazilarCiz();
  }

  function dongu() {
    guncelle(); ciz();
    requestAnimationFrame(dongu);
  }

  turBaslat();
  S.calan.bas = simdi(); S.calan.bitis = simdi() + 60;
  listeYukle(); setInterval(listeYukle, 20000);   // klasöre yeni şarkı atarsanız 20 sn'de görünür
  requestAnimationFrame(dongu);

  window.Oyun = {
    olay,
    durum: S,
    turuBitir: () => { S.turBitis = 0; },
    sarkiAtla: () => sarkiDegistir(),
    komut, durumOzeti, eslestir,
    sifirla: () => location.reload(),
  };
})();
