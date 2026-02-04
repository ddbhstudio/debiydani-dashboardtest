const API_URL =
  "https://script.google.com/macros/s/AKfycbwVVuurS_zh9eIwzxLwfzuyT-8u5rkbS5CYDhEOCmEM8ZnLlUHj67icH6IpOg9_vW_I/exec";

const state = {
  jobs: [],
  expenses: [],
};

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", init);

async function init() {
  await Promise.all([loadJobs(), loadExpenses()]);
  renderDashboard();
}

/* =========================
   FETCH
========================= */
async function fetchSheet(type) {
  const res = await fetch(`${API_URL}?type=${type}`);
  if (!res.ok) throw new Error("Fetch error");
  return res.json();
}

async function loadJobs() {
  const data = await fetchSheet("Jobs");
  state.jobs = Array.isArray(data) ? data : [];
}

async function loadExpenses() {
  const data = await fetchSheet("Expenses");
  state.expenses = Array.isArray(data) ? data : [];
}

/* =========================
   CALCULATIONS
========================= */
function computeTotals() {
  let ingresosDani = 0;
  let ingresosDebi = 0;
  let ingresosExternos = 0;
  let gastosTotales = 0;

  state.jobs.forEach((j) => {
    const amount = Number(j.Monto_USD || 0);
    if (j.Factura === "Dani") ingresosDani += amount;
    else if (j.Factura === "Debi") ingresosDebi += amount;
    else ingresosExternos += amount;
  });

  state.expenses.forEach((e) => {
    gastosTotales += Number(e.Monto_USD || 0);
  });

  const ingresosCompartidos = ingresosDani + ingresosDebi;

  const gananciaDani =
    ingresosCompartidos / 2 - gastosTotales / 2;
  const gananciaDebi =
    ingresosCompartidos / 2 - gastosTotales / 2;

  const gananciaTotal =
    ingresosCompartidos - gastosTotales;

  const diferencia = ingresosDani - ingresosDebi;

  return {
    ingresosDani,
    ingresosDebi,
    ingresosExternos,
    gastosTotales,
    gananciaDani,
    gananciaDebi,
    gananciaTotal,
    diferencia,
  };
}

/* =========================
   RENDER
========================= */
function renderDashboard() {
  const t = computeTotals();

  // Tarjetas principales
  setText("balance-dani", t.ingresosDani);
  setText("balance-debi", t.ingresosDebi);
  setText("balance-total", t.gananciaTotal);
  setText("balance-pending", t.ingresosExternos);

  // Subtexto ganancias
  setText("gain-dani", t.gananciaDani);
  setText("gain-debi", t.gananciaDebi);

  // Balance
  const balanceEl = document.getElementById("balance-summary");
  if (Math.abs(t.diferencia) < 1) {
    balanceEl.innerText = "Cuentas equilibradas";
  } else if (t.diferencia > 0) {
    balanceEl.innerText = `Debi le debe a Dani USD ${format(
      t.diferencia
    )}`;
  } else {
    balanceEl.innerText = `Dani le debe a Debi USD ${format(
      Math.abs(t.diferencia)
    )}`;
  }

  renderJobsTable();
  renderExpensesTable();
}

/* =========================
   TABLES
========================= */
function renderJobsTable() {
  const table = document.getElementById("jobs-table");
  table.innerHTML = "";

  const headers = ["", "Cliente", "USD", "Notas"];

  table.innerHTML +=
    "<thead><tr>" +
    headers.map((h) => `<th>${h}</th>`).join("") +
    "</tr></thead>";

  const tbody = document.createElement("tbody");

  state.jobs.forEach((j) => {
    const tr = document.createElement("tr");

    if (j.Factura === "Dani") tr.classList.add("row-dani");
    else if (j.Factura === "Debi") tr.classList.add("row-debi");
    else tr.classList.add("row-external");

    tr.innerHTML = `
      <td>${j.Concepto || ""}</td>
      <td class="center">${j.Cliente || ""}</td>
      <td class="right">${format(j.Monto_USD)}</td>
      <td class="notes">${j.Notas || ""}</td>
    `;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
}

function renderExpensesTable() {
  const table = document.getElementById("expenses-table");
  table.innerHTML = "";

  const headers = ["", "USD", "Notas"];

  table.innerHTML +=
    "<thead><tr>" +
    headers.map((h) => `<th>${h}</th>`).join("") +
    "</tr></thead>";

  const tbody = document.createElement("tbody");

  state.expenses.forEach((e) => {
    const tr = document.createElement("tr");

    if (e.Pagado === "Dani") tr.classList.add("row-dani");
    else if (e.Pagado === "Debi") tr.classList.add("row-debi");

    tr.innerHTML = `
      <td>${e.Concepto || ""}</td>
      <td class="right">${format(e.Monto_USD)}</td>
      <td class="notes">${e.Notas || ""}</td>
    `;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
}

/* =========================
   UTILS
========================= */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = format(value);
}

function format(n) {
  return Math.round(Number(n || 0)).toLocaleString("en-US");
}
