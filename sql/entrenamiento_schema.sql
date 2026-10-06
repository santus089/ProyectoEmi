-- =====================================================================
-- Esquema de la base de datos (Supabase / PostgreSQL)
-- Refleja la estructura real de la base al 2026-10-05.
-- Sirve para recrear la base desde cero. Para una base existente,
-- ver la sección "MIGRACIONES" al final.
-- =====================================================================

-- ==================== PACIENTES Y AGENDA ====================

CREATE TABLE "Paciente" (
  "id" SERIAL PRIMARY KEY,
  "rut" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "apellido" TEXT NOT NULL,
  "fechaNacimiento" TIMESTAMP NOT NULL,
  "telefono" TEXT NOT NULL,
  "correo" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "genero" TEXT
);

CREATE TABLE "Cita" (
  "id" SERIAL PRIMARY KEY,
  "pacienteId" INTEGER NOT NULL REFERENCES "Paciente"("id") ON DELETE CASCADE,
  "fecha" DATE NOT NULL,
  "hora" TIME NOT NULL,
  "motivo" TEXT,
  "estado" TEXT NOT NULL DEFAULT 'Pendiente',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "horaFin" TIME NOT NULL DEFAULT '09:00:00',
  "modalidad" TEXT NOT NULL DEFAULT 'presencial'
);

-- ==================== EVALUACIONES (A3-1 a A3-7) ====================

