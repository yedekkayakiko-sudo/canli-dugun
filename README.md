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

## 📀 Kendi şarkılarınız

1. MP3 dosyalarınızı **`oyun/sarkilar`** klasörüne atın. Dosya adı, şarkının adı olur: `Gelin Ayşe.mp3`
2. İzleyici `!şarkı gelin ayse` yazınca adı eşleşen dosya çalar. Türkçe karakter ve büyük/küçük harf farkı önemsizdir.
3. Eşleşen dosya yoksa orgcu kendi telifsiz ezgisini çalar. Panoda 📀 işareti, isteğin listede olduğunu gösterir.
4. İstek yokken klasörden rastgele şarkı çalar. İsterseniz kapatabilirsiniz: `ayarlar.js` → `bosOldugundaMp3: false`.
5. Şarkı çalarken halay, şarkının kendi ritmini yakalayıp onunla oynar.

Yeni dosya atarsanız oyun 20 saniye içinde görür, yeniden başlatmanız gerekmez. Bu klasördeki şarkılar GitHub'a yüklenmez.

## 🎛️ Müzik kontrolü

| Nerede | Nasıl |
|---|---|
| Klavye (oyun penceresi seçiliyken) | **M** müzik aç/kapa · **N** sonraki şarkı · **+ / −** ses · **B** düğünü bitir |
| Test paneli | 🔊 Müzik butonu |
| 📱 Telefon | Köprü penceresinde yazan `http://192.168.x.x:8080/kumanda.html` adresini telefonda açın (aynı Wi-Fi). Müzik aç/kapa, sonraki şarkı, ses, istek silme ve listeden tek dokunuşla şarkı çalma burada. |

"Müzik kapalı" yalnızca müziği susturur. Zılgıt, altın ve havai fişek sesleri devam eder. Spotify'dan kendi müziğinizi açacaksanız bunu kullanın.

> Telefon bağlanamıyorsa: Windows ilk açılışta Node.js için güvenlik duvarı sorabilir, **Özel ağlar**a izin verin.

## 🎬 Tanıtım videosu (takipçi toplamak için)

Test panelindeki **🎬 Tanıtım videosu çek** butonuna basın ya da doğrudan `http://localhost:8080/?video=1` adresini açın. **🔴 Kaydı Başlat** deyince oyun kendi kendine 40 saniyelik bir düğün oynar: halay, kısmet eşleşmesi, takı, pasta, davul-zurna ve en sonda "@hesabınız TAKİP ET" kartı. Video bitince İndirilenler klasörüne kaydedilir (1080×1920, sesli).

- Her video farklı isim ve yorumlarla oynar. Birkaç tane çekip farklı günlerde paylaşabilirsiniz.
- Videoda klasördeki MP3'ler çalmaz, sadece telifsiz orgcu müziği kullanılır.
- Kayıt sırasında sekmeyi açık bırakın, başka sekmeye geçmeyin.
- Ekrandaki hesap adı `ayarlar.js` → `hesapAdi` ayarından gelir.

## ⚙️ Ayarlar (`oyun/ayarlar.js`)

- `turSuresi`: Bir düğünün süresi (varsayılan 6 dakika)
- `kademeler`: Coin eşikleri (mini / takı / pasta / efsane)
- `ozelHediyeler`: Belirli bir hediyeyi isimle bir efekte bağlar (ör. `"lion": "efsane"`)
- `takiHedefi`: Özel dans için gereken coin
- `yasakliKelimeler`: Ekrana çıkmayacak kelimeler
- `mp3Ses`: MP3 ses seviyesi
- `mp3EnFazlaSaniye`: Her şarkı en fazla kaç saniye çalsın (0 = tamamı). Telif riskini azaltmak için örneğin `90`

Hediyenin coin değeri TikTok'tan otomatik okunur. Bu yüzden yeni çıkan bir hediye de kendi kademesine düşer, elle eklemeniz gerekmez.

## 🎵 Telif hakkı hakkında

Klasöre kendi MP3'lerinizi koymadığınız sürece oyun hiçbir şarkı kaydı çalmaz. Davul, org ve zurna sesleri tarayıcıda **anlık sentezlenir**, ezgiler de Hicaz, Uşşak ve Rast makamlarında rastgele üretilir. İstek şarkı panosu sadece görseldir: orgcu, istenen şarkının adından türetilen kendine özgü bir ezgi çalar. Aynı isim her zaman aynı ezgiyi verir. `sarkilar` klasörüne telifli şarkı koyarsanız ya da Spotify'dan açarsanız TikTok yayını sessize alabilir veya uyarı verebilir; bu risk sizindir. `mp3EnFazlaSaniye` ile şarkıları kısa tutmak riski azaltır.

## ⚠️ Bilinmesi gerekenler

- Köprü, TikTok'un resmi bir API'si olmayan açık kaynak `tiktok-live-connector` kütüphanesini kullanır. TikTok bir değişiklik yaparsa geçici olarak bozulabilir; çözüm genelde `npm install tiktok-live-connector@latest` ile güncellemektir.
- Çok kalabalık yayınlarda TikTok her beğeni olayını göndermeyebilir.
