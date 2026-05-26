import {
  FEATURE_BLOCK_ICON_MAP,
  type FeatureBlockIconId,
} from '../../constants/featureBlockIcons';

interface Props {
  iconId?: string;
  className?: string;
}

const FeatureBlockIcon = ({ iconId, className = 'w-10 h-10 text-accent' }: Props) => {
  if (!iconId) return null;
  const Icon = FEATURE_BLOCK_ICON_MAP[iconId as FeatureBlockIconId];
  if (!Icon) return null;
  return <Icon className={className} aria-hidden />;
};

export default FeatureBlockIcon;
