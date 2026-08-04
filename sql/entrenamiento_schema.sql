CREATE TABLE "Paciente" (
  "id" SERIAL PRIMARY KEY,
  "nombre" TEXT NOT NULL,
  "apellido" TEXT NOT NULL,
  "rut" TEXT UNIQUE NOT NULL,
  "email" TEXT,
  "telefono" TEXT,
  "fechaNacimiento" DATE,
  "genero" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE "Cita" (
  "id" SERIAL PRIMARY KEY,
  "pacienteId" INTEGER NOT NULL REFERENCES "Paciente"("id") ON DELETE CASCADE,
  "fecha" DATE NOT NULL,
  "hora" TIME NOT NULL,
  "horaFin" TIME NOT NULL,
  "modalidad" TEXT DEFAULT 'presencial',
  "motivo" TEXT NOT NULL,
  "estado" TEXT DEFAULT 'Pendiente',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE "Anamnesis" (
  "id" SERIAL PRIMARY KEY,
  "pacienteId" INTEGER NOT NULL REFERENCES "Paciente"("id") ON DELETE CASCADE,
  "fecha" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Antecedentes Médicos y Hábitos
  "motivoConsulta" TEXT,
  "antecedentesMedicos" TEXT,
  "medicamentos" TEXT,
  "lesionesPrevias" TEXT,
  "actividadFisica" TEXT,
  "frecuenciaEntrenamiento" TEXT,
  "habitosAlimentarios" TEXT,
  "horasSueno" NUMERIC(4,1),
  "nivelEstres" INTEGER,
  "observaciones" TEXT,

  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE "EvaluacionAntropometria" (
  "id" SERIAL PRIMARY KEY,
  "pacienteId" INTEGER NOT NULL REFERENCES "Paciente"("id") ON DELETE CASCADE,
  "fecha" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Datos Básico
  "peso" NUMERIC(5,2),
  "talla" NUMERIC(5,2),
  "tallaSentado" NUMERIC(5,2),

  -- Pliegues Cutáneos (mm)
  "triceps" NUMERIC(4,1),
  "subescapular" NUMERIC(4,1),
  "biceps" NUMERIC(4,1),
  "crestailiaca" NUMERIC(4,1),
  "supraespinal" NUMERIC(4,1),
  "abdominal" NUMERIC(4,1),
  "musloFrontal" NUMERIC(4,1),
  "pantorrilla" NUMERIC(4,1),

  -- Perímetros (cm)
  "perimetroBrazoRelajado" NUMERIC(4,1),
  "perimetroBrazoContraido" NUMERIC(4,1),
  "perimetroCintura" NUMERIC(4,1),
  "perimetroCadera" NUMERIC(4,1),
  "perimetroMuslo" NUMERIC(4,1),
  "perimetroPantorrilla" NUMERIC(4,1),

  -- Diámetros (cm)
  "diametroBiestiloideo" NUMERIC(4,1),
  "diametroBiepicondilarHumero" NUMERIC(4,1),
  "diametroBiepicondilarFemur" NUMERIC(4,1),

  -- Resultados Calculados
  "sumatoria6Pliegues" NUMERIC(5,2),
  "porcentajeGrasaYuhasz" NUMERIC(4,2),
  "porcentajeGrasaLee" NUMERIC(4,2),
  "endomorfia" NUMERIC(4,2),
  "mesomorfia" NUMERIC(4,2),
  "ectomorfia" NUMERIC(4,2),

  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);


CREATE TABLE "EvaluacionFMS" (
  "id" SERIAL PRIMARY KEY,
  "pacienteId" INTEGER NOT NULL REFERENCES "Paciente"("id") ON DELETE CASCADE,
  "fecha" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Puntajes individuales (0 a 3)
  "sentadillaProfunda" INTEGER NOT NULL DEFAULT 0,
  "pasoValla" INTEGER NOT NULL DEFAULT 0,
  "estocadaLinea" INTEGER NOT NULL DEFAULT 0,
  "movilidadHombros" INTEGER NOT NULL DEFAULT 0,
  "elevacionPiernaRecta" INTEGER NOT NULL DEFAULT 0,
  "estabilidadTroncoFlexion" INTEGER NOT NULL DEFAULT 0,
  "estabilidadRotatoria" INTEGER NOT NULL DEFAULT 0,

  -- Resultado Total (0 a 21)
  "puntajeTotal" INTEGER NOT NULL DEFAULT 0,

  "notas" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE "EvaluacionSaltoVertical" (
  "id" SERIAL PRIMARY KEY,
  "pacienteId" INTEGER NOT NULL REFERENCES "Paciente"("id") ON DELETE CASCADE,
  "fecha" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Alturas registradas en cm
  "cmj" NUMERIC(5,2),
  "sj" NUMERIC(5,2),
  "cmjB" NUMERIC(5,2),
  "dropJump" NUMERIC(5,2),
  "depthJump" NUMERIC(5,2),
  "carreraCompleta" NUMERIC(5,2),

  "notas" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE "EvaluacionVelocidad" (
  "id" SERIAL PRIMARY KEY,
  "pacienteId" INTEGER NOT NULL REFERENCES "Paciente"("id") ON DELETE CASCADE,
  "fecha" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Tiempos en segundos (s)
  "tiempo10m" NUMERIC(5,2),
  "tiempo40m" NUMERIC(5,2),

  -- Velocidades calculadas (Km/h)
  "velocidad10m" NUMERIC(5,2),
  "velocidad40m" NUMERIC(5,2),

  "notas" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE "EvaluacionFuerzaMaxima" (
  "id" SERIAL PRIMARY KEY,
  "pacienteId" INTEGER NOT NULL REFERENCES "Paciente"("id") ON DELETE CASCADE,
  "fecha" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Cargas en Kg
  "pesoMuerto" NUMERIC(6,2),
  "sentadilla" NUMERIC(6,2),
  "pressBanca" NUMERIC(6,2),

  -- Sumatoria Total
  "totalLevantado" NUMERIC(6,2),

  "notas" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE "EvaluacionGastoCalorico" (
  "id" SERIAL PRIMARY KEY,
  "pacienteId" INTEGER NOT NULL REFERENCES "Paciente"("id") ON DELETE CASCADE,
  "fecha" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Gastos Calóricos (kcal)
  "gastoBasal" NUMERIC(6,2),
  "gastoEntrenamiento" NUMERIC(6,2),
  "gastoDescanso" NUMERIC(6,2),

  -- Macronutrientes (gramos)
  "proteinaEntrenamiento" NUMERIC(6,2),
  "proteinaDescanso" NUMERIC(6,2),
  "grasasEntrenamiento" NUMERIC(6,2),
  "grasasDescanso" NUMERIC(6,2),
  "carbohidratosEntrenamiento" NUMERIC(6,2),
  "carbohidratosDescanso" NUMERIC(6,2),

  -- Texto libre amplio
  "especificaciones" TEXT,

  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1. Crear la función que busca y actualiza las citas pasadas
CREATE OR REPLACE FUNCTION actualizar_estado_citas_vencidas()
RETURNS void AS $$
BEGIN
  UPDATE "Cita"
  SET "estado" = 'Realizado'
  WHERE "estado" = 'Pendiente'
    AND ("fecha" + "horaFin") < (NOW() AT TIME ZONE 'UTC');
END;
$$ LANGUAGE plpgsql;

-- 2. Programar la tarea para que se ejecute al minuto 0 de cada hora
SELECT cron.schedule(
  'actualizar-citas-cada-hora', -- Nombre de la tarea
  '0 * * * *',                   -- Cron expression (Cada hora)
  'SELECT actualizar_estado_citas_vencidas();'
);

-- 1. Clasificaciones/grupos de ejercicios (a libre disposición del usuario)
create table "GrupoEjercicio" (
  id serial primary key,
  nombre text not null,
  "createdAt" timestamptz not null default now()
);

-- 2. Biblioteca de ejercicios (campos de texto libre)
create table "Ejercicio" (
  id serial primary key,
  "grupoId" integer references "GrupoEjercicio"(id) on delete set null,
  nombre text not null,
  "repTiempo" text,
  peso text,
  movimiento text,
  series text,
  descanso text,
  rm text,
  comentario text,
  video text,
  "createdAt" timestamptz not null default now()
);

-- 3. Rutina asignada a un paciente (una rutina activa por paciente)
create table "Rutina" (
  id serial primary key,
  "pacienteId" integer not null references "Paciente"(id) on delete cascade,
  nombre text,
  fecha timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- 4. Bloques de ejercicios dentro de cada día de la rutina (Lunes..Viernes)
create table "RutinaBloque" (
  id serial primary key,
  "rutinaId" integer not null references "Rutina"(id) on delete cascade,
  dia text not null,
  orden integer not null default 0,
  nombre text
);

-- 5. Ejercicios dentro de cada bloque: copia editable precargada desde la biblioteca
create table "RutinaEjercicio" (
  id serial primary key,
  "bloqueId" integer not null references "RutinaBloque"(id) on delete cascade,
  "ejercicioOrigenId" integer references "Ejercicio"(id) on delete set null,
  orden integer not null default 0,
  nombre text,
  "repTiempo" text,
  peso text,
  movimiento text,
  series text,
  descanso text,
  rm text,
  comentario text,
  video text
);

create index on "Ejercicio" ("grupoId");
create index on "Rutina" ("pacienteId");
create index on "RutinaBloque" ("rutinaId");
create index on "RutinaEjercicio" ("bloqueId");
