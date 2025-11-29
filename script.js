/* -------------------------
   ELEMENTLER
------------------------- */
const beforeInput = document.getElementById("beforeInput");
const afterInput = document.getElementById("afterInput");
const chooseBeforeBtn = document.getElementById("chooseBeforeBtn");
const chooseAfterBtn = document.getElementById("chooseAfterBtn");
const dropBefore = document.getElementById("dropBefore");
const dropAfter = document.getElementById("dropAfter");
const analyzeBtn = document.getElementById("analyzeBtn");
const loadDemoBtn = document.getElementById("loadDemoBtn");
const exampleButtons = document.querySelectorAll(".example-btn");
const resultCanvas = document.getElementById("resultCanvas");
const ctx = resultCanvas.getContext("2d");
const planElement = document.getElementById("afetPlan");

let beforeImg = null;
let afterImg = null;

let overlayRects = [];
let damageSummary = null;
let customPlanActive = false;
let overlayStats = { red: 0, yellow: 0, green: 0 };

/* -------------------------
   BUTONLAR
------------------------- */
chooseBeforeBtn.onclick = () => beforeInput.click();
chooseAfterBtn.onclick = () => afterInput.click();
loadDemoBtn.onclick = () => loadDemo(1);

/* -------------------------
   DOSYA YÜKLEME
------------------------- */
beforeInput.onchange = e => loadImage(e.target.files[0], "before");
afterInput.onchange = e => loadImage(e.target.files[0], "after");

function loadImage(file, type) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    const img = new Image();
    img.onload = () => {
      if (type === "before") {
        beforeImg = img;
      } else {
        afterImg = img;
        overlayRects = [];
        damageSummary = null;
        customPlanActive = false;
        planElement.innerHTML = "";
        runAnalysis();
      }
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
}

/* -------------------------
   SÜRÜKLE BIRAK
------------------------- */
function addDropHandlers(dropEl, type) {
  dropEl.addEventListener("dragover", e => {
    e.preventDefault();
    dropEl.classList.add("drag-over");
  });
  dropEl.addEventListener("dragleave", e => {
    e.preventDefault();
    dropEl.classList.remove("drag-over");
  });
  dropEl.addEventListener("drop", e => {
    e.preventDefault();
    dropEl.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    loadImage(file, type);
  });
}

addDropHandlers(dropBefore, "before");
addDropHandlers(dropAfter, "after");

/* -------------------------
   ANALİZ ET
------------------------- */
analyzeBtn.onclick = runAnalysis;

function runAnalysis() {
  if (!afterImg) {
    alert("Deprem sonrası görsel yükle veya bir örnek seç.");
    return;
  }

  ctx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
  ctx.drawImage(afterImg, 0, 0, resultCanvas.width, resultCanvas.height);

  if (overlayRects.length === 0 && !customPlanActive) {
    generateFakeAnalysis();
  }

  drawOverlay();
  updatePlan();
}


/* ---------------------------------------
   SAHTE HASAR TESPİTİ (Gerçekçi Demo)
---------------------------------------- */
function generateFakeAnalysis() {
  overlayRects = [];
  overlayStats = { red: 0, yellow: 0, green: 0 };

  const totalBoxes = 55 + Math.floor(Math.random() * 15); // 55–70 arası kutu
  let id = 1;

  for (let i = 0; i < totalBoxes; i++) {
    const r = Math.random();
    let type = "green";
    if (r < 0.25) type = "red";        // ~%25 ağır
    else if (r < 0.55) type = "yellow"; // ~%30 orta

    const w = 35 + Math.random() * 80;
    const h = 35 + Math.random() * 80;
    const x = 5 + Math.random() * (resultCanvas.width - w - 10);
    const y = 5 + Math.random() * (resultCanvas.height - h - 10);

    overlayRects.push({
      id: id++,
      x,
      y,
      w,
      h,
      type
    });

    overlayStats[type]++;
  }

  const reds = overlayStats.red;
  const yellows = overlayStats.yellow;

  if (reds >= 15 || reds + yellows >= 30) damageSummary = "agir";
  else if (reds + yellows >= 18) damageSummary = "orta";
  else damageSummary = "hafif";
}

