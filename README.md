# 💒 Canlı Düğün — TikTok Canlı Yayın Oyunu

İzleyiciler yorum yazarak halaya katılır, "bekar" yazarak eşleşir ve gelin-damat olur. Hediye atarak geline altın takarlar, pasta kestirirler ya da davul-zurna şovu başlatırlar.

```
canli-dugun/
├── oyun/            → Oyun (OBS'de açılan sayfa)
│   ├── index.html   → Sahne + sağda Test Paneli
│   ├── ayarlar.js   → ⚙️ Hediye kademeleri, tur süresi, hedefler (sadece burayı düzenleyin)
│   ├── oyun.js      → Düğün akışı, olaylar, çizim
│   ├── karakter.js  → Karakterler: yüz ifadeleri, kostümler, danslar
│   ├── muzik.js     → Telifsiz düğün müziği, efektler, MP3 çalar
│   ├── kumanda.html → 📱 Telefondan kumanda
│   └── sarkilar/    → 📀 Kendi MP3'leriniz buraya
└── kopru/           → TikTok köprü programı
    ├── sunucu.js
    ├── kisayol.js   → Masaüstüne "Canli Dugun" kısayolu koyar
    ├── baslat.bat   → Windows: çift tıkla (Akıllı Uygulama Denetimi engellerse kisayol.js kullanın)
    └── baslat.sh    → Mac/Linux
```

## 🚀 Kurulum (bir kerelik)

1. **Node.js** (LTS sürümü) kurun: https://nodejs.org
2. Bu sayfada yeşil **Code** butonu → **Download ZIP** ile indirip Masaüstüne çıkarın (sağ tık → Tümünü ayıkla).
3. `kopru` klasörüne girin, adres çubuğuna `cmd` yazıp Enter'a basın. Açılan pencerede sırayla:
   - `npm install` (bir kez)
   - `node kisayol.js` (masaüstüne **Canli Dugun** kısayolu koyar)
4. Artık her seferinde masaüstündeki **Canli Dugun** dosyasına çift tıklayın. İlk açılışta TikTok kullanıcı adınızı sorar ve hatırlar; oyun tarayıcıda kendiliğinden açılır.

> Kullanıcı adını değiştirmek için: `node sunucu.js yeniad`

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

## 💒 Düğün nasıl akar?

Her düğün yaklaşık 7 dakika sürer ve 6 aşamadan oluşur. Ekranın üstünde her an **tek bir büyük talimat** vardır: izleyici ne yapacağını oradan görür.

| Aşama | Ne oluyor? | İzleyici ne yapar? |
|---|---|---|
| 🚪 Kapı tutma | Gelinin kardeşi kapıyı tutar, bahşiş ister. Damat kapıyı zorlar | Beğeni, yorum ve hediye kapıyı açar |
| 💍 Nikah | Gelin düşünür ("Bi annemi arayayım 📞") | `evet` yazar (`hayır` yazan olursa gelin şok olur 😱) |
| 👣 Ayak basma | Kim önce basacak? | `gelin` ya da `damat` yazar → **Evin reisi** belli olur |
| 💃 Halay | Herkes halaya girer, **dans düellosu** çıkar | Beğenilerle **🔥 KOPMA ANI** gelir; düelloda `1` ya da `2` yazar |
| 💰 Takı | Kaynana defterini açar, her takıyı ısırır | Hediyeler geline altın olur. Takı çoğalınca gelin-damat ağırlıktan eğilir 😂 |
| 🎂 Pasta + 💐 Çiçek | Damat pastayı gelinin yüzüne bulaştırır, gelin intikam alır | `bulaştır`, sonra `çiçek` yazar → **çiçeği kapan sıradaki düğünün gelini/damadı olur** |
| 🚗 Konvoy | Gelin arabası korna çalarak geçer, düğün özeti çıkar | — |

**Gelin-damat nasıl seçilir?** Önce gelin çiçeğini kapan kişi, sonra `bekar` yazıp eşleşen (💘 Kısmet) çiftler gelir. Hiç kimse yoksa izleyiciler arasından kura çekilir ("haberleri yok 😂").

## 🎮 İzleyici ne yapar?

**Her izleyici bir karakter olur:** Kravatı Kafasında Dayı, Dedikoducu Teyze, Story Çeken Kuzen, Bastonla Oynayan Nine... Teyzeler arada izleyicilerin adını anarak dedikodu yapar.

| Yorum | Ne olur? |
|---|---|
| Herhangi bir yorum | Karakter düğüne gelir, yorumu kafasının üstünde çıkar |
| `göbek` `zıpla` `kaşık` `break` `oyna` `çıldır` | Karakteri o dansı yapar |
| `bayıl` `ağla` `öp` `zılgıt` `selam` | Bayılır, ağlar, öpücük atar, zılgıt çeker... |
| `bekar` (`bekar kız` / `bekar erkek`) | Kısmet eşleşmesi → sıradaki gelin-damat |
| `!şarkı Şarkı Adı` | Orgcuya istek (hediye atanın isteği ⭐ öne geçer) |

