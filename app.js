const API_URL = "TU_URL_DEL_SCRIPT";

let state = {
  jobs: [],
  expenses: [],
  filter: "ALL"
};

document.addEventListener("DOMContentLoaded", () => {
  console.log("INIT OK");
});

/* AUTH */
function unlock() {
  const pass = document.getElementById("passwordInput").value;
  if (pass !== "1234") return;

  document.getElementById("lockScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  loadData();
}

/* DATA */
async function loadData() {
  const res = await fetch(API_URL);
  const data = await res.json();

  state.jobs = data.jobs || [];
  state.expenses = data.expenses || [];

  renderAll();
}

/* CALCS */
function calcTotals() {
  let daniIn = 0, debiIn = 0, externalIn = 0;
  let expenses = 0;

  state.jobs.forEach(j => {
    if (j.Factura === "Dani") daniIn += j.USD;
    else if (j.Factura === "Debi") debiIn += j.USD;
    else externalIn += j.USD;
  });

  state.expenses.forEach(e => expenses += e.USD);

  const totalProfit = daniIn + debiIn - expenses;
  const equilibrium = totalProfit / 2;

  return { daniIn, debiIn, externalIn, totalProfit, equilibrium };
}

/* RENDER */
function safeSet(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerText = val;
}

function renderAll() {
  const t = calcTotals();

  safeSet("daniTotal", Math.round(t.daniIn));
  safeSet("debiTotal", Math.round(t.debiIn));
  safeSet("totalProfit", Math.round(t.totalProfit));
  safeSet("externalPending", Math.round(t.externalIn));

  const gainDani = t.daniIn - t.equilibrium;
  const gainDebi = t.debiIn - t.equilibrium;

  safeSet("gain-dani", Math.round(gainDani));
  safeSet("gain-debi", Math.round(gainDebi));

  let balance = "Equilibrado";
  if (gainDani > gainDebi) balance = `Debi le debe a Dani ${Math.round(gainDani)}`;
  if (gainDebi > gainDani) balance = `Dani le debe a Debi ${Math.round(gainDebi)}`;

  safeSet("balanceText", balance);

  renderJobs();
  renderExpenses();
}

/* FILTER */
function setFilter(f) {
  state.filter = f;
  updateTabColor();
  renderJobs();
}

function updateTabColor() {
  const tab = document.getElementById("tab-jobs");
  tab.className = "tab active";

  if (state.filter === "Dani") tab.classList.add("dani");
  else if (state.filter === "Debi") tab.classList.add("debi");
  else tab.classList.add("green");
}

/* TABLES */
function renderJobs() {
  const tb = document.getElementById("jobsTable");
  tb.innerHTML = "";

  state.jobs
    .filter(j => state.filter === "ALL" || j.Factura === state.filter)
    .forEach(j => {
      const tr = document.createElement("tr");
      tr.className =
        j.Factura === "Dani" ? "row-dani" :
        j.Factura === "Debi" ? "row-debi" : "row-external";

      tr.innerHTML = `
        <td></td>
        <td class="center">${j.Cliente || ""}</td>
        <td class="right">${Math.round(j.USD)}</td>
        <td class="notes">${j.Notas || ""}</td>
      `;
      tb.appendChild(tr);
    });
}

function renderExpenses() {
  const tb = document.getElementById("expensesTable");
  tb.innerHTML = "";

  state.expenses.forEach(e => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td></td>
      <td class="right">${Math.round(e.USD)}</td>
      <td class="notes">${e.Notas || ""}</td>
    `;
    tb.appendChild(tr);
  });
}

/* TABS */
function showSection(sec) {
  document.getElementById("jobsSection").classList.toggle("hidden", sec !== "jobs");
  document.getElementById("expensesSection").classList.toggle("hidden", sec !== "expenses");

  document.getElementById("tab-jobs").classList.toggle("active", sec === "jobs");
  document.getElementById("tab-expenses").classList.toggle("active", sec === "expenses");
}

/* NEW ENTRY */
function confirmEntry() {
  alert("✔ Transacción lista para enviar (hook pendiente)");
}
