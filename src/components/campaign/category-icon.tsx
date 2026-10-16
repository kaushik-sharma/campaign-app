import {
  AtomIcon,
  BankIcon,
  ChartLineUpIcon,
  DotsThreeCircleIcon,
  GraduationCapIcon,
  HeartbeatIcon,
  LeafIcon,
  PaintBrushIcon,
  StorefrontIcon,
  UsersThreeIcon,
  type IconComponent,
} from '@/components/ui/icons';
import type { CategoryId } from '@/domain/types';

export const categoryIcons: Record<CategoryId, IconComponent> = {
  environment: LeafIcon,
  health: HeartbeatIcon,
  science: AtomIcon,
  education: GraduationCapIcon,
  'public-policy': BankIcon,
  'economic-policy': ChartLineUpIcon,
  community: UsersThreeIcon,
  'arts-culture': PaintBrushIcon,
  business: StorefrontIcon,
  other: DotsThreeCircleIcon,
};