/* -------------------------
   KUTULARI ÇİZ
------------------------- */
function drawOverlay() {
  overlayRects.forEach(r => {
    ctx.save();

    let stroke, fill;
    if (r.type === "red") {
      stroke = "rgba(255,0,0,1)";
      fill = "rgba(255,0,0,0.18)";
    } else if (r.type === "yellow") {
      stroke = "rgba(255,215,0,1)";
      fill = "rgba(255,215,0,0.18)";
    } else {
      stroke = "rgba(0,255,0,1)";
      fill = "rgba(0,255,0,0.18)";
    }

    // iç şeffaf dolgu
    ctx.fillStyle = fill;
    ctx.fillRect(r.x, r.y, r.w, r.h);

    // dış çerçeve
    ctx.lineWidth = 3;
    ctx.strokeStyle = stroke;
    ctx.strokeRect(r.x, r.y, r.w, r.h);

    // numara etiketi
    const labelW = 24;
    const labelH = 18;
    const labelX = r.x + 4;
    const labelY = r.y + 4;

    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.fillRect(labelX, labelY, labelW, labelH);

    ctx.fillStyle = "#fff";
    ctx.font = "11px Poppins, system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(r.id), labelX + labelW / 2, labelY + labelH / 2);

    ctx.restore();
  });
}

/* -------------------------
   MÜDAHALE PLANI (Varsayılan)
------------------------- */
function updatePlan() {
  if (customPlanActive) return; // Özel rapor varsa dokunma

  const total =
    overlayStats.red + overlayStats.yellow + overlayStats.green;

  let durum;
  if (damageSummary === "agir") {
    durum = "Bölge genelinde yaygın ve yoğun yıkım bulunduğu varsayılmaktadır. Çoklu arama-kurtarma ekibi, hava desteği ve lojistik güçlendirme gerektirir.";
  } else if (damageSummary === "orta") {
    durum = "Bölge kısmi ağır hasar almış kabul edilir. Kritik kümelere odaklanan, kontrollü ve aşamalı müdahale planı önerilir.";
  } else {
    durum = "Bölge ağırlıklı olarak hafif hasarlı / sağlam yapılardan oluşmaktadır. Öncelik keşif, güvenlik ve altyapı kontrollerindedir.";
  }

  planElement.innerHTML = `
    <strong>Otomatik Hasar Özeti (Simülasyon)</strong><br><br>
    Tahmini yapı sayısı: <strong>${total}</strong><br>
    Ağır hasarlı (kırmızı): <strong>${overlayStats.red}</strong><br>
    Orta hasarlı (sarı): <strong>${overlayStats.yellow}</strong><br>
    Hafif / sağlam (yeşil): <strong>${overlayStats.green}</strong><br><br>
    <strong>Genel Değerlendirme:</strong><br>
    ${durum}
  `;
}

/* -------------------------
        ÖRNEK GÖRSELLER
------------------------- */
const demoImages = {
  1: { before: "assets/oncesi-1.jpg", after: "assets/sonrasi-1.jpg" },
  2: { before: "assets/oncesi-2.jpg", after: "assets/sonrasi-2.jpg" },
  3: { before: "assets/oncesi-3.jpg", after: "assets/sonrasi-3.jpg" },
  4: { before: "assets/oncesi-4.jpg", after: "assets/sonrasi-4.jpg" }
};

/* -------------------------
   ÖRNEK SEÇİMİ
------------------------- */
exampleButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.example;
    loadDemo(id);
  });
});

/* -------------------------
   DEMO YÜKLE + ÖZEL RAPOR
------------------------- */
function loadDemo(id) {

  customPlanActive = true;

  beforeImg = new Image();
  beforeImg.src = demoImages[id].before;

  afterImg = new Image();
  afterImg.onload = () => {
    overlayRects = [];
    damageSummary = null;

    if (id == 1) generateReport1();
    if (id == 2) generateReport2();
    if (id == 3) generateReport3();
    if (id == 4) generateReport4();

    runAnalysis();
  };

  afterImg.src = demoImages[id].after;   // ❗ SADECE BURADA KALACAK
}

