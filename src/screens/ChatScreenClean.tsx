import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send2, Refresh } from 'iconsax-react-nativejs';
import { useAuth } from '../contexts/AuthContext';
import { fetchAugustReply } from '../services/august';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import PaywallModal from '../components/PaywallModal';

// --- DESIGN SYSTEM COLOURS --- //
const colors = {
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray800: '#1F2937',
  ttaBlue500: '#3B82F6',
};

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  createdAt?: number;
  isTyping?: boolean;
}

// Animated typing indicator with cycling dots
const TypingIndicator: React.FC = () => {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const id = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 350);
    return () => clearInterval(id);
  }, []);
  return <Text style={styles.aiText}>{dots || '.'}</Text>;
};

// Format text with simple markdown parsing for bold and italics
const FormattedText: React.FC<{ text: string; style: any }> = ({ text, style }) => {
  if (!text) return null;

  // Simple markdown parser for **bold** and *italic* text
  const parseText = (inputText: string) => {
    const parts = [];
    let remainingText = inputText;
    let key = 0;

    while (remainingText.length > 0) {
      // Check for bold text **text**
      const boldMatch = remainingText.match(/\*\*(.*?)\*\*/);
      if (boldMatch && boldMatch.index !== undefined) {
        const beforeBold = remainingText.substring(0, boldMatch.index);
        const boldText = boldMatch[1];
        
        // Add text before bold
        if (beforeBold) {
          parts.push(
            <Text key={key++} style={style}>
              {beforeBold}
            </Text>
          );
        }
        
        // Add bold text
        parts.push(
          <Text key={key++} style={[style, { fontFamily: 'LarsseitBold', fontWeight: '700' }]}>
            {boldText}
          </Text>
        );
        
        remainingText = remainingText.substring(boldMatch.index + boldMatch[0].length);
        continue;
      }

      // Check for italic text *text*
      const italicMatch = remainingText.match(/(?<!\*)\*([^*]+?)\*(?!\*)/);
      if (italicMatch && italicMatch.index !== undefined) {
        const beforeItalic = remainingText.substring(0, italicMatch.index);
        const italicText = italicMatch[1];
        
        // Add text before italic
        if (beforeItalic) {
          parts.push(
            <Text key={key++} style={style}>
              {beforeItalic}
            </Text>
          );
        }
        
        // Add italic text (using fontStyle since no italic font exists)
        parts.push(
          <Text key={key++} style={[style, { fontStyle: 'italic' }]}>
            {italicText}
          </Text>
        );
        
        remainingText = remainingText.substring(italicMatch.index + italicMatch[0].length);
        continue;
      }

      // No more formatting found, add remaining text
      parts.push(
        <Text key={key++} style={style}>
          {remainingText}
        </Text>
      );
      break;
    }

    return parts;
  };

  return (
    <Text style={[style, { fontFamily: 'Larsseit' }]}>
      {parseText(text)}
    </Text>
  );
};

