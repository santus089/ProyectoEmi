"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import '@/app/estilos/main.css';
import '@/app/globals.css';
import '@/app/estilos/pacientes.css'; 
import { guardarCita, obtenerCitas, obtenerPaciente } from '../action';

export default function AgendaMensualPage() {
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [citas, setCitas] = useState<any[]>([]);
    const [pacientes, setPacientes] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const fechaHoyString = new Date().toISOString().split('T')[0];

    // --- ESTADOS DEL CONTROL MENSUAL ---
    const [fechaActual, setFechaActual] = useState(new Date());
    const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

    // Estados del formulario de reserva
    const [pacienteId, setPacienteId] = useState("");
    const [fecha, setFecha] = useState("");
    const [hora, setHora] = useState("");
    const [horaFin, setHoraFin] = useState("");
    const [modalidad, setModalidad] = useState("");
    const [motivo, setMotivo] = useState("");
    const [guardando, setGuardando] = useState(false);

    const cargarDatos = async () => {
        setCargando(true);
        const resPacientes = await obtenerPaciente();
        const resCitas = await obtenerCitas();
        
        if (resPacientes.success) setPacientes(resPacientes.data);
        if (resCitas.success) setCitas(resCitas.data);
        setCargando(false);
    };

    const formatoFechaChile = (fechaIso: string) => {
        if (!fechaIso) return "";
        const partes = fechaIso.split('-');
        if (partes.length !== 3) return fechaIso;
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    useEffect(() => {
        cargarDatos();
    }, []);

    // --- LÓGICA DE CALENDARIO MENSUAL ---
    const año = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();

    const nombresMeses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    // Empezamos por Lunes para una disposición clínica tradicional
    const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

    // Ajustamos el día de inicio para que calce con la semana Chilena (Lunes = 0)
    const obtenerPrimerDiaSemana = () => {
        const d = new Date(año, mes, 1).getDay();
        return d === 0 ? 6 : d - 1; 
    };

    const primerDiaMesIndex = obtenerPrimerDiaSemana();
    const totalDiasMes = new Date(año, mes + 1, 0).getDate();

    const navegarMes = (direccion: 'ant' | 'sig') => {
        const nuevoMes = direccion === 'ant' ? mes - 1 : mes + 1;
        setFechaActual(new Date(año, nuevoMes, 1));
        setDiaSeleccionado(null); // Limpiamos el filtro al cambiar de mes
    };

    // Formateador estándar "YYYY-MM-DD" seguro para Supabase
    const construirFechaCelda = (dia: number) => {
        const m = String(mes + 1).padStart(2, '0');
        const d = String(dia).padStart(2, '0');
        return `${año}-${m}-${d}`;
    };

    // Obtener las citas del día seleccionado para el bloque de detalles inferior
    const citasDelDiaSeleccionado = citas.filter(c => c.fecha === diaSeleccionado)
        .sort((a, b) => a.hora.localeCompare(b.hora));

    async function manejarEnvio(e: React.FormEvent) {
        e.preventDefault();
        setGuardando(true);

        const datosCita = { pacienteId, fecha, hora, horaFin, modalidad, motivo };
        const resultado = await guardarCita(datosCita);
        setGuardando(false);

        if (resultado.success) {
            alert("¡Hora agendada exitosamente en el calendario!");
            setPacienteId(""); setFecha(""); setHora(""); setMotivo("");
            setMostrarFormulario(false);
            cargarDatos();
        } else {
            alert(`Error: ${resultado.error}`);
        }
    }

    return (
        <main className="main-layout" style={{ minHeight: '100vh', display: 'flex' }}>
            <div className='app-container' style={{ display: 'flex', width: '100%' }}>
                <Sidebar />
                <div className='content-container' style={{ backgroundColor: '#525e92', padding: '1.5rem', flexGrow: 1, overflowY: 'auto' }}>
                    <div className='card-paciente' style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', color: '#333333' }}>
                        
                        {/* Control superior */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                            <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#1a202c', fontWeight: 'bold' }}>Planificación Mensual</h1>
                            <button onClick={() => setMostrarFormulario(true)} style={{ backgroundColor: '#4f46e5', color: '#ffffff', padding: '0.6rem 1.2rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }}>
                                + Nueva Cita
                            </button>
                        </div>

                        {/* --- NAVEGADOR DEL MES --- */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#2d3748', fontWeight: '600' }}>
                                {nombresMeses[mes]} de {año}
                            </h2>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => navegarMes('ant')} style={{ padding: '0.4rem 0.8rem', border: '1px solid #cbd5e0', background: '#3a3737', borderRadius: '4px', cursor: 'pointer' }}>◀ Mes Anterior</button>
                                <button onClick={() => setFechaActual(new Date())} style={{ padding: '0.4rem 0.8rem', border: '1px solid #cbd5e0', background: '#137333', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>Mes Actual</button>
                                <button onClick={() => navegarMes('sig')} style={{ padding: '0.4rem 0.8rem', border: '1px solid #cbd5e0', background: '#3a3737', borderRadius: '4px', cursor: 'pointer' }}>Siguiente Mes ▶</button>
                            </div>
                        </div>

                        {/* --- CUADRÍCULA DEL CALENDARIO --- */}
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#f7fafc' }}>
                            {/* Días de la semana */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#edf2f7', borderBottom: '1px solid #e2e8f0', gap: '1px', textAlign: 'center', fontWeight: 'bold', padding: '0.75rem 0', color: '#4a5568' }}>
                                {diasSemana.map(d => <div key={d}>{d}</div>)}
                            </div>

                            {/* Días del mes */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: '#e2e8f0' }}>
                                {/* Rellenos de meses anteriores */}
                                {Array.from({ length: primerDiaMesIndex }).map((_, i) => (
                                    <div key={`vacio-${i}`} style={{ background: '#fff', minHeight: '6rem' }}></div>
                                ))}

                                {/* Días activos */}
                                {Array.from({ length: totalDiasMes }).map((_, i) => {
                                    const dia = i + 1;
                                    const fechaCelda = construirFechaCelda(dia);
                                    
                                    const citasDelDia = citas.filter(c => c.fecha === fechaCelda);
                                    const totalCitas = citasDelDia.length;
                                    const esSeleccionado = diaSeleccionado === fechaCelda;

                                    const esHoy = fechaHoyString === fechaCelda

                                    return (
                                        <div 
                                            key={`dia-${dia}`}
                                            onClick={() => setDiaSeleccionado(fechaCelda)}
                                            style={{
                                                backgroundColor: esHoy ? '#e6f4ea' : '#ffffff',
                                                color: esHoy ? '#137333' : '#2d3748',
                                                fontWeight: esHoy ? 'bold' : 'normal',
                                                minHeight: '6rem',
                                                padding: '0.5rem',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                cursor: 'pointer',
                                                transition: 'background 0.15s',
                                                border: esSeleccionado ? '2px solid #4f46e5' : 'none'
                                            }}
                                            onMouseEnter={(e) => !esSeleccionado && (e.currentTarget.style.background = '#f7fafc')}
                                            onMouseLeave={(e) => !esSeleccionado && (e.currentTarget.style.background = '#ffffff')}
                                        >
                                            <span style={{ 
                                                fontWeight: 'bold', 
                                                color: totalCitas > 0 ? '#4f46e5' : '#2d3748',
                                                fontSize: '1rem'
                                            }}>
                                                {dia}
                                            </span>
                                            
                                            {/* Etiqueta resumen de citas dentro de la celda */}
                                            {totalCitas > 0 && (
                                                <div style={{ 
                                                    backgroundColor: '#4f46e5', 
                                                    color: '#ffffff', 
                                                    fontSize: '0.75rem', 
                                                    padding: '0.2rem 0.4rem', 
                                                    borderRadius: '4px', 
                                                    textAlign: 'center',
                                                    fontWeight: 'bold',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                }}>
                                                    {totalCitas} {totalCitas === 1 ? 'cita' : 'citas'}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* --- PANEL INFERIOR: DETALLE DE CITAS DEL DÍA SELECCIONADO --- */}
                        {diaSeleccionado && (
                            <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                    <h3 style={{ margin: 0, color: '#1a202c' }}>📅 Bloques para el día: <strong>{formatoFechaChile(diaSeleccionado)}</strong></h3>
                                    <button onClick={() => setDiaSeleccionado(null)} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: 'bold' }}>Cerrar detalle</button>
                                </div>

                                {citasDelDiaSeleccionado.length === 0 ? (
                                    <p style={{ color: '#718096', fontStyle: 'italic', margin: 0 }}>No hay horas agendadas para esta fecha.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {citasDelDiaSeleccionado.map((cita) => (
                                            <div key={cita.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#fff', borderRadius: '6px', border: '1px solid #edf2f7' }}>
                                                <div>
                                                    <span style={{ fontWeight: 'bold', color: '#4f46e5', marginRight: '1rem' }}>{cita.hora.substring(0,5)} hrs</span>
                                                    <span style={{ fontWeight: 'bold', color: '#4f46e5', marginRight: '1rem' }}>{cita.horaFin.substring(0,5)} hrs</span>
                                                    <strong style={{ color: '#2d3748' }}>{cita.Paciente?.nombre} {cita.Paciente?.apellido}</strong>
                                                    <span style={{ color: '#718096', marginLeft: '1rem', fontSize: '0.9rem' }}>- Motivo: {cita.motivo}</span>
                                                </div>
                                                <span style={{ backgroundColor: '#def7ec', color: '#03543f', fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '12px', fontWeight: 'bold' }}>
                                                    {cita.estado}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Modal de Agendamiento */}
            {mostrarFormulario && (
                <div className='modal-overlay'>
                    <div className='modal-form-card'>
                        <div className='modal-header'>
                            <h2>Agendar Nueva Hora</h2>
                            <button type='button' className="btn-cerrar-x" onClick={() => setMostrarFormulario(false)}>&times;</button>
                        </div>
                        <form onSubmit={manejarEnvio} className="paciente-form">
                            <div className='form-group'>
                                <label>Seleccionar Paciente</label>
                                <select value={pacienteId} onChange={(e) => setPacienteId(e.target.value)} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', color: '#333' }}>
                                    <option value="" disabled>Seleccione un paciente...</option>
                                    {pacientes.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre} {p.apellido} ({p.rut})</option>
                                    ))}
                                </select>
                            </div>
                            <div className='form-row'>
                                <div className='form-group'>
                                    <label>Fecha</label>
                                    <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
                                </div>
                                <div className='form-group'>
                                    <label>Hora Inicio</label>
                                    <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} required />
                                </div>
                                <div className='form-group'>
                                    <label>Hora Fin</label>
                                    <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} required />
                                </div>
                            </div>

                            {/*MODALIDAD Y MOTIVO */}
                            <div className='form-row'>
                                <div className='form-group'>
                                    <label>Modalidad de Sesión</label>
                                    <select value={modalidad} onChange={(e) => setModalidad(e.target.value)} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', color: '#333', border: '1px solid #ccc' }}>
                                        <option value="presencial">Presencial</option>
                                        <option value="remota">Remota</option>
                                    </select>
                                </div>
                                <div className='form-group' style={{ flexGrow: 2 }}>
                                    <label>Motivo de la Consulta</label>
                                    <input type="text" placeholder="Ej: Control nutricional" value={motivo} onChange={(e) => setMotivo(e.target.value)} required />
                                </div>
                            </div>
                            <div className='form-action'>
                                <button type='button' className='btn-cancelar' onClick={() => setMostrarFormulario(false)}>Cancelar</button>
                                <button type='submit' className='btn-guardar' disabled={guardando}>
                                    {guardando ? "Agendando..." : "Confirmar Hora"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}