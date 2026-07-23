import React, { forwardRef } from 'react';
import {
  Platform,
  Pressable,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { MagnifyingGlass } from 'phosphor-react-native';

import { useAppTheme } from '@/providers/ThemeProvider';
import { getInvertedInputColors, Radius, Spacing } from '@/theme/tokens';
import { fontFamily } from '@/theme/typography';

const ICON_SIZE = 18;
const FONT_SIZE = 15;
const LINE_HEIGHT = 20;

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** Called on keyboard submit (return/search key). */
  onSubmit?: () => void;
  returnKeyType?: TextInputProps['returnKeyType'];
  autoFocus?: boolean;
  /** Comfortable pill height. */
  height?: number;
  /** Pass-through container style override. */
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  /**
   * When provided, the bar acts as a button (non-editable) that runs this
   * handler on press — e.g. a home-screen entry point that navigates to Search.
   * Combine with `editable={false}` (the default when `onPress` is set).
   */
  onPress?: () => void;
  /** Defaults to true; set false (or provide `onPress`) to render a tappable, non-editable bar. */
  editable?: boolean;
}

/**
 * Reusable search field with an inverted color scheme relative to the theme:
 * - Light (day) mode: black background, white text/icon/placeholder.
 * - Dark (night) mode: white background, black text/icon/placeholder.
 *
 * No border, no shadow, no elevation. Pill shape.
 *
 * Button mode (`onPress`) and editable mode share identical layout tokens so the
 * bar looks the same everywhere — only interaction differs.
 */
export const SearchBar = forwardRef<TextInput, SearchBarProps>(function SearchBar(
  {
    value,
    onChangeText,
    placeholder,
    onSubmit,
    returnKeyType = 'search',
    autoFocus,
    height = 48,
    style,
    accessibilityLabel,
    onPress,
    editable,
  },
  ref,
) {
  const { isDark } = useAppTheme();
  const { background: bg, foreground: fg, placeholder: placeholderColor } = getInvertedInputColors(isDark);

  // Button mode: when an onPress is supplied (and not explicitly editable),
  // the bar becomes a tappable, non-editable entry point.
  const isButton = onPress != null && editable !== true;
  const inputEditable = editable ?? !isButton;

  const containerStyle: StyleProp<ViewStyle> = [
    {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'stretch',
      width: '100%',
      backgroundColor: bg,
      borderRadius: Radius.pill,
      paddingHorizontal: Spacing.five,
      height,
      gap: Spacing.twoHalf,
      overflow: 'hidden',
    },
    style,
  ];

  const fieldTextStyle: TextStyle = {
    flex: 1,
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    fontFamily: fontFamily('body', 'regular'),
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
  };

  const icon = <MagnifyingGlass size={ICON_SIZE} color={fg} />;

  const field = (
    <View style={containerStyle}>
      {icon}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        onSubmitEditing={onSubmit}
        returnKeyType={returnKeyType}
        autoFocus={autoFocus}
        editable={inputEditable}
        clearButtonMode="while-editing"
        selectionColor={fg}
        accessibilityLabel={accessibilityLabel ?? placeholder}
        accessibilityRole="search"
        pointerEvents={isButton ? 'none' : 'auto'}
        style={[
          fieldTextStyle,
          {
            color: fg,
            paddingVertical: 0,
            ...(Platform.OS === 'android' ? { textAlignVertical: 'center' } : null),
          },
        ]}
      />
    </View>
  );

  if (isButton) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="search"
        accessibilityLabel={accessibilityLabel ?? placeholder}
        style={({ pressed }) => [
          { alignSelf: 'stretch', width: '100%' },
          { opacity: pressed ? 0.9 : 1 },
        ]}
      >
        {field}
      </Pressable>
    );
  }

  return field;
});
