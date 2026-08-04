"use client";

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import '@/app/estilos/main.css';
import '@/app/globals.css';
import '@/app/estilos/pacientes.css';

import {
    obtenerGruposEjercicio, crearGrupoEjercicio, actualizarGrupoEjercicio, borrarGrupoEjercicio,
    obtenerEjercicios, crearEjercicio, actualizarEjercicio, borrarEjercicio,
    obtenerPacientesEvaluados, obtenerRutinaPaciente, guardarRutina
} from '../action';

const DIAS = [
    { key: 'lunes', label: 'Lunes' },
    { key: 'martes', label: 'Martes' },
    { key: 'miercoles', label: 'Miércoles' },
    { key: 'jueves', label: 'Jueves' },
    { key: 'viernes', label: 'Viernes' },
];

const CAMPOS_EJERCICIO = [
    { key: 'repTiempo', label: 'Rep / Tiempo' },
    { key: 'peso', label: 'Peso' },
    { key: 'movimiento', label: 'Movimiento' },
    { key: 'series', label: 'Series' },
    { key: 'descanso', label: 'Descanso' },
    { key: 'rm', label: 'RM' },
];

const ejercicioVacio = { grupoId: '', nombre: '', repTiempo: '', peso: '', movimiento: '', series: '', descanso: '', rm: '', comentario: '', video: '' };
const diasVacios = () => ({ lunes: [] as any[], martes: [] as any[], miercoles: [] as any[], jueves: [] as any[], viernes: [] as any[] });

const estiloInput = { width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '0.9rem', color: '#333', boxSizing: 'border-box' as const };
const estiloLabel = { fontWeight: 'bold' as const, color: '#4a5568', fontSize: '0.8rem' };
const estiloBotonPrimario = { backgroundColor: '#4f46e5', color: '#fff', padding: '0.6rem 1.2rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' as const };
const estiloBotonSecundario = { backgroundColor: '#edf2f7', color: '#4a5568', padding: '0.6rem 1.2rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' as const };
const estiloBotonPeligro = { backgroundColor: 'transparent', color: '#e53e3e', padding: '0.3rem 0.5rem', border: 'none', cursor: 'pointer', fontWeight: 'bold' as const, fontSize: '1rem' };
const estiloCard = { background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' };

const escapeHtml = (valor: any) => String(valor ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any
)[c]);

