import { MessageCircle } from "lucide-react";
import { whatsappUrl } from "@/lib/whatsapp";

export function WhatsappLink({
  phone,
  label = "WhatsApp",
}: {
  phone: string | null | undefined;
  label?: string;
}) {
  const url = whatsappUrl(phone);
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-emerald-600 hover:underline"
    >
      <MessageCircle className="size-3.5" />
      {label}
    </a>
  );
}