/* -------------------------
   RAPOR #1
------------------------- */
function generateReport1() {
  customPlanActive = true;
  planElement.innerHTML = `
<h3>AFETSONAR – Yapısal Durum ve Müdahale Analizi (Görüntü #1)</h3>
Yüklenen görüntü; segmentasyon, kontur çıkarımı, çatı deformasyon tespiti ve moloz yoğunluğu analizi modüllerinden geçirilmiş, toplam 58 yapı için yapısal durum sınıflandırması yapılmıştır.<br><br>

<strong>1.1. Hasar Sınıflandırma Dağılımı</strong><br>
<strong>Ağır Hasar (Seviye 3)</strong><br>
12, 13, 14, 16, 18, 20, 22, 26, 38, 44, 45, 49, 50, 59<br><br>

<strong>Orta / Az Hasar (Seviye 2)</strong><br>
5, 6, 9, 10, 17, 19, 21, 23, 24, 35, 36, 37, 43<br><br>

<strong>Hasarsız / Sağlam (Seviye 0–1)</strong><br>
1, 2, 3, 4, 7, 8, 11, 15, 25, 27, 28, 29, 30, 31, 32, 33, 34,
39, 40, 41, 42, 46, 48, 51, 52, 53, 54, 55, 56, 57, 58<br><br>

<h3>2. Erişilebilirlik Analizi</h3>
Yol segmentasyonu ve moloz blokaj tespitine göre, iki kritik yol kapanması belirlenmiştir:<br><br>

<strong>2.1. Kapalı Yol Segmentleri</strong><br>
• 26–27 arasındaki bağlantı yolu → Yoğun moloz ve enkaz nedeniyle tamamen kapalıdır.<br>
• 59–26 arasındaki yol → Çökme ve yığılma sebebiyle operasyonel değildir.<br><br>

Bu kapanmalar, merkezin “orta bölge” olarak tanımladığı
6–7–8–16–17–18–20–21–22–59 numaralı yapıların erişim stratejisinin yeniden planlanmasını gerektirmektedir.<br><br>

<h3>3. Önceliklendirme Motoru</h3>
Öncelik; hasar seviyesi, çökme riski, yaşam boşluğu olasılığı, çevresel moloz yükü ve yol uygunluğu üzerinden hesaplanmıştır.<br><br>

<h3>4. Operasyon Öncelik Sıralaması</h3>
<strong>4.1. 1. Seviye – Kritik Müdahale (Acil)</strong><br>
12, 13, 14, 16, 18, 20, 22, 26, 38, 44, 45, 49, 50, 59<br>
Bu yapılarda yüksek çökme riski ve taşıyıcı sistem kaybı belirgindir.<br>
<strong>Önerilen ekip:</strong><br>
• 5 kişilik ağır arama–kurtarma ekibi<br>
• 44–45–49–50 bölgesi yoğun çökme kümesi olduğundan çift ekip önerilir.<br><br>

<strong>4.2. 2. Seviye – Yüksek Canlılık Olasılığı (Öncelikli)</strong><br>
5, 6, 9, 10, 17, 19, 21, 23, 24, 35, 36, 37, 43<br>
Bu yapılarda yaşam boşluklarının büyük ölçüde korunduğu değerlendirilmektedir.<br>
<strong>Önerilen ekip:</strong><br>
• 3 kişilik hızlı tarama ve iç boşluk kontrol timi<br><br>

<strong>4.3. 3. Seviye – Düşük Öncelik (Güvenli Alan)</strong><br>
1, 2, 3, 4, 7, 8, 11, 15, 25, 27, 28, 29, 30, 31, 32, 33, 34,
39, 40, 41, 42, 46, 48, 51, 52, 53, 54, 55, 56, 57, 58<br>
Bu yapılarda hayati risk bulunmamaktadır.<br>
<strong>Önerilen işlem:</strong><br>
• Güvenlik taraması<br>
• Gaz/su hattı kontrolü<br>
• Çevresel risk değerlendirmesi<br><br>

<h3>5. Bölgesel Erişim Planı</h3>
<strong>5.1. “Orta Bölge” (6–7–8–16–17–18–20–21–22–59)</strong><br>
Bölge, hem kuzeyde hem güneyde yol kapanmalarına sahip olduğundan merkezden doğrudan giriş mümkün değildir.<br><br>

<u>A) Alternatif Kara Yolu Girişi (Arka Mahalle Güzergâhı)</u><br>
• 26–27 hattı kapalı olduğu için ekiplerin batı veya güneybatı arterlerinden bölgeye alınması önerilir.<br>
• Blokaj bulunmayan sokaklardan ilerleyerek 6–7–8–17–18–21–22 hattına ulaşım sağlanabilir.<br>
• Bu rota ağır araçlar için uygundur.<br><br>

<u>B) Hava Yolu Erişimi (Drone + Helikopter)</u><br>
• Sıkışık yapılaşma ve yol kapanmaları sebebiyle: 8, 18, 22 ve 59 numaralı yapılar için hava yoluyla ilk keşif önerilir.<br>
• Gerektiğinde helikopterle personel indirme veya drone ile enkaz üstü keşif mümkündür.<br><br>

<h3>6. Operasyonel Talimat ve Ulaşım Notu</h3>
Aşağıdaki yapı grubuna merkezden doğrudan giriş mümkün değildir:<br>
6, 7, 8, 17, 21, 18, 22, 59, 9, 10, 11, 26, 27, 28, 29<br><br>
Bu bölgeye erişim:<br>
→ Arka mahalle güzergâhından kara yolu ile, veya<br>
→ Hava yolu ile sağlanabilir.<br><br>
`;
}

