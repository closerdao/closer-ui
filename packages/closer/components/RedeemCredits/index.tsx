import { __, priceFormat } from '../../utils/helpers';
import { Button, Card, ErrorMessage, Heading } from '../ui';

interface Props {
  rentalFiat: { val: number; cur: string };
  rentalToken: { val: number; cur: string };
  className?: string;
  applyCredits: () => Promise<void>;
  hasAppliedCredits?: boolean;
  creditsError?: string | null | undefined;
}

const RedeemCredits = ({
  className,
  rentalFiat,
  rentalToken,
  applyCredits,
  hasAppliedCredits,
  creditsError,
}: Props) => {
  return (
    <div className={`${className ? className : ''}`}>
      <Card className="text-center gap-4">
        {!hasAppliedCredits ? (
          <>
            <Heading level={2}>{__('carrots_heading_redeem')}</Heading>
            <Heading level={2} className="text-6xl">
              🥕
            </Heading>

            <p className="mb-4">{__('carrots_get_discount')}</p>
            <div className="flex w-full justify-center items-center mb-6">
              <div className="w-2/5">
                <Heading level={4}>{rentalToken.val}</Heading>
                <div className="text-xs">{__('carrots_carrots_to_redeem')}</div>
              </div>
              <div className="w-1/10">
                <Heading level={4}>=</Heading>
              </div>
              <div className="w-2/5">
                <Heading level={4}>{priceFormat(rentalFiat)}</Heading>
                <div className="text-xs">{__('carrots_off_accommodation')}</div>
              </div>
            </div>
            <Button onClick={applyCredits}>
              {__('carrots_button_apply_discount')}
            </Button>
            <Button type="secondary" className="!text-accent">
              {__('carrots_button_save')}
            </Button>
          </>
        ) : creditsError ? (
            <ErrorMessage error={creditsError} />
        ) : (
          <div className="text-system-success font-bold">
            🥕 {rentalToken.val} {__('carrots_success_message')}
          </div>
        )}
      </Card>
    </div>
  );
};

export default RedeemCredits;
