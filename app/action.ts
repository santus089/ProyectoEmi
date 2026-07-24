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
    const { data, error } = await supabase
      .from('EvaluacionAnamnesis')
      .insert([
        {
          pacienteId: datos.pacienteId,
          antecedentesMorbidos: datos.antecedentesMorbidos,
          antecedentesMedicos: datos.antecedentesMedicos,
          informacionNutricional: datos.informacionNutricional,
          informacionDeportiva: datos.informacionDeportiva,
          objetivos: datos.objetivos
        }
      ])
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
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


 // Guardar antropometria del paciente
export async function guardarAntropometria(datos: any) {
  try {
    const { data, error } = await supabase
      .from('EvaluacionAntropometria')
      .insert([datos])
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
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
 // Guardar evaluacion:3 FMS
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
    const { data, error } = await supabase
      .from('EvaluacionFMS')
      .insert([datos])
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
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

// Guardar Evaluación de Salto Vertical
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
    const { data, error } = await supabase
      .from('EvaluacionSaltoVertical')
      .insert([datos])
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
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

// Guardar Evaluación de Velocidad
export async function guardarVelocidad(datos: {
  pacienteId: number;
  tiempo10m?: number | null;
  tiempo40m?: number | null;
  velocidad10m?: number | null;
  velocidad40m?: number | null;
  notas?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('EvaluacionVelocidad')
      .insert([datos])
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
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

// Guardar Evaluación de Fuerza Máxima
export async function guardarFuerzaMaxima(datos: {
  pacienteId: number;
  pesoMuerto?: number | null;
  sentadilla?: number | null;
  pressBanca?: number | null;
  totalLevantado?: number | null;
  notas?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('EvaluacionFuerzaMaxima')
      .insert([datos])
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
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

// Guardar Evaluación de Gasto Calórico y Nutrición
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
    const { data, error } = await supabase
      .from('EvaluacionGastoCalorico')
      .insert([datos])
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
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