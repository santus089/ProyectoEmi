"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import '@/app/estilos/main.css';
import '@/app/globals.css';
import '@/app/estilos/pacientes.css';
import { obtenerPaciente, obtenerHistorialCompletoPaciente } from '../action';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export default function SeguimientoPage() {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarLista, setMostrarLista] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any | null>(null);

  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [historial, setHistorial] = useState<{
    antropometria: any[];
    fms: any[];
    salto: any[];
    velocidad: any[];
    fuerza: any[];
  }>({
    antropometria: [],
    fms: [],
    salto: [],
    velocidad: [],
    fuerza: []
  });

  useEffect(() => {
    async function cargarPacientes() {
      const res = await obtenerPaciente();
      if (res.success) setPacientes(res.data || []);
    }
    cargarPacientes();
  }, []);

  const formatearFecha = (fechaIso: string) => {
    if (!fechaIso) return "";
    const f = new Date(fechaIso);
    return f.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const pacientesFiltrados = pacientes.filter(p => {
    const term = busqueda.toLowerCase().trim();
    const nombreCompleto = `${p.nombre || ''} ${p.apellido || ''}`.toLowerCase();
    const rut = (p.rut || '').toLowerCase();
    return nombreCompleto.includes(term) || rut.includes(term);
  });

  const seleccionarPaciente = async (p: any) => {
    setPacienteSeleccionado(p);
    setBusqueda(`${p.nombre} ${p.apellido} (${p.rut})`);
    setMostrarLista(false);
    setCargandoHistorial(true);

    const res = await obtenerHistorialCompletoPaciente(p.id);
    if (res.success && res.data) {
      setHistorial(res.data);
    }
    setCargandoHistorial(false);
  };

  // --- PREPARACIÓN DE DATOS PARA LOS GRÁFICOS ---

  // A3-2: Antropometría (% Grasa, % M. Muscular, Peso)
  const dataAntro = historial.antropometria.map(item => ({
    fecha: formatearFecha(item.fecha),
    peso: item.peso || 0,
    grasa: item.porcentajeGrasa || 0,
    musculo: item.porcentajeMasaMuscular || 0
  }));

  // A3-3: FMS (Puntaje Total)
  const dataFms = historial.fms.map(item => ({
    fecha: formatearFecha(item.fecha),
    total: item.puntajeTotal || 0
  }));

  // A3-4: Saltos Verticales (CMJ, SJ, Drop Jump)
  const dataSaltos = historial.salto.map(item => ({
    fecha: formatearFecha(item.fecha),
    cmj: item.cmj || 0,
    sj: item.sj || 0,
    dropJump: item.dropJump || 0
  }));

  // A3-5: Velocidad (Km/h 10m y 40m)
  const dataVelocidad = historial.velocidad.map(item => ({
    fecha: formatearFecha(item.fecha),
    vel10m: item.velocidad10m || 0,
    vel40m: item.velocidad40m || 0
  }));

  // A3-6: Fuerza Máxima (Peso Muerto, Sentadilla, Press Banca, Total)
  const dataFuerza = historial.fuerza.map(item => ({
    fecha: formatearFecha(item.fecha),
    pesoMuerto: item.pesoMuerto || 0,
    sentadilla: item.sentadilla || 0,
    pressBanca: item.pressBanca || 0,
    total: item.totalLevantado || 0
  }));

  return (
    <main className="main-layout" style={{ minHeight: '100vh', display: 'flex' }}>
      <div className="app-container" style={{ display: 'flex', width: '100%' }}>
        <Sidebar />
        
        <div className="content-container" style={{ backgroundColor: '#525e92', padding: '1.5rem', flexGrow: 1, overflowY: 'auto' }}>
          <div className="card-paciente" style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', color: '#333333' }}>
            
            <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#1a202c', fontWeight: 'bold' }}>
                📈 Evolución y Seguimiento de Pacientes
              </h1>
              <p style={{ margin: '0.3rem 0 0', color: '#718096', fontSize: '0.95rem' }}>
                Visualiza el progreso y cambios en el tiempo de las evaluaciones físicas y antropométricas.
              </p>
            </div>

            {/* BUSCADOR DE PACIENTE */}
            <div style={{ position: 'relative', marginBottom: '2rem', maxWidth: '600px' }}>
              <label style={{ fontWeight: 'bold', color: '#4a5568', display: 'block', marginBottom: '0.5rem' }}>
                Buscar Paciente (RUT o Nombre/Apellido):
              </label>
              <input
                type="text"
                placeholder="Escribe el RUT o nombre del paciente..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setMostrarLista(true);
                }}
                onFocus={() => setMostrarLista(true)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', color: '#2d3748' }}
              />

              {mostrarLista && busqueda.trim().length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, maxHeight: '200px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #cbd5e0', borderRadius: '0 0 6px 6px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 50 }}>
                  {pacientesFiltrados.length === 0 ? (
                    <div style={{ padding: '0.75rem', color: '#a0aec0' }}>No se encontraron pacientes</div>
                  ) : (
                    pacientesFiltrados.map(p => (
                      <div
                        key={p.id}
                        onClick={() => seleccionarPaciente(p)}
                        style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid #edf2f7' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f7fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                      >
                        <strong>{p.nombre} {p.apellido}</strong> <span style={{ color: '#718096' }}>({p.rut})</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {cargandoHistorial && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#4f46e5', fontWeight: 'bold' }}>
                Cargando historial del paciente...
              </div>
            )}

            {!cargandoHistorial && pacienteSeleccionado && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* 1. SECCIÓN A3-2: ANTROPOMETRÍA */}
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 1rem', color: '#4f46e5' }}>📊 A3-2: Composición Corporal (% Grasa vs % Músculo)</h3>
                  {dataAntro.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dataAntro}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" />
                        <YAxis unit="%" />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="grasa" name="% Grasa Corporal" stroke="#ef4444" strokeWidth={3} />
                        <Line type="monotone" dataKey="musculo" name="% Masa Muscular" stroke="#10b981" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p style={{ color: '#a0aec0', fontStyle: 'italic' }}>Sin evaluaciones registradas.</p>
                  )}
                </div>

                {/* 2. SECCIÓN A3-3: FMS */}
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 1rem', color: '#4f46e5' }}>🏃 A3-3: Calidad de Movimiento FMS (Puntaje Total / 21)</h3>
                  {dataFms.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={dataFms}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" />
                        <YAxis domain={[0, 21]} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total" name="Puntaje Total FMS" fill="#6366f1" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p style={{ color: '#a0aec0', fontStyle: 'italic' }}>Sin evaluaciones registradas.</p>
                  )}
                </div>

                {/* 3. SECCIÓN A3-4: SALTO VERTICAL */}
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 1rem', color: '#4f46e5' }}>🦘 A3-4: Potencia de Salto Vertical (cm)</h3>
                  {dataSaltos.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dataSaltos}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" />
                        <YAxis unit=" cm" />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="cmj" name="CMJ (cm)" stroke="#f59e0b" strokeWidth={3} />
                        <Line type="monotone" dataKey="sj" name="Squat Jump (cm)" stroke="#06b6d4" strokeWidth={3} />
                        <Line type="monotone" dataKey="dropJump" name="Drop Jump (cm)" stroke="#8b5cf6" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p style={{ color: '#a0aec0', fontStyle: 'italic' }}>Sin evaluaciones registradas.</p>
                  )}
                </div>

                {/* 4. SECCIÓN A3-5: VELOCIDAD */}
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 1rem', color: '#4f46e5' }}>⚡ A3-5: Velocidad (Km/h)</h3>
                  {dataVelocidad.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dataVelocidad}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" />
                        <YAxis unit=" km/h" />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="vel10m" name="Velocidad 10m (Km/h)" stroke="#3b82f6" strokeWidth={3} />
                        <Line type="monotone" dataKey="vel40m" name="Velocidad 40m (Km/h)" stroke="#ec4899" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p style={{ color: '#a0aec0', fontStyle: 'italic' }}>Sin evaluaciones registradas.</p>
                  )}
                </div>

                {/* 5. SECCIÓN A3-6: FUERZA MÁXIMA */}
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 1rem', color: '#4f46e5' }}>🏋️ A3-6: Fuerza Máxima (Kg Levantados)</h3>
                  {dataFuerza.length > 0 ? (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={dataFuerza}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" />
                        <YAxis unit=" kg" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="pesoMuerto" name="Peso Muerto (Kg)" fill="#0284c7" />
                        <Bar dataKey="sentadilla" name="Sentadilla (Kg)" fill="#10b981" />
                        <Bar dataKey="pressBanca" name="Press Banca (Kg)" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p style={{ color: '#a0aec0', fontStyle: 'italic' }}>Sin evaluaciones registradas.</p>
                  )}
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}