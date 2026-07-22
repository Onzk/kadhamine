import React from 'react';
import { type IconProps } from 'phosphor-react-native';
import { getCategoryVisual } from '@/lib/categoryTheme';

interface CategoryIconProps extends IconProps {
  icon?: string;
  slug?: string;
  label?: string;
}

export function CategoryIcon({ icon, slug, label, ...props }: CategoryIconProps) {
  const { Icon } = getCategoryVisual({ icon, slug, label });
  return <Icon {...props} />;
}

export {
  getCategoryIcon,
  getCategoryPastel,
  getCategoryVisual,
  resolveCategoryKey,
  CATEGORY_PASTELS,
} from '@/lib/categoryTheme';