const ChatScreenClean: React.FC = () => {
  const { user, isSubscribed } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, { initialMessage?: string }>, string>>();
  const initialMessage = route.params?.initialMessage ?? '';
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);

  const [messages, setMessages] = useState<Message[]>(
    initialMessage
      ? [{ id: '1', text: initialMessage, isUser: true }]
      : []
  );
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100); // Small delay to ensure render is complete
    }
  }, [messages]);

  // Handle authentication state and initial messages
  useEffect(() => {
    if (user?.id) {
      console.log('[ChatScreen] User authenticated, loading chat history with initialMessage:', initialMessage ? 'yes' : 'no');
      loadChatHistory();
    } else {
      console.log('[ChatScreen] No user ID available yet');
    }
  }, [user?.id, initialMessage]);

  // Load chat history
  const loadChatHistory = async () => {
    try {
      console.log('[ChatScreen] Loading chat history for user:', user?.id);
      setIsLoading(true);
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true }) // Get messages in chronological order (oldest first)
        .limit(50);

      if (error) throw error;

      console.log(`[ChatScreen] Retrieved ${data?.length || 0} messages from chat history`);

      if (data) {
        // Convert from DB format to Message format
        const loadedMessages: Message[] = data.map(item => ({
          id: item.id,
          text: item.message_text,
          isUser: item.is_user_message,
          createdAt: new Date(item.created_at).getTime()
        }));

        console.log('[ChatScreen] Converted messages to local format');

        // Add any initial message if it exists and not already in loaded messages
        if (initialMessage && !loadedMessages.some(m => m.text === initialMessage && m.isUser)) {
          console.log('[ChatScreen] Processing initial message from conversation chip:', initialMessage);
          
          const initialMsg: Message = { 
            id: String(Date.now()),
            text: initialMessage,
            isUser: true,
            createdAt: Date.now() 
          };
          loadedMessages.push(initialMsg); // Append for chronological order (oldest first)
          console.log('[ChatScreen] Added initial message to chat history');
          
          // Save with proper error handling
          saveMessageToSupabase(initialMsg)
            .then(() => console.log('[ChatScreen] Saved initial message to Supabase'))
            .catch(err => {
              console.error('[ChatScreen] Error saving initial message to Supabase:', err);
            });
            
          // Set messages state with the initial message
          setMessages(loadedMessages);
          
          // Add a slight delay before triggering the AI response to ensure UI renders first
          setTimeout(() => {
            // Show typing indicator for initial message
            setIsTyping(true);
            setMessages(prevMsgs => [...prevMsgs, { 
              id: 'typing-initial', 
              text: '...', 
              isUser: false, 
              isTyping: true 
            }]);
            
            // Get conversation history for context 
            const conversationContext = loadedMessages
              .filter(m => !m.isTyping)
              .slice(0, 15) // Use up to 15 messages for context
              .map(m => ({
                text: m.text,
                isUser: m.isUser,
                timestamp: m.createdAt || Date.now()
              }));
              
            console.log('[ChatScreen] Getting AI response for initial message with context:', 
              conversationContext.length, 'messages');
              
            // Get August's response to the initial message
            fetchAugustReply(initialMessage, user?.id ?? '', conversationContext)
              .then((reply) => {
                const aiMsg: Message = { 
                  id: String(Date.now()+1), 
                  text: reply, 
                  isUser: false, 
                  createdAt: Date.now() 
                };
                
                // Remove typing indicator, then add August's response
                setMessages(prev => [...prev.filter(m => !m.isTyping), aiMsg]);
                
                // Save August's response
                saveMessageToSupabase(aiMsg)
                  .then(() => console.log('[ChatScreen] Saved August\'s response to initial message'))
                  .catch(error => {
                    console.error('[ChatScreen] Error saving August\'s response:', error);
                  });
              })
              .catch(error => {
                console.error('[ChatScreen] Error getting August\'s response:', error);
                setMessages(prev => prev.filter(m => !m.isTyping)); // Remove typing indicator on error
                Alert.alert('Error', 'Failed to get August\'s response. Please try again.');
              })
              .finally(() => {
                setIsTyping(false);
              });
          }, 300);
          
          // Return early since we're handling the messages separately for the initial message
          return;
        }

        // Set messages in state
        console.log('[ChatScreen] Setting messages in state:', loadedMessages.length);
        setMessages(loadedMessages);
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
      Alert.alert('Error', 'Failed to load chat history.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = async () => {
    // Show warning dialog before clearing conversation
    Alert.alert(
      'Restart Conversation',
      'This will clear your conversation history and August will forget the context of your previous messages. Are you sure you want to restart?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Restart',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              // Delete all messages for this user from the database
              if (user?.id) {
                const { error } = await supabase
                  .from('chat_history')
                  .delete()
                  .eq('user_id', user.id);

                if (error) throw error;
              }
              // Clear messages from local state
              setMessages([]);
              
              // Add a welcome message
              const welcomeMsg: Message = { 
                id: String(Date.now()),
                text: "Hi! I'm August, your personal AI sex therapist. How can I help you today?",
                isUser: false,
                createdAt: Date.now() 
              };
              setMessages([welcomeMsg]);
              saveMessageToSupabase(welcomeMsg);
              
              Alert.alert('Success', 'Conversation has been restarted.');
            } catch (err) {
              console.error('Error clearing conversation:', err);
              Alert.alert('Error', 'Failed to clear conversation history.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Save message to Supabase
  const saveMessageToSupabase = async (message: Message | Message[]) => {
    if (!user?.id) return;

    try {
      // Handle both single message and array of messages
      const messages = Array.isArray(message) ? message : [message];
      
      // Skip empty messages or typing indicators
      const validMessages = messages.filter(m => m.text && !m.isTyping);
      if (validMessages.length === 0) return;
      
      const messagesToInsert = validMessages.map(m => ({
        user_id: user.id,
        message_text: m.text,
        is_user_message: m.isUser,
        created_at: new Date(m.createdAt || Date.now()).toISOString()
      }));

      const { error } = await supabase.from('chat_history').insert(messagesToInsert);

      if (error) throw error;
      console.log(`Successfully saved ${validMessages.length} message(s) to chat history`);
    } catch (err) {
      console.error('Error saving message:', err);
      // Continue the conversation even if saving fails
    }
  };

  const handleSend = async () => {
    // Check for subscription status before sending a message
    if (!isSubscribed) {
      console.log('[ChatScreen] User is not subscribed. Showing paywall.');
      setIsPaywallVisible(true); // Show the paywall
      return;
    }

    const trimmedMessage = currentMessage.trim();
    if (!trimmedMessage || isTyping) return;

    const newMessage: Message = {
      id: String(Date.now()),
      text: trimmedMessage,
      isUser: true,
      createdAt: Date.now(),
    };

    // Immediately update the UI with the user's message
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setCurrentMessage('');
    setIsTyping(true);

    // Save user message to the database
    await saveMessageToSupabase(newMessage);
    
    // Add a typing indicator for August
    setMessages(prevMsgs => [...prevMsgs, { 
      id: 'typing-indicator', 
      text: '...', 
      isUser: false, 
      isTyping: true 
    }]);

    try {
      const historyForApi = newMessages
      .filter(m => !m.isTyping)
        .slice(-15) // Use last 15 messages for context
      .map(m => ({
        text: m.text,
        isUser: m.isUser,
        timestamp: m.createdAt || Date.now()
      }));
    
      const reply = await fetchAugustReply(trimmedMessage, user?.id || '', historyForApi);
      
      const augustMessage: Message = { 
        id: String(Date.now() + 1), 
        text: reply, 
        isUser: false,
        createdAt: Date.now() 
      };
      
      await saveMessageToSupabase(augustMessage);

      // Update the UI, replacing the typing indicator with the actual reply
      setMessages(prevMsgs => {
        const updatedMessages = prevMsgs.filter(m => !m.isTyping);
        return [...updatedMessages, augustMessage];
      });
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to get a response from August.');
      setMessages(prevMsgs => prevMsgs.filter(m => !m.isTyping)); // Remove typing indicator on error
    } finally {
      setIsTyping(false);
    }
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.bubbleContainer,
        item.isUser ? styles.userBubbleContainer : styles.aiBubbleContainer,
      ]}
    >
      {!item.isUser && (
        <View style={styles.aiAvatar}>
          <Text style={styles.aiAvatarText}>A</Text>
        </View>
      )}
      <View style={[styles.bubble, item.isUser ? styles.userBubble : styles.aiBubble]}>
        {item.isTyping ? (
          <TypingIndicator />
        ) : (
          <>
            <FormattedText 
            text={item.text} 
            style={item.isUser ? styles.userText : styles.aiText} 
          />
            {item.createdAt && (
              <Text style={[styles.timestampInside, item.isUser ? styles.timestampUserInside : styles.timestampAIInside]}>
                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.addButton}>
          <ArrowLeft size={24} color={colors.gray800} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>August</Text>

        <TouchableOpacity onPress={clearConversation} style={styles.addButton}>
          <Refresh size={24} color={colors.ttaBlue500} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages} // No need to reverse since we're loading chronologically from Supabase
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContent}
          ListFooterComponent={isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading conversation...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Ask August a question to start chatting.</Text>
            </View>
          ) : null}
        />

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={currentMessage}
            onChangeText={setCurrentMessage}
            placeholder="Reply"
            placeholderTextColor="#A1AEBC"
            multiline={false}
            textAlignVertical="center"
          />
          <TouchableOpacity
            style={[styles.sendBtn, !currentMessage.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!currentMessage.trim()}
          >
            <Send2 size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <PaywallModal 
        isVisible={isPaywallVisible}
        featureType="chat"
        onClose={() => setIsPaywallVisible(false)}
      />
    </SafeAreaView>
  );
};

// --- STYLES --- //
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Larsseit',
    color: colors.gray800,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
    height: 40,
    backgroundColor: colors.white,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bubbleContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  aiBubbleContainer: {
    alignSelf: 'flex-start',
  },
  userBubbleContainer: {
    flexDirection: 'row-reverse',
    alignSelf: 'flex-end',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  aiAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray800,
    fontFamily: 'LarsseitBold',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingVertical: 10, // Increased vertical padding
    paddingHorizontal: 14, // Increased horizontal padding
  },
  aiBubble: {
    backgroundColor: colors.gray50,
  },
  userBubble: {
    backgroundColor: '#2154E0', // August blue color
  },
  aiText: {
    color: colors.gray800,
    fontSize: 15,
    fontFamily: 'Larsseit',
    lineHeight: 22, // Increased line height for better readability
  },
  userText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: 'Larsseit',
    lineHeight: 22, // Increased line height for better readability
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
  },
  textInput: {
    flex: 1,
    marginRight: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 16,
    fontFamily: 'Larsseit',
    fontWeight: '400',
    color: colors.gray800,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F3F3',
    textAlign: 'left',
    textAlignVertical: 'center',
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: '#2154E0', // August blue color
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.gray400,
  },
  restartBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#2154E0', // August blue color
  },
  timestampInside: {
    fontSize: 10,
    color: colors.gray400,
    marginTop: 4,
    fontFamily: 'Larsseit',
  },
  timestampUserInside: {
    alignSelf: 'flex-end',
    color: colors.white,
  },
  timestampAIInside: {
    alignSelf: 'flex-start',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.gray500,
    fontSize: 14,
    fontFamily: 'Larsseit',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.gray500,
    fontSize: 15,
    textAlign: 'center',
    fontFamily: 'Larsseit',
  }
});

export default ChatScreenClean;
