# Transportes AP

Plataforma web (PWA) para la gestión de transporte escolar de Transportes AP: rutas en vivo, confirmación de recogida/entrega de alumnos, cobros, seguridad y comunicación con las familias. Tres vistas por rol: `/admin`, `/chofer`, `/padre`.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind CSS)
- Supabase (Postgres + Auth + Row Level Security)
- Leaflet + OpenStreetMap para las imágenes del mapa (sin cuenta ni API key); Google Maps Platform (Geocoding, Places, Routes) para direcciones y ETA por carretera

## Puesta en marcha

### 1. Crear el proyecto en Supabase

1. Crea una cuenta/proyecto en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor** y pega el contenido de [`supabase/schema.sql`](supabase/schema.sql), luego ejecútalo. Esto crea las tablas, las funciones auxiliares y las políticas de RLS. El script es seguro de volver a correr (usa `if not exists` / `drop policy if exists`), así que si actualizas este archivo más adelante solo tienes que volver a pegarlo y correrlo.
3. Ve a **Project Settings → API** y copia el **Project URL**, la **Publishable key** (`sb_publishable_...`) y una **Secret key** (`sb_secret_...`, créala si no existe).

### 2. Variables de entorno

Copia `.env.local.example` a `.env.local` y completa:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...       # la "Publishable key"
SUPABASE_SERVICE_ROLE_KEY=...           # la "Secret key" — nunca con prefijo NEXT_PUBLIC_

# Notificaciones push (Web Push). Genera un par único por proyecto con:
#   npx web-push generate-vapid-keys
VAPID_SUBJECT=mailto:tu-correo@ejemplo.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...

# Opcional pero recomendado en producción: protege los endpoints /api/cron/*
# para que solo Vercel Cron (u otro programador) pueda llamarlos.
CRON_SECRET=...

