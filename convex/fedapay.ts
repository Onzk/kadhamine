import { v } from 'convex/values';
import { action, internalMutation } from './_generated/server';
import { internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';

const FEDAPAY_API =
  process.env.FEDAPAY_ENV === 'live'
    ? 'https://api.fedapay.com/v1'
    : 'https://sandbox-api.fedapay.com/v1';

function fedapayHeaders() {
  const secret = process.env.FEDAPAY_SECRET_KEY;
  if (!secret) throw new Error('FEDAPAY_SECRET_KEY non configurée');
  return {
    Authorization: `Bearer ${secret}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

export const createTransaction = action({
  args: {
    paymentId: v.id('payments'),
    amount: v.number(),
    description: v.string(),
    phoneNumber: v.string(),
    method: v.union(
      v.literal('airtel_money'),
      v.literal('moov_money'),
      v.literal('fedapay'),
    ),
    customerEmail: v.optional(v.string()),
    customerName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const secret = process.env.FEDAPAY_SECRET_KEY;
    if (!secret) {
      return {
        sandbox: true,
        reference: `TT-SANDBOX-${Date.now()}`,
        paymentUrl: null,
        message: 'Mode sandbox local — configurez FEDAPAY_SECRET_KEY',
      };
    }

    const mode =
      args.method === 'airtel_money'
        ? 'airtel'
        : args.method === 'moov_money'
          ? 'moov'
          : 'mtn_open';

    const reference = `TT-${args.paymentId}-${Date.now()}`;

    const body = {
      description: args.description,
      amount: args.amount,
      currency: { iso: 'XAF' },
      callback_url: process.env.FEDAPAY_CALLBACK_URL,
      customer: {
        firstname: args.customerName?.split(' ')[0] ?? 'Client',
        lastname: args.customerName?.split(' ').slice(1).join(' ') || 'TalentTchad',
        email: args.customerEmail ?? 'client@talenttchad.com',
        phone_number: {
          number: args.phoneNumber,
          country: 'td',
        },
      },
      custom_metadata: {
        payment_id: args.paymentId,
        reference,
        mode,
      },
    };

    const response = await fetch(`${FEDAPAY_API}/transactions`, {
      method: 'POST',
      headers: fedapayHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FedaPay: ${response.status} — ${errorText}`);
    }

    const data = (await response.json()) as {
      v1?: { transaction?: { id: number; reference: string } };
      transaction?: { id: number; reference: string };
    };

    const transaction = data.v1?.transaction ?? data.transaction;
    if (!transaction) throw new Error('Réponse FedaPay invalide');

    await ctx.runMutation(internal.fedapay.linkTransaction, {
      paymentId: args.paymentId,
      fedapayTransactionId: String(transaction.id),
      fedapayReference: transaction.reference ?? reference,
    });

    const tokenResponse = await fetch(
      `${FEDAPAY_API}/transactions/${transaction.id}/token`,
      { method: 'POST', headers: fedapayHeaders() },
    );

    let paymentUrl: string | null = null;
    if (tokenResponse.ok) {
      const tokenData = (await tokenResponse.json()) as {
        url?: string;
        v1?: { token?: { url?: string } };
      };
      paymentUrl = tokenData.url ?? tokenData.v1?.token?.url ?? null;
    }

    return {
      sandbox: false,
      transactionId: transaction.id,
      reference: transaction.reference ?? reference,
      paymentUrl,
    };
  },
});

export const linkTransaction = internalMutation({
  args: {
    paymentId: v.id('payments'),
    fedapayTransactionId: v.string(),
    fedapayReference: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.paymentId, {
      fedapayTransactionId: args.fedapayTransactionId,
      fedapayReference: args.fedapayReference,
      updatedAt: Date.now(),
    });
  },
});

export const handleWebhook = internalMutation({
  args: {
    eventName: v.string(),
    transactionId: v.optional(v.string()),
    reference: v.optional(v.string()),
    status: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    let payment: Doc<'payments'> | null = null;

    if (args.reference) {
      const payments = await ctx.db.query('payments').collect();
      payment = payments.find((p) => p.fedapayReference === args.reference) ?? null;
    }

    if (!payment && args.metadata?.payment_id) {
      const found = await ctx.db.get(args.metadata.payment_id as Id<'payments'>);
      if (found) payment = found;
    }

    if (!payment) return { ok: false, reason: 'payment_not_found' };

    const timestamp = Date.now();
    const approved =
      args.eventName === 'transaction.approved' ||
      args.status === 'approved' ||
      args.status === 'transferred';

    const declined =
      args.eventName === 'transaction.declined' ||
      args.eventName === 'transaction.canceled' ||
      args.status === 'declined' ||
      args.status === 'canceled';

    if (approved) {
      await ctx.db.patch(payment._id, {
        status: 'held',
        fedapayTransactionId: args.transactionId ?? payment.fedapayTransactionId,
        heldAt: timestamp,
        updatedAt: timestamp,
      });
      await ctx.db.patch(payment.orderId, { canReview: true, updatedAt: timestamp });
    } else if (declined) {
      await ctx.db.patch(payment._id, {
        status: 'failed',
        updatedAt: timestamp,
      });
    }

    return { ok: true, paymentId: payment._id, status: approved ? 'held' : 'failed' };
  },
});
