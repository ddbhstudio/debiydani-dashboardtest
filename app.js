const API_URL = "https://script.google.com/macros/s/AKfycbwVVuurS_zh9eIwzxLwfzuyT-8u5rkbS5CYDhEOCmEM8ZnLlUHj67icH6IpOg9_vW_I/exec";

const state = {
  jobs: [],
  expenses: [],
  pendingPayload: null
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  await Promise.all([loadJobs(), loadExpenses()]);
  renderDashboard();
}

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

function computeBalances() {
  let dani = 0, debi = 0;

  state.jobs.forEach(j => {
    const m = Number(j.Monto_USD || 0);
    dani += m / 2;
    debi += m / 2;

    if (j.Recibio === "Dani") dani -= m;
    if (j.Recibio === "Debi") debi -= m;
  });

  state.expenses.forEach(e => {
    const m = Number(e.Monto_USD || 0);
    dani -= m / 2;
    debi -= m / 2;

    if (e.Pago === "Dani") dani += m;
    if (e.Pago === "Debi") debi += m;
  });

  return { dani, debi };
}

function renderDashboard() {
  const { dani, debi } = computeBalances();
  document.getElementById("balance-dani").innerText = format(dani);
  document.getElementById("balance-debi").innerText = format(debi);

  renderTable("jobs-table", state.jobs, ["Fecha","Concepto","Monto_USD","Recibio","Notas","Pagado"]);
  renderTable("expenses-table", state.expenses, ["Fecha","Concepto","Monto_USD","Pago","Notas"]);
}

function renderTable(id, rows, cols) {
  const table = document.getElementById(id);
  table.innerHTML = "<tr>" + cols.map(c => `<th>${c}</th>`).join("") + "</tr>";
  rows.forEach(r => {
    table.innerHTML += "<tr>" + cols.map(c => `<td>${formatDate(r[c])}</td>`).join("") + "</tr>";
  });
}

function format(n) {
  return "USD " + Number(n).toLocaleString("en-US",{minimumFractionDigits:2});
}

function formatDate(v) {
  if (!v) return "";
  return v.toString().split("T")[0];
}

/* ==== CONFIRM FLOW ==== */

function confirmarTrabajo() {
  const payload = {
    Fecha: document.getElementById("job-fecha").value,
    Concepto: document.getElementById("job-concepto").value,
    Monto_USD: Number(document.getElementById("job-monto").value),
    Recibio: document.getElementById("job-recibio").value,
    Notas: document.getElementById("job-notas").value,
    Pagado: false
  };

  state.pendingPayload = { type: "Jobs", payload };

  document.getElementById("modal-text").innerText =
    `Vas a cargar:\n${payload.Concepto}\nUSD ${payload.Monto_USD}\nRecibió: ${payload.Recibio}\nNotas: ${payload.Notas}`;

  document.getElementById("modal").classList.remove("hidden");
}

async function confirmarEnvio() {
  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(state.pendingPayload),
    headers: { "Content-Type": "application/json" }
  });
  cerrarModal();
  await loadJobs();
  renderDashboard();
}

function cerrarModal() {
  document.getElementById("modal").classList.add("hidden");
}
