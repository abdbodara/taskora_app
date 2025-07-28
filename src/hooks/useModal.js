import { useState } from "react";

const useModal = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('success');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [onSuccessPrimaryPress, setOnSuccessPrimaryPress] = useState(null);
  const [onSuccessSecondaryPress, setOnSuccessSecondaryPress] = useState(null);
  const [successPrimaryText, setSuccessPrimaryText] = useState('OK');
  const [successSecondaryText, setSuccessSecondaryText] = useState('');
  const [onErrorPrimaryPress, setOnErrorPrimaryPress] = useState(null);
  const [onErrorSecondaryPress, setOnErrorSecondaryPress] = useState(null);
  const [errorPrimaryText, setErrorPrimaryText] = useState('OK');
  const [errorSecondaryText, setErrorSecondaryText] = useState('');

  const showSuccessModal = (
    title, 
    message, 
    primaryCallback = null, 
    secondaryCallback = null,
    primaryText = 'OK',
    secondaryText = ''
  ) => {
    setModalType('success');
    setModalTitle(title);
    setModalMessage(message);
    setOnSuccessPrimaryPress(() => primaryCallback);
    setOnSuccessSecondaryPress(() => secondaryCallback);
    setSuccessPrimaryText(primaryText);
    setSuccessSecondaryText(secondaryText);
    setModalVisible(true);
  };

  const showErrorModal = (
    title, 
    message, 
    primaryCallback = null, 
    secondaryCallback = null,
    primaryText = 'OK',
    secondaryText = ''
  ) => {
    setModalType('error');
    setModalTitle(title);
    setModalMessage(message);
    setOnErrorPrimaryPress(() => primaryCallback);
    setOnErrorSecondaryPress(() => secondaryCallback);
    setErrorPrimaryText(primaryText);
    setErrorSecondaryText(secondaryText);
    setModalVisible(true);
  };

  const showModal = (type, title, message, primaryCallback = null, secondaryCallback = null) => {
    if (type === 'success') {
      showSuccessModal(title, message, primaryCallback, secondaryCallback);
    } else {
      showErrorModal(title, message, primaryCallback, secondaryCallback);
    }
  };

  const hideModal = () => {
    setModalVisible(false);
    setOnSuccessPrimaryPress(null);
    setOnSuccessSecondaryPress(null);
    setOnErrorPrimaryPress(null);
    setOnErrorSecondaryPress(null);
    setSuccessPrimaryText('OK');
    setSuccessSecondaryText('');
    setErrorPrimaryText('OK');
    setErrorSecondaryText('');
  };

  const getCurrentActions = () => {
    if (modalType === 'success') {
      return {
        onPrimaryPress: onSuccessPrimaryPress,
        onSecondaryPress: onSuccessSecondaryPress,
        primaryText: successPrimaryText,
        secondaryText: successSecondaryText,
      };
    } else {
      return {
        onPrimaryPress: onErrorPrimaryPress,
        onSecondaryPress: onErrorSecondaryPress,
        primaryText: errorPrimaryText,
        secondaryText: errorSecondaryText,
      };
    }
  };

  return {
    modalVisible,
    modalType,
    modalTitle,
    modalMessage,
    showModal,
    showSuccessModal,
    showErrorModal,
    hideModal,
    getCurrentActions,
    successActions: {
      onPrimaryPress: onSuccessPrimaryPress,
      onSecondaryPress: onSuccessSecondaryPress,
      primaryText: successPrimaryText,
      secondaryText: successSecondaryText,
    },
    errorActions: {
      onPrimaryPress: onErrorPrimaryPress,
      onSecondaryPress: onErrorSecondaryPress,
      primaryText: errorPrimaryText,
      secondaryText: errorSecondaryText,
    }
  };
};

export default useModal;