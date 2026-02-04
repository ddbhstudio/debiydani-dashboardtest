const PARTNERS = ["Dani", "Debi"];

let state = {
  jobs: [],
  filters: {
    client: "ALL",
    partner: "ALL"
  }
};

let pieChart;

function init(data) {
  state.jobs = data;
  buildClientFilters();
  render();
}

function buildClientFilters() {
  const clients = [...new Set(state.jobs.map(j => j.Cliente))];
  const container = document.getElementById("clientFilters");

  container.innerHTML = `<button data-client="ALL" class="active">Todos</button>`;
  clients.forEach(c => {
    const b = document.createElement("button");
    b.textContent = c;
    b.dataset.client = c;
    container.appendChild(b);
  });

  container.onclick = e => {
    if (!e.target.dataset.client) return;
    state.filters.client = e.target.dataset.client;
    setActive(container, e.target);
    render();
  };

  document.querySelector(".partnerFilters").onclick = e => {
    if (!e.target.dataset.partner) return;
    state.filters.partner = e.target.dataset.partner;
    setActive(e.currentTarget, e.target);
    render();
  };
}

function setActive(container, btn) {
  container.querySelectorAll("button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

function computeBalances() {
  let dani = 0;
  let debi = 0;
  let pending = 0;
  let totalIncome = 0;
  let totalExpenses = 0;

  // INGRESOS
  state.jobs.forEach(j => {
    const amount = Number(j.Monto_USD || 0);
    if (!amount) return;

    totalIncome += amount;

    if (j.Factura === "Dani") dani += amount;
    else if (j.Factura === "Debi") debi += amount;
    else pending += amount;
  });

  // GASTOS / INVERSION
  state.expenses.forEach(e => {
    const amount = Number(e.Monto_USD || 0);
    if (!amount) return;

    totalExpenses += amount;

    if (e.Pagado === "Dani") dani -= amount;
    else if (e.Pagado === "Debi") debi -= amount;
    else pending -= amount;
  });

  return {
    dani,
    debi,
    pending,
    totalIncome,
    totalExpenses,
    totalProfit: totalIncome - totalExpenses
  };
}


  return { dani, debi, external };
}

function render() {
const filteredJobs = state.jobs.filter(j => {
  if (activeFilter === "ALL") return true;
  if (activeFilter === "PENDING") return j.Factura !== "Dani" && j.Factura !== "Debi";
  return j.Factura === activeFilter;
});

function renderDashboard(rows) {
  const { dani, debi, external } = computeBalances(rows);
  const total = dani + debi;

  document.getElementById("daniTotal").textContent = `$${dani.toFixed(2)}`;
  document.getElementById("debiTotal").textContent = `$${debi.toFixed(2)}`;
  document.getElementById("externalTotal").textContent = `$${external.toFixed(2)}`;
  document.getElementById("totalProfit").textContent = `$${total.toFixed(2)}`;

  renderPie(dani, debi, external);
}

function renderPie(dani, debi, external) {
  const ctx = document.getElementById("profitPie");

  if (pieChart) pieChart.destroy();

  pieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Dani", "Debi", "Pendiente"],
      datasets: [{
        data: [dani, debi, external],
        backgroundColor: ["#4aa3ff", "#ff5fa2", "#8a8f98"]
      }]
    }
  });
}

/* INIT MOCK */
init(window.DATA_FROM_SHEETS || []);