/* -------------------------
   RAPOR #2
------------------------- */
function generateReport2() {
  customPlanActive = true;
  planElement.innerHTML = `
<h3>AFETSONAR – Yapısal Durum ve Müdahale Analizi (Görüntü #2)</h3>
Yüklenen görüntü; segmentasyon, kontur çıkarımı, çatı deformasyon tespiti ve moloz yoğunluğu analizi modüllerinden geçirilmiş, toplam 58 yapı için yapısal durum sınıflandırması yapılmıştır.<br><br>

<strong>1.1. Hasar Sınıflandırma Dağılımı</strong><br>
<strong>Ağır Hasar (Seviye 3)</strong> – Kırmızı Çerçeve<br>
12, 13, 14, 16, 18, 20, 22, 26, 38, 44, 45, 49, 50, 59<br>
Bu yapılarda çökme, taşıyıcı sistem kaybı, belirgin çatı deformasyonu ve yüksek moloz yoğunluğu tespit edilmiştir.<br><br>

<strong>Orta / Az Hasar (Seviye 2)</strong> – Sarı Çerçeve<br>
5, 6, 9, 10, 17, 19, 21, 23, 24, 35, 36, 37, 43<br>
Bu grupta kısmi deformasyon, lokal kırık alanlar ve sınırlı dış cephe hasarı gözlemlenmiştir.<br><br>

<strong>Hasarsız / Sağlam (Seviye 0–1)</strong> – Yeşil Çerçeve<br>
1, 2, 3, 4, 7, 8, 11, 15, 25, 27, 28, 29, 30, 31, 32, 33, 34,
39, 40, 41, 42, 46, 48, 51, 52, 53, 54, 55, 56, 57, 58<br>
Bu yapılarda yapısal bütünlük korunmuş olup çökme veya ciddi deformasyon izlenmemiştir.<br><br>

<h3>2. Erişilebilirlik Analizi</h3>
Yol segmentasyonu ve moloz blokaj tespitine göre, iki kritik yol kapanması belirlenmiştir:<br><br>

<strong>2.1. Kapalı Yol Segmentleri</strong><br>
• 26–27 arasındaki bağlantı yolu → Yoğun moloz ve enkaz nedeniyle tamamen kapalıdır.<br>
• 59–26 arasındaki yol → Çökme ve yığılma sebebiyle operasyonel değildir.<br><br>

Bu kapanmalar, merkezin "orta bölge" olarak tanımladığı
6–7–8–16–17–18–20–21–22–59 numaralı yapıların erişim stratejisinin yeniden planlanmasını gerektirmektedir.<br><br>

<h3>3. Önceliklendirme Modülü Sonuçları</h3>
Öncelik motoru aşağıdaki değişkenleri değerlendirmiştir:<br>
• Hasar seviyesi katsayısı<br>
• Çökme riski<br>
• Yaşam boşluğu olasılığı<br>
• Çevresel moloz yükü<br>
• Yapı küme yoğunluğu<br>
• Yol erişimi uygunluğu<br><br>

Bu skorlarla operasyon öncelik sıralaması oluşturulmuştur.<br><br>

<h3>4. Operasyon Öncelik Sıralaması</h3>
<strong>4.1. 1. Seviye – Kritik Müdahale (Acil)</strong><br>
12, 13, 14, 16, 18, 20, 22, 26, 38, 44, 45, 49, 50, 59<br>
Bu yapılarda yüksek çökme riski ve taşıyıcı sistem kaybı belirgindir.<br>
<strong>Önerilen ekip:</strong><br>
• 5 kişilik ağır arama–kurtarma ekibi<br>
• 44–45–49–50 bölgesi yoğun çökme kümesi olduğundan çift ekip önerilir.<br><br>

<strong>4.2. 2. Seviye – Yüksek Canlılık Olasılığı (Öncelikli)</strong><br>
5, 6, 9, 10, 17, 19, 21, 23, 24, 35, 36, 37, 43<br>
Bu yapılarda yaşam boşluklarının büyük ölçüde korunduğu değerlendirilmektedir.<br>
<strong>Önerilen ekip:</strong><br>
• 3 kişilik hızlı tarama ve iç boşluk kontrol timi<br><br>

<strong>4.3. 3. Seviye – Düşük Öncelik (Güvenli Alan)</strong><br>
1, 2, 3, 4, 7, 8, 11, 15, 25, 27, 28, 29, 30, 31, 32, 33, 34,
39, 40, 41, 42, 46, 48, 51, 52, 53, 54, 55, 56, 57, 58<br>
Bu yapılarda hayati risk bulunmamaktadır.<br>
<strong>Önerilen işlem:</strong><br>
• Güvenlik taraması<br>
• Gaz/su hattı kontrolü<br>
• Çevresel risk değerlendirmesi<br><br>

<h3>5. Bölgesel Erişim Planı</h3>
<strong>5.1. Orta Bölge (6–7–8–16–17–18–20–21–22–59)</strong><br>
Bölge, hem kuzeyde hem güneyde yol kapanmalarına sahip olduğundan merkezden doğrudan giriş mümkün değildir.<br><br>

<strong>A) Alternatif Kara Yolu Girişi</strong><br>
• 26–27 hattı kapalı olduğu için ekiplerin batı veya güneybatı arterlerinden bölgeye alınması önerilir.<br>
• Blokaj bulunmayan sokaklardan ilerleyerek 6–7–8–17–18–21–22 hattına ulaşım sağlanabilir.<br>
• Bu rota ağır araçlar için uygundur.<br><br>

<strong>B) Hava Yolu Erişimi (Drone + Helikopter)</strong><br>
• Sıkışık yapılaşma ve yol kapanmaları sebebiyle: 8, 18, 22 ve 59 numaralı yapılar için hava yoluyla ilk keşif önerilir.<br>
• Gerektiğinde helikopterle personel indirme veya drone ile enkaz üstü keşif mümkündür.<br><br>

<h3>6. Operasyonel Talimat ve Ulaşım Notu</h3>
Aşağıdaki yapı grubuna merkezden doğrudan giriş mümkün değildir:<br>
6, 7, 8, 17, 21, 18, 22, 59, 9, 10, 11, 26, 27, 28, 29<br><br>

Bu bölgeye erişim:<br>
→ Arka mahalle güzergâhından kara yolu ile,<br>
→ Veya hava yolu ile sağlanabilir.<br><br>
`;
}

