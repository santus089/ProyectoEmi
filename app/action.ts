'use server' // corre en el servidor seguro.

import { supabase } from "./lib/supabase";

// guarda pacientes del formulario
export async function guardarPaciente(datos: any) {
  try {
    const fechaOriginal = datos.formFechaNacimiento || datos.fechaNacimiento;
    
    if (!fechaOriginal) {
      return { success: false, error: 'La fecha de nacimiento es obligatoria' };
    }

    // Solución Zona Horaria: Le agregamos T12:00:00 para evitar descalces de fecha por UTC
    const fechaFormateada = fechaOriginal.includes('T') 
      ? fechaOriginal 
      : `${fechaOriginal}T12:00:00.000Z`;

    // Insertamos en la tabla 'Paciente'
    const { data, error } = await supabase
      .from('Paciente') 
      .insert([
        {
          rut: datos.rut,
          nombre: datos.nombre,
          apellido: datos.apellido,
          fechaNacimiento: fechaFormateada, 
          telefono: datos.telefono,
          correo: datos.correo,
          genero: datos.genero
        }
      ])
      .select();

    if (error) {
      console.error("Error Supabase Guardar Paciente:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error inesperado en el servidor' };
  }
}

// traer lista de pacientes de las base de datos
export async function obtenerPaciente(){
  try{
    const {data, error} = await supabase
    .from('Paciente')
    .select('id, rut, nombre, apellido, correo, fechaNacimiento, telefono, genero')
    .order('createdAt', {ascending: false})

    if (error){
      console.error("Error al traer pacientes:", error);
      return {success: false, error: error.message, data:[]}
    }

    return {success: true, data: data || []}

  } catch (err: any){
    return {success: false, error: err.message || 'Error inesperado', data:[]}
  }
}

//Guardar una nueva cita
export async function guardarCita(datos: any) {
  try {
    const { data, error } = await supabase
      .from('Cita')
      .insert([
        {
          pacienteId: parseInt(datos.pacienteId), // Aseguramos que sea un entero
          fecha: datos.fecha,
          hora: datos.hora,
          horaFin: datos.horaFin,
          modalidad: datos.modalidad,
          motivo: datos.motivo,
          estado: datos.estado || 'pendiente'
        }
      ])
      .select()

    if (error) return { success: false, error: error.message }
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error en el servidor' }
  }
}

//Obtener todas las citas incluyendo el Nombre del Paciente (¡Magia de Supabase!)
export async function obtenerCitas() {
  try {
    // Al usar 'Paciente(nombre, apellido)' Supabase hace el JOIN automáticamente
    const { data, error } = await supabase
      .from('Cita')
      .select(`
        id,
        fecha,
        hora,
        horaFin,
        modalidad,
        motivo,
        estado,
        pacienteId,
        Paciente (
          nombre,
          apellido
        )
      `)
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true })

    if (error) return { success: false, error: error.message, data: [] }
    return { success: true, data: data || [] }
  } catch (err: any) {
    return { success: false, error: err.message, data: [] }
  }
}

//Acción para actualizar los datos de un paciente existente
export async function actualizarPaciente(id: number, datos: any) {
  try {
    const fechaOriginal = datos.fechaNacimiento;
    if (!fechaOriginal) {
      return { success: false, error: 'La fecha de nacimiento es obligatoria' };
    }
    const fechaTimestamp = new Date(fechaOriginal).toISOString();

    const { data, error } = await supabase
      .from('Paciente')
      .update({
        rut: datos.rut,
        nombre: datos.nombre,
        apellido: datos.apellido,
        fechaNacimiento: fechaTimestamp,
        telefono: datos.telefono,
        correo: datos.correo,
        genero: datos.genero
      })
      .eq('id', id) // Filtramos por el ID único del paciente
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error en el servidor' };
  }
}

//Acción para eliminar un paciente de la base de datos
export async function borrarPaciente(id: number) {
  try {
    const { error } = await supabase
      .from('Paciente')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error en el servidor' };
  }
}

// Actualizar cita existente
export async function actualizarCita(id: number, datos: any) {
  try {
    const { data, error } = await supabase
      .from('Cita') // Asegúrate de que el nombre de tu tabla sea exactamente 'Cita'
      .update({
        pacienteId: datos.pacienteId,
        fecha: datos.fecha,
        hora: datos.hora,
        horaFin: datos.horaFin,
        modalidad: datos.modalidad,
        motivo: datos.motivo
      })
      .eq('id', id)
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al actualizar la cita' };
  }
}

