import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useAuthToken from '../hooks/useAuthToken';
import {
  getAllAssignTaskApi,
  updateStatusOfTaskApi,
  addCommentToTaskApi,
} from '../Apis/taskApi';
import CustomModal from '../components/CustomModal';
import ScreenWrapper from '../components/ScreenWrapper';
import useModal from '../hooks/useModal';

const formatDate = dateString => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const options = {day: 'numeric', month: 'long', year: 'numeric'};
  return date.toLocaleDateString('en-US', options);
};

const formatCommentDate = dateString => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const options = {hour: '2-digit', minute: '2-digit', hour12: true};
  return date.toLocaleTimeString('en-US', options);
};

const HomeScreen = ({isConnected}) => {
  const navigation = useNavigation();
  const {token, loading, refreshToken} = useAuthToken();
  const [allTasks, setAllTasks] = useState([]);
  const [statusUpdateModalVisible, setStatusUpdateModalVisible] =
    useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [isCommentUpdating, setIsCommentUpdating] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [isSyncingOfflineActions, setIsSyncingOfflineActions] = useState(false);

  const flatListRef = useRef(null);

  const statusOptions = [
    {value: 'pending', label: '⏳ Pending', color: '#facc15'},
    {value: 'in_progress', label: '🔄 In Progress', color: '#3b82f6'},
    {value: 'completed', label: '✅ Completed', color: '#22c55e'},
  ];

  const {
    modalVisible,
    modalType,
    modalTitle,
    modalMessage,
    showErrorModal,
    showSuccessModal,
    hideModal,
    getCurrentActions,
  } = useModal();

  useEffect(() => {
    if (token) {
      fetchTaskData();
    }
  }, [token]);

  useEffect(() => {
    if (isConnected) {
      syncOfflineActions();
    } else {
      console.error('Currently offline. Actions will be queued.');
    }
  }, [isConnected, token]);

  const storeOfflineAction = async (actionType, taskId, payload) => {
    try {
      const existingActions = await AsyncStorage.getItem('offlineActions');
      const actions = existingActions ? JSON.parse(existingActions) : [];
      actions.push({
        actionType,
        taskId,
        payload,
        timestamp: new Date().toISOString(),
      });
      await AsyncStorage.setItem('offlineActions', JSON.stringify(actions));
      console.log('Offline action stored:', {actionType, taskId, payload});
    } catch (error) {
      console.error('Error storing offline action:', error);
    }
  };

  const storeLocalTaskData = async taskData => {
    try {
      await AsyncStorage.setItem('localTaskData', JSON.stringify(taskData));
      console.log('Local task data stored successfully');
    } catch (error) {
      console.error('Error storing local task data:', error);
    }
  };

  const applyOfflineActionsToTasks = async tasks => {
    try {
      const existingActions = await AsyncStorage.getItem('offlineActions');
      if (!existingActions) return tasks;

      const actions = JSON.parse(existingActions);
      let updatedTasks = [...tasks];

      actions.forEach(action => {
        if (action.actionType === 'updateStatus') {
          updatedTasks = updatedTasks.map(task =>
            task.id === action.taskId
              ? {...task, status: action.payload.newStatus}
              : task,
          );
        } else if (action.actionType === 'addComment') {
          updatedTasks = updatedTasks.map(task =>
            task.id === action.taskId
              ? {
                  ...task,
                  comments: [
                    ...(task.comments || []),
                    {
                      id: `local-${action.timestamp}`,
                      content: action.payload.content,
                      createdAt: action.timestamp,
                      technicians: {name: 'You (Offline)'},
                    },
                  ],
                }
              : task,
          );
        }
      });

      return updatedTasks;
    } catch (error) {
      console.error('Error applying offline actions:', error);
      return tasks;
    }
  };

  const syncOfflineActions = async () => {
    if (!token || isSyncingOfflineActions) {
      return;
    }

    setIsSyncingOfflineActions(true);
    try {
      const existingActions = await AsyncStorage.getItem('offlineActions');
      if (!existingActions) {
        setIsSyncingOfflineActions(false);
        return;
      }

      let actions = JSON.parse(existingActions);
      if (actions.length === 0) {
        setIsSyncingOfflineActions(false);
        return;
      }

      console.log('Attempting to sync offline actions:', actions);
      const successfulActions = [];

      for (const action of actions) {
        try {
          let response;
          if (action.actionType === 'updateStatus') {
            response = await updateStatusOfTaskApi(
              token,
              action.payload.newStatus,
              action.taskId,
            );
          } else if (action.actionType === 'addComment') {
            response = await addCommentToTaskApi(
              token,
              action.taskId,
              action.payload.content,
            );
          }

          if (response?.success) {
            console.log('Offline action synced successfully:', action);
            successfulActions.push(action);
          } else {
            console.error('Failed to sync offline action:', action, response);
          }
        } catch (actionError) {
          console.error('Error during sync of action:', action, actionError);
        }
      }

      const remainingActions = actions.filter(
        action => !successfulActions.includes(action),
      );
      await AsyncStorage.setItem(
        'offlineActions',
        JSON.stringify(remainingActions),
      );

      if (successfulActions.length > 0) {
        await AsyncStorage.removeItem('localTaskData');
      }

      await fetchTaskData();
    } catch (error) {
      console.error('Error syncing offline actions:', error);
      showErrorModal(
        'Sync Failed',
        'Failed to sync offline actions. Please try again.',
        hideModal,
        null,
        'OK',
      );
    } finally {
      setIsSyncingOfflineActions(false);
    }
  };

  const fetchTaskData = async () => {
    try {
      if (isConnected) {
        const response = await getAllAssignTaskApi(token);

        if (response?.success === true || response?.data) {
          const taskData = response?.data;

          await AsyncStorage.setItem('taskData', JSON.stringify(taskData));

          const tasksWithOfflineActions = await applyOfflineActionsToTasks(
            taskData,
          );

          setAllTasks(tasksWithOfflineActions);

          await storeLocalTaskData(tasksWithOfflineActions);
        }
      } else {
        console.log('Fetching tasks from local storage (offline mode)');
        const localTaskData = await AsyncStorage.getItem('localTaskData');

        if (localTaskData) {
          setAllTasks(JSON.parse(localTaskData));
        } else {
          const originalTaskData = await AsyncStorage.getItem('taskData');
          if (originalTaskData) {
            const tasks = JSON.parse(originalTaskData);
            const tasksWithOfflineActions = await applyOfflineActionsToTasks(
              tasks,
            );
            setAllTasks(tasksWithOfflineActions);
            await storeLocalTaskData(tasksWithOfflineActions);
          } else {
            console.log('No local task data found.');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      const errorMessage =
        error?.message || 'Something went wrong. Please try again.';
      showErrorModal(
        'Failed to Load Tasks',
        errorMessage,
        handleLogout,
        () => {
          hideModal();
          fetchTaskData();
        },
        'Logout',
        'Try Again',
      );
    }
  };

  const updateTaskStatus = async (newStatus, taskId) => {
    setIsStatusUpdating(true);
    setStatusUpdateModalVisible(false);

    const updatedTasks = allTasks.map(task =>
      task.id === taskId ? {...task, status: newStatus} : task,
    );

    setAllTasks(updatedTasks);

    await storeLocalTaskData(updatedTasks);

    if (!isConnected) {
      await storeOfflineAction('updateStatus', taskId, {newStatus});
      setIsStatusUpdating(false);
      setSelectedTaskId(null);
      return;
    }

    try {
      const response = await updateStatusOfTaskApi(token, newStatus, taskId);

      if (!response?.success) {
        const revertedTasks = allTasks.map(task =>
          task.id === taskId ? {...task, status: 'pending'} : task,
        );
        setAllTasks(revertedTasks);
        await storeLocalTaskData(revertedTasks);
        throw new Error('Failed to update status');
      } else {
        await fetchTaskData();
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      showErrorModal(
        'Error',
        error?.message || 'Failed to update task status. Please try again.',
        () => hideModal(),
        () => hideModal(),
        'OK',
        'Cancel',
      );
    } finally {
      setIsStatusUpdating(false);
      setSelectedTaskId(null);
    }
  };

  const addComment = async (taskId, content) => {
    if (!content.trim()) {
      showErrorModal(
        'Error',
        'Comment cannot be empty.',
        hideModal,
        null,
        'OK',
      );
      return;
    }

    setIsCommentUpdating(true);

    const newComment = {
      id: `local-${Date.now()}`,
      content: content,
      createdAt: new Date().toISOString(),
      technicians: {name: 'You (Offline)'},
    };

    const updatedTasks = allTasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            comments: [...(task.comments || []), newComment],
          }
        : task,
    );

    setAllTasks(updatedTasks);
    setCommentText('');

    await storeLocalTaskData(updatedTasks);

    if (!isConnected) {
      await storeOfflineAction('addComment', taskId, {content});
      setIsCommentUpdating(false);
      setSelectedTaskId(null);
      return;
    }

    try {
      const response = await addCommentToTaskApi(token, taskId, content);

      if (!response?.success) {
        const revertedTasks = allTasks.map(task =>
          task.id === taskId
            ? {
                ...task,
                comments: (task.comments || []).filter(
                  c => c.id !== newComment.id,
                ),
              }
            : task,
        );
        setAllTasks(revertedTasks);
        await storeLocalTaskData(revertedTasks);
        throw new Error('Failed to add comment');
      } else {
        await fetchTaskData();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      showErrorModal(
        'Error',
        error?.message || 'Failed to add comment. Please try again.',
        () => hideModal(),
        () => hideModal(),
        'OK',
        'Cancel',
      );
    } finally {
      setIsCommentUpdating(false);
      setSelectedTaskId(null);
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'completed':
        return '#22c55e';
      case 'in_progress':
        return '#3b82f6';
      case 'pending':
      default:
        return '#facc15';
    }
  };

  const getStatusDisplay = status => {
    switch (status) {
      case 'completed':
        return '✅ Completed';
      case 'in_progress':
        return '🔄 In Progress';
      case 'pending':
      default:
        return '⏳ Pending';
    }
  };

  const showTaskRenderItem = ({item}) => {
    const sortedComments = item.comments
      ? [...item.comments].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        )
      : [];
    const isExpanded = expandedComments[item.id] || false;

    return (
      <View style={styles.taskCard}>
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle}>✨ {item.title}</Text>

          <TouchableOpacity
            onPress={() => {
              setSelectedTaskId(item.id);
              setStatusUpdateModalVisible(true);
            }}
            disabled={isStatusUpdating}
            style={styles.statusButton}>
            <Text
              style={[
                styles.taskText,
                styles.statusText,
                {color: getStatusColor(item.status)},
              ]}>
              {isStatusUpdating && selectedTaskId === item.id
                ? '🔄 Updating...'
                : getStatusDisplay(item.status)}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.taskDetails}>
          <Text style={styles.taskText}>🧾 {item.description}</Text>
          <Text style={styles.taskText}>🔥 Priority: {item.priority}</Text>
          <Text style={styles.taskText}>
            📅 Due: {formatDate(item.dueDate)}
          </Text>
        </View>
        <Text style={styles.taskMeta}>
          🕒 Created: {formatDate(item.createdAt)}
        </Text>
        <Text style={styles.taskMeta}>
          🟢 Updated: {formatDate(item.updatedAt)}
        </Text>

        {sortedComments.length > 0 && (
          <View style={styles.commentsSection}>
            <Text style={styles.sectionTitle}>Comments:</Text>
            {isExpanded
              ? sortedComments.map((comment, index) => (
                  <View key={index} style={styles.commentBubble}>
                    <View style={styles.commentLeft}>
                      <Text style={styles.commentAuthor}>
                        {comment?.technicians?.name || 'Unknown'}
                      </Text>
                      <Text style={styles.commentContent}>
                        {comment.content}
                      </Text>
                    </View>
                    <Text style={styles.commentTime}>
                      {formatCommentDate(comment.createdAt)}
                    </Text>
                  </View>
                ))
              : sortedComments.slice(0, 3).map((comment, index) => (
                  <View key={index} style={styles.commentBubble}>
                    <View style={styles.commentLeft}>
                      <Text style={styles.commentAuthor}>
                        {comment?.technicians?.name || 'Unknown'}
                      </Text>
                      <Text style={styles.commentContent}>
                        {comment.content}
                      </Text>
                    </View>
                    <Text style={styles.commentTime}>
                      {formatCommentDate(comment.createdAt)}
                    </Text>
                  </View>
                ))}
            {sortedComments.length > 3 && (
              <TouchableOpacity
                style={styles.viewMoreButton}
                onPress={() => {
                  setExpandedComments(prev => {
                    const newState = {
                      ...prev,
                      [item.id]: !prev[item.id],
                    };

                    if (prev[item.id] === true) {
                      setTimeout(() => scrollToTask(item.id), 300);
                    }

                    return newState;
                  });
                }}>
                <Text style={styles.viewMoreText}>
                  {isExpanded
                    ? 'View Less'
                    : `View More (${sortedComments.length})`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            value={commentText[item.id] || ''}
            onChangeText={text =>
              setCommentText(prev => ({...prev, [item.id]: text}))
            }
            placeholderTextColor={'#ffffff'}
            placeholder="Add a comment..."
            multiline
          />

          <TouchableOpacity
            style={styles.submitCommentButton}
            onPress={() => {
              addComment(item.id, commentText[item.id]);
              setCommentText(prev => ({...prev, [item.id]: ''}));
            }}
            disabled={isCommentUpdating || !commentText[item.id]?.trim()}>
            <Text style={styles.submitCommentButtonText}>
              {isCommentUpdating ? 'Sending...' : 'Send'}
            </Text>
          </TouchableOpacity>
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={statusUpdateModalVisible && selectedTaskId === item.id}
          onRequestClose={() => setStatusUpdateModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Update Task Status</Text>
              <Text style={styles.modalSubtitle}>{item.title}</Text>

              {statusOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.statusOption,
                    item.status === option.value && styles.currentStatus,
                  ]}
                  onPress={() => updateTaskStatus(option.value, item.id)}>
                  <Text
                    style={[
                      styles.statusOptionText,
                      {color: option.color},
                      item.status === option.value && styles.currentStatusText,
                    ]}>
                    {option.label}
                  </Text>
                  {item.status === option.value && (
                    <Text style={styles.currentIndicator}>● Current</Text>
                  )}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setStatusUpdateModalVisible(false);
                  setSelectedTaskId(null);
                }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove([
        'userToken',
        'userData',
        'offlineActions',
        'taskData',
        'localTaskData',
      ]);
      console.log(
        'HomeScreen - Cleared all data from AsyncStorage including local task data',
      );
      hideModal();
      navigation.replace('LoginScreen');
    } catch (error) {
      console.error('HomeScreen - Error during logout:', error);
      showErrorModal(
        'Logout Failed',
        'Failed to logout. Please try again.',
        () => {
          hideModal();
          navigation.replace('LoginScreen');
        },
        () => hideModal(),
        'Force Logout',
        'Cancel',
      );
    }
  };

  const handleManualLogout = () => {
    showErrorModal(
      'Confirm Logout',
      'Are you sure you want to logout? All unsynced changes will be lost.',
      handleLogout,
      () => hideModal(),
      'Yes, Logout',
      'Cancel',
    );
  };

  const scrollToTask = taskId => {
    const index = allTasks.findIndex(task => task.id === taskId);
    if (index !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0,
      });
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Text style={styles.title}>All Tasks</Text>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleManualLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        {!isConnected && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineBannerText}>
              You are offline. Data may be outdated. Actions will sync when
              online.
            </Text>
          </View>
        )}

        {isSyncingOfflineActions && (
          <View style={styles.syncingIndicator}>
            <ActivityIndicator size="small" color="#ffffff" />
            <Text style={styles.syncingText}>Syncing offline actions...</Text>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          showsVerticalScrollIndicator={false}
          data={allTasks}
          renderItem={showTaskRenderItem}
          keyExtractor={item => item.id.toString()}
          refreshing={loading}
          onRefresh={fetchTaskData}
          contentContainerStyle={styles.listContent}
          style={styles.list}
        />
      </View>
      <CustomModal
        visible={modalVisible}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        onClose={hideModal}
        primaryButtonText={getCurrentActions().primaryText}
        secondaryButtonText={getCurrentActions().secondaryText || null}
        onPrimaryPress={getCurrentActions().onPrimaryPress}
        onSecondaryPress={getCurrentActions().onSecondaryPress}
        autoClose={false}
      />
    </ScreenWrapper>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20,
    color: '#333',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  list: {
    flex: 1,
  },
  taskCard: {
    backgroundColor: '#1f2937',
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taskDetails: {
    marginTop: 8,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  taskText: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 2,
  },
  taskMeta: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  statusButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusText: {
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#374151',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  currentStatus: {
    backgroundColor: '#065f46',
    borderColor: '#10b981',
  },
  statusOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  currentStatusText: {
    color: '#ffffff',
  },
  currentIndicator: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#374151',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignSelf: 'flex-end',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentsSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  commentBubble: {
    backgroundColor: '#2d3748',
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentLeft: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    color: '#d1d5db',
    fontWeight: 'bold',
  },
  commentContent: {
    fontSize: 14,
    color: '#ffffff',
    marginTop: 2,
  },
  commentTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 10,
  },
  viewMoreButton: {
    backgroundColor: '#374151',
    padding: 8,
    borderRadius: 6,
    marginTop: 5,
    alignItems: 'center',
  },
  viewMoreText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  commentInputContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 6,
    padding: 10,
    color: '#d1d5db',
    marginRight: 10,
    textAlignVertical: 'top',
  },
  submitCommentButton: {
    backgroundColor: '#22c55e',
    padding: 10,
    borderRadius: 6,
    justifyContent: 'center',
  },
  submitCommentButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  offlineBanner: {
    backgroundColor: '#FFD700',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  offlineBannerText: {
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  syncingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  syncingText: {
    color: '#ffffff',
    marginLeft: 10,
    fontWeight: 'bold',
  },
});
