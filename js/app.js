// js/app.js - Global Ayarlar ve Dark Mode

// Service Worker Kayıt
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('SW Kayıtlı:', reg.scope))
      .catch(err => console.log('SW Hatası:', err));
  });
}

// === Dark Mode Yönetimi ===
document.addEventListener("DOMContentLoaded", () => {
  // 1. Butonu oluştur
  const toggleBtn = document.createElement("button");
  toggleBtn.id = "darkModeToggle";
  toggleBtn.innerHTML = "🌙"; // Varsayılan ikon
  toggleBtn.title = "Karanlık Modu Aç/Kapa";
  document.body.appendChild(toggleBtn);

  // 2. Kayıtlı temayı kontrol et
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
    document.documentElement.setAttribute("data-theme", "dark");
    toggleBtn.innerHTML = "☀️";
  }

  // 3. Tıklama olayı
  toggleBtn.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    
    if (currentTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
      toggleBtn.innerHTML = "🌙";
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
      toggleBtn.innerHTML = "☀️";
    }
  });
});
// ==========================================
// BARKOD TARAYICI ENTEGRASYONU
// ==========================================

const scanBtn = document.getElementById("scanBtn");
let html5QrcodeScanner;

if (scanBtn) {
  scanBtn.addEventListener("click", () => {
    // 1. Modalı Aç
    const myModal = new bootstrap.Modal(document.getElementById('scannerModal'));
    myModal.show();

    // 2. Tarayıcıyı Başlat (Modal açıldıktan biraz sonra)
    setTimeout(() => {
      startScanner(myModal);
    }, 500);
  });
}

function startScanner(modalInstance) {
  // Eğer zaten çalışıyorsa durdurma hatasını önle
  if (html5QrcodeScanner) { 
    // Temizlemeden yeniden başlatmıyoruz
  }

  html5QrcodeScanner = new Html5Qrcode("reader");

  const config = { fps: 10, qrbox: { width: 250, height: 250 } };
  
  // Arka kamerayı kullan
  html5QrcodeScanner.start(
    { facingMode: "environment" }, 
    config,
    (decodedText, decodedResult) => {
      // --- BAŞARILI OKUMA ---
      console.log(`Barkod okundu: ${decodedText}`);
      
      // 1. Sesi Çal (Bip!)
      playBeep();

      // 2. Tarayıcıyı Durdur
      html5QrcodeScanner.stop().then(() => {
        // 3. Modalı Kapat
        document.getElementById('scannerModal').classList.remove('show');
        document.body.classList.remove('modal-open');
        const backdrops = document.getElementsByClassName('modal-backdrop');
        while(backdrops[0]) { backdrops[0].parentNode.removeChild(backdrops[0]); }
        
        // 4. Ürünü Ara veya Detay Sayfasına Git
        // Eğer barkodsa direkt detaya gitmek daha premium hissettirir
        window.location.href = `detail.html?code=${decodedText}`;
      }).catch(err => console.error("Durdurma hatası", err));
    },
    (errorMessage) => {
      // Okuma hatası (kamera hareket ederken sürekli tetiklenir, loglamaya gerek yok)
    }
  ).catch(err => {
    console.error("Kamera başlatılamadı", err);
    alert("Kameraya erişim izni vermelisiniz.");
  });

  // Modal kapandığında kamerayı da kapat
  document.getElementById('scannerModal').addEventListener('hidden.bs.modal', () => {
    if (html5QrcodeScanner) {
      html5QrcodeScanner.stop().catch(err => console.log(err));
    }
  });
}

// Bip sesi efekti (Market kasası hissi için)
function playBeep() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.type = "sine";
  oscillator.frequency.value = 1000; // Frekans
  gainNode.gain.value = 0.1; // Ses seviyesi

  oscillator.start();
  setTimeout(() => oscillator.stop(), 100);
}
// ==========================================
// BESLENME TERCİHLERİ YÖNETİMİ
// ==========================================

