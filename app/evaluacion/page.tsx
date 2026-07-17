"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import '@/app/estilos/main.css';
import '@/app/globals.css';
import '@/app/estilos/pacientes.css'; // Reutilizamos estilos de tarjetas/formularios

import { obtenerPaciente, guardarAnamnesis, obtenerAnamnesisPaciente } from '../action';

export default function EvaluacionesPage() {
    const [pacientes, setPacientes] = useState<any[]>([]);
    const [pacienteSeleccionadoId, setPacienteSeleccionadoId] = useState<string>("");
    const [evaluacionActiva, setEvaluacionActiva] = useState<number>(1); // Por defecto: 1 (Anamnesis)
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    // --- NUEVOS ESTADOS PARA EL BUSCADOR INTELIGENTE ---
    const [busqueda, setBusqueda] = useState("");
    const [mostrarResultados, setMostrarResultados] = useState(false);

    // --- ESTADOS DE EVALUACIÓN 1: ANAMNESIS (A3-1) ---
    const [antecedentesMorbidos, setAntecedentesMorbidos] = useState("");
    const [antecedentesMedicos, setAntecedentesMedicos] = useState("");
    const [informacionNutricional, setInformacionNutricional] = useState("");
    const [informacionDeportiva, setInformacionDeportiva] = useState("");
    const [objetivos, setObjetivos] = useState("");

    // Cargar la lista inicial de pacientes
    useEffect(() => {
        async function cargarPacientes() {
            setCargando(true);
            const res = await obtenerPaciente();
            if (res.success) {
                setPacientes(res.data);
            }
            setCargando(false);
        }
        cargarPacientes();
    }, []);

    // Cargar datos previos si el paciente ya tiene una anamnesis registrada
    useEffect(() => {
        if (!pacienteSeleccionadoId) return;

        async function cargarAnamnesis() {
            const res = await obtenerAnamnesisPaciente(parseInt(pacienteSeleccionadoId));
            if (res.success && res.data.length > 0) {
                // Si ya tiene historial, cargamos la última evaluación registrada
                const ultimaAnamnesis = res.data[0];
                setAntecedentesMorbidos(ultimaAnamnesis.antecedentesMorbidos || "");
                setAntecedentesMedicos(ultimaAnamnesis.antecedentesMedicos || "");
                setInformacionNutricional(ultimaAnamnesis.informacionNutricional || "");
                setInformacionDeportiva(ultimaAnamnesis.informacionDeportiva || "");
                setObjetivos(ultimaAnamnesis.objetivos || "");
            } else {
                // Si no tiene registros previos, limpiamos los campos
                limpiarFormularioAnamnesis();
            }
        }
        cargarAnamnesis();
    }, [pacienteSeleccionadoId]);

    const limpiarFormularioAnamnesis = () => {
        setAntecedentesMorbidos("");
        setAntecedentesMedicos("");
        setInformacionNutricional("");
        setInformacionDeportiva("");
        setObjetivos("");
    };

    // Manejar el guardado de la Anamnesis
    const manejarGuardarAnamnesis = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pacienteSeleccionadoId) {
            alert("Por favor, seleccione un paciente primero.");
            return;
        }

        setGuardando(true);
        const datos = {
            pacienteId: parseInt(pacienteSeleccionadoId),
            antecedentesMorbidos,
            antecedentesMedicos,
            informacionNutricional,
            informacionDeportiva,
            objetivos
        };

        const res = await guardarAnamnesis(datos);
        setGuardando(false);

        if (res.success) {
            alert("¡Evaluación de Anamnesis (A3-1) guardada exitosamente!");
        } else {
            alert(`Error al guardar: ${res.error}`);
        }
    };

    // Definición de las 7 evaluaciones
    const evaluacionesList = [
        { id: 1, nombre: "A3-1: Anamnesis" },
        { id: 2, nombre: "Evaluación 2" },
        { id: 3, nombre: "Evaluación 3" },
        { id: 4, nombre: "Evaluación 4" },
        { id: 5, nombre: "Evaluación 5" },
        { id: 6, fontSize: "Evaluación 6" },
        { id: 7, nombre: "Evaluación 7" }
    ];

    return (
        <main className="main-layout" style={{ minHeight: '100vh', display: 'flex' }}>
            <div className='app-container' style={{ display: 'flex', width: '100%' }}>
                <Sidebar />
                <div className='content-container' style={{ backgroundColor: '#525e92', padding: '1.5rem', flexGrow: 1, overflowY: 'auto' }}>
                    <div className='card-paciente' style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', color: '#333333' }}>
                        
                        {/* --- AQUÍ SE INTEGRÓ EL BUSCADOR INTELIGENTE POR RUT O NOMBRE --- */}
                        <div style={{ marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1.5rem' }}>
                            <h1 style={{ margin: '0 0 1rem 0', fontSize: '1.6rem', color: '#1a202c', fontWeight: 'bold' }}>Evaluaciones Clínicas</h1>
                            
                            <div style={{ position: 'relative', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontWeight: 'bold', color: '#4a5568' }}>Buscar Paciente (Nombre, Apellido o RUT)</label>
                                
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input 
                                        type="text"
                                        placeholder="Ej: Juan Pérez o 19345..."
                                        value={busqueda}
                                        onChange={(e) => {
                                            setBusqueda(e.target.value);
                                            setMostrarResultados(true);
                                        }}
                                        onFocus={() => setMostrarResultados(true)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '0.6rem', 
                                            borderRadius: '6px', 
                                            border: '1px solid #cbd5e0', 
                                            fontSize: '1rem', 
                                            color: '#333' 
                                        }}
                                    />
                                    {/* Botón para limpiar selección */}
                                    {pacienteSeleccionadoId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPacienteSeleccionadoId("");
                                                setBusqueda("");
                                                limpiarFormularioAnamnesis();
                                            }}
                                            style={{
                                                padding: '0.6rem 1rem',
                                                backgroundColor: '#e53e3e',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            Limpiar
                                        </button>
                                    )}
                                </div>

                                {/* Lista desplegable filtrada en tiempo real */}
                                {mostrarResultados && busqueda && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        zIndex: 10,
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #cbd5e0',
                                        borderRadius: '6px',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        marginTop: '4px'
                                    }}>
                                        {pacientes
                                            .filter(p => {
                                                const termino = busqueda.toLowerCase();
                                                const nombreCompleto = `${p.nombre} ${p.apellido}`.toLowerCase();
                                                const rut = (p.rut || "").toLowerCase();
                                                return nombreCompleto.includes(termino) || rut.includes(termino);
                                            })
                                            .map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => {
                                                        setPacienteSeleccionadoId(p.id.toString());
                                                        setBusqueda(`${p.nombre} ${p.apellido} (${p.rut})`);
                                                        setMostrarResultados(false);
                                                    }}
                                                    style={{
                                                        padding: '0.8rem',
                                                        cursor: 'pointer',
                                                        borderBottom: '1px solid #edf2f7',
                                                        transition: 'background-color 0.2s',
                                                        color: '#333'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f7fafc'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                                                >
                                                    <span style={{ fontWeight: 'bold' }}>{p.nombre} {p.apellido}</span>
                                                    <span style={{ fontSize: '0.85rem', color: '#718096', marginLeft: '8px' }}>RUT: {p.rut}</span>
                                                </div>
                                            ))
                                        }
                                        {/* En caso de no encontrar coincidencias */}
                                        {pacientes.filter(p => {
                                            const termino = busqueda.toLowerCase();
                                            const nombreCompleto = `${p.nombre} ${p.apellido}`.toLowerCase();
                                            const rut = (p.rut || "").toLowerCase();
                                            return nombreCompleto.includes(termino) || rut.includes(termino);
                                        }).length === 0 && (
                                            <div style={{ padding: '0.8rem', color: '#718096', textAlign: 'center' }}>
                                                No se encontraron pacientes
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Si hay un paciente seleccionado, se habilitan las evaluaciones */}
                        {pacienteSeleccionadoId ? (
                            <div>
                                {/* --- 7 BOTONES DE EVALUACIONES --- */}
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem', borderBottom: '1px solid #edf2f7', paddingBottom: '1rem' }}>
                                    {evaluacionesList.map((ev) => (
                                        <button
                                            key={ev.id}
                                            onClick={() => setEvaluacionActiva(ev.id)}
                                            style={{
                                                padding: '0.6rem 1.2rem',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                backgroundColor: evaluacionActiva === ev.id ? '#4f46e5' : '#edf2f7',
                                                color: evaluacionActiva === ev.id ? '#ffffff' : '#4a5568',
                                            }}
                                        >
                                            {ev.nombre}
                                        </button>
                                    ))}
                                </div>

                                {/* --- RENDERIZACIÓN DE EVALUACIÓN SEGÚN SELECCIÓN --- */}
                                {evaluacionActiva === 1 && (
                                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <h2 style={{ marginTop: 0, color: '#2d3748', borderBottom: '1px solid #cbd5e0', paddingBottom: '0.5rem' }}>
                                            Anamnesis (A3-1)
                                        </h2>
                                        
                                        <form onSubmit={manejarGuardarAnamnesis} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                            
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                <label style={{ fontWeight: 'bold', color: '#4a5568' }}>Antecedentes Mórbidos</label>
                                                <textarea 
                                                    value={antecedentesMorbidos}
                                                    onChange={(e) => setAntecedentesMorbidos(e.target.value)}
                                                    placeholder="Escriba diagnósticos, patologías previas, alergias, etc..."
                                                    rows={4}
                                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', resize: 'vertical', fontFamily: 'inherit', color: '#333' }}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                <label style={{ fontWeight: 'bold', color: '#4a5568' }}>Antecedentes Médicos</label>
                                                <textarea 
                                                    value={antecedentesMedicos}
                                                    onChange={(e) => setAntecedentesMedicos(e.target.value)}
                                                    placeholder="Medicamentos actuales, cirugías, tratamientos activos..."
                                                    rows={4}
                                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', resize: 'vertical', fontFamily: 'inherit', color: '#333' }}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                <label style={{ fontWeight: 'bold', color: '#4a5568' }}>Información Nutricional</label>
                                                <textarea 
                                                    value={informacionNutricional}
                                                    onChange={(e) => setInformacionNutricional(e.target.value)}
                                                    placeholder="Preferencias alimentarias, intolerancias, frecuencia de comidas..."
                                                    rows={4}
                                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', resize: 'vertical', fontFamily: 'inherit', color: '#333' }}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                <label style={{ fontWeight: 'bold', color: '#4a5568' }}>Información Deportiva</label>
                                                <textarea 
                                                    value={informacionDeportiva}
                                                    onChange={(e) => setInformacionDeportiva(e.target.value)}
                                                    placeholder="Tipo de ejercicio físico, frecuencia semanal, intensidad, lesiones..."
                                                    rows={4}
                                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', resize: 'vertical', fontFamily: 'inherit', color: '#333' }}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                <label style={{ fontWeight: 'bold', color: '#4a5568' }}>Objetivos</label>
                                                <textarea 
                                                    value={objetivos}
                                                    onChange={(e) => setObjetivos(e.target.value)}
                                                    placeholder="¿Qué busca lograr el paciente en esta consulta? (Bajar de peso, aumento muscular, mejorar rendimiento...)"
                                                    rows={4}
                                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', resize: 'vertical', fontFamily: 'inherit', color: '#333' }}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                                <button 
                                                    type="submit" 
                                                    disabled={guardando}
                                                    style={{ backgroundColor: '#4f46e5', color: '#ffffff', padding: '0.8rem 2rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: 'background 0.2s' }}
                                                >
                                                    {guardando ? "Guardando evaluación..." : "Guardar Anamnesis"}
                                                </button>
                                            </div>

                                        </form>
                                    </div>
                                )}

                                {evaluacionActiva > 1 && (
                                    <div style={{ background: '#f8fafc', padding: '3rem', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                        <h3 style={{ color: '#718096', margin: 0 }}>Módulo en construcción</h3>
                                        <p style={{ color: '#a0aec0' }}>Próximamente agregaremos los campos correspondientes para esta evaluación clínica.</p>
                                    </div>
                                )}

                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#f7fafc', borderRadius: '8px', border: '1px dashed #cbd5e0' }}>
                                <p style={{ fontSize: '1.2rem', color: '#718096', margin: 0 }}>Por favor, busque y seleccione un paciente arriba para comenzar las evaluaciones.</p>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </main>
    );
}