import { ActivityIndicator, type ColorValue } from 'react-native';

export function LoadingSpinner({
  size = 'small',
  color,
}: {
  size?: 'small' | 'large' | number;
  color?: ColorValue;
}) {
  return <ActivityIndicator size={size} color={color} />;
}
