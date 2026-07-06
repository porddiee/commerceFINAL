import { View, Text, StyleSheet } from 'react-native'

interface EmptyStateProps {
  title: string
  description?: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.icon} />
      <Text style={styles.title}>{title}</Text>
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 16,
  },
  icon: {
    width: 64,
    height: 64,
    backgroundColor: '#e5e7eb',
    borderRadius: 9999,
    marginBottom: 16,
  },
  title: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 18,
    marginBottom: 8,
  },
  description: {
    color: '#6b7280',
    textAlign: 'center',
    fontSize: 14,
  },
})
