import { View, Text, StyleSheet } from 'react-native'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/Button'

export default function ProfileScreen() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatar} />
      <Text style={styles.name}>
        {user?.user_metadata?.full_name || 'User'}
      </Text>
      <Text style={styles.email}>{user?.email}</Text>
      
      <Button
        title="Sign Out"
        onPress={handleSignOut}
        variant="destructive"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    backgroundColor: '#e5e7eb',
    borderRadius: 40,
    marginBottom: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  email: {
    color: '#6b7280',
    marginBottom: 32,
  },
})
