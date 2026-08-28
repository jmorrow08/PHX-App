// send-push — delivers web push notifications for PHX App.
// Called by a pg_net trigger on notifications insert (internal secret auth),
// or manually by an admin. Looks up the recipient's push subscriptions and
// sends via Web Push (VAPID).
// Secrets come from Supabase Edge Function secrets (Dashboard → Edge Functions → Secrets):
//   PUSH_INTERNAL_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const INTERNAL_SECRET = Deno.env.get('PUSH_INTERNAL_SECRET');
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY');
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY');

const CONFIGURED = !!(INTERNAL_SECRET && VAPID_PUBLIC && VAPID_PRIVATE);
if (CONFIGURED) {
  webpush.setVapidDetails('mailto:admin@thephx.app', VAPID_PUBLIC!, VAPID_PRIVATE!);
}

Deno.serve(async (req: Request) => {
  try {
    if (!CONFIGURED) {
      return new Response(
        JSON.stringify({ ok: false, error: 'push secrets not configured' }),
        { status: 500 }
      );
    }
    const body = await req.json();
    if (body.secret !== INTERNAL_SECRET) {
      return new Response(JSON.stringify({ ok: false, reason: 'unauthorized' }), { status: 401 });
    }
    const { recipient_id, title, message, url } = body;
    if (!recipient_id) {
      return new Response(JSON.stringify({ ok: false, reason: 'missing recipient_id' }), { status: 400 });
    }

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: subs } = await sb
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', recipient_id);

    if (!subs || !subs.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), { status: 200 });
    }

    const payload = JSON.stringify({
      title: title || 'PHX App',
      body: message || 'You have a new notification',
      url: url || '/app',
    });

    let sent = 0;
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          payload
        );
        sent++;
      } catch (e) {
        // 404/410 = expired subscription — clean it up
        if (e.statusCode === 404 || e.statusCode === 410) {
          await sb.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    }
    return new Response(JSON.stringify({ ok: true, sent }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
});
