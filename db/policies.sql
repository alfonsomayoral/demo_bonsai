-- Permitir que el usuario vea su propio registro
create policy "Users can view their own profile"
on public.users
for select
using (auth.uid()::uuid = id);

-- Permitir que el usuario actualice su propio registro
create policy "Users can update their own profile"
on public.users
for update
using (auth.uid()::uuid = id);

-- Permitir que el usuario cree su propio registro (opcional, normalmente lo hace el backend)
create policy "Users can insert their own profile"
on public.users
for insert
with check (auth.uid()::uuid = id);

-- Permitir que el usuario vea sus propias comidas
create policy "Users can view their own meals"
on public.meals
for select
using (auth.uid()::uuid = user_id);

-- Permitir que el usuario inserte comidas para sí mismo
create policy "Users can insert their own meals"
on public.meals
for insert
with check (auth.uid()::uuid = user_id);

-- Permitir que el usuario actualice/elimine solo sus comidas
create policy "Users can update their own meals"
on public.meals
for update
using (auth.uid()::uuid = user_id);

create policy "Users can delete their own meals"
on public.meals
for delete
using (auth.uid()::uuid = user_id);

-- Permitir acceso solo a los items de comidas de sus propias comidas
create policy "Users can view their own meal items"
on public.meal_items
for select
using (
  exists (
    select 1 from public.meals
    where meals.id = meal_items.meal_id
    and meals.user_id = auth.uid()::uuid
  )
);

create policy "Users can insert their own meal items"
on public.meal_items
for insert
with check (
  exists (
    select 1 from public.meals
    where meals.id = meal_items.meal_id
    and meals.user_id = auth.uid()::uuid
  )
);

create policy "Users can update their own meal items"
on public.meal_items
for update
using (
  exists (
    select 1 from public.meals
    where meals.id = meal_items.meal_id
    and meals.user_id = auth.uid()::uuid
  )
);

create policy "Users can delete their own meal items"
on public.meal_items
for delete
using (
  exists (
    select 1 from public.meals
    where meals.id = meal_items.meal_id
    and meals.user_id = auth.uid()::uuid
  )
);

-- Permitir que el usuario vea sus propios ejercicios y los globales (user_id IS NULL)
create policy "Users can view their own or global exercises"
on public.exercises
for select
using (
  user_id is null or user_id = auth.uid()::uuid
);

-- Permitir que el usuario inserte ejercicios para sí mismo
create policy "Users can insert their own exercises"
on public.exercises
for insert
with check (
  user_id = auth.uid()::uuid or user_id is null
);

-- Permitir que el usuario actualice/elimine solo sus ejercicios
create policy "Users can update their own exercises"
on public.exercises
for update
using (
  user_id = auth.uid()::uuid
);

create policy "Users can delete their own exercises"
on public.exercises
for delete
using (
  user_id = auth.uid()::uuid
);

create policy "Users can view their own workout sessions"
on public.workout_sessions
for select
using (user_id = auth.uid()::uuid);

create policy "Users can insert their own workout sessions"
on public.workout_sessions
for insert
with check (user_id = auth.uid()::uuid);

create policy "Users can update their own workout sessions"
on public.workout_sessions
for update
using (user_id = auth.uid()::uuid);

create policy "Users can delete their own workout sessions"
on public.workout_sessions
for delete
using (user_id = auth.uid()::uuid);

create policy "Users can view their own session exercises"
on public.session_exercises
for select
using (
  exists (
    select 1 from public.workout_sessions
    where workout_sessions.id = session_exercises.session_id
    and workout_sessions.user_id = auth.uid()::uuid
  )
);

create policy "Users can insert their own session exercises"
on public.session_exercises
for insert
with check (
  exists (
    select 1 from public.workout_sessions
    where workout_sessions.id = session_exercises.session_id
    and workout_sessions.user_id = auth.uid()::uuid
  )
);

create policy "Users can update their own session exercises"
on public.session_exercises
for update
using (
  exists (
    select 1 from public.workout_sessions
    where workout_sessions.id = session_exercises.session_id
    and workout_sessions.user_id = auth.uid()::uuid
  )
);

create policy "Users can delete their own session exercises"
on public.session_exercises
for delete
using (
  exists (
    select 1 from public.workout_sessions
    where workout_sessions.id = session_exercises.session_id
    and workout_sessions.user_id = auth.uid()::uuid
  )
);

create policy "Users can view their own exercise sets"
on public.exercise_sets
for select
using (
  exists (
    select 1 from public.session_exercises
    join public.workout_sessions on workout_sessions.id = session_exercises.session_id
    where session_exercises.id = exercise_sets.session_exercise_id
    and workout_sessions.user_id = auth.uid()::uuid
  )
);

create policy "Users can insert their own exercise sets"
on public.exercise_sets
for insert
with check (
  exists (
    select 1 from public.session_exercises
    join public.workout_sessions on workout_sessions.id = session_exercises.session_id
    where session_exercises.id = exercise_sets.session_exercise_id
    and workout_sessions.user_id = auth.uid()::uuid
  )
);

create policy "Users can update their own exercise sets"
on public.exercise_sets
for update
using (
  exists (
    select 1 from public.session_exercises
    join public.workout_sessions on workout_sessions.id = session_exercises.session_id
    where session_exercises.id = exercise_sets.session_exercise_id
    and workout_sessions.user_id = auth.uid()::uuid
  )
);

create policy "Users can delete their own exercise sets"
on public.exercise_sets
for delete
using (
  exists (
    select 1 from public.session_exercises
    join public.workout_sessions on workout_sessions.id = session_exercises.session_id
    where session_exercises.id = exercise_sets.session_exercise_id
    and workout_sessions.user_id = auth.uid()::uuid
  )
);