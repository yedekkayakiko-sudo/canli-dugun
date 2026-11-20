// ============================================================
//  CANLI DÜĞÜN — TİKTOK KÖPRÜSÜ
//  Kullanım:  node sunucu.js            (ilk açılışta kullanıcı adını sorar ve hatırlar)
//             node sunucu.js yeniad     (kullanıcı adını değiştirir)
//  - TikTok canlı yayınındaki yorum/hediye/beğeni/takip olaylarını okur
//  - Oyunu http://localhost:8080 adresinde sunar
//  - Olayları WebSocket ile oyuna gönderir
// ============================================================
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import readline from "node:readline";
import { exec } from "node:child_process";
import { WebSocketServer } from "ws";
import { TikTokLiveConnection, WebcastEvent, ControlEvent, UserOfflineError } from "tiktok-live-connector";

const PORT = Number(process.env.PORT || 8080);
const KOPRU_KLASORU = path.dirname(fileURLToPath(import.meta.url));
const OYUN_KLASORU = path.resolve(KOPRU_KLASORU, "../oyun");

// Kullanıcı adı: komut satırı > ortam değişkeni > kayıtlı ayar (kopru/ayar.json)
const AYAR_DOSYASI = path.join(KOPRU_KLASORU, "ayar.json");
function ayarOku() { try { return JSON.parse(fs.readFileSync(AYAR_DOSYASI, "utf8")); } catch { return {}; } }
function ayarYaz(o) { try { fs.writeFileSync(AYAR_DOSYASI, JSON.stringify(o, null, 2)); } catch {} }
const temizAd = (s) => String(s || "").replace(/^@/, "").replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/i, "").replace(/\/.*$/, "").trim();
let KULLANICI = temizAd(process.argv[2] || process.env.TIKTOK_KULLANICI || ayarOku().kullanici);
if (process.argv[2] && KULLANICI) ayarYaz({ ...ayarOku(), kullanici: KULLANICI });

// ---------- 1) Oyunu sun (OBS tarayıcı kaynağı bu adresi açar) ----------
const SARKI_KLASORU = path.join(OYUN_KLASORU, "sarkilar");
fs.mkdirSync(SARKI_KLASORU, { recursive: true });
const SES_UZANTILARI = [".mp3", ".m4a", ".ogg", ".wav"];
const TURLER = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json",
  ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".ogg": "audio/ogg", ".wav": "audio/wav" };

function sarkiListesi() {
  try { return fs.readdirSync(SARKI_KLASORU).filter(d => SES_UZANTILARI.includes(path.extname(d).toLowerCase())).sort((a, b) => a.localeCompare(b, "tr")); }
  catch { return []; }
}

const sunucu = http.createServer((istek, yanit) => {
  let yol;
  try { yol = decodeURIComponent(new URL(istek.url, "http://x").pathname); } catch { yanit.writeHead(400); return yanit.end(); }
  if (yol === "/sarkilar.json") {
    yanit.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    return yanit.end(JSON.stringify(sarkiListesi()));
  }
  const dosya = path.join(OYUN_KLASORU, yol === "/" ? "index.html" : yol);
  if (!dosya.startsWith(OYUN_KLASORU + path.sep) && dosya !== OYUN_KLASORU) { yanit.writeHead(403); return yanit.end(); }
  fs.stat(dosya, (hata, bilgi) => {
    if (hata || !bilgi.isFile()) { yanit.writeHead(404); return yanit.end("Bulunamadı"); }
    const tur = TURLER[path.extname(dosya).toLowerCase()] || "application/octet-stream";
    const aralik = /bytes=(\d*)-(\d*)/.exec(istek.headers.range || "");
    if (aralik) {
      // Ses dosyalarında ileri/geri sarma için kısmi gönderim
      const bas = aralik[1] ? Number(aralik[1]) : 0;
      const son = aralik[2] ? Math.min(Number(aralik[2]), bilgi.size - 1) : bilgi.size - 1;
      yanit.writeHead(206, { "Content-Type": tur, "Content-Range": `bytes ${bas}-${son}/${bilgi.size}`, "Accept-Ranges": "bytes", "Content-Length": son - bas + 1 });
      return fs.createReadStream(dosya, { start: bas, end: son }).pipe(yanit);
    }
    yanit.writeHead(200, { "Content-Type": tur, "Content-Length": bilgi.size, "Accept-Ranges": "bytes", "Cache-Control": "no-store" });
    fs.createReadStream(dosya).pipe(yanit);
  });
});

