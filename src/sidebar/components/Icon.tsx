import React from 'react';
import { SvgIconComponent } from '@mui/icons-material';

interface IconProps {
  icon: SvgIconComponent;
  size?: 'xs' | 'sm' | 'lg' | '1x' | '2x';
  style?: React.CSSProperties;
  color?: string;
}

export const Icon: React.FC<IconProps> = ({ icon: IconComponent, size = '1x', style, color }) => {
  const getSizeInPx = (size: string) => {
    switch (size) {
      case 'xs':
        return 12;
      case 'sm':
        return 14;
      case '1x':
        return 16;
      case 'lg':
        return 20;
      case '2x':
        return 24;
      default:
        return 16;
    }
  };

  return (
    <IconComponent
      style={{
        fontSize: getSizeInPx(size),
        color,
        ...style,
      }}
    />
  );
};