/* -------------------------
   RAPOR #3
------------------------- */
function generateReport3() {
  customPlanActive = true;
  planElement.innerHTML = `
<h3>AFETSONAR – Yapısal Durum ve Müdahale Analizi (Görüntü #3)</h3>
Yüklenen uydu görüntüsü; bina tespiti, çatı deformasyonu analizi, moloz yoğunluğu haritalama ve yapısal bütünlük skorlama aşamalarından geçirilmiştir. Bölgedeki toplam 49 yapı için hasar sınıflandırması tamamlanmıştır.<br><br>

<strong>1.1. Hasar Sınıfı Dağılımı</strong><br>

<strong>Ağır Hasarlı Yapılar (Kırmızı – Seviye 3)</strong><br>
15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
27, 28, 29, 30, 31, 35, 36, 45, 46<br>
Bu yapılarda çökme, taşıyıcı kaybı, moloz yığılması ve kat implozyonu belirgindir.<br><br>

<strong>Orta / Az Hasarlı Yapılar (Sarı – Seviye 2)</strong><br>
3, 4, 8, 9, 47, 48<br>
Çatıda hafif deformasyon, kolonlarda kısmi hasar ve dış cephe kırılmaları tespit edilmiştir.<br><br>

<strong>Hasarsız / Yapısal Olarak Sağlam Yapılar (Yeşil – Seviye 0–1)</strong><br>
5, 6, 7, 10, 11, 12, 13, 14, 25, 26, 33, 34, 37, 38, 39, 40, 41, 42, 43, 44, 49<br>
Bu yapılarda çatı ve dış cephe bütünlüğü korunmuştur; risk düşüktür.<br><br>

<h3>2. Yol ve Erişilebilirlik Analizi</h3>
AFETSONAR’ın yol segmentasyonu modülü, bölgedeki sokak bağlantılarını inceleyerek kritik kapalı yolları belirlemiştir.<br><br>

<strong>2.1. Kapalı Yol Tespitleri</strong><br>
• 26–27 numaralı yapılar arasındaki yol tamamen kapalıdır.<br>
• 59–26 hattı da yoğun enkaz nedeniyle kullanılamamaktadır.<br><br>

Bu iki tıkanma, bölgenin orta hattındaki kritik koridoru devre dışı bırakmaktadır.<br><br>

<strong>2.2. Erişilebilirlik Durumu</strong><br>
Kara yolu erişimi kısıtlı olan yapılar:<br>
6, 7, 8, 9, 10, 11, 17, 18, 21, 22, 26, 27, 28, 29, 59<br><br>

<strong>Önerilen erişim yöntemleri:</strong><br>
• Mahallenin batı veya kuzey aksından giriş<br>
• Kara yolu yetersizse İHA / hava yolu kullanımı<br><br>

<h3>3. Müdahale Önceliklendirme (AFETSONAR Skorlama)</h3>
Öncelik; hasar seviyesi + yol durumu + kümelenme yoğunluğu + canlılık olasılığı üzerinden hesaplanmıştır.<br><br>

<strong>3.1. 1. Seviye – Acil Kritik Alanlar (Ağır Hasar)</strong><br>
15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
27, 28, 29, 30, 31, 35, 36, 45, 46<br>
<strong>Önerilen ekip:</strong><br>
• 5 kişilik ağır arama–kurtarma timleri<br>
• Gerektiğinde çift ekip – paralel konuşlandırma<br><br>

<strong>3.2. 2. Seviye – Yüksek Canlılık Olasılığı</strong><br>
3, 4, 8, 9, 47, 48<br>
<strong>Önerilen ekip:</strong><br>
• 3 kişilik hızlı tarama ekibi<br>
• İç boşluk kontrolü + ses/termal tarama<br><br>

<strong>3.3. 3. Seviye – Düşük Öncelikli Alanlar</strong><br>
5, 6, 7, 10, 11, 12, 13, 14, 25, 26, 33, 34, 37, 38, 39, 40, 41, 42, 43, 44, 49<br>
<strong>Önerilen işlem:</strong><br>
• Çevresel güvenlik<br>
• Gaz, su ve altyapı kontrolleri<br>
• İkincil risk değerlendirmesi<br><br>

<h3>4. Operasyon Yönlendirmesi (AFETSONAR Çıktısı)</h3>
AFETSONAR’ın erişilebilirlik analizi, iki yoğun yıkım kümesi arasında kritik ancak riskli bir dar koridor tespit etmiştir:<br><br>

<strong>17–24 bölgesi</strong><br>
<strong>27–32 bölgesi</strong><br><br>

<strong>4.1. Orta Koridorun Kullanımı Neden Önerilmiyor?</strong><br>
• Enkaz yoğunluğu yüksek<br>
• Yol genişliği dar<br>
• Araç manevrası sınırlı<br>
• Çift yönlü geçiş için güvenli değildir<br>
• Artçı sarsıntılar nedeniyle ek çökme riski mevcuttur<br><br>

Bu nedenle:<br>
<strong>17–24 — 27–32 arasındaki orta hattın kullanılması önerilmez.</strong><br><br>

<h3>4.2. Güvenli Ulaşım Rotaları</h3>
<strong>1) Doğu Hattı (Sağdan Giriş)</strong><br>
• 9–10–11 ve 31–32 çevresindeki yol geniştir<br>
• Enkaz riski daha düşüktür<br>
• Araç trafiği için daha güvenlidir<br><br>

<strong>2) Batı Hattı (Soldan Giriş)</strong><br>
• 14–15–25–33 aksında çevre yolları daha geniştir<br>
• Enkaz blokajı minimaldir<br><br>

<strong>Kısa Teknik Sonuç</strong><br>
17–24 ile 27–32 yapı kümeleri arasındaki doğrudan koridor operasyonel olarak verimsiz, riskli ve kullanılmaması gereken bir hattır.<br><br>

<strong>Önerilen güvenli erişim seçenekleri:</strong><br>
• Doğu hattı<br>
• Batı hattı<br><br>
`;
}

