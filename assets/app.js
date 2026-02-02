// ✨ Debi & Dani Dashboard — versión UI mejorada
// App React lista para GitHub Pages

import React, { useState, useEffect } from "react";

const SHEETS_API = "https://script.google.com/macros/s/AKfycbwVVuurS_zh9eIwzxLwfzuyT-8u5rkbS5CYDhEOCmEM8ZnLlUHj67icH6IpOg9_vW_I/exec";

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({ title: "", amount: "", date: "" });

  useEffect(() => {
    fetch(`${SHEETS_API}?type=Jobs`)
      .then(r => r.json())
      .then(d => Array.isArray(d) && setJobs(d));
  }, []);

  const total = jobs.reduce((sum, j) => sum + Number(j.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-indigo-700">Debi & Dani</h1>
          <p className="text-slate-600">Dashboard simple de trabajos y facturación</p>
        </header>

        <section className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-semibold text-lg mb-4">➕ Nuevo trabajo</h2>
            <input
              placeholder="Concepto"
              className="w-full mb-3 p-2 border rounded"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
            <input
              placeholder="Monto ARS"
              type="number"
              className="w-full mb-3 p-2 border rounded"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
            />
            <input
              type="date"
              className="w-full mb-3 p-2 border rounded"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
            />
            <button className="w-full bg-indigo-600 text-white py-2 rounded-lg opacity-50 cursor-not-allowed">
              Guardar (Sheets solo lectura)
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow p-6 flex flex-col justify-center items-center">
            <p className="text-slate-500">Total facturado</p>
            <p className="text-3xl font-bold text-indigo-600">${total.toLocaleString()} ARS</p>
          </div>

          <div className="bg-white rounded-2xl shadow p-6 flex flex-col justify-center items-center">
            <p className="text-slate-500">Trabajos cargados</p>
            <p className="text-3xl font-bold">{jobs.length}</p>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow p-6">
          <h2 className="font-semibold text-xl mb-4">📋 Trabajos</h2>
          {jobs.length === 0 ? (
            <p className="text-slate-500">No hay trabajos cargados aún.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Concepto</th>
                  <th className="p-2">Fecha</th>
                  <th className="p-2">Monto</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j, i) => (
                  <tr key={i} className="border-b last:border-none">
                    <td className="p-2">{j.title || j.Concepto || "—"}</td>
                    <td className="p-2">{j.date || j.Fecha || "—"}</td>
                    <td className="p-2 font-medium">${Number(j.amount || j.Monto || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <footer className="text-center text-sm text-slate-500 mt-8">
          Debi & Dani · dashboard experimental · Google Sheets backend
        </footer>
      </div>
    </div>
  );
}
