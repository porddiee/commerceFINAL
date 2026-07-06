import { View, Text, StyleSheet } from 'react-native'

export default function CreateScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Listing</Text>
      <Text style={styles.subtitle}>Create listing coming soon</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#6b7280',
    marginTop: 8,
  },
})
