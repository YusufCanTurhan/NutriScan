// js/compare.js
let activeSlot = 1;
let product1 = null;
let product2 = null;

const searchModal = new bootstrap.Modal(document.getElementById('searchModal'));

function openSearchModal(slot) {
  activeSlot = slot;
  document.getElementById("compareSearchInput").value = "";
  document.getElementById("compareResults").innerHTML = "";
  searchModal.show();
}

async function searchForCompare() {
  const query = document.getElementById("compareSearchInput").value;
  if (!query) return;

  const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${query}&page_size=5&json=true`);
  const data = await res.json();
  
  const list = document.getElementById("compareResults");
  list.innerHTML = "";
  
  data.products.forEach(p => {
    // Liste elemanını oluştur (onclick olayını closure sorununu çözmek için string olarak değil, element property olarak ekliyoruz)
    const item = document.createElement("button");
    item.className = "list-group-item list-group-item-action d-flex align-items-center gap-2";
    item.innerHTML = `
      <img src="${p.image_front_url || 'images/no-image.png'}" style="width:40px; height:40px; object-fit:contain;">
      <div class="text-truncate">
        <strong>${p.product_name}</strong><br>
        <small class="text-muted">${p.brands || ''}</small>
      </div>
    `;
    item.onclick = () => selectProduct(p); // Ürünü seç
    list.appendChild(item);
  });
}

function selectProduct(p) {
  if (activeSlot === 1) product1 = p;
  else product2 = p;
  
  updateSlotUI(activeSlot, p);
  searchModal.hide();
  
  if (product1 && product2) renderComparison();
}

function updateSlotUI(slot, p) {
  const el = document.getElementById(`slot${slot}`);
  el.innerHTML = `
    <div class="position-relative">
        <button class="btn btn-sm btn-circle btn-light position-absolute top-0 end-0 shadow-sm" onclick="clearSlot(${slot})" style="z-index:2">✕</button>
        <img src="${p.image_front_url || 'images/no-image.png'}" class="img-fluid mb-2" style="max-height:150px;">
        <h6 class="fw-bold">${p.product_name}</h6>
    </div>
  `;
}

function clearSlot(slot) {
  if (slot === 1) product1 = null;
  else product2 = null;
  
  // Slotu resetle
  document.getElementById(`slot${slot}`).innerHTML = `
    <div class="d-flex flex-column align-items-center justify-content-center" style="min-height: 200px;">
      <button class="btn btn-outline-primary rounded-circle p-3 mb-2" onclick="openSearchModal(${slot})">
        <span class="material-icons-round fs-2">add</span>
      </button>
      <p class="text-muted">${slot}. Ürünü Seç</p>
    </div>
  `;
  document.getElementById("comparison-table").classList.add("d-none");
}

function renderComparison() {
  const tbody = document.getElementById("comparison-body");
  document.getElementById("comparison-table").classList.remove("d-none");
  
  // Karşılaştırılacak değerler
  const metrics = [
    { key: 'energy-kcal_100g', label: 'Kalori (kcal)', reverse: true }, // Düşük iyidir (Genelde) -> reverse true ise düşük yeşil olur
    { key: 'sugars_100g', label: 'Şeker', reverse: true },
    { key: 'fat_100g', label: 'Yağ', reverse: true },
    { key: 'saturated-fat_100g', label: 'Doymuş Yağ', reverse: true },
    { key: 'proteins_100g', label: 'Protein', reverse: false }, // Yüksek iyidir
    { key: 'fiber_100g', label: 'Lif', reverse: false }
  ];

  let html = "";
  
  metrics.forEach(m => {
    let v1 = product1.nutriments[m.key] || 0;
    let v2 = product2.nutriments[m.key] || 0;
    
    // String gelirse sayıya çevir
    v1 = parseFloat(v1);
    v2 = parseFloat(v2);

    // Renkleri belirle
    let c1 = "text-muted", c2 = "text-muted";
    
    if (v1 !== v2) {
      const v1Better = m.reverse ? v1 < v2 : v1 > v2;
      if (v1Better) {
        c1 = "text-success fs-5"; 
        c2 = "text-danger";
      } else {
        c1 = "text-danger"; 
        c2 = "text-success fs-5";
      }
    }

    html += `
      <tr class="border-bottom">
        <td class="${c1}">${v1}</td>
        <td class="text-muted small text-uppercase py-3">${m.label}</td>
        <td class="${c2}">${v2}</td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
}