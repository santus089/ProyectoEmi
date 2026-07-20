export interface DatosAntropometria {
  peso: number;
  talla: number; // en cm
  genero: string; // "Masculino" | "Femenino"
  edad: number;
  
  // Diámetros (mm)
  diametroHumeral: number;
  diametroFemoral: number;

  // Perímetros (cm)
  perimetroBrazoFlexionadoDer: number;
  perimetroMusloDer: number;
  perimetroGemeloDer: number;

  // Pliegues (mm)
  pliegueTricipital: number;
  pliegueBicipital: number;
  pliegueSubescapular: number;
  pliegueAbdominal: number;
  pliegueSupraespinal: number;
  pliegueSuprailiaco: number;
  pliegueMuslo: number;
  pliegueGemelo: number;
}

export function calcularResultadosAntropometria(d: DatosAntropometria) {
  const esMasculino = d.genero?.toLowerCase() === "masculino";

  // 1. Sumatoria de 6 Pliegues (Tricipital, Subescapular, Supraespinal, Abdominal, Muslo, Gemelo)
  const sumatoria6P = d.pliegueTricipital + d.pliegueSubescapular + d.pliegueSupraespinal + 
                      d.pliegueAbdominal + d.pliegueMuslo + d.pliegueGemelo;

  // 2. Porcentaje de Grasa Corporal (Fórmula Yuhasz)
  let porcentajeGrasa = 0;
  if (esMasculino) {
    porcentajeGrasa = 3.64 + (0.097 * sumatoria6P);
  } else {
    porcentajeGrasa = 4.56 + (0.143 * sumatoria6P);
  }
  const kgGrasa = (porcentajeGrasa / 100) * d.peso;

  // 3. Masa Muscular (Ecuación de Lee)
  // Perímetros corregidos por pliegues (cm)
  const pbCorr = d.perimetroBrazoFlexionadoDer - (Math.PI * (d.pliegueTricipital / 10));
  const pmCorr = d.perimetroMusloDer - (Math.PI * (d.pliegueMuslo / 10));
  const pgCorr = d.perimetroGemeloDer - (Math.PI * (d.pliegueGemelo / 10));

  const tallaMetros = d.talla / 100;
  const sexoLee = esMasculino ? 1 : 0;

  // Ecuación de Lee et al.
  const kgMasaMuscular = tallaMetros * (
    (0.00744 * Math.pow(pbCorr, 2)) + 
    (0.00088 * Math.pow(pmCorr, 2)) + 
    (0.00441 * Math.pow(pgCorr, 2))
  ) + (2.4 * sexoLee) - (0.048 * (d.edad || 25));

  const porcentajeMasaMuscular = (kgMasaMuscular / d.peso) * 100;

  // 4. Somatotipo Heath-Carter
  // Endomorfia: pliegues corregidos por la estatura
  const suma3P = d.pliegueTricipital + d.pliegueSubescapular + d.pliegueSupraespinal;
  const suma3PCorregida = suma3P * (170.18 / d.talla);
  const endomorfia = -0.7182 + (0.1451 * suma3PCorregida) - (0.00068 * Math.pow(suma3PCorregida, 2)) + (0.0000014 * Math.pow(suma3PCorregida, 3));

  // Mesomorfia
  const pbCorrMeso = d.perimetroBrazoFlexionadoDer - (d.pliegueTricipital / 10);
  const pgCorrMeso = d.perimetroGemeloDer - (d.pliegueGemelo / 10);
  const mesomorfia = (0.858 * (d.diametroHumeral / 10)) + 
                     (0.601 * (d.diametroFemoral / 10)) + 
                     (0.188 * pbCorrMeso) + 
                     (0.161 * pgCorrMeso) - 
                     (0.161 * d.talla) + 18.8;

  // Ectomorfia (Índice Ponderal / CAP)
  const cap = d.talla / Math.cbrt(d.peso);
  let ectomorfia = 0.1;
  if (cap >= 40.75) {
    ectomorfia = (0.732 * cap) - 28.58;
  } else if (cap > 38.28) {
    ectomorfia = (0.463 * cap) - 17.63;
  }

  // Coordenadas para la Somatocarta (Plano Cartesiano X, Y)
  const x = ectomorfia - endomorfia;
  const y = (2 * mesomorfia) - (endomorfia + ectomorfia);

  return {
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