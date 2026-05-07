import { useEffect } from 'react';

import { useTranslations } from 'next-intl';

import { useConfig } from '../../hooks/useConfig';
import { CloserCurrencies, Price } from '../../types';
import { Button, Card, ErrorMessage, Heading } from '../ui';

interface Props {
  isPartialCreditsPayment?: boolean;
  priceInCredits?: number;
  maxNightsToPayWithCredits?: number;
  useCredits?: boolean;
  rentalFiat?: Price<CloserCurrencies>;
  rentalToken?: Price<CloserCurrencies>;
  className?: string;
  applyCredits?: () => Promise<void>;
  hasAppliedCredits?: boolean;
  creditsError?: string | null | undefined;
  isLoading?: boolean;
  isDemo?: boolean;
  disabled?: boolean;
}

const RedeemCredits = ({
  isPartialCreditsPayment,
  maxNightsToPayWithCredits,
  priceInCredits,
  useCredits,
  className,
  rentalFiat,
  rentalToken,
  applyCredits,
  hasAppliedCredits,
  creditsError,
  isLoading,
  isDemo,
  disabled,
}: Props) => {
  const t = useTranslations();
  const { APP_NAME } = useConfig();

  const shouldShowCreditsCalculation =
    (!hasAppliedCredits &&
      !useCredits &&
      (rentalFiat?.val || rentalToken?.val)) ||
    isDemo;

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7263/ingest/72e0e0bd-d68c-438d-9c13-d9d55e54313e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'871e9b'},body:JSON.stringify({sessionId:'871e9b',runId:'initial',hypothesisId:'H4',location:'RedeemCredits:index.tsx:shouldShowCreditsCalculation',message:'redeem credits render branch evaluation',data:{hasAppliedCredits,useCredits,rentalFiatVal:rentalFiat?.val,rentalTokenVal:rentalToken?.val,isDemo,shouldShowCreditsCalculation,isShowingAppliedState:!shouldShowCreditsCalculation},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, [
    hasAppliedCredits,
    useCredits,
    rentalFiat?.val,
    rentalToken?.val,
    isDemo,
    shouldShowCreditsCalculation,
  ]);

  return (
    <div className={`${className ? className : ''}`}>
      {isDemo && (
        <Heading level={4} className="mb-8">
          This block will appear on Checkout page:{' '}
        </Heading>
      )}
      <Card className="text-center gap-4">
        {shouldShowCreditsCalculation ? (
          <>
            <Heading level={2}>
              {t('carrots_heading_redeem')} {isDemo && '[DEMO]'}
            </Heading>
            <Heading level={2} className="text-6xl">
              {t('carrots_balance')}
            </Heading>

            <p className="mb-4">{t('carrots_get_discount')}</p>
            <div className="flex w-full justify-center items-center mb-6">
              <div className="w-2/5">
                <Heading level={4}>
                  {isDemo && 1}
                  {!isDemo && (priceInCredits ?? rentalToken?.val)}
                </Heading>
                <div className="text-xs">
                  {(rentalToken?.val as number) === 1 || isDemo
                    ? APP_NAME && t('carrots_carrots_to_redeem_singular')
                    : t('carrots_carrots_to_redeem')}
                </div>
              </div>

              <>
                <div className="w-1/10">
                  <Heading level={4}>=</Heading>
                </div>
                <div className="w-2/5">
                  <Heading level={4}>{maxNightsToPayWithCredits}</Heading>
                  <div className="text-xs">
                    {t('carrots_off_accommodation')}
                  </div>
                </div>
              </>
            </div>

            {!isDemo && (
              <Button
                onClick={applyCredits}
                isEnabled={!disabled}
                isLoading={isLoading}
              >
                {t('carrots_button_apply_discount')}
              </Button>
            )}
          </>
        ) : (
          <div className="text-system-success font-bold">
            🥕{' '}
            {isPartialCreditsPayment
              ? priceInCredits
              : (rentalToken?.val as number)}{' '}
            {(isPartialCreditsPayment && Number(priceInCredits) === 1) ||
            (!isPartialCreditsPayment && (rentalToken?.val as number) === 1)
              ? t('carrots_success_message_singular')
              : t('carrots_success_message')}
          </div>
        )}
        {creditsError && <ErrorMessage error={creditsError} />}
      </Card>
    </div>
  );
};

export default RedeemCredits;
