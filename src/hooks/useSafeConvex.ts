import { useCallback } from 'react';
import { useAction, useMutation } from 'convex/react';
import type { FunctionReference, OptionalRestArgs } from 'convex/server';
import { useTranslation } from 'react-i18next';

import { getConvexErrorMessage, reportConvexError, runConvexSafe } from '@/lib/convexErrors';
import { useAppDialog } from '@/providers/AppDialogProvider';

type MutateFn<Mutation extends FunctionReference<'mutation'>> = (
  ...args: OptionalRestArgs<Mutation>
) => Promise<unknown>;

type ActionFn<Action extends FunctionReference<'action'>> = (
  ...args: OptionalRestArgs<Action>
) => Promise<unknown>;

/**
 * Mutation Convex qui capture les erreurs (log + alert optionnelle).
 * Ne relance pas — retourne `undefined` en cas d’échec.
 */
export function useSafeMutation<Mutation extends FunctionReference<'mutation'>>(
  mutation: Mutation,
  options?: { context?: string; silent?: boolean },
): MutateFn<Mutation> {
  const mutate = useMutation(mutation);
  const { alert } = useAppDialog();
  const { t } = useTranslation();

  return useCallback(
    async (...args: OptionalRestArgs<Mutation>) => {
      const result = await runConvexSafe(() => mutate(...args), {
        context: options?.context ?? 'mutation',
        fallbackMessage: t('common.errorDesc'),
      });
      if (!result.ok) {
        if (!options?.silent) {
          alert({
            title: t('common.error'),
            message: result.message,
            buttonLabel: t('common.done'),
          });
        }
        return undefined;
      }
      return result.data;
    },
    [alert, mutate, options?.context, options?.silent, t],
  ) as MutateFn<Mutation>;
}

/**
 * Action Convex qui capture les erreurs (log + alert optionnelle).
 * Ne relance pas — retourne `undefined` en cas d’échec.
 */
export function useSafeAction<Action extends FunctionReference<'action'>>(
  action: Action,
  options?: { context?: string; silent?: boolean },
): ActionFn<Action> {
  const run = useAction(action);
  const { alert } = useAppDialog();
  const { t } = useTranslation();

  return useCallback(
    async (...args: OptionalRestArgs<Action>) => {
      const result = await runConvexSafe(() => run(...args), {
        context: options?.context ?? 'action',
        fallbackMessage: t('common.errorDesc'),
      });
      if (!result.ok) {
        if (!options?.silent) {
          alert({
            title: t('common.error'),
            message: result.message,
            buttonLabel: t('common.done'),
          });
        }
        return undefined;
      }
      return result.data;
    },
    [alert, options?.context, options?.silent, run, t],
  ) as ActionFn<Action>;
}

/** Helper pour wrapper un appel ponctuel déjà obtenu via useMutation/useAction. */
export async function invokeConvexSafe<T>(
  fn: () => Promise<T>,
  handlers: {
    onErrorMessage?: (message: string) => void;
    context?: string;
    fallbackMessage?: string;
  } = {},
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    reportConvexError(error, handlers.context);
    const message = getConvexErrorMessage(error, handlers.fallbackMessage ?? 'Une erreur est survenue');
    handlers.onErrorMessage?.(message);
    return undefined;
  }
}
