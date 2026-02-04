const API_URL =  "https://script.google.com/macros/s/AKfycbwVVuurS_zh9eIwzxLwfzuyT-8u5rkbS5CYDhEOCmEM8ZnLlUHj67icH6IpOg9_vW_I/exec";

const state = {
  jobs: [],
  expenses: [],
};

let activeFilter = "ALL";

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", init);

async function init() {
  await Promise.all([loadJobs(), loadExpenses()]);
  renderAll();
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
   BALANCES
========================= */
function computeBalances() {
  let dani = 0;
  let debi = 0;
  let pending = 0;
  let totalIncome = 0;
  let totalExpenses = 0;

  // INGRESOS
  state.jobs.forEach(j => {
    const amount = Number(j.Monto_USD || 0);
    if (!amount) return;

    totalIncome += amount;

    if (j.Factura === "Dani") dani += amount;
    else if (j.Factura === "Debi") debi += amount;
    else pending += amount;
  });

  // GASTOS / INVERSION
  state.expenses.forEach(e => {
    const amount = Number(e.Monto_USD || 0);
    if (!amount) return;

    totalExpenses += amount;

    if (e.Pagado === "Dani") dani -= amount;
    else if (e.Pagado === "Debi") debi -= amount;
    else pending -= amount;
  });

  return {
    dani,
    debi,
    pending,
    totalIncome,
    totalExpenses,
    totalProfit: totalIncome - totalExpenses
  };
}

/* =========================
   FILTERS
========================= */
function setFilter(f) {
  activeFilter = f;
  renderTables();
}

/* =========================
   RENDER
========================= */
function renderAll() {
  renderDashboard();
  renderTables();
}

function renderDashboard() {
  const b = computeBalances();

  document.getElementById("balance-dani").innerText = format(b.dani);
  document.getElementById("balance-debi").innerText = format(b.debi);
  document.getElementById("balance-total").innerText = format(b.totalProfit);
  document.getElementById("balance-pending").innerText = format(b.pending);
}

function renderTables() {
  let jobs = [...state.jobs];

  if (activeFilter === "Dani") {
    jobs = jobs.filter(j => j.Factura === "Dani");
  } else if (activeFilter === "Debi") {
    jobs = jobs.filter(j => j.Factura === "Debi");
  } else if (activeFilter === "PENDING") {
    jobs = jobs.filter(j => j.Factura !== "Dani" && j.Factura !== "Debi");
  }

  renderTable("jobs-table", jobs);
  renderTable("expenses-table", state.expenses);
}

function renderTable(id, rows) {
  const table = document.getElementById(id);
  table.innerHTML = "";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Concepto</th>
      <th>Cliente</th>
      <th class="right">USD</th>
      <th>Notas</th>
    </tr>`;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  rows.forEach(r => {
    const tr = document.createElement("tr");

    if (r.Factura === "Dani") tr.classList.add("row-dani");
    else if (r.Factura === "Debi") tr.classList.add("row-debi");
    else tr.classList.add("row-pending");

    tr.innerHTML = `
      <td>${r.Concepto || ""}</td>
      <td>${r.Cliente || ""}</td>
      <td class="right">${format(r.Monto_USD)}</td>
      <td class="notes">${r.Notas || ""}</td>
    `;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
}

/* =========================
   UTILS
========================= */
function format(n) {
  return Number(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
