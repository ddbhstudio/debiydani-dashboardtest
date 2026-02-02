const API_URL =
  "https://script.google.com/macros/s/AKfycbwVVuurS_zh9eIwzxLwfzuyT-8u5rkbS5CYDhEOCmEM8ZnLlUHj67icH6IpOg9_vW_I/exec";

const loadBtn = document.getElementById("loadJobs");
const jobsCount = document.getElementById("jobsCount");
const jobsList = document.getElementById("jobsList");

loadBtn.addEventListener("click", async () => {
  jobsList.innerHTML = "";
  jobsCount.textContent = "Cargando...";

  try {
    const res = await fetch(`${API_URL}?type=Jobs`);
    const data = await res.json();

    jobsCount.textContent = `Trabajos cargados: ${data.length}`;

    if (data.length === 0) {
      jobsList.innerHTML = "<li>No hay trabajos aún</li>";
      return;
    }

    data.forEach(job => {
      const li = document.createElement("li");
      li.textContent = `${job.Cliente || "Cliente"} — ${job.Monto || 0}`;
      jobsList.appendChild(li);
    });

  } catch (err) {
    jobsCount.textContent = "Error cargando datos";
    console.error(err);
  }
});