/* -------------------------
   RAPOR #4
------------------------- */
function generateReport4() {
  customPlanActive = true;
  planElement.innerHTML = `
<h3>AFETSONAR – Yapısal Durum ve Müdahale Analizi (Görüntü #4)</h3>

<h3>1. Görüntü İşleme ve Sınıflandırma Sonuçları</h3>
Yüklenen uydu görüntüsü; segmentasyon, nesne tespiti, yapısal deformasyon analizi ve hasar skorlaması aşamalarından geçirilmiş; toplam 78 yapı için durum sınıflandırması yapılmıştır.<br><br>

<strong>1.1. Hasar Sınıflandırma Dağılımı</strong><br>

<strong>Ağır Hasar (Seviye 3 – Kırmızı çerçeve)</strong><br>
78, 19, 20, 30, 31, 39, 40, 41, 48, 49, 50, 51, 52, 59, 60<br>
Bu yapılarda taşıyıcı sistem kaybı, çatı göçmesi ve tam çökme belirtileri yoğundur.<br><br>

<strong>Orta / Az Hasar (Seviye 2 – Sarı çerçeve)</strong><br>
17, 18, 67, 71, 74, 75, 69, 57<br>
Bu yapılarda kısmi deformasyon, çatlak izleri, cephe hasarı ve sınırlı çökme tespit edilmiştir.<br><br>

<strong>Hasarsız / Sağlam (Seviye 0–1 – Yeşil çerçeve)</strong><br>
1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
16, 21, 22, 23, 24, 25, 26, 27, 28, 29,
32, 33, 34, 35, 36, 37, 38,
42, 43, 44, 45, 46, 47,
53, 54, 55, 56, 58,
61, 62, 63, 64, 65, 66, 68,
70, 72, 73, 76, 77<br>
Bu yapılarda yapısal bütünlük korunmuştur.<br><br>

<h3>2. Erişilebilirlik ve Yol Durumu Analizi</h3>
AFETSONAR’ın yol segmentasyonu modülü; moloz yoğunluğu, araç trafiği sıkışması, blokaj ve yol bütünlüğünü taramıştır.<br><br>

<strong>Tespit Edilen Yol Problemleri</strong><br>
• 17–24 hattı ile 27–32 hattı arasındaki bağlantı yolları kısmen tıkanmış görünmektedir.<br>
• Özellikle 19–23 bölgesi ile 27–31 bölgesi arasındaki dar sokak aksında ağır hasar kaynaklı moloz birikimi vardır.<br>
• Bu nedenle iki bölge arasındaki doğrudan geçiş operasyonel olarak verimli değildir.<br><br>

<strong>Önerilen Erişim Rotası</strong><br>
• 17–24 cluster → sağdan veya soldan geniş cadde üzerinden erişim önerilir.<br>
• 27–32 cluster → arka mahalle bağlantısından ulaşım daha güvenlidir.<br>
• Kritik bölgeler için hava yoluyla erişim alternatif rota olarak önerilmektedir.<br><br>

<h3>3. Önceliklendirme Modülü Sonuçları</h3>
AFETSONAR’ın teknik sıralama algoritması; hasar seviyesi, yıkım yoğunluğu, yol erişimi, bina kümelenmesi, potansiyel yaşam boşlukları ve çevresel riskleri birlikte değerlendirir.<br><br>

<strong>3.1. 1. Seviye – Kritik Müdahale Bölgesi (Acil)</strong><br>
78, 19, 20, 30, 31, 39, 40, 41, 48, 49, 50, 51, 52, 59, 60<br>
• Taşıyıcı sistem kaybı belirgindir.<br>
• Çökme riski yüksektir.<br>
• Enkaz hacmi geniştir.<br>
<strong>Önerilen ekip:</strong><br>
➡ 5 kişilik ağır arama–kurtarma ekibi<br><br>

<strong>3.2. 2. Seviye – Yüksek Canlılık Olasılığı Bölgesi</strong><br>
17, 18, 67, 71, 74, 75, 69, 57<br>
• Yapı kısmen ayaktadır.<br>
• İç yaşam boşlukları korunmuş olabilir.<br>
• Canlı bulma ihtimali ağır hasarlı yapılara göre daha yüksektir.<br>
<strong>Önerilen ekip:</strong><br>
➡ 3 kişilik hızlı tarama ekibi<br><br>

<strong>3.3. 3. Seviye – Düşük Öncelik / Çevresel Güvenlik Kontrolü</strong><br>
Yeşil listede yer alan tüm yapılar<br>
• Yapısal risk minimaldir.<br>
• Doğrudan arama-kurtarma gerektirmez.<br>
<strong>Önerilen işlem:</strong><br>
• Gaz/su hattı kontrolü<br>
• Elektrik hat izolasyonu<br>
• Çevresel güvenlik taraması<br><br>

<h3>4. Operasyonel Sonuç</h3>
Bu görüntü için AFETSONAR’ın verdiği genel değerlendirme:<br><br>

• Arama-kurtarma ekipleri önce kırmızı cluster’a, ardından sarı cluster’a yönlendirilmelidir.<br>
• “17–18–19–20–21–22–23–24” bölgesi ile “27–28–29–30–31–32” bölgesi doğrudan bağlantıya kapalıdır;<br>
→ Yanaşma sağdan / soldan veya hava yolu ile gerçekleştirilmelidir.<br><br>

<strong>Alan genelinde en yoğun yıkım cephesi:</strong><br>
30–41 hattıdır.<br><br>
`;
}
function generateUserAnalysis() {

  overlayRects = [];

  let id = 1;
  const total = 45; // kullanıcı fotoğrafları için ideal

  for (let i = 0; i < total; i++) {
    let colorChance = Math.random();

    let color = "green";
    if (colorChance < 0.15) color = "red";
    else if (colorChance < 0.40) color = "yellow";

    overlayRects.push({
      id: id++,
      x: Math.random() * (resultCanvas.width - 100),
      y: Math.random() * (resultCanvas.height - 100),
      w: 50 + Math.random() * 80,
      h: 50 + Math.random() * 80,
      color
    });
  }

  const reds = overlayRects.filter(r => r.color === "red").length;
  const yellows = overlayRects.filter(r => r.color === "yellow").length;

  if (reds > 10) damageSummary = "agir";
  else if (reds + yellows > 20) damageSummary = "orta";
  else damageSummary = "hafif";

  // KULLANICI İÇİN ÖZEL PLAN METNİ
  planElement.innerHTML = `
  <h3>AFETSONAR — Kullanıcı Görüntüsü Analizi</h3>
  Yüklediğiniz deprem sonrası görüntü üzerinde otomatik hasar analizi yapılmıştır.<br><br>

  <strong>Ağır Hasar Tespit Edilen Yapılar:</strong> ${reds}<br>
  <strong>Orta Hasar Tespit Edilen Yapılar:</strong> ${yellows}<br>
  <strong>Hafif Hasar Tespit Edilen Yapılar:</strong> ${total - reds - yellows}<br><br>

  <strong>Önerilen müdahale:</strong><br>
  ${damageSummary === "agir" ? 
  "• 3 ağır arama-kurtarma ekibi<br>• Hava yolu ve drone erişimi önerilir."
  : damageSummary === "orta" ?
  "• 2 hızlı tarama ekibi<br>• Yol uygunluğu kontrol edilmeli."
  :
  "• 1 inceleme ekibi yeterlidir.<br>• Gözlemsel kontrol önerilir."
  }
  `;
}
