import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import {
  AccountingEntitiesConfig,
  PaymentConfig,
  StripeConnectLiveStatus,
} from '../../types/api';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import {
  accountDisplayName,
  accountingEntityNamesUsingAccount,
  listConnectedAccounts,
} from '../../utils/stripeAccounts';
import {
  getResolvedStripeConnectedAccountId,
  resolveStripeConnectBannerKind,
} from '../../utils/stripeConnect.helpers';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Information,
} from '../ui';

export interface PaymentConnectPanelProps {
  paymentConfig?: Partial<PaymentConfig> | null;
  accountingEntities?: AccountingEntitiesConfig | null;
  returnTo: string;
  refreshKey?: string;
  onChanged: () => void | Promise<unknown>;
}

const disconnectedConnectStatus = {
  accountLinked: false,
  webhookUrlMatches: false,
  status: 'not_connected',
} as const;

const connectStatusFromResponse = (response: {
  data?: { results?: unknown };
}): StripeConnectLiveStatus | null => {
  const results = response?.data?.results;
  if (results && typeof results === 'object' && !Array.isArray(results)) {
    return results as StripeConnectLiveStatus;
  }
  return null;
};

const PaymentConnectPanel = ({
  paymentConfig,
  accountingEntities,
  returnTo,
  refreshKey = '',
  onChanged,
}: PaymentConnectPanelProps) => {
  const t = useTranslations();
  const router = useRouter();
  const [connectLiveStatus, setConnectLiveStatus] =
    useState<StripeConnectLiveStatus | null>(null);
  const [stripeDisconnectWarning, setStripeDisconnectWarning] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [pendingStripeDisconnectId, setPendingStripeDisconnectId] = useState<
    string | null
  >(null);

  const connectedAccountId = getResolvedStripeConnectedAccountId(paymentConfig);
  const connectedAccounts = listConnectedAccounts(paymentConfig);
  const stripeConnectBannerKind = resolveStripeConnectBannerKind({
    stripeConnectQuery: refreshKey,
    storedAccountId: connectedAccountId,
    live: connectLiveStatus,
    connectStatus: paymentConfig?.connectStatus,
  });

  useEffect(() => {
    let cancelled = false;
    const loadStatus = async () => {
      try {
        const response = await api.get('/stripe/connect/status');
        if (cancelled) {
          return;
        }
        setConnectLiveStatus(connectStatusFromResponse(response));
      } catch {
        if (!cancelled) {
          setConnectLiveStatus(disconnectedConnectStatus);
        }
      }
    };
    void loadStatus();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const refreshStripeConnectStatus = async () => {
    try {
      const response = await api.get('/stripe/connect/status');
      setConnectLiveStatus(connectStatusFromResponse(response));
    } catch {
      setConnectLiveStatus(disconnectedConnectStatus);
    }
  };

  const handleSetDefaultStripeAccount = async (accountId: string) => {
    await api.post(`/stripe/connect/accounts/${accountId}/default`);
    await refreshStripeConnectStatus();
    await onChanged();
  };

  const handleRenameStripeAccount = async (accountId: string) => {
    const current = connectedAccounts.find(
      (account) => account.id === accountId,
    );
    const nextLabel = window.prompt(
      'Display name for this Stripe account',
      current?.label || current?.name || '',
    );
    if (nextLabel == null) {
      return;
    }
    await api.patch(`/stripe/connect/accounts/${accountId}`, {
      label: nextLabel,
    });
    await refreshStripeConnectStatus();
    await onChanged();
  };

  const warnStripeAccountStillAssigned = (entities: string) => {
    setStripeDisconnectWarning({
      title: t('payment_connect_disconnect_assigned_title'),
      description: t('payment_connect_disconnect_assigned', {
        entities,
      }),
    });
  };

  const handleDisconnectStripeAccount = (accountId: string) => {
    const assignedNames = accountingEntityNamesUsingAccount(
      accountingEntities,
      accountId,
    );
    if (assignedNames.length > 0) {
      warnStripeAccountStillAssigned(
        assignedNames
          .map(
            (name) => name || t('payment_connect_disconnect_assigned_entity'),
          )
          .join(', '),
      );
      return;
    }
    setPendingStripeDisconnectId(accountId);
  };

  const confirmDisconnectStripeAccount = async (accountId: string) => {
    try {
      await api.delete(`/stripe/connect/accounts/${accountId}`);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status === 409) {
        warnStripeAccountStillAssigned(
          t('payment_connect_disconnect_assigned_entity'),
        );
        return;
      }
      setStripeDisconnectWarning({
        title: t('payment_connect_disconnect_failed'),
        description: parseMessageFromError(err),
      });
      return;
    }
    await refreshStripeConnectStatus();
    await onChanged();
  };

  const renderStripeConnectPendingCard = (message: string) => (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-gray-900">
      {message}
    </div>
  );

  const renderAccountConnectBanner = (accountId: string) => {
    const liveAccount = connectLiveStatus?.connectedAccounts?.find(
      (account) => account.id === accountId,
    );
    const accountLinked =
      liveAccount?.accountLinked ?? connectLiveStatus?.accountLinked;
    const accountStatus =
      liveAccount?.connectStatus || paymentConfig?.connectStatus;
    if (accountLinked === false) {
      return (
        <Information>{t('payment_connect_not_linked_message')}</Information>
      );
    }
    if (accountStatus === 'pending') {
      return renderStripeConnectPendingCard(
        t('payment_connect_pending_message'),
      );
    }
    if (accountStatus === 'active') {
      return (
        <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-gray-900">
          {t('payment_connect_active_message')}
        </div>
      );
    }
    if (stripeConnectBannerKind === 'failed') {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-gray-900">
          {t('payment_connect_failed_message')}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        {connectedAccounts.length > 0 ? (
          <>
            <Information>
              {t('payment_connect_default_explanation')}
            </Information>
            <div className="flex flex-col gap-1">
              <Information>
                {t('payment_connect_accounting_entities_hint')}
              </Information>
              <button
                type="button"
                className="w-fit text-sm underline text-gray-600 ml-6"
                onClick={() =>
                  router.push('/admin/config?config=accounting-entities')
                }
              >
                {t('payment_connect_accounting_entities_link')}
              </button>
            </div>
          </>
        ) : null}
        {connectedAccounts.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-accent/30 bg-accent/5 p-4">
            {refreshKey === 'failed' ? (
              <div className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-gray-900">
                {t('payment_connect_failed_message')}
              </div>
            ) : null}
            <p className="text-sm font-medium text-gray-900">
              {t('payment_connect_enable_button')}
            </p>
            <Button
              onClick={() =>
                router.push(`/stripe-connect?returnTo=${returnTo}`)
              }
              variant="inline"
              size="small"
              isFullWidth={false}
            >
              {t('payment_connect_connect_button')}
            </Button>
          </div>
        ) : null}
        {connectedAccounts.map((account) => (
          <div
            key={account.id}
            className={`rounded-lg border p-3 flex flex-col gap-2 ${
              account.id === connectedAccountId
                ? 'border-accent bg-accent/5'
                : 'border-gray-200'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-medium">
                {accountDisplayName(account)}
              </div>
              {account.id === connectedAccountId ? (
                <span className="text-xs font-semibold uppercase tracking-wide rounded-full bg-accent text-white px-2 py-0.5">
                  {t('payment_connect_default_badge')}
                </span>
              ) : null}
            </div>
            <div className="text-xs text-gray-500">
              {account.id}
              {account.connectStatus ? ` · ${account.connectStatus}` : ''}
            </div>
            {renderAccountConnectBanner(account.id)}
            <div className="flex flex-wrap gap-2">
              {account.id !== connectedAccountId ? (
                <Button
                  onClick={() => handleSetDefaultStripeAccount(account.id)}
                  variant="inline"
                  size="small"
                  isFullWidth={false}
                >
                  {t('payment_connect_set_default')}
                </Button>
              ) : null}
              <Button
                onClick={() => handleRenameStripeAccount(account.id)}
                variant="inline"
                size="small"
                isFullWidth={false}
              >
                Rename
              </Button>
              <Button
                onClick={() => handleDisconnectStripeAccount(account.id)}
                variant="inline"
                size="small"
                isFullWidth={false}
              >
                {t('payment_connect_disconnect_action')}
              </Button>
            </div>
          </div>
        ))}
        {connectedAccounts.length > 0 ? (
          <button
            type="button"
            onClick={() => router.push(`/stripe-connect?returnTo=${returnTo}`)}
            className="w-fit text-sm underline text-gray-600"
          >
            {t('payment_connect_another_account')}
          </button>
        ) : null}
      </div>
      <AlertDialog
        open={pendingStripeDisconnectId != null}
        onOpenChange={(open) => {
          if (!open) setPendingStripeDisconnectId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingStripeDisconnectId === connectedAccountId
                ? t('payment_connect_disconnect_confirm')
                : t('payment_connect_disconnect_action')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStripeDisconnectId === connectedAccountId
                ? t('payment_connect_disconnect_default')
                : t('payment_connect_disconnect_confirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const accountId = pendingStripeDisconnectId;
                if (!accountId) return;
                void confirmDisconnectStripeAccount(accountId);
              }}
            >
              {t('payment_connect_disconnect_action')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={stripeDisconnectWarning != null}
        onOpenChange={(open) => {
          if (!open) setStripeDisconnectWarning(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {stripeDisconnectWarning?.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {stripeDisconnectWarning?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>
              {t('payment_connect_disconnect_assigned_ok')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PaymentConnectPanel;
