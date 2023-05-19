import { CloserCurrencies, Price } from '../../types';
import { __, priceFormat } from '../../utils/helpers';
import { Button, Card, ErrorMessage, Heading } from '../ui';

interface Props {
  rentalFiat?: Price<CloserCurrencies>;
  rentalToken?: Price<CloserCurrencies>;
  className?: string;
  applyCredits?: () => Promise<void>;
  hasAppliedCredits?: boolean;
  creditsError?: string | null | undefined;
  isDemo?: boolean;
}

const RedeemCredits = ({
  className,
  rentalFiat,
  rentalToken,
  applyCredits,
  hasAppliedCredits,
  creditsError,
  isDemo,
}: Props) => {
  return (
    <div className={`${className ? className : ''}`}>
      <Card className="text-center gap-4">
        {(!hasAppliedCredits && rentalFiat?.val) || isDemo ? (
          <>
            <Heading level={2}>
              {__('carrots_heading_redeem')} {isDemo && '[DEMO]'}
            </Heading>
            <Heading level={2} className="text-6xl">
              🥕
            </Heading>

            <p className="mb-4">{__('carrots_get_discount')}</p>
            <div className="flex w-full justify-center items-center mb-6">
              <div className="w-2/5">
                <Heading level={4}>{isDemo ? 1 : rentalToken?.val}</Heading>
                <div className="text-xs">{__('carrots_carrots_to_redeem')}</div>
              </div>
              <div className="w-1/10">
                <Heading level={4}>=</Heading>
              </div>
              <div className="w-2/5">
                <Heading level={4}>
                  {isDemo ? priceFormat(60) : priceFormat(rentalFiat)}
                </Heading>
                <div className="text-xs">{__('carrots_off_accommodation')}</div>
              </div>
            </div>
            <Button onClick={applyCredits}>
              {__('carrots_button_apply_discount')}
            </Button>
            {/* <Button type="secondary" className="!text-accent">
              {__('carrots_button_save')}
            </Button> */}
          </>
        ) : (
          <div className="text-system-success font-bold">
            🥕 {rentalToken?.val} {__('carrots_success_message')}
          </div>
        )}
        {creditsError && <ErrorMessage error={creditsError} />}
      </Card>
    </div>
  );
};

export default RedeemCredits;
