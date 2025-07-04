-- Tabla de usuarios
create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  unit_system text not null check (unit_system in ('metric', 'imperial')),
  goal_type text not null check (goal_type in ('cut', 'maintain', 'bulk')),
  gym_sessions_per_week integer not null,
  runs_regularly boolean not null,
  meals_per_day integer not null,
  kcal_target integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de comidas (meals)
create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  logged_at timestamp with time zone default timezone('utc'::text, now()) not null,
  source_method text not null check (source_method in ('photo', 'barcode', 'manual')),
  total_kcal integer not null,
  total_protein integer not null,
  total_carbs integer not null,
  total_fat integer not null
);

-- Tabla de items de comida (meal_items)
create table public.meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  name text not null,
  weight_g integer not null,
  kcal integer not null,
  protein integer not null,
  carbs integer not null,
  fat integer not null,
  confidence float default 1.0,
  image_path text
);

-- Tabla de ejercicios (exercises)
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  name text not null,
  muscle_group text not null
);

-- Tabla de sesiones de entrenamiento (workout_sessions)
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  start_time timestamp with time zone default timezone('utc'::text, now()) not null,
  duration_sec integer,
  total_volume integer not null
);

-- Tabla de ejercicios en sesión (session_exercises)
create table public.session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  order_idx integer not null
);

-- Tabla de sets de ejercicio (exercise_sets)
create table public.exercise_sets (
  id uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null references public.session_exercises(id) on delete cascade,
  weight integer not null,
  reps integer not null,
  rpe float,
  logged_at timestamp with time zone default timezone('utc'::text, now()) not null
);
