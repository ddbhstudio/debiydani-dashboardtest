const API_URL =
  "https://script.google.com/macros/s/AKfycbwVVuurS_zh9eIwzxLwfzuyT-8u5rkbS5CYDhEOCmEM8ZnLlUHj67icH6IpOg9_vW_I/exec";

const state = {
  jobs: [],
  expenses: [],
};

let activeFilter = "ALL";

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  console.log("App init");
  init();
});

async function init() {
  try {
    await Promise.all([loadJobs(), loadExpenses()]);
    console.log("Jobs:", state.jobs);
    console.log("Expenses:", state.expenses);
    renderAll();
    bindCardFilters();
  } catch (e) {
    console.error("Init error", e);
  }
}

/* =========================
   FETCH
========================= */
async function fetchSheet(type) {
  const res = await fetch(`${API_URL}?type=${type}`);
  if (!res.ok) throw new Error("Fetch error: " + type);
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
  let income = 0;
  let expenses = 0;

  state.jobs.forEach(j => {
    const amount = Number(j.Monto_USD || 0);
    if (!amount) return;

    income += amount;

    if (j.Factura === "Dani") dani += amount;
    else if (j.Factura === "Debi") debi += amount;
    else pending += amount;
  });

  state.expenses.forEach(e => {
    const amount = Number(e.Monto_USD || 0);
    if (!amount) return;

    expenses += amount;

    if (e.Pagado === "Dani") dani -= amount;
    else if (e.Pagado === "Debi") debi -= amount;
    else pending -= amount;
  });

  return {
    dani,
    debi,
    pending,
    total: income - expenses,
  };
}

/* =========================
   FILTERS
========================= */
function bindCardFilters() {
  const map = {
    "card-dani": "Dani",
    "card-debi": "Debi",
    "card-total": "ALL",
    "card-pending": "PENDING",
  };

  Object.entries(map).forEach(([id, filter]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.cursor = "pointer";
    el.addEventListener("click", () => {
      activeFilter = filter;
      renderTables();
    });
  });
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

  setText("balance-dani", b.dani);
  setText("balance-debi", b.debi);
  setText("balance-total", b.total);
  setText("balance-pending", b.pending);
}

function renderTables() {
  let jobs = [...state.jobs];

  if (activeFilter === "Dani")
    jobs = jobs.filter(j => j.Factura === "Dani");
  else if (activeFilter === "Debi")
    jobs = jobs.filter(j => j.Factura === "Debi");
  else if (activeFilter === "PENDING")
    jobs = jobs.filter(j => j.Factura !== "Dani" && j.Factura !== "Debi");

  renderTable("jobs-table", jobs);
  renderTable("expenses-table", state.expenses);
}

function renderTable(id, rows) {
  const table = document.getElementById(id);
  if (!table) return;

  table.innerHTML = `
    <thead>
      <tr>
        <th>Concepto</th>
        <th>Cliente</th>
        <th class="right">USD</th>
        <th>Notas</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement("tbody");

  rows.forEach(r => {
    const tr = document.createElement("tr");

    if (r.Factura === "Dani") tr.className = "row-dani";
    else if (r.Factura === "Debi") tr.className = "row-debi";
    else tr.className = "row-pending";

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

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = format(value);
}