// ---------- 2) Oyuna olay gönder ----------
const wss = new WebSocketServer({ server: sunucu });
let sonDurum = "başlatılıyor";
function yayinla(nesne) {
  const m = JSON.stringify(nesne);
  for (const c of wss.clients) if (c.readyState === 1) c.send(m);
}
function durum(metin) { sonDurum = metin; console.log("ℹ️ ", metin); yayinla({ tip: "durum", metin }); }
wss.on("connection", (c) => {
  c.send(JSON.stringify({ tip: "durum", metin: sonDurum }));
  // Kumanda komutlarını oyuna, oyun durumunu kumandaya aktar
  c.on("message", (veri) => {
    if (veri.length > 20000) return;
    let o; try { o = JSON.parse(veri); } catch { return; }
    if (o.tip !== "komut" && o.tip !== "oyunDurum") return;
    const m = JSON.stringify(o);
    for (const d of wss.clients) if (d !== c && d.readyState === 1) d.send(m);
  });
});

// Telefonun ulaşabileceği adresler: önce Wi-Fi/Ethernet, sanal bağdaştırıcılar (WSL, Hyper-V, VPN) sona
function yerelAdresler() {
  const sanal = /vethernet|wsl|hyper-v|virtual|vmware|vbox|docker|loopback|tailscale|zerotier|vpn/i;
  const sonuc = [];
  for (const [ad, liste] of Object.entries(os.networkInterfaces())) for (const a of liste || []) {
    if (a.family !== "IPv4" || a.internal) continue;
    let puan = 0;
    if (/^192\.168\./.test(a.address)) puan += 3;
    else if (/^10\./.test(a.address)) puan += 2;
    if (/wi-?fi|wlan|kablosuz|ethernet/i.test(ad)) puan += 2;
    if (sanal.test(ad)) puan -= 10;
    sonuc.push({ ad, adres: a.address, puan });
  }
  return sonuc.sort((x, y) => y.puan - x.puan);
}

function dinle(bitince) { sunucu.listen(PORT, () => {
  console.log("==============================================");
  console.log(" 💒 CANLI DÜĞÜN KÖPRÜSÜ");
  console.log(` Oyun (OBS):   http://localhost:${PORT}/?yayin=1`);
  console.log(` Test paneli:  http://localhost:${PORT}/`);
  const ipler = yerelAdresler();
  if (ipler.length) {
    console.log(` 📱 Kumanda:    http://${ipler[0].adres}:${PORT}/kumanda.html  (telefon aynı Wi-Fi'da olmalı)`);
    for (const d of ipler.slice(1, 3)) console.log(`    açılmazsa:   http://${d.adres}:${PORT}/kumanda.html  (${d.ad})`);
  }
  console.log(` 📀 Şarkılar:   ${SARKI_KLASORU}  (${sarkiListesi().length} şarkı)`);
  console.log(` 👤 Hesap:      ${KULLANICI ? "@" + KULLANICI + "   (değiştirmek için: node sunucu.js yeniad)" : "yok — sadece test"}`);
  console.log("==============================================");
  bitince && bitince();
}); }
wss.on("error", () => {});   // aynı hata aşağıda anlaşılır şekilde yazılır
sunucu.on("error", (e) => {
  if (e.code === "EADDRINUSE") { console.log(`\n❌ ${PORT} portu kullanımda: köprü zaten açık olabilir. Diğer siyah pencereyi kapatıp tekrar deneyin.\n`); process.exit(1); }
  throw e;
});

function tarayiciAc() {
  if (process.env.TARAYICI === "0") return;
  const adres = `http://localhost:${PORT}/`;
  const komut = process.platform === "win32" ? `start "" "${adres}"` : process.platform === "darwin" ? `open "${adres}"` : null;
  if (komut) exec(komut, () => {});
}

function sor(soru) {
  return new Promise((r) => { const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); rl.question(soru, (cvp) => { rl.close(); r(cvp); }); });
}

// ---------- 3) TikTok bağlantısı ----------
const kisi = (u = {}) => ({
  id: u.uniqueId || u.userId || "anonim",
  ad: u.nickname || u.uniqueId || "anonim",
  foto: u.profilePicture?.urls?.[0] || u.profilePictureUrl || null,
});

