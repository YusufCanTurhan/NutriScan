// js/products.js - Güncel (Pagination Destekli)

const list = document.getElementById("productList");
const statusText = document.getElementById("status");
const input = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const loadMoreBtn = document.getElementById("loadMoreBtn"); // Yeni buton

let currentQuery = "milk";
let currentPage = 1; // Sayfa takibi
let isLoading = false; // Çift tıklamayı önlemek için

// --- SKELETON GÖSTERME (Sadece ilk yüklemede) ---
function showSkeleton() {
  if (!list) return;
  list.innerHTML = ""; 
  
  let skeletonHTML = "";
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

// --- ÜRÜNLERİ GETİR ---
// isLoadMore: true ise listeyi silme, ekle. false ise listeyi sil baştan başla.
async function fetchProducts(query, isLoadMore = false) {
  if (isLoading) return;
  isLoading = true;

  // 1. Durum Hazırlığı
  if (!isLoadMore) {
    // Yeni arama yapılıyor
    currentPage = 1;
    currentQuery = query; // Global query'i güncelle
    statusText.textContent = "";
    if (loadMoreBtn) loadMoreBtn.classList.add("d-none"); // Butonu gizle
    showSkeleton();
  } else {
    // "Daha fazla"ya basıldı, butona yükleniyor efekti ver
    if (loadMoreBtn) loadMoreBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Yükleniyor...';
  }

  try {
    // 2. API İsteği (Sayfa numarası dinamik)
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${query}&page=${currentPage}&page_size=12&json=true`,
      {
        headers: { "User-Agent": "NutriScan - WebApp - Version 1.0" }
      }
    );

    if (!res.ok) throw new Error("API Hatası");

    const data = await res.json();
    const products = data.products;

    // 3. İlk aramaysa Skeleton'ı temizle
    if (!isLoadMore) {
      list.innerHTML = ""; 
    }

    // 4. Sonuç Kontrolü
    if (!products || products.length === 0) {
      if (!isLoadMore) statusText.textContent = "Ürün bulunamadı.";
      if (loadMoreBtn) loadMoreBtn.classList.add("d-none");
    } else {
      // Ürünleri ekrana bas
      renderProductItems(products);

      // 5. Buton Yönetimi
      if (loadMoreBtn) {
        if (products.length < 12) {
          // Gelen ürün sayısı 12'den azsa demek ki son sayfadayız
          loadMoreBtn.classList.add("d-none");
        } else {
          // Hala ürün olabilir, butonu göster
          loadMoreBtn.classList.remove("d-none");
          loadMoreBtn.innerHTML = "Daha Fazla Göster 👇";
        }
      }
    }

  } catch (err) {
    console.error(err);
    if (!isLoadMore) {
        statusText.textContent = "API erişilemiyor, örnek veri gösteriliyor.";
        loadSampleData();
    }
  } finally {
    isLoading = false;
  }
}

// --- HTML OLUŞTURMA YARDIMCISI ---
function renderProductItems(products) {
    products.forEach(p => {
      const image = p.image_front_url || 'images/no-image.png';
      const name = p.product_name || 'İsimsiz Ürün';
      const brand = p.brands || '';

      // innerHTML += kullanımı büyük listelerde yavaştır ama şimdilik yeterli
      // insertAdjacentHTML daha performanslıdır:
      list.insertAdjacentHTML('beforeend', `
        <div class="col-md-4 mb-3 fade-in">
          <div class="card h-100">
            <img src="${image}" class="card-img-top" alt="${name}" style="object-fit: contain; padding: 10px; max-height: 180px;">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title text-primary text-truncate">${name}</h5>
              <p class="card-text text-muted small text-truncate">${brand}</p>
              <a href="detail.html?code=${p.code}" class="btn btn-primary mt-auto">Detaya Git</a>
            </div>
          </div>
        </div>
      `);
    });
}

function loadSampleData() {
  fetch("data/sample.json")
    .then(r => r.json())
    .then(data => {
      list.innerHTML = "";
      renderProductItems(data.products);
      if (loadMoreBtn) loadMoreBtn.classList.add("d-none");
    });
}

// --- Event Listeners ---
if (searchBtn) {
  searchBtn.addEventListener("click", () => {
    const val = input.value.trim();
    if (val.length > 0) fetchProducts(val);
  });
}

if (input) {
  input.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      const val = input.value.trim();
      if (val.length > 0) fetchProducts(val);
    }
  });
}

// "Daha Fazla Göster" Tıklama Olayı
if (loadMoreBtn) {
  loadMoreBtn.addEventListener("click", () => {
    currentPage++; // Sayfayı artır
    fetchProducts(currentQuery, true); // true = append modu
  });
}

// Başlangıç
fetchProducts(currentQuery);
