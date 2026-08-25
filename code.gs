const SHEET_NAME = "Sheet1";   
const PASSWORD   = "MASUKKAN PW ANDA";

function doGet(e) {
  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const idxNama = headers.indexOf("nama");
  const idxKode = headers.indexOf("kode");
  const idxJumlah = headers.indexOf("jumlah");

  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[idxKode]) continue;
    rows.push({
      row: i + 1, 
      nama: row[idxNama],
      kode: row[idxKode],
      jumlah: Number(row[idxJumlah]) || 0
    });
  }
  return jsonOut_(rows);
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut_({ ok: false, error: "Data tidak valid" });
  }

  if (body.password !== PASSWORD) {
    return jsonOut_({ ok: false, error: "Password salah" });
  }

  const sheet = getSheet_();
  const headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(h => String(h).trim().toLowerCase());
  const idxNama = headers.indexOf("nama");
  const idxKode = headers.indexOf("kode");
  const idxJumlah = headers.indexOf("jumlah");

  const actions = Array.isArray(body.actions) ? body.actions : [body];

  const deletes = actions.filter(a => a.action === "delete").sort((a, b) => b.row - a.row);
  const others = actions.filter(a => a.action !== "delete");

  others.forEach(a => {
    if (a.action === "add") {
      const newRow = new Array(headers.length).fill("");
      newRow[idxNama] = a.nama || "";
      newRow[idxKode] = a.kode || "";
      newRow[idxJumlah] = Number(a.jumlah) || 0;
      sheet.appendRow(newRow);
    } else if (a.action === "update") {
      if (idxNama > -1) sheet.getRange(a.row, idxNama + 1).setValue(a.nama || "");
      sheet.getRange(a.row, idxKode + 1).setValue(a.kode || "");
      sheet.getRange(a.row, idxJumlah + 1).setValue(Number(a.jumlah) || 0);
    }
  });

  deletes.forEach(a => {
    sheet.deleteRow(a.row);
  });

  return jsonOut_({ ok: true });
}

function getSheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error("Sheet '" + SHEET_NAME + "' tidak ditemukan");
  return sheet;
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
