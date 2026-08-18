import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPadreMessage, markThreadReadByParent } from "./actions";
import { MessageThread } from "@/components/message-thread";
import { BackLink } from "@/components/back-link";

export default async function PadreMensajesPage() {
  const profile = await requireRole("padre");
  const supabase = await createClient();

  await markThreadReadByParent();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("parent_id", profile.id)
    .order("created_at");

  return (
    <div className="space-y-4">
      <div>
        <BackLink href="/padre" label="Volver" />
        <h1 className="text-xl font-semibold tracking-tight">Mensajes con administración</h1>
      </div>
      <MessageThread
        messages={messages ?? []}
        currentUserId={profile.id}
        sendAction={sendPadreMessage}
      />
    </div>
  );
}