export default function EntrenamientoPage() {
    const [tab, setTab] = useState<'biblioteca' | 'rutinas'>('biblioteca');
    const idRef = useRef(0);
    const generarIdTemporal = () => { idRef.current += 1; return `tmp-${idRef.current}`; };

    // ==================== BIBLIOTECA: GRUPOS Y EJERCICIOS ====================
    const [grupos, setGrupos] = useState<any[]>([]);
    const [ejercicios, setEjercicios] = useState<any[]>([]);
    const [cargandoBiblioteca, setCargandoBiblioteca] = useState(true);
    const [grupoFiltro, setGrupoFiltro] = useState<string>('todos');
    const [busquedaEjercicio, setBusquedaEjercicio] = useState('');

    const [mostrarFormGrupo, setMostrarFormGrupo] = useState(false);
    const [grupoEnEdicion, setGrupoEnEdicion] = useState<any>(null);
    const [nombreGrupoForm, setNombreGrupoForm] = useState('');

    const [mostrarFormEjercicio, setMostrarFormEjercicio] = useState(false);
    const [ejercicioEnEdicion, setEjercicioEnEdicion] = useState<any>(null);
    const [formEjercicio, setFormEjercicio] = useState<any>(ejercicioVacio);
    const [guardandoEjercicio, setGuardandoEjercicio] = useState(false);

    async function cargarBiblioteca() {
        setCargandoBiblioteca(true);
        const [resGrupos, resEjercicios] = await Promise.all([obtenerGruposEjercicio(), obtenerEjercicios()]);
        if (resGrupos.success) setGrupos(resGrupos.data);
        if (resEjercicios.success) setEjercicios(resEjercicios.data);
        setCargandoBiblioteca(false);
    }

    useEffect(() => { cargarBiblioteca(); }, []);

    const abrirNuevoGrupo = () => { setGrupoEnEdicion(null); setNombreGrupoForm(''); setMostrarFormGrupo(true); };
    const abrirEditarGrupo = (grupo: any) => { setGrupoEnEdicion(grupo); setNombreGrupoForm(grupo.nombre); setMostrarFormGrupo(true); };

    const guardarGrupo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombreGrupoForm.trim()) return;
        const res = grupoEnEdicion
            ? await actualizarGrupoEjercicio(grupoEnEdicion.id, nombreGrupoForm.trim())
            : await crearGrupoEjercicio(nombreGrupoForm.trim());
        if (res.success) {
            setMostrarFormGrupo(false);
            await cargarBiblioteca();
        } else alert(`Error al guardar el grupo: ${res.error}`);
    };

    const eliminarGrupo = async (grupo: any) => {
        if (!confirm(`¿Eliminar el grupo "${grupo.nombre}"? Los ejercicios que pertenecen a este grupo quedarán sin clasificación.`)) return;
        const res = await borrarGrupoEjercicio(grupo.id);
        if (res.success) {
            if (grupoFiltro === grupo.id.toString()) setGrupoFiltro('todos');
            await cargarBiblioteca();
        } else alert(`Error al eliminar el grupo: ${res.error}`);
    };

    const abrirNuevoEjercicio = () => {
        setEjercicioEnEdicion(null);
        setFormEjercicio({ ...ejercicioVacio, grupoId: grupoFiltro !== 'todos' ? grupoFiltro : '' });
        setMostrarFormEjercicio(true);
    };

    const abrirEditarEjercicio = (ejercicio: any) => {
        setEjercicioEnEdicion(ejercicio);
        setFormEjercicio({
            grupoId: ejercicio.grupoId?.toString() || '',
            nombre: ejercicio.nombre || '',
            repTiempo: ejercicio.repTiempo || '',
            peso: ejercicio.peso || '',
            movimiento: ejercicio.movimiento || '',
            series: ejercicio.series || '',
            descanso: ejercicio.descanso || '',
            rm: ejercicio.rm || '',
            comentario: ejercicio.comentario || '',
            video: ejercicio.video || ''
        });
        setMostrarFormEjercicio(true);
    };

    const guardarEjercicioForm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formEjercicio.nombre.trim()) return alert('El nombre del ejercicio es obligatorio.');

        setGuardandoEjercicio(true);
        const payload = {
            grupoId: formEjercicio.grupoId ? parseInt(formEjercicio.grupoId) : null,
            nombre: formEjercicio.nombre.trim(),
            repTiempo: formEjercicio.repTiempo,
            peso: formEjercicio.peso,
            movimiento: formEjercicio.movimiento,
            series: formEjercicio.series,
            descanso: formEjercicio.descanso,
            rm: formEjercicio.rm,
            comentario: formEjercicio.comentario,
            video: formEjercicio.video
        };
        const res = ejercicioEnEdicion
            ? await actualizarEjercicio(ejercicioEnEdicion.id, payload)
            : await crearEjercicio(payload);
        setGuardandoEjercicio(false);

        if (res.success) {
            setMostrarFormEjercicio(false);
            await cargarBiblioteca();
        } else alert(`Error al guardar el ejercicio: ${res.error}`);
    };

    const eliminarEjercicio = async (ejercicio: any) => {
        if (!confirm(`¿Eliminar el ejercicio "${ejercicio.nombre}"?`)) return;
        const res = await borrarEjercicio(ejercicio.id);
        if (res.success) await cargarBiblioteca();
        else alert(`Error al eliminar el ejercicio: ${res.error}`);
    };

    const ejerciciosFiltrados = ejercicios.filter(ej => {
        const coincideGrupo = grupoFiltro === 'todos' || ej.grupoId?.toString() === grupoFiltro;
        const coincideBusqueda = ej.nombre.toLowerCase().includes(busquedaEjercicio.toLowerCase());
        return coincideGrupo && coincideBusqueda;
    });

    // ==================== RUTINAS ====================
    const [pacientesEvaluados, setPacientesEvaluados] = useState<any[]>([]);
    const [cargandoPacientes, setCargandoPacientes] = useState(true);
    const [pacienteRutinaId, setPacienteRutinaId] = useState('');
    const [pacienteRutinaActual, setPacienteRutinaActual] = useState<any>(null);
    const [busquedaPaciente, setBusquedaPaciente] = useState('');
    const [mostrarResultadosPaciente, setMostrarResultadosPaciente] = useState(false);

    const [nombreRutina, setNombreRutina] = useState('');
    const [dias, setDias] = useState(diasVacios());
    const [diaActivo, setDiaActivo] = useState('lunes');
    const [guardandoRutina, setGuardandoRutina] = useState(false);

    const [mostrarBuscadorEjercicios, setMostrarBuscadorEjercicios] = useState(false);
    const [bloqueDestinoId, setBloqueDestinoId] = useState<string | null>(null);
    const [busquedaModal, setBusquedaModal] = useState('');
    const [grupoFiltroModal, setGrupoFiltroModal] = useState('todos');

    useEffect(() => {
        async function cargarPacientesEvaluados() {
            setCargandoPacientes(true);
            const res = await obtenerPacientesEvaluados();
            if (res.success) setPacientesEvaluados(res.data);
            setCargandoPacientes(false);
        }
        cargarPacientesEvaluados();
    }, []);

    useEffect(() => {
        if (!pacienteRutinaId) {
            setPacienteRutinaActual(null);
            setDias(diasVacios());
            setNombreRutina('');
            return;
        }

        const encontrado = pacientesEvaluados.find(p => p.id.toString() === pacienteRutinaId);
        setPacienteRutinaActual(encontrado || null);

        async function cargarRutina() {
            const res = await obtenerRutinaPaciente(parseInt(pacienteRutinaId));
            if (res.success && res.data) {
                setNombreRutina(res.data.rutina.nombre || '');
                const reconstruido = diasVacios();
                for (const bloque of res.data.bloques) {
                    if (!(bloque.dia in reconstruido)) continue;
                    const ejerciciosDelBloque = res.data.ejercicios
                        .filter((ej: any) => ej.bloqueId === bloque.id)
                        .map((ej: any) => ({
                            id: generarIdTemporal(),
                            ejercicioOrigenId: ej.ejercicioOrigenId,
                            nombre: ej.nombre || '', repTiempo: ej.repTiempo || '', peso: ej.peso || '',
                            movimiento: ej.movimiento || '', series: ej.series || '', descanso: ej.descanso || '',
                            rm: ej.rm || '', comentario: ej.comentario || '', video: ej.video || ''
                        }));
                    (reconstruido as any)[bloque.dia].push({ id: generarIdTemporal(), nombre: bloque.nombre || '', ejercicios: ejerciciosDelBloque });
                }
                setDias(reconstruido);
            } else {
                setDias(diasVacios());
                setNombreRutina('');
            }
            setDiaActivo('lunes');
        }
        cargarRutina();
    }, [pacienteRutinaId, pacientesEvaluados]);

    const agregarBloque = () => {
        setDias(prev => ({ ...prev, [diaActivo]: [...(prev as any)[diaActivo], { id: generarIdTemporal(), nombre: '', ejercicios: [] }] }));
    };

    const borrarBloque = (bloqueId: string) => {
        if (!confirm('¿Eliminar este bloque y todos sus ejercicios?')) return;
        setDias(prev => ({ ...prev, [diaActivo]: (prev as any)[diaActivo].filter((b: any) => b.id !== bloqueId) }));
    };

    const renombrarBloque = (bloqueId: string, nombre: string) => {
        setDias(prev => ({ ...prev, [diaActivo]: (prev as any)[diaActivo].map((b: any) => b.id === bloqueId ? { ...b, nombre } : b) }));
    };

    const abrirBuscadorEjercicios = (bloqueId: string) => {
        setBloqueDestinoId(bloqueId);
        setBusquedaModal('');
        setGrupoFiltroModal('todos');
        setMostrarBuscadorEjercicios(true);
    };

    const agregarEjercicioABloque = (ejercicioBiblioteca: any) => {
        if (!bloqueDestinoId) return;
        setDias(prev => ({
            ...prev,
            [diaActivo]: (prev as any)[diaActivo].map((b: any) => b.id !== bloqueDestinoId ? b : {
                ...b,
                ejercicios: [...b.ejercicios, {
                    id: generarIdTemporal(),
                    ejercicioOrigenId: ejercicioBiblioteca.id,
                    nombre: ejercicioBiblioteca.nombre || '',
                    repTiempo: ejercicioBiblioteca.repTiempo || '',
                    peso: ejercicioBiblioteca.peso || '',
                    movimiento: ejercicioBiblioteca.movimiento || '',
                    series: ejercicioBiblioteca.series || '',
                    descanso: ejercicioBiblioteca.descanso || '',
                    rm: ejercicioBiblioteca.rm || '',
                    comentario: ejercicioBiblioteca.comentario || '',
                    video: ejercicioBiblioteca.video || ''
                }]
            })
        }));
    };

    const quitarEjercicioDeBloque = (bloqueId: string, ejercicioId: string) => {
        setDias(prev => ({
            ...prev,
            [diaActivo]: (prev as any)[diaActivo].map((b: any) => b.id !== bloqueId ? b : { ...b, ejercicios: b.ejercicios.filter((e: any) => e.id !== ejercicioId) })
        }));
    };

    const actualizarCampoEjercicioRutina = (bloqueId: string, ejercicioId: string, campo: string, valor: string) => {
        setDias(prev => ({
            ...prev,
            [diaActivo]: (prev as any)[diaActivo].map((b: any) => b.id !== bloqueId ? b : {
                ...b,
                ejercicios: b.ejercicios.map((e: any) => e.id !== ejercicioId ? e : { ...e, [campo]: valor })
            })
        }));
    };

    const manejarGuardarRutina = async () => {
        if (!pacienteRutinaId) return alert('Seleccione un paciente primero.');
        setGuardandoRutina(true);

        const payloadDias: Record<string, any[]> = {};
        for (const d of DIAS) {
            payloadDias[d.key] = (dias as any)[d.key].map((b: any) => ({
                nombre: b.nombre,
                ejercicios: b.ejercicios.map((e: any) => ({
                    ejercicioOrigenId: e.ejercicioOrigenId || null,
                    nombre: e.nombre, repTiempo: e.repTiempo, peso: e.peso, movimiento: e.movimiento,
                    series: e.series, descanso: e.descanso, rm: e.rm, comentario: e.comentario, video: e.video
                }))
            }));
        }

        const res = await guardarRutina({ pacienteId: parseInt(pacienteRutinaId), nombre: nombreRutina, dias: payloadDias });
        setGuardandoRutina(false);

        if (res.success) alert('¡Rutina guardada exitosamente!');
        else alert(`Error al guardar: ${res.error}`);
    };

    const generarPDFRutina = () => {
        if (!pacienteRutinaActual) return;
        const ventana = window.open('', '_blank');
        if (!ventana) return alert('Por favor permita las ventanas emergentes en su navegador.');

        const hayContenido = DIAS.some(d => (dias as any)[d.key].length > 0);

        const seccionesDias = DIAS.map(d => {
            const bloques = (dias as any)[d.key];
            if (bloques.length === 0) return '';
            const bloquesHtml = bloques.map((b: any, i: number) => `
                <div class="bloque">
                    <h4>${escapeHtml(b.nombre || `Bloque ${i + 1}`)}</h4>
                    <table>
                        <thead>
                            <tr><th>Ejercicio</th><th>Movimiento</th><th>Series</th><th>Rep/Tiempo</th><th>Peso</th><th>Descanso</th><th>RM</th><th>Comentario</th><th>Video</th></tr>
                        </thead>
                        <tbody>
                            ${b.ejercicios.map((e: any) => `
                                <tr>
                                    <td>${escapeHtml(e.nombre) || '-'}</td>
                                    <td>${escapeHtml(e.movimiento) || '-'}</td>
                                    <td>${escapeHtml(e.series) || '-'}</td>
                                    <td>${escapeHtml(e.repTiempo) || '-'}</td>
                                    <td>${escapeHtml(e.peso) || '-'}</td>
                                    <td>${escapeHtml(e.descanso) || '-'}</td>
                                    <td>${escapeHtml(e.rm) || '-'}</td>
                                    <td>${escapeHtml(e.comentario) || '-'}</td>
                                    <td>${e.video ? `<a href="${escapeHtml(e.video)}" target="_blank">Enlace</a>` : '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `).join('');
            return `<div class="dia"><h2>${d.label}</h2>${bloquesHtml}</div>`;
        }).join('');

        ventana.document.write(`
            <html>
                <head>
                    <title>Rutina - ${escapeHtml(pacienteRutinaActual.nombre)} ${escapeHtml(pacienteRutinaActual.apellido)}</title>
                    <style>
                        @page { size: auto; margin: 0mm; }
                        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                        h1 { color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 5px; }
                        h2 { color: #1e293b; margin-top: 24px; background: #eef2ff; padding: 6px 10px; border-radius: 6px; }
                        h4 { margin: 14px 0 6px; color: #4f46e5; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
                        th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 0.85rem; }
                        th { background: #f1f5f9; color: #1e293b; }
                        @media print { button { display: none; } }
                    </style>
                </head>
                <body>
                    <button onclick="window.print()" style="background: #4f46e5; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin-bottom: 20px;">Imprimir / Guardar en PDF</button>

                    <h1>Planificación de Entrenamiento</h1>

                    <div class="info-grid">
                        <div><strong>Paciente:</strong> ${escapeHtml(pacienteRutinaActual.nombre)} ${escapeHtml(pacienteRutinaActual.apellido)}</div>
                        <div><strong>RUT:</strong> ${escapeHtml(pacienteRutinaActual.rut)}</div>
                        <div><strong>Rutina:</strong> ${escapeHtml(nombreRutina) || 'Sin nombre'}</div>
                        <div><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CL')}</div>
                    </div>

                    ${hayContenido ? seccionesDias : '<p>No hay ejercicios asignados todavía.</p>'}
                </body>
            </html>
        `);
        ventana.document.close();
    };

    const pacientesFiltrados = pacientesEvaluados.filter(p => {
        const termino = busquedaPaciente.toLowerCase();
        const nombreCompleto = `${p.nombre} ${p.apellido}`.toLowerCase();
        const rut = (p.rut || '').toLowerCase();
        return nombreCompleto.includes(termino) || rut.includes(termino);
    });

    const ejerciciosFiltradosModal = ejercicios.filter(ej => {
        const coincideGrupo = grupoFiltroModal === 'todos' || ej.grupoId?.toString() === grupoFiltroModal;
        const coincideBusqueda = ej.nombre.toLowerCase().includes(busquedaModal.toLowerCase());
        return coincideGrupo && coincideBusqueda;
    });

    const nombreGrupo = (grupoId: any) => grupos.find(g => g.id === grupoId)?.nombre;

    return (
        <main className="main-layout" style={{ minHeight: '100vh', display: 'flex' }}>
            <div className='app-container' style={{ display: 'flex', width: '100%' }}>
                <Sidebar />
                <div className='content-container' style={{ backgroundColor: '#525e92', padding: '1.5rem', flexGrow: 1, overflowY: 'auto' }}>
                    <div className='card-paciente' style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', color: '#333333' }}>

                        <div style={{ marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem' }}>
                            <h1 style={{ margin: '0 0 1rem 0', fontSize: '1.6rem', color: '#1a202c', fontWeight: 'bold' }}>Entrenamiento</h1>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => setTab('biblioteca')} style={{ padding: '0.6rem 1.2rem', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: tab === 'biblioteca' ? '#4f46e5' : '#edf2f7', color: tab === 'biblioteca' ? '#fff' : '#4a5568' }}>
                                    Biblioteca de Ejercicios
                                </button>
                                <button onClick={() => setTab('rutinas')} style={{ padding: '0.6rem 1.2rem', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: tab === 'rutinas' ? '#4f46e5' : '#edf2f7', color: tab === 'rutinas' ? '#fff' : '#4a5568' }}>
                                    Planificación de Rutinas
                                </button>
                            </div>
                        </div>

                        {/* ==================== TAB: BIBLIOTECA ==================== */}
                        {tab === 'biblioteca' && (
                            cargandoBiblioteca ? <p>Cargando biblioteca de ejercicios...</p> : (
                                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                                    <div style={{ width: '240px', flexShrink: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                            <h3 style={{ margin: 0, color: '#2d3748' }}>Grupos</h3>
                                            <button onClick={abrirNuevoGrupo} style={{ ...estiloBotonPrimario, padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}>+ Grupo</button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                            <button onClick={() => setGrupoFiltro('todos')} style={{ textAlign: 'left', padding: '0.6rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: grupoFiltro === 'todos' ? '#4f46e5' : '#f8fafc', color: grupoFiltro === 'todos' ? '#fff' : '#4a5568' }}>
                                                Todos ({ejercicios.length})
                                            </button>
                                            {grupos.map(g => (
                                                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                    <button onClick={() => setGrupoFiltro(g.id.toString())} style={{ flex: 1, textAlign: 'left', padding: '0.6rem', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: grupoFiltro === g.id.toString() ? '#4f46e5' : '#f8fafc', color: grupoFiltro === g.id.toString() ? '#fff' : '#4a5568' }}>
                                                        {g.nombre} ({ejercicios.filter(e => e.grupoId === g.id).length})
                                                    </button>
                                                    <button title="Renombrar" onClick={() => abrirEditarGrupo(g)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096' }}>✎</button>
                                                    <button title="Eliminar" onClick={() => eliminarGrupo(g)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e' }}>🗑</button>
                                                </div>
                                            ))}
                                            {grupos.length === 0 && <p style={{ color: '#a0aec0', fontSize: '0.85rem' }}>Aún no hay grupos creados.</p>}
                                        </div>
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                            <input
                                                type="text"
                                                placeholder="Buscar ejercicio por nombre..."
                                                value={busquedaEjercicio}
                                                onChange={(e) => setBusquedaEjercicio(e.target.value)}
                                                style={{ ...estiloInput, maxWidth: '320px' }}
                                            />
                                            <button onClick={abrirNuevoEjercicio} style={estiloBotonPrimario}>+ Nuevo Ejercicio</button>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                            {ejerciciosFiltrados.map(ej => (
                                                <div key={ej.id} style={{ ...estiloCard, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <h4 style={{ margin: 0, color: '#1a202c' }}>{ej.nombre}</h4>
                                                        <div style={{ display: 'flex', gap: '0.2rem', flexShrink: 0 }}>
                                                            <button title="Editar" onClick={() => abrirEditarEjercicio(ej)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096' }}>✎</button>
                                                            <button title="Eliminar" onClick={() => eliminarEjercicio(ej)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e' }}>🗑</button>
                                                        </div>
                                                    </div>
                                                    {ej.grupoId && <span style={{ alignSelf: 'flex-start', fontSize: '0.75rem', backgroundColor: '#e0e7ff', color: '#4338ca', padding: '0.1rem 0.5rem', borderRadius: '999px', fontWeight: 'bold' }}>{nombreGrupo(ej.grupoId)}</span>}
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.2rem 0.6rem', fontSize: '0.82rem', color: '#4a5568' }}>
                                                        {ej.repTiempo && <span><strong>Rep/Tiempo:</strong> {ej.repTiempo}</span>}
                                                        {ej.peso && <span><strong>Peso:</strong> {ej.peso}</span>}
                                                        {ej.movimiento && <span><strong>Movimiento:</strong> {ej.movimiento}</span>}
                                                        {ej.series && <span><strong>Series:</strong> {ej.series}</span>}
                                                        {ej.descanso && <span><strong>Descanso:</strong> {ej.descanso}</span>}
                                                        {ej.rm && <span><strong>RM:</strong> {ej.rm}</span>}
                                                    </div>
                                                    {ej.comentario && <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#718096' }}>{ej.comentario}</p>}
                                                    {ej.video && <a href={ej.video} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.82rem', color: '#0284c7' }}>🔗 Ver video</a>}
                                                </div>
                                            ))}
                                            {ejerciciosFiltrados.length === 0 && <p style={{ color: '#a0aec0' }}>No hay ejercicios que coincidan.</p>}
                                        </div>
                                    </div>
                                </div>
                            )
                        )}

                        {/* ==================== TAB: RUTINAS ==================== */}
                        {tab === 'rutinas' && (
                            <div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ position: 'relative', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={estiloLabel}>Buscar Paciente Evaluado (Nombre, Apellido o RUT)</label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input
                                                type="text"
                                                placeholder="Ej: Juan Pérez o 19345..."
                                                value={busquedaPaciente}
                                                onChange={(e) => { setBusquedaPaciente(e.target.value); setMostrarResultadosPaciente(true); }}
                                                onFocus={() => setMostrarResultadosPaciente(true)}
                                                style={estiloInput}
                                            />
                                            {pacienteRutinaId && (
                                                <button type="button" onClick={() => { setPacienteRutinaId(''); setBusquedaPaciente(''); }} style={{ backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '6px', padding: '0 1rem', cursor: 'pointer', fontWeight: 'bold' }}>
                                                    Limpiar
                                                </button>
                                            )}
                                        </div>
                                        {mostrarResultadosPaciente && busquedaPaciente && (
                                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, backgroundColor: '#fff', border: '1px solid #cbd5e0', borderRadius: '6px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto', marginTop: '4px' }}>
                                                {pacientesFiltrados.map(p => (
                                                    <div key={p.id} onClick={() => { setPacienteRutinaId(p.id.toString()); setBusquedaPaciente(`${p.nombre} ${p.apellido} (${p.rut})`); setMostrarResultadosPaciente(false); }}
                                                        style={{ padding: '0.8rem', cursor: 'pointer', borderBottom: '1px solid #edf2f7' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f7fafc'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}>
                                                        <span style={{ fontWeight: 'bold' }}>{p.nombre} {p.apellido}</span>
                                                        <span style={{ fontSize: '0.85rem', color: '#718096', marginLeft: '8px' }}>RUT: {p.rut}</span>
                                                    </div>
                                                ))}
                                                {pacientesFiltrados.length === 0 && <div style={{ padding: '0.8rem', color: '#a0aec0' }}>Sin coincidencias.</div>}
                                            </div>
                                        )}
                                        {!cargandoPacientes && pacientesEvaluados.length === 0 && (
                                            <p style={{ color: '#a0aec0', fontSize: '0.85rem' }}>No hay pacientes con evaluaciones guardadas todavía. Realice una evaluación primero.</p>
                                        )}
                                    </div>
                                </div>

                                {pacienteRutinaId ? (
                                    <div>
                                        <div style={{ marginBottom: '1.5rem', maxWidth: '400px' }}>
                                            <label style={estiloLabel}>Nombre de la Rutina</label>
                                            <input type="text" value={nombreRutina} onChange={(e) => setNombreRutina(e.target.value)} placeholder="Ej: Rutina de fuerza - Agosto" style={{ ...estiloInput, marginTop: '0.3rem' }} />
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', borderBottom: '1px solid #edf2f7', paddingBottom: '1rem' }}>
                                            {DIAS.map(d => (
                                                <button key={d.key} onClick={() => setDiaActivo(d.key)} style={{ padding: '0.6rem 1.2rem', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: diaActivo === d.key ? '#4f46e5' : '#edf2f7', color: diaActivo === d.key ? '#fff' : '#4a5568' }}>
                                                    {d.label} ({(dias as any)[d.key].length})
                                                </button>
                                            ))}
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {(dias as any)[diaActivo].map((bloque: any, indiceBloque: number) => (
                                                <div key={bloque.id} style={estiloCard}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                                        <input
                                                            type="text"
                                                            value={bloque.nombre}
                                                            onChange={(e) => renombrarBloque(bloque.id, e.target.value)}
                                                            placeholder={`Bloque ${indiceBloque + 1}`}
                                                            style={{ ...estiloInput, maxWidth: '300px', fontWeight: 'bold', border: '1px solid transparent', backgroundColor: 'transparent', padding: '0.3rem' }}
                                                        />
                                                        <button onClick={() => borrarBloque(bloque.id)} style={estiloBotonPeligro}>🗑 Eliminar Bloque</button>
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                                        {bloque.ejercicios.map((ej: any) => (
                                                            <div key={ej.id} style={{ background: '#ffffff', padding: '0.8rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                                    <input
                                                                        type="text"
                                                                        value={ej.nombre}
                                                                        onChange={(e) => actualizarCampoEjercicioRutina(bloque.id, ej.id, 'nombre', e.target.value)}
                                                                        placeholder="Nombre del ejercicio"
                                                                        style={{ ...estiloInput, fontWeight: 'bold' }}
                                                                    />
                                                                    <button onClick={() => quitarEjercicioDeBloque(bloque.id, ej.id)} style={estiloBotonPeligro}>✕</button>
                                                                </div>
                                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                                    {CAMPOS_EJERCICIO.map(campo => (
                                                                        <div key={campo.key}>
                                                                            <label style={estiloLabel}>{campo.label}</label>
                                                                            <input type="text" value={ej[campo.key]} onChange={(e) => actualizarCampoEjercicioRutina(bloque.id, ej.id, campo.key, e.target.value)} style={{ ...estiloInput, marginTop: '0.2rem' }} />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                                    <div>
                                                                        <label style={estiloLabel}>Video (enlace)</label>
                                                                        <input type="text" value={ej.video} onChange={(e) => actualizarCampoEjercicioRutina(bloque.id, ej.id, 'video', e.target.value)} placeholder="https://..." style={{ ...estiloInput, marginTop: '0.2rem' }} />
                                                                    </div>
                                                                    <div>
                                                                        <label style={estiloLabel}>Comentario</label>
                                                                        <input type="text" value={ej.comentario} onChange={(e) => actualizarCampoEjercicioRutina(bloque.id, ej.id, 'comentario', e.target.value)} style={{ ...estiloInput, marginTop: '0.2rem' }} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <button onClick={() => abrirBuscadorEjercicios(bloque.id)} style={{ ...estiloBotonSecundario, marginTop: '0.8rem' }}>+ Agregar Ejercicio</button>
                                                </div>
                                            ))}

                                            <button onClick={agregarBloque} style={{ ...estiloBotonPrimario, alignSelf: 'flex-start' }}>+ Agregar Bloque a {DIAS.find(d => d.key === diaActivo)?.label}</button>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '2rem', borderTop: '1px solid #edf2f7', paddingTop: '1.2rem' }}>
                                            <button type="button" onClick={generarPDFRutina} style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.7rem 1.4rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                📄 Generar PDF
                                            </button>
                                            <button type="button" disabled={guardandoRutina} onClick={manejarGuardarRutina} style={{ ...estiloBotonPrimario, padding: '0.7rem 1.4rem' }}>
                                                {guardandoRutina ? 'Guardando...' : 'Guardar Rutina'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p style={{ color: '#a0aec0' }}>Seleccione un paciente para comenzar a planificar su rutina.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ==================== MODAL: GRUPO ==================== */}
            {mostrarFormGrupo && (
                <div className="modal-overlay">
                    <div className="modal-form-card" style={{ maxWidth: '420px' }}>
                        <div className="modal-header">
                            <h2>{grupoEnEdicion ? 'Editar Grupo' : 'Nuevo Grupo'}</h2>
                            <button className="btn-cerrar-x" onClick={() => setMostrarFormGrupo(false)}>&times;</button>
                        </div>
                        <form className="paciente-form" onSubmit={guardarGrupo}>
                            <div className="form-group">
                                <label>Nombre del Grupo</label>
                                <input type="text" value={nombreGrupoForm} onChange={(e) => setNombreGrupoForm(e.target.value)} autoFocus required />
                            </div>
                            <div className="form-action">
                                <button type="button" className="btn-cancelar" onClick={() => setMostrarFormGrupo(false)}>Cancelar</button>
                                <button type="submit" className="btn-guardar">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== MODAL: EJERCICIO ==================== */}
            {mostrarFormEjercicio && (
                <div className="modal-overlay">
                    <div className="modal-form-card" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <h2>{ejercicioEnEdicion ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}</h2>
                            <button className="btn-cerrar-x" onClick={() => setMostrarFormEjercicio(false)}>&times;</button>
                        </div>
                        <form className="paciente-form" onSubmit={guardarEjercicioForm}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nombre del Ejercicio</label>
                                    <input type="text" value={formEjercicio.nombre} onChange={(e) => setFormEjercicio((p: any) => ({ ...p, nombre: e.target.value }))} required autoFocus />
                                </div>
                                <div className="form-group">
                                    <label>Grupo</label>
                                    <select value={formEjercicio.grupoId} onChange={(e) => setFormEjercicio((p: any) => ({ ...p, grupoId: e.target.value }))} style={{ padding: '10px 12px', border: '1px solid #cccccc', borderRadius: '6px', fontSize: '0.95rem' }}>
                                        <option value="">Sin grupo</option>
                                        {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                                    </select>
                                </div>
                            </div>

                            {CAMPOS_EJERCICIO.reduce((filas: any[], campo, idx) => {
                                if (idx % 2 === 0) filas.push([campo]); else filas[filas.length - 1].push(campo);
                                return filas;
                            }, []).map((par: any[], i: number) => (
                                <div className="form-row" key={i}>
                                    {par.map(campo => (
                                        <div className="form-group" key={campo.key}>
                                            <label>{campo.label}</label>
                                            <input type="text" value={formEjercicio[campo.key]} onChange={(e) => setFormEjercicio((p: any) => ({ ...p, [campo.key]: e.target.value }))} />
                                        </div>
                                    ))}
                                </div>
                            ))}

                            <div className="form-group">
                                <label>Video (enlace)</label>
                                <input type="text" value={formEjercicio.video} onChange={(e) => setFormEjercicio((p: any) => ({ ...p, video: e.target.value }))} placeholder="https://..." />
                            </div>
                            <div className="form-group">
                                <label>Comentario</label>
                                <input type="text" value={formEjercicio.comentario} onChange={(e) => setFormEjercicio((p: any) => ({ ...p, comentario: e.target.value }))} />
                            </div>

                            <div className="form-action">
                                <button type="button" className="btn-cancelar" onClick={() => setMostrarFormEjercicio(false)}>Cancelar</button>
                                <button type="submit" className="btn-guardar" disabled={guardandoEjercicio}>{guardandoEjercicio ? 'Guardando...' : 'Guardar Ejercicio'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== MODAL: BUSCADOR DE EJERCICIOS PARA LA RUTINA ==================== */}
            {mostrarBuscadorEjercicios && (
                <div className="modal-overlay">
                    <div className="modal-form-card" style={{ maxWidth: '640px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header">
                            <h2>Agregar Ejercicio al Bloque</h2>
                            <button className="btn-cerrar-x" onClick={() => setMostrarBuscadorEjercicios(false)}>&times;</button>
                        </div>

                        <input
                            type="text"
                            placeholder="Buscar ejercicio por nombre..."
                            value={busquedaModal}
                            onChange={(e) => setBusquedaModal(e.target.value)}
                            style={{ ...estiloInput, marginBottom: '0.8rem' }}
                            autoFocus
                        />

                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
                            <button onClick={() => setGrupoFiltroModal('todos')} style={{ padding: '0.3rem 0.7rem', borderRadius: '999px', border: '1px solid #cbd5e0', cursor: 'pointer', fontSize: '0.8rem', backgroundColor: grupoFiltroModal === 'todos' ? '#4f46e5' : '#fff', color: grupoFiltroModal === 'todos' ? '#fff' : '#4a5568' }}>Todos</button>
                            {grupos.map(g => (
                                <button key={g.id} onClick={() => setGrupoFiltroModal(g.id.toString())} style={{ padding: '0.3rem 0.7rem', borderRadius: '999px', border: '1px solid #cbd5e0', cursor: 'pointer', fontSize: '0.8rem', backgroundColor: grupoFiltroModal === g.id.toString() ? '#4f46e5' : '#fff', color: grupoFiltroModal === g.id.toString() ? '#fff' : '#4a5568' }}>{g.nombre}</button>
                            ))}
                        </div>

                        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {ejerciciosFiltradosModal.map(ej => (
                                <div key={ej.id} onClick={() => agregarEjercicioABloque(ej)} style={{ padding: '0.7rem', border: '1px solid #edf2f7', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f7fafc'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}>
                                    <div>
                                        <span style={{ fontWeight: 'bold' }}>{ej.nombre}</span>
                                        {ej.grupoId && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', backgroundColor: '#e0e7ff', color: '#4338ca', padding: '0.1rem 0.5rem', borderRadius: '999px' }}>{nombreGrupo(ej.grupoId)}</span>}
                                    </div>
                                    <span style={{ color: '#4f46e5', fontWeight: 'bold' }}>+ Agregar</span>
                                </div>
                            ))}
                            {ejerciciosFiltradosModal.length === 0 && <p style={{ color: '#a0aec0' }}>No hay ejercicios que coincidan. Puedes crearlos desde la Biblioteca de Ejercicios.</p>}
                        </div>

                        <div className="form-action">
                            <button type="button" className="btn-guardar" onClick={() => setMostrarBuscadorEjercicios(false)}>Listo</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
