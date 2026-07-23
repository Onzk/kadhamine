import React, { forwardRef, useState } from 'react';
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
import { Spacing } from '@/theme/tokens';
import { fontFamily } from '@/theme/typography';

/** Aligné sur AuthField `variant="light"` (login). */
const FIELD_RADIUS = 12;
const ICON_SIZE = 20;

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  /** Placeholder obligatoire. */
  placeholder: string;
  /** Called on keyboard submit (return/search key). */
  onSubmit?: () => void;
  returnKeyType?: TextInputProps['returnKeyType'];
  autoFocus?: boolean;
  /** Comfortable field height (default matches AuthField). */
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
 * Champ recherche — même chrome que les inputs login (`AuthField` light) :
 * surfaceCard, bordure fine, radius 12, focus orbit.
 */
export const SearchBar = forwardRef<TextInput, SearchBarProps>(function SearchBar(
  {
    value,
    onChangeText,
    placeholder,
    onSubmit,
    returnKeyType = 'search',
    autoFocus,
    height = 52,
    style,
    accessibilityLabel,
    onPress,
    editable,
  },
  ref,
) {
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);

  const isButton = onPress != null && editable !== true;
  const inputEditable = editable ?? !isButton;

  const borderColor = focused ? colors.orbit : colors.borderStrong;

  const containerStyle: StyleProp<ViewStyle> = [
    {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'stretch',
      width: '100%',
      backgroundColor: colors.surfaceCard,
      borderRadius: FIELD_RADIUS,
      borderWidth: 0.1,
      borderColor,
      paddingHorizontal: Spacing.four,
      minHeight: height,
      height,
      gap: Spacing.twoHalf,
      overflow: 'hidden',
    },
    style,
  ];

  const fieldTextStyle: TextStyle = {
    flex: 1,
    fontFamily: fontFamily('body'),
    fontSize: 16,
    lineHeight: 22.4,
    letterSpacing: -0.08,
    paddingVertical: Spacing.three,
    ...(Platform.OS === 'android' ? { includeFontPadding: false, textAlignVertical: 'center' } : null),
  };

  const icon = <MagnifyingGlass size={ICON_SIZE} color={colors.muted} weight="regular" />;

  const field = (
    <View style={containerStyle}>
      {icon}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        onSubmitEditing={onSubmit}
        returnKeyType={returnKeyType}
        autoFocus={autoFocus}
        editable={inputEditable}
        clearButtonMode="while-editing"
        selectionColor={colors.orbit}
        accessibilityLabel={accessibilityLabel ?? placeholder}
        accessibilityRole="search"
        pointerEvents={isButton ? 'none' : 'auto'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[fieldTextStyle, { color: colors.ink }]}
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
