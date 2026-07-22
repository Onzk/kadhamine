import React from 'react';
import { type IconProps } from 'phosphor-react-native';
import { getCategoryIcon } from '@/lib/categoryTheme';

interface CategoryIconProps extends IconProps {
  icon?: string;
}

export function CategoryIcon({ icon, ...props }: CategoryIconProps) {
  const IconComponent = getCategoryIcon(icon);
  return <IconComponent {...props} />;
}

export { getCategoryIcon, getCategoryPastel, CATEGORY_PASTELS } from '@/lib/categoryTheme';