(async () => {
  if (!KULLANICI && process.stdin.isTTY) {
    KULLANICI = temizAd(await sor("👤 TikTok kullanıcı adınız (@ olmadan, boş bırakırsanız sadece test): "));
    if (KULLANICI) { ayarYaz({ ...ayarOku(), kullanici: KULLANICI }); console.log("✅ Kaydedildi, bir dahaki sefere sormayacağım.\n"); }
  }
  dinle(tarayiciAc);
  if (!KULLANICI) durum("TikTok kullanıcı adı yok — sadece test paneli çalışır");
  else baglan();
})();

function hataMetni(e) {
  if (!e) return "bilinmeyen hata";
  if (typeof e === "string") return e;
  const ic = e.exception || e.error || e.cause;
  return String(e.message || e.info || (ic && (ic.message || ic)) || JSON.stringify(e));
}

// Hediye serilerini (kombo) takip: aynı kişi + hediye için son repeatCount
const seriler = new Map();

function baglan() {
  const tt = new TikTokLiveConnection(KULLANICI, { enableExtendedGiftInfo: true, processInitialData: false });

  tt.on(WebcastEvent.CHAT, (d) => {
    yayinla({ tip: "yorum", ...kisi(d.user), metin: d.comment || "" });
  });

  tt.on(WebcastEvent.GIFT, (d) => {
    const detay = d.giftDetails || {};
    const ext = d.extendedGiftInfo || {};
    const ad = detay.giftName || ext.name || `Hediye#${d.giftId}`;
    const coin = detay.diamondCount || ext.diamond_count || 1;
    const k = kisi(d.user);
    const anahtar = `${k.id}|${d.giftId}|${d.groupId || ""}`;
    const sayac = Number(d.repeatCount) || 1;
    let adet;
    if (detay.giftType === 1) {
      // Seri hediye: her olayda sadece ARTIŞI gönder → anında görsel tepki
      adet = sayac - (seriler.get(anahtar) || 0);
      seriler.set(anahtar, sayac);
      if (d.repeatEnd) seriler.delete(anahtar);
    } else {
      adet = sayac;
    }
    if (adet > 0) {
      yayinla({ tip: "hediye", ...k, hediye: ad, coin, adet });
      console.log(`🎁 ${k.ad}: ${ad} x${adet} (${coin} coin)`);
    }
  });

  tt.on(WebcastEvent.LIKE, (d) => yayinla({ tip: "begeni", ...kisi(d.user), adet: d.likeCount || 1 }));
  tt.on(WebcastEvent.FOLLOW, (d) => yayinla({ tip: "takip", ...kisi(d.user) }));
  tt.on(WebcastEvent.SHARE, (d) => yayinla({ tip: "paylasim", ...kisi(d.user) }));
  tt.on(WebcastEvent.MEMBER, (d) => yayinla({ tip: "giris", ...kisi(d.user) }));

  let bitti = false; // aynı bağlantı için tek bir yeniden deneme
  const tekrarDene = (sn) => {
    if (bitti) return; bitti = true;
    tt.removeAllListeners?.();
    try { tt.disconnect?.(); } catch {}
    setTimeout(baglan, sn * 1000);
  };
  tt.on(ControlEvent.ERROR, (e) => {
    // Yayın kapalıyken gelen hatalar zaten aşağıda anlaşılır şekilde yazılıyor
    const m = hataMetni(e);
    if (!/room ?id|offline|not live|LIVE has ended|while connecting/i.test(m)) console.log("⚠️ ", m.slice(0, 200));
  });
  tt.on(ControlEvent.DISCONNECTED, () => {
    durum("Bağlantı koptu, 10 sn sonra tekrar denenecek");
    tekrarDene(10);
  });
  tt.on(WebcastEvent.STREAM_END, () => {
    durum("Yayın bitti. Yeni yayın bekleniyor…");
  });

  durum(`@${KULLANICI} yayınına bağlanılıyor…`);
  tt.connect()
    .then((s) => durum(`@${KULLANICI} canlı yayınına BAĞLANDI ✅ (oda ${s.roomId})`))
    .catch((e) => {
      const mesaj = hataMetni(e);
      if (e instanceof UserOfflineError || /offline|not live|room ?id/i.test(mesaj)) durum(`@${KULLANICI} şu an canlı yayında değil. Canlıya girince kendiliğinden bağlanacak (20 sn'de bir kontrol)`);
      else durum(`Bağlanamadı: ${mesaj.slice(0, 120)} — 20 sn sonra tekrar`);
      tekrarDene(20);
    });
}
