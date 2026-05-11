import { useState } from 'react';

import { useTranslations } from 'next-intl';

import type { SearchUserHit } from '../../utils/searchUser';
import Button from '../ui/Button';
import { CohousingUserSearchInput } from './cohousingUserSearchInput';
import { formatIsoFiatAmount } from '../../utils/currencyFormat';
import {
  COHOUSING_UNITS,
  type CohousingStepDef,
} from '../../constants/cohousingFlow';
import { FlowDisclaimer } from './cohousingFlowUi';
import { CohousingTdfQuiz } from './cohousingTdfQuiz';

export const QuizPanel = ({
  draftStorageKey,
  initialAnswers,
  onSubmit,
}: {
  draftStorageKey: string;
  initialAnswers?: Record<string, string>;
  onSubmit: (payload: {
    score: number;
    passed: boolean;
    answers: Record<string, string>;
  }) => Promise<void>;
}) => {
  return (
    <CohousingTdfQuiz
      draftStorageKey={draftStorageKey}
      initialAnswers={initialAnswers}
      onSubmit={onSubmit}
    />
  );
};

export const CosignerPanel = ({
  onSubmit,
  excludeUserId,
}: {
  onSubmit: (payload: {
    mode: 'solo' | 'duo';
    invitedName?: string;
    invitedEmail?: string;
    invitedUserId?: string;
  }) => void;
  excludeUserId?: string;
}) => {
  const t = useTranslations();
  const [mode, setMode] = useState<'pick' | 'solo' | 'duo'>('pick');
  const [selectedCosigner, setSelectedCosigner] = useState<SearchUserHit | null>(
    null,
  );
  const [sent, setSent] = useState(false);

  return (
    <div className="p-4 sm:p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
      {mode === 'pick' && (
        <div className="grid sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            className="text-left p-4 rounded-xl border border-gray-200 bg-white hover:border-accent transition-colors"
            onClick={() => setMode('solo')}
          >
            <div className="font-sans font-black text-gray-900 uppercase text-sm">
              {t('cohousing_cosigner_solo_title')}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {t('cohousing_cosigner_solo_sub')}
            </div>
          </button>
          <button
            type="button"
            className="text-left p-4 rounded-xl border border-gray-200 bg-white hover:border-accent transition-colors"
            onClick={() => setMode('duo')}
          >
            <div className="font-sans font-black text-gray-900 uppercase text-sm">
              {t('cohousing_cosigner_duo_title')}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {t('cohousing_cosigner_duo_sub')}
            </div>
          </button>
        </div>
      )}
      {mode === 'solo' && (
        <div className="space-y-3">
          <FlowDisclaimer tone="green">
            {t('cohousing_cosigner_solo_confirm')}
          </FlowDisclaimer>
          <div className="flex justify-end gap-2">
            <Button isFullWidth={false} variant="secondary" size="small" onClick={() => setMode('pick')}>
              {t('cohousing_flow_change')}
            </Button>
            <Button
              isFullWidth={false}
              size="small"
              onClick={() => onSubmit({ mode: 'solo' })}
            >
              {t('cohousing_flow_submit_step')}
            </Button>
          </div>
        </div>
      )}
      {mode === 'duo' && !sent && (
        <div className="space-y-3">
          <div className="block space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              {t('cohousing_cosigner_name_label')}
            </span>
            <CohousingUserSearchInput
              selectedUser={selectedCosigner}
              onSelect={setSelectedCosigner}
              onClear={() => setSelectedCosigner(null)}
              placeholder={t('cohousing_cosigner_name_ph')}
              loadingLabel={t('cohousing_cosigner_search_loading')}
              emptyLabel={t('cohousing_cosigner_search_empty')}
              noContactLabel={t('cohousing_cosigner_search_no_contact')}
              excludeUserIds={excludeUserId ? [excludeUserId] : undefined}
            />
          </div>
          <FlowDisclaimer tone="amber">{t('cohousing_cosigner_invite_note')}</FlowDisclaimer>
          <div className="flex justify-end gap-2">
            <Button isFullWidth={false} variant="secondary" size="small" onClick={() => setMode('pick')}>
              {t('cohousing_flow_cancel')}
            </Button>
            <Button
              isFullWidth={false}
              size="small"
              isEnabled={!!selectedCosigner}
              onClick={() => setSent(true)}
            >
              {t('cohousing_cosigner_send')}
            </Button>
          </div>
        </div>
      )}
      {mode === 'duo' && sent && selectedCosigner && (
        <div className="space-y-3">
          <FlowDisclaimer tone="green">
            {t('cohousing_cosigner_sent', {
              contact:
                selectedCosigner.email?.trim() ||
                selectedCosigner.screenname,
            })}
          </FlowDisclaimer>
          <div className="text-right">
            <Button
              isFullWidth={false}
              size="small"
              onClick={() =>
                onSubmit({
                  mode: 'duo',
                  invitedName: selectedCosigner.screenname,
                  invitedEmail: selectedCosigner.email?.trim() || '',
                  invitedUserId: selectedCosigner._id,
                })
              }
            >
              {t('cohousing_flow_submit_step')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export const FinancingPanel = ({
  onSubmit,
}: {
  onSubmit: (payload: { mode: string }) => void;
}) => {
  const t = useTranslations();
  const [choice, setChoice] = useState<string | null>(null);
  const slotsLeft = 3;

  return (
    <div className="p-4 sm:p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
      <div className="grid sm:grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => setChoice('cash')}
          className={`text-left p-4 rounded-xl border transition-colors ${
            choice === 'cash'
              ? 'border-accent bg-accent/10'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div className="font-sans font-black text-gray-900 uppercase text-sm">
            {t('cohousing_finance_cash_title')}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {t('cohousing_finance_cash_sub')}
          </div>
        </button>
        <button
          type="button"
          onClick={() => setChoice('financed')}
          className={`text-left p-4 rounded-xl border transition-colors ${
            choice === 'financed'
              ? 'border-accent bg-accent/10'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div className="font-sans font-black text-gray-900 uppercase text-sm">
            {t('cohousing_finance_financed_title')}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {t('cohousing_finance_financed_sub', { slots: slotsLeft })}
          </div>
        </button>
      </div>
      {choice === 'cash' && (
        <FlowDisclaimer tone="blue">{t('cohousing_finance_cash_note')}</FlowDisclaimer>
      )}
      {choice === 'financed' && (
        <>
          <FlowDisclaimer tone="amber">
            {t('cohousing_finance_financed_note')}
          </FlowDisclaimer>
          <FlowDisclaimer tone="red">{t('cohousing_finance_financed_risk')}</FlowDisclaimer>
        </>
      )}
      {choice && (
        <div className="text-right pt-1">
          <Button
            isFullWidth={false}
            size="small"
            onClick={() => {
              onSubmit({ mode: choice });
            }}
          >
            {t('cohousing_flow_submit_step')}
          </Button>
        </div>
      )}
    </div>
  );
};

export const CommitmentPanel = ({
  onSubmit,
  financingMode,
  onPoolAdd,
}: {
  onSubmit: (payload: {
    tier: 'low' | 'standard';
    topupAmount: number;
    topupRate: number;
    total: number;
    signed: boolean;
  }) => void;
  financingMode: string | null;
  onPoolAdd: (n: number) => void;
}) => {
  const t = useTranslations();
  const formatEurAmount = (amount: number) => formatIsoFiatAmount(amount || 0, 'EUR');
  const [tier, setTier] = useState<'low' | 'standard' | null>(null);
  const [topup, setTopup] = useState<number | 'custom' | 0>(0);
  const [topupCustom, setTopupCustom] = useState('');
  const [topupRate, setTopupRate] = useState(3);
  const [signed, setSigned] = useState(false);

  const reservation = tier === 'low' ? 25000 : tier === 'standard' ? 50000 : 0;
  const topupAmount =
    topup === 'custom'
      ? parseInt(topupCustom, 10) || 0
      : typeof topup === 'number'
        ? topup
        : 0;
  const total = reservation + topupAmount;

  return (
    <div className="p-4 sm:p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
          {t('cohousing_commit_reservation')}
        </span>
        <div className="grid sm:grid-cols-2 gap-2.5 mt-2">
          <button
            type="button"
            onClick={() => setTier('standard')}
            className={`text-left p-3 rounded-xl border ${
              tier === 'standard' ? 'border-accent bg-accent/10' : 'border-gray-200'
            }`}
          >
            <div className="font-sans font-black text-sm uppercase text-gray-900">
              {t('cohousing_commit_tier_standard')}
            </div>
            <div className="text-xs text-gray-600">{t('cohousing_commit_tier_standard_sub')}</div>
          </button>
          <button
            type="button"
            onClick={() => setTier('low')}
            className={`text-left p-3 rounded-xl border ${
              tier === 'low' ? 'border-accent bg-accent/10' : 'border-gray-200'
            }`}
          >
            <div className="font-sans font-black text-sm uppercase text-gray-900">
              {t('cohousing_commit_tier_low')}
            </div>
            <div className="text-xs text-gray-600">{t('cohousing_commit_tier_low_sub')}</div>
          </button>
        </div>
      </div>

      {tier && (
        <>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              {t('cohousing_commit_topup')}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              {([0, 50000, 100000, 'custom'] as const).map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => setTopup(v)}
                  className={`text-left p-2.5 rounded-lg border text-xs ${
                    topup === v ? 'border-accent bg-accent/10' : 'border-gray-200'
                  }`}
                >
                  <div className="font-sans font-black uppercase">
                    {v === 0
                      ? t('cohousing_commit_topup_none')
                      : v === 'custom'
                        ? t('cohousing_commit_topup_custom')
                        : `+€${(v as number) / 1000}k`}
                  </div>
                </button>
              ))}
            </div>
            {topup === 'custom' && (
              <input
                type="number"
                className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder={t('cohousing_commit_topup_custom_ph')}
                value={topupCustom}
                onChange={(e) => setTopupCustom(e.target.value)}
              />
            )}
            {topupAmount > 0 && (
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={0.25}
                  value={topupRate}
                  onChange={(e) => setTopupRate(parseFloat(e.target.value))}
                  className="flex-1 accent-accent"
                />
                <span className="text-sm font-sans tabular-nums font-bold bg-accent text-white px-3 py-1 rounded-full min-w-[4rem] text-center">
                  {topupRate.toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border-2 border-accent bg-accent/5">
            <span className="text-[10px] font-bold uppercase text-gray-500">
              {t('cohousing_commit_summary')}
            </span>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-gray-600">{t('cohousing_commit_reservation_line')}</span>
              <span className="font-sans tabular-nums font-bold">{formatEurAmount(reservation)}</span>
            </div>
            {topupAmount > 0 && (
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">{t('cohousing_commit_topup_line')}</span>
                <span className="font-sans tabular-nums font-bold">
                  {formatEurAmount(topupAmount)}
                </span>
              </div>
            )}
            <div className="border-t border-accent/30 my-2" />
            <div className="flex justify-between items-baseline">
              <span className="font-medium text-gray-900">{t('cohousing_commit_total')}</span>
              <span className="font-sans text-2xl font-black">{formatEurAmount(total)}</span>
            </div>
            {financingMode && (
              <p className="text-xs text-gray-500 mt-2">
                {t('cohousing_commit_mode_note', { mode: financingMode })}
              </p>
            )}
          </div>

          <FlowDisclaimer tone="amber">{t('cohousing_commit_mail_note')}</FlowDisclaimer>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1"
              checked={signed}
              onChange={(e) => setSigned(e.target.checked)}
            />
            <span className="text-sm text-gray-700">{t('cohousing_commit_signed_confirm')}</span>
          </label>

          <div className="text-right">
            <Button
              isFullWidth={false}
              size="small"
              isEnabled={signed}
              onClick={() => {
                onPoolAdd(total);
                if (!tier) {
                  return;
                }
                onSubmit({
                  tier,
                  topupAmount,
                  topupRate,
                  total,
                  signed,
                });
              }}
            >
              {t('cohousing_flow_submit_step')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export const UnitPanel = ({
  onSubmit,
}: {
  onSubmit: (payload: { ref: string }) => void;
}) => {
  const t = useTranslations();
  const [pick, setPick] = useState<string | null>(null);

  return (
    <div className="p-4 sm:p-5 bg-gray-50 rounded-xl border border-gray-200">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2.5">
        {COHOUSING_UNITS.map((u) => {
          const taken = u.status === 'taken';
          const sel = pick === u.ref;
          return (
            <button
              key={u.ref}
              type="button"
              disabled={taken}
              onClick={() => !taken && setPick(u.ref)}
              className={`text-left p-3 rounded-lg border transition-colors ${
                taken
                  ? 'opacity-45 cursor-not-allowed bg-gray-100'
                  : sel
                    ? 'border-accent bg-accent/10'
                    : 'border-gray-200 bg-white hover:border-accent'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-sans tabular-nums text-[11px] font-bold text-gray-900">
                  {u.ref}
                </span>
                {taken && (
                  <span className="text-[9px] uppercase font-bold text-gray-400">
                    {t('cohousing_unit_taken')}
                  </span>
                )}
                {sel && !taken && (
                  <span className="text-[9px] uppercase font-bold text-accent">
                    {t('cohousing_unit_pick')}
                  </span>
                )}
              </div>
              <div className="font-sans font-black text-sm uppercase text-gray-900">
                {u.type}
              </div>
              <div className="text-xs text-gray-600">{u.size}m²</div>
              <div className="text-[11px] text-gray-500 mt-1 leading-snug">
                {t(u.noteKey)}
              </div>
            </button>
          );
        })}
      </div>
      {pick && (
        <div className="mt-3 text-right">
          <Button
            isFullWidth={false}
            size="small"
            onClick={() => onSubmit({ ref: pick })}
          >
            {t('cohousing_unit_reserve', { ref: pick })}
          </Button>
        </div>
      )}
    </div>
  );
};

export const CitizenPanel = ({
  onSubmit,
}: {
  onSubmit: (payload: {
    acquired: number;
    vouches: number;
    path: string | null;
    complete: boolean;
  }) => void;
}) => {
  const t = useTranslations();
  const [status, setStatus] = useState<'select' | 'view'>('select');
  const [acquired, setAcquired] = useState(0);
  const [vouches, setVouches] = useState(0);
  const [path, setPath] = useState<string | null>(null);
  const tokensNeeded = 30;
  const vouchesNeeded = 3;

  if (status === 'select') {
    return (
      <div className="p-4 sm:p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
          {t('cohousing_citizen_where')}
        </span>
        {(
          [
            ['already', 'cohousing_citizen_opt_already_title', 'cohousing_citizen_opt_already_sub'],
            ['tokens', 'cohousing_citizen_opt_tokens_title', 'cohousing_citizen_opt_tokens_sub'],
            ['vouching', 'cohousing_citizen_opt_vouch_title', 'cohousing_citizen_opt_vouch_sub'],
            ['start', 'cohousing_citizen_opt_start_title', 'cohousing_citizen_opt_start_sub'],
          ] as const
        ).map(([v, tk, sk]) => (
          <button
            key={v}
            type="button"
            className="w-full text-left p-3 rounded-lg border border-gray-200 bg-white hover:border-accent"
            onClick={() => {
              if (v === 'already') {
                setAcquired(30);
                setVouches(3);
              }
              if (v === 'tokens') {
                setAcquired(12);
                setVouches(1);
              }
              if (v === 'vouching') {
                setAcquired(30);
                setVouches(1);
              }
              if (v === 'start') {
                setAcquired(0);
                setVouches(0);
              }
              setStatus('view');
            }}
          >
            <div className="font-sans font-black text-sm uppercase text-gray-900">
              {t(tk)}
            </div>
            <div className="text-xs text-gray-600">{t(sk)}</div>
          </button>
        ))}
      </div>
    );
  }

  const complete = acquired >= tokensNeeded && vouches >= vouchesNeeded;
  const tokensPct = Math.min(acquired / tokensNeeded, 1) * 100;
  const vouchesPct = Math.min(vouches / vouchesNeeded, 1) * 100;

  return (
    <div className="p-4 sm:p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
      <div
        className={`p-4 rounded-xl border-2 ${complete ? 'border-green-500 bg-green-50' : 'border-accent bg-accent/5'}`}
      >
        <span className="text-[10px] font-bold uppercase text-gray-500">
          {t('cohousing_citizen_status')}
        </span>
        <div className="font-sans text-2xl font-black uppercase text-gray-900 mt-1">
          {complete ? t('cohousing_citizen_done') : t('cohousing_citizen_progress')}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="p-3 rounded-lg border border-gray-200 bg-white">
          <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500">
            <span>{t('cohousing_citizen_tokens')}</span>
            <span className="font-sans tabular-nums">
              {acquired}/{tokensNeeded}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-200 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${acquired >= tokensNeeded ? 'bg-green-500' : 'bg-accent'}`}
              style={{ width: `${tokensPct}%` }}
            />
          </div>
        </div>
        <div className="p-3 rounded-lg border border-gray-200 bg-white">
          <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500">
            <span>{t('cohousing_citizen_vouches')}</span>
            <span className="font-sans tabular-nums">
              {vouches}/{vouchesNeeded}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-200 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${vouches >= vouchesNeeded ? 'bg-green-500' : 'bg-accent'}`}
              style={{ width: `${vouchesPct}%` }}
            />
          </div>
        </div>
      </div>
      {acquired < tokensNeeded && (
        <div className="grid sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPath('outright')}
            className={`p-3 rounded-xl border text-left ${path === 'outright' ? 'border-accent bg-accent/10' : 'border-gray-200'}`}
          >
            <div className="font-sans font-black text-xs uppercase">{t('cohousing_citizen_buy')}</div>
            <div className="text-[11px] text-gray-600">{t('cohousing_citizen_buy_sub')}</div>
          </button>
          <button
            type="button"
            onClick={() => setPath('finance')}
            className={`p-3 rounded-xl border text-left ${path === 'finance' ? 'border-accent bg-accent/10' : 'border-gray-200'}`}
          >
            <div className="font-sans font-black text-xs uppercase">{t('cohousing_citizen_finance')}</div>
            <div className="text-[11px] text-gray-600">{t('cohousing_citizen_finance_sub')}</div>
          </button>
        </div>
      )}
      {path && acquired < tokensNeeded && (
        <div className="text-right">
          <Button isFullWidth={false} size="small" variant="secondary" onClick={() => setAcquired(tokensNeeded)}>
            {t('cohousing_citizen_simulate_tokens')}
          </Button>
        </div>
      )}
      {acquired >= tokensNeeded && vouches < vouchesNeeded && (
        <Button
          isFullWidth={false}
          size="small"
          variant="secondary"
          onClick={() => setVouches(vouchesNeeded)}
        >
          {t('cohousing_citizen_simulate_vouches')}
        </Button>
      )}
      <FlowDisclaimer tone="green">{t('cohousing_citizen_bonus_note')}</FlowDisclaimer>
      <div className="flex justify-end gap-2 flex-wrap">
        {!complete && (
          <Button isFullWidth={false} variant="secondary" size="small" onClick={() => setStatus('select')}>
            {t('cohousing_flow_change')}
          </Button>
        )}
        <Button
          isFullWidth={false}
          size="small"
          onClick={() =>
            onSubmit({
              acquired,
              vouches,
              path,
              complete,
            })
          }
        >
          {t('cohousing_flow_submit_step')}
        </Button>
      </div>
    </div>
  );
};

export const DesignLockPanel = ({
  onSubmit,
  mode,
}: {
  onSubmit: (payload: { dropout: boolean; mode: string | null }) => void;
  mode: string | null;
}) => {
  const t = useTranslations();
  const [dropout, setDropout] = useState(false);

  return (
    <div className="p-4 sm:p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="p-3 rounded-lg border border-accent/40 bg-accent/5">
          <span className="text-[10px] font-bold uppercase text-accent">{t('cohousing_dlock_commit')}</span>
          <ul className="text-xs text-gray-700 mt-2 space-y-1 list-disc pl-4">
            <li>{t('cohousing_dlock_commit_1')}</li>
            <li>{t('cohousing_dlock_commit_2')}</li>
            <li>
              {mode === 'financed'
                ? t('cohousing_dlock_commit_3f')
                : t('cohousing_dlock_commit_3c')}
            </li>
            <li>{t('cohousing_dlock_commit_4')}</li>
          </ul>
        </div>
        <div className="p-3 rounded-lg border border-blue-200 bg-blue-50">
          <span className="text-[10px] font-bold uppercase text-blue-800">{t('cohousing_dlock_drop')}</span>
          <p className="text-xs text-gray-700 mt-2">{t('cohousing_dlock_drop_body')}</p>
        </div>
      </div>
      <FlowDisclaimer tone="red">{t('cohousing_dlock_culture')}</FlowDisclaimer>
      <div className="flex justify-end gap-2">
        <Button isFullWidth={false} variant="secondary" size="small" onClick={() => setDropout(true)}>
          {t('cohousing_dlock_dropout')}
        </Button>
        <Button
          isFullWidth={false}
          size="small"
          onClick={() => onSubmit({ dropout, mode })}
        >
          {t('cohousing_flow_submit_step')}
        </Button>
      </div>
      {dropout && (
        <FlowDisclaimer tone="blue">{t('cohousing_dlock_dropout_note')}</FlowDisclaimer>
      )}
    </div>
  );
};

export const StagePanel = ({
  onSubmit,
  step,
  mode,
}: {
  onSubmit: (payload: {
    acknowledged: boolean;
    paid: boolean;
    mode: string | null;
    pct: number;
  }) => void;
  step: CohousingStepDef;
  mode: string | null;
}) => {
  const t = useTranslations();
  const [paid, setPaid] = useState(false);
  const pct = step.stagePct ?? 0;

  return (
    <div className="p-4 sm:p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
      <div className="p-3 rounded-lg border border-amber-300 bg-amber-50">
        <div className="flex justify-between items-baseline">
          <span className="text-[10px] font-bold uppercase text-amber-900">
            {t('cohousing_stage_due')}
          </span>
          <span className="text-[11px] text-amber-800 italic">{t(step.dateKey)}</span>
        </div>
        <div className="font-sans text-3xl font-black text-gray-900 mt-1">
          {pct}% {t('cohousing_stage_of_build')}
        </div>
        <p className="text-xs text-gray-600 mt-2">
          {mode === 'financed'
            ? t('cohousing_stage_financed')
            : t('cohousing_stage_cash')}
        </p>
      </div>
      <div className="text-right">
        {mode === 'financed' ? (
          <Button
            isFullWidth={false}
            size="small"
            onClick={() =>
              onSubmit({
                acknowledged: true,
                paid: true,
                mode,
                pct,
              })
            }
          >
            {t('cohousing_flow_submit_step')}
          </Button>
        ) : !paid ? (
          <Button isFullWidth={false} size="small" onClick={() => setPaid(true)}>
            {t('cohousing_stage_wired')}
          </Button>
        ) : (
          <Button
            isFullWidth={false}
            size="small"
            onClick={() =>
              onSubmit({
                acknowledged: true,
                paid: true,
                mode,
                pct,
              })
            }
          >
            {t('cohousing_flow_submit_step')}
          </Button>
        )}
      </div>
    </div>
  );
};

export const KeysPanel = ({
  onSubmit,
}: {
  onSubmit: (payload: { acknowledged: boolean }) => void;
}) => {
  const t = useTranslations();
  return (
    <div className="p-5 rounded-xl border-2 border-accent bg-accent/5 text-center space-y-3">
      <div className="font-sans text-3xl sm:text-4xl font-black text-accent uppercase tracking-tight">
        {t('cohousing_keys_title')}
      </div>
      <p className="text-sm text-gray-600 max-w-md mx-auto">{t('cohousing_keys_body')}</p>
      <div className="text-left text-xs text-gray-600 max-w-md mx-auto p-3 bg-white rounded-lg border border-gray-200">
        {t('cohousing_keys_ongoing')}
      </div>
      <Button
        isFullWidth={false}
        size="small"
        onClick={() => onSubmit({ acknowledged: true })}
      >
        {t('cohousing_flow_submit_step')}
      </Button>
    </div>
  );
};

export const TeamWaitingInline = ({
  step,
  onAdvance,
}: {
  step: CohousingStepDef;
  onAdvance: () => void;
}) => {
  const t = useTranslations();
  return (
    <div className="p-3 rounded-lg border border-blue-200 bg-blue-50 flex flex-wrap justify-between items-center gap-3">
      <div>
        <div className="font-sans text-sm font-black text-blue-900 uppercase">
          {t('cohousing_team_wait_title')}
        </div>
        <div className="text-xs text-gray-600 mt-1">
          {t('cohousing_team_wait_sub', {
            action: step.teamActionKey ? t(step.teamActionKey) : '',
          })}
        </div>
      </div>
      <Button isFullWidth={false} variant="secondary" size="small" onClick={onAdvance}>
        {t('cohousing_team_simulate')}
      </Button>
    </div>
  );
};
