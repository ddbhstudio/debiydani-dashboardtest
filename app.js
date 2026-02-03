const API_URL = "https://script.google.com/macros/s/AKfycbwVVuurS_zh9eIwzxLwfzuyT-8u5rkbS5CYDhEOCmEM8ZnLlUHj67icH6IpOg9_vW_I/exec";

function limpiarFormTrabajo() {
  document.getElementById("job-fecha").value = "";
  document.getElementById("job-concepto").value = "";
  document.getElementById("job-monto").value = "";
  document.getElementById("job-pagado").value = "Dani";
}

async function crearTrabajoDesdeForm() {
  const fecha = document.getElementById("job-fecha").value;
  const concepto = document.getElementById("job-concepto").value;
  const monto = document.getElementById("job-monto").value;
  const pagado = document.getElementById("job-pagado").value;

  if (!fecha || !concepto || !monto) {
    alert("Completá todos los campos");
    return;
  }

  const body = {
    type: "Jobs",
    payload: {
      Fecha: fecha,
      Concepto: concepto,
      Monto_USD: Number(monto),
      Pagado: pagado,
      Notas: ""
    }
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" }
    });

    const json = await res.json();

    if (json.status !== "ok") {
      alert("Error al guardar");
      return;
    }

    await loadJobs();
    renderDashboard();
    limpiarFormTrabajo();
  } catch (err) {
    alert("Error de red");
    console.error(err);
  }
}

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
   FETCH DATA
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
function computeBalances() {
  let dani = 0;
  let debi = 0;

  // JOBS
  state.jobs.forEach((j) => {
    const amount = Number(j.Monto_USD || 0);
    const half = amount / 2;

    dani += half;
    debi += half;

    if (j.Pagado === "Dani") {
      dani -= amount;
    }
    if (j.Pagado === "Debi") {
      debi -= amount;
    }
  });

  // EXPENSES
  state.expenses.forEach((e) => {
    const amount = Number(e.Monto_USD || 0);
    const half = amount / 2;

    dani -= half;
    debi -= half;

    if (e.Pagado === "Dani") {
      dani += amount;
    }
    if (e.Pagado === "Debi") {
      debi += amount;
    }
  });

  return { dani, debi };
}

/* =========================
   RENDER
========================= */
function renderDashboard() {
  const { dani, debi } = computeBalances();
  const diff = dani - debi;

  document.getElementById("balance-dani").innerText = format(dani);
  document.getElementById("balance-debi").innerText = format(debi);

  const summary = document.getElementById("balance-summary");
  if (Math.abs(diff) < 0.01) {
    summary.innerText = "Cuentas equilibradas";
  } else if (diff > 0) {
    summary.innerText = `Debi le debe a Dani USD ${format(diff)}`;
  } else {
    summary.innerText = `Dani le debe a Debi USD ${format(Math.abs(diff))}`;
  }

  renderTable("jobs-table", state.jobs, [
    "Fecha",
    "Concepto",
    "Monto_USD",
    "Pagado",
  ]);

  renderTable("expenses-table", state.expenses, [
    "Fecha",
    "Concepto",
    "Monto_USD",
    "Pagado",
  ]);
}

function renderTable(id, rows, cols) {
  const table = document.getElementById(id);
  table.innerHTML = "";

  const thead = document.createElement("thead");
  thead.innerHTML =
    "<tr>" + cols.map((c) => `<th>${c}</th>`).join("") + "</tr>";
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  rows.forEach((r) => {
    const tr = document.createElement("tr");
    cols.forEach((c) => {
      const td = document.createElement("td");
      td.innerText = r[c] ?? "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
}

/* =========================
   UTILS
========================= */
function format(n) {
  return Number(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
