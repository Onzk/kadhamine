export type PendingPayment =
  | { purpose: 'order'; orderId: string }
  | { purpose: 'premium' };

type PendingState =
  | { status: 'idle' }
  | { status: 'ready'; payment: PendingPayment }
  | { status: 'processing'; payment: PendingPayment };

let state: PendingState = { status: 'idle' };

export function setPendingPayment(payment: PendingPayment) {
  state = { status: 'ready', payment };
}

export function isPendingProcessing() {
  return state.status === 'processing';
}

/** Claim for processing once — avoids double-handle (deep link + router.replace). */
export function claimPendingPayment(): PendingPayment | null {
  if (state.status !== 'ready') return null;
  const payment = state.payment;
  state = { status: 'processing', payment };
  return payment;
}

export function clearPendingPayment() {
  state = { status: 'idle' };
}