| Hediye | Ne olur? |
|---|---|
| 🌹 1-9 coin | Karakteri çıldırır, çifte gül atar, kombo sayacı (x12) |
| 🧿 Nazar boncuğu | Nazar yağmuru, çiftin üstüne dev nazar |
| 💍 10-499 coin | Altın uçar, geline/damada takılır; kaynana yorum yapar ("ÇEYREK mi bu? 🤨") |
| 🎬 500-4999 coin | **Komik sahne:** damadı havaya atma, gelinin damadı kucaklaması, tango, araya giren kaynana, damadın serenadı |
| 🦁 5000+ coin | **DAVUL-ZURNA** tam ekran şov, gönderen dev karakter ve 👑 Düğün Sahibi olur, herkes eğilir |
| ❤️ Beğeni | Coşku dolar → 🔥 **KOPMA ANI** (herkes çıldırır, ekran sallanır) |
| ➕ Takip | 📸 Aile fotoğrafı flaşı |

En çok coin atan kişi **🧣 halay başı** olur, düelloyu kazanan **👑 pistin kralı** olur.

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
| Klavye (oyun penceresi seçiliyken) | **M** müzik aç/kapa · **N** sonraki şarkı · **S** sonraki aşama · **+ / −** ses · **B** düğünü bitir |
| Test paneli | 🔊 Müzik butonu |
| 📱 Telefon | Köprü penceresinde yazan `http://192.168.x.x:8080/kumanda.html` adresini telefonda açın (aynı Wi-Fi). Müzik aç/kapa, sonraki şarkı, ses, istek silme ve listeden tek dokunuşla şarkı çalma burada. |

"Müzik kapalı" yalnızca müziği susturur. Zılgıt, altın ve havai fişek sesleri devam eder. Spotify'dan kendi müziğinizi açacaksanız bunu kullanın.

> Telefon bağlanamıyorsa: Windows ilk açılışta Node.js için güvenlik duvarı sorabilir, **Özel ağlar**a izin verin.

## 🎬 Tanıtım videosu (takipçi toplamak için)

Test panelindeki **🎬 Video çek** butonuna basın ya da doğrudan `http://localhost:8080/?video=1` adresini açın. **🔴 Kaydı Başlat** deyince oyun kendi kendine hızlandırılmış bir düğün oynar (~1,5 dk): kapı tutma, nikah, ayak basma, halay, düello, kopma anı, takı, komik sahne, davul-zurna, pasta bulaştırma, gelin çiçeği, konvoy ve en sonda "@hesabınız TAKİP ET" kartı. Video bitince İndirilenler klasörüne kaydedilir (1080×1920, sesli).

- Her video farklı isim ve yorumlarla oynar. Birkaç tane çekip farklı günlerde paylaşabilirsiniz.
- Videoda klasördeki MP3'ler çalmaz, sadece telifsiz orgcu müziği kullanılır.
- Kayıt sırasında sekmeyi açık bırakın, başka sekmeye geçmeyin.
- Ekrandaki hesap adı `ayarlar.js` → `hesapAdi` ayarından gelir.

## ⚙️ Ayarlar (`oyun/ayarlar.js`)

- `fazSureleri`: Her aşamanın süresi (kapı, nikah, halay, takı...)
- `kademeler`: Coin eşikleri (mini / takı / pasta / efsane)
- `ozelHediyeler`: Belirli bir hediyeyi isimle bir efekte bağlar (ör. `"lion": "efsane"`)
- `takiHedefi`: Kaç coin takıda gelin-damat ağırlıktan eğilsin
- `yasakliKelimeler`: Ekrana çıkmayacak kelimeler
- `mp3Ses`: MP3 ses seviyesi
- `mp3EnFazlaSaniye`: Her şarkı en fazla kaç saniye çalsın (0 = tamamı). Telif riskini azaltmak için örneğin `90`

Hediyenin coin değeri TikTok'tan otomatik okunur. Bu yüzden yeni çıkan bir hediye de kendi kademesine düşer, elle eklemeniz gerekmez.

## 🎵 Telif hakkı hakkında

Klasöre kendi MP3'lerinizi koymadığınız sürece oyun hiçbir şarkı kaydı çalmaz. Davul, org ve zurna sesleri tarayıcıda **anlık sentezlenir**, ezgiler de Hicaz, Uşşak ve Rast makamlarında rastgele üretilir. İstek şarkı panosu sadece görseldir: orgcu, istenen şarkının adından türetilen kendine özgü bir ezgi çalar. Aynı isim her zaman aynı ezgiyi verir. `sarkilar` klasörüne telifli şarkı koyarsanız ya da Spotify'dan açarsanız TikTok yayını sessize alabilir veya uyarı verebilir; bu risk sizindir. `mp3EnFazlaSaniye` ile şarkıları kısa tutmak riski azaltır.

## ⚠️ Bilinmesi gerekenler

- Köprü, TikTok'un resmi bir API'si olmayan açık kaynak `tiktok-live-connector` kütüphanesini kullanır. TikTok bir değişiklik yaparsa geçici olarak bozulabilir; çözüm genelde `npm install tiktok-live-connector@latest` ile güncellemektir.
- Çok kalabalık yayınlarda TikTok her beğeni olayını göndermeyebilir.
