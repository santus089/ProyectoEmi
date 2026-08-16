export interface DatosAntropometria {
  peso: number; // en kg
  talla: number; // en cm
  genero: string; // "Masculino" | "Femenino"
  edad: number;
  
  // Diámetros (en cm)
  diametroHumeral: number; // cm
  diametroFemoral: number; // cm

  // Perímetros (en cm)
  perimetroBrazoRelajadoDer: number;   // cm
  perimetroBrazoFlexionadoDer: number; // cm
  perimetroMusloDer: number;           // cm
  perimetroGemeloDer: number;          // cm

  // Pliegues Cutáneos (en mm)
  pliegueTricipital: number;   // mm
  pliegueBicipital: number;    // mm
  pliegueSubescapular: number; // mm
  pliegueAbdominal: number;    // mm
  pliegueSupraespinal: number; // mm
  pliegueSuprailiaco: number;  // mm
  pliegueMuslo: number;        // mm
  pliegueGemelo: number;       // mm
}

export function calcularResultadosAntropometria(d: DatosAntropometria) {
  const esMasculino = d.genero?.toLowerCase() === "masculino";
  const edad = d.edad || 25;

  // 1. Sumatoria de 4 Pliegues (Durnin-Womersley: Tríceps, Bíceps, Subescapular, Suprailíaco)
  const suma4P = (d.pliegueTricipital || 0) +
                 (d.pliegueBicipital || 0) +
                 (d.pliegueSubescapular || 0) +
                 (d.pliegueSuprailiaco || 0);

  // L = log10(suma de 4 pliegues en mm)
  const L = suma4P > 0 ? Math.log10(suma4P) : 0;

  // 2. Cálculo de Densidad Corporal (DC) por sexo y rango de edad (Durnin-Womersley)
  let DC = 1.0;
  if (esMasculino) {
    if (edad < 20) {
      DC = 1.1620 - (0.0630 * L); // 17 a 19 años
    } else if (edad < 30) {
      DC = 1.1631 - (0.0632 * L); // 20 a 29 años
    } else {
      DC = 1.1422 - (0.0544 * L); // 30 a 39 años (o más)
    }
  } else {
    if (edad < 20) {
      DC = 1.1549 - (0.0678 * L); // 17 a 19 años
    } else if (edad < 30) {
      DC = 1.1599 - (0.0717 * L); // 20 a 29 años
    } else {
      DC = 1.1423 - (0.0632 * L); // 30 a 39 años (o más)
    }
  }

  // 3. Porcentaje de Grasa Corporal (%GC) según la Ecuación de Siri: ((4.95 / DC) - 4.50) * 100
  let porcentajeGrasa = 0;
  if (DC > 0) {
    porcentajeGrasa = ((4.95 / DC) - 4.50) * 100;
  }
  porcentajeGrasa = Math.max(0, porcentajeGrasa);
  const kgGrasa = (porcentajeGrasa / 100) * d.peso;

  // Sumatoria de 6 pliegues (mantenida para reportes y seguimiento)
  const sumatoria6P = (d.pliegueTricipital || 0) +
                      (d.pliegueSubescapular || 0) +
                      (d.pliegueSuprailiaco || 0) +
                      (d.pliegueAbdominal || 0) +
                      (d.pliegueMuslo || 0) +
                      (d.pliegueGemelo || 0);

  // 4. Masa Muscular (Ecuación de Lee et al., 2000)
  const pbCorr = d.perimetroBrazoRelajadoDer - (Math.PI * ((d.pliegueTricipital || 0) / 10));
  const pmCorr = d.perimetroMusloDer - (Math.PI * ((d.pliegueMuslo || 0) / 10));
  const pgCorr = d.perimetroGemeloDer - (Math.PI * ((d.pliegueGemelo || 0) / 10));

  const tallaMetros = d.talla / 100;
  const sexoLee = esMasculino ? 1 : 0;

  const kgMasaMuscular = tallaMetros * (
    (0.00744 * Math.pow(pbCorr, 2)) + 
    (0.00088 * Math.pow(pmCorr, 2)) + 
    (0.00441 * Math.pow(pgCorr, 2))
  ) + (2.4 * sexoLee) - (0.048 * edad) - 2.034;

  const porcentajeMasaMuscular = (kgMasaMuscular / d.peso) * 100;

  // 5. Somatotipo Heath-Carter
  // Endomorfia
  const suma3P = (d.pliegueTricipital || 0) + (d.pliegueSubescapular || 0) + (d.pliegueSupraespinal || 0);
  const suma3PCorregida = suma3P * (170.18 / d.talla);
  const endomorfia = -0.7182 + (0.1451 * suma3PCorregida) - (0.00068 * Math.pow(suma3PCorregida, 2)) + (0.0000014 * Math.pow(suma3PCorregida, 3));

  // Mesomorfia
  const pbCorrMeso = d.perimetroBrazoFlexionadoDer - ((d.pliegueTricipital || 0) / 10);
  const pgCorrMeso = d.perimetroGemeloDer - ((d.pliegueGemelo || 0) / 10);

  const mesomorfia = (0.858 * d.diametroHumeral) + 
                     (0.601 * d.diametroFemoral) + 
                     (0.188 * pbCorrMeso) + 
                     (0.161 * pgCorrMeso) - 
                     (0.131 * d.talla) + 4.5;

  // Ectomorfia
  const cap = d.talla / Math.cbrt(d.peso);
  let ectomorfia = 0.1;
  if (cap >= 40.75) {
    ectomorfia = (0.732 * cap) - 28.58;
  } else if (cap > 38.28) {
    ectomorfia = (0.463 * cap) - 17.63;
  }

  // Coordenadas Somatocarta
  const x = ectomorfia - endomorfia;
  const y = (2 * mesomorfia) - (endomorfia + ectomorfia);

  return {
    densidadCorporal: Number(DC.toFixed(4)),
    sumatoria4P: Number(suma4P.toFixed(1)),
    sumatoria6P: Number(sumatoria6P.toFixed(1)),
    porcentajeGrasa: Number(porcentajeGrasa.toFixed(2)),
    kgGrasa: Number(kgGrasa.toFixed(2)),
    porcentajeMasaMuscular: Number(porcentajeMasaMuscular.toFixed(2)),
    kgMasaMuscular: Number(kgMasaMuscular.toFixed(2)),
    endomorfia: Number(Math.max(0.1, endomorfia).toFixed(2)),
    mesomorfia: Number(Math.max(0.1, mesomorfia).toFixed(2)),
    ectomorfia: Number(Math.max(0.1, ectomorfia).toFixed(2)),
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2))
  };
}