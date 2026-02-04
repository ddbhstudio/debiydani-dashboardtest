const API_URL = "https://script.google.com/macros/s/AKfycbwVVuurS_zh9eIwzxLwfzuyT-8u5rkbS5CYDhEOCmEM8ZnLlUHj67icH6IpOg9_vW_I/exec"; // PEGÁ TU URL ACÁ

let state = {
  jobs: [],
  expenses: []
};

/* PASSWORD */
window.unlock = function () {
  const pass = document.getElementById("passwordInput").value;
  if (pass !== "1234") {
    alert("Password incorrecto");
    return;
  }

  document.getElementById("lockScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  loadData();
};

/* LOAD */
async function loadData() {
  const jobsRes = await fetch(`${API_URL}?type=Jobs`);
  const expRes = await fetch(`${API_URL}?type=Expenses`);

  state.jobs = await jobsRes.json();
  state.expenses = await expRes.json();

  renderAll();
}

/* RENDER */
function renderAll() {
  renderJobs();
  renderExpenses();
}

function renderJobs() {
  const tbody = document.getElementById("jobsTable");
  if (!tbody) return;

  tbody.innerHTML = "";

  state.jobs.forEach(j => {
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
      <td class="right">${Math.round(j.Monto_USD || j.USD || 0)}</td>
      <td class="center">${j.Notas || ""}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderExpenses() {
  const tbody = document.getElementById("expensesTable");
  if (!tbody) return;

  tbody.innerHTML = "";

  state.expenses.forEach(e => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td></td>
      <td class="right">${Math.round(e.Monto_USD || e.USD || 0)}</td>
      <td class="center">${e.Notas || ""}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* TABS */
window.showSection = function (s) {
  document.getElementById("jobsSection").classList.toggle("hidden", s !== "jobs");
  document.getElementById("expensesSection").classList.toggle("hidden", s !== "expenses");
};


