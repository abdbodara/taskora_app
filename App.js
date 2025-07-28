import {StyleSheet, Text, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Colors} from './src/utils/colors';
import NetInfo from '@react-native-community/netinfo';

const Stack = createNativeStackNavigator();

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        const userData = await AsyncStorage.getItem('userData');
        setIsLoggedIn(!!userToken && !!userData);
      } catch (error) {
        console.error(
          'App.js - Error checking login status:-=-=-=-=-=-=-=-=-',
          error,
        );
        setIsLoggedIn(false);
      }
    };
    checkLoginStatus();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  if (isLoggedIn === null) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isLoggedIn ? 'HomeScreen' : 'LoginScreen'}
        screenOptions={{headerShown: false}}>
        <Stack.Screen name="LoginScreen">
          {props => <LoginScreen {...props} isConnected={isConnected} />}
        </Stack.Screen>
        <Stack.Screen name="HomeScreen">
          {props => <HomeScreen {...props} isConnected={isConnected} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.white,
    fontSize: 18,
  },
});