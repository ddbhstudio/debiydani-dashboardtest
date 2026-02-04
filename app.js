console.log("app.js cargado");

const API_URL = "https://script.google.com/macros/s/AKfycbwVVuurS_zh9eIwzxLwfzuyT-8u5rkbS5CYDhEOCmEM8ZnLlUHj67icH6IpOg9_vW_I/exec"; // PEGÁ TU URL ACÁ

let state = {
  jobs: [],
  expenses: [],
  filter: "ALL"
};

/* ========= AUTH ========= */
window.unlock = function unlock() {
  const pass = document.getElementById("passwordInput").value;

  if (pass !== "1234") {
    alert("Password incorrecto");
    return;
  }

  document.getElementById("lockScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  loadData();
};

/* ========= DATA ========= */
async function loadData() {
  const res = await fetch(API_URL);
  const data = await res.json();

  state.jobs = data.jobs || [];
  state.expenses = data.expenses || [];

  renderAll();
}

/* ========= CALCS ========= */
function calcTotals() {
  let daniIn = 0;
  let debiIn = 0;
  let externalIn = 0;
  let expenses = 0;

  state.jobs.forEach(j => {
    if (j.Factura === "Dani") daniIn += j.USD;
    else if (j.Factura === "Debi") debiIn += j.USD;
    else externalIn += j.USD;
  });

  state.expenses.forEach(e => {
    expenses += e.USD;
  });

  const totalProfit = daniIn + debiIn - expenses;
  const equilibrium = totalProfit / 2;

  return { daniIn, debiIn, externalIn, expenses, totalProfit, equilibrium };
}

/* ========= RENDER ========= */
function renderAll() {
  const t = calcTotals();

  set("daniTotal", t.daniIn);
  set("debiTotal", t.debiIn);
  set("totalProfit", t.totalProfit);
  set("externalPending", t.externalIn);

  const gainDani = t.daniIn - t.equilibrium;
  const gainDebi = t.debiIn - t.equilibrium;

  set("gain-dani", gainDani);
  set("gain-debi", gainDebi);

  let balance = "Equilibrado";
  if (gainDani > gainDebi) balance = `Debi le debe a Dani ${Math.round(gainDani)}`;
  if (gainDebi > gainDani) balance = `Dani le debe a Debi ${Math.round(gainDebi)}`;

  set("balanceText", balance);

  renderJobs();
  renderExpenses();
}

function set(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerText = Math.round(val);
}

/* ========= FILTER ========= */
window.setFilter = function (f) {
  state.filter = f;
  updateTabColor();
  renderJobs();
};

function updateTabColor() {
  const tab = document.getElementById("tab-jobs");
  tab.className = "tab active";

  if (state.filter === "Dani") tab.classList.add("dani");
  else if (state.filter === "Debi") tab.classList.add("debi");
  else tab.classList.add("green");
}

/* ========= TABLES ========= */
function renderJobs() {
  const tb = document.getElementById("jobsTable");
  tb.innerHTML = "";

  state.jobs
    .filter(j => state.filter === "ALL" || j.Factura === state.filter)
    .forEach(j => {
      const tr = document.createElement("tr");
      tr.className =
        j.Factura === "Dani"
          ? "row-dani"
          : j.Factura === "Debi"
          ? "row-debi"
          : "row-external";

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

/* ========= TABS ========= */
window.showSection = function (sec) {
  document.getElementById("jobsSection").classList.toggle("hidden", sec !== "jobs");
  document.getElementById("expensesSection").classList.toggle("hidden", sec !== "expenses");

  document.getElementById("tab-jobs").classList.toggle("active", sec === "jobs");
  document.getElementById("tab-expenses").classList.toggle("active", sec === "expenses");
};

/* ========= NEW ENTRY ========= */
window.confirmEntry = function () {
  alert("✔ Transacción lista para enviar (hook pendiente)");
};

