/* ============================================================
   THE ROBIN HOOD LEADERBOARD — tampilan
   ============================================================
   Sumber data: APPS_SCRIPT_URL (diisi di config.js). Kalau
   masih kosong, situs memakai data.csv di folder ini sebagai
   cadangan supaya halaman tetap bisa ditampilkan.
   ============================================================ */

const FALLBACK_CSV_PATH = "data.csv";
const LOW_VALUE_THRESHOLD = 500000; // di bawah ini ditampilkan "< Rp 500.000"

async function loadData() {
  if (typeof APPS_SCRIPT_URL !== "undefined" && APPS_SCRIPT_URL.trim()) {
    const res = await fetch(APPS_SCRIPT_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Gagal mengambil data (" + res.status + ")");
    const rows = await res.json();
    return rows.map((r) => ({ kode: r.kode, jumlah: Number(r.jumlah) || 0 }));
  }

  const res = await fetch(FALLBACK_CSV_PATH, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal mengambil data (" + res.status + ")");
  const text = await res.text();
  return parseCsv(text);
}

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const idxKode = header.indexOf("kode");
  const idxJumlah = header.indexOf("jumlah");

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length < header.length) continue;

    const kode = (cols[idxKode] || "").trim();
    const jumlahRaw = (cols[idxJumlah] || "").trim();
    const jumlah = Number(jumlahRaw.replace(/[^0-9.-]/g, ""));

    if (!kode || Number.isNaN(jumlah)) continue;

    rows.push({ kode, jumlah });
  }
  return rows;
}

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function formatRupiah(n) {
  return "Rp " + Math.round(n).toLocaleString("id-ID").replace(/,/g, ".");
}

function render(rows) {
  const tbody = document.getElementById("boardBody");
  const totalEl = document.getElementById("totalValue");

  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="3" class="error-row">Belum ada data.</td></tr>';
    totalEl.textContent = formatRupiah(0);
    return;
  }

  const sorted = [...rows].sort((a, b) => b.jumlah - a.jumlah);
  const total = sorted.reduce((sum, r) => sum + r.jumlah, 0);

  tbody.innerHTML = sorted
    .map((r, i) => {
      const rank = i + 1;
      const rankClass = rank <= 3 ? ` rank-${rank}` : "";
      const idrDisplay =
        r.jumlah < LOW_VALUE_THRESHOLD
          ? `&lt; ${formatRupiah(LOW_VALUE_THRESHOLD)}`
          : formatRupiah(r.jumlah);

      return `<tr class="${rankClass.trim()}">
        <td class="col-rank">${rank}</td>
        <td class="col-hood"><span class="hood-chip">${escapeHtml(r.kode)}</span></td>
        <td class="col-idr">${idrDisplay}</td>
      </tr>`;
    })
    .join("");

  totalEl.textContent = formatRupiah(total);

  const note = document.getElementById("updatedNote");
  const now = new Date();
  note.textContent =
    "Terakhir dimuat: " +
    now.toLocaleString("id-ID", {
      dateStyle: "long",
      timeStyle: "short",
    });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function init() {
  try {
    const rows = await loadData();
    render(rows);
  } catch (err) {
    console.error(err);
    document.getElementById("boardBody").innerHTML =
      '<tr><td colspan="3" class="error-row">Gagal memuat data. Cek koneksi internet atau APPS_SCRIPT_URL di config.js.</td></tr>';
  }
}

init();
