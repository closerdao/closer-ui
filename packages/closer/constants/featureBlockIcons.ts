import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Building2,
  Calendar,
  Check,
  Droplets,
  FileSpreadsheet,
  FileText,
  Heart,
  Home,
  Landmark,
  Leaf,
  Map,
  MapPin,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Sun,
  Users,
  Utensils,
  Wallet,
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
  | 'sparkles'
  | 'barChart'
  | 'building'
  | 'check'
  | 'droplets'
  | 'fileSpreadsheet'
  | 'fileText'
  | 'landmark'
  | 'map'
  | 'rocket'
  | 'wallet';

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
  { id: 'barChart', Icon: BarChart3 },
  { id: 'building', Icon: Building2 },
  { id: 'check', Icon: Check },
  { id: 'droplets', Icon: Droplets },
  { id: 'fileSpreadsheet', Icon: FileSpreadsheet },
  { id: 'fileText', Icon: FileText },
  { id: 'landmark', Icon: Landmark },
  { id: 'map', Icon: Map },
  { id: 'rocket', Icon: Rocket },
  { id: 'wallet', Icon: Wallet },
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
