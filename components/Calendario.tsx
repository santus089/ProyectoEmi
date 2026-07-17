"use model";
import React from 'react';

export default function CalendarioVista() {
  const fechaActual = new Date();
  const año = fechaActual.getFullYear();
  const mes = fechaActual.getMonth();

  // Nombres de los meses y días en español
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const diasSemana = ["Dom", "Lun", "Mar", "Mir", "Juv", "Vie", "Sáb"];

  // Cálculos del calendario para el mes actual
  const primerDiaMes = new Date(año, mes, 1).getDay();
  const totalDiasMes = new Date(año, mes + 1, 0).getDate();
  const diaDeHoy = fechaActual.getDate();

  // Crear espacios en blanco para los días de la semana anteriores al día 1
  const espaciosBlancos = Array(primerDiaMes).fill(null);
  // Crear el array con los números de los días (1, 2, 3...)
  const dias = Array.from({ length: totalDiasMes }, (_, i) => i + 1);
  // Combinar ambos para la grilla
  const celdasCalendario = [...espaciosBlancos, ...dias];

  return (
    <div className="card-evaluaciones" style={{ marginTop: 0 }}>
      {/* Encabezado del Calendario */}
      <div className="calendario-header">
        <h4>{meses[mes].toUpperCase()} {año}</h4>
      </div>

      {/* Iniciales de los días de la semana */}
      <div className="calendario-dias-semana">
        {diasSemana.map((dia, index) => (
          <span key={index} className="dia-nombre">{dia}</span>
        ))}
      </div>

      {/* Grilla con los números de los días */}
      <div className="calendario-grilla">
        {celdasCalendario.map((dia, index) => {
          const esHoy = dia === diaDeHoy;
          return (
            <div 
              key={index} 
              className={`calendario-celda ${dia ? 'dia-activo' : 'dia-vacio'} ${esHoy ? 'hoy' : ''}`}
            >
              {dia}
            </div>
          );
        })}
      </div>
    </div>
  );
}