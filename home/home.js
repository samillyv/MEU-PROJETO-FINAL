// ====================== HEADER (Hamburger + Logout) ======================
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburgerBtn');
  const mainNav = document.getElementById('mainNav');
  const logoutBtn = document.getElementById('btnLogout');

  if (hamburger && mainNav) {
    hamburger.addEventListener('click', () => {
      const expanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', String(!expanded));
      mainNav.classList.toggle('show');
      hamburger.classList.toggle('open');
    });

    document.addEventListener('click', (ev) => {
      if (!mainNav.classList.contains('show')) return;
      const target = ev.target;
      if (!mainNav.contains(target) && !hamburger.contains(target)) {
        mainNav.classList.remove('show');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('meuPet.user');
      window.location.href = "../login/index.html";
    });
  }
});

// ====================== ESTATÍSTICAS ======================
(function statsModule() {
  const KEY = 'meuPet.pets.v1';
  const elTotal = document.getElementById('totalPets');
  const elVac = document.getElementById('petsVacinados');
  const elLast = document.getElementById('ultimoCadastro');
  const elMostrando = document.getElementById('mostrando') || document.getElementById('tableInfo');

  function loadAllPets() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }

  function formatDate(ts) {
    if (!ts) return '—';
    const d = new Date(Number(ts));
    if (isNaN(d)) return '—';
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }

  function updatePetStats() {
    const all = loadAllPets();
    const total = all.length;
    const vac = all.filter(p => !!p.vaccinated).length;

    let lastText = '—';
    if (all.length > 0) {
      let last = all.reduce((acc, cur) => {
        const a = Number(acc.createdAt || 0);
        const b = Number(cur.createdAt || 0);
        return b > a ? cur : acc;
      }, all[0]);
      lastText = `${last.name || '—'} — ${formatDate(last.createdAt)}`;
    }

    if (elTotal) elTotal.textContent = total;
    if (elVac) elVac.textContent = vac;
    if (elLast) elLast.textContent = lastText;

    if (elMostrando) {
      const searchInput = document.getElementById('quickSearch') || document.getElementById('searchInput');
      let filteredCount = total;
      if (searchInput && searchInput.value) {
        const q = searchInput.value.trim().toLowerCase();
        filteredCount = all.filter(p =>
          (p.name?.toLowerCase().includes(q)) ||
          (p.species?.toLowerCase().includes(q)) ||
          (p.owner?.toLowerCase().includes(q))
        ).length;
      }
      elMostrando.textContent = `Mostrando ${filteredCount} de ${total}`;
    }
  }

  window.updatePetStats = updatePetStats;
  window.addEventListener('storage', (ev) => { if (ev.key === KEY) updatePetStats(); });

  const searchInput = document.getElementById('quickSearch') || document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect') || document.getElementById('ordenar');
  if (searchInput) searchInput.addEventListener('input', updatePetStats);
  if (sortSelect) sortSelect.addEventListener('change', updatePetStats);

  updatePetStats();
})();

