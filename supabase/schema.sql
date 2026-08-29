-- Transportes AP — esquema inicial (MVP)
-- Ejecutar en el SQL Editor de tu proyecto Supabase.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Perfiles (uno por usuario de auth.users, con su rol)
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'chofer', 'padre')),
  full_name text not null,
  phone text,
  -- Padres: documento + teléfono alterno. Choferes: documento + licencia.
  document_id text,
  phone_alt text,
  license_number text,
  license_category text,
  license_expiry date,
  created_at timestamptz not null default now()
);

-- Migra tablas creadas con una versión anterior de este script.
alter table profiles add column if not exists document_id text;
alter table profiles add column if not exists phone_alt text;
alter table profiles add column if not exists license_number text;
alter table profiles add column if not exists license_category text;
alter table profiles add column if not exists license_expiry date;

-- Un admin que también maneja una ruta (caso real: negocio familiar
-- pequeño donde la misma persona administra y conduce). No se modela como
-- un segundo rol — el rol sigue siendo 'admin', que ya tiene acceso
-- completo vía is_admin() en cada política de RLS — esta bandera solo
-- controla si aparece como opción de chofer al asignar una ruta y si
-- puede entrar a /chofer.
alter table profiles add column if not exists is_driver boolean not null default false;

-- ---------------------------------------------------------------------------
-- Alumnos
-- La dirección del alumno (lat/lng elegidos en el mapa al registrarlo) ES su
-- punto de parada — no existe una tabla de "paradas" separada.
-- ---------------------------------------------------------------------------
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references profiles (id) on delete cascade,
  full_name text not null,
  school_name text,
  address_label text,
  lat double precision,
  lng double precision,
  document_type text check (document_type in ('RC', 'TI', 'CC')),
  document_id text,
  birth_date date,
  grade text,
  blood_type text check (blood_type in ('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-')),
  medical_notes text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relation text,
  default_fee numeric(10, 2),
  photo_url text,
  created_at timestamptz not null default now()
);

alter table students add column if not exists photo_url text;

-- Migra tablas creadas con una versión anterior de este script.
alter table students add column if not exists address_label text;
alter table students add column if not exists lat double precision;
alter table students add column if not exists lng double precision;
alter table students add column if not exists document_type text;
alter table students add column if not exists document_id text;
alter table students add column if not exists birth_date date;
alter table students add column if not exists grade text;
alter table students add column if not exists blood_type text;
alter table students add column if not exists medical_notes text;
alter table students add column if not exists emergency_contact_name text;
alter table students add column if not exists emergency_contact_phone text;
alter table students add column if not exists emergency_contact_relation text;
alter table students add column if not exists default_fee numeric(10, 2);

-- Los check constraints de columnas nuevas no se agregan solos con "add column"
-- en instalaciones que ya tenían la tabla, así que se agregan aparte:
alter table students drop constraint if exists students_document_type_check;
alter table students add constraint students_document_type_check
  check (document_type in ('RC', 'TI', 'CC'));
alter table students drop constraint if exists students_blood_type_check;
alter table students add constraint students_blood_type_check
  check (blood_type in ('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'));

-- ---------------------------------------------------------------------------
-- Personas autorizadas a recoger al alumno (además del padre/madre registrado)
-- ---------------------------------------------------------------------------
create table if not exists authorized_pickup_persons (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students (id) on delete cascade,
  full_name text not null,
  phone text,
  document_id text,
  relation text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Rutas
-- ---------------------------------------------------------------------------
create table if not exists routes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  driver_id uuid references profiles (id) on delete set null,
  vehicle_plate text,
  vehicle_model text,
  vehicle_capacity int,
  soat_expiry date,
  tech_inspection_expiry date,
  created_at timestamptz not null default now()
);

-- Migra tablas creadas con una versión anterior de este script.
alter table routes add column if not exists vehicle_plate text;
alter table routes add column if not exists vehicle_model text;
alter table routes add column if not exists vehicle_capacity int;
alter table routes add column if not exists soat_expiry date;
alter table routes add column if not exists tech_inspection_expiry date;

