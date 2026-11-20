// ============================================================
//  CANLI DÜĞÜN — KARAKTER ÇİZİMİ
//  Her izleyici bir "düğün tipi" olarak gelir: teyze, amca, dayı...
//  Yüz ifadeleri + dans hareketleri burada.
//  Koordinatlar: ayaklar (0,0), kafa merkezi (0,-150), ölçek 1 ≈ 190px boy
// ============================================================
(function () {
  const PI = Math.PI, TAM = PI * 2;
  const TENLER = ["#f8d5b8", "#efc39e", "#e3b08a", "#c98e63", "#f3c7a2", "#dba27a"];

  // İzleyici tipleri
  const ARKETIPLER = {
    teyze:  { cins: "k", govde: "uzun",   esya: "canta",   unvanlar: ["Dedikoducu Teyze", "Zılgıtçı Teyze", "Görücü Teyze", "Takı Sayan Teyze"] },
    amca:   { cins: "e", govde: "yelek",  esya: "tespih",  unvanlar: ["Göbek Atan Amca", "Tespihçi Amca", "Mikrofonu Bırakmayan Amca", "Halay Delisi Amca"] },
    kuzenE: { cins: "e", govde: "gomlek", esya: null,      unvanlar: ["Maganda Kuzen", "Breakdanscı Kuzen", "Gömleği Açık Kuzen", "Pistin Yıldızı Kuzen"] },
    kuzenK: { cins: "k", govde: "kisa",   esya: "telefon", unvanlar: ["Story Çeken Kuzen", "Selfie Delisi Kuzen", "Gelini Kıskanan Kuzen", "Fenomen Kuzen"] },
    cocuk:  { cins: null, govde: "tisort", esya: "lolipop", olcek: 0.78, unvanlar: ["Pastaya Saldıran Çocuk", "Pistte Kayan Çocuk", "Şekerci Çocuk", "Hiç Durmayan Çocuk"] },
    dayi:   { cins: "e", govde: "takim",  esya: null,      unvanlar: ["Kravatı Kafasında Dayı", "Bekar Dayı", "Pistin Kralı Dayı", "Para Saçan Dayı"] },
    nine:   { cins: "k", govde: "uzun",   esya: "baston",  unvanlar: ["Bastonla Oynayan Nine", "Herkesi Öpen Nine", "Ben Gençken Nine", "Çeyiz Sayan Nine"] },
    abla:   { cins: "k", govde: "uzun",   esya: "yelpaze", unvanlar: ["Abartılı Makyaj Abla", "Her Şarkıyı Bilen Abla", "Yelpazeli Abla", "Topuklusu Kırılan Abla"] },
  };
  // Sahnedeki sabit karakterler
  const ROLLER = {
    gelin:   { govde: "gelinlik" },
    damat:   { govde: "takim", ceket: "#1b1b28" },
    kaynana: { govde: "uzun", elbise: "#7b3f8c" },
    memur:   { govde: "takim", ceket: "#5d6470" },
    kardes:  { govde: "esofman" },
    orgcu:   { govde: "takim", ceket: "#6a1b9a", pul: true },
    davulcu: { govde: "yoresel" },
    zurnaci: { govde: "yoresel" },
  };
  const tip = (ad) => ARKETIPLER[ad] || ROLLER[ad] || ARKETIPLER.amca;

  // ------------------------------------------------------------
  //  POZLAR — açılar: 0 = aşağı sarkık, PI = yukarı, + = dışa doğru
  // ------------------------------------------------------------
  function poz(hareket, vurus, t, tohum, yon) {
    const p = ((vurus % 1) + 1) % 1;
    const yan = Math.floor(vurus) % 2 ? 1 : -1;
    const vurgu = Math.pow(1 - p, 3);
    const z = { y: 0, rot: 0, hx: 0, kL: [0.22, 0.12], kR: [0.22, 0.12], bL: 0.06, bR: 0.06, kafa: 0, tum: 0, pivot: 0, sx: 1 };
    const sal = Math.sin(t * 2 + tohum) ;
    switch (hareket) {
      case "dur":
        z.y = -vurgu * 4; z.rot = sal * 0.04; z.kafa = sal * 0.05;
        z.kL = [0.45, -1.75 - vurgu * 0.35]; z.kR = [0.45, -1.75 - vurgu * 0.35];   // alkış
        break;
      case "halay":
        z.y = -Math.abs(Math.sin(PI * p)) * 7;
        z.bR = yan > 0 ? 0.1 + vurgu * 0.85 : 0.05; z.bL = yan < 0 ? 0.1 + vurgu * 0.85 : 0.05;
        z.kL = [1.35, 1.95 + Math.sin(t * 9) * 0.06]; z.kR = [1.35, 1.95 + Math.sin(t * 9 + 1) * 0.06];
        z.hx = Math.sin(t * 22) * 1.6; z.kafa = Math.sin(t * 4 + tohum) * 0.08;
        break;
      case "zipla":
        z.y = -Math.sin(PI * p) * 48; z.kL = [2.75, 3.05]; z.kR = [2.75, 3.05];
        z.bL = 0.15 + Math.sin(PI * p) * 0.35; z.bR = z.bL;
        break;
      case "gobek":
        z.hx = Math.sin(TAM * p) * 15; z.rot = -Math.sin(TAM * p) * 0.08; z.y = -vurgu * 3;
        z.kL = [2.45 + Math.sin(t * 4) * 0.2, 3.3 + Math.sin(t * 4 + 1) * 0.35];
        z.kR = [2.45 + Math.sin(t * 4 + PI) * 0.2, 3.3 + Math.sin(t * 4 + PI + 1) * 0.35];
        break;
      case "omuz":
        z.rot = Math.sin(t * 42) * 0.07; z.y = -vurgu * 5; z.hx = Math.sin(t * 42) * 2;
        z.kL = [0.6, -1.45 + Math.sin(t * 42) * 0.18]; z.kR = [0.6, -1.45 - Math.sin(t * 42) * 0.18];
        break;
      case "dondu":
        z.sx = Math.cos(t * 8 + tohum); z.kL = [1.55, 1.75]; z.kR = [1.55, 1.75]; z.y = -vurgu * 7;
        break;
      case "kollar": {
        const s = Math.sin(PI * vurus / 1);
        z.kL = [2.6 + s * 0.3, 2.95 + s * 0.45]; z.kR = [2.6 - s * 0.3, 2.95 - s * 0.45];
        z.rot = s * 0.1; z.hx = s * 8; z.y = -vurgu * 4;
        break;
      }
      case "kasik":
        z.y = -vurgu * 7; z.kL = [0.95, -0.85 + vurgu * 0.7]; z.kR = [0.95, -0.85 + vurgu * 0.7];
        z.bR = yan > 0 ? vurgu * 0.5 : 0.05; z.bL = yan < 0 ? vurgu * 0.5 : 0.05;
        break;
      case "break":
        z.tum = PI + t * 9; z.pivot = -150; z.y = 116;
        z.bL = 0.75 + Math.sin(t * 9) * 0.3; z.bR = 0.75 - Math.sin(t * 9) * 0.3;
        z.kL = [1.1, 0.9]; z.kR = [1.1, 0.9];
        break;
      case "cilgin":
        z.kL = [1.5 + Math.sin(t * 13 + tohum) * 1.4, 1 + Math.cos(t * 11 + tohum) * 2];
        z.kR = [1.5 + Math.cos(t * 12 + tohum) * 1.4, 1 + Math.sin(t * 14 + tohum) * 2];
        z.bL = Math.abs(Math.sin(t * 9 + tohum)) * 0.8; z.bR = Math.abs(Math.cos(t * 10 + tohum)) * 0.8;
        z.rot = Math.sin(t * 12 + tohum) * 0.22; z.kafa = Math.sin(t * 15) * 0.5;
        z.y = -Math.abs(Math.sin(t * 10 + tohum)) * 22;
        break;
      case "dusme":
        z.tum = PI / 2; z.pivot = 0; z.y = -16; z.kL = [1.6, 1.6]; z.kR = [2.2, 2.6]; z.bL = 0.3; z.bR = 0.6;
        break;
      case "alkis":
        z.y = -vurgu * 5; z.kL = [2.55, -2.55 + vurgu * 0.35]; z.kR = [2.55, -2.55 + vurgu * 0.35];
        break;
      case "egilme":
        z.rot = 0.55; z.y = 4; z.kL = [0.05, 0.05]; z.kR = [0.05, 0.05]; z.kafa = 0.3;
        break;
      case "itme":
        z.rot = 0.32; z.y = Math.sin(t * 30) * 2; z.kR = [1.55, 1.5]; z.kL = [-1.35, -1.5];
        z.bL = -0.35; z.bR = 0.45;
        break;
      case "capraz":
        z.kL = [0.55, -1.95]; z.kR = [0.55, -2.1]; z.rot = sal * 0.03;
        break;
      case "elUzat":
        z.kL = [0.5, -1.9]; z.kR = [1.05, 1.5 + Math.sin(t * 6) * 0.1]; z.rot = -0.05;
        break;
      case "dusunme":
        z.kR = [0.55, -2.55]; z.kL = [0.5, -1.7]; z.kafa = 0.18; z.rot = sal * 0.03;
        break;
      case "konusma":
        z.kR = [1.0 + Math.sin(t * 5) * 0.35, 2.1 + Math.sin(t * 6) * 0.4]; z.kL = [0.3, 0.2]; z.kafa = Math.sin(t * 3) * 0.08;
        break;
      case "selam":
        z.kR = [2.75, 3.2 + Math.sin(t * 11) * 0.45]; z.kL = [0.25, 0.1]; z.y = -vurgu * 3;
        break;
      case "agla":
        z.kL = [2.8, -2.55]; z.kR = [2.8, -2.55]; z.kafa = Math.sin(t * 9) * 0.06; z.y = Math.sin(t * 9) * 1.5;
        break;
      case "sallan":
        z.rot = Math.sin(t * 2.2) * 0.07; z.hx = Math.sin(t * 2.2) * 6; z.kL = [0.9, 1.2]; z.kR = [0.9, 1.2];
        break;
      case "zafer":
        z.y = -Math.abs(Math.sin(t * 6)) * 18; z.kL = [2.8, 3.0]; z.kR = [2.8, 3.0];
        break;
      case "davul":
        z.kR = [1.0, 2.4 - vurgu * 1.5]; z.kL = [0.8, -0.9]; z.y = -vurgu * 4;
        break;
      case "zurna":
        z.kL = [0.35, -2.55]; z.kR = [0.35, -2.4]; z.rot = Math.sin(t * 3) * 0.08; z.y = -vurgu * 3;
        break;
      case "org":
        z.kL = [0.35, -0.9 + Math.sin(t * 15) * 0.15]; z.kR = [0.35, -0.9 + Math.cos(t * 13) * 0.15]; z.rot = Math.sin(t * 3) * 0.06;
        break;
      default:
        z.y = -vurgu * 3; z.rot = sal * 0.03;
    }
    return z;
  }

  // ------------------------------------------------------------
  //  PARÇALAR
  // ------------------------------------------------------------
  function kol(c, sd, a1, a2, kolRenk, ten, kisaKol) {
    const ox = sd * 20, oy = -106;
    const ex = ox + sd * Math.sin(a1) * 26, ey = oy + Math.cos(a1) * 26;
    const hx = ex + sd * Math.sin(a2) * 24, hy = ey + Math.cos(a2) * 24;
    c.lineCap = "round"; c.lineJoin = "round";
    c.lineWidth = 10;
    c.strokeStyle = kolRenk;
    c.beginPath(); c.moveTo(ox, oy); c.lineTo(ex, ey); if (!kisaKol) c.lineTo(hx, hy); c.stroke();
    if (kisaKol) { c.strokeStyle = ten; c.lineWidth = 8; c.beginPath(); c.moveTo(ex, ey); c.lineTo(hx, hy); c.stroke(); }
    c.fillStyle = ten; c.beginPath(); c.arc(hx, hy, 6, 0, TAM); c.fill();
    return [hx, hy, a2];
  }

  function bacak(c, sd, kalcaX, a, renk, ten, ayakkabi, kisa) {
    const x0 = kalcaX + sd * 9, y0 = -52;
    const x1 = x0 + sd * Math.sin(a) * 50, y1 = y0 + Math.cos(a) * 50;
    c.lineCap = "round"; c.lineWidth = 12;
    if (kisa) {
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
      c.strokeStyle = renk; c.beginPath(); c.moveTo(x0, y0); c.lineTo(mx, my); c.stroke();
      c.strokeStyle = ten; c.lineWidth = 9; c.beginPath(); c.moveTo(mx, my); c.lineTo(x1, y1); c.stroke();
    } else {
      c.strokeStyle = renk; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    }
    c.fillStyle = ayakkabi; c.beginPath(); c.ellipse(x1 + sd * 4, y1 + 1, 10, 5.5, 0, 0, TAM); c.fill();
  }

  function yuvarlakDik(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  // ------------------------------------------------------------
  //  YÜZ
  // ------------------------------------------------------------
  function goz(c, x, y, r, bakX, bakY) {
    c.fillStyle = "#fff"; c.beginPath(); c.ellipse(x, y, r, r * 1.15, 0, 0, TAM); c.fill();
    c.fillStyle = "#2b1b17"; c.beginPath(); c.arc(x + bakX, y + bakY, r * 0.55, 0, TAM); c.fill();
    c.fillStyle = "#fff"; c.beginPath(); c.arc(x + bakX + r * 0.2, y + bakY - r * 0.25, r * 0.18, 0, TAM); c.fill();
  }

  function kalpSekli(c, x, y, s, renk) {
    c.save(); c.translate(x, y); c.scale(s / 30, s / 30);
    c.beginPath(); c.moveTo(0, 10);
    c.bezierCurveTo(-30, -12, -12, -32, 0, -16); c.bezierCurveTo(12, -32, 30, -12, 0, 10);
    c.fillStyle = renk; c.fill(); c.restore();
  }

  function yuz(c, ifade, t, tohum, konusuyor, kadin, ten) {
    const kirp = ((t + tohum * 7.3) % 4.2) < 0.13;
    const bakX = Math.sin(t * 0.7 + tohum) * 1.5, bakY = 0.5;
    c.lineCap = "round"; c.lineJoin = "round";
    // Yanaklar
    c.fillStyle = "rgba(255,105,120,0.35)";
    c.beginPath(); c.arc(-19, -2, 6, 0, TAM); c.arc(19, -2, 6, 0, TAM); c.fill();
    const kas = (x1, y1, x2, y2) => { c.strokeStyle = "#3e2723"; c.lineWidth = 3; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); };
    const agizAcik = (w, h, y = 12) => {
      c.fillStyle = "#7b1f2a"; c.beginPath(); c.moveTo(-w, y); c.quadraticCurveTo(0, y + h * 2, w, y); c.closePath(); c.fill();
      c.fillStyle = "#ff8a80"; c.beginPath(); c.ellipse(0, y + h * 0.75, w * 0.45, h * 0.35, 0, 0, TAM); c.fill();
    };
    const gulumse = () => { c.strokeStyle = "#7b1f2a"; c.lineWidth = 3; c.beginPath(); c.arc(0, 6, 10, 0.25 * PI, 0.75 * PI); c.stroke(); };
    const mutluGoz = (y = -6) => { c.strokeStyle = "#2b1b17"; c.lineWidth = 3.5; c.beginPath(); c.arc(-12, y + 3, 6, PI * 1.1, PI * 1.9); c.stroke(); c.beginPath(); c.arc(12, y + 3, 6, PI * 1.1, PI * 1.9); c.stroke(); };
    const kirpikler = () => { if (!kadin) return; c.strokeStyle = "#2b1b17"; c.lineWidth = 2; [-1, 1].forEach(sd => { c.beginPath(); c.moveTo(sd * 17, -10); c.lineTo(sd * 21, -14); c.stroke(); }); };

    switch (ifade) {
      case "mutlu": case "coskulu":
        mutluGoz(); agizAcik(ifade === "coskulu" ? 13 : 10, ifade === "coskulu" ? 10 : 7); break;
      case "kalp":
        kalpSekli(c, -12, -4, 15, "#ff1744"); kalpSekli(c, 12, -4, 15, "#ff1744"); agizAcik(10, 7); break;
      case "sok":
        goz(c, -12, -6, 8, 0, 0); goz(c, 12, -6, 8, 0, 0);
        kas(-18, -19, -7, -21); kas(7, -21, 18, -19);
        c.fillStyle = "#5d1a22"; c.beginPath(); c.ellipse(0, 14, 6, 9, 0, 0, TAM); c.fill(); break;
      case "aglama": {
        c.strokeStyle = "#2b1b17"; c.lineWidth = 3.5;
        c.beginPath(); c.arc(-12, -9, 6, PI * 0.15, PI * 0.85); c.stroke(); c.beginPath(); c.arc(12, -9, 6, PI * 0.15, PI * 0.85); c.stroke();
        kas(-18, -16, -7, -19); kas(7, -19, 18, -16);
        c.fillStyle = "rgba(100,181,246,0.9)";
        for (let i = 0; i < 3; i++) { const f = ((t * 1.6 + i / 3) % 1); [-14, 14].forEach(x => { c.beginPath(); c.ellipse(x + (x > 0 ? f * 4 : -f * 4), -2 + f * 26, 3, 4.5, 0, 0, TAM); c.fill(); }); }
        c.fillStyle = "#7b1f2a"; c.beginPath(); c.ellipse(0, 15, 9, 5 + Math.abs(Math.sin(t * 10)) * 3, 0, 0, TAM); c.fill(); break;
      }
      case "baygin":
        c.strokeStyle = "#2b1b17"; c.lineWidth = 3;
        [-12, 12].forEach(x => { c.beginPath(); c.moveTo(x - 5, -11); c.lineTo(x + 5, -1); c.moveTo(x + 5, -11); c.lineTo(x - 5, -1); c.stroke(); });
        c.beginPath(); c.moveTo(-9, 14); c.quadraticCurveTo(-4, 9, 0, 14); c.quadraticCurveTo(4, 19, 9, 14); c.stroke();
        c.fillStyle = "#ff8a80"; c.beginPath(); c.ellipse(4, 19, 4, 6, 0.3, 0, TAM); c.fill(); break;
      case "cilgin":
        [-12, 12].forEach((x, i) => {
          c.fillStyle = "#fff"; c.beginPath(); c.arc(x, -6, 8, 0, TAM); c.fill();
          c.strokeStyle = "#2b1b17"; c.lineWidth = 2; c.beginPath();
          for (let a = 0; a < 12; a += 0.4) { const r = a * 0.6; const aa = a + t * (i ? 9 : -9); c.lineTo(x + Math.cos(aa) * r, -6 + Math.sin(aa) * r); }
          c.stroke();
        });
        agizAcik(14, 10, 10);
        c.fillStyle = "#fff"; c.fillRect(-8, 10, 16, 4); break;
      case "kizgin":
        goz(c, -12, -5, 6, 0, 1); goz(c, 12, -5, 6, 0, 1);
        kas(-19, -17, -6, -12); kas(6, -12, 19, -17);
        c.strokeStyle = "#7b1f2a"; c.lineWidth = 3; c.beginPath(); c.arc(0, 22, 9, 1.2 * PI, 1.8 * PI); c.stroke();
        c.fillStyle = "rgba(255,0,0,0.15)"; c.beginPath(); c.arc(0, 0, 30, 0, TAM); c.fill(); break;
      case "havali":
        c.fillStyle = "#111"; yuvarlakDik(c, -24, -13, 21, 13, 5); c.fill(); yuvarlakDik(c, 3, -13, 21, 13, 5); c.fill();
        c.fillRect(-4, -10, 8, 3);
        c.fillStyle = "rgba(255,255,255,0.35)"; c.fillRect(-20, -11, 6, 3); c.fillRect(7, -11, 6, 3);
        c.strokeStyle = "#7b1f2a"; c.lineWidth = 3; c.beginPath(); c.moveTo(-6, 13); c.quadraticCurveTo(4, 17, 11, 9); c.stroke(); break;
      case "gergin":
        goz(c, -12, -6, 6.5, bakX, 0); goz(c, 12, -6, 6.5, bakX, 0);
        kas(-18, -15, -7, -19); kas(7, -19, 18, -15);
        c.strokeStyle = "#7b1f2a"; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-9, 14);
        for (let i = 0; i <= 6; i++) c.lineTo(-9 + i * 3, 14 + (i % 2 ? -3 : 3)); c.stroke(); break;
      case "dusunceli":
        goz(c, -12, -6, 6.5, -2, -3); goz(c, 12, -6, 6.5, -2, -3);
        kas(-18, -17, -7, -15); kas(7, -19, 18, -21);
        c.strokeStyle = "#7b1f2a"; c.lineWidth = 3; c.beginPath(); c.moveTo(-3, 14); c.lineTo(9, 12); c.stroke(); break;
      case "opucuk":
        c.strokeStyle = "#2b1b17"; c.lineWidth = 3.5; c.beginPath(); c.arc(-12, -3, 6, PI * 1.1, PI * 1.9); c.stroke();
        goz(c, 12, -6, 6.5, 0, 0);
        c.fillStyle = "#e53935"; c.beginPath(); c.ellipse(3, 13, 5, 6, 0, 0, TAM); c.fill(); break;
      default: // normal
        if (kirp) { c.strokeStyle = "#2b1b17"; c.lineWidth = 3; c.beginPath(); c.moveTo(-18, -6); c.lineTo(-6, -6); c.moveTo(6, -6); c.lineTo(18, -6); c.stroke(); }
        else { goz(c, -12, -6, 6.5, bakX, bakY); goz(c, 12, -6, 6.5, bakX, bakY); }
        if (konusuyor) agizAcik(8, 3 + Math.abs(Math.sin(t * 14)) * 6, 10); else gulumse();
    }
    if (["mutlu", "normal", "coskulu", "kalp", "gergin", "dusunceli", undefined].includes(ifade)) kirpikler();
  }

  // ------------------------------------------------------------
  //  SAÇ / ŞAPKA (kafa yerel koordinatı, merkez 0,0)
  // ------------------------------------------------------------
  function sacArka(c, a, renk, t, ek) {
    if (a === "kuzenK") {
      c.fillStyle = renk; c.beginPath(); c.ellipse(0, 6, 38, 44, 0, 0, TAM); c.fill();
      const sal = Math.sin(t * 5) * 8;
      c.beginPath(); c.moveTo(20, -20); c.quadraticCurveTo(52 + sal, 0, 40 + sal, 50); c.quadraticCurveTo(30, 20, 18, -6); c.fill();
    } else if (a === "abla") {
      c.fillStyle = renk;
      for (let i = 0; i < 11; i++) { const aa = PI * 0.85 + (i / 10) * PI * 1.3; c.beginPath(); c.arc(Math.cos(aa) * 36, Math.sin(aa) * 34 + 4, 15, 0, TAM); c.fill(); }
      c.beginPath(); c.arc(-34, 22, 14, 0, TAM); c.arc(34, 22, 14, 0, TAM); c.fill();
    } else if (a === "kaynana") {
      c.fillStyle = "#b39ddb";
      for (let i = 0; i < 9; i++) { const aa = PI * 1.0 + (i / 8) * PI; c.beginPath(); c.arc(Math.cos(aa) * 33, Math.sin(aa) * 36 - 4, 16, 0, TAM); c.fill(); }
    } else if (a === "gelin") {
      c.fillStyle = "#3e2723"; c.beginPath(); c.arc(0, -30, 17, 0, TAM); c.fill();
    } else if (a === "teyze") {
      c.fillStyle = renk; c.beginPath(); c.arc(0, 2, 40, 0, TAM); c.fill();
      c.beginPath(); c.moveTo(-14, 34); c.lineTo(0, 54); c.lineTo(14, 34); c.fill();
    } else if (a === "orgcu") {
      c.fillStyle = "#1a1a1a"; c.beginPath(); c.ellipse(0, 12, 36, 40, 0, 0, TAM); c.fill();
    }
  }

  function sacOn(c, a, renk, t, ek) {
    c.lineCap = "round";
    switch (a) {
      case "teyze": {
        c.fillStyle = renk; c.beginPath(); c.arc(0, -4, 36, PI * 1.08, PI * 1.92); c.lineTo(28, -14); c.quadraticCurveTo(0, -28, -28, -14); c.closePath(); c.fill();
        c.fillStyle = "rgba(255,255,255,0.5)";
        for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-22 + i * 9, -26 + Math.abs(i - 2.5) * 2, 2.2, 0, TAM); c.fill(); }
        break;
      }
      case "nine":
        c.fillStyle = "#e0e0e0"; c.beginPath(); c.arc(0, -36, 13, 0, TAM); c.fill();
        c.beginPath(); c.arc(0, -6, 34, PI * 1.05, PI * 1.95); c.quadraticCurveTo(0, -22, -32, -14); c.fill();
        c.strokeStyle = "#5d4037"; c.lineWidth = 2; c.beginPath(); c.arc(-12, -6, 9, 0, TAM); c.arc(12, -6, 9, 0, TAM); c.stroke();
        break;
      case "amca":
        c.fillStyle = "#9e9e9e"; c.beginPath(); c.arc(-30, -4, 8, 0, TAM); c.arc(30, -4, 8, 0, TAM); c.fill();
        c.fillStyle = "#4e4e56"; c.beginPath(); c.ellipse(0, -26, 36, 14, 0, PI, TAM); c.fill();
        c.beginPath(); c.ellipse(4, -21, 40, 7, 0.05, 0, TAM); c.fill();
        biyik(c, "#5d4037", 1);
        break;
      case "dayi": {
        c.fillStyle = "rgba(255,255,255,0.35)"; c.beginPath(); c.ellipse(-8, -24, 10, 5, -0.4, 0, TAM); c.fill();
        c.fillStyle = "#6d4c41"; c.beginPath(); c.arc(-31, -2, 7, 0, TAM); c.arc(31, -2, 7, 0, TAM); c.fill();
        // Kravat kafada
        c.fillStyle = "#d32f2f"; c.fillRect(-34, -22, 68, 9);
        const s = Math.sin(t * 9) * 8;
        c.beginPath(); c.moveTo(32, -20); c.lineTo(58, -30 + s); c.lineTo(60, -18 + s); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(32, -16); c.lineTo(52, -4 - s); c.lineTo(46, 4 - s); c.closePath(); c.fill();
        biyik(c, "#3e2723", 1.3);
        break;
      }
      case "kuzenE":
        c.fillStyle = "#1a1a1a"; c.beginPath(); c.moveTo(-32, -10);
        for (let i = 0; i <= 8; i++) c.lineTo(-32 + i * 8, i % 2 ? -48 - (i % 3) * 3 : -26);
        c.lineTo(32, -10); c.quadraticCurveTo(0, -24, -32, -10); c.fill();
        break;
      case "kuzenK":
        c.fillStyle = renk; c.beginPath(); c.arc(0, -6, 34, PI * 1.05, PI * 1.95); c.quadraticCurveTo(10, -18, -6, -12); c.quadraticCurveTo(-20, -8, -32, -12); c.fill();
        break;
      case "cocuk":
        c.fillStyle = renk; c.beginPath(); c.arc(0, -10, 32, PI, TAM); c.fill();
        c.fillRect(-38, -14, 22, 8);
        c.fillStyle = "#ffeb3b"; c.beginPath(); c.arc(0, -26, 4, 0, TAM); c.fill();
        break;
      case "abla":
        c.fillStyle = renk; c.beginPath(); c.arc(0, -8, 33, PI * 1.05, PI * 1.95); c.quadraticCurveTo(0, -16, -31, -14); c.fill();
        c.fillStyle = "#e91e63"; c.beginPath(); c.ellipse(0, 13, 6, 3.5, 0, 0, TAM); c.fill();
        break;
      case "gelin": {
        c.fillStyle = "#3e2723"; c.beginPath(); c.arc(0, -6, 34, PI * 1.05, PI * 1.95); c.quadraticCurveTo(0, -20, -32, -12); c.fill();
        c.fillStyle = "#ffd54a";
        c.beginPath(); c.moveTo(-18, -30); for (let i = 0; i <= 6; i++) c.lineTo(-18 + i * 6, i % 2 ? -46 + (i === 3 ? -6 : 0) : -32); c.closePath(); c.fill();
        c.fillStyle = "#e91e63"; c.beginPath(); c.arc(0, -44, 3, 0, TAM); c.fill();
        break;
      }
      case "damat":
        c.fillStyle = "#2b1b17"; c.beginPath(); c.arc(0, -8, 34, PI * 1.02, PI * 1.98); c.quadraticCurveTo(-4, -24, -33, -10); c.fill();
        c.strokeStyle = "rgba(255,255,255,0.25)"; c.lineWidth = 2; c.beginPath(); c.moveTo(-10, -36); c.quadraticCurveTo(4, -40, 16, -34); c.stroke();
        break;
      case "kaynana":
        c.strokeStyle = "#5d4037"; c.lineWidth = 2; c.beginPath(); c.arc(-12, -6, 9, 0, TAM); c.moveTo(21, -6); c.arc(12, -6, 9, 0, TAM); c.stroke();
        c.fillStyle = "#e91e63"; c.beginPath(); c.ellipse(0, 13, 7, 3.5, 0, 0, TAM); c.fill();
        break;
      case "memur":
        c.fillStyle = "#bdbdbd"; c.beginPath(); c.arc(-31, -2, 7, 0, TAM); c.arc(31, -2, 7, 0, TAM); c.fill();
        c.strokeStyle = "#212121"; c.lineWidth = 2.5; c.strokeRect(-22, -12, 17, 11); c.strokeRect(5, -12, 17, 11); c.beginPath(); c.moveTo(-5, -7); c.lineTo(5, -7); c.stroke();
        biyik(c, "#9e9e9e", 0.8);
        break;
      case "kardes":
        c.fillStyle = "#1565c0"; c.beginPath(); c.arc(0, -12, 32, PI, TAM); c.fill(); c.fillRect(0, -16, 44, 8);
        break;
      case "orgcu":
        c.fillStyle = "#1a1a1a"; c.beginPath(); c.arc(0, -8, 34, PI * 1.02, PI * 1.98); c.fill();
        biyik(c, "#1a1a1a", 1.2);
        break;
      case "davulcu": case "zurnaci":
        c.fillStyle = "#1a1a1a"; c.beginPath(); c.arc(0, -8, 33, PI * 1.05, PI * 1.95); c.fill();
        c.fillStyle = "#c62828"; c.fillRect(-26, -40, 52, 14);
        biyik(c, "#1a1a1a", 1.4);
        break;
    }
  }

  function biyik(c, renk, b) {
    c.fillStyle = renk;
    c.beginPath(); c.ellipse(-8 * b, 6, 10 * b, 4.5 * b, 0.25, 0, TAM); c.ellipse(8 * b, 6, 10 * b, 4.5 * b, -0.25, 0, TAM); c.fill();
  }

  // ------------------------------------------------------------
  //  GÖVDE
  // ------------------------------------------------------------
  function renkler(a, ton, T) {
    const r = { govde: `hsl(${ton},62%,48%)`, koyu: `hsl(${ton},55%,32%)`, pant: "#37474f", ayakkabi: "#212121", sac: "#4e342e", kol: null, kisaKol: false, kisaBacak: false };
    switch (a) {
      case "teyze": r.govde = `hsl(${ton},55%,52%)`; r.sac = `hsl(${(ton + 160) % 360},65%,55%)`; r.ayakkabi = "#5d4037"; break;
      case "nine": r.govde = "#6d4c41"; r.koyu = `hsl(${ton},30%,45%)`; break;
      case "abla": r.govde = `hsl(${ton},80%,55%)`; r.sac = "#b23c17"; r.ayakkabi = "#d81b60"; break;
      case "kuzenK": r.govde = `hsl(${ton},85%,60%)`; r.sac = ["#4e342e", "#212121", "#a1887f", "#ffca28"][Math.floor(ton) % 4]; r.ayakkabi = "#d81b60"; r.kisaKol = true; r.kisaBacak = true; break;
      case "kuzenE": r.govde = `hsl(${ton},85%,58%)`; r.pant = "#1e3a8a"; break;
      case "amca": r.govde = "#eceff1"; r.koyu = "#795548"; r.pant = "#616161"; break;
      case "dayi": r.govde = "#6d4c41"; r.pant = "#4e342e"; break;
      case "cocuk": r.govde = `hsl(${ton},80%,55%)`; r.pant = "#1565c0"; r.sac = `hsl(${(ton + 180) % 360},70%,45%)`; r.kisaKol = true; r.kisaBacak = true; r.ayakkabi = "#e53935"; break;
      case "gelin": r.govde = "#ffffff"; r.ayakkabi = "#f5f5f5"; break;
      case "damat": r.govde = "#1b1b28"; r.pant = "#1b1b28"; break;
      case "kaynana": r.govde = "#7b3f8c"; r.ayakkabi = "#4a148c"; break;
      case "memur": r.govde = "#5d6470"; r.pant = "#5d6470"; break;
      case "kardes": r.govde = "#283593"; r.pant = "#283593"; r.ayakkabi = "#fafafa"; break;
      case "orgcu": r.govde = "#6a1b9a"; r.pant = "#212121"; break;
      case "davulcu": case "zurnaci": r.govde = "#fafafa"; r.koyu = "#b71c1c"; r.pant = "#212121"; break;
    }
    r.kol = r.kol || (["amca", "davulcu", "zurnaci"].includes(a) ? r.govde : (a === "nine" ? r.koyu : r.govde));
    return r;
  }

  function govdeCiz(c, a, T, r, t, hx, ek) {
    const g = T.govde;
    if (g === "uzun" || g === "gelinlik") {
      const gen = g === "gelinlik" ? 56 : 36, alt = -3;
      const sw = hx * 0.7;
      c.fillStyle = r.govde;
      c.beginPath(); c.moveTo(-19, -66); c.lineTo(19, -66);
      c.quadraticCurveTo(gen * 0.8 + sw, -30, gen + sw, alt);
      if (g === "gelinlik") { for (let i = 0; i <= 8; i++) { const x = gen + sw - i * (gen * 2) / 8; c.quadraticCurveTo(x - gen / 8, alt + 7, x - gen / 4 + (i === 8 ? gen / 4 : 0), alt); } }
      else c.lineTo(-gen + sw, alt);
      c.quadraticCurveTo(-gen * 0.8 + sw, -30, -19, -66); c.closePath(); c.fill();
      if (g === "gelinlik") {
        c.strokeStyle = "rgba(200,180,220,0.6)"; c.lineWidth = 1.5;
        for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(-gen + sw + 6, alt - i * 14); c.quadraticCurveTo(sw, alt - i * 14 + 6, gen + sw - 6, alt - i * 14); c.stroke(); }
      }
      if (a === "teyze") { c.fillStyle = "rgba(255,255,255,0.55)"; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(-22 + (i % 3) * 20 + sw * 0.5, -48 + Math.floor(i / 3) * 15, 3.2, 0, TAM); c.fill(); } }
      if (a === "abla") { for (let i = 0; i < 10; i++) { const on = Math.sin(t * 6 + i * 2.1) > 0.3; if (on) { c.fillStyle = "#fff"; c.beginPath(); c.arc(-24 + ((i * 37) % 48) + sw * 0.5, -60 + ((i * 23) % 52), 2.2, 0, TAM); c.fill(); } } }
      // üst
      yuvarlakDik(c, -21, -114, 42, 52, 14); c.fillStyle = a === "nine" ? r.koyu : r.govde; c.fill();
      if (a === "nine") { c.fillStyle = "#8d6e63"; c.fillRect(-6, -112, 12, 48); }
      if (g === "gelinlik") { c.fillStyle = "#e53935"; c.fillRect(-21, -70, 42, 8); c.beginPath(); c.moveTo(4, -66); c.lineTo(12, -44); c.lineTo(18, -46); c.lineTo(10, -66); c.fill(); }
      if (a === "kaynana") { c.fillStyle = "#fff"; for (let i = 0; i < 7; i++) { c.beginPath(); c.arc(-12 + i * 4, -108 + Math.sin((i / 6) * PI) * 6, 2.5, 0, TAM); c.fill(); } }
      return;
    }
    // Pantolonlu / kısa etekli üst gövde
    yuvarlakDik(c, -21, -114, 42, 64, 14); c.fillStyle = r.govde; c.fill();
    if (g === "kisa") {
      c.beginPath(); c.moveTo(-21, -62); c.lineTo(21, -62); c.lineTo(30 + hx * 0.5, -32); c.lineTo(-30 + hx * 0.5, -32); c.closePath(); c.fill();
      c.fillStyle = "rgba(255,255,255,0.5)"; for (let i = 0; i < 5; i++) if (Math.sin(t * 7 + i) > 0) { c.beginPath(); c.arc(-14 + i * 7, -90 + (i % 2) * 14, 2, 0, TAM); c.fill(); }
    } else if (g === "gomlek") {
      c.fillStyle = ek.ten; c.beginPath(); c.moveTo(-9, -114); c.lineTo(9, -114); c.lineTo(0, -86); c.closePath(); c.fill();
      c.strokeStyle = "#ffd54a"; c.lineWidth = 3; c.beginPath(); c.arc(0, -112, 11, 0.15 * PI, 0.85 * PI); c.stroke();
      c.fillStyle = "rgba(255,255,255,0.35)"; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-14 + (i % 3) * 14, -98 + Math.floor(i / 3) * 22, 4, 0, TAM); c.fill(); }
    } else if (g === "yelek") {
      c.fillStyle = "#eceff1"; c.beginPath(); c.arc(0, -72, 25, 0, TAM); c.fill();
      c.fillStyle = r.koyu; c.fillRect(-21, -112, 12, 56); c.fillRect(9, -112, 12, 56);
      c.fillStyle = "#cfd8dc"; c.beginPath(); c.arc(0, -66, 2, 0, TAM); c.arc(0, -80, 2, 0, TAM); c.fill();
    } else if (g === "takim") {
      c.fillStyle = "#fafafa"; c.beginPath(); c.moveTo(-10, -114); c.lineTo(10, -114); c.lineTo(0, -78); c.closePath(); c.fill();
      if (a === "damat") {
        c.fillStyle = "#111"; c.beginPath(); c.moveTo(0, -108); c.lineTo(-9, -113); c.lineTo(-9, -103); c.closePath(); c.moveTo(0, -108); c.lineTo(9, -113); c.lineTo(9, -103); c.closePath(); c.fill();
        c.fillStyle = "#e53935"; c.beginPath(); c.arc(-13, -98, 4.5, 0, TAM); c.fill();
      } else if (a !== "dayi") {
        c.fillStyle = "#c62828"; c.beginPath(); c.moveTo(-3, -110); c.lineTo(3, -110); c.lineTo(5, -84); c.lineTo(0, -78); c.lineTo(-5, -84); c.closePath(); c.fill();
      }
      if (T.pul) { for (let i = 0; i < 8; i++) if (Math.sin(t * 8 + i * 1.7) > 0.2) { c.fillStyle = "#e1bee7"; c.beginPath(); c.arc(-16 + (i % 4) * 10, -102 + Math.floor(i / 4) * 30, 2, 0, TAM); c.fill(); } }
      c.strokeStyle = "rgba(0,0,0,0.35)"; c.lineWidth = 2; c.beginPath(); c.moveTo(-10, -114); c.lineTo(-2, -76); c.moveTo(10, -114); c.lineTo(2, -76); c.stroke();
    } else if (g === "tisort") {
      c.fillStyle = "#fff59d"; c.beginPath();
      for (let i = 0; i < 10; i++) { const r2 = i % 2 ? 4 : 9, aa = -PI / 2 + i * PI / 5; c.lineTo(Math.cos(aa) * r2, -86 + Math.sin(aa) * r2); }
      c.fill();
    } else if (g === "esofman") {
      c.fillStyle = "#fff"; c.fillRect(-21, -112, 4, 58); c.fillRect(17, -112, 4, 58);
      c.fillStyle = "#e0e0e0"; c.fillRect(-2, -114, 4, 60);
    } else if (g === "yoresel") {
      c.fillStyle = r.koyu; c.fillRect(-21, -112, 13, 58); c.fillRect(8, -112, 13, 58);
      c.strokeStyle = "#ffd54a"; c.lineWidth = 2; c.strokeRect(-19, -110, 9, 54); c.strokeRect(10, -110, 9, 54);
      c.fillStyle = "#b71c1c"; c.fillRect(-21, -60, 42, 8);
    }
  }

  // ------------------------------------------------------------
  //  EŞYALAR (elde)
  // ------------------------------------------------------------
  function esyaCiz(c, esya, el, t, solEl) {
    if (!esya) return;
    const [x, y, a] = el;
    c.save(); c.translate(x, y);
    switch (esya) {
      case "canta": c.strokeStyle = "#5d4037"; c.lineWidth = 2; c.beginPath(); c.arc(0, 6, 7, PI, TAM); c.stroke(); c.fillStyle = "#8d2b4f"; yuvarlakDik(c, -10, 6, 20, 15, 4); c.fill(); c.fillStyle = "#ffd54a"; c.fillRect(-2, 9, 4, 3); break;
      case "tespih": { c.strokeStyle = "#5d4037"; c.lineWidth = 1; const s = Math.sin(t * 6) * 6; c.fillStyle = "#ff8f00"; for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(Math.sin(i * 0.4) * s * 0.4, 6 + i * 3.6, 2.4, 0, TAM); c.fill(); } break; }
      case "telefon": c.rotate(-0.2); c.fillStyle = "#212121"; yuvarlakDik(c, -6, -26, 12, 22, 3); c.fill(); c.fillStyle = Math.sin(t * 3) > 0 ? "#80deea" : "#e1f5fe"; c.fillRect(-4.5, -24, 9, 17); c.fillStyle = "#ff1744"; c.beginPath(); c.arc(0, -16, 2, 0, TAM); c.fill(); break;
      case "lolipop": c.strokeStyle = "#fff"; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -20); c.stroke(); c.fillStyle = "#ff4081"; c.beginPath(); c.arc(0, -27, 9, 0, TAM); c.fill(); c.strokeStyle = "#fff"; c.beginPath(); c.arc(0, -27, 5, 0, PI * 1.5); c.stroke(); break;
      case "baston": c.strokeStyle = "#6d4c41"; c.lineWidth = 4; c.rotate(-a + PI); c.beginPath(); c.moveTo(0, -8); c.lineTo(0, 55); c.stroke(); c.beginPath(); c.arc(-7, -8, 7, 0, PI, true); c.stroke(); break;
      case "yelpaze": { c.rotate(Math.sin(t * 10) * 0.4); c.fillStyle = "#f06292"; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 24, -PI * 0.95, -PI * 0.05); c.closePath(); c.fill(); c.strokeStyle = "rgba(255,255,255,0.6)"; c.lineWidth = 1; for (let i = 1; i < 6; i++) { const aa = -PI + i * PI / 6; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(aa) * 24, Math.sin(aa) * 24); c.stroke(); } break; }
      case "mendil": { const s = Math.sin(t * 10); c.fillStyle = "#e53935"; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-14, -18 + s * 6, -6 + s * 6, -34); c.lineTo(10 + s * 4, -30); c.quadraticCurveTo(10, -14, 4, 0); c.fill(); break; }
      case "kasik": c.fillStyle = "#a1887f"; c.beginPath(); c.ellipse(0, -10, 4.5, 8, 0, 0, TAM); c.fill(); c.fillRect(-1.5, -4, 3, 10); break;
      case "mikrofon": c.fillStyle = "#212121"; c.fillRect(-2.5, -18, 5, 18); c.fillStyle = "#9e9e9e"; c.beginPath(); c.arc(0, -22, 6, 0, TAM); c.fill(); break;
      case "defter": c.fillStyle = "#fff8e1"; c.fillRect(-12, -14, 24, 30); c.strokeStyle = "#8d6e63"; c.lineWidth = 1; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-8, -6 + i * 6); c.lineTo(8, -6 + i * 6); c.stroke(); } c.fillStyle = "#c62828"; c.fillRect(-12, -14, 24, 5); break;
      case "bicak": c.rotate(-0.7); c.fillStyle = "#6d4c41"; c.fillRect(-3, -2, 6, 14); c.fillStyle = "#cfd8dc"; c.beginPath(); c.moveTo(-3, -2); c.lineTo(3, -2); c.lineTo(1, -40); c.closePath(); c.fill(); break;
      case "cicek": c.fillStyle = "#43a047"; c.fillRect(-2, -6, 4, 18); [["#ff4081", -6, -12], ["#fff", 5, -14], ["#f8bbd0", 0, -20], ["#ff80ab", -8, -22], ["#fff", 8, -24]].forEach(([r, xx, yy]) => { c.fillStyle = r; c.beginPath(); c.arc(xx, yy, 6, 0, TAM); c.fill(); }); break;
      case "para": c.rotate(Math.sin(t * 8) * 0.2); ["#81c784", "#66bb6a", "#a5d6a7"].forEach((r, i) => { c.save(); c.rotate(-0.4 + i * 0.35); c.fillStyle = r; c.fillRect(-4, -26, 12, 24); c.restore(); }); break;
      case "tokmak": c.rotate(-a + PI * 0.8); c.strokeStyle = "#5d4037"; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -30); c.stroke(); c.fillStyle = "#d7ccc8"; c.beginPath(); c.arc(0, -32, 5, 0, TAM); c.fill(); break;
      case "zurna": c.rotate(-0.15); c.fillStyle = "#8d6e63"; c.beginPath(); c.moveTo(-3, -6); c.lineTo(3, -6); c.lineTo(9, 44); c.lineTo(-9, 44); c.closePath(); c.fill(); c.fillStyle = "#ffd54a"; c.fillRect(-9, 40, 18, 4); break;
    }
    c.restore();
  }

  // ------------------------------------------------------------
  //  ANA ÇİZİM
  // ------------------------------------------------------------
  // o = { x, y, s, arketip, ton, ten, hareket, ifade, t, vurus, tohum, yon, konusuyor,
  //       ek: { tac, kremali, terli, yildiz, mendil, esya, gozyasi, kalp, poz } }
  function ciz(c, o) {
    const a = o.arketip, T = tip(a), ek = o.ek || {};
    const ten = TENLER[(o.ten || 0) % TENLER.length];
    const r = renkler(a, o.ton || 0, T);
    const z = ek.poz || poz(o.hareket || "dur", o.vurus || 0, o.t, o.tohum || 0, o.yon || 1);
    const s = o.s * (T.olcek || 1);
    const kadin = ["teyze", "nine", "abla", "kuzenK", "gelin", "kaynana"].includes(a);

    c.save();
    c.translate(o.x, o.y);
    // gölge
    c.fillStyle = "rgba(0,0,0,0.28)"; c.beginPath(); c.ellipse(0, 2, 34 * s, 8 * s, 0, 0, TAM); c.fill();
    const sx = Math.sign(z.sx || 1) * Math.max(0.18, Math.abs(z.sx));
    c.scale(s * (o.yon || 1) * sx, s);
    c.translate(0, z.y);
    if (z.tum) { c.translate(0, z.pivot); c.rotate(z.tum); c.translate(0, -z.pivot); }

    // Arka plan saç/duvak
    if (a === "gelin") {
      const sal = Math.sin(o.t * 2) * 6;
      c.fillStyle = "rgba(255,255,255,0.55)";
      c.beginPath(); c.moveTo(-22, -184); c.quadraticCurveTo(-60 - sal, -110, -54 - sal, -10); c.lineTo(54 + sal, -10); c.quadraticCurveTo(60 + sal, -110, 22, -184); c.closePath(); c.fill();
    }

    // Bacaklar
    const uzunEtek = T.govde === "uzun" || T.govde === "gelinlik";
    if (uzunEtek) {
      c.fillStyle = r.ayakkabi;
      c.beginPath(); c.ellipse(-12 + z.hx * 0.3 - Math.sin(z.bL) * 10, 0, 10, 5.5, 0, 0, TAM); c.ellipse(12 + z.hx * 0.3 + Math.sin(z.bR) * 10, 0, 10, 5.5, 0, 0, TAM); c.fill();
    } else {
      bacak(c, -1, z.hx, z.bL, r.pant, ten, r.ayakkabi, r.kisaBacak);
      bacak(c, 1, z.hx, z.bR, r.pant, ten, r.ayakkabi, r.kisaBacak);
    }

    // Üst gövde (kalçadan döner)
    c.save();
    c.translate(z.hx, -52); c.rotate(z.rot); c.translate(0, 52);
    govdeCiz(c, a, T, r, o.t, z.hx, { ten });

    // Kafa
    c.save();
    c.translate(0, -118); c.rotate(z.kafa); c.translate(0, -32);
    sacArka(c, a, r.sac, o.t, ek);
    c.fillStyle = ten; c.beginPath(); c.arc(0, 0, a === "teyze" ? 30 : 34, 0, TAM); c.fill();
    if (a !== "teyze") { c.beginPath(); c.arc(-33, 0, 7, 0, TAM); c.arc(33, 0, 7, 0, TAM); c.fill(); }
    yuz(c, ek.gozluk ? "havali" : (o.ifade || "normal"), o.t, o.tohum || 0, o.konusuyor, kadin, ten);
    sacOn(c, a, r.sac, o.t, ek);
    if (ek.kremali) {
      c.fillStyle = "#fffdf5";
      [[-14, -8, 13], [10, -4, 15], [0, 12, 12], [-20, 10, 9], [20, 14, 8], [4, -20, 9]].forEach(([x, y, rr]) => { c.beginPath(); c.arc(x, y, rr, 0, TAM); c.fill(); });
      c.fillStyle = "#e91e63"; c.beginPath(); c.arc(6, -10, 4, 0, TAM); c.fill();
    }
    if (ek.terli) {
      c.fillStyle = "rgba(129,212,250,0.95)";
      const f = (o.t * 1.5) % 1;
      c.beginPath(); c.moveTo(30, -18 + f * 30); c.quadraticCurveTo(38, -4 + f * 30, 30, 0 + f * 30); c.quadraticCurveTo(22, -4 + f * 30, 30, -18 + f * 30); c.fill();
    }
    if (ek.tac) {
      c.fillStyle = "#ffd700"; c.beginPath(); c.moveTo(-24, -30);
      [[-24, -56], [-12, -40], [0, -62], [12, -40], [24, -56], [24, -30]].forEach(([x, y]) => c.lineTo(x, y)); c.closePath(); c.fill();
      c.fillStyle = "#e53935"; c.beginPath(); c.arc(0, -44, 4, 0, TAM); c.fill();
    }
    if (ek.yildiz) {
      for (let i = 0; i < 3; i++) { const aa = o.t * 5 + i * TAM / 3; c.fillStyle = "#ffeb3b"; yildizSekli(c, Math.cos(aa) * 36, -44 + Math.sin(aa) * 10, 7); }
    }
    c.restore();

    // Kollar + eşyalar
    const kisa = r.kisaKol;
    const elL = kol(c, -1, z.kL[0], z.kL[1], r.kol, ten, kisa);
    const elR = kol(c, 1, z.kR[0], z.kR[1], r.kol, ten, kisa);
    let esya = ek.esya !== undefined ? ek.esya : T.esya;
    if (o.hareket === "kasik") { esyaCiz(c, "kasik", elL, o.t); esyaCiz(c, "kasik", elR, o.t); esya = null; }
    if (ek.mendil) esyaCiz(c, "mendil", elL, o.t);
    esyaCiz(c, esya, elR, o.t);
    if (ek.esyaSol) esyaCiz(c, ek.esyaSol, elL, o.t);
    c.restore();
    c.restore();
  }

  function yildizSekli(c, x, y, r) {
    c.beginPath();
    for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.45 : r, aa = -PI / 2 + i * PI / 5; c.lineTo(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr); }
    c.closePath(); c.fill();
  }

  // Rastgele tip seç (cinsiyet verilmişse ona uygun)
  function rastgeleArketip(cins) {
    const adlar = Object.keys(ARKETIPLER).filter(k => !cins || ARKETIPLER[k].cins === cins || ARKETIPLER[k].cins === null);
    return adlar[Math.floor(Math.random() * adlar.length)];
  }

  window.Karakter = { ciz, poz, ARKETIPLER, ROLLER, TENLER, rastgeleArketip, kalpSekli, yildizSekli };
})();
