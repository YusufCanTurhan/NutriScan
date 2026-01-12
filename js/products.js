// js/products.js - Belirgin Buton Versiyonu
const list = document.getElementById("productList");
const statusText = document.getElementById("status");
const input = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

let currentQuery = "milk";

// Skeleton Loading
function showSkeleton() {
  if (!list) return;
  list.innerHTML = "";
  let skeletonHTML = "";
  for (let i = 0; i < 6; i++) {
    skeletonHTML += `
      <div class="col-md-4 col-sm-6 mb-4">
        <div class="card h-100 border-0 shadow-sm">
          <div class="skeleton skeleton-img"></div>
          <div class="card-body">
             <div class="skeleton skeleton-title"></div>
             <div class="skeleton skeleton-text"></div>
             <div class="skeleton skeleton-btn"></div>
          </div>
        </div>
      </div>`;
  }
  list.innerHTML = skeletonHTML;
}

// Favoriler
function getFavorites() {
  return JSON.parse(localStorage.getItem("nutriscan_favs")) || [];
}

function toggleFavorite(productCode) {
  let favs = getFavorites();
  if (favs.includes(productCode)) favs = favs.filter(code => code !== productCode);
  else favs.push(productCode);
  localStorage.setItem("nutriscan_favs", JSON.stringify(favs));
  
  const btn = document.querySelector(`.btn-fav[data-code="${productCode}"]`);
  if (btn) btn.classList.toggle("active");
}

// Ürünleri Getir
async function fetchProducts(query = "milk") {
  if(!list) return;
  
  statusText.innerHTML = "";
  showSkeleton();

  try {
    const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${query}&page_size=12&json=true`);
    if (!res.ok) throw new Error("API Hatası");
    const data = await res.json();
    const products = data.products;

    list.innerHTML = "";

    if (!products || products.length === 0) {
      statusText.innerHTML = `<div class="alert alert-warning text-center">Ürün bulunamadı.</div>`;
      return;
    }

    const favorites = getFavorites();

    products.forEach(p => {
      const isFav = favorites.includes(p.code) ? "active" : "";
      const score = p.nutriscore_grade ? p.nutriscore_grade.toUpperCase() : "?";
      
      let badgeClass = "bg-secondary";
      if(score === 'A') badgeClass = "bg-success";
      if(score === 'B') badgeClass = "bg-info";
      if(score === 'C') badgeClass = "bg-warning text-dark";
      if(score === 'D') badgeClass = "bg-orange"; 
      if(score === 'E') badgeClass = "bg-danger";

      // Güvenli Veri
      const safeName = (p.product_name || "").replace(/'/g, "").replace(/"/g, "");
      const safeBrand = (p.brands || "").replace(/'/g, "").replace(/"/g, "");
      const safeImage = p.image_front_url || 'images/no-image.png';

      const col = document.createElement("div");
      col.className = "col-md-4 col-sm-6 mb-4";
      
      // YENİ KART TASARIMI: Butonlar aşağıda yan yana
      col.innerHTML = `
        <div class="card h-100">
          <button class="btn-fav ${isFav}" data-code="${p.code}" onclick="toggleFavorite('${p.code}')">♥</button>
          
          <img src="${safeImage}" class="card-img-top" alt="${safeName}" loading="lazy">
          
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="badge ${badgeClass} text-uppercase shadow-sm">${score} Score</span>
              <small class="text-muted text-truncate" style="max-width: 100px;">${p.brands || 'Markasız'}</small>
            </div>
            
            <h5 class="card-title">${p.product_name || 'İsimsiz Ürün'}</h5>
            
            <div class="mt-auto pt-3 d-flex gap-2">
              <a href="detail.html?code=${p.code}" class="btn btn-primary flex-grow-1 fw-bold">İncele</a>
              
              <button class="btn btn-warning text-white shadow-sm" 
                      onclick="addToList('${p.code}', '${safeName}', '${safeBrand}', '${safeImage}')"
                      title="Listeye Ekle">
                <span class="material-icons-round align-middle">playlist_add</span>
              </button>
            </div>
          </div>
        </div>
      `;
      list.appendChild(col);
    });

  } catch (err) {
    console.error(err);
    list.innerHTML = "";
    statusText.innerHTML = `<div class="alert alert-danger text-center">Veri alınamadı.</div>`;
  }
}

if(searchBtn) {
  searchBtn.addEventListener("click", () => {
    const val = input.value.trim();
    if (val) fetchProducts(val);
  });
}
if(input) {
  input.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      const val = input.value.trim();
      if (val) fetchProducts(val);
    }
  });
}
if(list) fetchProducts(currentQuery);