import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendAdminMessage, markThreadReadByAdmin } from "../actions";
import { MessageThread } from "@/components/message-thread";
import { BackLink } from "@/components/back-link";

export default async function AdminMessageThreadPage({
  params,
}: PageProps<"/admin/mensajes/[parentId]">) {
  const profile = await requireRole("admin");
  const { parentId } = await params;
  const supabase = await createClient();

  const { data: parent } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", parentId)
    .eq("role", "padre")
    .maybeSingle();

  if (!parent) notFound();

  await markThreadReadByAdmin(parentId);

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("parent_id", parentId)
    .order("created_at");

  return (
    <div className="space-y-4">
      <div>
        <BackLink href="/admin/mensajes" label="Volver a mensajes" />
        <h1 className="text-xl font-semibold tracking-tight">{parent.full_name}</h1>
      </div>
      <MessageThread
        messages={messages ?? []}
        currentUserId={profile.id}
        sendAction={sendAdminMessage.bind(null, parentId)}
      />
    </div>
  );
}
