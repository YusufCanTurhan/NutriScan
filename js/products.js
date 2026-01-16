const list = document.getElementById("productList");
const statusText = document.getElementById("status");
const input = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

let currentQuery = "milk";

// --- SKELETON GÖSTERME FONKSİYONU ---
function showSkeleton() {
  if (!list) return;
  list.innerHTML = ""; 
  
  let skeletonHTML = "";
  // 6 tane sahte yükleme kartı oluştur
  for (let i = 0; i < 6; i++) {
    skeletonHTML += `
      <div class="col-md-4 mb-3">
        <div class="card h-100 border-0 shadow-sm">
          <div class="skeleton skeleton-img"></div>
          <div class="card-body p-0">
             <div class="skeleton skeleton-title"></div>
             <div class="skeleton skeleton-text"></div>
             <div class="skeleton skeleton-btn"></div>
          </div>
        </div>
      </div>
    `;
  }
  list.innerHTML = skeletonHTML;
}

async function fetchProducts(query = "milk") {
  // 1. Yazı yerine Skeleton fonksiyonunu çağırıyoruz
  statusText.textContent = ""; 
  showSkeleton(); 

  try {
    // User-Agent Header eklendi (API engellemesini önlemek için)
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${query}&page_size=12&json=true`,
      {
        headers: {
          "User-Agent": "NutriScan - WebApp - Version 1.0"
        }
      }
    );

    if (!res.ok) throw new Error("API Hatası");

    const data = await res.json();
    const products = data.products;

    if (!products || products.length === 0) {
      list.innerHTML = ""; // Skeleton'ı temizle
      statusText.textContent = "Ürün bulunamadı.";
      return;
    }

    list.innerHTML = ""; // Skeleton'ı temizle, gerçek veriyi bas
    products.forEach(p => {
      // Güvenli veri kontrolleri ve eksik resim düzeltmesi
      const image = p.image_front_url || 'images/no-image.png'; // no-image.png dosyasını oluşturmayı unutmayın
      const name = p.product_name || 'İsimsiz Ürün';
      const brand = p.brands || '';

      list.innerHTML += `
        <div class="col-md-4 mb-3">
          <div class="card h-100">
            <img src="${image}" class="card-img-top" alt="${name}" style="object-fit: contain; padding: 10px; max-height: 180px;">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title text-primary">${name}</h5>
              <p class="card-text text-muted small">${brand}</p>
              <a href="detail.html?code=${p.code}" class="btn btn-primary mt-auto">Detaya Git</a>
            </div>
          </div>
        </div>
      `;
    });

  } catch (err) {
    console.error(err);
    statusText.textContent = "API erişilemiyor, örnek veri gösteriliyor.";
    loadSampleData(); // Hata olursa örnek veriyi yükle
  }
}

function loadSampleData() {
  fetch("data/sample.json")
    .then(r => r.json())
    .then(data => {
      list.innerHTML = "";
      data.products.forEach(p => {
        list.innerHTML += `
          <div class="col-md-4 mb-3">
            <div class="card h-100">
              <div class="card-body d-flex flex-column">
                <h5 class="card-title">${p.product_name}</h5>
                <p class="card-text">${p.brands || ''}</p>
                <a href="detail.html?code=${p.code || 0}" class="btn btn-primary mt-auto">Detaya Git</a>
              </div>
            </div>
          </div>
        `;
      });
    });
}

// Event Listeners (Hata almamak için if kontrolüyle)
if(searchBtn) {
    searchBtn.addEventListener("click", () => {
      currentQuery = input.value.trim();
      if (currentQuery.length > 0) fetchProducts(currentQuery);
    });
}

if(input) {
    input.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        currentQuery = input.value.trim();
        if (currentQuery.length > 0) fetchProducts(currentQuery);
      }
    });
}

// Başlangıç
fetchProducts(currentQuery);
