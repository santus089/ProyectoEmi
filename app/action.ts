'use server' // corre en el servidor seguro.

import { supabase } from "./lib/supabase";

// guarda pacientes del formulario
export async function guardarPaciente(datos: any) {
  try {
    // 1. Validamos que venga la propiedad correcta (en tu página es formFechaNacimiento)
    const fechaOriginal = datos.formFechaNacimiento || datos.fechaNacimiento;
    
    if (!fechaOriginal) {
      return { success: false, error: 'La fecha de nacimiento es obligatoria' };
    }

    // 2. Convertimos la fecha al formato TIMESTAMP(3) requerido por la tabla
    const fechaTimestamp = new Date(fechaOriginal).toISOString();

    // Insertamos directo en la tabla 'Paciente' sin incluir el 'id' (se encarga el SERIAL)
    const { data, error } = await supabase
      .from('Paciente') 
      .insert([
        {
          rut: datos.rut,
          nombre: datos.nombre,
          apellido: datos.apellido,
          fechaNacimiento: fechaTimestamp, 
          telefono: datos.telefono,
          correo: datos.correo,
          genero: datos.genero
        }
      ])
      .select()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error inesperado en el servidor' }
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