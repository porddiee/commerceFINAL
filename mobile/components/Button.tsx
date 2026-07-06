import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle, StyleSheet, View } from 'react-native'

interface ButtonProps {
  onPress: () => void
  title: string
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline'
  size?: 'default' | 'sm' | 'lg'
  disabled?: boolean
  loading?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
}

export function Button({
  onPress,
  title,
  variant = 'primary',
  size = 'default',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primary
      case 'secondary':
        return styles.secondary
      case 'destructive':
        return styles.destructive
      case 'outline':
        return styles.outline
      default:
        return styles.primary
    }
  }

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return styles.small
      case 'lg':
        return styles.large
      default:
        return styles.default
    }
  }

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.outlineText
      default:
        return styles.whiteText
    }
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[style, disabled && styles.disabled]}
      activeOpacity={0.7}
    >
      <View style={[styles.button, getVariantStyle(), getSizeStyle()]}>
        {loading ? (
          <ActivityIndicator color={variant === 'outline' ? '#3b82f6' : '#ffffff'} />
        ) : (
          <Text style={[styles.text, getTextStyle(), textStyle]}>{title}</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#3b82f6',
  },
  secondary: {
    backgroundColor: '#6b7280',
  },
  destructive: {
    backgroundColor: '#ef4444',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  default: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  small: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  text: {
    fontWeight: '600',
    fontSize: 16,
  },
  whiteText: {
    color: '#ffffff',
  },
  outlineText: {
    color: '#3b82f6',
  },
  disabled: {
    opacity: 0.5,
  },
})