// Borrar cita
export async function borrarCita(id: number) {
  try {
    const { error } = await supabase
      .from('Cita')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al eliminar la cita' };
  }
}

// Guarda un registro nuevo de evaluación para el paciente, o actualiza el más
// reciente que ya exista, para que no se acumule un registro por cada guardado.
async function guardarOActualizarEvaluacion(tabla: string, pacienteId: number, datos: any) {
  const { data: existente, error: errorBusqueda } = await supabase
    .from(tabla)
    .select('id')
    .eq('pacienteId', pacienteId)
    .order('fecha', { ascending: false })
    .limit(1);

  if (errorBusqueda) return { success: false, error: errorBusqueda.message };

  if (existente && existente.length > 0) {
    const { data, error } = await supabase
      .from(tabla)
      .update(datos)
      .eq('id', existente[0].id)
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  }

  const { data, error } = await supabase
    .from(tabla)
    .insert([datos])
    .select();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

//Guardar o actualizar la Anamnesis de un paciente
export async function guardarAnamnesis(datos: {
  pacienteId: number;
  antecedentesMorbidos: string;
  antecedentesMedicos: string;
  informacionNutricional: string;
  informacionDeportiva: string;
  objetivos: string;
}) {
  try {
    return await guardarOActualizarEvaluacion('EvaluacionAnamnesis', datos.pacienteId, datos);
  } catch (err: any) {
    return { success: false, error: err.message || 'Error en el servidor' };
  }
}

//Obtener el historial de Anamnesis de un paciente específico
export async function obtenerAnamnesisPaciente(pacienteId: number) {
  try {
    const { data, error } = await supabase
      .from('EvaluacionAnamnesis')
      .select('*')
      .eq('pacienteId', pacienteId)
      .order('fecha', { ascending: false });

    if (error) return { success: false, error: error.message, data: [] };
    return { success: true, data: data || [] };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}


 // Guardar o actualizar antropometria del paciente
export async function guardarAntropometria(datos: any) {
  try {
    return await guardarOActualizarEvaluacion('EvaluacionAntropometria', datos.pacienteId, datos);
  } catch (err: any) {
    return { success: false, error: err.message || 'Error en el servidor' };
  }
}


// Obtener datos de antropometria del paciente
export async function obtenerAntropometriaPaciente(pacienteId: number) {
  try {
    const { data, error } = await supabase
      .from('EvaluacionAntropometria')
      .select('*')
      .eq('pacienteId', pacienteId)
      .order('fecha', { ascending: false });

    if (error) return { success: false, error: error.message, data: [] };
    return { success: true, data: data || [] };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}
 // Guardar o actualizar evaluacion:3 FMS
export async function guardarFMS(datos: {
  pacienteId: number;
  sentadillaProfunda: number;
  pasoValla: number;
  estocadaLinea: number;
  movilidadHombros: number;
  elevacionPiernaRecta: number;
  estabilidadTroncoFlexion: number;
  estabilidadRotatoria: number;
  puntajeTotal: number;
  notas?: string;
}) {
  try {
    return await guardarOActualizarEvaluacion('EvaluacionFMS', datos.pacienteId, datos);
  } catch (err: any) {
    return { success: false, error: err.message || 'Error en el servidor' };
  }
}


// Obtener evaluacion:3 FMS
export async function obtenerFMSPaciente(pacienteId: number) {
  try {
    const { data, error } = await supabase
      .from('EvaluacionFMS')
      .select('*')
      .eq('pacienteId', pacienteId)
      .order('fecha', { ascending: false });

    if (error) return { success: false, error: error.message, data: [] };
    return { success: true, data: data || [] };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}

// Guardar o actualizar Evaluación de Salto Vertical
export async function guardarSaltoVertical(datos: {
  pacienteId: number;
  cmj?: number | null;
  sj?: number | null;
  cmjB?: number | null;
  dropJump?: number | null;
  depthJump?: number | null;
  carreraCompleta?: number | null;
  notas?: string;
}) {
  try {
    return await guardarOActualizarEvaluacion('EvaluacionSaltoVertical', datos.pacienteId, datos);
  } catch (err: any) {
    return { success: false, error: err.message || 'Error en el servidor' };
  }
}

// Obtener historial de Salto Vertical de un paciente
export async function obtenerSaltoVerticalPaciente(pacienteId: number) {
  try {
    const { data, error } = await supabase
      .from('EvaluacionSaltoVertical')
      .select('*')
      .eq('pacienteId', pacienteId)
      .order('fecha', { ascending: false });

    if (error) return { success: false, error: error.message, data: [] };
    return { success: true, data: data || [] };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}

// Guardar o actualizar Evaluación de Velocidad
export async function guardarVelocidad(datos: {
  pacienteId: number;
  tiempo10m?: number | null;
  tiempo40m?: number | null;
  velocidad10m?: number | null;
  velocidad40m?: number | null;
  notas?: string;
}) {
  try {
    return await guardarOActualizarEvaluacion('EvaluacionVelocidad', datos.pacienteId, datos);
  } catch (err: any) {
    return { success: false, error: err.message || 'Error en el servidor' };
  }
}

// Obtener historial de Velocidad de un paciente
export async function obtenerVelocidadPaciente(pacienteId: number) {
  try {
    const { data, error } = await supabase
      .from('EvaluacionVelocidad')
      .select('*')
      .eq('pacienteId', pacienteId)
      .order('fecha', { ascending: false });

    if (error) return { success: false, error: error.message, data: [] };
    return { success: true, data: data || [] };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}

// Guardar o actualizar Evaluación de Fuerza Máxima
export async function guardarFuerzaMaxima(datos: {
  pacienteId: number;
  pesoMuerto?: number | null;
  sentadilla?: number | null;
  pressBanca?: number | null;
  totalLevantado?: number | null;
  notas?: string;
}) {
  try {
    return await guardarOActualizarEvaluacion('EvaluacionFuerzaMaxima', datos.pacienteId, datos);
  } catch (err: any) {
    return { success: false, error: err.message || 'Error en el servidor' };
  }
}

// Obtener historial de Fuerza Máxima de un paciente
export async function obtenerFuerzaMaximaPaciente(pacienteId: number) {
  try {
    const { data, error } = await supabase
      .from('EvaluacionFuerzaMaxima')
      .select('*')
      .eq('pacienteId', pacienteId)
      .order('fecha', { ascending: false });

    if (error) return { success: false, error: error.message, data: [] };
    return { success: true, data: data || [] };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}

// Guardar o actualizar Evaluación de Gasto Calórico y Nutrición
export async function guardarGastoCalorico(datos: {
  pacienteId: number;
  gastoBasal?: number | null;
  gastoEntrenamiento?: number | null;
  gastoDescanso?: number | null;
  proteinaEntrenamiento?: number | null;
  proteinaDescanso?: number | null;
  grasasEntrenamiento?: number | null;
  grasasDescanso?: number | null;
  carbohidratosEntrenamiento?: number | null;
  carbohidratosDescanso?: number | null;
  especificaciones?: string;
}) {
  try {
    return await guardarOActualizarEvaluacion('EvaluacionGastoCalorico', datos.pacienteId, datos);
  } catch (err: any) {
    return { success: false, error: err.message || 'Error en el servidor' };
  }
}

// Obtener historial de Gasto Calórico de un paciente
export async function obtenerGastoCaloricoPaciente(pacienteId: number) {
  try {
    const { data, error } = await supabase
      .from('EvaluacionGastoCalorico')
      .select('*')
      .eq('pacienteId', pacienteId)
      .order('fecha', { ascending: false });

    if (error) return { success: false, error: error.message, data: [] };
    return { success: true, data: data || [] };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}

// ==================== ENTRENAMIENTO: GRUPOS DE EJERCICIOS ====================

// Obtener todos los grupos/clasificaciones de ejercicios
export async function obtenerGruposEjercicio() {
  try {
    const { data, error } = await supabase
      .from('GrupoEjercicio')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) return { success: false, error: error.message, data: [] };
    return { success: true, data: data || [] };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}

// Crear un nuevo grupo de ejercicios
export async function crearGrupoEjercicio(nombre: string) {
  try {
    const { data, error } = await supabase
      .from('GrupoEjercicio')
      .insert([{ nombre }])
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error en el servidor' };
  }
}

// Renombrar un grupo de ejercicios
export async function actualizarGrupoEjercicio(id: number, nombre: string) {
  try {
    const { data, error } = await supabase
      .from('GrupoEjercicio')
      .update({ nombre })
      .eq('id', id)
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error en el servidor' };
  }
}

// Borrar un grupo de ejercicios (los ejercicios que lo usaban quedan sin grupo)
export async function borrarGrupoEjercicio(id: number) {
  try {
    const { error } = await supabase
      .from('GrupoEjercicio')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error en el servidor' };
  }
}

// ==================== ENTRENAMIENTO: BIBLIOTECA DE EJERCICIOS ====================

// Obtener todos los ejercicios de la biblioteca
export async function obtenerEjercicios() {
  try {
    const { data, error } = await supabase
      .from('Ejercicio')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) return { success: false, error: error.message, data: [] };
    return { success: true, data: data || [] };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}

// Crear un nuevo ejercicio en la biblioteca
export async function crearEjercicio(datos: {
  grupoId?: number | null;
  nombre: string;
  repTiempo?: string;
  peso?: string;
  movimiento?: string;
  series?: string;
  descanso?: string;
  rm?: string;
  comentario?: string;
  video?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('Ejercicio')
      .insert([datos])
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error en el servidor' };
  }
}

// Actualizar un ejercicio existente de la biblioteca
export async function actualizarEjercicio(id: number, datos: any) {
  try {
    const { data, error } = await supabase
      .from('Ejercicio')
      .update(datos)
      .eq('id', id)
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error en el servidor' };
  }
}

// Borrar un ejercicio de la biblioteca
export async function borrarEjercicio(id: number) {
  try {
    const { error } = await supabase
      .from('Ejercicio')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error en el servidor' };
  }
}

// ==================== ENTRENAMIENTO: RUTINAS ====================

// Obtener pacientes que tienen al menos una evaluación guardada
export async function obtenerPacientesEvaluados() {
  try {
    const tablasEvaluacion = [
      'EvaluacionAnamnesis',
      'EvaluacionAntropometria',
      'EvaluacionFMS',
      'EvaluacionSaltoVertical',
      'EvaluacionVelocidad',
      'EvaluacionFuerzaMaxima',
      'EvaluacionGastoCalorico'
    ];

    const idsEvaluados = new Set<number>();

    for (const tabla of tablasEvaluacion) {
      const { data, error } = await supabase.from(tabla).select('pacienteId');
      if (error) return { success: false, error: error.message, data: [] };
      (data || []).forEach((registro: any) => idsEvaluados.add(registro.pacienteId));
    }

    if (idsEvaluados.size === 0) return { success: true, data: [] };

    const { data: pacientes, error: errorPacientes } = await supabase
      .from('Paciente')
      .select('id, rut, nombre, apellido, correo, fechaNacimiento, telefono, genero')
      .in('id', Array.from(idsEvaluados))
      .order('nombre', { ascending: true });

    if (errorPacientes) return { success: false, error: errorPacientes.message, data: [] };
    return { success: true, data: pacientes || [] };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}

// Obtener la rutina más reciente de un paciente, con sus bloques y ejercicios
export async function obtenerRutinaPaciente(pacienteId: number) {
  try {
    const { data: rutinas, error: errorRutina } = await supabase
      .from('Rutina')
      .select('*')
      .eq('pacienteId', pacienteId)
      .order('fecha', { ascending: false })
      .limit(1);

    if (errorRutina) return { success: false, error: errorRutina.message, data: null };
    if (!rutinas || rutinas.length === 0) return { success: true, data: null };

    const rutina = rutinas[0];

    const { data: bloques, error: errorBloques } = await supabase
      .from('RutinaBloque')
      .select('*')
      .eq('rutinaId', rutina.id)
      .order('orden', { ascending: true });

    if (errorBloques) return { success: false, error: errorBloques.message, data: null };

    const bloqueIds = (bloques || []).map((b: any) => b.id);
    let ejercicios: any[] = [];

    if (bloqueIds.length > 0) {
      const { data: ejerciciosData, error: errorEjercicios } = await supabase
        .from('RutinaEjercicio')
        .select('*')
        .in('bloqueId', bloqueIds)
        .order('orden', { ascending: true });

      if (errorEjercicios) return { success: false, error: errorEjercicios.message, data: null };
      ejercicios = ejerciciosData || [];
    }

    return { success: true, data: { rutina, bloques: bloques || [], ejercicios } };
  } catch (err: any) {
    return { success: false, error: err.message, data: null };
  }
}

// Guardar (crear o reemplazar) la rutina completa de un paciente
export async function guardarRutina(datos: {
  pacienteId: number;
  nombre: string;
  dias: Record<string, Array<{
    nombre: string;
    ejercicios: Array<{
      ejercicioOrigenId?: number | null;
      nombre: string;
      repTiempo?: string;
      peso?: string;
      movimiento?: string;
      series?: string;
      descanso?: string;
      rm?: string;
      comentario?: string;
      video?: string;
    }>;
  }>>;
}) {
  try {
    let rutinaId: number;

    const { data: existente, error: errorBusqueda } = await supabase
      .from('Rutina')
      .select('id')
      .eq('pacienteId', datos.pacienteId)
      .order('fecha', { ascending: false })
      .limit(1);

    if (errorBusqueda) return { success: false, error: errorBusqueda.message };

    if (existente && existente.length > 0) {
      rutinaId = existente[0].id;
      const { error: errorUpdate } = await supabase
        .from('Rutina')
        .update({ nombre: datos.nombre, updatedAt: new Date().toISOString() })
        .eq('id', rutinaId);
      if (errorUpdate) return { success: false, error: errorUpdate.message };

      // Al reemplazar por completo, se eliminan los bloques anteriores (cascada borra sus ejercicios)
      const { error: errorDelete } = await supabase
        .from('RutinaBloque')
        .delete()
        .eq('rutinaId', rutinaId);
      if (errorDelete) return { success: false, error: errorDelete.message };
    } else {
      const { data: nueva, error: errorInsert } = await supabase
        .from('Rutina')
        .insert([{ pacienteId: datos.pacienteId, nombre: datos.nombre }])
        .select();
      if (errorInsert) return { success: false, error: errorInsert.message };
      rutinaId = nueva[0].id;
    }

    for (const dia of Object.keys(datos.dias)) {
      const bloques = datos.dias[dia] || [];

      for (let indiceBloque = 0; indiceBloque < bloques.length; indiceBloque++) {
        const bloque = bloques[indiceBloque];

        const { data: nuevoBloque, error: errorBloque } = await supabase
          .from('RutinaBloque')
          .insert([{ rutinaId, dia, orden: indiceBloque, nombre: bloque.nombre || '' }])
          .select();

        if (errorBloque) return { success: false, error: errorBloque.message };
        const bloqueId = nuevoBloque[0].id;

        if (bloque.ejercicios.length > 0) {
          const payloadEjercicios = bloque.ejercicios.map((ej, indiceEj) => ({
            bloqueId,
            ejercicioOrigenId: ej.ejercicioOrigenId || null,
            orden: indiceEj,
            nombre: ej.nombre,
            repTiempo: ej.repTiempo,
            peso: ej.peso,
            movimiento: ej.movimiento,
            series: ej.series,
            descanso: ej.descanso,
            rm: ej.rm,
            comentario: ej.comentario,
            video: ej.video
          }));

          const { error: errorEjercicios } = await supabase
            .from('RutinaEjercicio')
            .insert(payloadEjercicios);
          if (errorEjercicios) return { success: false, error: errorEjercicios.message };
        }
      }
    }

    return { success: true, rutinaId };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error en el servidor' };
  }
}

// Obtener todo el historial de evaluaciones para seguimiento
export async function obtenerHistorialCompletoPaciente(pacienteId: number) {
  try {
    const [resAntro, resFms, resSalto, resVel, resFuerza] = await Promise.all([
      supabase.from('EvaluacionAntropometria').select('*').eq('pacienteId', pacienteId).order('fecha', { ascending: true }),
      supabase.from('EvaluacionFMS').select('*').eq('pacienteId', pacienteId).order('fecha', { ascending: true }),
      supabase.from('EvaluacionSaltoVertical').select('*').eq('pacienteId', pacienteId).order('fecha', { ascending: true }),
      supabase.from('EvaluacionVelocidad').select('*').eq('pacienteId', pacienteId).order('fecha', { ascending: true }),
      supabase.from('EvaluacionFuerzaMaxima').select('*').eq('pacienteId', pacienteId).order('fecha', { ascending: true })
    ]);

    return {
      success: true,
      data: {
        antropometria: resAntro.data || [],
        fms: resFms.data || [],
        salto: resSalto.data || [],
        velocidad: resVel.data || [],
        fuerza: resFuerza.data || []
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}