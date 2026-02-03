function renderJobs(jobs) {
  const tbody = document.querySelector("#jobsTable tbody");
  tbody.innerHTML = "";

  let dani = 0;
  let debi = 0;

  jobs.forEach(j => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${j.Cliente}</td>
      <td>${j.Concepto}</td>
      <td>$${j.Monto}</td>
      <td>${j.Facturo}</td>
    `;
    tbody.appendChild(tr);

    if (j.Facturo === "Dani") dani += Number(j.Monto);
    if (j.Facturo === "Debi") debi += Number(j.Monto);
  });

  document.getElementById("totalDani").textContent = `Dani: $${dani}`;
  document.getElementById("totalDebi").textContent = `Debi: $${debi}`;
}
