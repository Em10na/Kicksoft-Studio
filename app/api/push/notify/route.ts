import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ================================================================
// Notifications — diffusion multicanal (style Temu / Shein) :
// 1. archive dans la table `notifications` (cloche du site)
// 2. push web (arrière-plan desktop / mobile)
// 3. email aux abonnés newsletter + clients inscrits (via Resend)
// Réservé aux admins.
// ================================================================

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role_id, roles(name)")
    .eq("id", user.id)
    .single();

  const roles = profile?.roles as unknown as { name: string } | { name: string }[] | null;
  const roleName = Array.isArray(roles) ? roles[0]?.name : roles?.name;
  if (roleName !== "admin") return null;
  return user;
}

type NotifBody = {
  title?: string; body?: string; url?: string; image?: string; tag?: string;
  sendPush?: boolean; sendEmail?: boolean;
};

async function sendWebPush(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  payload: string
): Promise<{ sent: number; failed: number; removed: number }> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return { sent: 0, failed: 0, removed: 0 };
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:admin@kicksoft.tn", publicKey, privateKey);

  const { data: subs } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth");
  if (!subs || subs.length === 0) return { sent: 0, failed: 0, removed: 0 };

  let sent = 0;
  const dead: string[] = [];
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      );
      sent++;
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) dead.push(s.id);
    }
  }));

  if (dead.length > 0) {
    await supabaseAdmin.from("push_subscriptions").delete().in("id", dead);
  }
  return { sent, failed: subs.length - sent, removed: dead.length };
}

async function collectEmails(supabaseAdmin: ReturnType<typeof createAdminClient>): Promise<string[]> {
  const emails = new Set<string>();

  const { data: subs } = await supabaseAdmin
    .from("newsletter_subscribers")
    .select("email")
    .eq("active", true);
  for (const s of subs ?? []) if (s.email) emails.add(s.email.toLowerCase());

  // Clients inscrits (paginé, suffisant pour une boutique de cette taille)
  let page = 1;
  for (;;) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data?.users?.length) break;
    for (const u of data.users) if (u.email) emails.add(u.email.toLowerCase());
    if (data.users.length < 1000) break;
    page++;
  }

  return [...emails];
}

async function sendEmails(
  emails: string[],
  notif: { title: string; body: string; url: string; image?: string }
): Promise<number> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || emails.length === 0) return 0;

  const from = process.env.EMAIL_FROM ?? "DJI Store TN <onboarding@resend.dev>";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const link = notif.url.startsWith("http") ? notif.url : `${siteUrl}${notif.url}`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:16px">
      <div style="background:linear-gradient(135deg,#6366f1,#4f46e5);border-radius:12px;padding:20px 24px;color:#fff">
        <h1 style="margin:0;font-size:20px">${notif.title}</h1>
      </div>
      ${notif.image ? `<img src="${notif.image}" alt="" style="width:100%;border-radius:12px;margin-top:16px" />` : ""}
      <p style="font-size:15px;color:#334155;line-height:1.6;margin:16px 4px">${notif.body}</p>
      <a href="${link}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:bold;margin:8px 4px">Voir sur DJI Store TN →</a>
      <p style="font-size:11px;color:#94a3b8;margin:20px 4px 0">Vous recevez cet email car vous êtes inscrit sur DJI Store TN.</p>
    </div>`;

  // Envoi en BCC par lots de 49 pour ne pas exposer les adresses
  let sent = 0;
  for (let i = 0; i < emails.length; i += 49) {
    const chunk = emails.slice(i, i + 49);
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [from.match(/<(.+)>/)?.[1] ?? "noreply@kicksoft.tn"],
          bcc: chunk,
          subject: notif.title,
          html,
        }),
      });
      if (res.ok) sent += chunk.length;
    } catch { /* lot en échec — on continue les suivants */ }
  }
  return sent;
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
  }

  let body: NotifBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requete invalide." }, { status: 400 });
  }
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Titre obligatoire." }, { status: 400 });
  }

  const notif = {
    title: body.title.trim(),
    body: body.body?.trim() ?? "",
    url: body.url ?? "/boutique",
    image: body.image,
    tag: ["nouveau", "solde", "info"].includes(body.tag ?? "") ? (body.tag as string) : "info",
  };

  const supabaseAdmin = createAdminClient();

  // 1. Archive pour la cloche du site
  await supabaseAdmin.from("notifications").insert(notif);

  // 2. Push web (arrière-plan)
  const pushResult = body.sendPush === false
    ? { sent: 0, failed: 0, removed: 0 }
    : await sendWebPush(supabaseAdmin, JSON.stringify(notif));

  // 3. Emails
  const emailsSent = body.sendEmail === false
    ? 0
    : await sendEmails(await collectEmails(supabaseAdmin), notif);

  return NextResponse.json({ push: pushResult, emails: emailsSent });
}
