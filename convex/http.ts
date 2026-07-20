import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import { auth } from './auth';

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: '/fedapay/webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const rawBody = await request.text();
    const signature = request.headers.get('X-FEDAPAY-SIGNATURE');
    const webhookSecret = process.env.FEDAPAY_WEBHOOK_SECRET;

    // Si le secret est configuré, la signature est obligatoire
    if (webhookSecret) {
      if (!signature) {
        return new Response('Missing signature', { status: 401 });
      }
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(webhookSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      );
      const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
      const computed = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      if (computed !== signature && signature !== `sha256=${computed}`) {
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
