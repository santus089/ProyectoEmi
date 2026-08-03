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

  // Pliegues Cutáneos (estándar internacional siempre en mm)
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

  // 1. Sumatoria de 6 Pliegues (Yuhasz oficial: Tricipital, Subescapular, Suprailiaco, Abdominal, Muslo, Gemelo)
  const sumatoria6P = (d.pliegueTricipital || 0) +
                      (d.pliegueSubescapular || 0) +
                      (d.pliegueSuprailiaco || 0) +
                      (d.pliegueAbdominal || 0) +
                      (d.pliegueMuslo || 0) +
                      (d.pliegueGemelo || 0);

  // 2. Porcentaje de Grasa Corporal (Fórmula Yuhasz)
  let porcentajeGrasa = 0;
  if (esMasculino) {
    porcentajeGrasa = (0.1051 * sumatoria6P) + 2.585;
  } else {
    porcentajeGrasa = (0.1548 * sumatoria6P) + 3.580; 
  }
  const kgGrasa = (porcentajeGrasa / 100) * d.peso;

  // 3. Masa Muscular (Ecuación de Lee et al., 2000)
  // Perímetros corregidos por pliegues (cm)
  const pbCorr = d.perimetroBrazoRelajadoDer - (Math.PI * (d.pliegueTricipital / 10));
  const pmCorr = d.perimetroMusloDer - (Math.PI * (d.pliegueMuslo / 10));
  const pgCorr = d.perimetroGemeloDer - (Math.PI * (d.pliegueGemelo / 10));

  const tallaMetros = d.talla / 100;
  const sexoLee = esMasculino ? 1 : 0;

  // Ecuación de Lee
  const kgMasaMuscular = tallaMetros * (
    (0.00744 * Math.pow(pbCorr, 2)) + 
    (0.00088 * Math.pow(pmCorr, 2)) + 
    (0.00441 * Math.pow(pgCorr, 2))
  ) + (2.4 * sexoLee) - (0.048 * (d.edad)) - 2.034;

  const porcentajeMasaMuscular = (kgMasaMuscular / d.peso) * 100;

  // 4. Somatotipo Heath-Carter
  // Endomorfia: pliegues corregidos por la estatura
  const suma3P = (d.pliegueTricipital || 0) + (d.pliegueSubescapular || 0) + (d.pliegueSupraespinal || 0);
  const suma3PCorregida = suma3P * (170.18 / d.talla);
  const endomorfia = -0.7182 + (0.1451 * suma3PCorregida) - (0.00068 * Math.pow(suma3PCorregida, 2)) + (0.0000014 * Math.pow(suma3PCorregida, 3));

  // Mesomorfia (Diámetros recibidos directamente en cm)
  const pbCorrMeso = d.perimetroBrazoFlexionadoDer - (d.pliegueTricipital / 10);
  const pgCorrMeso = d.perimetroGemeloDer - (d.pliegueGemelo / 10);

  const mesomorfia = (0.858 * d.diametroHumeral) + 
                     (0.601 * d.diametroFemoral) + 
                     (0.188 * pbCorrMeso) + 
                     (0.161 * pgCorrMeso) - 
                     (0.131 * d.talla) + 4.5;

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