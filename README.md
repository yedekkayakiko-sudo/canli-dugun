# 💒 Canlı Düğün — TikTok Canlı Yayın Oyunu

İzleyiciler yorum yazarak halaya katılır, "bekar" yazarak eşleşir ve gelin-damat olur. Hediye atarak geline altın takarlar, pasta kestirirler ya da davul-zurna şovu başlatırlar.

```
canli-dugun/
├── oyun/            → Oyun (OBS'de açılan sayfa)
│   ├── index.html   → Sahne + sağda Test Paneli
│   ├── ayarlar.js   → ⚙️ Hediye kademeleri, tur süresi, hedefler (sadece burayı düzenleyin)
│   ├── oyun.js      → Oyun mantığı ve çizim
│   └── muzik.js     → Telifsiz, anlık üretilen düğün müziği
└── kopru/           → TikTok köprü programı
    ├── sunucu.js
    ├── baslat.bat   → Windows: çift tıkla
    └── baslat.sh    → Mac/Linux
```

## 🚀 Kurulum (bir kerelik)

1. **Node.js** (LTS sürümü) kurun: https://nodejs.org
2. Bu sayfada yeşil **Code** butonu → **Download ZIP** ile indirip Masaüstüne çıkarın.
3. `kopru/baslat.bat` dosyasına çift tıklayın (Mac/Linux: `./baslat.sh`).
4. Program sizden TikTok kullanıcı adınızı ister (`@` olmadan).

Köprü açıldığında şu adresler hazır olur:

| Adres | Ne için |
|---|---|
| `http://localhost:8080/` | Test paneli ile deneme |
| `http://localhost:8080/?yayin=1` | Yayında gösterilecek temiz ekran |

> Yayın kapalıyken köprü "şu an canlı değil" der ve 20 saniyede bir yeniden dener. Canlıya girdiğinizde kendiliğinden bağlanır.

## 🎥 Yayına ekleme

**TikTok LIVE Studio veya OBS'de:**
1. Kaynak ekleyin: **Tarayıcı (Browser Source)**
2. URL: `http://localhost:8080/?yayin=1`
3. Boyut: **Genişlik 1080 / Yükseklik 1920**
4. Oyunun sesinin yayına gitmesi için "Sesi OBS üzerinden kontrol et" kutusunu işaretleyin.

## 🧪 Yayından önce deneme

`http://localhost:8080/` adresini Chrome'da açın. Köprü çalışmasa bile `oyun/index.html` dosyasını doğrudan açmak da yeterli.

- **🔊 Sesi Başlat**: Normal tarayıcıda ses için bir kez tıklamak gerekir (OBS'de gerekmez).
- **🤖 Otomatik Demo**: Sahte izleyiciler sürekli yorum ve hediye gönderir, yoğun bir yayını taklit eder.
- **👥 12 kişi gelsin / 💑 Çift eşleştir**: Hızlı senaryolar.
- Hediye butonları ve **Adet** seçimi ile kombo testi yapılabilir.

## 🎮 İzleyici ne yapar?

| İzleyici | Oyunda olan |
|---|---|
| Herhangi bir yorum | Halaya katılır, yorumu kafasının üstünde balon olarak çıkar |
| `bekar` (`bekar kız` / `bekar erkek`) | Bekarlar listesine girer, biri gelince **💘 KISMET!** eşleşmesi olur, çift sıradaki gelin-damat olur |
| `!şarkı Şarkı Adı` | İstek panosuna eklenir; hediye atanınki ⭐ ile öne geçer |
| ❤️ Beğeni | Coşku çubuğu dolar, **müzik ve halay hızlanır** |
| 🌹 Mini hediye (1-9 coin) | Halayın önüne geçer, kalp/gül patlaması, kombo sayacı (x12) |
| 🧿 Nazar boncuğu | Ekrana nazar boncuğu yağmuru |
| 💍 Takı (10-499 coin) | Altın uçarak geline/damada takılır: Çeyrek, Yarım, Tam, Cumhuriyet… MC anonsu ve zılgıt |
| 🎂 Pasta (500-4999) | Dev pasta kesimi ve havai fişekler (8 sn ekranı alır) |
| 🦁 Efsane (5000+) | **DAVUL-ZURNA** tam ekran şov, müzik değişir, gönderen 👑 "Düğün Sahibi" olur |
| Takı hedefi dolunca | Gelin-damat özel dansı |
| Tur sonu (6 dk) | "Düğün bitti" ekranı, en cömert 3 kişi, sonra sıradaki çift |

En çok coin atan kişi **halay başı** olur: halayın en önünde durur ve mendil sallar.

## ⚙️ Ayarlar (`oyun/ayarlar.js`)

- `turSuresi`: Bir düğünün süresi (varsayılan 6 dakika)
- `kademeler`: Coin eşikleri (mini / takı / pasta / efsane)
- `ozelHediyeler`: Belirli bir hediyeyi isimle bir efekte bağlar (ör. `"lion": "efsane"`)
- `takiHedefi`: Özel dans için gereken coin
- `yasakliKelimeler`: Ekrana çıkmayacak kelimeler

Hediyenin coin değeri TikTok'tan otomatik okunur. Bu yüzden yeni çıkan bir hediye de kendi kademesine düşer, elle eklemeniz gerekmez.

## 🎵 Telif hakkı hakkında

Oyun hiçbir şarkı kaydı çalmaz. Davul, org ve zurna sesleri tarayıcıda **anlık sentezlenir**, ezgiler de Hicaz, Uşşak ve Rast makamlarında rastgele üretilir. İstek şarkı panosu sadece görseldir: orgcu, istenen şarkının adından türetilen kendine özgü bir ezgi çalar. Aynı isim her zaman aynı ezgiyi verir. Telifli müziği yayına ayrıca siz açarsanız sessize alınma riski yine sizindir.

## ⚠️ Bilinmesi gerekenler

- Köprü, TikTok'un resmi bir API'si olmayan açık kaynak `tiktok-live-connector` kütüphanesini kullanır. TikTok bir değişiklik yaparsa geçici olarak bozulabilir; çözüm genelde `npm install tiktok-live-connector@latest` ile güncellemektir.
- Çok kalabalık yayınlarda TikTok her beğeni olayını göndermeyebilir.