-- Qué alumnos van en qué ruta y en qué orden de recogida.
create table if not exists student_route_assignment (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students (id) on delete cascade,
  route_id uuid not null references routes (id) on delete cascade,
  stop_order int not null default 1,
  unique (student_id, route_id)
);

-- Migra instalaciones anteriores que usaban una tabla route_stops separada:
-- ya no existe, la dirección del alumno reemplaza el concepto de "parada".
alter table student_route_assignment drop column if exists stop_id;
alter table student_route_assignment add column if not exists stop_order int not null default 1;
drop table if exists route_stops cascade;

-- Un alumno solo puede estar en una ruta a la vez: el código siempre borró la
-- asignación anterior antes de insertar la nueva, pero al ser dos pasos
-- separados sin revisar errores, un fallo a mitad de camino (o dos clics
-- seguidos) podía dejar al alumno sin ruta o con una fila duplicada — eso es
-- lo que se veía como "no me deja asignar la ruta y se reinicia". Ahora se
-- refuerza la invariante en la base de datos y la app hace un solo upsert
-- atómico en vez de borrar-y-luego-insertar.
alter table student_route_assignment add column if not exists created_at timestamptz not null default now();

-- Por si alguna instalación ya tiene más de una fila por alumno (residuo del
-- bug de arriba): nos quedamos con la más reciente antes de aplicar la
-- restricción única.
delete from student_route_assignment a
using student_route_assignment b
where a.student_id = b.student_id
  and (a.created_at, a.id) < (b.created_at, b.id);

alter table student_route_assignment drop constraint if exists student_route_assignment_student_id_key;
alter table student_route_assignment add constraint student_route_assignment_student_id_key unique (student_id);

-- ---------------------------------------------------------------------------
-- Viajes y eventos de recogida/entrega
-- ---------------------------------------------------------------------------
create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references routes (id) on delete cascade,
  trip_date date not null default current_date,
  status text not null default 'scheduled' check (status in ('scheduled', 'active', 'completed')),
  started_at timestamptz,
  ended_at timestamptz
);

-- Checklist de seguridad que el chofer confirma al iniciar cada viaje.
alter table trips add column if not exists checklist_tires boolean not null default false;
alter table trips add column if not exists checklist_brakes boolean not null default false;
alter table trips add column if not exists checklist_lights boolean not null default false;
alter table trips add column if not exists checklist_seatbelts boolean not null default false;
alter table trips add column if not exists checklist_notes text;

create table if not exists trip_events (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips (id) on delete cascade,
  student_id uuid not null references students (id) on delete cascade,
  event_type text not null check (event_type in ('recogido', 'entregado')),
  parent_confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Migra instalaciones anteriores: el evento ya no referencia una parada aparte.
alter table trip_events drop column if exists stop_id;
alter table trip_events add column if not exists parent_confirmed_at timestamptz;

-- ---------------------------------------------------------------------------
-- Pagos mensuales por alumno
-- ---------------------------------------------------------------------------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students (id) on delete cascade,
  period text not null, -- formato 'YYYY-MM'
  amount numeric(10, 2) not null,
  status text not null default 'pendiente' check (status in ('pendiente', 'pagado')),
  paid_at timestamptz,
  unique (student_id, period)
);

-- ---------------------------------------------------------------------------
-- Ausencias: el padre marca que su hijo no asiste una fecha puntual
-- ---------------------------------------------------------------------------
create table if not exists absences (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students (id) on delete cascade,
  absence_date date not null,
  note text,
  created_at timestamptz not null default now(),
  unique (student_id, absence_date)
);

-- ---------------------------------------------------------------------------
-- Incidencias reportadas por el chofer durante un viaje
-- ---------------------------------------------------------------------------
create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references routes (id) on delete cascade,
  trip_id uuid references trips (id) on delete set null,
  student_id uuid references students (id) on delete set null,
  reported_by uuid references profiles (id) on delete set null,
  description text not null,
  photo_url text,
  created_at timestamptz not null default now()
);

