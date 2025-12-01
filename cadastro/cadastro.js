const $ = (sel) => document.querySelector(sel);
const form = $('#registerForm');
const msgBox = $('#error');

function showMessage(text, tipo = 'error') {
  msgBox.textContent = text;
  if (tipo === 'success') {
    msgBox.style.color = '#8be08b';
  } else {
    msgBox.style.color = 'red';
  }
}
function clearMessage() { msgBox.textContent = ''; }

async function hashSHA256(str) {
  // tenta usar Web Crypto API
  if (window.crypto && crypto.subtle && typeof crypto.subtle.digest === 'function') {
    try {
      const enc = new TextEncoder();
      const buf = await crypto.subtle.digest('SHA-256', enc.encode(str));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
    } catch (err) {
      // se falhar por algum motivo, cair para o fallback
      console.warn('crypto.subtle.digest falhou, usando fallback JS', err);
    }
  }
  // fallback JS puro
  return sha256_fallback(str);
}

/* ==========================
   SHA-256 fallback (JS puro)
   implementação compacta suficiente para demo
   ========================== */

// função auxiliar: right rotate
function ROTR(n, x) { return (x >>> n) | (x << (32 - n)); }

function sha256_fallback(ascii) {
  // constants
  const K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ];

  // pre-processing
  let msg = unescape(encodeURIComponent(ascii)); // UTF8
  const msgLen = msg.length;
  const words = [];
  for (let i = 0; i < msgLen; i++) words[i >> 2] |= msg.charCodeAt(i) << ((3 - i) % 4) * 8;
  // append 1 bit (0x80) then zeros, then length
  words[msgLen >> 2] |= 0x80 << ((3 - msgLen) % 4) * 8;
  const bitLen = msgLen * 8;
  // pad to 512-bit blocks, length occupies last two words
  words[((Math.ceil((msgLen + 9) / 64) * 16) + 15)] = bitLen;

  // initial hash values
  let H0 = 0x6a09e667, H1 = 0xbb67ae85, H2 = 0x3c6ef372, H3 = 0xa54ff53a;
  let H4 = 0x510e527f, H5 = 0x9b05688c, H6 = 0x1f83d9ab, H7 = 0x5be0cd19;

  // process each 512-bit chunk
  for (let i = 0; i < words.length; i += 16) {
    const W = new Array(64);
    for (let t = 0; t < 16; t++) W[t] = words[i + t] | 0;
    for (let t = 16; t < 64; t++) {
      const s0 = (ROTR(7, W[t - 15]) ^ ROTR(18, W[t - 15]) ^ (W[t - 15] >>> 3)) >>> 0;
      const s1 = (ROTR(17, W[t - 2]) ^ ROTR(19, W[t - 2]) ^ (W[t - 2] >>> 10)) >>> 0;
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
    }

    let a = H0, b = H1, c = H2, d = H3, e = H4, f = H5, g = H6, h = H7;
    for (let t = 0; t < 64; t++) {
      const S1 = (ROTR(6, e) ^ ROTR(11, e) ^ ROTR(25, e)) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const temp1 = (h + S1 + ch + K[t] + W[t]) >>> 0;
      const S0 = (ROTR(2, a) ^ ROTR(13, a) ^ ROTR(22, a)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const temp2 = (S0 + maj) >>> 0;

      h = g; g = f; f = e; e = (d + temp1) >>> 0;
      d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }

    H0 = (H0 + a) >>> 0;
    H1 = (H1 + b) >>> 0;
    H2 = (H2 + c) >>> 0;
    H3 = (H3 + d) >>> 0;
    H4 = (H4 + e) >>> 0;
    H5 = (H5 + f) >>> 0;
    H6 = (H6 + g) >>> 0;
    H7 = (H7 + h) >>> 0;
  }

  // produce hex string
  const hex = [H0,H1,H2,H3,H4,H5,H6,H7].map(h => ('00000000' + h.toString(16)).slice(-8)).join('');
  return hex;
}

/* ==========================
   localStorage helpers
   ========================== */
function loadUsers() {
  try { return JSON.parse(localStorage.getItem('usuarios') || '[]'); }
  catch (e) { console.error('Erro parse localStorage', e); return []; }
}
function saveUsers(list) { localStorage.setItem('usuarios', JSON.stringify(list)); }
function isValidEmail(email) { return /^\S+@\S+\.\S+$/.test(email); }

/* ==========================
   submit handler
   ========================== */
form.addEventListener('submit', async function (ev) {
  ev.preventDefault();
  clearMessage();

  const fd = new FormData(form);
  const name = (fd.get('name') || '').trim();
  const emailRaw = (fd.get('email') || '').trim();
  const email = emailRaw.toLowerCase();
  const password = fd.get('password') || '';
  const confirmPassword = fd.get('confirm_password') || '';

  // validações
  if (name.length < 2) { showMessage('Nome muito curto. Informe pelo menos 2 caracteres.'); return; }
  if (!isValidEmail(email)) { showMessage('Email inválido.'); return; }
  if (password.length < 6) { showMessage('Senha deve ter no mínimo 6 caracteres.'); return; }
  if (password !== confirmPassword) { showMessage('As senhas não coincidem.'); return; }

  const users = loadUsers();
  if (users.some(u => u.email === email)) { showMessage('Este email já está cadastrado.'); return; }

  try {
    showMessage('Cadastrando...', 'success');
    const passwordHash = await hashSHA256(password);

    const id = Date.now().toString(36) + Math.random().toString(36).slice(2,7);
    const now = new Date().toISOString();

    const user = { id, name, email, passwordHash, createdAt: now };
    users.push(user);
    saveUsers(users);

    showMessage('Cadastrado com sucesso! Você pode fazer login agora.', 'success');
    form.reset();

    // descomente se quiser redirecionar automaticamente
    // setTimeout(() => window.location.href = '/login/index.html', 900);

  } catch (err) {
    console.error(err);
    showMessage('Erro durante o cadastro. Veja console para detalhes.');
  }
});
