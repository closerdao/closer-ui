import type { LucideIcon } from 'lucide-react';
import {
  Calendar,
  Heart,
  Home,
  Leaf,
  MapPin,
  Shield,
  Sparkles,
  Star,
  Sun,
  Users,
  Utensils,
  Wifi,
  Zap,
} from 'lucide-react';

export type FeatureBlockIconId =
  | 'home'
  | 'users'
  | 'leaf'
  | 'calendar'
  | 'star'
  | 'shield'
  | 'heart'
  | 'zap'
  | 'sun'
  | 'mapPin'
  | 'wifi'
  | 'utensils'
  | 'sparkles';

export const FEATURE_BLOCK_ICONS: {
  id: FeatureBlockIconId;
  Icon: LucideIcon;
}[] = [
  { id: 'home', Icon: Home },
  { id: 'users', Icon: Users },
  { id: 'leaf', Icon: Leaf },
  { id: 'calendar', Icon: Calendar },
  { id: 'star', Icon: Star },
  { id: 'shield', Icon: Shield },
  { id: 'heart', Icon: Heart },
  { id: 'zap', Icon: Zap },
  { id: 'sun', Icon: Sun },
  { id: 'mapPin', Icon: MapPin },
  { id: 'wifi', Icon: Wifi },
  { id: 'utensils', Icon: Utensils },
  { id: 'sparkles', Icon: Sparkles },
];

export const FEATURE_BLOCK_ICON_MAP = Object.fromEntries(
  FEATURE_BLOCK_ICONS.map(({ id, Icon }) => [id, Icon]),
) as Record<FeatureBlockIconId, LucideIcon>;

export type FeatureVisualType = 'photo' | 'icon' | 'emoji' | 'none';

export const resolveFeatureVisualType = (item: {
  visualType?: FeatureVisualType;
  imageUrl?: string;
}): FeatureVisualType => {
  if (item.visualType) return item.visualType;
  if (item.imageUrl?.trim()) return 'photo';
  return 'none';
};
