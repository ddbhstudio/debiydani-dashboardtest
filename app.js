console.log("app.js cargado"); // 👈 debug visual

let monthlyChart = null;
let monthsFilter = 6;


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

/* ================= GRAPHS ================= */
function getMonthlyData(filter = "all") {
  const map = {};

  state.jobs.forEach(j => {
    const who = j.Factura;
    if (filter === "dani" && who !== "Dani") return;
    if (filter === "debi" && who !== "Debi") return;
    if (who !== "Dani" && who !== "Debi") return;

    const date = new Date(j.Fecha);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!map[key]) {
      map[key] = { dani: 0, debi: 0 };
    }

    const amount = Number(j.Monto_USD) || 0;
    if (who === "Dani") map[key].dani += amount;
    if (who === "Debi") map[key].debi += amount;
  });

  const labels = Object.keys(map).sort();
  const dani = labels.map(m => map[m].dani);
  const debi = labels.map(m => map[m].debi);
  const total = labels.map((_, i) => dani[i] + debi[i]);

  return { labels, dani, debi, total };
}



function groupJobsByMonth() {
  const now = new Date();
  const map = {};

  state.jobs.forEach((j) => {
    if (!j.Fecha) return;

    const d = new Date(j.Fecha);
    const diffMonths =
      (now.getFullYear() - d.getFullYear()) * 12 +
      (now.getMonth() - d.getMonth());

    if (diffMonths >= monthsFilter) return;

    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    if (!map[key]) {
      map[key] = { dani: 0, debi: 0 };
    }

    const amount = Number(j.Monto_USD || 0);

    if (j.Factura === "Dani") map[key].dani += amount;
    if (j.Factura === "Debi") map[key].debi += amount;
  });

  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month,
      dani: v.dani,
      debi: v.debi,
      total: v.dani + v.debi,
    }));
}

function renderMonthlyChart(filter = "all") {
  const ctx = document.getElementById("monthlyChart");
  if (!ctx) return;

  const data = getMonthlyData(filter);

  if (monthlyChart) {
    monthlyChart.destroy();
  }

  monthlyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.labels,
      datasets: [
        {
          label: "Dani",
          data: data.dani,
          borderColor: "#4fc3f7",
          backgroundColor: "rgba(79,195,247,0.15)",
          tension: 0.35,
          fill: false
        },
        {
          label: "Debi",
          data: data.debi,
          borderColor: "#f48fb1",
          backgroundColor: "rgba(244,143,177,0.15)",
          tension: 0.35,
          fill: false
        },
        {
          label: "Total",
          data: data.total,
          borderColor: "#66bb6a",
          backgroundColor: "rgba(102,187,106,0.2)",
          tension: 0.35,
          borderWidth: 3,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { boxWidth: 12 }
        }
      },
      scales: {
        y: {
          ticks: {
            callback: v => Math.round(v)
          }
        }
      }
    }
  });
}


function setMonths(m) {
  monthsFilter = m;

  document
    .querySelectorAll(".chart-filters button")
    .forEach((b) => b.classList.remove("active"));

  event.target.classList.add("active");

  renderMonthlyChart();
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
  const table = document.getElementById("jobsTable");
  if (!table) return;

  table.innerHTML = `
    <thead>
      <tr>
        <th></th>
        <th class="center">Cliente</th>
        <th class="right">USD</th>
        <th class="center">Notas</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");

  state.jobs
    .filter((j) => {
      if (state.filter === "ALL") return true;
      if (state.filter === "External")
        return j.Factura !== "Dani" && j.Factura !== "Debi";
      return j.Factura === state.filter;
    })
    .forEach((j) => {
      const tr = document.createElement("tr");

      tr.className =
        j.Factura === "Dani"
          ? "row-dani"
          : j.Factura === "Debi"
          ? "row-debi"
          : "row-external";

      tr.innerHTML = `
        <td>${j.Concepto || ""}</td>
        <td class="center">${j.Cliente || ""}</td>
        <td class="right">${Number(j.Monto_USD || 0).toLocaleString()}</td>
        <td class="center notes">${j.Notas || ""}</td>
      `;

      tbody.appendChild(tr);
    });
}


function renderExpenses() {
  const table = document.getElementById("expenses-table");
  if (!table) return;

  table.innerHTML = `
    <thead>
      <tr>
        <th></th>
        <th class="right">USD</th>
        <th class="center">Notas</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");

  state.expenses
    .filter((e) => {
      if (state.filter === "ALL") return true;
      if (state.filter === "External")
        return e.Pagado !== "Dani" && e.Pagado !== "Debi";
      return e.Pagado === state.filter;
    })
    .forEach((e) => {
      const tr = document.createElement("tr");

      tr.className =
        e.Pagado === "Dani"
          ? "row-dani"
          : e.Pagado === "Debi"
          ? "row-debi"
          : "row-external";

      tr.innerHTML = `
        <td>${e.Concepto || ""}</td>
        <td class="right">${Number(e.Monto_USD || 0).toLocaleString()}</td>
        <td class="center notes">${e.Notas || ""}</td>
      `;

      tbody.appendChild(tr);
    });
}


/* ================= FILTERS ================= */
document.getElementById("card-dani").onclick = () => {
  state.filter = "Dani";
  renderJobs();
  renderExpenses();
  renderMonthlyChart("Dani")
};

document.getElementById("card-debi").onclick = () => {
  state.filter = "Debi";
  renderJobs();
  renderExpenses();
  renderMonthlyChart("Debi")
};

document.getElementById("card-total").onclick = () => {
  state.filter = "ALL";
  renderJobs();
  renderExpenses();
  renderMonthlyChart("Total")
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
  renderPieChart(c);
  renderMonthlyChart();
}

function format(n) {
  return Number(n).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}


function testMonthly() {
  const ctx = document.getElementById("monthlyChart");
  if (!ctx) return;

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Ene", "Feb", "Mar", "Abr"],
      datasets: [
        {
          label: "Dani",
          data: [2000, 3000, 2500, 4000],
          backgroundColor: "#4fc3f7"
        },
        {
          label: "Debi",
          data: [1800, 2200, 2600, 3500],
          backgroundColor: "#f48fb1"
        },
        {
          label: "Total",
          data: [3800, 5200, 5100, 7500],
          backgroundColor: "#66bb6a"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", testMonthly);

document.getElementById("unlockBtn")?.addEventListener("click", unlock);