// ====================== CARROSSEL ======================
(function setupCarousel() {
  const KEY = 'meuPet.pets.v1';
  const carousel = document.getElementById('petsCarousel');
  const prev = document.getElementById('carouselPrev');
  const next = document.getElementById('carouselNext');
  const info = document.getElementById('tableInfo');
  const sortSelect = document.getElementById('sortSelect');
  const searchInput = document.getElementById('quickSearch');

  if (!carousel) return;

  function loadAll() {
    try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : []; }
    catch { return []; }
  }

  function sortAndFilter(arr) {
    const q = (searchInput && searchInput.value || '').trim().toLowerCase();
    const mode = (sortSelect && sortSelect.value) || 'recent';
    let filtered = arr.filter(p => {
      if (!q) return true;
      return (p.name && p.name.toLowerCase().includes(q)) ||
             (p.species && p.species.toLowerCase().includes(q)) ||
             (p.owner && p.owner.toLowerCase().includes(q));
    });
    if (mode === 'name') filtered.sort((a,b)=> (a.name||'').localeCompare(b.name||''));
    else if (mode === 'age') filtered.sort((a,b)=> (b.age||0)-(a.age||0));
    else filtered.sort((a,b)=> (b.createdAt||0)-(a.createdAt||0));
    return filtered;
  }

  function esc(s){ return s==null ? '' : String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function createCard(p) {
  const div = document.createElement('article');
  div.className = 'pet-card';
  div.setAttribute('role','listitem');
  div.innerHTML = `
    <img src="${esc(p.photo || '')}" alt="${esc(p.name||'pet')}" class="pet-photo" onerror="this.onerror=null;this.src='../img/placeholder.png'">
    <div class="pet-basic">
      <div class="name">${esc(p.name||'—')}</div>
      <div class="meta">${esc(p.species||'—')} • ${esc(p.breed||'—')} • ${esc(p.age||'—')} anos</div>
    </div>

    <div class="card-actions">
      <button class="more-btn" data-id="${esc(p.id)}">Mais informações</button>
      <button class="edit-btn" data-id="${esc(p.id)}">Editar</button>
      <button class="delete-btn" data-id="${esc(p.id)}">Excluir</button>
      <label><input type="checkbox" class="vaccinated" data-id="${esc(p.id)}" ${p.vaccinated?'checked':''}> Vacinado</label>
    </div>

    <div class="pet-details" id="details-${esc(p.id)}">
      <div><strong>Tutor:</strong> ${esc(p.owner||'—')}</div>
      <div><strong>Telefone:</strong> ${esc(p.phone||'—')}</div>
      <div><strong>Observações:</strong> ${esc(p.notes||'—')}</div>
    </div>
  `;
  return div;
}


  function renderCarousel() {
    const all = loadAll();
    const list = sortAndFilter(all);
    carousel.innerHTML = '';
    if (!list.length) {
      carousel.innerHTML = `<div style="padding:18px;color:#6b7280">Nenhum pet cadastrado.</div>`;
    } else {
      list.forEach(p => carousel.appendChild(createCard(p)));
    }
    if (info) info.textContent = `Mostrando ${list.length} de ${all.length}`;
  }

  // Delegação de eventos
  carousel.addEventListener('click', (ev) => {
    const more = ev.target.closest('.more-btn');
    const edit = ev.target.closest('.edit-btn');
    const del = ev.target.closest('.delete-btn');
    const vacc = ev.target.closest('.vaccinated');

    if (more) {
      const id = more.dataset.id;
      const details = document.getElementById('details-' + id);
      if (details) details.classList.toggle('show');
      const card = more.closest('.pet-card');
      if (card) card.scrollIntoView({behavior:'smooth',inline:'center'});
      return;
    }

    if (edit) {
      const id = edit.dataset.id;
      openPopitEdit(id);
      return;
    }

  if (del) {
  const id = del.dataset.id;

  if (confirm("Tem certeza que deseja excluir este pet?")) {
    const pets = loadAll().filter(p => String(p.id) !== String(id));
    localStorage.setItem(KEY, JSON.stringify(pets));
    renderCarousel();
    window.updatePetStats();
  }

  return;
}

    if (vacc) {
      const id = vacc.dataset.id;
      const pets = loadAll().map(p => {
        if (String(p.id) === String(id)) p.vaccinated = vacc.checked;
        return p;
      });
      localStorage.setItem(KEY, JSON.stringify(pets));
      window.updatePetStats();
    }
  });

  prev && prev.addEventListener('click', ()=> scrollByPage(-1));
  next && next.addEventListener('click', ()=> scrollByPage(1));
  sortSelect && sortSelect.addEventListener('change', renderCarousel);
  searchInput && searchInput.addEventListener('input', renderCarousel);

  function scrollByPage(direction=1){
    const gap = 12;
    const visible = carousel.clientWidth;
    const delta = Math.round(visible + gap);
    carousel.scrollBy({left: delta * direction, behavior:'smooth'});
  }

  window.renderCarousel = renderCarousel;
  renderCarousel();
})();

// ====================== POP-IT ADICIONAR / EDITAR PET ======================
const popit = document.getElementById('popitAddPet');

document.getElementById('navAddPet').addEventListener('click', e => {
  e.preventDefault();
  clearPopitFields();
  popit.style.display = 'block';
  setupAddPet();
});

