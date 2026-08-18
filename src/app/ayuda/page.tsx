import { HelpCircle } from "lucide-react";
import { getSessionProfile } from "@/lib/auth";
import { BackLink } from "@/components/back-link";
import { Card, CardContent } from "@/components/ui/card";

const ROLE_HOME: Record<string, string> = {
  admin: "/admin",
  chofer: "/chofer",
  padre: "/padre",
};

const COMMON_FAQS = [
  {
    q: "¿Cómo cambio mi contraseña?",
    a: "Ve al ícono de llave en la parte superior y sigue los pasos para crear una nueva contraseña.",
  },
  {
    q: "¿Olvidé mi contraseña, qué hago?",
    a: 'En la pantalla de inicio de sesión, toca "¿Olvidaste tu contraseña?" y te enviaremos un enlace al correo registrado.',
  },
];

const FAQS_BY_ROLE: Record<string, { q: string; a: string }[]> = {
  padre: [
    {
      q: "¿Cómo veo dónde está el bus?",
      a: "Cuando el chofer inicia el recorrido, en tu pantalla principal aparece un mapa en vivo con la ubicación del bus mientras se acerca a tu parada.",
    },
    {
      q: "¿Cómo marco que mi hijo no asistirá?",
      a: 'En la tarjeta de tu hijo, en la sección "Ausencias", elige la fecha y toca "Marcar ausencia".',
    },
    {
      q: "¿Cómo veo mi historial de pagos o descargo un recibo?",
      a: 'Toca "Ver historial" junto al estado de pago de tu hijo. Ahí puedes ver todos los periodos y descargar el recibo de cualquier pago ya realizado.',
    },
    {
      q: "¿Puedo escribirle a administración?",
      a: 'Sí, usa el ícono de mensajes en la parte superior para abrir el chat directo con administración.',
    },
    {
      q: "¿Cómo cambio qué notificaciones recibo?",
      a: 'Toca el ícono de campana para elegir qué avisos push quieres recibir (inicio de recorrido, recogida/entrega, avisos generales, recordatorios de pago).',
    },
  ],
  chofer: [
    {
      q: "¿Cómo inicio un viaje?",
      a: "Completa el checklist de seguridad (llantas, frenos, luces, cinturones) y toca \"Iniciar viaje\". Esto activa el envío de tu ubicación en vivo a los padres de tu ruta.",
    },
    {
      q: "¿Qué hago si hay una emergencia?",
      a: 'Usa el botón rojo "Emergencia" en la parte superior de tu pantalla y confirma. Esto avisa de inmediato a administración con tu ubicación.',
    },
    {
      q: "¿Cómo marco a un alumno como recogido o entregado?",
      a: "En la tarjeta de cada alumno, toca el botón correspondiente. Solo funciona mientras el viaje está en curso.",
    },
    {
      q: "¿Cómo reporto una incidencia?",
      a: "Al final de tu pantalla hay un formulario de incidencias donde puedes describir lo ocurrido y adjuntar una foto si aplica.",
    },
  ],
  admin: [
    {
      q: "¿Cómo agrego un alumno nuevo?",
      a: "Ve a Alumnos y usa el formulario de creación, o importa varios a la vez desde Alumnos → Importar con un archivo CSV.",
    },
    {
      q: "¿Cómo genero los pagos del mes?",
      a: 'En Pagos, toca "Generar pagos del mes" para crear automáticamente el pago pendiente de cada alumno que aún no tenga uno para el periodo.',
    },
    {
      q: "¿Dónde reviso quién solicitó el servicio?",
      a: "En Inscripciones puedes ver, contactar y marcar el estado de cada solicitud enviada desde el formulario público.",
    },
    {
      q: "¿Cómo veo qué cambios ha hecho cada usuario?",
      a: "En Auditoría queda un registro de cada creación, edición o eliminación hecha desde el panel de administración.",
    },
  ],
};

export default async function AyudaPage() {
  const profile = await getSessionProfile();
  const home = ROLE_HOME[profile.role] ?? "/";
  const faqs = [...(FAQS_BY_ROLE[profile.role] ?? []), ...COMMON_FAQS];

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <BackLink href={home} label="Volver" />

      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <HelpCircle className="size-5 text-primary" />
          Ayuda
        </h1>
        <p className="text-sm text-muted-foreground">
          Preguntas frecuentes sobre el uso de la plataforma.
        </p>
      </div>

      <Card>
        <CardContent className="divide-y divide-border">
          {faqs.map((item) => (
            <details key={item.q} className="group py-3 first:pt-0 last:pb-0">
              <summary className="cursor-pointer list-none text-sm font-medium marker:content-none">
                {item.q}
              </summary>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
