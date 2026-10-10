// Contact form: saves the message and emails support@kriosity.in through the Kriosity M365 SMTP account.
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';
import { admin, cors, json } from '../_shared/util.ts';

const recent = new Map<string, number[]>();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  if (req.method !== 'POST') return json(req, { error: 'Use POST.' }, 405);

  // Simple per-IP limit: 5 messages per 10 minutes
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 600_000);
  if (hits.length >= 5) return json(req, { error: 'Too many messages. Try again in a few minutes.' }, 429);
  recent.set(ip, [...hits, now]);

  let b: { name?: string; email?: string; message?: string };
  try {
    b = await req.json();
  } catch {
    return json(req, { error: 'Bad request.' }, 400);
  }
  const name = String(b.name ?? '').trim().slice(0, 80);
  const email = String(b.email ?? '').trim().slice(0, 120);
  const message = String(b.message ?? '').trim().slice(0, 4000);
  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(req, { error: 'Add your name, a valid email and a message.' }, 400);

  const { error } = await admin().from('contact_messages').insert({ name, email, message });
  if (error) return json(req, { error: 'Could not save the message.' }, 500);

  const user = Deno.env.get('SMTP_USER');
  const pass = Deno.env.get('SMTP_PASS');
  if (user && pass) {
    try {
      const client = new SMTPClient({
        connection: { hostname: Deno.env.get('SMTP_HOST') ?? 'smtp.office365.com', port: Number(Deno.env.get('SMTP_PORT') ?? 587), tls: false, auth: { username: user, password: pass } },
      });
      await client.send({
        from: `KriosityOps <${user}>`,
        to: Deno.env.get('CONTACT_TO') ?? 'support@kriosity.in',
        replyTo: `${name} <${email}>`,
        subject: `KriosityOps contact: ${name}`,
        content: `From: ${name} <${email}>\n\n${message}`,
      });
      await client.close();
    } catch (e) {
      // The message is saved in the admin dashboard even if email fails
      console.error('smtp', e);
    }
  }
  return json(req, { ok: true });
});
