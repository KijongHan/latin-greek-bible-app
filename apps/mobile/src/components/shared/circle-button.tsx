import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

type Props = {
  onPress: () => void;
  icon: ReactNode;
  style?: ViewStyle | ViewStyle[];
  disabled?: boolean;
};

export function CircleButton({ onPress, icon, style, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        style,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {icon}
    </Pressable>
  );
}

export function CircleContainer({
  icon,
  style,
}: {
  icon: ReactNode;
  style?: ViewStyle | ViewStyle[];
}) {
  return <View style={[styles.button, style]}>{icon}</View>;
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
});
