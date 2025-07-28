import {useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useAuthToken = () => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      console.log('Fetched token:', storedToken); 
      setToken(storedToken);
    } catch (error) {
      console.error('Failed to load token', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();
  }, []);

  return {token, loading, refreshToken: fetchToken};
};

export default useAuthToken;
