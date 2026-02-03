const API_URL = "https://script.google.com/macros/s/AKfycbwVVuurS_zh9eIwzxLwfzuyT-8u5rkbS5CYDhEOCmEM8ZnLlUHj67icH6IpOg9_vW_I/exec";

const state = { jobs: [], expenses: [], pending: null };

document.addEventListener("DOMContentLoaded", init);

async function init() {
  await Promise.all([load("Jobs"), load("Expenses")]);
  updateEntryType();
  render();
}

function showTab(id) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

async function load(type) {
  const res = await fetch(`${API_URL}?type=${type}`);
  state[type.toLowerCase()] = await res.json();
}

function compute() {
  let dani = 0, debi = 0;

  state.jobs.forEach(j => {
    const m = Number(j.Monto_USD||0);
    dani += m/2; debi += m/2;
    if (j.Recibio==="Dani") dani -= m;
    if (j.Recibio==="Debi") debi -= m;
  });

  state.expenses.forEach(e => {
    const m = Number(e.Monto_USD||0);
    dani -= m/2; debi -= m/2;
    if (e.Pago==="Dani") dani += m;
    if (e.Pago==="Debi") debi += m;
  });

  return { dani, debi };
}

function render() {
  const { dani, debi } = compute();
  document.getElementById("balance-dani").innerText = usd(dani);
  document.getElementById("balance-debi").innerText = usd(debi);

  const diff = dani - debi;
  const s = document.getElementById("balance-summary");

  if (Math.abs(diff)<0.01) s.innerText="Cuentas equilibradas";
  else if (diff>0) s.innerText=`Debi le debe a Dani ${usd(diff)}`;
  else s.innerText=`Dani le debe a Debi ${usd(-diff)}`;

  draw("jobs-table", state.jobs);
  draw("expenses-table", state.expenses);
}

function draw(id, rows) {
  const t = document.getElementById(id);
  if (!rows.length) return t.innerHTML="";
  const cols = Object.keys(rows[0]);
  t.innerHTML =
    "<tr>"+cols.map(c=>`<th>${c}</th>`).join("")+"</tr>"+
    rows.map(r=>"<tr>"+cols.map(c=>`<td>${r[c]??""}</td>`).join("")+"</tr>").join("");
}

function updateEntryType() {
  const type = document.getElementById("entry-type").value;
  const actor = document.getElementById("actor");
  actor.innerHTML = type==="Jobs"
    ? `<option>Dani</option><option>Debi</option>`
    : `<option>Dani</option><option>Debi</option>`;
}

function confirmarEntrada() {
  const type = document.getElementById("entry-type").value;
  const payload = {
    Fecha: document.getElementById("fecha").value,
    Concepto: document.getElementById("concepto").value,
    Monto_USD: Number(document.getElementById("monto").value),
    Notas: document.getElementById("notas").value,
    ...(type==="Jobs"
      ? { Recibio: document.getElementById("actor").value }
      : { Pago: document.getElementById("actor").value })
  };

  state.pending = { type, payload };
  document.getElementById("modal-text").innerText =
    `${type==="Jobs"?"Trabajo":"Gasto"}\n${payload.Concepto}\nUSD ${payload.Monto_USD}`;
  document.getElementById("modal").classList.remove("hidden");
}

async function enviarEntrada() {
  await fetch(API_URL, {
    method:"POST",
    body: JSON.stringify(state.pending),
    headers:{ "Content-Type":"application/json" }
  });
  cerrarModal();
  await init();
}

function cerrarModal() {
  document.getElementById("modal").classList.add("hidden");
}

function usd(n){return "USD "+Number(n).toLocaleString("en-US",{minimumFractionDigits:2});}