document.getElementById('popitCancel').addEventListener('click', () => {
  popit.style.display = 'none';
  clearPopitFields();
});

// Remove listeners antigos
function clearPopitSaveListener() {
  const saveBtn = document.getElementById('popitSave');
  const newBtn = saveBtn.cloneNode(true); // clona sem listeners
  saveBtn.parentNode.replaceChild(newBtn, saveBtn);
  return newBtn;
}

function setupAddPet() {
  const saveBtn = clearPopitSaveListener();
  saveBtn.addEventListener('click', addPetDefault);
}

function addPetDefault() {
  const pets = JSON.parse(localStorage.getItem('meuPet.pets.v1') || '[]');
  const fileInput = document.getElementById('popitPhoto');
  const reader = new FileReader();

  reader.onload = function(e) {
    const newPet = {
      id: Date.now(),
      name: document.getElementById('popitName').value,
      species: document.getElementById('popitSpecies').value,
      breed: document.getElementById('popitBreed').value,
      age: document.getElementById('popitAge').value,
      owner: document.getElementById('popitOwner').value,
      phone: document.getElementById('popitPhone').value,
      notes: document.getElementById('popitNotes').value,
      vaccinated: false,
      createdAt: Date.now(),
      photo: e.target.result
    };
    pets.unshift(newPet);
    localStorage.setItem('meuPet.pets.v1', JSON.stringify(pets));
    window.renderCarousel();
    window.updatePetStats();
    popit.style.display = 'none';
    clearPopitFields();
  };

  if (fileInput.files && fileInput.files[0]) {
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    const newPet = {
      id: Date.now(),
      name: document.getElementById('popitName').value,
      species: document.getElementById('popitSpecies').value,
      breed: document.getElementById('popitBreed').value,
      age: document.getElementById('popitAge').value,
      owner: document.getElementById('popitOwner').value,
      phone: document.getElementById('popitPhone').value,
      notes: document.getElementById('popitNotes').value,
      vaccinated: false,
      createdAt: Date.now(),
      photo: null
    };
    pets.unshift(newPet);
    localStorage.setItem('meuPet.pets.v1', JSON.stringify(pets));
    window.renderCarousel();
    window.updatePetStats();
    popit.style.display = 'none';
    clearPopitFields();
  }
}

function openPopitEdit(id) {
  const pets = JSON.parse(localStorage.getItem('meuPet.pets.v1') || '[]');
  const pet = pets.find(p => String(p.id) === String(id));
  if (!pet) return;

  popit.style.display = 'block';
  document.getElementById('popitName').value = pet.name;
  document.getElementById('popitSpecies').value = pet.species;
  document.getElementById('popitBreed').value = pet.breed;
  document.getElementById('popitAge').value = pet.age;
  document.getElementById('popitOwner').value = pet.owner;
  document.getElementById('popitPhone').value = pet.phone;
  document.getElementById('popitNotes').value = pet.notes;

  const saveBtn = clearPopitSaveListener();
  saveBtn.addEventListener('click', () => {
    pet.name = document.getElementById('popitName').value;
    pet.species = document.getElementById('popitSpecies').value;
    pet.breed = document.getElementById('popitBreed').value;
    pet.age = document.getElementById('popitAge').value;
    pet.owner = document.getElementById('popitOwner').value;
    pet.phone = document.getElementById('popitPhone').value;
    pet.notes = document.getElementById('popitNotes').value;

    localStorage.setItem('meuPet.pets.v1', JSON.stringify(pets));
    window.renderCarousel();
    window.updatePetStats();
    popit.style.display = 'none';
    clearPopitFields();

    setupAddPet(); // volta para salvar novos pets
  });
  document.getElementById('popitPhoto').value = '';
}

function clearPopitFields() {
  ['popitName','popitSpecies','popitBreed','popitAge','popitOwner','popitPhone','popitNotes'].forEach(id => {
    document.getElementById(id).value = '';
  });
}

// ====================== EXCLUIR TODOS ======================
document.getElementById('btnDeleteAll')?.addEventListener('click', () => {
  if (confirm('Tem certeza que deseja excluir todos os pets?')) {
    localStorage.removeItem('meuPet.pets.v1');
    window.renderCarousel();
    window.updatePetStats();
  }
});
