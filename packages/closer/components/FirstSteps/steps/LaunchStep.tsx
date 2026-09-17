import { FC } from 'react';

import { AlertTriangle, Check, Rocket } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  FirstStepId,
  getFirstStepDefinition,
} from '../../../constants/firstSteps';
import { Button } from '../../ui';

/**
 * What is still outstanding, why nothing is live yet, and the button that
 * changes that.
 *
 * Closer compiles config and theme into the site at build time, which is what
 * makes it fast and is also why an admin who has spent an hour on these
 * settings still sees none of them on their own homepage. Saying so plainly
 * here is the difference between a deploy button and a mystery.
 */

export interface LaunchStepProps {
  outstandingStepIds: FirstStepId[];
  onGoToStep: (id: FirstStepId) => void;
  onDeploy: () => void;
  isDeploying: boolean;
  hasDeployed: boolean;
}

const LaunchStep: FC<LaunchStepProps> = ({
  outstandingStepIds,
  onGoToStep,
  onDeploy,
  isDeploying,
  hasDeployed,
}) => {
  const t = useTranslations();

  return (
    <>
      {outstandingStepIds.length > 0 ? (
        <section className="rounded-md border border-dashed border-neutral-dark p-4">
          <p className="mb-2 flex items-center gap-2 font-bold">
            <AlertTriangle size={16} />
            {t('first_steps_launch_outstanding_title')}
          </p>
          <p className="mb-3 text-sm">
            {t('first_steps_launch_outstanding_description')}
          </p>
          <ul className="flex flex-col gap-1">
            {outstandingStepIds.map((id) => {
              const step = getFirstStepDefinition(id);
              if (!step) return null;
              return (
                <li key={id}>
                  <button
                    type="button"
                    className="text-sm underline"
                    onClick={() => onGoToStep(id)}
                  >
                    {t(step.titleKey)}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <p className="flex items-center gap-2 rounded-md bg-accent-light p-4">
          <Check size={16} />
          {t('first_steps_launch_all_done')}
        </p>
      )}

      <section className="flex flex-col gap-3">
        <Button
          size="medium"
          isFullWidth={false}
          isEnabled={!isDeploying}
          isLoading={isDeploying}
          dataTestid="first-steps-deploy"
          onClick={onDeploy}
        >
          <span className="flex items-center gap-2">
            <Rocket size={18} /> {t('first_steps_launch_deploy')}
          </span>
        </Button>

        {hasDeployed && (
          <p className="text-sm" data-testid="first-steps-deploy-started">
            {t('first_steps_launch_deploy_started')}
          </p>
        )}
      </section>
    </>
  );
};

export default LaunchStep;
