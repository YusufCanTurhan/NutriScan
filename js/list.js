// js/list.js
document.addEventListener("DOMContentLoaded", renderList);

function renderList() {
  const container = document.getElementById("shopping-list");
  const list = JSON.parse(localStorage.getItem("nutriscan_list")) || [];

  if (list.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5 text-muted">
        <span class="material-icons-round fs-1">shopping_basket</span>
        <p class="mt-2">Listeniz henüz boş. Ürünleri keşfedip ekleyin.</p>
        <a href="products.html" class="btn btn-primary mt-2">Ürünlere Git</a>
      </div>`;
    return;
  }

  container.innerHTML = "";
  
  list.forEach((item, index) => {
    container.innerHTML += `
      <div class="col-md-6 col-lg-4">
        <div class="card border-0 shadow-sm d-flex flex-row align-items-center p-2 h-100 ${item.checked ? 'bg-light opacity-50' : ''}">
          <div class="form-check ms-2">
            <input class="form-check-input" type="checkbox" style="transform: scale(1.3);" 
              ${item.checked ? 'checked' : ''} onchange="toggleCheck(${index})">
          </div>
          <img src="${item.image}" class="rounded ms-3" style="width: 60px; height: 60px; object-fit: contain;">
          <div class="card-body py-1">
            <h6 class="mb-0 fw-bold ${item.checked ? 'text-decoration-line-through' : ''}">${item.name}</h6>
            <small class="text-muted">${item.brand}</small>
          </div>
          <button class="btn btn-sm text-danger" onclick="removeItem(${index})">
            <span class="material-icons-round">delete</span>
          </button>
        </div>
      </div>
    `;
  });
}

function toggleCheck(index) {
  const list = JSON.parse(localStorage.getItem("nutriscan_list")) || [];
  list[index].checked = !list[index].checked;
  localStorage.setItem("nutriscan_list", JSON.stringify(list));
  renderList();
}

function removeItem(index) {
  const list = JSON.parse(localStorage.getItem("nutriscan_list")) || [];
  list.splice(index, 1);
  localStorage.setItem("nutriscan_list", JSON.stringify(list));
  renderList();
}

function clearList() {
  if(confirm("Tüm listeyi silmek istiyor musunuz?")) {
    localStorage.removeItem("nutriscan_list");
    renderList();
  }
}