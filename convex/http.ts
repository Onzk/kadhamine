import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import { auth } from './auth';

const http = httpRouter();

auth.addHttpRoutes(http);

/** Vérifie X-FEDAPAY-SIGNATURE (format t=…,s=… — comme Stripe). */
async function verifyFedapaySignature(
  rawBody: string,
  header: string,
  secret: string,
  toleranceSec = 300,
): Promise<boolean> {
  const parts = header.split(',').map((p) => p.trim());
  let timestamp = -1;
  const signatures: string[] = [];

  for (const part of parts) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    const key = part.slice(0, eq);
    const value = part.slice(eq + 1);
    if (key === 't' && /^\d+$/.test(value)) timestamp = Number(value);
    if (key === 's') signatures.push(value);
  }

  if (timestamp < 0 || signatures.length === 0) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSec) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signedPayload = `${timestamp}.${rawBody}`;
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return signatures.some((s) => s === expected);
}

/** FedaPay https callback → 302 vers le deep link app (`to`) avec id/status. */
http.route({
  path: '/fedapay/callback',
  method: 'GET',
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const to = url.searchParams.get('to');
    const id = url.searchParams.get('id');
    const status = url.searchParams.get('status');

    if (!to) {
      return new Response('Missing to', { status: 400 });
    }

    const allowed =
      to.startsWith('tchadtalent://') ||
      to.startsWith('exp://') ||
      to.startsWith('https://');

    if (!allowed) {
      return new Response('Invalid redirect', { status: 400 });
    }

    const sep = to.includes('?') ? '&' : '?';
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (id) params.set('id', id);
    const qs = params.toString();
    const location = qs ? `${to}${sep}${qs}` : to;

    return new Response(null, {
      status: 302,
      headers: { Location: location },
    });
  }),
});

http.route({
  path: '/fedapay/webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const rawBody = await request.text();
    const signature =
      request.headers.get('X-FEDAPAY-SIGNATURE') ??
      request.headers.get('x-fedapay-signature');
    const webhookSecret = process.env.FEDAPAY_WEBHOOK_SECRET;

    if (webhookSecret) {
      if (!signature) {
        return new Response('Missing signature', { status: 401 });
      }
      const ok = await verifyFedapaySignature(rawBody, signature, webhookSecret);
      if (!ok) {
        return new Response('Invalid signature', { status: 401 });
      }
    }

    let payload: {
      name?: string;
      entity?: {
        id?: number;
        status?: string;
        reference?: string;
        custom_metadata?: {
          payment_id?: string;
          subscription_id?: string;
          purpose?: string;
        };
      };
    };

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    const eventName = payload.name ?? 'unknown';
    const entity = payload.entity;

    await ctx.runMutation(internal.fedapay.handleWebhook, {
      eventName,
      transactionId: entity?.id ? String(entity.id) : undefined,
      reference: entity?.reference,
      status: entity?.status,
      metadata: entity?.custom_metadata,
    });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
});

export default http;
