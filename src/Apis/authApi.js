import axios from 'axios';
import {Base_url, Login} from '../utils/api';

export const LoginApi = async (data) => {
  try {
    const url = `${Base_url}${Login}`;
    const body = {
      email: data?.email,
      password: data?.password,
    };
    const response = await axios.post(url, body);
    return response?.data
  } catch (error) {
    throw error?.response?.data;
  }
};
