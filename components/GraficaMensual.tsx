"use client"; // Obligatorio porque Recharts usa interactividad del cliente

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function GraficaMensual() {
  // Datos de las evaluaciones mensuales
  const datosMensuales = [
    { mes: 'Ene', cantidad: 12 },
    { mes: 'Feb', cantidad: 19 },
    { mes: 'Mar', cantidad: 32 },
    { mes: 'Abr', cantidad: 50 },
    { mes: 'May', cantidad: 24 },
    { mes: 'Jun', cantidad: 35 },
    { mes: 'Jul', cantidad: 10 },
    { mes: 'Ago', cantidad: 70 },
    { mes: 'Sep', cantidad: 24 },
    { mes: 'Oct', cantidad: 50 },
    { mes: 'Nov', cantidad: 30 },
    { mes: 'Dic', cantidad: 80 },
  ];

  return (
    <div className="card-evaluaciones">
      <h4>EVALUACIONES MENSUALES</h4>
      
      <div style={{ width: '100%', height: 250, marginTop: '1rem', minWidth: 0}}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datosMensuales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="mes" axisLine={false} tickLine={false} stroke="#888888" style={{ fontSize: '12px' }} />
            <YAxis axisLine={false} tickLine={false} stroke="#888888" style={{ fontSize: '12px' }} />
            <Tooltip cursor={{ fill: '#f5f5f5' }} />
            <Bar dataKey="cantidad" fill="#04AA6D" radius={[4, 4, 0, 0]} barSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}