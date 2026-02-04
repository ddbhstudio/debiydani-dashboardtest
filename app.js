const API_URL =
  "https://script.google.com/macros/s/AKfycbwVVuurS_zh9eIwzxLwfzuyT-8u5rkbS5CYDhEOCmEM8ZnLlUHj67icH6IpOg9_vW_I/exec";

const PASSWORD = "1234";

const state = {
  jobs: [],
  expenses: [],
  filter: "ALL",
};

/* =====================
   INIT
===================== */
document.addEventListener("DOMContentLoaded", init);

async function init() {
  document.getElementById("unlockBtn").onclick = unlock;
  console.log("INIT OK");
}

/* =====================
   LOCK
===================== */
async function unlock() {
  const val = document.getElementById("passwordInput").value;
  if (val !== PASSWORD) return alert("Password incorrecto");

  document.getElementById("lockScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  await loadAll();
  renderAll();
}

/* =====================
   FETCH
===================== */
async function fetchSheet(type) {
  const res = await fetch(`${API_URL}?type=${type}`);
  if (!res.ok) throw new Error("Fetch error");
  return res.json();
}

async function loadAll() {
  state.jobs = await fetchSheet("Jobs");
  state.expenses = await fetchSheet("Expenses");
}

/* =====================
   CALCULATIONS
===================== */
function calcTotals() {
  let daniIn = 0;
  let debiIn = 0;
  let externalIn = 0;
  let expensesTotal = 0;

  state.jobs.forEach(j => {
    const v = Number(j.Monto_USD || 0);
    if (j.Factura === "Dani") daniIn += v;
    else if (j.Factura === "Debi") debiIn += v;
    else externalIn += v;
  });

  state.expenses.forEach(e => {
    expensesTotal += Number(e.Monto_USD || 0);
  });

  const totalIncome = daniIn + debiIn;
  const totalProfit = totalIncome - expensesTotal;
  const equilibrium = totalProfit / 2;

  return {
    daniIn,
    debiIn,
    externalIn,
    expensesTotal,
    totalProfit,
    equilibrium,
  };
}

/* =====================
   RENDER DASHBOARD
===================== */
function renderAll() {
  const t = calcTotals();

  document.getElementById("daniTotal").innerText =
    t.daniIn.toLocaleString("en-US");
  document.getElementById("debiTotal").innerText =
    t.debiIn.toLocaleString("en-US");

  document.getElementById("gain-dani").innerText =
    (t.equilibrium - t.debiIn + t.daniIn).toLocaleString("en-US");

  document.getElementById("gain-debi").innerText =
    (t.equilibrium - t.daniIn + t.debiIn).toLocaleString("en-US");

  let balanceText = "Cuentas equilibradas";
  if (t.daniIn > t.equilibrium) {
    balanceText = `Debi le debe a Dani ${Math.round(
      t.daniIn - t.equilibrium
    ).toLocaleString("en-US")}`;
  } else if (t.debiIn > t.equilibrium) {
    balanceText = `Dani le debe a Debi ${Math.round(
      t.debiIn - t.equilibrium
    ).toLocaleString("en-US")}`;
  }

  document.getElementById("balanceText").innerText = balanceText;
  document.getElementById("externalPending").innerText =
    t.externalIn.toLocaleString("en-US");

  renderJobs();
}

/* =====================
   FILTER
===================== */
function setFilter(val) {
  state.filter = val;
  renderJobs();
}

/* =====================
   TABLES
===================== */
function renderJobs() {
  const tbody = document.getElementById("jobsTable");
  tbody.innerHTML = "";

  state.jobs.forEach(j => {
    if (
      state.filter !== "ALL" &&
      j.Factura !== state.filter
    )
      return;

    const tr = document.createElement("tr");
    tr.className =
      j.Factura === "Dani"
        ? "dani"
        : j.Factura === "Debi"
        ? "debi"
        : "third";

    tr.innerHTML = `
      <td>${j.Concepto || ""}</td>
      <td class="center">${j.Cliente || ""}</td>
      <td class="right">${Number(j.Monto_USD || 0).toLocaleString("en-US")}</td>
      <td class="center notes">${j.Notas || ""}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* =====================
   NEW ENTRY
===================== */
async function confirmEntry() {
  const type = document.getElementById("entryType").value;
  const payload = {
    Concepto: document.getElementById("entryConcept").value,
    Cliente: document.getElementById("entryClient").value,
    Monto_USD: document.getElementById("entryAmount").value,
    Factura: document.getElementById("entryWho").value,
    Notas: document.getElementById("entryNotes").value,
  };

  if (!confirm("¿Confirmar transacción?")) return;

  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ type, payload }),
  });

  await loadAll();
  renderAll();
  alert("Transacción guardada");
}