# Direcciones (autocompletado + geocodificación) y ETA por carretera del
# mapa en vivo, vía Google Maps Platform — server-only, nunca se envía al
# navegador. Requiere activar 3 APIs en Google Cloud: Geocoding API,
# Places API (New) y Routes API. Ver .env.local.example para los pasos
# exactos.
GOOGLE_MAPS_API_KEY=...
```

`SUPABASE_SERVICE_ROLE_KEY` es server-only: la usa el panel de admin para crear las cuentas de chofer y padre. Nunca se envía al navegador.

### 3. Crear el primer usuario administrador

Los usuarios se crean primero en Supabase Auth y luego necesitan una fila en `profiles` con su rol:

1. En el dashboard de Supabase, ve a **Authentication → Users → Add user** y crea un usuario con correo/contraseña (marca **Auto Confirm User**).
2. En **Table Editor → profiles**, inserta una fila con ese mismo `id` (cópialo del usuario creado), `role = 'admin'` y tu nombre.

Los usuarios chofer y padre ya no necesitan crearse manualmente en Supabase — se crean desde `/admin/choferes` y `/admin/padres` dentro de la app.

### 4. Ejecutar en local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) e inicia sesión con el usuario admin que creaste.

Para probar la instalación como PWA desde tu celular necesitas que el sitio esté servido por HTTPS (o desplegado) — `localhost` en el navegador de tu computador funciona para probar sin HTTPS, pero un celular en tu red local necesitará el sitio ya desplegado (Vercel u otro) para ofrecer "Instalar app".

### 5. Desplegar a producción (Vercel)

1. Sube este repositorio a GitHub.
2. En [vercel.com](https://vercel.com), **Add New → Project** e importa el repositorio.
3. En **Environment Variables**, agrega las mismas variables de `.env.local` (paso 2 arriba) — cópialas tal cual, incluyendo `CRON_SECRET`.
4. Deploy. Vercel detecta Next.js automáticamente, no requiere configuración adicional.
5. En el SQL Editor de Supabase, vuelve a correr [`supabase/schema.sql`](supabase/schema.sql) completo una vez más para asegurarte de que el proyecto de producción tiene el esquema más reciente (es seguro re-ejecutarlo, ver paso 1).

**Tareas automáticas (Vercel Cron):** [`vercel.json`](vercel.json) ya programa dos de los tres endpoints de cron — se activan solos apenas despliegues, sin nada más que configurar:

- `/api/cron/generate-payments` — el 1° de cada mes, crea el pago "pendiente" de cada alumno que aún no tenga uno ese periodo.
- `/api/cron/expiry-alerts` — todos los días, revisa SOAT/tecnomecánica/licencias por vencer y notifica a los admins.

`/api/cron/payment-reminders` se dejó **fuera** de `vercel.json` a propósito: el plan gratuito (Hobby) de Vercel permite un máximo de 2 cron jobs por proyecto. Sigue disponible como botón manual ("Recordar pagos pendientes" en `/admin/pagos`) — si tienes plan Pro o prefieres automatizarlo también, agrégalo a `vercel.json`:
```json
{ "path": "/api/cron/payment-reminders", "schedule": "0 14 * * 1" }
```

## Estado actual

Ya implementado:

- Autenticación con Supabase (login/logout) y redirección automática por rol vía `src/proxy.ts`.
- Esquema de base de datos completo con Row Level Security ([`supabase/schema.sql`](supabase/schema.sql)).
- Panel de administración completo:
  - **Choferes**: crear/editar (correo solo al crear; documento, teléfono(s), licencia de conducción con vencimiento) y eliminar. Enlace directo a WhatsApp junto al teléfono.
  - **Padres**: crear/editar (documento, teléfono(s)) y eliminar. Enlace directo a WhatsApp. Buscador por nombre.
  - **Rutas**: crear/editar (nombre, chofer asignado, placa/modelo/capacidad del vehículo, vencimiento de SOAT y tecnomecánica).
  - **Alumnos**: crear/editar con datos básicos, documento, fecha de nacimiento, grado, tarifa mensual (se pre-llena sola en Pagos), tipo de sangre, alergias/condiciones médicas, contacto de emergencia, personas autorizadas a recogerlo, y su **dirección de recogida marcada en un mapa** (Leaflet + OpenStreetMap, centrado en Popayán, con autocompletado de dirección) — esa dirección es la parada del alumno. Se asigna a una ruta con un orden de recogida. Buscador por nombre. Exportable a CSV/PDF.
  - Cada ruta muestra en `/admin/rutas/[id]` un mapa de solo lectura con las direcciones (numeradas por orden) de sus alumnos asignados.
  - **Pagos**: ver y actualizar el estado de pago (monto + pendiente/pagado) de cada alumno, navegando mes a mes, con botón para enviar recordatorios push de pago pendiente. Exportable a CSV/PDF.
  - **Incidencias** (`/admin/incidencias`): ve todo lo reportado por los choferes, con foto de evidencia si el chofer adjuntó una. Exportable a CSV/PDF.
  - **Reportes** (`/admin/reportes`): total recaudado/pendiente del mes desglosado por ruta, y una gráfica de tendencia de los últimos 6 meses. Exportable a CSV/PDF.
  - **Vencimientos**: en el resumen (`/admin`), una barra de progreso por cada SOAT, tecnomecánica y licencia de conducción registrada, coloreada según qué tan cerca está de vencer, con botón para forzar una revisión y notificación push inmediata.
- Vista de chofer: iniciar/finalizar viaje del día (ve todos los viajes del día, no solo el actual — soporta turnos mañana/tarde), marcar alumnos como "recogido"/"entregado" en el orden de las paradas de su ruta (excluyendo automáticamente a los que el padre marcó ausentes ese día), ver tipo de sangre/condiciones médicas/contacto de emergencia de cada alumno (con enlace a WhatsApp del padre/madre y del contacto de emergencia), reportar incidencias con foto opcional, y **transmitir su ubicación en vivo** mientras el viaje está activo (avisando automáticamente al padre por push cuando el bus está cerca de su parada).
- Vista de padre: ver la ruta y dirección de recogida de sus hijos, el estado de pago del mes actual, un **mapa en vivo con la ubicación del bus** (con distancia y tiempo estimado a la parada) mientras el viaje de su hijo está activo, **historial reciente** de recogidas/entregas con opción de **confirmar que su hijo llegó a casa**, y marcar **ausencias** puntuales.
- El panel de admin muestra un mapa en vivo de todos los viajes activos en este momento.
- **Notificaciones push** (Web Push, sin costo): botón "Activar notificaciones" en `/padre`; se notifica automáticamente al iniciar un viaje, al marcar recogido/entregado, cuando el bus está cerca de la parada, al reportar una incidencia (a los admins), cuando un documento está por vencer (a los admins), y bajo pedido para recordatorios de pago.
- **Recuperar/cambiar contraseña**: "¿Olvidaste tu contraseña?" en `/login` envía un correo (usa el servicio de correo integrado de Supabase); cualquier usuario logueado puede cambiar su contraseña desde "Cambiar contraseña" en la barra superior.
- **PWA instalable**: manifiesto (`/manifest.webmanifest`), íconos generados (`scripts/generate-icons.mjs` → `public/icons/`) y service worker registrado automáticamente en toda la app — en el celular aparece la opción "Agregar a pantalla de inicio" / "Instalar app", y con eso las notificaciones push funcionan igual que una app nativa.

La ubicación se transmite por Supabase Realtime (canal `trip-<id>`, broadcast efímero) directamente del navegador del chofer a los navegadores conectados — no se guarda historial de ubicaciones en la base de datos. La distancia/tiempo estimado se calculan en el navegador del padre a partir de esas mismas ubicaciones (línea recta, sin motor de rutas real). Las fotos de incidencias y de alumnos se guardan en buckets de Supabase Storage (`incident-photos`, `student-photos`, públicos de lectura, creados por `schema.sql`).

### Agregado después del MVP inicial

Interfaz rediseñada con shadcn/ui (paleta índigo, barra lateral en escritorio, iconos vectoriales consistentes). Además:

- **Cobros**: recibos en PDF descargables por pago, historial completo de pagos por alumno, recargos por mora, descuento automático por hermanos, y generación automática del pago pendiente de cada alumno al empezar el mes (`/api/cron/generate-payments`).
- **Inscripción**: formulario público en `/inscripcion` (con protección anti-bots) para que familias nuevas soliciten el servicio sin necesitar cuenta; el admin las revisa en `/admin/inscripciones`.
- **Seguridad**: checklist de seguridad del vehículo antes de cada viaje, botón de pánico/emergencia del chofer (avisa a administración con ubicación), foto de cada alumno visible para el chofer.
- **Comunicación**: avisos generales del admin a todos los padres o a los de una ruta, chat directo admin-padre, preferencias de notificación por tipo (cada padre elige qué push recibir).
- **Operación**: registro de mantenimiento de vehículos, importación masiva de alumnos por CSV, hoja de ruta imprimible en PDF (respaldo sin conexión para el chofer), bitácora de auditoría de cambios administrativos, tasa de asistencia y estadísticas de incidencias por ruta en Reportes.
- **Ayuda**: FAQ dentro de la app (`/ayuda`) con contenido según el rol.

Los recordatorios de pago se disparan manualmente desde `/admin/pagos` ("Recordar pagos pendientes") — ver la sección de despliegue arriba para automatizar la generación de pagos y las alertas de vencimiento vía Vercel Cron.
