import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AlertBottomSheet } from '@/components/ui/AlertBottomSheet';
import { ConfirmationBottomSheet } from '@/components/ui/ConfirmationBottomSheet';

export type AppAlertOptions = {
  title: string;
  subtitle?: string;
  message?: string;
  detail?: string;
  buttonLabel?: string;
  onPress?: () => void;
  icon?: React.ReactNode;
};

export type AppConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void> | false | Promise<false | void>;
  onCancel?: () => void;
};

type AppDialogContextValue = {
  alert: (options: AppAlertOptions) => void;
  confirm: (options: AppConfirmOptions) => void;
};

const AppDialogContext = createContext<AppDialogContextValue | null>(null);

export function AppDialogProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [alertOptions, setAlertOptions] = useState<AppAlertOptions | null>(null);
  const [confirmOptions, setConfirmOptions] = useState<AppConfirmOptions | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const closeAlert = useCallback(() => setAlertOptions(null), []);
  const closeConfirm = useCallback(() => {
    if (confirmLoading) return;
    setConfirmOptions(null);
  }, [confirmLoading]);

  const alert = useCallback((options: AppAlertOptions) => {
    setConfirmOptions(null);
    setAlertOptions(options);
  }, []);

  const confirm = useCallback((options: AppConfirmOptions) => {
    setAlertOptions(null);
    setConfirmOptions(options);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!confirmOptions) return;
    setConfirmLoading(true);
    try {
      const shouldClose = await confirmOptions.onConfirm();
      if (shouldClose !== false) {
        setConfirmOptions(null);
      }
    } finally {
      setConfirmLoading(false);
    }
  }, [confirmOptions]);

  const value = useMemo(() => ({ alert, confirm }), [alert, confirm]);

  return (
    <AppDialogContext.Provider value={value}>
      {children}
      <AlertBottomSheet
        visible={alertOptions != null}
        onClose={closeAlert}
        title={alertOptions?.title ?? ''}
        subtitle={alertOptions?.subtitle}
        message={alertOptions?.message}
        detail={alertOptions?.detail}
        buttonLabel={alertOptions?.buttonLabel ?? 'OK'}
        onDismiss={alertOptions?.onPress}
        icon={alertOptions?.icon}
      />
      <ConfirmationBottomSheet
        visible={confirmOptions != null}
        onClose={() => {
          confirmOptions?.onCancel?.();
          closeConfirm();
        }}
        title={confirmOptions?.title ?? ''}
        message={confirmOptions?.message}
        confirmLabel={confirmOptions?.confirmLabel ?? t('common.confirm')}
        cancelLabel={confirmOptions?.cancelLabel ?? t('common.cancel')}
        destructive={confirmOptions?.destructive}
        loading={confirmLoading}
        onConfirm={handleConfirm}
      />
    </AppDialogContext.Provider>
  );
}

export function useAppDialog() {
  const ctx = useContext(AppDialogContext);
  if (!ctx) {
    throw new Error('useAppDialog must be used within AppDialogProvider');
  }
  return ctx;
}
