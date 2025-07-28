import axios from 'axios';
import {Base_url, GetAllAssignTask, UpdateTaskStatus} from '../utils/api';

export const getAllAssignTaskApi = async token => {
  try {
    const url = `${Base_url}${GetAllAssignTask}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
  }
};

export const updateStatusOfTaskApi = async (token, newStatus, taskId) => {
  try {
    const url = `${Base_url}${UpdateTaskStatus}${taskId}`;
    const body = {
      status: newStatus,
    };
    const response = await axios.put(url, body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
  }
};


export const addCommentToTaskApi = async (token, taskId, content) => {
  try {
    const url = `${Base_url}/api/tasks/comments/${taskId}`;
    const body = {
      content,
    };
    const response = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || { message: 'Failed to add comment' };
  }
};