CREATE TABLE "EvaluacionAnamnesis" (
  "id" SERIAL PRIMARY KEY,
  "pacienteId" INTEGER NOT NULL REFERENCES "Paciente"("id") ON DELETE CASCADE,
  "fecha" TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  "antecedentesMorbidos" TEXT,
  "antecedentesMedicos" TEXT,
  "informacionNutricional" TEXT,
  "informacionDeportiva" TEXT,
  "objetivos" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE "EvaluacionAntropometria" (
  "id" SERIAL PRIMARY KEY,
  "pacienteId" INTEGER NOT NULL REFERENCES "Paciente"("id") ON DELETE CASCADE,
  "fecha" TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),

  -- Datos básicos
  "peso" NUMERIC,                          -- kg
  "talla" NUMERIC,                         -- cm

  -- Diámetros (cm)
  "diametroHumeral" NUMERIC,
  "diametroFemoral" NUMERIC,

  -- Perímetros (cm)
  "perimetroBrazoRelajadoDer" NUMERIC,
  "perimetroBrazoFlexionadoDer" NUMERIC,
  "perimetroBrazoRelajadoIzq" NUMERIC,
  "perimetroBrazoFlexionadoIzq" NUMERIC,
  "perimetroPectoral" NUMERIC,
  "perimetroEspalda" NUMERIC,
  "perimetroCintura" NUMERIC,
  "perimetroCinturaMaxima" NUMERIC,
  "perimetroCadera" NUMERIC,
  "perimetroMusloDer" NUMERIC,
  "perimetroMusloIzq" NUMERIC,
  "perimetroGemeloDer" NUMERIC,
  "perimetroGemeloIzq" NUMERIC,

  -- Pliegues cutáneos (mm)
  "pliegueTricipital" NUMERIC,
  "pliegueBicipital" NUMERIC,
  "pliegueSubescapular" NUMERIC,
  "pliegueAbdominal" NUMERIC,
  "pliegueSupraespinal" NUMERIC,
  "pliegueSuprailiaco" NUMERIC,
  "pliegueMuslo" NUMERIC,
  "pliegueGemelo" NUMERIC,

  -- Resultados calculados (app/lib/calculosAntropometria.ts)
  "porcentajeGrasa" NUMERIC,               -- Durnin-Womersley + Siri
  "kgGrasa" NUMERIC,
  "porcentajeMasaMuscular" NUMERIC,        -- Lee et al. 2000
  "kgMasaMuscular" NUMERIC,
  "endomorfia" NUMERIC,                    -- Heath-Carter
  "mesomorfia" NUMERIC,
  "ectomorfia" NUMERIC,
  "somatocartaX" NUMERIC,
  "somatocartaY" NUMERIC,

  "notas" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE "EvaluacionFMS" (
  "id" SERIAL PRIMARY KEY,
  "pacienteId" INTEGER NOT NULL REFERENCES "Paciente"("id") ON DELETE CASCADE,
  "fecha" TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),

  -- Puntajes individuales (0 a 3)
  "sentadillaProfunda" INTEGER NOT NULL DEFAULT 0,
  "pasoValla" INTEGER NOT NULL DEFAULT 0,
  "estocadaLinea" INTEGER NOT NULL DEFAULT 0,
  "movilidadHombros" INTEGER NOT NULL DEFAULT 0,
  "elevacionPiernaRecta" INTEGER NOT NULL DEFAULT 0,
  "estabilidadTroncoFlexion" INTEGER NOT NULL DEFAULT 0,
  "estabilidadRotatoria" INTEGER NOT NULL DEFAULT 0,

  -- Resultado total (0 a 21)
  "puntajeTotal" INTEGER NOT NULL DEFAULT 0,

  "notas" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE "EvaluacionSaltoVertical" (
  "id" SERIAL PRIMARY KEY,
  "pacienteId" INTEGER NOT NULL REFERENCES "Paciente"("id") ON DELETE CASCADE,
  "fecha" TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),

  -- Alturas registradas (cm)
  "cmj" NUMERIC,
  "sj" NUMERIC,
  "cmjB" NUMERIC,
  "dropJump" NUMERIC,
  "depthJump" NUMERIC,
  "carreraCompleta" NUMERIC,

  "notas" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE "EvaluacionVelocidad" (
  "id" SERIAL PRIMARY KEY,
  "pacienteId" INTEGER NOT NULL REFERENCES "Paciente"("id") ON DELETE CASCADE,
  "fecha" TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),

  -- Tiempos (s)
  "tiempo10m" NUMERIC,
  "tiempo40m" NUMERIC,

  -- Velocidades calculadas (km/h)
  "velocidad10m" NUMERIC,
  "velocidad40m" NUMERIC,

  "notas" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE "EvaluacionFuerzaMaxima" (
  "id" SERIAL PRIMARY KEY,
  "pacienteId" INTEGER NOT NULL REFERENCES "Paciente"("id") ON DELETE CASCADE,
  "fecha" TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),

  -- Cargas (kg)
  "pesoMuerto" NUMERIC,
  "sentadilla" NUMERIC,
  "pressBanca" NUMERIC,
  "totalLevantado" NUMERIC,

  "notas" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE "EvaluacionGastoCalorico" (
  "id" SERIAL PRIMARY KEY,
  "pacienteId" INTEGER NOT NULL REFERENCES "Paciente"("id") ON DELETE CASCADE,
  "fecha" TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),

  -- Gastos calóricos (kcal)
  "gastoBasal" NUMERIC,
  "gastoEntrenamiento" NUMERIC,
  "gastoDescanso" NUMERIC,

  -- Macronutrientes (g)
  "proteinaEntrenamiento" NUMERIC,
  "proteinaDescanso" NUMERIC,
  "grasasEntrenamiento" NUMERIC,
  "grasasDescanso" NUMERIC,
  "carbohidratosEntrenamiento" NUMERIC,
  "carbohidratosDescanso" NUMERIC,

  "especificaciones" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==================== ENTRENAMIENTO ====================

-- Clasificaciones/grupos de ejercicios (a libre disposición del usuario)
CREATE TABLE "GrupoEjercicio" (
  "id" SERIAL PRIMARY KEY,
  "nombre" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Biblioteca de ejercicios (campos de texto libre)
CREATE TABLE "Ejercicio" (
  "id" SERIAL PRIMARY KEY,
  "grupoId" INTEGER REFERENCES "GrupoEjercicio"("id") ON DELETE SET NULL,
  "nombre" TEXT NOT NULL,
  "repTiempo" TEXT,
  "peso" TEXT,
  "movimiento" TEXT,
  "series" TEXT,
  "descanso" TEXT,
  "rm" TEXT,
  "comentario" TEXT,
  "video" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rutina asignada a un paciente (una rutina activa por paciente)
CREATE TABLE "Rutina" (
  "id" SERIAL PRIMARY KEY,
  "pacienteId" INTEGER NOT NULL REFERENCES "Paciente"("id") ON DELETE CASCADE,
  "nombre" TEXT,
  "fecha" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bloques de ejercicios dentro de cada día de la rutina (lunes..viernes)
CREATE TABLE "RutinaBloque" (
  "id" SERIAL PRIMARY KEY,
  "rutinaId" INTEGER NOT NULL REFERENCES "Rutina"("id") ON DELETE CASCADE,
  "dia" TEXT NOT NULL,
  "orden" INTEGER NOT NULL DEFAULT 0,
  "nombre" TEXT
);

-- Ejercicios dentro de cada bloque: copia editable precargada desde la biblioteca
CREATE TABLE "RutinaEjercicio" (
  "id" SERIAL PRIMARY KEY,
  "bloqueId" INTEGER NOT NULL REFERENCES "RutinaBloque"("id") ON DELETE CASCADE,
  "ejercicioOrigenId" INTEGER REFERENCES "Ejercicio"("id") ON DELETE SET NULL,
  "orden" INTEGER NOT NULL DEFAULT 0,
  "nombre" TEXT,
  "repTiempo" TEXT,
  "peso" TEXT,
  "movimiento" TEXT,
  "series" TEXT,
  "descanso" TEXT,
  "rm" TEXT,
  "comentario" TEXT,
  "video" TEXT
);

CREATE INDEX IF NOT EXISTS "Ejercicio_grupoId_idx" ON "Ejercicio" ("grupoId");
CREATE INDEX IF NOT EXISTS "Rutina_pacienteId_idx" ON "Rutina" ("pacienteId");
CREATE INDEX IF NOT EXISTS "RutinaBloque_rutinaId_idx" ON "RutinaBloque" ("rutinaId");
CREATE INDEX IF NOT EXISTS "RutinaEjercicio_bloqueId_idx" ON "RutinaEjercicio" ("bloqueId");

-- ==================== TAREA PROGRAMADA: CITAS VENCIDAS ====================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Marca como 'Realizado' las citas pendientes cuya hora de término ya pasó.
-- fecha + horaFin es hora local de Chile, por eso se compara contra la hora actual en Santiago
CREATE OR REPLACE FUNCTION actualizar_estado_citas_vencidas()
RETURNS void AS $$
BEGIN
  UPDATE "Cita"
  SET "estado" = 'Realizado'
  WHERE LOWER("estado") = 'pendiente'
    AND ("fecha" + "horaFin") < (NOW() AT TIME ZONE 'America/Santiago');
END;
$$ LANGUAGE plpgsql;

-- Se ejecuta al minuto 0 de cada hora
SELECT cron.schedule(
  'actualizar-citas-cada-hora',
  '0 * * * *',
  'SELECT actualizar_estado_citas_vencidas();'
);

-- =====================================================================
-- MIGRACIONES (solo para la base existente; no hacen falta al crear desde cero)
-- =====================================================================

-- 2026-10-05: estado de citas unificado a 'Pendiente' (antes la app y el default usaban 'pendiente')
ALTER TABLE "Cita" ALTER COLUMN "estado" SET DEFAULT 'Pendiente';
UPDATE "Cita" SET "estado" = 'Pendiente' WHERE "estado" = 'pendiente';
