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

function computeBalances(rows) {
  let dani = 0, debi = 0, external = 0;

  rows.forEach(r => {
    const amount = Number(r.USD);
    if (!PARTNERS.includes(r.Pagado)) {
      external += amount;
      return;
    }

    if (r.Pagado === "Dani") {
      dani += amount / 2;
      debi -= amount / 2;
    } else {
      debi += amount / 2;
      dani -= amount / 2;
    }
  });

  return { dani, debi, external };
}

function render() {
  let rows = [...state.jobs];

  if (state.filters.client !== "ALL") {
    rows = rows.filter(r => r.Cliente === state.filters.client);
  }

  if (state.filters.partner !== "ALL") {
    if (state.filters.partner === "EXTERNAL") {
      rows = rows.filter(r => !PARTNERS.includes(r.Pagado));
    } else {
      rows = rows.filter(r => r.Pagado === state.filters.partner);
    }
  }

  renderTable(rows);
  renderDashboard(rows);
}

function renderTable(rows) {
  const tbody = document.getElementById("jobsTable");
  tbody.innerHTML = "";

  rows.forEach(r => {
    const tr = document.createElement("tr");

    if (r.Pagado === "Dani") tr.className = "dani";
    else if (r.Pagado === "Debi") tr.className = "debi";
    else tr.className = "external";

    tr.innerHTML = `
      <td>${r.Concepto}</td>
      <td>${r.Cliente}</td>
      <td class="right">${Number(r.USD).toLocaleString()}</td>
      <td class="notes">${r.Notas || ""}</td>
    `;
    tbody.appendChild(tr);
  });
}

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