// Sayfa yüklendiğinde kayıtlı tercihleri (checkboxları) doldur
document.addEventListener("DOMContentLoaded", () => {
  const prefs = JSON.parse(localStorage.getItem("nutriscan_prefs")) || {};
  
  if(document.getElementById("pref-vegan")) 
    document.getElementById("pref-vegan").checked = prefs.vegan || false;
    
  if(document.getElementById("pref-gluten")) 
    document.getElementById("pref-gluten").checked = prefs.gluten || false;
    
  if(document.getElementById("pref-palm")) 
    document.getElementById("pref-palm").checked = prefs.palm || false;
});

// Kaydet Butonuna basılınca çalışır
function savePreferences() {
  const prefs = {
    vegan: document.getElementById("pref-vegan").checked,
    gluten: document.getElementById("pref-gluten").checked,
    palm: document.getElementById("pref-palm").checked
  };
  
  localStorage.setItem("nutriscan_prefs", JSON.stringify(prefs));
  
  // Kullanıcıya ufak bir geri bildirim (Toast veya Alert yerine konsol yeterli şimdilik)
  console.log("Tercihler kaydedildi:", prefs);
  
  // Eğer detay sayfasındaysak sayfayı yenile ki uyarılar güncellensin
  if(window.location.pathname.includes("detail.html")) {
    location.reload();
  }
}
// ==========================================
// GEÇMİŞ YÖNETİMİ (ANA SAYFA)
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  renderHistory();
});

function renderHistory() {
  const historySection = document.getElementById("history-section");
  const historyList = document.getElementById("history-list");
  
  // Eğer bu elementler sayfada yoksa (örn: detay sayfasındaysak) çalışma
  if (!historySection || !historyList) return;

  const history = JSON.parse(localStorage.getItem("nutriscan_history")) || [];

  if (history.length === 0) {
    historySection.classList.add("d-none");
    return;
  }

  historySection.classList.remove("d-none");
  historyList.innerHTML = "";

  history.forEach(item => {
    // Nutri-Score Renk
    const scoreColor = {
      'a': 'bg-success', 'b': 'bg-info', 'c': 'bg-warning', 'd': 'bg-orange', 'e': 'bg-danger'
    }[item.score.toLowerCase()] || 'bg-secondary';

    historyList.innerHTML += `
      <div class="card border-0 shadow-sm flex-shrink-0 position-relative" style="width: 140px; cursor:pointer;" onclick="window.location.href='detail.html?code=${item.code}'">
        <div class="position-absolute top-0 end-0 m-1 ${scoreColor} text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 25px; height: 25px; font-size:0.8rem; font-weight:bold;">
          ${item.score.toUpperCase()}
        </div>
        <img src="${item.image}" class="card-img-top p-2" style="height: 100px; object-fit: contain;">
        <div class="card-body p-2 text-center">
          <small class="d-block fw-bold text-truncate">${item.name}</small>
          <small class="text-muted" style="font-size: 0.75rem;">${item.brand}</small>
        </div>
      </div>
    `;
  });
}

function clearHistory() {
  if(confirm("Tarama geçmişini temizlemek istiyor musunuz?")) {
    localStorage.removeItem("nutriscan_history");
    renderHistory();
  }
}
// ==========================================
// 6. ALIŞVERİŞ LİSTESİ YÖNETİMİ (GLOBAL)
// ==========================================
function addToList(code, name, brand, image) {
  const list = JSON.parse(localStorage.getItem("nutriscan_list")) || [];
  
  // Zaten var mı?
  if (list.some(item => item.code === code)) {
    // Bootstrap Toast veya şık bir uyarı daha iyi olur ama şimdilik alert
    alert("Bu ürün zaten listenizde ekli! 📝");
    return;
  }
  
  list.push({ code, name, brand, image, checked: false });
  localStorage.setItem("nutriscan_list", JSON.stringify(list));
  
  if(confirm("✅ Listeye eklendi! Listenize gitmek ister misiniz?")) {
    window.location.href = "list.html";
  }
}