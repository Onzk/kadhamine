/** Retry a Convex mutation briefly after sign-up while the auth token propagates. */
export async function withAuthRetry<T>(fn: () => Promise<T>, attempts = 10): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const unauth = /Non authentifié|Unauthenticated|not authenticated/i.test(msg);
      if (!unauth || i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 120 + i * 160));
    }
  }
  throw lastError;
}
