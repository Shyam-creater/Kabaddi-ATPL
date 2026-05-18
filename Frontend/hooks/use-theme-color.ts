import { useColorScheme } from 'react-native';

type ThemeProps = {
  light?: string;
  dark?: string;
};

export function useThemeColor(
  props: ThemeProps,
  colorName: 'background' | 'text'
) {
  const theme = useColorScheme() ?? 'light';

  const colors = {
    light: {
      background: '#FFFFFF',
      text: '#000000',
    },
    dark: {
      background: '#000000',
      text: '#FFFFFF',
    },
  };

  return props[theme] ?? colors[theme][colorName];
}
