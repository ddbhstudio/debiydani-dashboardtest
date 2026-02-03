const API_URL =
  "https://script.google.com/macros/s/AKfycbwVVuurS_zh9eIwzxLwfzuyT-8u5rkbS5CYDhEOCmEM8ZnLlUHj67icH6IpOg9_vW_I/exec";

const state = { jobs: [], expenses: [] };

document.addEventListener("DOMContentLoaded", init);

async function init() {
  await Promise.all([loadJobs(), loadExpenses()]);
  render();
}

/* FETCH */
async function fetchSheet(type) {
  const res = await fetch(`${API_URL}?type=${type}`);
  return res.json();
}

async function loadJobs() {
  state.jobs = await fetchSheet("Jobs");
}

async function loadExpenses() {
  state.expenses = await fetchSheet("Expenses");
}

/* BALANCES */
function computeBalances() {
  let dani = 0;
  let debi = 0;

  state.jobs.forEach(j => {
    const a = Number(j.Monto_USD || 0) / 2;
    dani += a;
    debi += a;
    if (j.Pagado === "Dani") dani -= a * 2;
    if (j.Pagado === "Debi") debi -= a * 2;
  });

  state.expenses.forEach(e => {
    const a = Number(e.Monto_USD || 0) / 2;
    dani -= a;
    debi -= a;
    if (e.Pagado === "Dani") dani += a * 2;
    if (e.Pagado === "Debi") debi += a * 2;
  });

  return { dani, debi };
}

/* RENDER */
function render() {
  const { dani, debi } = computeBalances();
  document.getElementById("balance-dani").innerText = format(dani);
  document.getElementById("balance-debi").innerText = format(debi);

  const diff = dani - debi;
  const summary = document.getElementById("balance-summary");
  summary.innerText =
    diff > 0
      ? `Debi le debe a Dani USD ${format(diff)}`
      : diff < 0
      ? `Dani le debe a Debi USD ${format(Math.abs(diff))}`
      : "Cuentas equilibradas";

  renderTable("jobs-table", state.jobs);
  renderTable("expenses-table", state.expenses);
}

function renderTable(id, rows) {
  const table = document.getElementById(id);
  table.innerHTML = `
    <tr>
      <th>Concepto</th>
      <th>USD</th>
      <th>Notas</th>
    </tr>
  `;

  rows.forEach(r => {
    table.innerHTML += `
      <tr>
        <td>${r.Concepto}</td>
        <td>${format(r.Monto_USD)}</td>
        <td style="opacity:.6;font-size:12px">${r.Notas || ""}</td>
      </tr>
    `;
  });
}

/* ENTRY */
async function confirmarEntrada() {
  const type = document.getElementById("entry-type").value;

  const payload = {
    Fecha: document.getElementById("entry-fecha").value,
    Concepto: document.getElementById("entry-concepto").value,
    Monto_USD: Number(document.getElementById("entry-monto").value),
    Pagado: document.getElementById("entry-persona").value,
    Notas: document.getElementById("entry-notas").value,
  };

  if (!payload.Fecha || !payload.Concepto || !payload.Monto_USD) return;

  if (!confirm(`Confirmar ${type} USD ${payload.Monto_USD}?`)) return;

  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ type, payload }),
    headers: { "Content-Type": "application/json" },
  });

  await init();
  limpiarEntrada();
}

function limpiarEntrada() {
  document.querySelectorAll(".entry-bar input").forEach(i => (i.value = ""));
}

/* UTILS */
function format(n) {
  return "USD " + Number(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
  });
}

function showTab(tab) {
  document.getElementById("jobs-table").classList.toggle("hidden", tab !== "jobs");
  document.getElementById("expenses-table").classList.toggle("hidden", tab !== "expenses");
}
