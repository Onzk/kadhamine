import { v } from 'convex/values';
import { action, internalMutation } from './_generated/server';
import { internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';
import { activatePremiumSubscription } from './subscriptions';

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

type CreateTxResult = {
  sandbox: boolean;
  reference: string;
  paymentUrl: string | null;
  message?: string;
  transactionId?: number;
};

async function createFedapayTransactionApi(args: {
  amount: number;
  description: string;
  phoneNumber: string;
  method: 'airtel_money' | 'moov_money' | 'fedapay';
  customerEmail?: string;
  customerName?: string;
  metadata: Record<string, string>;
  reference: string;
}): Promise<{ transactionId: number; reference: string; paymentUrl: string | null }> {
  const mode =
    args.method === 'airtel_money'
      ? 'airtel'
      : args.method === 'moov_money'
        ? 'moov'
        : 'mtn_open';

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
      ...args.metadata,
      reference: args.reference,
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
    transactionId: transaction.id,
    reference: transaction.reference ?? args.reference,
    paymentUrl,
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
  handler: async (ctx, args): Promise<CreateTxResult> => {
    const secret = process.env.FEDAPAY_SECRET_KEY;
    const reference = `TT-ORDER-${args.paymentId}-${Date.now()}`;

    if (!secret) {
      await ctx.runMutation(internal.fedapay.linkTransaction, {
        paymentId: args.paymentId,
        fedapayTransactionId: `sandbox-${Date.now()}`,
        fedapayReference: reference,
      });
      return {
        sandbox: true,
        reference,
        paymentUrl: null,
        message: 'Mode sandbox local — configurez FEDAPAY_SECRET_KEY',
      };
    }

    const result = await createFedapayTransactionApi({
      amount: args.amount,
      description: args.description,
      phoneNumber: args.phoneNumber,
      method: args.method,
      customerEmail: args.customerEmail,
      customerName: args.customerName,
      reference,
      metadata: {
        purpose: 'order',
        payment_id: args.paymentId,
      },
    });

    await ctx.runMutation(internal.fedapay.linkTransaction, {
      paymentId: args.paymentId,
      fedapayTransactionId: String(result.transactionId),
      fedapayReference: result.reference,
    });

    return {
      sandbox: false,
      transactionId: result.transactionId,
      reference: result.reference,
      paymentUrl: result.paymentUrl,
    };
  },
});

export const createPremiumTransaction = action({
  args: {
    subscriptionId: v.id('subscriptions'),
    amount: v.number(),
    phoneNumber: v.string(),
    method: v.union(
      v.literal('airtel_money'),
      v.literal('moov_money'),
      v.literal('fedapay'),
    ),
    customerEmail: v.optional(v.string()),
    customerName: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<CreateTxResult> => {
    const secret = process.env.FEDAPAY_SECRET_KEY;
    const reference = `TT-PREMIUM-${args.subscriptionId}-${Date.now()}`;

    if (!secret) {
      await ctx.runMutation(internal.fedapay.linkPremiumTransaction, {
        subscriptionId: args.subscriptionId,
        fedapayTransactionId: `sandbox-${Date.now()}`,
        fedapayReference: reference,
      });
      // Auto-activate in local sandbox when no FedaPay key
      await ctx.runMutation(internal.subscriptions.activateFromPayment, {
        subscriptionId: args.subscriptionId,
        fedapayReference: reference,
        fedapayTransactionId: `sandbox-${Date.now()}`,
      });
      return {
        sandbox: true,
        reference,
        paymentUrl: null,
        message: 'Mode sandbox local — Premium activé automatiquement',
      };
    }

    const result = await createFedapayTransactionApi({
      amount: args.amount,
      description: 'Abonnement TalentTchad Premium',
      phoneNumber: args.phoneNumber,
      method: args.method,
      customerEmail: args.customerEmail,
      customerName: args.customerName,
      reference,
      metadata: {
        purpose: 'premium',
        subscription_id: args.subscriptionId,
      },
    });

    await ctx.runMutation(internal.fedapay.linkPremiumTransaction, {
      subscriptionId: args.subscriptionId,
      fedapayTransactionId: String(result.transactionId),
      fedapayReference: result.reference,
    });

    return {
      sandbox: false,
      transactionId: result.transactionId,
      reference: result.reference,
      paymentUrl: result.paymentUrl,
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

export const linkPremiumTransaction = internalMutation({
  args: {
    subscriptionId: v.id('subscriptions'),
    fedapayTransactionId: v.string(),
    fedapayReference: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.subscriptionId, {
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
    const purpose =
      (args.metadata?.purpose as string | undefined) ??
      (args.reference?.includes('PREMIUM') ? 'premium' : 'order');

    const approved =
      args.eventName === 'transaction.approved' ||
      args.status === 'approved' ||
      args.status === 'transferred';

    const declined =
      args.eventName === 'transaction.declined' ||
      args.eventName === 'transaction.canceled' ||
      args.status === 'declined' ||
      args.status === 'canceled';

    if (purpose === 'premium') {
      let subscription: Doc<'subscriptions'> | null = null;

      if (args.reference) {
        subscription = await ctx.db
          .query('subscriptions')
          .withIndex('by_fedapay_reference', (q) =>
            q.eq('fedapayReference', args.reference!),
          )
          .first();
      }

      if (!subscription && args.metadata?.subscription_id) {
        subscription = await ctx.db.get(
          args.metadata.subscription_id as Id<'subscriptions'>,
        );
      }

      if (!subscription) return { ok: false, reason: 'subscription_not_found' };

      if (approved) {
        await activatePremiumSubscription(ctx, {
          subscriptionId: subscription._id,
          fedapayReference: args.reference,
          fedapayTransactionId: args.transactionId,
        });
        return { ok: true, purpose: 'premium', subscriptionId: subscription._id };
      }

      if (declined) {
        await ctx.db.patch(subscription._id, {
          status: 'cancelled',
          updatedAt: Date.now(),
        });
      }

      return { ok: true, purpose: 'premium', status: 'failed' };
    }

    let payment: Doc<'payments'> | null = null;

    if (args.reference) {
      payment = await ctx.db
        .query('payments')
        .withIndex('by_fedapay_reference', (q) =>
          q.eq('fedapayReference', args.reference!),
        )
        .first();
    }

    if (!payment && args.metadata?.payment_id) {
      const found = await ctx.db.get(args.metadata.payment_id as Id<'payments'>);
      if (found) payment = found;
    }

    if (!payment) return { ok: false, reason: 'payment_not_found' };

    const timestamp = Date.now();

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