alter table incidents add column if not exists photo_url text;

-- ---------------------------------------------------------------------------
-- Alertas de emergencia/pánico enviadas por el chofer durante un viaje
-- ---------------------------------------------------------------------------
create table if not exists emergency_alerts (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references routes (id) on delete cascade,
  trip_id uuid references trips (id) on delete set null,
  driver_id uuid references profiles (id) on delete set null,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Suscripciones a notificaciones push (Web Push) por usuario
-- ---------------------------------------------------------------------------
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Preferencias de notificación por usuario (padres eligen qué push reciben)
-- ---------------------------------------------------------------------------
alter table profiles add column if not exists notify_trip_start boolean not null default true;
alter table profiles add column if not exists notify_pickup_dropoff boolean not null default true;
alter table profiles add column if not exists notify_announcements boolean not null default true;
alter table profiles add column if not exists notify_payment_reminders boolean not null default true;

-- ---------------------------------------------------------------------------
-- Recargos por mora: monto adicional que el admin aplica a un pago pendiente
-- ---------------------------------------------------------------------------
alter table payments add column if not exists late_fee numeric(10, 2) not null default 0;

-- ---------------------------------------------------------------------------
-- Mantenimiento de vehículos por ruta
-- ---------------------------------------------------------------------------
create table if not exists maintenance_records (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references routes (id) on delete cascade,
  type text not null,
  description text,
  odometer_km int,
  cost numeric(10, 2),
  performed_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Solicitudes de inscripción desde el formulario público (sin autenticación)
-- ---------------------------------------------------------------------------
create table if not exists enrollment_requests (
  id uuid primary key default gen_random_uuid(),
  parent_name text not null,
  parent_phone text not null,
  parent_email text,
  student_name text not null,
  school_name text,
  grade text,
  address_label text,
  notes text,
  status text not null default 'pendiente' check (status in ('pendiente', 'contactado', 'descartado')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Avisos generales del admin (a todos los padres o a los de una ruta)
-- ---------------------------------------------------------------------------
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  route_id uuid references routes (id) on delete cascade,
  title text not null,
  body text not null,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Mensajería simple entre un padre y administración
-- ---------------------------------------------------------------------------
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references profiles (id) on delete cascade,
  sender_id uuid not null references profiles (id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Bitácora de auditoría: quién hizo qué cambio administrativo y cuándo
-- ---------------------------------------------------------------------------
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles (id) on delete set null,
  actor_name text,
  action text not null,
  entity_type text not null,
  entity_label text,
  details text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Funciones auxiliares (security definer) para checks cruzados entre tablas.
--
-- Nota importante: cada una de estas consulta una tabla que también tiene RLS
-- habilitado. Si en vez de esto se pusiera la misma consulta directamente
-- dentro de una política (como "exists (select 1 from routes where ...)"
-- dentro de la política de "students"), Postgres tiene que volver a aplicar
-- las políticas de "routes" para resolverla — y si la política de "routes"
-- a su vez consulta "students", se forma un ciclo y Postgres responde con
-- "infinite recursion detected in policy for relation ...", fallando la
-- consulta completa (sin insertar nada, pero sí al hacer SELECT).
-- Al mover el cruce a una función security definer, esa función corre con
-- los privilegios de quien la creó (el dueño de las tablas), que se salta
-- RLS por defecto, así que no se re-dispara ninguna política y no hay ciclo.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$;

create or replace function public.is_route_driver(p_route_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from routes where id = p_route_id and driver_id = auth.uid())
$$;

create or replace function public.is_student_parent(p_student_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from students where id = p_student_id and parent_id = auth.uid())
$$;

create or replace function public.route_has_parent_child(p_route_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from student_route_assignment sra
    join students s on s.id = sra.student_id
    where sra.route_id = p_route_id and s.parent_id = auth.uid()
  )
$$;

create or replace function public.student_has_driver_route(p_student_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from student_route_assignment sra
    join routes r on r.id = sra.route_id
    where sra.student_id = p_student_id and r.driver_id = auth.uid()
  )
$$;

create or replace function public.is_trip_route_driver(p_trip_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from trips t
    join routes r on r.id = t.route_id
    where t.id = p_trip_id and r.driver_id = auth.uid()
  )
$$;

-- El padre confirma que su hijo llegó a casa. Es una función (en vez de una
-- política RLS de update) para que el padre solo pueda tocar esta columna
-- puntual de un evento "entregado" de su propio hijo, y nada más.
create or replace function public.confirm_dropoff(p_event_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update trip_events
  set parent_confirmed_at = now()
  where id = p_event_id
    and event_type = 'entregado'
    and is_student_parent(student_id)
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table students enable row level security;
alter table routes enable row level security;
alter table student_route_assignment enable row level security;
alter table trips enable row level security;
alter table trip_events enable row level security;
alter table payments enable row level security;
alter table authorized_pickup_persons enable row level security;
alter table push_subscriptions enable row level security;
alter table absences enable row level security;
alter table incidents enable row level security;
alter table maintenance_records enable row level security;
alter table enrollment_requests enable row level security;
alter table announcements enable row level security;
alter table messages enable row level security;
alter table audit_log enable row level security;
alter table emergency_alerts enable row level security;

-- profiles: cada quien ve/edita su propio perfil; admin ve todos
drop policy if exists "profiles_select_own_or_admin" on profiles;
create policy "profiles_select_own_or_admin" on profiles
  for select using (id = auth.uid() or is_admin());
drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());
drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles
  for insert with check (id = auth.uid());
drop policy if exists "profiles_admin_write" on profiles;
create policy "profiles_admin_write" on profiles
  for update using (is_admin()) with check (is_admin());

-- students: padre ve solo a sus hijos; chofer ve alumnos de sus rutas; admin ve todo
drop policy if exists "students_select" on students;
create policy "students_select" on students
  for select using (
    parent_id = auth.uid()
    or is_admin()
    or student_has_driver_route(id)
  );
drop policy if exists "students_admin_write" on students;
create policy "students_admin_write" on students
  for all using (is_admin()) with check (is_admin());

-- routes: chofer ve su propia ruta; padre ve la ruta de sus hijos; admin ve todo
drop policy if exists "routes_select" on routes;
create policy "routes_select" on routes
  for select using (
    driver_id = auth.uid()
    or is_admin()
    or route_has_parent_child(id)
  );
drop policy if exists "routes_admin_write" on routes;
create policy "routes_admin_write" on routes
  for all using (is_admin()) with check (is_admin());

-- student_route_assignment: visible a admin, al chofer de la ruta y al padre del alumno
drop policy if exists "assignment_select" on student_route_assignment;
create policy "assignment_select" on student_route_assignment
  for select using (
    is_admin()
    or is_route_driver(route_id)
    or is_student_parent(student_id)
  );
drop policy if exists "assignment_admin_write" on student_route_assignment;
create policy "assignment_admin_write" on student_route_assignment
  for all using (is_admin()) with check (is_admin());

-- trips: visible a admin, al chofer de la ruta y a los padres de alumnos en la ruta
drop policy if exists "trips_select" on trips;
create policy "trips_select" on trips
  for select using (
    is_admin()
    or is_route_driver(route_id)
    or route_has_parent_child(route_id)
  );
drop policy if exists "trips_driver_write" on trips;
create policy "trips_driver_write" on trips
  for all using (
    is_admin() or is_route_driver(route_id)
  ) with check (
    is_admin() or is_route_driver(route_id)
  );

-- trip_events: mismas reglas que trips, vía el viaje
drop policy if exists "trip_events_select" on trip_events;
create policy "trip_events_select" on trip_events
  for select using (
    is_admin()
    or is_trip_route_driver(trip_id)
    or is_student_parent(student_id)
  );
drop policy if exists "trip_events_driver_write" on trip_events;
create policy "trip_events_driver_write" on trip_events
  for insert with check (
    is_admin() or is_trip_route_driver(trip_id)
  );

-- payments: padre ve pagos de sus hijos; admin ve y edita todo
drop policy if exists "payments_select" on payments;
create policy "payments_select" on payments
  for select using (
    is_admin() or is_student_parent(student_id)
  );
drop policy if exists "payments_admin_write" on payments;
create policy "payments_admin_write" on payments
  for all using (is_admin()) with check (is_admin());

-- authorized_pickup_persons: visible a admin, al padre del alumno y al chofer de su ruta
drop policy if exists "pickup_select" on authorized_pickup_persons;
create policy "pickup_select" on authorized_pickup_persons
  for select using (
    is_admin()
    or is_student_parent(student_id)
    or student_has_driver_route(student_id)
  );
drop policy if exists "pickup_admin_write" on authorized_pickup_persons;
create policy "pickup_admin_write" on authorized_pickup_persons
  for all using (is_admin()) with check (is_admin());

-- push_subscriptions: cada quien gestiona solo sus propias suscripciones.
-- El envío de notificaciones lo hace el servidor con el service role (se
-- salta RLS), así que no hace falta una política para que otros usuarios
-- lean estas filas.
drop policy if exists "push_subscriptions_own" on push_subscriptions;
create policy "push_subscriptions_own" on push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- absences: el padre gestiona las de sus hijos; el chofer de la ruta y admin las ven
drop policy if exists "absences_select" on absences;
create policy "absences_select" on absences
  for select using (
    is_admin()
    or is_student_parent(student_id)
    or student_has_driver_route(student_id)
  );
drop policy if exists "absences_write_own" on absences;
create policy "absences_write_own" on absences
  for all using (
    is_admin() or is_student_parent(student_id)
  ) with check (
    is_admin() or is_student_parent(student_id)
  );

-- incidents: el chofer de la ruta las crea; admin ve todas; el padre ve las de su hijo
drop policy if exists "incidents_select" on incidents;
create policy "incidents_select" on incidents
  for select using (
    is_admin()
    or is_route_driver(route_id)
    or (student_id is not null and is_student_parent(student_id))
  );
drop policy if exists "incidents_write" on incidents;
create policy "incidents_write" on incidents
  for insert with check (
    is_admin() or is_route_driver(route_id)
  );
drop policy if exists "incidents_admin_delete" on incidents;
create policy "incidents_admin_delete" on incidents
  for delete using (is_admin());

-- maintenance_records: solo el admin las gestiona (herramienta interna de operación)
drop policy if exists "maintenance_admin_all" on maintenance_records;
create policy "maintenance_admin_all" on maintenance_records
  for all using (is_admin()) with check (is_admin());

-- enrollment_requests: cualquier visitante (sin sesión) puede crear una solicitud
-- desde el formulario público; solo el admin las lee/gestiona.
drop policy if exists "enrollment_requests_public_insert" on enrollment_requests;
create policy "enrollment_requests_public_insert" on enrollment_requests
  for insert with check (true);
drop policy if exists "enrollment_requests_admin_select" on enrollment_requests;
create policy "enrollment_requests_admin_select" on enrollment_requests
  for select using (is_admin());
drop policy if exists "enrollment_requests_admin_write" on enrollment_requests;
create policy "enrollment_requests_admin_write" on enrollment_requests
  for update using (is_admin()) with check (is_admin());
drop policy if exists "enrollment_requests_admin_delete" on enrollment_requests;
create policy "enrollment_requests_admin_delete" on enrollment_requests
  for delete using (is_admin());

-- announcements: admin ve/gestiona todos; un aviso con route_id nulo es para
-- todos, uno con route_id es visible solo a quien tenga hijos en esa ruta.
drop policy if exists "announcements_select" on announcements;
create policy "announcements_select" on announcements
  for select using (
    is_admin()
    or route_id is null
    or route_has_parent_child(route_id)
  );
drop policy if exists "announcements_admin_write" on announcements;
create policy "announcements_admin_write" on announcements
  for all using (is_admin()) with check (is_admin());

-- messages: un hilo por padre; el padre y el admin pueden leer/escribir en él,
-- pero solo como remitente de sí mismos (nadie puede enviar en nombre de otro).
drop policy if exists "messages_select" on messages;
create policy "messages_select" on messages
  for select using (is_admin() or parent_id = auth.uid());
drop policy if exists "messages_insert" on messages;
create policy "messages_insert" on messages
  for insert with check (
    sender_id = auth.uid() and (is_admin() or parent_id = auth.uid())
  );
drop policy if exists "messages_update_read" on messages;
create policy "messages_update_read" on messages
  for update using (is_admin() or parent_id = auth.uid())
  with check (is_admin() or parent_id = auth.uid());

-- audit_log: solo el admin puede leer o escribir (las acciones que se
-- auditan aquí ya están detrás de requireRole("admin") de todas formas).
drop policy if exists "audit_log_admin_select" on audit_log;
create policy "audit_log_admin_select" on audit_log
  for select using (is_admin());
drop policy if exists "audit_log_admin_insert" on audit_log;
create policy "audit_log_admin_insert" on audit_log
  for insert with check (is_admin());

-- emergency_alerts: el chofer de la ruta las crea; solo el admin las lee.
drop policy if exists "emergency_alerts_select" on emergency_alerts;
create policy "emergency_alerts_select" on emergency_alerts
  for select using (is_admin() or is_route_driver(route_id));
drop policy if exists "emergency_alerts_insert" on emergency_alerts;
create policy "emergency_alerts_insert" on emergency_alerts
  for insert with check (is_admin() or is_route_driver(route_id));

-- ---------------------------------------------------------------------------
-- Storage: fotos de evidencia adjuntas a incidencias.
-- Bucket público de lectura: el objeto se puede pedir por su URL directa
-- (bucket "public" hace que ese endpoint no pase por RLS) sin necesitar
-- URLs firmadas, y el path lleva un prefijo random (crypto.randomUUID())
-- que hace la URL impráctica de adivinar. Solo choferes y admin suben.
--
-- A propósito NO existe una política de "select" en storage.objects para
-- este bucket: aunque el bucket es público para descargas directas por
-- URL, una política de select habilitaría además el LISTADO del bucket
-- (storage.objects.list usa la misma política) — eso permitiría a
-- cualquier persona sin sesión enumerar y descargar todas las fotos
-- subidas, que es justo el escenario de privacidad que se quiere evitar
-- para menores de edad. Sin política de select, list queda bloqueado por
-- defecto (RLS deniega si no hay política que dé permiso) y la descarga
-- directa por URL conocida sigue funcionando igual.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('incident-photos', 'incident-photos', true)
on conflict (id) do nothing;

drop policy if exists "incident_photos_read" on storage.objects;

drop policy if exists "incident_photos_write" on storage.objects;
create policy "incident_photos_write" on storage.objects
  for insert with check (
    bucket_id = 'incident-photos'
    and (
      public.is_admin()
      or exists (select 1 from profiles where id = auth.uid() and role = 'chofer')
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: fotos de alumnos, para que el chofer los reconozca en la parada.
-- Bucket público de lectura (mismo razonamiento que incident-photos: sin
-- política de select para que no se puedan listar/enumerar, la descarga
-- por URL directa conocida sigue funcionando). Solo el admin las sube (se
-- toman al inscribir/editar al alumno).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('student-photos', 'student-photos', true)
on conflict (id) do nothing;

drop policy if exists "student_photos_read" on storage.objects;

drop policy if exists "student_photos_write" on storage.objects;
create policy "student_photos_write" on storage.objects
  for insert with check (bucket_id = 'student-photos' and public.is_admin());

drop policy if exists "student_photos_delete" on storage.objects;
create policy "student_photos_delete" on storage.objects
  for delete using (bucket_id = 'student-photos' and public.is_admin());
