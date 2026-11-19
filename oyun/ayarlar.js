// ============================================================
//  CANLI DÜĞÜN — AYARLAR
//  Yayından önce sadece bu dosyayı düzenlemeniz yeterli.
// ============================================================
window.AYAR = {
  // Köprü programının adresi (kopru/sunucu.js). Değiştirmeniz gerekmez.
  koprüAdresi: "ws://localhost:8080",

  // Bir düğünün (turun) süresi, saniye. Tur bitince sıradaki çift gelin-damat olur.
  turSuresi: 6 * 60,

  // Halayda aynı anda görünen en fazla kişi
  halayKapasite: 22,

  // Takı hedefi: bu kadar coin toplanınca GELİN-DAMAT ÖZEL DANSI başlar.
  // Her dolduğunda hedef bu oranda büyür.
  takiHedefi: 300,
  takiHedefiCarpan: 1.5,

  // Beğeniler halayı hızlandırır: kaç beğenide tam coşku
  coskuIcinBegeni: 300,

  // Müzik ses seviyesi (0-1)
  muzikSes: 0.55,
  efektSes: 0.7,

  // ----------------------------------------------------------
  //  KENDİ ŞARKILARINIZ (oyun/sarkilar klasörüne MP3 atın)
  // ----------------------------------------------------------
  mp3Ses: 0.9,              // MP3 ses seviyesi (0-1)
  mp3EnFazlaSaniye: 0,      // 0 = şarkının tamamı. Ör: 90 → her şarkı 90 sn sonra kısılıp biter
  bosOldugundaMp3: true,    // istek yokken klasörden rastgele şarkı çalsın (false = orgcu çalar)

  // Yorumlar ekranda kaç saniye balon olarak görünsün
  balonSuresi: 5,

  // Yasaklı kelimeler: bu kelimeleri içeren yorum/istek ekrana çıkmaz
  yasakliKelimeler: ["küfür1", "küfür2"],

  // ----------------------------------------------------------
  //  HEDİYE KADEMELERİ — hediyenin TEK adet coin değerine göre
  //  (TikTok'tan gelen değer otomatik okunur, elle girmeye gerek yok)
  // ----------------------------------------------------------
  //  mini   : halaya katıl, en öne geç, kombo sayacı
  //  taki   : geline/damada altın takılır + sunucu anonsu
  //  pasta  : dev pasta kesimi + havai fişek (ekranı alır)
  //  efsane : DAVUL-ZURNA tam ekran şov + "DÜĞÜN SAHİBİ" tacı
  kademeler: [
    { tur: "mini",   enAz: 1    },
    { tur: "taki",   enAz: 10   },
    { tur: "pasta",  enAz: 500  },
    { tur: "efsane", enAz: 5000 },
  ],

  // Takı merasiminde coin değerine göre takının adı
  takiAdlari: [
    { enAz: 10,   ad: "ÇEYREK ALTIN",     renk: "#ffd54a" },
    { enAz: 99,   ad: "YARIM ALTIN",      renk: "#ffc107" },
    { enAz: 199,  ad: "TAM ALTIN",        renk: "#ffb300" },
    { enAz: 299,  ad: "CUMHURİYET ALTINI",renk: "#ff9800" },
    { enAz: 500,  ad: "ALTIN BİLEZİK",    renk: "#ff8f00" },
    { enAz: 5000, ad: "SET TAKIMI",       renk: "#ff6f00" },
  ],

  // İsme göre özel eşleme (kademeyi ezer). Hediye adı TikTok'taki
  // İngilizce adıyla yazılır, büyük/küçük harf önemsizdir.
  ozelHediyeler: {
    "rose":        "mini",
    "evil eye":    "nazar",   // Nazar boncuğu → nazar yağmuru
    "nazar":       "nazar",
    "sunglasses":  "taki",
    "cake slice":  "mini",
    "lion":        "efsane",
  },

  // Test panelindeki hediye butonları (ad, coin, emoji)
  testHediyeleri: [
    { ad: "Rose",       coin: 1,     emoji: "🌹" },
    { ad: "Heart",      coin: 5,     emoji: "💗" },
    { ad: "Evil Eye",   coin: 5,     emoji: "🧿" },
    { ad: "Sunglasses", coin: 199,   emoji: "🕶️" },
    { ad: "Hand Hearts",coin: 100,   emoji: "🫶" },
    { ad: "Cake",       coin: 1000,  emoji: "🎂" },
    { ad: "Lion",       coin: 29999, emoji: "🦁" },
  ],
};
