// js/detail.js - Final Sürüm (Trafik Işıkları + Paylaşım)
const content = document.getElementById("content");
const code = new URLSearchParams(window.location.search).get("code");

// --- Ana Yükleme ---
async function loadDetail() {
  if (!code) {
    content.innerHTML = `<div class="alert alert-warning">Ürün kodu bulunamadı.</div>`;
    return;
  }

  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
    if (!res.ok) throw new Error("API Hatası");

    const data = await res.json();
    if (data.status !== 1) throw new Error("Ürün bulunamadı");

    const p = data.product;
    
    renderProduct(p);
    addToHistory(p);

    if (p.categories_tags && p.categories_tags.length > 0) {
      const category = p.categories_tags[0].replace("en:", ""); 
      fetchSimilarProducts(category);
    }

    renderReviews();

  } catch (err) {
    console.error(err);
    content.innerHTML = `<div class="alert alert-danger">Veri alınamadı.</div>`;
  }
}

// --- Ürün Render ---
function renderProduct(p) {
  // 1. Akıllı Uyarılar
  const prefs = JSON.parse(localStorage.getItem("nutriscan_prefs")) || {};
  let alertsHTML = "";

  if (prefs.vegan) {
    const isNonVegan = p.ingredients_analysis_tags?.includes("en:non-vegan");
    const statusUnknown = p.ingredients_analysis_tags?.includes("en:vegan-status-unknown");
    if (isNonVegan) alertsHTML += createAlert("danger", "🌱 Vegan Uyarısı", "Hayvansal bileşen içeriyor.");
    else if (statusUnknown) alertsHTML += createAlert("warning", "🌱 Vegan Durumu", "Vegan onayı kesin değil.");
  }
  if (prefs.gluten && p.allergens_tags?.some(tag => tag.includes("gluten"))) {
    alertsHTML += createAlert("danger", "🌾 Gluten Alarmı", "Gluten tespit edildi!");
  }
  if (prefs.palm && p.ingredients_from_palm_oil_n > 0) {
    alertsHTML += createAlert("warning", "🌴 Palm Yağı", "Palm yağı içeriyor.");
  }

  // 2. Güvenli Veri
  const safeName = (p.product_name || "").replace(/'/g, "").replace(/"/g, "");
  const safeBrand = (p.brands || "").replace(/'/g, "").replace(/"/g, "");
  const safeImage = p.image_front_url || 'images/no-image.png';

  // 3. Nutri-Score Renkleri
  const nutriscore = p.nutriscore_grade ? p.nutriscore_grade.toUpperCase() : '?';
  const scoreColor = { 'A': 'bg-success', 'B': 'bg-info', 'C': 'bg-warning', 'D': 'bg-orange', 'E': 'bg-danger' }[nutriscore] || 'bg-secondary';

  // 4. TRAFİK IŞIKLARI MANTIĞI (YENİ)
  // API 'nutrient_levels' içinde 'low', 'moderate', 'high' döner.
  const levels = p.nutrient_levels || {};
  const getLevelColor = (lvl) => {
    if(lvl === 'low') return 'text-success';    // Yeşil
    if(lvl === 'moderate') return 'text-warning'; // Turuncu
    if(lvl === 'high') return 'text-danger';      // Kırmızı
    return 'text-muted';
  };
  const getLevelLabel = (lvl) => {
    if(lvl === 'low') return 'Düşük';
    if(lvl === 'moderate') return 'Orta';
    if(lvl === 'high') return 'Yüksek';
    return '-';
  };

  // HTML
  content.innerHTML = `
    <div class="row g-5">
      <div class="col-lg-5 text-center">
        <div class="card border-0 shadow-lg p-3 mb-4 position-relative">
          <img src="${safeImage}" class="img-fluid rounded" alt="${safeName}">
          <div class="position-absolute top-0 end-0 m-3 ${scoreColor} text-white rounded-circle d-flex align-items-center justify-content-center shadow" style="width: 60px; height: 60px; font-weight:bold; font-size:1.5rem;">
            ${nutriscore}
          </div>
        </div>

        <button class="btn btn-warning text-white w-100 py-3 shadow-sm fw-bold mb-3 hover-scale" 
                onclick="addToList('${p.code}', '${safeName}', '${safeBrand}', '${safeImage}')">
          <span class="material-icons-round align-middle me-2">playlist_add</span>
          ALIŞVERİŞ LİSTESİNE EKLE
        </button>

        <button class="btn btn-light w-100 py-2 shadow-sm fw-bold text-primary" onclick="shareProduct('${safeName}')">
          <span class="material-icons-round align-middle me-2">ios_share</span>
          Arkadaşınla Paylaş
        </button>
      </div>

      <div class="col-lg-7">
        <div class="mb-4">${alertsHTML}</div>
        <span class="badge bg-primary-subtle text-primary mb-2">${p.brands || 'Markasız'}</span>
        <h1 class="fw-bold mb-3">${p.product_name || "İsimsiz Ürün"}</h1>
        
        <div class="card border-0 shadow-sm overflow-hidden mt-4">
          <div class="card-header bg-white border-bottom fw-bold py-3">
             Besin Analizi (100g için)
          </div>
          <ul class="list-group list-group-flush">
            <li class="list-group-item d-flex justify-content-between py-3">
              <span>🔥 Enerji</span> 
              <strong>${(p.nutriments['energy-kcal_100g'] || 0)} kcal</strong>
            </li>

            <li class="list-group-item d-flex justify-content-between py-3 align-items-center">
              <span>💧 Yağ</span> 
              <div class="text-end">
                <span class="me-2 fw-bold">${(p.nutriments.fat_100g || 0)} g</span>
                <span class="badge bg-light border ${getLevelColor(levels.fat)}">${getLevelLabel(levels.fat)}</span>
                <span class="material-icons-round align-middle ms-1 fs-5 ${getLevelColor(levels.fat)}">circle</span>
              </div>
            </li>

            <li class="list-group-item d-flex justify-content-between py-3 align-items-center">
              <span>🍔 Doymuş Yağ</span> 
              <div class="text-end">
                <span class="me-2 fw-bold">${(p.nutriments['saturated-fat_100g'] || 0)} g</span>
                <span class="badge bg-light border ${getLevelColor(levels['saturated-fat'])}">${getLevelLabel(levels['saturated-fat'])}</span>
                <span class="material-icons-round align-middle ms-1 fs-5 ${getLevelColor(levels['saturated-fat'])}">circle</span>
              </div>
            </li>

            <li class="list-group-item d-flex justify-content-between py-3 align-items-center">
              <span>🍭 Şeker</span> 
              <div class="text-end">
                <span class="me-2 fw-bold">${(p.nutriments.sugars_100g || 0)} g</span>
                <span class="badge bg-light border ${getLevelColor(levels.sugars)}">${getLevelLabel(levels.sugars)}</span>
                <span class="material-icons-round align-middle ms-1 fs-5 ${getLevelColor(levels.sugars)}">circle</span>
              </div>
            </li>

            <li class="list-group-item d-flex justify-content-between py-3 align-items-center">
              <span>🧂 Tuz</span> 
              <div class="text-end">
                <span class="me-2 fw-bold">${(p.nutriments.salt_100g || 0)} g</span>
                <span class="badge bg-light border ${getLevelColor(levels.salt)}">${getLevelLabel(levels.salt)}</span>
                <span class="material-icons-round align-middle ms-1 fs-5 ${getLevelColor(levels.salt)}">circle</span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <hr class="my-5" style="opacity:0.1">
    <div id="similar-section" class="mb-5 d-none">
      <h3 class="fw-bold mb-4">Benzer Ürünler</h3>
      <div class="row g-3" id="similar-list"></div>
    </div>
    <div id="reviews-section" class="mb-5">
      <h3 class="fw-bold mb-4">Kullanıcı Yorumları (6)</h3>
      <div id="review-list"></div>
    </div>
  `;
}

// --- Paylaşım Fonksiyonu (YENİ) ---
function shareProduct(name) {
  if (navigator.share) {
    navigator.share({
      title: 'NutriScan',
      text: `Bu ürüne NutriScan'de baktım: ${name}`,
      url: window.location.href,
    })
    .catch((error) => console.log('Paylaşım iptal', error));
  } else {
    // Tarayıcı desteklemiyorsa panoya kopyala
    navigator.clipboard.writeText(window.location.href);
    alert("Bağlantı kopyalandı! 📋");
  }
}

// --- Diğer Fonksiyonlar (Aynı) ---
async function fetchSimilarProducts(category) {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${category}&page_size=4&json=true`);
    const data = await res.json();
    const products = data.products;
    if (products && products.length > 1) { 
      const list = document.getElementById("similar-list");
      document.getElementById("similar-section").classList.remove("d-none");
      products.forEach(p => {
        if(p.code === code) return; 
        list.innerHTML += `
          <div class="col-6 col-md-3">
            <div class="card h-100 border-0 shadow-sm hover-scale">
               <img src="${p.image_front_url || 'images/no-image.png'}" class="card-img-top p-2" style="height:120px; object-fit:contain;">
               <div class="card-body p-2 text-center">
                 <small class="fw-bold d-block text-truncate">${p.product_name}</small>
                 <a href="detail.html?code=${p.code}" class="btn btn-sm btn-outline-primary mt-2 stretched-link">İncele</a>
               </div>
            </div>
          </div>`;
      });
    }
  } catch (err) { console.log(err); }
}

function renderReviews() {
  const reviews = [
    { name: "Zeynep A.", star: 5, text: "Katkı maddesi olmaması çok hoşuma gitti.", date: "3 gün önce" },
{ name: "Ahmet D.", star: 4, text: "Paketleme güzel, tazeliği hissediliyor.", date: "5 gün önce" },
{ name: "Burcu S.", star: 5, text: "Çocuklarım bayıldı, gönül rahatlığıyla yediriyorum.", date: "1 hafta önce" },
{ name: "Murat E.", star: 3, text: "Lezzet iyi ama porsiyon biraz küçük.", date: "10 gün önce" },
{ name: "Selin Ö.", star: 4, text: "Doğal tat sevenler için ideal.", date: "2 hafta önce" },
{ name: "Emre Ç.", star: 5, text: "Beklentimin üstünde çıktı, tekrar alırım.", date: "3 hafta önce" }

  ];
  const list = document.getElementById("review-list");
  reviews.forEach(r => {
    let stars = "";
    for(let i=0; i<5; i++) stars += `<span class="material-icons-round fs-6 text-warning">${i < r.star ? 'star' : 'star_border'}</span>`;
    list.innerHTML += `
      <div class="card border-0 shadow-sm mb-3">
        <div class="card-body">
          <div class="d-flex justify-content-between">
            <h6 class="fw-bold mb-1">${r.name}</h6><small class="text-muted">${r.date}</small>
          </div>
          <div class="mb-2">${stars}</div><p class="text-muted small mb-0">${r.text}</p>
        </div>
      </div>`;
  });
}

function addToHistory(product) {
  let history = JSON.parse(localStorage.getItem("nutriscan_history")) || [];
  history = history.filter(item => item.code !== product.code);
  history.unshift({
    code: product.code,
    name: product.product_name || "İsimsiz Ürün",
    image: product.image_front_url || "images/no-image.png",
    brand: product.brands || "",
    score: product.nutriscore_grade || "?"
  });
  if (history.length > 10) history.pop();
  localStorage.setItem("nutriscan_history", JSON.stringify(history));
}

function createAlert(type, title, message) {
  const icon = type === 'danger' ? 'block' : 'warning';
  return `<div class="alert alert-${type} d-flex align-items-center shadow-sm border-0" role="alert"><span class="material-icons-round fs-2 me-3">${icon}</span><div><strong class="d-block">${title}</strong><span class="small">${message}</span></div></div>`;
}

loadDetail();