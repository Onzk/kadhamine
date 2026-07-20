import { TextClassContext } from '@/components/rn-ui/text';
import { cn } from '@/lib/utils';
import type { Icon as PhosphorIcon, IconProps } from 'phosphor-react-native';
import { cssInterop } from 'nativewind';
import * as React from 'react';

type AppIconProps = IconProps & {
  as: PhosphorIcon;
  className?: string;
};

function IconImpl({ as: IconComponent, ...props }: AppIconProps) {
  return <IconComponent {...props} />;
}

cssInterop(IconImpl, {
  className: {
    target: 'style',
    nativeStyleToProp: {
      height: 'size',
      width: 'size',
    },
  },
});

/**
 * Wrapper Phosphor + NativeWind `className`.
 */
function Icon({
  as: IconComponent,
  className,
  size = 14,
  weight = 'regular',
  ...props
}: AppIconProps) {
  const textClass = React.useContext(TextClassContext);
  return (
    <IconImpl
      as={IconComponent}
      className={cn('text-foreground', textClass, className)}
      size={size}
      weight={weight}
      {...props}
    />
  );
}

export { Icon };
export type { PhosphorIcon as AppIcon, IconProps as AppIconProps };
