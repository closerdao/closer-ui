import { useConfig } from '../../hooks/useConfig';
import { CloserCurrencies, Price } from '../../types';
import { __, priceFormat } from '../../utils/helpers';
import { Button, Card, ErrorMessage, Heading } from '../ui';

interface Props {
  useCredits?: boolean;
  rentalFiat?: Price<CloserCurrencies>;
  rentalToken?: Price<CloserCurrencies>;
  className?: string;
  applyCredits?: () => Promise<void>;
  hasAppliedCredits?: boolean;
  creditsError?: string | null | undefined;
  isDemo?: boolean;
}

const RedeemCredits = ({
  useCredits,
  className,
  rentalFiat,
  rentalToken,
  applyCredits,
  hasAppliedCredits,
  creditsError,
  isDemo,
}: Props) => {
  const { APP_NAME } = useConfig();
  return (
    <div className={`${className ? className : ''}`}>
      {isDemo && (
        <Heading level={4} className="mb-8">
          This block will appear on Checkout page:{' '}
        </Heading>
      )}
      <Card className="text-center gap-4">
        {(!hasAppliedCredits && !useCredits && (rentalFiat?.val || rentalToken?.val)) ||
        isDemo ? (
          <>
            <Heading level={2}>
              {APP_NAME && __('carrots_heading_redeem', APP_NAME)}{' '}
              {isDemo && '[DEMO]'}
            </Heading>
            <Heading level={2} className="text-6xl">
              {APP_NAME && __('carrots_balance', APP_NAME)}
            </Heading>

            <p className="mb-4">{__('carrots_get_discount')}</p>
            <div className="flex w-full justify-center items-center mb-6">
              <div className="w-2/5">
                <Heading level={4}>
                  {isDemo ? 1 : (rentalToken?.val as number)}
                </Heading>
                <div className="text-xs">
                  {(rentalToken?.val as number) === 1 || isDemo
                    ? APP_NAME &&
                      __('carrots_carrots_to_redeem_singular', APP_NAME)
                    : APP_NAME && __('carrots_carrots_to_redeem', APP_NAME)}
                </div>
              </div>

              
                <>
                  <div className="w-1/10">
                    <Heading level={4}>=</Heading>
                  </div>
                  <div className="w-2/5">
                    <Heading level={4}>
                      {isDemo ? priceFormat(50) : priceFormat(rentalFiat)}
                    </Heading>
                    <div className="text-xs">
                      {__('carrots_off_accommodation')}
                    </div>
                  </div>
                </>
            
            </div>

            {!isDemo && (
              <Button onClick={applyCredits}>
                {__('carrots_button_apply_discount')}
              </Button>
            )}
          </>
        ) : (
          <div className="text-system-success font-bold">
            🥕 {rentalToken?.val as number}{' '}
            {(rentalToken?.val as number) === 1
              ? __(APP_NAME && 'carrots_success_message_singular', APP_NAME)
              : __(APP_NAME && 'carrots_success_message', APP_NAME)}
          </div>
        )}
        {creditsError && <ErrorMessage error={creditsError} />}
      </Card>
    </div>
  );
};

export default RedeemCredits;
