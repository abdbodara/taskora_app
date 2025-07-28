import { SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Colors } from '../utils/colors'

const ScreenWrapper = ({ children }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      {children}
    </SafeAreaView>
  )
}


export default ScreenWrapper

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
})