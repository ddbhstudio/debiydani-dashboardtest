document.addEventListener("DOMContentLoaded", async () => {
  load();

  document.getElementById("jobForm").addEventListener("submit", async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    await createJob(data);
    e.target.reset();
    load();
  });

  document.querySelectorAll("nav button").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
      document.getElementById(btn.dataset.tab).classList.add("active");
      btn.classList.add("active");
    };
  });
});

async function load() {
  const jobs = await getJobs();
  renderJobs(jobs);
}
