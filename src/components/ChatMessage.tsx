import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IMessage } from 'react-native-gifted-chat';

interface ChatMessageProps {
  message: IMessage;
  isBot: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isBot }) => {
  return (
    <View style={[styles.messageContainer, isBot ? styles.botMessage : styles.userMessage]}>
      <Text style={[styles.messageText, isBot ? styles.botText : styles.userText]}>
        {message.text}
      </Text>
    </View>
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