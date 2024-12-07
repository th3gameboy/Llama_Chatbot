import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { ChatMessage } from '../components/ChatMessage';
import { LlamaService } from '../services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkService } from '../services/network/NetworkService';

const STORAGE_KEY = '@chat_messages';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

interface ChatError extends Error {
  code?: string;
  type?: 'network' | 'storage' | 'model' | 'unknown';
}

export const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const llamaService = LlamaService.getInstance();
  const networkService = NetworkService.getInstance();

  const handleError = (error: ChatError, context: string) => {
    console.error(`Error in ${context}:`, error);
    
    let message = 'An unexpected error occurred';
    let action = null;

    if (error.type === 'network') {
      message = 'Network connection lost. Please check your connection and try again.';
      action = async () => {
        if (await networkService.waitForWifi()) {
          return true;
        }
        return false;
      };
    } else if (error.type === 'storage') {
      message = 'Failed to save or load messages. Storage might be full.';
    } else if (error.type === 'model') {
      message = 'Failed to process with AI model. The model might need to be reloaded.';
      action = async () => {
        try {
          await llamaService.initialize();
          return true;
        } catch {
          return false;
        }
      };
    }

    return new Promise<boolean>((resolve) => {
      Alert.alert(
        'Error',
        message,
        action
          ? [
              {
                text: 'Retry',
                onPress: async () => {
                  const success = await action();
                  resolve(success);
                },
              },
              {
                text: 'Cancel',
                onPress: () => resolve(false),
                style: 'cancel',
              },
            ]
          : [{ text: 'OK', onPress: () => resolve(false) }]
      );
    });
  };

  const retryOperation = async <T,>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      const chatError = error as ChatError;
      const shouldRetry = await handleError(chatError, context);
      
      if (shouldRetry && retryCount < MAX_RETRIES) {
        setRetryCount(count => count + 1);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return retryOperation(operation, context);
      }
      
      setRetryCount(0);
      throw error;
    }
  };

  useEffect(() => {
    const loadSavedMessages = async () => {
      try {
        await retryOperation(async () => {
          const savedMessagesStr = await AsyncStorage.getItem(STORAGE_KEY);
          const savedMessages = savedMessagesStr ? JSON.parse(savedMessagesStr) : [];
          setMessages(savedMessages);
        }, 'loading messages');
      } catch (error) {
        // Final fallback: start with empty messages
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedMessages();
  }, []);

  const saveMessages = async (messagesToSave: IMessage[]) => {
    await retryOperation(
      async () => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messagesToSave)),
      'saving messages'
    );
  };

  const onSend = useCallback(async (newMessages: IMessage[]) => {
    try {
      setIsLoading(true);
      const updatedMessages = GiftedChat.append(messages, newMessages);
      setMessages(updatedMessages);
      
      // First save user message
      await saveMessages(updatedMessages);

      // Check network before AI processing
      if (!await networkService.checkConnectivity()) {
        throw Object.assign(new Error('No network connection'), { type: 'network' });
      }

      const userMessage = newMessages[0];
      const botResponse = await retryOperation(
        async () => llamaService.chat(userMessage.text),
        'processing message'
      );
      
      const botMessage: IMessage = {
        _id: String(Date.now()),
        text: botResponse,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'Bot',
        },
      };

      const finalMessages = GiftedChat.append(updatedMessages, [botMessage]);
      setMessages(finalMessages);
      await saveMessages(finalMessages);
    } catch (error) {
      // If all retries failed, show final error
      handleError(error as ChatError, 'message processing');
    } finally {
      setIsLoading(false);
    }
  }, [messages, llamaService]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GiftedChat
        messages={messages}
        onSend={newMessages => onSend(newMessages)}
        user={{ _id: 1 }}
        renderBubble={props => (
          <ChatMessage
            message={props.currentMessage}
            isBot={props.currentMessage.user._id === 2}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
 centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 