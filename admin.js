/* ============================================================
   ADMIN — logika halaman kelola data
   ============================================================ */

const REMEMBER_KEY = "rhl_admin_password";

let originalRows = [];   // data asli dari server: {row, nama, kode, jumlah}
let workingRows = [];    // salinan yang sedang diedit, tiap item punya _id lokal
let deletedRows = [];    // baris asli yang dihapus (punya .row dari server)
let nextLocalId = 1;

const loginPanel = document.getElementById("loginPanel");
const editorPanel = document.getElementById("editorPanel");
const passwordInput = document.getElementById("passwordInput");
const rememberBox = document.getElementById("rememberBox");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");
const editorBody = document.getElementById("editorBody");
const statusMsg = document.getElementById("statusMsg");

function requireConfig() {
  if (typeof APPS_SCRIPT_URL === "undefined" || !APPS_SCRIPT_URL.trim()) {
    loginError.textContent =
      "APPS_SCRIPT_URL belum diisi di config.js. Lihat README.md untuk setup backend.";
    loginBtn.disabled = true;
    return false;
  }
  return true;
}

async function fetchRows() {
  const res = await fetch(APPS_SCRIPT_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal mengambil data (" + res.status + ")");
  return res.json();
}

async function postAction(payload) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // hindari CORS preflight
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Gagal menyimpan");
  return data;
}

function getPassword() {
  return passwordInput.value.trim();
}

async function login() {
  loginError.textContent = "";
  const pwd = getPassword();
  if (!pwd) {
    loginError.textContent = "Masukkan password dulu.";
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Memeriksa…";

  try {
    // verifikasi password dengan mencoba aksi kosong (tidak mengubah apa-apa)
    await postAction({ password: pwd, actions: [] });

    if (rememberBox.checked) {
      localStorage.setItem(REMEMBER_KEY, pwd);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }

    loginPanel.hidden = true;
    editorPanel.hidden = false;
    await loadAndRender();
  } catch (err) {
    loginError.textContent = err.message || "Password salah.";
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Masuk";
  }
}

async function loadAndRender() {
  statusMsg.textContent = "";
  editorBody.innerHTML = '<tr><td colspan="4" class="loading-row">Memuat data…</td></tr>';
  try {
    const rows = await fetchRows();
    originalRows = rows;
    workingRows = rows.map((r) => ({ ...r, _id: "srv-" + r.row, _dirty: false, _new: false }));
    deletedRows = [];
    renderTable();
  } catch (err) {
    editorBody.innerHTML =
      '<tr><td colspan="4" class="error-row">Gagal memuat data: ' + escapeHtml(err.message) + "</td></tr>";
  }
}

function renderTable() {
  if (!workingRows.length) {
    editorBody.innerHTML = '<tr><td colspan="4" class="error-row">Belum ada peserta. Klik "Tambah Peserta".</td></tr>';
    return;
  }

  editorBody.innerHTML = workingRows
    .map((r) => {
      const cls = r._new ? "row-new" : r._dirty ? "row-dirty" : "";
      return `<tr class="${cls}" data-id="${r._id}">
        <td><input type="text" class="f-nama" value="${escapeAttr(r.nama || "")}" placeholder="Nama"></td>
        <td><input type="text" class="f-kode" value="${escapeAttr(r.kode || "")}" placeholder="Xx" maxlength="4"></td>
        <td><input type="number" class="f-jumlah" value="${r.jumlah || 0}" step="1000"></td>
        <td><button class="row-delete" title="Hapus" aria-label="Hapus">✕</button></td>
      </tr>`;
    })
    .join("");
}

function markDirty(id) {
  const row = workingRows.find((r) => r._id === id);
  if (row && !row._new) row._dirty = true;
  const tr = editorBody.querySelector(`tr[data-id="${id}"]`);
  if (tr && !row._new) tr.classList.add("row-dirty");
}

editorBody.addEventListener("input", (e) => {
  const tr = e.target.closest("tr");
  if (!tr) return;
  const id = tr.dataset.id;
  const row = workingRows.find((r) => r._id === id);
  if (!row) return;

  if (e.target.classList.contains("f-nama")) row.nama = e.target.value;
  if (e.target.classList.contains("f-kode")) row.kode = e.target.value;
  if (e.target.classList.contains("f-jumlah")) row.jumlah = Number(e.target.value) || 0;

  markDirty(id);
});

editorBody.addEventListener("click", (e) => {
  if (!e.target.classList.contains("row-delete")) return;
  const tr = e.target.closest("tr");
  const id = tr.dataset.id;
  const idx = workingRows.findIndex((r) => r._id === id);
  if (idx === -1) return;

  const [removed] = workingRows.splice(idx, 1);
  if (!removed._new) deletedRows.push(removed);
  renderTable();
});

document.getElementById("addRowBtn").addEventListener("click", () => {
  workingRows.push({
    _id: "new-" + nextLocalId++,
    row: null,
    nama: "",
    kode: "",
    jumlah: 0,
    _new: true,
    _dirty: false,
  });
  renderTable();
  const rows = editorBody.querySelectorAll("tr");
  const last = rows[rows.length - 1];
  const firstInput = last && last.querySelector("input");
  if (firstInput) firstInput.focus();
});

document.getElementById("saveBtn").addEventListener("click", async () => {
  const actions = [];

  workingRows.forEach((r) => {
    if (r._new) {
      if (!r.kode) return; // lewati baris kosong yang belum diisi
      actions.push({ action: "add", nama: r.nama, kode: r.kode, jumlah: r.jumlah });
    } else if (r._dirty) {
      actions.push({ action: "update", row: r.row, nama: r.nama, kode: r.kode, jumlah: r.jumlah });
    }
  });

  deletedRows.forEach((r) => {
    actions.push({ action: "delete", row: r.row });
  });

  if (!actions.length) {
    setStatus("Tidak ada perubahan untuk disimpan.", "ok");
    return;
  }

  const saveBtn = document.getElementById("saveBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Menyimpan…";
  setStatus("", "");

  try {
    await postAction({ password: getPassword(), actions });
    setStatus("Perubahan tersimpan ✓", "ok");
    await loadAndRender();
  } catch (err) {
    setStatus("Gagal menyimpan: " + err.message, "err");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Simpan Perubahan";
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem(REMEMBER_KEY);
  editorPanel.hidden = true;
  loginPanel.hidden = false;
  passwordInput.value = "";
  rememberBox.checked = false;
});

loginBtn.addEventListener("click", login);
passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") login();
});

function setStatus(msg, kind) {
  statusMsg.textContent = msg;
  statusMsg.className = "admin-status" + (kind ? " " + kind : "");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}

(function init() {
  if (!requireConfig()) return;
  const saved = localStorage.getItem(REMEMBER_KEY);
  if (saved) {
    passwordInput.value = saved;
    rememberBox.checked = true;
    login();
  }
})();
