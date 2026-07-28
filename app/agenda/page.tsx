"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import '@/app/estilos/main.css';
import '@/app/globals.css';
import '@/app/estilos/pacientes.css'; 
import { guardarCita, obtenerCitas, obtenerPaciente, actualizarCita, borrarCita } from '../action';

export default function AgendaMensualPage() {
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [citas, setCitas] = useState<any[]>([]);
    const [pacientes, setPacientes] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const fechaHoyString = new Date().toISOString().split('T')[0];

    // --- ESTADOS DEL CONTROL MENSUAL ---
    const [fechaActual, setFechaActual] = useState(new Date());
    const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

    // --- ESTADOS DE EDICIÓN ---
    const [modoEdicion, setModoEdicion] = useState(false);
    const [idCitaAEditar, setIdCitaAEditar] = useState<number | null>(null);

    // --- ESTADOS DEL FORMULARIO Y BUSCADOR DE PACIENTES ---
    const [pacienteId, setPacienteId] = useState("");
    const [busquedaPaciente, setBusquedaPaciente] = useState("");
    const [mostrarResultados, setMostrarResultados] = useState(false);

    const [fecha, setFecha] = useState("");
    const [hora, setHora] = useState("");
    const [horaFin, setHoraFin] = useState("");
    const [modalidad, setModalidad] = useState("presencial");
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
    };

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
    const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

    const obtenerPrimerDiaSemana = () => {
        const d = new Date(año, mes, 1).getDay();
        return d === 0 ? 6 : d - 1; 
    };

    const primerDiaMesIndex = obtenerPrimerDiaSemana();
    const totalDiasMes = new Date(año, mes + 1, 0).getDate();

    const navegarMes = (direccion: 'ant' | 'sig') => {
        const nuevoMes = direccion === 'ant' ? mes - 1 : mes + 1;
        setFechaActual(new Date(año, nuevoMes, 1));
        setDiaSeleccionado(null);
    };

    const construirFechaCelda = (dia: number) => {
        const m = String(mes + 1).padStart(2, '0');
        const d = String(dia).padStart(2, '0');
        return `${año}-${m}-${d}`;
    };

    const citasDelDiaSeleccionado = citas.filter(c => c.fecha === diaSeleccionado)
        .sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));

    // --- FILTRADO EN TIEMPO REAL POR RUT O NOMBRE/APELLIDO ---
    const pacientesFiltrados = pacientes.filter(p => {
        const termino = busquedaPaciente.toLowerCase().trim();
        const nombreCompleto = `${p.nombre || ''} ${p.apellido || ''}`.toLowerCase();
        const rut = (p.rut || '').toLowerCase();
        return nombreCompleto.includes(termino) || rut.includes(termino);
    });

    // --- MANEJADORES DE FORMULARIO Y EDICIÓN ---
    const abrirNuevaCita = () => {
        setModoEdicion(false);
        setIdCitaAEditar(null);
        setPacienteId("");
        setBusquedaPaciente("");
        setMostrarResultados(false);
        setFecha(diaSeleccionado || fechaHoyString);
        setHora("");
        setHoraFin("");
        setModalidad("presencial");
        setMotivo("");
        setMostrarFormulario(true);
    };

    const abrirEditorCita = (cita: any) => {
        setModoEdicion(true);
        setIdCitaAEditar(cita.id);
        
        // Obtenemos el ID del paciente de la cita
        const pId = cita.pacienteId || cita.Paciente?.id;
        setPacienteId(pId ? pId.toString() : "");

        // Buscamos al paciente completo en la lista general de pacientes
        const pacienteCompleto = pacientes.find(p => String(p.id) === String(pId));

        if (pacienteCompleto) {
            // Mostramos Nombre + Apellido + RUT
            setBusquedaPaciente(`${pacienteCompleto.nombre} ${pacienteCompleto.apellido} (${pacienteCompleto.rut})`);
        } else if (cita.Paciente) {
            // Respaldo por si se encuentra en la relación de la cita
            setBusquedaPaciente(`${cita.Paciente.nombre} ${cita.Paciente.apellido} (${cita.Paciente.rut || ''})`);
        } else {
            setBusquedaPaciente("");
        }

        setMostrarResultados(false);
        setFecha(cita.fecha || "");
        setHora(cita.hora ? cita.hora.substring(0, 5) : "");
        setHoraFin(cita.horaFin ? cita.horaFin.substring(0, 5) : "");
        setModalidad(cita.modalidad || "presencial");
        setMotivo(cita.motivo || "");
        setMostrarFormulario(true);
    };

    const cerrarModal = () => {
        setMostrarFormulario(false);
        setModoEdicion(false);
        setIdCitaAEditar(null);
        setPacienteId("");
        setBusquedaPaciente("");
        setMostrarResultados(false);
    };

    const seleccionarPaciente = (p: any) => {
        setPacienteId(p.id);
        setBusquedaPaciente(`${p.nombre} ${p.apellido} (${p.rut})`);
        setMostrarResultados(false);
    };

    async function manejarEnvio(e: React.FormEvent) {
        e.preventDefault();

        if (!pacienteId) {
            alert("Por favor seleccione un paciente válido de la lista desplegable.");
            return;
        }

        setGuardando(true);

        const datosCita = { pacienteId, fecha, hora, horaFin, modalidad, motivo };
        let resultado;

        if (modoEdicion && idCitaAEditar !== null) {
            resultado = await actualizarCita(idCitaAEditar, datosCita);
        } else {
            resultado = await guardarCita(datosCita);
        }

        setGuardando(false);

        if (resultado.success) {
            alert(modoEdicion ? "¡Cita actualizada exitosamente!" : "¡Hora agendada exitosamente en el calendario!");
            cerrarModal();
            cargarDatos();
        } else {
            alert(`Error: ${resultado.error}`);
        }
    }

    const manejarBorrarCita = async (id: number, nombrePaciente: string) => {
        const confirmar = window.confirm(`¿Estás seguro de eliminar la cita de ${nombrePaciente}?`);
        if (confirmar) {
            const resultado = await borrarCita(id);
            if (resultado.success) {
                alert("¡Cita eliminada correctamente!");
                cargarDatos();
            } else {
                alert(`Error al eliminar la cita: ${resultado.error}`);
            }
        }
    };

    return (
        <main className="main-layout" style={{ minHeight: '100vh', display: 'flex' }}>
            <div className='app-container' style={{ display: 'flex', width: '100%' }}>
                <Sidebar />
                <div className='content-container' style={{ backgroundColor: '#525e92', padding: '1.5rem', flexGrow: 1, overflowY: 'auto' }}>
                    <div className='card-paciente' style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', color: '#333333' }}>
                        
                        {/* Control superior */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                            <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#1a202c', fontWeight: 'bold' }}>Planificación Mensual</h1>
                            <button onClick={abrirNuevaCita} style={{ backgroundColor: '#4f46e5', color: '#ffffff', padding: '0.6rem 1.2rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }}>
                                + Nueva Cita
                            </button>
                        </div>

                        {/* NAVEGADOR DEL MES */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#2d3748', fontWeight: '600' }}>
                                {nombresMeses[mes]} de {año}
                            </h2>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => navegarMes('ant')} style={{ padding: '0.4rem 0.8rem', border: '1px solid #cbd5e0', background: '#3a3737', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>◀ Mes Anterior</button>
                                <button onClick={() => setFechaActual(new Date())} style={{ padding: '0.4rem 0.8rem', border: '1px solid #cbd5e0', background: '#137333', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>Mes Actual</button>
                                <button onClick={() => navegarMes('sig')} style={{ padding: '0.4rem 0.8rem', border: '1px solid #cbd5e0', background: '#3a3737', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>Siguiente Mes ▶</button>
                            </div>
                        </div>

                        {/* CUADRÍCULA DEL CALENDARIO */}
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#f7fafc' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#edf2f7', borderBottom: '1px solid #e2e8f0', gap: '1px', textAlign: 'center', fontWeight: 'bold', padding: '0.75rem 0', color: '#4a5568' }}>
                                {diasSemana.map(d => <div key={d}>{d}</div>)}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: '#e2e8f0' }}>
                                {Array.from({ length: primerDiaMesIndex }).map((_, i) => (
                                    <div key={`vacio-${i}`} style={{ background: '#fff', minHeight: '6rem' }}></div>
                                ))}

                                {Array.from({ length: totalDiasMes }).map((_, i) => {
                                    const dia = i + 1;
                                    const fechaCelda = construirFechaCelda(dia);
                                    
                                    const citasDelDia = citas.filter(c => c.fecha === fechaCelda);
                                    const totalCitas = citasDelDia.length;
                                    const esSeleccionado = diaSeleccionado === fechaCelda;
                                    const esHoy = fechaHoyString === fechaCelda;

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
                                            onMouseLeave={(e) => !esSeleccionado && (e.currentTarget.style.background = esHoy ? '#e6f4ea' : '#ffffff')}
                                        >
                                            <span style={{ 
                                                fontWeight: 'bold', 
                                                color: totalCitas > 0 ? '#4f46e5' : '#2d3748',
                                                fontSize: '1rem'
                                            }}>
                                                {dia}
                                            </span>
                                            
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

                        {/* PANEL INFERIOR: DETALLE Y ACCIONES DE CITAS */}
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
                                        {citasDelDiaSeleccionado.map((cita) => {
                                            const nombrePaciente = cita.Paciente ? `${cita.Paciente.nombre} ${cita.Paciente.apellido}` : 'Paciente no especificado';
                                            const esRealizado = (cita.estado || "Pendiente").toLowerCase() === "realizado";

                                            return (
                                                <div key={cita.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#fff', borderRadius: '6px', border: '1px solid #edf2f7' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                        <span style={{ fontWeight: 'bold', color: '#4f46e5' }}>
                                                            {cita.hora ? cita.hora.substring(0,5) : '--:--'} - {cita.horaFin ? cita.horaFin.substring(0,5) : '--:--'} hrs
                                                        </span>
                                                        <strong style={{ color: '#2d3748' }}>{nombrePaciente}</strong>
                                                        <span style={{ color: '#718096', fontSize: '0.9rem' }}>- Motivo: {cita.motivo}</span>
                                                        
                                                        {/* Etiqueta Estado */}
                                                        <span style={{ 
                                                            backgroundColor: esRealizado ? '#def7ec' : '#feecdc', 
                                                            color: esRealizado ? '#03543f' : '#9a3412', 
                                                            fontSize: '0.75rem', 
                                                            padding: '0.2rem 0.6rem', 
                                                            borderRadius: '12px', 
                                                            fontWeight: 'bold' 
                                                        }}>
                                                            {cita.estado || 'Pendiente'}
                                                        </span>
                                                    </div>

                                                    {/* BOTONES DE EDITAR Y BORRAR */}
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button 
                                                            onClick={() => abrirEditorCita(cita)}
                                                            style={{ backgroundColor: '#f0a500', color: '#ffffff', border: 'none', padding: '0.3rem 0.7rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                                        >
                                                            Editar
                                                        </button>
                                                        <button 
                                                            onClick={() => manejarBorrarCita(cita.id, nombrePaciente)}
                                                            style={{ backgroundColor: '#d9534f', color: '#ffffff', border: 'none', padding: '0.3rem 0.7rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                                        >
                                                            Borrar
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Modal de Agendamiento / Edición */}
            {mostrarFormulario && (
                <div className='modal-overlay'>
                    <div className='modal-form-card'>
                        <div className='modal-header'>
                            <h2>{modoEdicion ? "Editar Cita" : "Agendar Nueva Hora"}</h2>
                            <button type='button' className="btn-cerrar-x" onClick={cerrarModal}>&times;</button>
                        </div>
                        <form onSubmit={manejarEnvio} className="paciente-form">
                            
                            {/* BUSCADOR AUTOCOMPLETADO POR RUT O NOMBRE Y APELLIDO */}
                            <div className='form-group' style={{ position: 'relative' }}>
                                <label>Buscar Paciente (Nombre, Apellido o Rut)</label>
                                <input 
                                    type="text"
                                    placeholder="Ej: Juan Perez o 12.345.678-9"
                                    value={busquedaPaciente}
                                    onChange={(e) => {
                                        setBusquedaPaciente(e.target.value);
                                        setPacienteId(""); // Resetea la selección si cambia el texto
                                        setMostrarResultados(true);
                                    }}
                                    onFocus={() => setMostrarResultados(true)}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', color: '#333' }}
                                />

                                {/* Desplegable dinámico de resultados */}
                                {mostrarResultados && busquedaPaciente.trim().length > 0 && (
                                    <div style={{ 
                                        position: 'absolute', 
                                        top: '100%', 
                                        left: 0, 
                                        right: 0, 
                                        maxHeight: '180px', 
                                        overflowY: 'auto', 
                                        backgroundColor: '#ffffff', 
                                        border: '1px solid #cbd5e0', 
                                        borderRadius: '0 0 6px 6px', 
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
                                        zIndex: 100 
                                    }}>
                                        {pacientesFiltrados.length === 0 ? (
                                            <div style={{ padding: '0.6rem', color: '#a0aec0', fontSize: '0.9rem' }}>
                                                No se encontraron coincidencias.
                                            </div>
                                        ) : (
                                            pacientesFiltrados.map(p => (
                                                <div 
                                                    key={p.id}
                                                    onClick={() => seleccionarPaciente(p)}
                                                    style={{ 
                                                        padding: '0.6rem', 
                                                        cursor: 'pointer', 
                                                        borderBottom: '1px solid #edf2f7', 
                                                        fontSize: '0.9rem',
                                                        color: '#2d3748'
                                                    }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f7fafc')}
                                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                                                >
                                                    <strong>{p.nombre} {p.apellido}</strong> <span style={{ color: '#718096', fontSize: '0.85rem' }}>({p.rut})</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
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
                                <button type='button' className='btn-cancelar' onClick={cerrarModal}>Cancelar</button>
                                <button type='submit' className='btn-guardar' disabled={guardando}>
                                    {guardando ? "Guardando..." : modoEdicion ? "Actualizar Cita" : "Confirmar Hora"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}