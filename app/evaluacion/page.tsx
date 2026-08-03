"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import '@/app/estilos/main.css';
import '@/app/globals.css';
import '@/app/estilos/pacientes.css';

import { 
  obtenerPaciente, 
  guardarAnamnesis, obtenerAnamnesisPaciente,
  guardarAntropometria, obtenerAntropometriaPaciente,
  guardarFMS, obtenerFMSPaciente,
  guardarSaltoVertical, obtenerSaltoVerticalPaciente,
  guardarVelocidad, obtenerVelocidadPaciente,
  guardarFuerzaMaxima, obtenerFuerzaMaximaPaciente,
  guardarGastoCalorico, obtenerGastoCaloricoPaciente
} from '../action';

import { calcularResultadosAntropometria } from '../lib/calculosAntropometria';


export default function EvaluacionesPage() {
    const [pacientes, setPacientes] = useState<any[]>([]);
    const [pacienteSeleccionadoId, setPacienteSeleccionadoId] = useState<string>("");
    const [pacienteActual, setPacienteActual] = useState<any>(null);
    const [evaluacionActiva, setEvaluacionActiva] = useState<number>(1);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    // ESTADOS BUSCADOR 
    const [busqueda, setBusqueda] = useState("");
    const [mostrarResultados, setMostrarResultados] = useState(false);

    //  ESTADOS EVALUACIÓN 1: ANAMNESIS ---
    const [antecedentesMorbidos, setAntecedentesMorbidos] = useState("");
    const [antecedentesMedicos, setAntecedentesMedicos] = useState("");
    const [informacionNutricional, setInformacionNutricional] = useState("");
    const [informacionDeportiva, setInformacionDeportiva] = useState("");
    const [objetivos, setObjetivos] = useState("");

    // ESTADOS EVALUACIÓN 2: ANTROPOMETRÍA ISAK 
    const [antropometria, setAntropometria] = useState({
        peso: "", talla: "", diametroHumeral: "", diametroFemoral: "",
        perimetroBrazoRelajadoDer: "", perimetroBrazoFlexionadoDer: "",
        perimetroBrazoRelajadoIzq: "", perimetroBrazoFlexionadoIzq: "",
        perimetroPectoral: "", perimetroEspalda: "", perimetroCintura: "",
        perimetroCinturaMaxima: "", perimetroCadera: "", perimetroMusloDer: "",
        perimetroMusloIzq: "", perimetroGemeloDer: "", perimetroGemeloIzq: "",
        pliegueTricipital: "", pliegueBicipital: "", pliegueSubescapular: "",
        pliegueAbdominal: "", pliegueSupraespinal: "", pliegueSuprailiaco: "",
        pliegueMuslo: "", pliegueGemelo: "", notas: ""
    });

    const manejarCambioAntropometria = (campo: string, valor: string) => {
        setAntropometria(prev => ({ ...prev, [campo]: valor }));
    };

    //  ESTADOS EVALUACIÓN 3: FMS 
    const [fmsData, setFmsData] = useState({
        sentadillaProfunda: 0,
        pasoValla: 0,
        estocadaLinea: 0,
        movilidadHombros: 0,
        elevacionPiernaRecta: 0,
        estabilidadTroncoFlexion: 0,
        estabilidadRotatoria: 0,
        notas: ""
    });

    const manejarCambioFMS = (campo: string, valor: number | string) => {
    setFmsData(prev => ({ ...prev, [campo]: valor }));
    };

    // Calculo automatico del puntaje total FMS
    const puntajeTotalFMS = Number(fmsData.sentadillaProfunda) +
                        Number(fmsData.pasoValla) +
                        Number(fmsData.estocadaLinea) +
                        Number(fmsData.movilidadHombros) +
                        Number(fmsData.elevacionPiernaRecta) +
                        Number(fmsData.estabilidadTroncoFlexion) +
                        Number(fmsData.estabilidadRotatoria);

    // ESTADOS EVALUACION 4: SALTO VERTICAL
    const [saltoVerticalData, setSaltoVerticalData] = useState({
        cmj: "",
        sj: "",
        cmjB: "",
        dropJump: "",
        depthJump: "",
        carreraCompleta: "",
        notas: ""
    });

    const manejarCambioSaltoVertical = (campo: string, valor: string) => {
        setSaltoVerticalData(prev => ({ ...prev, [campo]: valor }));
    };

    // ESTADOS EVALUACION 5: VELOCIDAD
    const [velocidadData, setVelocidadData] = useState({
        tiempo10m: "",
        tiempo40m: "",
        notas: ""
    });

    const manejarCambioVelocidad = (campo: string, valor: string) => {
        setVelocidadData(prev => ({ ...prev, [campo]: valor }));
    };

    // Cálculos de velocidad en Km/h en tiempo real
    const t10 = parseFloat(velocidadData.tiempo10m);
    const t40 = parseFloat(velocidadData.tiempo40m);

    const kmh10m = (t10 > 0) ? (36 / t10).toFixed(2) : "0.00";
    const kmh40m = (t40 > 0) ? (144 / t40).toFixed(2) : "0.00";

    // ESTADOS EVALUACION 6: FUERZA MAXIMA
    const [fuerzaData, setFuerzaData] = useState({
        pesoMuerto: "",
        sentadilla: "",
        pressBanca: "",
        notas: ""
    });

    const manejarCambioFuerza = (campo: string, valor: string) => {
        setFuerzaData(prev => ({ ...prev, [campo]: valor }));
    };

    // Cálculo en tiempo real del Total Levantado (Kg)
    const pm = parseFloat(fuerzaData.pesoMuerto) || 0;
    const sq = parseFloat(fuerzaData.sentadilla) || 0;
    const bp = parseFloat(fuerzaData.pressBanca) || 0;
    const totalLevantadoKg = (pm + sq + bp).toFixed(2);

    // Función auxiliar para calcular edad
    const obtenerEdad = (fechaNacimiento: string) => {
        if (!fechaNacimiento) return 25;
        const hoy = new Date();
        const cumple = new Date(fechaNacimiento);
        let edad = hoy.getFullYear() - cumple.getFullYear();
        const m = hoy.getMonth() - cumple.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) edad--;
        return edad > 0 ? edad : 25;
    };

    // ESTADOS EVALUACION 7: GASTO CALORICO 
    const [nutricionData, setNutricionData] = useState({
        gastoBasal: "",
        gastoEntrenamiento: "",
        gastoDescanso: "",
        proteinaEntrenamiento: "",
        proteinaDescanso: "",
        grasasEntrenamiento: "",
        grasasDescanso: "",
        carbohidratosEntrenamiento: "",
        carbohidratosDescanso: "",
        especificaciones: ""
    });

    const manejarCambioNutricion = (campo: string, valor: string) => {
        setNutricionData(prev => ({ ...prev, [campo]: valor }));
    };

    // Cálculo de calorías por Macros para referencia
    const pEnt = parseFloat(nutricionData.proteinaEntrenamiento) || 0;
    const gEnt = parseFloat(nutricionData.grasasEntrenamiento) || 0;
    const cEnt = parseFloat(nutricionData.carbohidratosEntrenamiento) || 0;
    const kcalMacrosEnt = (pEnt * 4) + (gEnt * 9) + (cEnt * 4);

    const pDes = parseFloat(nutricionData.proteinaDescanso) || 0;
    const gDes = parseFloat(nutricionData.grasasDescanso) || 0;
    const cDes = parseFloat(nutricionData.carbohidratosDescanso) || 0;
    const kcalMacrosDes = (pDes * 4) + (gDes * 9) + (cDes * 4);

    // Cargar pacientes
    useEffect(() => {
        async function cargarPacientes() {
            setCargando(true);
            const res = await obtenerPaciente();
            if (res.success) setPacientes(res.data);
            setCargando(false);
        }
        cargarPacientes();
    }, []);

    // Al seleccionar paciente, guardar su objeto completo e importar historiales
    useEffect(() => {
        if (!pacienteSeleccionadoId) {
            setPacienteActual(null);
            return;
        }

        const pFound = pacientes.find(p => p.id.toString() === pacienteSeleccionadoId);
        setPacienteActual(pFound || null);
        const pId = parseInt(pacienteSeleccionadoId);

        async function cargarDatosPaciente() {

            // Cargar Anamnesis
            const resAnam = await obtenerAnamnesisPaciente(pId);
            if (resAnam.success && resAnam.data.length > 0) {
                const u = resAnam.data[0];
                setAntecedentesMorbidos(u.antecedentesMorbidos || "");
                setAntecedentesMedicos(u.antecedentesMedicos || "");
                setInformacionNutricional(u.informacionNutricional || "");
                setInformacionDeportiva(u.informacionDeportiva || "");
                setObjetivos(u.objetivos || "");
            } else {
                limpiarFormularioAnamnesis();
            }

            // Cargar Antropometría
            const resAntro = await obtenerAntropometriaPaciente(pId);
            if (resAntro.success && resAntro.data.length > 0) {
                const a = resAntro.data[0];
                setAntropometria({
                    peso: a.peso?.toString() || "",
                    talla: a.talla?.toString() || "",
                    diametroHumeral: a.diametroHumeral?.toString() || "",
                    diametroFemoral: a.diametroFemoral?.toString() || "",
                    perimetroBrazoRelajadoDer: a.perimetroBrazoRelajadoDer?.toString() || "",
                    perimetroBrazoFlexionadoDer: a.perimetroBrazoFlexionadoDer?.toString() || "",
                    perimetroBrazoRelajadoIzq: a.perimetroBrazoRelajadoIzq?.toString() || "",
                    perimetroBrazoFlexionadoIzq: a.perimetroBrazoFlexionadoIzq?.toString() || "",
                    perimetroPectoral: a.perimetroPectoral?.toString() || "",
                    perimetroEspalda: a.perimetroEspalda?.toString() || "",
                    perimetroCintura: a.perimetroCintura?.toString() || "",
                    perimetroCinturaMaxima: a.perimetroCinturaMaxima?.toString() || "",
                    perimetroCadera: a.perimetroCadera?.toString() || "",
                    perimetroMusloDer: a.perimetroMusloDer?.toString() || "",
                    perimetroMusloIzq: a.perimetroMusloIzq?.toString() || "",
                    perimetroGemeloDer: a.perimetroGemeloDer?.toString() || "",
                    perimetroGemeloIzq: a.perimetroGemeloIzq?.toString() || "",
                    pliegueTricipital: a.pliegueTricipital?.toString() || "",
                    pliegueBicipital: a.pliegueBicipital?.toString() || "",
                    pliegueSubescapular: a.pliegueSubescapular?.toString() || "",
                    pliegueAbdominal: a.pliegueAbdominal?.toString() || "",
                    pliegueSupraespinal: a.pliegueSupraespinal?.toString() || "",
                    pliegueSuprailiaco: a.pliegueSuprailiaco?.toString() || "",
                    pliegueMuslo: a.pliegueMuslo?.toString() || "",
                    pliegueGemelo: a.pliegueGemelo?.toString() || "",
                    notas: a.notas || ""
                });
            } else {
                limpiarFormularioAntropometria();
            }

            // Cargar FMS
            const resFMS = await obtenerFMSPaciente(pId);
            if (resFMS.success && resFMS.data.length > 0) {
                const f = resFMS.data[0];
                setFmsData({
                    sentadillaProfunda: f.sentadillaProfunda || 0,
                    pasoValla: f.pasoValla || 0,
                    estocadaLinea: f.estocadaLinea || 0,
                    movilidadHombros: f.movilidadHombros || 0,
                    elevacionPiernaRecta: f.elevacionPiernaRecta || 0,
                    estabilidadTroncoFlexion: f.estabilidadTroncoFlexion || 0,
                    estabilidadRotatoria: f.estabilidadRotatoria || 0,
                    notas: f.notas || ""
                });
            } else {
                limpiarFormularioFMS();
            }

            // Cargar Salto Vertical
            const resSalto = await obtenerSaltoVerticalPaciente(pId);
            if (resSalto.success && resSalto.data.length > 0) {
                const s = resSalto.data[0];
                setSaltoVerticalData({
                    cmj: s.cmj?.toString() || "",
                    sj: s.sj?.toString() || "",
                    cmjB: s.cmjB?.toString() || "",
                    dropJump: s.dropJump?.toString() || "",
                    depthJump: s.depthJump?.toString() || "",
                    carreraCompleta: s.carreraCompleta?.toString() || "",
                    notas: s.notas || ""
                });
            } else {
                limpiarFormularioSaltoVertical();
            }

            // Cargar Velocidad
            const resVel = await obtenerVelocidadPaciente(pId);
            if (resVel.success && resVel.data.length > 0) {
                const v = resVel.data[0];
                setVelocidadData({
                    tiempo10m: v.tiempo10m?.toString() || "",
                    tiempo40m: v.tiempo40m?.toString() || "",
                    notas: v.notas || ""
                });
            } else {
                limpiarFormularioVelocidad();
            }
            
            // Cargar Fuerza Máxima
            const resFuerza = await obtenerFuerzaMaximaPaciente(pId);
            if (resFuerza.success && resFuerza.data.length > 0) {
                const f = resFuerza.data[0];
                setFuerzaData({
                    pesoMuerto: f.pesoMuerto?.toString() || "",
                    sentadilla: f.sentadilla?.toString() || "",
                    pressBanca: f.pressBanca?.toString() || "",
                    notas: f.notas || ""
                });
            } else {
                limpiarFormularioFuerza();
            }

            // Cargar Gasto Calórico y Nutrición
            const resNutri = await obtenerGastoCaloricoPaciente(pId);
            if (resNutri.success && resNutri.data.length > 0) {
                const n = resNutri.data[0];
                setNutricionData({
                    gastoBasal: n.gastoBasal?.toString() || "",
                    gastoEntrenamiento: n.gastoEntrenamiento?.toString() || "",
                    gastoDescanso: n.gastoDescanso?.toString() || "",
                    proteinaEntrenamiento: n.proteinaEntrenamiento?.toString() || "",
                    proteinaDescanso: n.proteinaDescanso?.toString() || "",
                    grasasEntrenamiento: n.grasasEntrenamiento?.toString() || "",
                    grasasDescanso: n.grasasDescanso?.toString() || "",
                    carbohidratosEntrenamiento: n.carbohidratosEntrenamiento?.toString() || "",
                    carbohidratosDescanso: n.carbohidratosDescanso?.toString() || "",
                    especificaciones: n.especificaciones || ""
                });
            } else {
                limpiarFormularioNutricion();
            }
        }

        cargarDatosPaciente();
    }, [pacienteSeleccionadoId, pacientes]);

    // Limpiar Formulario Anamnesis
    const limpiarFormularioAnamnesis = () => {
        setAntecedentesMorbidos(""); setAntecedentesMedicos("");
        setInformacionNutricional(""); setInformacionDeportiva(""); setObjetivos("");
    };

    // Limpiar Formulario Antropometria
    const limpiarFormularioAntropometria = () => {
        setAntropometria({
            peso: "", talla: "", diametroHumeral: "", diametroFemoral: "",
            perimetroBrazoRelajadoDer: "", perimetroBrazoFlexionadoDer: "",
            perimetroBrazoRelajadoIzq: "", perimetroBrazoFlexionadoIzq: "",
            perimetroPectoral: "", perimetroEspalda: "", perimetroCintura: "",
            perimetroCinturaMaxima: "", perimetroCadera: "", perimetroMusloDer: "",
            perimetroMusloIzq: "", perimetroGemeloDer: "", perimetroGemeloIzq: "",
            pliegueTricipital: "", pliegueBicipital: "", pliegueSubescapular: "",
            pliegueAbdominal: "", pliegueSupraespinal: "", pliegueSuprailiaco: "",
            pliegueMuslo: "", pliegueGemelo: "", notas: ""
        });
    };

    // Limpiar Formulario FMS
    const limpiarFormularioFMS = () => {
    setFmsData({
        sentadillaProfunda: 0,
        pasoValla: 0,
        estocadaLinea: 0,
        movilidadHombros: 0,
        elevacionPiernaRecta: 0,
        estabilidadTroncoFlexion: 0,
        estabilidadRotatoria: 0,
        notas: ""
        });
    };

    // Limpiar Formulario Salto Vertical
    const limpiarFormularioSaltoVertical = () => {
        setSaltoVerticalData({
            cmj: "",
            sj: "",
            cmjB: "",
            dropJump: "",
            depthJump: "",
            carreraCompleta: "",
            notas: ""
        });
    };

    // Limpiar Formulario Velocidad
    const limpiarFormularioVelocidad = () => {
        setVelocidadData({
            tiempo10m: "",
            tiempo40m: "",
            notas: ""
        });
    };

    // Limpiar Formulario Fuerza Maxima
    const limpiarFormularioFuerza = () => {
        setFuerzaData({
            pesoMuerto: "",
            sentadilla: "",
            pressBanca: "",
            notas: ""
        });
    };

    // Limpiar Formulario Gasto Calorico
    const limpiarFormularioNutricion = () => {
        setNutricionData({
            gastoBasal: "",
            gastoEntrenamiento: "",
            gastoDescanso: "",
            proteinaEntrenamiento: "",
            proteinaDescanso: "",
            grasasEntrenamiento: "",
            grasasDescanso: "",
            carbohidratosEntrenamiento: "",
            carbohidratosDescanso: "",
            especificaciones: ""
        });
    };

    // Obtener resultados calculados de Antropometria en tiempo real
    const parseNum = (v: string) => v !== "" ? parseFloat(v) : 0;
    const resultadosCalculados = pacienteActual ? calcularResultadosAntropometria({
        peso: parseNum(antropometria.peso),
        talla: parseNum(antropometria.talla),
        genero: pacienteActual.genero || "masculino",
        edad: obtenerEdad(pacienteActual.fechaNacimiento),
        diametroHumeral: parseNum(antropometria.diametroHumeral),
        diametroFemoral: parseNum(antropometria.diametroFemoral),
        perimetroBrazoRelajadoDer: parseNum(antropometria.perimetroBrazoRelajadoDer),
        perimetroBrazoFlexionadoDer: parseNum(antropometria.perimetroBrazoFlexionadoDer),
        perimetroMusloDer: parseNum(antropometria.perimetroMusloDer),
        perimetroGemeloDer: parseNum(antropometria.perimetroGemeloDer),
        pliegueTricipital: parseNum(antropometria.pliegueTricipital),
        pliegueBicipital: parseNum(antropometria.pliegueBicipital),
        pliegueSubescapular: parseNum(antropometria.pliegueSubescapular),
        pliegueAbdominal: parseNum(antropometria.pliegueAbdominal),
        pliegueSupraespinal: parseNum(antropometria.pliegueSupraespinal),
        pliegueSuprailiaco: parseNum(antropometria.pliegueSuprailiaco),
        pliegueMuslo: parseNum(antropometria.pliegueMuslo),
        pliegueGemelo: parseNum(antropometria.pliegueGemelo)
    }) : null;

    // Guardar Antropometría con resultados
    const manejarGuardarAntropometria = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pacienteSeleccionadoId) return alert("Seleccione un paciente primero.");

        setGuardando(true);

        const payload = {
            pacienteId: parseInt(pacienteSeleccionadoId),
            peso: parseNum(antropometria.peso),
            talla: parseNum(antropometria.talla),
            diametroHumeral: parseNum(antropometria.diametroHumeral),
            diametroFemoral: parseNum(antropometria.diametroFemoral),
            perimetroBrazoRelajadoDer: parseNum(antropometria.perimetroBrazoRelajadoDer),
            perimetroBrazoFlexionadoDer: parseNum(antropometria.perimetroBrazoFlexionadoDer),
            perimetroBrazoRelajadoIzq: parseNum(antropometria.perimetroBrazoRelajadoIzq),
            perimetroBrazoFlexionadoIzq: parseNum(antropometria.perimetroBrazoFlexionadoIzq),
            perimetroPectoral: parseNum(antropometria.perimetroPectoral),
            perimetroEspalda: parseNum(antropometria.perimetroEspalda),
            perimetroCintura: parseNum(antropometria.perimetroCintura),
            perimetroCinturaMaxima: parseNum(antropometria.perimetroCinturaMaxima),
            perimetroCadera: parseNum(antropometria.perimetroCadera),
            perimetroMusloDer: parseNum(antropometria.perimetroMusloDer),
            perimetroMusloIzq: parseNum(antropometria.perimetroMusloIzq),
            perimetroGemeloDer: parseNum(antropometria.perimetroGemeloDer),
            perimetroGemeloIzq: parseNum(antropometria.perimetroGemeloIzq),
            pliegueTricipital: parseNum(antropometria.pliegueTricipital),
            pliegueBicipital: parseNum(antropometria.pliegueBicipital),
            pliegueSubescapular: parseNum(antropometria.pliegueSubescapular),
            pliegueAbdominal: parseNum(antropometria.pliegueAbdominal),
            pliegueSupraespinal: parseNum(antropometria.pliegueSupraespinal),
            pliegueSuprailiaco: parseNum(antropometria.pliegueSuprailiaco),
            pliegueMuslo: parseNum(antropometria.pliegueMuslo),
            pliegueGemelo: parseNum(antropometria.pliegueGemelo),
            porcentajeGrasa: resultadosCalculados?.porcentajeGrasa,
            kgGrasa: resultadosCalculados?.kgGrasa,
            porcentajeMasaMuscular: resultadosCalculados?.porcentajeMasaMuscular,
            kgMasaMuscular: resultadosCalculados?.kgMasaMuscular,
            endomorfia: resultadosCalculados?.endomorfia,
            mesomorfia: resultadosCalculados?.mesomorfia,
            ectomorfia: resultadosCalculados?.ectomorfia,
            somatocartaX: resultadosCalculados?.x,
            somatocartaY: resultadosCalculados?.y,
            notas: antropometria.notas
        };

        const res = await guardarAntropometria(payload);
        setGuardando(false);

        if (res.success) alert("¡Evaluación Antropométrica (A3-2) guardada exitosamente!");
        else alert(`Error al guardar: ${res.error}`);
    };
    
    // Guardar Anamnesis
    const manejarGuardarAnamnesis = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pacienteSeleccionadoId) return alert("Seleccione un paciente primero.");

        setGuardando(true);
        const res = await guardarAnamnesis({
            pacienteId: parseInt(pacienteSeleccionadoId),
            antecedentesMorbidos, antecedentesMedicos,
            informacionNutricional, informacionDeportiva, objetivos
        });
        setGuardando(false);

        if (res.success) alert("¡Evaluación de Anamnesis (A3-1) guardada exitosamente!");
        else alert(`Error al guardar: ${res.error}`);
    };

    // Función para generar e imprimir la ficha PDF resumen Amnesis
    const generarPDFResumen = () => {
        if (!pacienteActual || !resultadosCalculados) return;

        const ventanaPDF = window.open("", "_blank");
        if (!ventanaPDF) return alert("Por favor permita las ventanas emergentes en su navegador.");

        ventanaPDF.document.write(`
            <html>
                <head>
                    <title>Informe Antropométrico - ${pacienteActual.nombre} ${pacienteActual.apellido}</title>
                    <style>
                        @page {
                            size: auto;
                            margin: 0mm;
                        }
                        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                        h1 { color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 5px; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                        .card { border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
                        .metric { font-size: 1.2rem; font-weight: bold; color: #1e293b; }
                        @media print { button { display: none; } }
                    </style>
                </head>
                <body>
                    <button onclick="window.print()" style="background: #4f46e5; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin-bottom: 20px;">Imprimir / Guardar en PDF</button>
                    
                    <h1>Informe de Evaluación Antropométrica (ISAK)</h1>
                    
                    <div class="info-grid">
                        <div><strong>Paciente:</strong> ${pacienteActual.nombre} ${pacienteActual.apellido}</div>
                        <div><strong>RUT:</strong> ${pacienteActual.rut}</div>
                        <div><strong>Género:</strong> ${pacienteActual.genero}</div>
                        <div><strong>Edad:</strong> ${obtenerEdad(pacienteActual.fechaNacimiento)} años</div>
                        <div><strong>Peso:</strong> ${antropometria.peso} Kg</div>
                        <div><strong>Estatura:</strong> ${antropometria.talla} cm</div>
                    </div>

                    <div class="card">
                        <h3>1. Composición Corporal (Bicompartimental)</h3>
                        <p><strong>Masa Grasa (Yuhasz):</strong> <span class="metric">${resultadosCalculados.porcentajeGrasa}%</span> (${resultadosCalculados.kgGrasa} Kg)</p>
                        <p><strong>Masa Muscular (Lee et al.):</strong> <span class="metric">${resultadosCalculados.porcentajeMasaMuscular}%</span> (${resultadosCalculados.kgMasaMuscular} Kg)</p>
                        <p><strong>Sumatoria 6 Pliegues:</strong> ${resultadosCalculados.sumatoria6P} mm</p>
                    </div>

                    <div class="card">
                        <h3>2. Somatotipo (Heath-Carter)</h3>
                        <p><strong>Endomorfia:</strong> ${resultadosCalculados.endomorfia}</p>
                        <p><strong>Mesomorfia:</strong> ${resultadosCalculados.mesomorfia}</p>
                        <p><strong>Ectomorfia:</strong> ${resultadosCalculados.ectomorfia}</p>
                        <p><strong>Coordenadas Somatocarta:</strong> X = ${resultadosCalculados.x}, Y = ${resultadosCalculados.y}</p>
                    </div>

                    <div class="card">
                        <h3>3. Resumen de Parámetros Medidos</h3>
                        <h4 style="margin-bottom: 6px; color: #4f46e5;">Diámetros (cm)</h4>
                        <div class="info-grid" style="margin-bottom: 15px;">
                            <div><strong>Húmero:</strong> ${antropometria.diametroHumeral || '-'}</div>
                            <div><strong>Fémur:</strong> ${antropometria.diametroFemoral || '-'}</div>
                        </div>
                        <h4 style="margin-bottom: 6px; color: #4f46e5;">Perímetros (cm)</h4>
                        <div class="info-grid" style="margin-bottom: 15px;">
                            <div><strong>Brazo Relajado Der:</strong> ${antropometria.perimetroBrazoRelajadoDer || '-'}</div>
                            <div><strong>Brazo Relajado Izq:</strong> ${antropometria.perimetroBrazoRelajadoIzq || '-'}</div>
                            <div><strong>Brazo Flexionado Der:</strong> ${antropometria.perimetroBrazoFlexionadoDer || '-'}</div>
                            <div><strong>Brazo Flexionado Izq:</strong> ${antropometria.perimetroBrazoFlexionadoIzq || '-'}</div>
                            <div><strong>Pectoral:</strong> ${antropometria.perimetroPectoral || '-'}</div>
                            <div><strong>Espalda:</strong> ${antropometria.perimetroEspalda || '-'}</div>
                            <div><strong>Cintura:</strong> ${antropometria.perimetroCintura || '-'}</div>
                            <div><strong>Cintura Máxima:</strong> ${antropometria.perimetroCinturaMaxima || '-'}</div>
                            <div><strong>Cadera:</strong> ${antropometria.perimetroCadera || '-'}</div>
                            <div><strong>Muslo Der:</strong> ${antropometria.perimetroMusloDer || '-'}</div>
                            <div><strong>Muslo Izq:</strong> ${antropometria.perimetroMusloIzq || '-'}</div>
                            <div><strong>Gemelo Der:</strong> ${antropometria.perimetroGemeloDer || '-'}</div>
                            <div><strong>Gemelo Izq:</strong> ${antropometria.perimetroGemeloIzq || '-'}</div>
                        </div>
                        <h4 style="margin-bottom: 6px; color: #4f46e5;">Pliegues Cutáneos (mm)</h4>
                        <div class="info-grid">
                            <div><strong>Tricipital:</strong> ${antropometria.pliegueTricipital || '-'}</div>
                            <div><strong>Bicipital:</strong> ${antropometria.pliegueBicipital || '-'}</div>
                            <div><strong>Subescapular:</strong> ${antropometria.pliegueSubescapular || '-'}</div>
                            <div><strong>Abdominal:</strong> ${antropometria.pliegueAbdominal || '-'}</div>
                            <div><strong>Supraespinal:</strong> ${antropometria.pliegueSupraespinal || '-'}</div>
                            <div><strong>Suprailíaco:</strong> ${antropometria.pliegueSuprailiaco || '-'}</div>
                            <div><strong>Muslo:</strong> ${antropometria.pliegueMuslo || '-'}</div>
                            <div><strong>Gemelo:</strong> ${antropometria.pliegueGemelo || '-'}</div>
                        </div>
                    </div>

                    ${antropometria.notas ? `<div class="card"><h3>Notas Adicionales</h3><p>${antropometria.notas}</p></div>` : ''}
                </body>
            </html>
        `);
        ventanaPDF.document.close();
    };

    const manejarGuardarFMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteSeleccionadoId) return alert("Seleccione un paciente primero.");

    setGuardando(true);
    const res = await guardarFMS({
        pacienteId: parseInt(pacienteSeleccionadoId),
        sentadillaProfunda: Number(fmsData.sentadillaProfunda),
        pasoValla: Number(fmsData.pasoValla),
        estocadaLinea: Number(fmsData.estocadaLinea),
        movilidadHombros: Number(fmsData.movilidadHombros),
        elevacionPiernaRecta: Number(fmsData.elevacionPiernaRecta),
        estabilidadTroncoFlexion: Number(fmsData.estabilidadTroncoFlexion),
        estabilidadRotatoria: Number(fmsData.estabilidadRotatoria),
        puntajeTotal: puntajeTotalFMS,
        notas: fmsData.notas
    });
    setGuardando(false);

    if (res.success) alert("¡Evaluación FMS (A3-3) guardada exitosamente!");
    else alert(`Error al guardar: ${res.error}`);
};

    // Generar PDF FMS
    const generarPDFFMS = () => {
        if (!pacienteActual) return;

        const ventanaPDF = window.open("", "_blank");
        if (!ventanaPDF) return alert("Por favor permita las ventanas emergentes.");

        const esRiesgoBajo = puntajeTotalFMS >= 14;
        const mensajeDiagnostico = esRiesgoBajo
            ? "Si la sumatoria es igual o mayor a 14, existe un movimiento funcional aceptable con riesgo bajo o estándar de lesión."
            : "Si la sumatoria es menor a 14, el riesgo de sufrir una lesión musculoesquelética se multiplica.";

        ventanaPDF.document.write(`
            <html>
                <head>
                    <title>Informe FMS - ${pacienteActual.nombre} ${pacienteActual.apellido}</title>
                    <style>
                        @page {
                            size: auto;
                            margin: 0mm;
                        }
                        body { font-family: Arial, sans-serif; padding: 25px; color: #333; }
                        h1 { color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 6px; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
                        th { background-color: #f1f5f9; color: #1e293b; }
                        .score { text-align: center; font-weight: bold; font-size: 1.1rem; }
                        .box-diagnostic { padding: 15px; border-radius: 8px; font-weight: bold; line-height: 1.5; margin-top: 15px; background-color: ${esRiesgoBajo ? '#dcfce7' : '#fee2e2'}; color: ${esRiesgoBajo ? '#166534' : '#991b1b'}; border: 1px solid ${esRiesgoBajo ? '#86efac' : '#fca5a5'}; }
                        @media print { button { display: none; } }
                    </style>
                </head>
                <body>
                    <button onclick="window.print()" style="background: #4f46e5; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin-bottom: 20px;">Imprimir / Guardar en PDF</button>

                    <h1>Informe de Evaluación de Movimiento (FMS)</h1>

                    <div class="info-grid">
                        <div><strong>Paciente:</strong> ${pacienteActual.nombre} ${pacienteActual.apellido}</div>
                        <div><strong>RUT:</strong> ${pacienteActual.rut}</div>
                        <div><strong>Fecha de Evaluación:</strong> ${new Date().toLocaleDateString('es-CL')}</div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Prueba de Movimiento (FMS)</th>
                                <th style="width: 120px; text-align: center;">Puntaje (0 - 3)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>Sentadilla Profunda</td><td class="score">${fmsData.sentadillaProfunda}</td></tr>
                            <tr><td>Paso de Valla</td><td class="score">${fmsData.pasoValla}</td></tr>
                            <tr><td>Estocada en Línea</td><td class="score">${fmsData.estocadaLinea}</td></tr>
                            <tr><td>Movilidad de Hombros</td><td class="score">${fmsData.movilidadHombros}</td></tr>
                            <tr><td>Elevación Activa de la Pierna Recta</td><td class="score">${fmsData.elevacionPiernaRecta}</td></tr>
                            <tr><td>Estabilidad de Tronco en Flexión</td><td class="score">${fmsData.estabilidadTroncoFlexion}</td></tr>
                            <tr><td>Estabilidad Rotatoria</td><td class="score">${fmsData.estabilidadRotatoria}</td></tr>
                            <tr style="background-color: #f8fafc; font-weight: bold;">
                                <td style="text-align: right;">SUMATORIA TOTAL:</td>
                                <td class="score" style="color: #4f46e5; font-size: 1.3rem;">${puntajeTotalFMS} / 21</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="box-diagnostic">
                        📌 <strong>Interpretación Diagnóstica:</strong><br/>
                        "${mensajeDiagnostico}"
                    </div>

                    ${fmsData.notas ? `<div style="margin-top: 20px; border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px;"><strong>Notas / Observaciones:</strong><p>${fmsData.notas}</p></div>` : ''}
                </body>
            </html>
        `);
        ventanaPDF.document.close();
    };

    const manejarGuardarSaltoVertical = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteSeleccionadoId) return alert("Seleccione un paciente primero.");

    setGuardando(true);
    const parseNum = (v: string) => v !== "" ? parseFloat(v) : null;

    const res = await guardarSaltoVertical({
        pacienteId: parseInt(pacienteSeleccionadoId),
        cmj: parseNum(saltoVerticalData.cmj),
        sj: parseNum(saltoVerticalData.sj),
        cmjB: parseNum(saltoVerticalData.cmjB),
        dropJump: parseNum(saltoVerticalData.dropJump),
        depthJump: parseNum(saltoVerticalData.depthJump),
        carreraCompleta: parseNum(saltoVerticalData.carreraCompleta),
        notas: saltoVerticalData.notas
    });
        setGuardando(false);
        if (res.success) alert("¡Evaluación de Salto Vertical (A3-4) guardada exitosamente!");
        else alert(`Error al guardar: ${res.error}`);
    };

    // Generador de PDF Salto Vertical
    const generarPDFSaltoVertical = () => {
        if (!pacienteActual) return;

        const ventanaPDF = window.open("", "_blank");
        if (!ventanaPDF) return alert("Por favor permita las ventanas emergentes.");

        ventanaPDF.document.write(`
            <html>
                <head>
                    <title>Informe Salto Vertical - ${pacienteActual.nombre} ${pacienteActual.apellido}</title>
                    <style>
                        @page {
                            size: auto;
                            margin: 0mm;
                        }
                        body { font-family: Arial, sans-serif; padding: 25px; color: #333; }
                        h1 { color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 6px; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; }
                        th { background-color: #f1f5f9; color: #1e293b; }
                        .val { font-weight: bold; font-size: 1.1rem; color: #0284c7; text-align: right; }
                        @media print { button { display: none; } }
                    </style>
                </head>
                <body>
                    <button onclick="window.print()" style="background: #4f46e5; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin-bottom: 20px;">Imprimir / Guardar en PDF</button>
                    
                    <h1>Informe de Evaluación de Salto Vertical (A3-4)</h1>
                    
                    <div class="info-grid">
                        <div><strong>Paciente:</strong> ${pacienteActual.nombre} ${pacienteActual.apellido}</div>
                        <div><strong>RUT:</strong> ${pacienteActual.rut}</div>
                        <div><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CL')}</div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Prueba / Tipo de Salto</th>
                                <th style="text-align: right; width: 180px;">Altura Registrada (cm)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td><strong>CMJ</strong> (Counter Movement Jump)</td><td class="val">${saltoVerticalData.cmj ? saltoVerticalData.cmj + ' cm' : '-'}</td></tr>
                            <tr><td><strong>SJ</strong> (Squat Jump)</td><td class="val">${saltoVerticalData.sj ? saltoVerticalData.sj + ' cm' : '-'}</td></tr>
                            <tr><td><strong>CMJ B</strong> (Counter Movement Jump con Brazos)</td><td class="val">${saltoVerticalData.cmjB ? saltoVerticalData.cmjB + ' cm' : '-'}</td></tr>
                            <tr><td><strong>Drop Jump</strong></td><td class="val">${saltoVerticalData.dropJump ? saltoVerticalData.dropJump + ' cm' : '-'}</td></tr>
                            <tr><td><strong>Depth Jump</strong></td><td class="val">${saltoVerticalData.depthJump ? saltoVerticalData.depthJump + ' cm' : '-'}</td></tr>
                            <tr><td><strong>Carrera Completa</strong></td><td class="val">${saltoVerticalData.carreraCompleta ? saltoVerticalData.carreraCompleta + ' cm' : '-'}</td></tr>
                        </tbody>
                    </table>

                    ${saltoVerticalData.notas ? `<div style="border: 1px solid #cbd5e1; padding: 15px; border-radius: 6px;"><strong>Observaciones / Notas:</strong><p>${saltoVerticalData.notas}</p></div>` : ''}
                </body>
            </html>
        `);
        ventanaPDF.document.close();
    };

    const manejarGuardarVelocidad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteSeleccionadoId) return alert("Seleccione un paciente primero.");

    setGuardando(true);
    const parseNum = (v: string) => v !== "" ? parseFloat(v) : null;

    const res = await guardarVelocidad({
        pacienteId: parseInt(pacienteSeleccionadoId),
        tiempo10m: parseNum(velocidadData.tiempo10m),
        tiempo40m: parseNum(velocidadData.tiempo40m),
        velocidad10m: parseNum(kmh10m),
        velocidad40m: parseNum(kmh40m),
        notas: velocidadData.notas
    });
        setGuardando(false);
        if (res.success) alert("¡Evaluación de Velocidad (A3-5) guardada exitosamente!");
        else alert(`Error al guardar: ${res.error}`);
    };

    // Generar PDF Velocidad
    const generarPDFVelocidad = () => {
        if (!pacienteActual) return;

        const ventanaPDF = window.open("", "_blank");
        if (!ventanaPDF) return alert("Por favor permita las ventanas emergentes.");

        ventanaPDF.document.write(`
            <html>
                <head>
                    <title>Informe Velocidad - ${pacienteActual.nombre} ${pacienteActual.apellido}</title>
                    <style>
                        @page { 
                            size: auto; 
                            margin: 0mm; 
                        }
                        body { 
                            font-family: Arial, sans-serif; 
                            padding: 20mm; 
                            color: #333; 
                        }
                        h1 { color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 6px; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; }
                        th { background-color: #f1f5f9; color: #1e293b; }
                        .val { font-weight: bold; font-size: 1.1rem; color: #0284c7; text-align: center; }
                        .speed { font-weight: bold; font-size: 1.1rem; color: #059669; text-align: center; }
                        @media print { button { display: none; } }
                    </style>
                </head>
                <body>
                    <button onclick="window.print()" style="background: #4f46e5; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin-bottom: 20px;">Imprimir / Guardar en PDF</button>
                    
                    <h1>Informe de Evaluación de Velocidad (A3-5)</h1>
                    
                    <div class="info-grid">
                        <div><strong>Paciente:</strong> ${pacienteActual.nombre} ${pacienteActual.apellido}</div>
                        <div><strong>RUT:</strong> ${pacienteActual.rut}</div>
                        <div><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CL')}</div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Prueba de Velocidad</th>
                                <th style="text-align: center; width: 180px;">Tiempo (s)</th>
                                <th style="text-align: center; width: 180px;">Velocidad (Km/h)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>10 Metros</strong> (Aceleración)</td>
                                <td class="val">${velocidadData.tiempo10m ? velocidadData.tiempo10m + ' s' : '-'}</td>
                                <td class="speed">${velocidadData.tiempo10m ? kmh10m + ' Km/h' : '-'}</td>
                            </tr>
                            <tr>
                                <td><strong>40 Metros</strong> (Velocidad Máxima)</td>
                                <td class="val">${velocidadData.tiempo40m ? velocidadData.tiempo40m + ' s' : '-'}</td>
                                <td class="speed">${velocidadData.tiempo40m ? kmh40m + ' Km/h' : '-'}</td>
                            </tr>
                        </tbody>
                    </table>

                    ${velocidadData.notas ? `<div style="border: 1px solid #cbd5e1; padding: 15px; border-radius: 6px;"><strong>Observaciones / Notas:</strong><p>${velocidadData.notas}</p></div>` : ''}
                </body>
            </html>
        `);
        ventanaPDF.document.close();
    };

    const manejarGuardarFuerzaMaxima = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteSeleccionadoId) return alert("Seleccione un paciente primero.");

    setGuardando(true);
    const parseNum = (v: string) => v !== "" ? parseFloat(v) : null;

    const res = await guardarFuerzaMaxima({
        pacienteId: parseInt(pacienteSeleccionadoId),
        pesoMuerto: parseNum(fuerzaData.pesoMuerto),
        sentadilla: parseNum(fuerzaData.sentadilla),
        pressBanca: parseNum(fuerzaData.pressBanca),
        totalLevantado: parseFloat(totalLevantadoKg),
        notas: fuerzaData.notas
    });
        setGuardando(false);
        if (res.success) alert("¡Evaluación de Fuerza Máxima (A3-6) guardada exitosamente!");
        else alert(`Error al guardar: ${res.error}`);
    };

    // Generar PDF Fuerza Maxima
    const generarPDFFuerzaMaxima = () => {
        if (!pacienteActual) return;

        const ventanaPDF = window.open("", "_blank");
        if (!ventanaPDF) return alert("Por favor permita las ventanas emergentes.");

        ventanaPDF.document.write(`
            <html>
                <head>
                    <title>Informe Fuerza Máxima - ${pacienteActual.nombre} ${pacienteActual.apellido}</title>
                    <style>
                        @page { 
                            size: auto; 
                            margin: 0mm; 
                        }
                        body { 
                            font-family: Arial, sans-serif; 
                            padding: 20mm; 
                            color: #333; 
                        }
                        h1 { color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 6px; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; }
                        th { background-color: #f1f5f9; color: #1e293b; }
                        .val { font-weight: bold; font-size: 1.1rem; color: #0284c7; text-align: right; }
                        .total-row { background-color: #f8fafc; font-weight: bold; }
                        @media print { button { display: none; } }
                    </style>
                </head>
                <body>
                    <button onclick="window.print()" style="background: #4f46e5; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin-bottom: 20px;">Imprimir / Guardar en PDF</button>
                    
                    <h1>Informe de Evaluación de Fuerza Máxima (A3-6)</h1>
                    
                    <div class="info-grid">
                        <div><strong>Paciente:</strong> ${pacienteActual.nombre} ${pacienteActual.apellido}</div>
                        <div><strong>RUT:</strong> ${pacienteActual.rut}</div>
                        <div><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CL')}</div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Ejercicio / Levantamiento</th>
                                <th style="text-align: right; width: 200px;">Carga Máxima (Kg)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td><strong>Peso Muerto</strong></td><td class="val">${fuerzaData.pesoMuerto ? fuerzaData.pesoMuerto + ' Kg' : '-'}</td></tr>
                            <tr><td><strong>Sentadilla</strong></td><td class="val">${fuerzaData.sentadilla ? fuerzaData.sentadilla + ' Kg' : '-'}</td></tr>
                            <tr><td><strong>Press Banca</strong></td><td class="val">${fuerzaData.pressBanca ? fuerzaData.pressBanca + ' Kg' : '-'}</td></tr>
                            <tr class="total-row">
                                <td style="text-align: right;">TOTAL LEVANTADO:</td>
                                <td class="val" style="color: #4f46e5; font-size: 1.2rem;">${totalLevantadoKg} Kg</td>
                            </tr>
                        </tbody>
                    </table>

                    ${fuerzaData.notas ? `<div style="border: 1px solid #cbd5e1; padding: 15px; border-radius: 6px;"><strong>Observaciones / Notas:</strong><p>${fuerzaData.notas}</p></div>` : ''}
                </body>
            </html>
        `);
        ventanaPDF.document.close();
    };

    const manejarGuardarNutricion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pacienteSeleccionadoId) return alert("Seleccione un paciente primero.");

        setGuardando(true);
        const parseNum = (v: string) => v !== "" ? parseFloat(v) : null;

        const res = await guardarGastoCalorico({
            pacienteId: parseInt(pacienteSeleccionadoId),
            gastoBasal: parseNum(nutricionData.gastoBasal),
            gastoEntrenamiento: parseNum(nutricionData.gastoEntrenamiento),
            gastoDescanso: parseNum(nutricionData.gastoDescanso),
            proteinaEntrenamiento: parseNum(nutricionData.proteinaEntrenamiento),
            proteinaDescanso: parseNum(nutricionData.proteinaDescanso),
            grasasEntrenamiento: parseNum(nutricionData.grasasEntrenamiento),
            grasasDescanso: parseNum(nutricionData.grasasDescanso),
            carbohidratosEntrenamiento: parseNum(nutricionData.carbohidratosEntrenamiento),
            carbohidratosDescanso: parseNum(nutricionData.carbohidratosDescanso),
            especificaciones: nutricionData.especificaciones
        });
        setGuardando(false);

        if (res.success) alert("¡Evaluación de Gasto Calórico y Nutrición (A3-7) guardada exitosamente!");
        else alert(`Error al guardar: ${res.error}`);
    };

    const generarPDFNutricion = () => {
        if (!pacienteActual) return;

        const ventanaPDF = window.open("", "_blank");
        if (!ventanaPDF) return alert("Por favor permita las ventanas emergentes.");

        ventanaPDF.document.write(`
            <html>
                <head>
                    <title>Informe Nutricional - ${pacienteActual.nombre} ${pacienteActual.apellido}</title>
                    <style>
                        @page { 
                            size: auto; 
                            margin: 0mm; 
                        }
                        body { 
                            font-family: Arial, sans-serif; 
                            padding: 20mm; 
                            color: #333; 
                        }
                        h1 { color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 6px; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                        .section-title { color: #4f46e5; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 20px; margin-bottom: 12px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
                        th { background-color: #f1f5f9; color: #1e293b; }
                        .val { font-weight: bold; font-size: 1.05rem; color: #0284c7; text-align: right; }
                        .sub-val { font-weight: bold; color: #059669; text-align: right; }
                        .box-spec { border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; background-color: #fafafa; white-space: pre-wrap; line-height: 1.5; }
                        @media print { button { display: none; } }
                    </style>
                </head>
                <body>
                    <button onclick="window.print()" style="background: #4f46e5; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin-bottom: 20px;">Imprimir / Guardar en PDF</button>
                    
                    <h1>Informe de Gasto Calórico y Nutrición (A3-7)</h1>
                    
                    <div class="info-grid">
                        <div><strong>Paciente:</strong> ${pacienteActual.nombre} ${pacienteActual.apellido}</div>
                        <div><strong>RUT:</strong> ${pacienteActual.rut}</div>
                        <div><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CL')}</div>
                    </div>

                    <h3 class="section-title">1. Gasto Calórico (kcal)</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Concepto</th>
                                <th style="text-align: right; width: 200px;">Calorías (kcal)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>Gasto Calórico Basal</td><td class="val">${nutricionData.gastoBasal ? nutricionData.gastoBasal + ' kcal' : '-'}</td></tr>
                            <tr><td>Gasto Calórico Día de Entrenamiento</td><td class="val">${nutricionData.gastoEntrenamiento ? nutricionData.gastoEntrenamiento + ' kcal' : '-'}</td></tr>
                            <tr><td>Gasto Calórico Día de Descanso</td><td class="val">${nutricionData.gastoDescanso ? nutricionData.gastoDescanso + ' kcal' : '-'}</td></tr>
                        </tbody>
                    </table>

                    <h3 class="section-title">2. Distribución de Macronutrientes (Gramos)</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Macronutriente</th>
                                <th style="text-align: right; width: 180px;">Día Entrenamiento</th>
                                <th style="text-align: right; width: 180px;">Día Descanso</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Proteína</strong></td>
                                <td class="sub-val">${nutricionData.proteinaEntrenamiento ? nutricionData.proteinaEntrenamiento + ' g' : '-'}</td>
                                <td class="sub-val">${nutricionData.proteinaDescanso ? nutricionData.proteinaDescanso + ' g' : '-'}</td>
                            </tr>
                            <tr>
                                <td><strong>Grasas</strong></td>
                                <td class="sub-val">${nutricionData.grasasEntrenamiento ? nutricionData.grasasEntrenamiento + ' g' : '-'}</td>
                                <td class="sub-val">${nutricionData.grasasDescanso ? nutricionData.grasasDescanso + ' g' : '-'}</td>
                            </tr>
                            <tr>
                                <td><strong>Carbohidratos</strong></td>
                                <td class="sub-val">${nutricionData.carbohidratosEntrenamiento ? nutricionData.carbohidratosEntrenamiento + ' g' : '-'}</td>
                                <td class="sub-val">${nutricionData.carbohidratosDescanso ? nutricionData.carbohidratosDescanso + ' g' : '-'}</td>
                            </tr>
                            <tr style="background-color: #f8fafc; font-weight: bold;">
                                <td>Aporte Energético Total Calculado</td>
                                <td style="text-align: right; color: #4f46e5;">${kcalMacrosEnt} kcal</td>
                                <td style="text-align: right; color: #4f46e5;">${kcalMacrosDes} kcal</td>
                            </tr>
                        </tbody>
                    </table>

                    ${nutricionData.especificaciones ? `
                        <h3 class="section-title">3. Especificaciones e Indicaciones Nutricionales</h3>
                        <div class="box-spec">${nutricionData.especificaciones}</div>
                    ` : ''}
                </body>
            </html>
        `);
        ventanaPDF.document.close();
    };


    const evaluacionesList = [
        { id: 1, nombre: "A3-1: Anamnesis" },
        { id: 2, nombre: "A3-2: Antropometría" },
        { id: 3, nombre: "A3-3: Movimiento(FMS)" },
        { id: 4, nombre: "A3-4: Salto Vertical" },
        { id: 5, nombre: "A3-5: Velocidad" },
        { id: 6, nombre: "A3-6: Fuerza Maxima" },
        { id: 7, nombre: "A3-7: Gasto Calorico" }
    ];

    return (
        <main className="main-layout" style={{ minHeight: '100vh', display: 'flex' }}>
            <div className='app-container' style={{ display: 'flex', width: '100%' }}>
                <Sidebar />
                <div className='content-container' style={{ backgroundColor: '#525e92', padding: '1.5rem', flexGrow: 1, overflowY: 'auto' }}>
                    <div className='card-paciente' style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', color: '#333333' }}>
                        
                        {/* Buscador */}
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
                                        style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', color: '#333' }}
                                    />
                                    {pacienteSeleccionadoId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPacienteSeleccionadoId("");
                                                setBusqueda("");
                                                limpiarFormularioAnamnesis();
                                                limpiarFormularioAntropometria();
                                            }}
                                            style={{ padding: '0.6rem 1rem', backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            Limpiar
                                        </button>
                                    )}
                                </div>

                                {mostrarResultados && busqueda && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, backgroundColor: '#ffffff', border: '1px solid #cbd5e0', borderRadius: '6px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto', marginTop: '4px' }}>
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
                                                    style={{ padding: '0.8rem', cursor: 'pointer', borderBottom: '1px solid #edf2f7', color: '#333' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f7fafc'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                                                >
                                                    <span style={{ fontWeight: 'bold' }}>{p.nombre} {p.apellido}</span>
                                                    <span style={{ fontSize: '0.85rem', color: '#718096', marginLeft: '8px' }}>RUT: {p.rut}</span>
                                                </div>
                                            ))
                                        }
                                    </div>
                                )}
                            </div>
                        </div>

                        {pacienteSeleccionadoId ? (
                            <div>
                                {/* 7 BOTONES */}
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem', borderBottom: '1px solid #edf2f7', paddingBottom: '1rem' }}>
                                    {evaluacionesList.map((ev) => (
                                        <button
                                            key={ev.id}
                                            onClick={() => setEvaluacionActiva(ev.id)}
                                            style={{
                                                padding: '0.6rem 1.2rem', border: 'none', borderRadius: '6px', fontWeight: 'bold',
                                                cursor: 'pointer', transition: 'all 0.2s',
                                                backgroundColor: evaluacionActiva === ev.id ? '#4f46e5' : '#edf2f7',
                                                color: evaluacionActiva === ev.id ? '#ffffff' : '#4a5568',
                                            }}
                                        >
                                            {ev.nombre}
                                        </button>
                                    ))}
                                </div>

                                {/* EVALUACIÓN 1: ANAMNESIS */}
                                {evaluacionActiva === 1 && (
                                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <h2 style={{ marginTop: 0, color: '#2d3748', borderBottom: '1px solid #cbd5e0', paddingBottom: '0.5rem' }}>Anamnesis (A3-1)</h2>
                                        <form onSubmit={manejarGuardarAnamnesis} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                <label style={{ fontWeight: 'bold', color: '#4a5568' }}>Antecedentes Mórbidos</label>
                                                <textarea value={antecedentesMorbidos} onChange={(e) => setAntecedentesMorbidos(e.target.value)} rows={3} style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', color: '#333' }} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                <label style={{ fontWeight: 'bold', color: '#4a5568' }}>Antecedentes Médicos</label>
                                                <textarea value={antecedentesMedicos} onChange={(e) => setAntecedentesMedicos(e.target.value)} rows={3} style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', color: '#333' }} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                <label style={{ fontWeight: 'bold', color: '#4a5568' }}>Información Nutricional</label>
                                                <textarea value={informacionNutricional} onChange={(e) => setInformacionNutricional(e.target.value)} rows={3} style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', color: '#333' }} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                <label style={{ fontWeight: 'bold', color: '#4a5568' }}>Información Deportiva</label>
                                                <textarea value={informacionDeportiva} onChange={(e) => setInformacionDeportiva(e.target.value)} rows={3} style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', color: '#333' }} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                <label style={{ fontWeight: 'bold', color: '#4a5568' }}>Objetivos</label>
                                                <textarea value={objetivos} onChange={(e) => setObjetivos(e.target.value)} rows={3} style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', color: '#333' }} />
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                                <button type="submit" disabled={guardando} style={{ backgroundColor: '#4f46e5', color: '#ffffff', padding: '0.8rem 2rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                    {guardando ? "Guardando..." : "Guardar Anamnesis"}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* EVALUACIÓN 2: ANTROPOMETRÍA ISAK CON CÁLCULOS */}
                                {evaluacionActiva === 2 && (
                                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                                            <h2 style={{ margin: 0, color: '#2d3748' }}>Antropometría ISAK (A3-2)</h2>
                                            <button type="button" onClick={generarPDFResumen} style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                📄 Generar Reporte PDF
                                            </button>
                                        </div>

                                        <form onSubmit={manejarGuardarAntropometria} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                            
                                            {/* BÁSICOS */}
                                            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                <h3 style={{ margin: '0 0 1rem 0', color: '#4f46e5', fontSize: '1.1rem' }}>📏 Datos Básicos</h3>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#4a5568' }}>Peso (Kg)</label>
                                                        <input type="number" step="0.01" value={antropometria.peso} onChange={(e) => manejarCambioAntropometria('peso', e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', color: '#333' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#4a5568' }}>Talla / Estatura (cm)</label>
                                                        <input type="number" step="0.01" value={antropometria.talla} onChange={(e) => manejarCambioAntropometria('talla', e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', color: '#333' }} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* DIÁMETROS */}
                                            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                <h3 style={{ margin: '0 0 1rem 0', color: '#4f46e5', fontSize: '1.1rem' }}>🦴 Diámetros (mm)</h3>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#4a5568' }}>Humeral (cm)</label>
                                                        <input type="number" step="0.01" value={antropometria.diametroHumeral} onChange={(e) => manejarCambioAntropometria('diametroHumeral', e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', color: '#333' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#4a5568' }}>Femoral (cm)</label>
                                                        <input type="number" step="0.01" value={antropometria.diametroFemoral} onChange={(e) => manejarCambioAntropometria('diametroFemoral', e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', color: '#333' }} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* PERÍMETROS */}
                                            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                <h3 style={{ margin: '0 0 1rem 0', color: '#4f46e5', fontSize: '1.1rem' }}>⭕ Perímetros (cm)</h3>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#4a5568' }}>Brazo Relajado Der (cm)</label>
                                                        <input type="number" step="0.01" value={antropometria.perimetroBrazoRelajadoDer} onChange={(e) => manejarCambioAntropometria('perimetroBrazoRelajadoDer', e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', color: '#333' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#4a5568' }}>Brazo Flexionado Der (cm)</label>
                                                        <input type="number" step="0.01" value={antropometria.perimetroBrazoFlexionadoDer} onChange={(e) => manejarCambioAntropometria('perimetroBrazoFlexionadoDer', e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', color: '#333' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#4a5568' }}>Brazo Relajado Izq (cm)</label>
                                                        <input type="number" step="0.01" value={antropometria.perimetroBrazoRelajadoIzq} onChange={(e) => manejarCambioAntropometria('perimetroBrazoRelajadoIzq', e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', color: '#333' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#4a5568' }}>Brazo Flexionado Izq (cm)</label>
                                                        <input type="number" step="0.01" value={antropometria.perimetroBrazoFlexionadoIzq} onChange={(e) => manejarCambioAntropometria('perimetroBrazoFlexionadoIzq', e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', color: '#333' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#4a5568' }}>Pectoral (cm)</label>
                                                        <input type="number" step="0.01" value={antropometria.perimetroPectoral} onChange={(e) => manejarCambioAntropometria('perimetroPectoral', e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', color: '#333' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#4a5568' }}>Espalda (cm)</label>
                                                        <input type="number" step="0.01" value={antropometria.perimetroEspalda} onChange={(e) => manejarCambioAntropometria('perimetroEspalda', e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', color: '#333' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#4a5568' }}>Cintura (cm)</label>
                                                        <input type="number" step="0.01" value={antropometria.perimetroCintura} onChange={(e) => manejarCambioAntropometria('perimetroCintura', e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', color: '#333' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#4a5568' }}>Cintura Máxima (cm)</label>
                                                        <input type="number" step="0.01" value={antropometria.perimetroCinturaMaxima} onChange={(e) => manejarCambioAntropometria('perimetroCinturaMaxima', e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', color: '#333' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#4a5568' }}>Cadera (cm)</label>
                                                        <input type="number" step="0.01" value={antropometria.perimetroCadera} onChange={(e) => manejarCambioAntropometria('perimetroCadera', e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', color: '#333' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#4a5568' }}>Muslo Derecho (cm)</label>
                                                        <input type="number" step="0.01" value={antropometria.perimetroMusloDer} onChange={(e) => manejarCambioAntropometria('perimetroMusloDer', e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', color: '#333' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#4a5568' }}>Muslo Izquierdo (cm)</label>
                                                        <input type="number" step="0.01" value={antropometria.perimetroMusloIzq} onChange={(e) => manejarCambioAntropometria('perimetroMusloIzq', e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', color: '#333' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#4a5568' }}>Gemelo Derecho (cm)</label>
                                                        <input type="number" step="0.01" value={antropometria.perimetroGemeloDer} onChange={(e) => manejarCambioAntropometria('perimetroGemeloDer', e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', color: '#333' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#4a5568' }}>Gemelo Izquierdo (cm)</label>
                                                        <input type="number" step="0.01" value={antropometria.perimetroGemeloIzq} onChange={(e) => manejarCambioAntropometria('perimetroGemeloIzq', e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', color: '#333' }} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* PLIEGUES CUTÁNEOS */}
                                            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                <h3 style={{ margin: '0 0 1rem 0', color: '#4f46e5', fontSize: '1.1rem' }}>🤏 Pliegues Cutáneos (mm)</h3>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#4a5568' }}>Tricipital (mm)</label>
                                                        <input type="number" step="0.01" value={antropometria.pliegueTricipital} onChange={(e) => manejarCambioAntropometria('pliegueTricipital', e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', color: '#333' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#4a5568' }}>Bicipital (mm)</label>
                                                        <input type="number" step="0.01" value={antropometria.pliegueBicipital} onChange={(e) => manejarCambioAntropometria('pliegueBicipital', e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', color: '#333' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#4a5568' }}>Subescapular (mm)</label>
                                                        <input type="number" step="0.01" value={antropometria.pliegueSubescapular} onChange={(e) => manejarCambioAntropometria('pliegueSubescapular', e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', color: '#333' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#4a5568' }}>Abdominal (mm)</label>
                                                        <input type="number" step="0.01" value={antropometria.pliegueAbdominal} onChange={(e) => manejarCambioAntropometria('pliegueAbdominal', e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', color: '#333' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#4a5568' }}>Supraespinal (mm)</label>
                                                        <input type="number" step="0.01" value={antropometria.pliegueSupraespinal} onChange={(e) => manejarCambioAntropometria('pliegueSupraespinal', e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', color: '#333' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#4a5568' }}>Suprailiaco (mm)</label>
                                                        <input type="number" step="0.01" value={antropometria.pliegueSuprailiaco} onChange={(e) => manejarCambioAntropometria('pliegueSuprailiaco', e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', color: '#333' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#4a5568' }}>Muslo (mm)</label>
                                                        <input type="number" step="0.01" value={antropometria.pliegueMuslo} onChange={(e) => manejarCambioAntropometria('pliegueMuslo', e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', color: '#333' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#4a5568' }}>Gemelo (mm)</label>
                                                        <input type="number" step="0.01" value={antropometria.pliegueGemelo} onChange={(e) => manejarCambioAntropometria('pliegueGemelo', e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', color: '#333' }} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* PANEL DE RESULTADOS CALCULADOS EN VIVO */}
                                            {resultadosCalculados && (
                                                <div style={{ background: '#e0f2fe', border: '1px solid #38bdf8', padding: '1rem', borderRadius: '6px' }}>
                                                    <h3 style={{ margin: '0 0 1rem 0', color: '#0369a1' }}>📊 Resultados en Tiempo Real</h3>
                                                    
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                                        <div style={{ background: '#fff', padding: '0.8rem', borderRadius: '6px' }}>
                                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Masa Grasa (Yuhasz)</div>
                                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0369a1' }}>{resultadosCalculados.porcentajeGrasa}%</div>
                                                            <div style={{ fontSize: '0.85rem', color: '#334155' }}>{resultadosCalculados.kgGrasa} Kg</div>
                                                        </div>

                                                        <div style={{ background: '#fff', padding: '0.8rem', borderRadius: '6px' }}>
                                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Masa Muscular (Lee)</div>
                                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#15803d' }}>{resultadosCalculados.porcentajeMasaMuscular}%</div>
                                                            <div style={{ fontSize: '0.85rem', color: '#334155' }}>{resultadosCalculados.kgMasaMuscular} Kg</div>
                                                        </div>

                                                        <div style={{ background: '#fff', padding: '0.8rem', borderRadius: '6px' }}>
                                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Somatotipo (Heath-Carter)</div>
                                                            <div style={{ fontSize: '0.9rem', color: '#334155', marginTop: '0.2rem' }}>
                                                                <strong>Endo:</strong> {resultadosCalculados.endomorfia} | <strong>Meso:</strong> {resultadosCalculados.mesomorfia} | <strong>Ecto:</strong> {resultadosCalculados.ectomorfia}
                                                            </div>
                                                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                                                                Coordenadas: (X: {resultadosCalculados.x}, Y: {resultadosCalculados.y})
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* NOTAS */}
                                            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                <h3 style={{ margin: '0 0 0.5rem 0', color: '#4f46e5', fontSize: '1.1rem' }}>📝 Notas Adicionales</h3>
                                                <textarea value={antropometria.notas} onChange={(e) => manejarCambioAntropometria('notas', e.target.value)} placeholder="Observaciones de la medición..." rows={3} style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e0', color: '#333' }} />
                                            </div>

                                            {/* BOTÓN GUARDAR Y ADJUNTAR */}
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                                <button type="submit" disabled={guardando} style={{ backgroundColor: '#10b981', color: '#ffffff', padding: '0.8rem 2rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
                                                    {guardando ? "Guardando..." : "Guardar y Adjuntar al Paciente"}
                                                </button>
                                            </div>

                                        </form>
                                    </div>
                                )}

                                {/* EVALUACIÓN 3: EVALUACIÓN DE MOVIMIENTO (FMS) */}
                                {evaluacionActiva === 3 && (
                                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e0', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                                            <h2 style={{ margin: 0, color: '#2d3748' }}>Evaluación de Movimiento (FMS - A3-3)</h2>
                                            <button type="button" onClick={generarPDFFMS} style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                📄 Generar Reporte PDF
                                            </button>
                                        </div>
                                        {/* Envio de datos evaluacion FMS */}

                                        <form onSubmit={manejarGuardarFMS} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                                    {[
                                                        { campo: 'sentadillaProfunda', label: 'Sentadilla profunda' },
                                                        { campo: 'pasoValla', label: 'Paso de valla' },
                                                        { campo: 'estocadaLinea', label: 'Estocada en línea' },
                                                        { campo: 'movilidadHombros', label: 'Movilidad de hombros' },
                                                        { campo: 'elevacionPiernaRecta', label: 'Elevación activa de la pierna recta' },
                                                        { campo: 'estabilidadTroncoFlexion', label: 'Estabilidad de tronco en flexión' },
                                                        { campo: 'estabilidadRotatoria', label: 'Estabilidad rotatoria' }
                                                    ].map((item) => (
                                                        <div key={item.campo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid #edf2f7' }}>
                                                            <span style={{ fontWeight: 'bold', color: '#4a5568', fontSize: '0.95rem' }}>{item.label}</span>
                                                            <select
                                                                value={(fmsData as any)[item.campo]}
                                                                onChange={(e) => manejarCambioFMS(item.campo, Number(e.target.value))}
                                                                style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontWeight: 'bold', color: '#333', minWidth: '100px' }}
                                                            >
                                                                <option value={0}>0 puntos</option>
                                                                <option value={1}>1 punto</option>
                                                                <option value={2}>2 puntos</option>
                                                                <option value={3}>3 puntos</option>
                                                            </select>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* TABLERO DE RESULTADO TOTAL Y DIAGNÓSTICO */}
                                            <div style={{ background: puntajeTotalFMS >= 14 ? '#ecfdf5' : '#fef2f2', border: `1px solid ${puntajeTotalFMS >= 14 ? '#a7f3d0' : '#fecaca'}`, padding: '1.2rem', borderRadius: '8px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b' }}>Puntaje Total Sumado:</span>
                                                    <span style={{ fontSize: '1.6rem', fontWeight: 'bold', color: puntajeTotalFMS >= 14 ? '#059669' : '#dc2626' }}>{puntajeTotalFMS} / 21 pts</span>
                                                </div>
                                                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500', color: puntajeTotalFMS >= 14 ? '#065f46' : '#991b1b' }}>
                                                    📌 {puntajeTotalFMS >= 14
                                                        ? "Si la sumatoria es igual o mayor a 14, existe un movimiento funcional aceptable con riesgo bajo o estándar de lesión."
                                                        : "Si la sumatoria es menor a 14, el riesgo de sufrir una lesión musculoesquelética se multiplica."}
                                                </p>
                                            </div>

                                            {/* NOTAS */}
                                            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                <label style={{ fontWeight: 'bold', color: '#4a5568', display: 'block', marginBottom: '0.5rem' }}>Notas / Observaciones de la Evaluación</label>
                                                <textarea
                                                    value={fmsData.notas}
                                                    onChange={(e) => manejarCambioFMS('notas', e.target.value)}
                                                    placeholder="Asimetrías detectadas, dolor en algún movimiento, etc..."
                                                    rows={3}
                                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e0', color: '#333' }}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                <button type="submit" disabled={guardando} style={{ backgroundColor: '#10b981', color: '#ffffff', padding: '0.8rem 2rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
                                                    {guardando ? "Guardando FMS..." : "Guardar Evaluación FMS"}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* EVALUACIÓN 4: SALTO VERTICAL */}
                                {evaluacionActiva === 4 && (
                                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e0', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                                            <h2 style={{ margin: 0, color: '#2d3748' }}>Evaluación de Salto Vertical (A3-4)</h2>
                                            <button type="button" onClick={generarPDFSaltoVertical} style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                📄 Generar Reporte PDF
                                            </button>
                                        </div>

                                        <form onSubmit={manejarGuardarSaltoVertical} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                <h3 style={{ margin: '0 0 1rem 0', color: '#4f46e5', fontSize: '1.1rem' }}>🦵 Altura de Saltos (en cm)</h3>
                                                
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem' }}>
                                                    {[
                                                        { campo: 'cmj', label: 'CMJ (Counter Movement Jump)' },
                                                        { campo: 'sj', label: 'SJ (Squat Jump)' },
                                                        { campo: 'cmjB', label: 'CMJ B (Con uso de brazos)' },
                                                        { campo: 'dropJump', label: 'Drop Jump' },
                                                        { campo: 'depthJump', label: 'Depth Jump' },
                                                        { campo: 'carreraCompleta', label: 'Carrera Completa' }
                                                    ].map((item) => (
                                                        <div key={item.campo} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                            <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#4a5568' }}>{item.label}</label>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={(saltoVerticalData as any)[item.campo]}
                                                                    onChange={(e) => manejarCambioSaltoVertical(item.campo, e.target.value)}
                                                                    placeholder="0.00"
                                                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', color: '#333' }}
                                                                />
                                                                <span style={{ fontWeight: 'bold', color: '#718096' }}>cm</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* NOTAS ADICIONALES */}
                                            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                <label style={{ fontWeight: 'bold', color: '#4a5568', display: 'block', marginBottom: '0.5rem' }}>Notas / Observaciones de Salto Vertical</label>
                                                <textarea
                                                    value={saltoVerticalData.notas}
                                                    onChange={(e) => manejarCambioSaltoVertical('notas', e.target.value)}
                                                    placeholder="Detalles sobre plataforma de salto usada, fatiga, técnica..."
                                                    rows={3}
                                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e0', color: '#333' }}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                <button type="submit" disabled={guardando} style={{ backgroundColor: '#10b981', color: '#ffffff', padding: '0.8rem 2rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
                                                    {guardando ? "Guardando Salto Vertical..." : "Guardar Evaluación de Salto Vertical"}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* EVALUACIÓN 5: VELOCIDAD */}
                                {evaluacionActiva === 5 && (
                                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e0', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                                            <h2 style={{ margin: 0, color: '#2d3748' }}>Evaluación de Velocidad (A3-5)</h2>
                                            <button type="button" onClick={generarPDFVelocidad} style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                📄 Generar Reporte PDF
                                            </button>
                                        </div>

                                        <form onSubmit={manejarGuardarVelocidad} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                <h3 style={{ margin: '0 0 1rem 0', color: '#4f46e5', fontSize: '1.1rem' }}>⏱️ Registro de Tiempos y Conversión</h3>
                                                
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                                    
                                                    {/* TEST 10 METROS */}
                                                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e0' }}>
                                                        <label style={{ fontWeight: 'bold', fontSize: '1rem', color: '#1e293b', display: 'block', marginBottom: '0.5rem' }}>
                                                            10 Metros (Aceleración)
                                                        </label>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                                            <div>
                                                                <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Tiempo en Segundos:</label>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={velocidadData.tiempo10m}
                                                                        onChange={(e) => manejarCambioVelocidad('tiempo10m', e.target.value)}
                                                                        placeholder="0.00"
                                                                        style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', color: '#333' }}
                                                                    />
                                                                    <span style={{ fontWeight: 'bold', color: '#718096' }}>seg</span>
                                                                </div>
                                                            </div>

                                                            <div style={{ background: '#ecfdf5', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                                                                <span style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 'bold' }}>Velocidad Calculada:</span>
                                                                <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#059669' }}>
                                                                    {kmh10m} <span style={{ fontSize: '0.9rem' }}>Km/h</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* TEST 40 METROS */}
                                                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e0' }}>
                                                        <label style={{ fontWeight: 'bold', fontSize: '1rem', color: '#1e293b', display: 'block', marginBottom: '0.5rem' }}>
                                                            40 Metros (Velocidad Máxima)
                                                        </label>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                                            <div>
                                                                <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Tiempo en Segundos:</label>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={velocidadData.tiempo40m}
                                                                        onChange={(e) => manejarCambioVelocidad('tiempo40m', e.target.value)}
                                                                        placeholder="0.00"
                                                                        style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', color: '#333' }}
                                                                    />
                                                                    <span style={{ fontWeight: 'bold', color: '#718096' }}>seg</span>
                                                                </div>
                                                            </div>

                                                            <div style={{ background: '#ecfdf5', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                                                                <span style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 'bold' }}>Velocidad Calculada:</span>
                                                                <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#059669' }}>
                                                                    {kmh40m} <span style={{ fontSize: '0.9rem' }}>Km/h</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>

                                            {/* NOTAS ADICIONALES */}
                                            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                <label style={{ fontWeight: 'bold', color: '#4a5568', display: 'block', marginBottom: '0.5rem' }}>Notas / Observaciones de la Prueba</label>
                                                <textarea
                                                    value={velocidadData.notas}
                                                    onChange={(e) => manejarCambioVelocidad('notas', e.target.value)}
                                                    placeholder="Tipo de calzado, superficie, condiciones del viento, etc..."
                                                    rows={3}
                                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e0', color: '#333' }}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                <button type="submit" disabled={guardando} style={{ backgroundColor: '#10b981', color: '#ffffff', padding: '0.8rem 2rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
                                                    {guardando ? "Guardando Velocidad..." : "Guardar Evaluación de Velocidad"}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* EVALUACIÓN 6: FUERZA MÁXIMA */}
                                {evaluacionActiva === 6 && (
                                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e0', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                                            <h2 style={{ margin: 0, color: '#2d3748' }}>Evaluación de Fuerza Máxima (A3-6)</h2>
                                            <button type="button" onClick={generarPDFFuerzaMaxima} style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                📄 Generar Reporte PDF
                                            </button>
                                        </div>

                                        <form onSubmit={manejarGuardarFuerzaMaxima} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                <h3 style={{ margin: '0 0 1rem 0', color: '#4f46e5', fontSize: '1.1rem' }}>🏋️ Cargas Máximas Levantadas (en Kg)</h3>
                                                
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem' }}>
                                                    {[
                                                        { campo: 'pesoMuerto', label: 'Peso Muerto' },
                                                        { campo: 'sentadilla', label: 'Sentadilla' },
                                                        { campo: 'pressBanca', label: 'Press Banca' }
                                                    ].map((item) => (
                                                        <div key={item.campo} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                            <label style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#4a5568' }}>{item.label}</label>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <input
                                                                    type="number"
                                                                    step="0.5"
                                                                    value={(fuerzaData as any)[item.campo]}
                                                                    onChange={(e) => manejarCambioFuerza(item.campo, e.target.value)}
                                                                    placeholder="0.0"
                                                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', color: '#333' }}
                                                                />
                                                                <span style={{ fontWeight: 'bold', color: '#718096' }}>Kg</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* RESUMEN TOTAL EN VIVO */}
                                                <div style={{ marginTop: '1.5rem', background: '#f1f5f9', padding: '1rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '1rem' }}>Total Levantado (Suma):</span>
                                                    <span style={{ fontWeight: 'bold', color: '#4f46e5', fontSize: '1.4rem' }}>{totalLevantadoKg} Kg</span>
                                                </div>
                                            </div>

                                            {/* NOTAS ADICIONALES */}
                                            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                <label style={{ fontWeight: 'bold', color: '#4a5568', display: 'block', marginBottom: '0.5rem' }}>Notas / Observaciones de Fuerza</label>
                                                <textarea
                                                    value={fuerzaData.notas}
                                                    onChange={(e) => manejarCambioFuerza('notas', e.target.value)}
                                                    placeholder="Detalles sobre RPE, repeticiones estimadas o cálculo de 1RM directo..."
                                                    rows={3}
                                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e0', color: '#333' }}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                <button type="submit" disabled={guardando} style={{ backgroundColor: '#10b981', color: '#ffffff', padding: '0.8rem 2rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
                                                    {guardando ? "Guardando Fuerza Máxima..." : "Guardar Evaluación de Fuerza Máxima"}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* EVALUACIÓN 7: GASTO CALÓRICO Y NUTRICIÓN */}
                                {evaluacionActiva === 7 && (
                                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e0', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                                            <h2 style={{ margin: 0, color: '#2d3748' }}>Gasto Calórico – Nutrición (A3-7)</h2>
                                            <button type="button" onClick={generarPDFNutricion} style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                📄 Generar Reporte PDF
                                            </button>
                                        </div>

                                        <form onSubmit={manejarGuardarNutricion} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                            
                                            {/* RECUADRO GRANDES 1: GASTO CALÓRICO */}
                                            <div style={{ background: '#ffffff', padding: '1.2rem', borderRadius: '8px', border: '1px solid #cbd5e0' }}>
                                                <h3 style={{ margin: '0 0 1rem 0', color: '#4f46e5', fontSize: '1.1rem' }}>🔥 1. Gasto Calórico (kcal)</h3>
                                                
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.2rem' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#4a5568' }}>Gasto calórico basal</label>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <input
                                                                type="number"
                                                                step="1"
                                                                value={nutricionData.gastoBasal}
                                                                onChange={(e) => manejarCambioNutricion('gastoBasal', e.target.value)}
                                                                placeholder="0"
                                                                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', color: '#333' }}
                                                            />
                                                            <span style={{ fontWeight: 'bold', color: '#718096' }}>kcal</span>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#4a5568' }}>Gasto calórico día de entrenamiento</label>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <input
                                                                type="number"
                                                                step="1"
                                                                value={nutricionData.gastoEntrenamiento}
                                                                onChange={(e) => manejarCambioNutricion('gastoEntrenamiento', e.target.value)}
                                                                placeholder="0"
                                                                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', color: '#333' }}
                                                            />
                                                            <span style={{ fontWeight: 'bold', color: '#718096' }}>kcal</span>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#4a5568' }}>Gasto calórico día de descanso</label>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <input
                                                                type="number"
                                                                step="1"
                                                                value={nutricionData.gastoDescanso}
                                                                onChange={(e) => manejarCambioNutricion('gastoDescanso', e.target.value)}
                                                                placeholder="0"
                                                                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', color: '#333' }}
                                                            />
                                                            <span style={{ fontWeight: 'bold', color: '#718096' }}>kcal</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* RECUADRO GRANDE 2: MACRONUTRIENTES */}
                                            <div style={{ background: '#ffffff', padding: '1.2rem', borderRadius: '8px', border: '1px solid #cbd5e0' }}>
                                                <h3 style={{ margin: '0 0 1rem 0', color: '#4f46e5', fontSize: '1.1rem' }}>🥗 2. Macronutrientes a Consumir (Gramos)</h3>
                                                
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.2rem' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#4a5568' }}>Proteína (Entrenamiento)</label>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                value={nutricionData.proteinaEntrenamiento}
                                                                onChange={(e) => manejarCambioNutricion('proteinaEntrenamiento', e.target.value)}
                                                                placeholder="0.0"
                                                                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', color: '#333' }}
                                                            />
                                                            <span style={{ fontWeight: 'bold', color: '#718096' }}>g</span>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#4a5568' }}>Proteína (Descanso)</label>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                value={nutricionData.proteinaDescanso}
                                                                onChange={(e) => manejarCambioNutricion('proteinaDescanso', e.target.value)}
                                                                placeholder="0.0"
                                                                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', color: '#333' }}
                                                            />
                                                            <span style={{ fontWeight: 'bold', color: '#718096' }}>g</span>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#4a5568' }}>Grasas (Entrenamiento)</label>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                value={nutricionData.grasasEntrenamiento}
                                                                onChange={(e) => manejarCambioNutricion('grasasEntrenamiento', e.target.value)}
                                                                placeholder="0.0"
                                                                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', color: '#333' }}
                                                            />
                                                            <span style={{ fontWeight: 'bold', color: '#718096' }}>g</span>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#4a5568' }}>Grasas (Descanso)</label>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                value={nutricionData.grasasDescanso}
                                                                onChange={(e) => manejarCambioNutricion('grasasDescanso', e.target.value)}
                                                                placeholder="0.0"
                                                                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', color: '#333' }}
                                                            />
                                                            <span style={{ fontWeight: 'bold', color: '#718096' }}>g</span>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#4a5568' }}>Carbohidratos (Entrenamiento)</label>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                value={nutricionData.carbohidratosEntrenamiento}
                                                                onChange={(e) => manejarCambioNutricion('carbohidratosEntrenamiento', e.target.value)}
                                                                placeholder="0.0"
                                                                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', color: '#333' }}
                                                            />
                                                            <span style={{ fontWeight: 'bold', color: '#718096' }}>g</span>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#4a5568' }}>Carbohidratos (Descanso)</label>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                value={nutricionData.carbohidratosDescanso}
                                                                onChange={(e) => manejarCambioNutricion('carbohidratosDescanso', e.target.value)}
                                                                placeholder="0.0"
                                                                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', color: '#333' }}
                                                            />
                                                            <span style={{ fontWeight: 'bold', color: '#718096' }}>g</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* RESUMEN DE ENERGÍA MACROS */}
                                                <div style={{ marginTop: '1.2rem', padding: '0.8rem 1rem', background: '#ecfdf5', borderRadius: '6px', border: '1px solid #a7f3d0', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                                    <div>
                                                        <span style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 'bold' }}>Aporte kcal Días Entrenamiento:</span>
                                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#059669' }}>{kcalMacrosEnt} kcal</div>
                                                    </div>
                                                    <div>
                                                        <span style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 'bold' }}>Aporte kcal Días Descanso:</span>
                                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#059669' }}>{kcalMacrosDes} kcal</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* RECUADRO GRANDE 3: ESPECIFICACIONES Y NOTAS LIBRES */}
                                            <div style={{ background: '#ffffff', padding: '1.2rem', borderRadius: '8px', border: '1px solid #cbd5e0' }}>
                                                <h3 style={{ margin: '0 0 0.8rem 0', color: '#4f46e5', fontSize: '1.1rem' }}>📝 3. Especificaciones Nutricionales</h3>
                                                <textarea
                                                    value={nutricionData.especificaciones}
                                                    onChange={(e) => manejarCambioNutricion('especificaciones', e.target.value)}
                                                    placeholder="Escribe aquí las pautas específicas, horarios de comidas, hidratación, suplementación recomendada, etc..."
                                                    rows={6}
                                                    style={{ width: '100%', padding: '1rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', color: '#333', lineHeight: '1.5' }}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                <button type="submit" disabled={guardando} style={{ backgroundColor: '#10b981', color: '#ffffff', padding: '0.8rem 2rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
                                                    {guardando ? "Guardando Nutrición..." : "Guardar Evaluación Nutricional"}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {evaluacionActiva > 7 && (
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