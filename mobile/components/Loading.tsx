import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native'

interface LoadingProps {
  size?: 'small' | 'large'
  style?: ViewStyle
}

export function Loading({ size = 'large', style }: LoadingProps) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color="#3b82f6" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
})
