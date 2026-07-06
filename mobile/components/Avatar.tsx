import { View, Image, ImageStyle, ViewStyle, StyleSheet } from 'react-native'

interface AvatarProps {
  uri?: string
  size?: number
  style?: ViewStyle
  imageStyle?: ImageStyle
}

export function Avatar({ uri, size = 40, style, imageStyle }: AvatarProps) {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
            },
            imageStyle,
          ]}
        />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size }]}>
          <View style={[styles.placeholderInner, { width: size / 2, height: size / 2 }]} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderInner: {
    backgroundColor: '#9ca3af',
    borderRadius: 9999,
  },
})
