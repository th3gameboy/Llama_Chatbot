import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { IMessage } from 'react-native-gifted-chat';

interface ChatMessageProps {
  message: IMessage;
  isBot: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isBot }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.messageContainer, 
        isBot ? styles.botMessage : styles.userMessage,
        { opacity: fadeAnim }
      ]}
    >
      <Text style={[styles.messageText, isBot ? styles.botText : styles.userText]}>
        {message.text}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 12,
    marginVertical: 4,
  },
  botMessage: {
    backgroundColor: '#000000',
    alignSelf: 'flex-start',
  },
  userMessage: {
    backgroundColor: '#808080',
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 16,
  },
  botText: {
    color: '#FFFFFF',
  },
  userText: {
    color: '#000000',
  },
}); 