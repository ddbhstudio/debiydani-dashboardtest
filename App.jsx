const API_URL = "https://script.google.com/macros/s/AKfycbwVVuurS_zh9eIwzxLwfzuyT-8u5rkbS5CYDhEOCmEM8ZnLlUHj67icH6IpOg9_vW_I/exec"

export default function App() {
  const load = async () => {
    const r = await fetch(API_URL + "?type=Jobs")
    const d = await r.json()
    alert("Jobs cargados: " + d.length)
  }

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Debi & Dani</h1>
      <button onClick={load}>Cargar trabajos</button>
    </div>
  )
}
