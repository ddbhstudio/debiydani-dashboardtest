console.log("app.js cargado"); // 👈 debug visual

/* ================= PASSWORD ================= */
function unlock() {
  const input = document.getElementById("passwordInput");
  if (!input) {
    alert("Error: input no encontrado");
    return;
  }

  if (input.value === "1234") {
    document.getElementById("lockScreen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    init(); // 👈 recién acá arrancamos todo
  } else {
    alert("Password incorrecto");
  }
}

/* ================= INIT ================= */
async function init() {
  console.log("INIT OK");

  await loadJobs();
  await loadExpenses();
  renderAll();
}

const API_URL =
  "https://script.google.com/macros/s/AKfycbwVVuurS_zh9eIwzxLwfzuyT-8u5rkbS5CYDhEOCmEM8ZnLlUHj67icH6IpOg9_vW_I/exec";

const state = {
  jobs: [],
  expenses: [],
  filter: "ALL", // ALL | Dani | Debi | External
};

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", init);

async function init() {
  await Promise.all([loadJobs(), loadExpenses()]);
  renderAll();
}

/* ================= FETCH ================= */
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

/* ================= CALCULATIONS ================= */
function calculate() {
  let ingresosDani = 0;
  let ingresosDebi = 0;
  let externos = 0;

  state.jobs.forEach((j) => {
    const monto = Number(j.Monto_USD || 0);
    if (j.Factura === "Dani") ingresosDani += monto;
    else if (j.Factura === "Debi") ingresosDebi += monto;
    else externos += monto;
  });

  const gastosTotales = state.expenses.reduce(
    (sum, e) => sum + Number(e.Monto_USD || 0),
    0
  );

  const gastoCompartido = gastosTotales / 2;

  const gananciaDani = ingresosDani - gastoCompartido;
  const gananciaDebi = ingresosDebi - gastoCompartido;

  return {
    ingresosDani,
    ingresosDebi,
    externos,
    gastosTotales,
    gananciaDani,
    gananciaDebi,
  };
}

/* ================= RENDER DASHBOARD ================= */
function renderDashboard() {
  const c = calculate();

  document.getElementById("balance-dani").innerText = format(c.ingresosDani);
  document.getElementById("balance-debi").innerText = format(c.ingresosDebi);
  document.getElementById("balance-total").innerText = format(
    c.ingresosDani + c.ingresosDebi - c.gastosTotales
  );

  document.getElementById("gain-dani").innerText = format(c.gananciaDani);
  document.getElementById("gain-debi").innerText = format(c.gananciaDebi);
  document.getElementById("balance-pending").innerText = format(c.externos);

  const diff = c.gananciaDani - c.gananciaDebi;
  const summary = document.getElementById("balance-summary");

  if (Math.abs(diff) < 0.01) {
    summary.innerText = "Cuentas equilibradas";
  } else {
    const ajuste = Math.abs(diff) / 2;
  
    if (diff > 0) {
      summary.innerText = `Dani le debe a Debi ${format(ajuste)}`;
    } else {
      summary.innerText = `Debi le debe a Dani ${format(ajuste)}`;
    }
  }

}

/* ================= TABLES ================= */
function renderJobs() {
  
  const table1 = document.getElementById("jobsTable");
  if (!table1) return; // 🔒 evita el error que estás viendo
  table1.innerHTML = "";
  table1.innerHTML = `
        <thead>
          <tr>
            <th></th>
            <th class="center">Cliente</th>
            <th class="right">USD</th>
            <th class="center">Notas</th>
          </tr>
        </thead>
        
  
  <tbody>
    
    ${state.jobs
    .filter((j) => {
      if (state.filter === "ALL") return true;
      return j.Factura === state.filter;
    })
    ${.forEach((j) => {
      const tr = document.createElement("tr");
      tr.className =
        j.Factura === "Dani"
          ? "row-dani"
          : j.Factura === "Debi"
          ? "row-debi"
          : "row-external";

      tr.innerHTML = `
        <td>${j.Concepto}</td>
        <td class="center">${j.Cliente || ""}</td>
        <td class="right">${Number(j.Monto_USD).toLocaleString()}</td>
        <td class="center notes">${j.Notas || ""}</td>
      `;
       };
      
      table1.appendChild(tr);
    </tr>`
        )
        .join("")}
    </tbody>
  `;
}

function renderExpenses() {
  const table = document.getElementById("expenses-table");
  if (!table) return;
  table.innerHTML = "";

  table.innerHTML = `
    <thead>
      <tr>
        <th></th>
        <th class="right">USD</th>
        <th class="center">Notas</th>
      </tr>
    </thead>
    <tbody>
      ${state.expenses
        .map(
          (e) => `
        <tr class="${
          e.Pagado === "Dani"
            ? "row-dani"
            : e.Pagado === "Debi"
            ? "row-debi"
            : "row-external"
        }">
          <td>${e.Concepto}</td>
          <td class="right">${Number(e.Monto_USD).toLocaleString()}</td>
          <td class="center notes">${e.Notas || ""}</td>
        </tr>`
        )
        .join("")}
    </tbody>
  `;
}

/* ================= FILTERS ================= */
document.getElementById("card-dani").onclick = () => {
  state.filter = "Dani";
  renderJobs();
  renderExpenses();
};

document.getElementById("card-debi").onclick = () => {
  state.filter = "Debi";
  renderJobs();
  renderExpenses();
};

document.getElementById("card-total").onclick = () => {
  state.filter = "ALL";
  renderJobs();
  renderExpenses();
};

document.getElementById("card-pending").onclick = () => {
  state.filter = "External";
  renderJobs();
  renderExpenses();
};

/* ================= TABS ================= */
function showTab(tab) {
  document.getElementById("jobs").classList.add("hidden");
  document.getElementById("expenses").classList.add("hidden");

  document.querySelectorAll(".tabs button").forEach((b) =>
    b.classList.remove("active")
  );

  document.getElementById(tab).classList.remove("hidden");
  event.target.classList.add("active");
}

/* ================= NEW ENTRY ================= */
function confirmEntry() {
  alert("✔ Transacción lista para enviar (hook pendiente)");
}

/* ================= HELPERS ================= */
function renderAll() {
  renderDashboard();
  renderJobs();
  renderExpenses();
}

function format(n) {
  return Number(n).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}


document.getElementById("unlockBtn")?.addEventListener("click", unlock);
