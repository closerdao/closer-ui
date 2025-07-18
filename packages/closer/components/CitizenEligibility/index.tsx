import { useTranslations } from 'next-intl';

interface Props {
  userReports: any[];
  userSubscription: any;
  hasStayedForMinDuration: boolean;
  isVouched: boolean;
  owns30Tokens: boolean;
  minVouches: number;
  isSpaceHostVouchRequired?: boolean;
}

const CitizenEligibility = ({
  userReports,
  userSubscription,
  hasStayedForMinDuration,
  isVouched,
  owns30Tokens,
  minVouches,
  isSpaceHostVouchRequired,
}: Props) => {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      <p className="">{t('subscriptions_citizen_not_eligible_reason')}</p>

      <ul>
        <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
          {t('subscriptions_citizen_created_account')}
        </li>
        {userReports && userReports?.length > 0 ? (
          <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet-inactive.svg)] bg-no-repeat pl-6 mb-1.5">
            {t('subscriptions_citizen_no_reports')}
          </li>
        ) : (
          <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
            {t('subscriptions_citizen_no_reports')}
          </li>
        )}
        {userSubscription?.plan === 'citizen' && (
          <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
            {t('subscriptions_citizen_on_way_to_30_tokens')}
          </li>
        )}
        {hasStayedForMinDuration ? (
          <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
            {t('subscriptions_citizen_stayed_for_min_duration')}
          </li>
        ) : (
          <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet-inactive.svg)] bg-no-repeat pl-6 mb-1.5">
            {t('subscriptions_citizen_stayed_for_min_duration')}
          </li>
        )}
        {isVouched ? (
          <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
            {t('subscriptions_citizen_vouched_by_n_members', {
              var: minVouches,
          })} {isSpaceHostVouchRequired && t('subscriptions_citizen_space_host_vouch_required')}

          </li>
        ) : (
          <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet-inactive.svg)] bg-no-repeat pl-6 mb-1.5">
            {t('subscriptions_citizen_vouched_by_n_members', {
              var: minVouches,
            })} {isSpaceHostVouchRequired && t('subscriptions_citizen_space_host_vouch_required')}
          </li>
        )}
        {owns30Tokens && (
          <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
            {t('subscriptions_citizen_owns_30_tokens')}
          </li>
        )}
      </ul>

      <p className="">
        {t('subscriptions_citizen_report_mistake')}{' '}
        <a
          className="text-primary"
          href="mailto:space@traditionaldreamfactory.com"
        >
          space@traditionaldreamfactory.com
        </a>
      </p>
    </div>
  );
};

export default CitizenEligibility;
