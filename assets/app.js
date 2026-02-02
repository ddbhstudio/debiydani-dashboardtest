
const API = "https://script.google.com/macros/s/AKfycbwVVuurS_zh9eIwzxLwfzuyT-8u5rkbS5CYDhEOCmEM8ZnLlUHj67icH6IpOg9_vW_I/exec";

document.getElementById("root").innerHTML = `
  <div style="padding:32px">
    <h1 style="color:#fff">Debi & Dani</h1>
    <button id="load">Cargar trabajos</button>
    <pre id="out"></pre>
  </div>
`;

document.getElementById("load").onclick = async () => {
  try {
    const r = await fetch(API + "?type=Jobs");
    const d = await r.json();
    document.getElementById("out").textContent =
      "Trabajos cargados: " + d.length;
  } catch (e) {
    document.getElementById("out").textContent = "Error de conexión";
  }
};
