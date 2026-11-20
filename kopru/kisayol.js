// ============================================================
//  Masaüstüne "Canlı Düğün" kısayolu oluşturur (Windows).
//  Bir kez çalıştırın:  node kisayol.js
//  Sonra masaüstündeki "Canli Dugun.bat" dosyasına çift tıklamanız yeterli.
// ============================================================
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const kopru = path.dirname(fileURLToPath(import.meta.url));
const ev = os.homedir();
const adaylar = [
  path.join(ev, "Desktop"), path.join(ev, "OneDrive", "Desktop"), path.join(ev, "OneDrive", "Masaüstü"), path.join(ev, "Masaüstü"),
];
const masaustu = adaylar.find((d) => { try { return fs.statSync(d).isDirectory(); } catch { return false; } });
if (!masaustu) { console.log("❌ Masaüstü klasörü bulunamadı."); process.exit(1); }

if (process.platform === "win32") {
  const icerik = [
    "@echo off",
    "chcp 65001 >nul",
    "title Canli Dugun",
    `cd /d "${kopru}"`,
    "if not exist node_modules call npm install",
    "node sunucu.js",
    "pause",
  ].join("\r\n") + "\r\n";
  const dosya = path.join(masaustu, "Canli Dugun.bat");
  fs.writeFileSync(dosya, icerik);
  console.log(`✅ Kısayol oluşturuldu: ${dosya}`);
  console.log("   Artık masaüstündeki 'Canli Dugun' dosyasına çift tıklayın.");
} else {
  const dosya = path.join(masaustu, "Canli Dugun.command");
  fs.writeFileSync(dosya, `#!/bin/bash\ncd "${kopru}"\n[ -d node_modules ] || npm install\nnode sunucu.js\n`, { mode: 0o755 });
  console.log(`✅ Kısayol oluşturuldu: ${dosya}`);
}
