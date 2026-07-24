import { v } from 'convex/values';
import { action, internalMutation } from './_generated/server';
import { internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';
import { activatePremiumSubscription } from './subscriptions';
import { releasePaymentForOrder } from './payments';
import { validateReviewForOrder } from './reviews';

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
  phoneNumber?: string;
  customerEmail?: string;
  customerName?: string;
  metadata: Record<string, string>;
  reference: string;
  returnUrl?: string;
}): Promise<{ transactionId: number; reference: string; paymentUrl: string | null }> {
  const customer: Record<string, unknown> = {
    firstname: args.customerName?.split(' ')[0] ?? 'Client',
    lastname: args.customerName?.split(' ').slice(1).join(' ') || 'Kadhamine',
    email: args.customerEmail ?? 'client@talenttchad.com',
  };

  // Le numéro est saisi sur la page FedaPay ; on ne l’envoie que s’il est déjà connu.
  if (args.phoneNumber?.trim()) {
    customer.phone_number = {
      number: args.phoneNumber.trim(),
      country: 'td',
    };
  }

  // FedaPay exige une URL http(s) — les deep links (tchadtalent://…) sont rejetés.
  // Préférer le proxy Convex `/fedapay/callback?to=…` quand returnUrl + CONVEX_SITE_URL.
  const siteUrl = process.env.CONVEX_SITE_URL?.trim()?.replace(/\/$/, '');
  const dynamicCallback =
    args.returnUrl && siteUrl
      ? `${siteUrl}/fedapay/callback?to=${encodeURIComponent(args.returnUrl)}`
      : undefined;
  const callbackUrl =
    dynamicCallback ?? process.env.FEDAPAY_CALLBACK_URL?.trim();
  const hasHttpCallback =
    !!callbackUrl && /^https?:\/\//i.test(callbackUrl);

  const body = {
    description: args.description,
    amount: args.amount,
    // FedaPay n'accepte que XOF (CFA UEMOA). L'app reste en XAF (CFA BEAC) côté métier.
    currency: { iso: 'XOF' },
    ...(hasHttpCallback ? { callback_url: callbackUrl } : {}),
    customer,
    custom_metadata: {
      ...args.metadata,
      reference: args.reference,
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

  const data = (await response.json()) as Record<string, unknown>;

  const nested =
    (data['v1/transaction'] as
      | { id?: number; reference?: string; payment_url?: string }
      | undefined) ??
    (data.transaction as
      | { id?: number; reference?: string; payment_url?: string }
      | undefined) ??
    (
      data.v1 as
        | { transaction?: { id?: number; reference?: string; payment_url?: string } }
        | undefined
    )?.transaction;

  const transactionId =
    nested?.id ?? (typeof data.id === 'number' ? data.id : undefined);
  const reference =
    nested?.reference ??
    (typeof data.reference === 'string' ? data.reference : args.reference);
  let paymentUrl =
    nested?.payment_url ??
    (typeof data.payment_url === 'string' ? data.payment_url : null);

  if (typeof transactionId !== 'number') {
    throw new Error(`Réponse FedaPay invalide: ${JSON.stringify(data)}`);
  }

  if (!paymentUrl) {
    const tokenResponse = await fetch(
      `${FEDAPAY_API}/transactions/${transactionId}/token`,
      { method: 'POST', headers: fedapayHeaders() },
    );

    if (tokenResponse.ok) {
      const tokenData = (await tokenResponse.json()) as Record<string, unknown>;
      const tokenNested =
        (tokenData['v1/token'] as { url?: string } | undefined) ??
        (tokenData.v1 as { token?: { url?: string } } | undefined)?.token;
      paymentUrl =
        (typeof tokenData.url === 'string' ? tokenData.url : null) ??
        tokenNested?.url ??
        null;
    }
  }

  return {
    transactionId,
    reference,
    paymentUrl,
  };
}

export const createTransaction = action({
  args: {
    paymentId: v.id('payments'),
    amount: v.number(),
    description: v.string(),
    phoneNumber: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    customerName: v.optional(v.string()),
    returnUrl: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<CreateTxResult> => {
    const secret = process.env.FEDAPAY_SECRET_KEY;
    const reference = `TT-ORDER-${args.paymentId}-${Date.now()}`;

    if (!secret) {
      await ctx.runMutation(internal.fedapay.approveSandboxPayment, {
        paymentId: args.paymentId,
        fedapayTransactionId: `sandbox-${Date.now()}`,
        fedapayReference: reference,
      });
      return {
        sandbox: true,
        reference,
        paymentUrl: null,
        message: 'Mode sandbox local — configurez la clé de paiement',
      };
    }

    const result = await createFedapayTransactionApi({
      amount: args.amount,
      description: args.description,
      phoneNumber: args.phoneNumber,
      customerEmail: args.customerEmail,
      customerName: args.customerName,
      reference,
      returnUrl: args.returnUrl,
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
    phoneNumber: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    customerName: v.optional(v.string()),
    returnUrl: v.optional(v.string()),
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
      description: 'Abonnement Kadhamine Premium',
      phoneNumber: args.phoneNumber,
      customerEmail: args.customerEmail,
      customerName: args.customerName,
      reference,
      returnUrl: args.returnUrl,
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

/** Sandbox local : paiement libéré (`released`) + avis validé. */
export const approveSandboxPayment = internalMutation({
  args: {
    paymentId: v.id('payments'),
    fedapayTransactionId: v.string(),
    fedapayReference: v.string(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) throw new Error('Paiement introuvable');
    const order = await ctx.db.get(payment.orderId);
    if (!order || order.status !== 'completed') {
      throw new Error('Commande non terminée');
    }
    const timestamp = Date.now();
    await releasePaymentForOrder(ctx, args.paymentId, {
      fedapayTransactionId: args.fedapayTransactionId,
      fedapayReference: args.fedapayReference,
    });
    await ctx.db.patch(payment.orderId, {
      canReview: true,
      updatedAt: timestamp,
    });
    await validateReviewForOrder(ctx, payment.orderId, args.paymentId);
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
      const order = await ctx.db.get(payment.orderId);
      if (!order || order.status !== 'completed') {
        return { ok: false, reason: 'order_not_completed' };
      }
      await releasePaymentForOrder(ctx, payment._id, {
        fedapayTransactionId:
          args.transactionId ?? payment.fedapayTransactionId,
      });
      await ctx.db.patch(payment.orderId, {
        canReview: true,
        updatedAt: timestamp,
      });
      await validateReviewForOrder(ctx, payment.orderId, payment._id);
    } else if (declined) {
      await ctx.db.patch(payment._id, {
        status: 'failed',
        updatedAt: timestamp,
      });
      /** Avis reste isValid=false — ne compte pas dans les moyennes. */
    }

    return {
      ok: true,
      paymentId: payment._id,
      status: approved ? 'released' : 'failed',
    };
  },
});
