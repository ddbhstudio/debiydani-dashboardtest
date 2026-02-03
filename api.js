const API_URL =
  "https://script.google.com/macros/s/AKfycbwVVuurS_zh9eIwzxLwfzuyT-8u5rkbS5CYDhEOCmEM8ZnLlUHj67icH6IpOg9_vW_I/exec";

async function getJobs() {
  const res = await fetch(`${API_URL}?type=Jobs`);
  return res.json();
}

async function createJob(data) {
  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ type: "Jobs", data })
  });
}

function unlock() {
  const p = document.getElementById("pass").value;
  if (p === "1234") {
    localStorage.setItem("vault_unlocked", "1");
    document.getElementById("lock").style.display = "none";
    document.getElementById("app").style.display = "block";
    init();
  } else {
    document.getElementById("err").innerText = "Password incorrecto";
  }
}

if (localStorage.getItem("vault_unlocked") === "1") {
  document.getElementById("lock").style.display = "none";
  document.getElementById("app").style.display = "block";
  init();
}
