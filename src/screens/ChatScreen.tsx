"use client"

import { useRef, useState } from "react"
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

// --- Utilities ---
const { width: windowWidth } = Dimensions.get("window")

// Helper to convert Figma's Tailwind-like unit values to React Native DP.
const toDp = (value) => value * 4

// Calculates horizontal padding/margin based on original Figma design width (384px)
const getResponsiveHorizontalPadding = (originalPx) => {
  const originalDesignWidth = 384
  return (originalPx / originalDesignWidth) * windowWidth
}

// --- Reusable Components ---

/**
 * Renders a single chat message bubble.
 * @param {string} message - The text content of the message.
 * @param {boolean} isUser - True if the message is from the user, false if from AI.
 */
const MessageBubble = ({ message, isUser }) => (
  <View style={[messageBubbleStyles.messageRow, isUser ? messageBubbleStyles.userRow : messageBubbleStyles.aiRow]}>
    {!isUser && (
      <View style={messageBubbleStyles.aiAvatar}>
        {/* AI Avatar Icon (August) */}
        <View style={messageBubbleStyles.aiAvatarInnerIcon}>
          <View style={messageBubbleStyles.aiAvatarPart1} />
          <View style={messageBubbleStyles.aiAvatarPart2} />
          <View style={messageBubbleStyles.aiAvatarPart3} />
        </View>
      </View>
    )}
    <View
      style={[
        messageBubbleStyles.bubbleContainer,
        isUser ? messageBubbleStyles.userBubble : messageBubbleStyles.aiBubble,
      ]}
    >
      <Text style={messageBubbleStyles.messageText}>{message}</Text>
    </View>
  </View>
)

// --- Main ChatScreen Component ---

const ChatScreen = () => {
  const [messages, setMessages] = useState([
    {
      id: "1",
      text: 'Generating passive income allows you to earn money with minimal ongoing effort, effectively enabling you to "make money while sleeping." Here are several strategies to consider:\nInvest in Dividend Stocks or Funds: By purchasing shares in companies that distribute regular dividends, you can receive periodic payments. Opting for dividend-focused index funds or ETFs can provide diversification and reduce risk.',
      isUser: false,
    },
    {
      id: "2",
      text: "How to make more money while sleeping",
      isUser: true,
    },
  ])
  const [currentMessage, setCurrentMessage] = useState("")
  const scrollViewRef = useRef(null)

  const handleBack = () => {
    console.log("Back button pressed")
    // Implement navigation.goBack() here
  }

  const handleProfilePress = () => {
    console.log("Profile/Settings button pressed")
    // Implement navigation to profile or settings
  }

  const handleSendMessage = () => {
    if (currentMessage.trim()) {
      const newMessage = {
        id: String(messages.length + 1), // Simple ID for demo
        text: currentMessage.trim(),
        isUser: true,
      }
      setMessages((prevMessages) => [newMessage, ...prevMessages]) // Add to top for inverted scroll
      setCurrentMessage("")

      // Simulate AI response after a short delay
      setTimeout(() => {
        const aiResponse = {
          id: String(messages.length + 2),
          text: "That's a great question! I'm still learning, but I can help you explore ideas for passive income, like investing, creating digital products, or even real estate. What interests you the most?",
          isUser: false,
        }
        setMessages((prevMessages) => [aiResponse, ...prevMessages])
      }, 1000)
    }
  }

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Navigation: Back Button, Title (August) and Profile/Settings Button */}
      <View style={styles.topNavSection}>
        <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={styles.backButton}>
          <View style={styles.backButtonIcon} />
        </TouchableOpacity>
        <View style={styles.titleWithIcon}>
          <Text style={styles.screenTitle}>August</Text>
          {/* August Icon - Eyes and Mouth (simplified) */}
          <View style={styles.augustIcon}>
            <View style={styles.augustIconEye1} />
            <View style={styles.augustIconEye2} />
          </View>
        </View>
        <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.7} style={styles.profileButton}>
          <View style={styles.profileIcon} />
        </TouchableOpacity>
      </View>

      {/* Main Chat Area */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? getResponsiveHorizontalPadding(100) : 0} // Adjust offset
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.chatContentContainer}
          showsVerticalScrollIndicator={false}
          inverted // To make chat start from bottom
          onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
          onLayout={() => scrollViewRef.current.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg.text} isUser={msg.isUser} />
          ))}
        </ScrollView>

        {/* Message Input Area */}
        <View style={styles.messageInputArea}>
          <TextInput
            style={styles.messageTextInput}
            value={currentMessage}
            onChangeText={setCurrentMessage}
            placeholder="Type your message..."
            placeholderTextColor="#94A3B8" // slate-400
            multiline // Allow multiline input
          />
          <TouchableOpacity onPress={handleSendMessage} activeOpacity={0.7} style={styles.sendButton}>
            {/* Send Icon - Right arrow */}
            <View style={styles.sendIcon}>
              <View style={styles.sendIconBody} />
              <View style={styles.sendIconTip} />
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* iOS Home Indicator */}
      {Platform.OS === "ios" && <View style={styles.iosHomeIndicator} />}
    </SafeAreaView>
  )
}

// --- Stylesheets ---

const messageBubbleStyles = StyleSheet.create({
  messageRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: toDp(6), // gap-6
  },
  userRow: {
    justifyContent: "flex-end",
  },
  aiRow: {
    justifyContent: "flex-start",
    gap: toDp(2), // gap-2
  },
  aiAvatar: {
    width: 40, // w-10
    height: 40, // h-10
    borderRadius: 77.58, // rounded-[77.58px]
    backgroundColor: "#3B82F6", // blue-700
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  aiAvatarInnerIcon: {
    // Inner icon for AI avatar
    width: 20, // w-5
    height: 20, // h-5
    position: "relative",
    left: 0,
    top: 0, // left-[10px] top-[10px] within its 40x40 parent
  },
  aiAvatarPart1: {
    // Outline square
    width: 16, // w-4
    height: 16, // h-4
    left: 1.67,
    top: 2.5, // left-[1.67px] top-[2.50px]
    position: "absolute",
    borderWidth: 0.625, // outline-[1.25px]
    borderColor: "#FFFFFF", // white
  },
  aiAvatarPart2: {
    // Small square/dot
    width: 6, // w-1.5
    height: 6, // h-1.5
    left: 12.5,
    top: 1.67, // left-[12.50px] top-[1.67px]
    position: "absolute",
    borderWidth: 0.625, // outline-[1.25px]
    borderColor: "#FFFFFF", // white
  },
  aiAvatarPart3: {
    // Smaller square/dot
    width: 8, // w-2
    height: 8, // h-2
    left: 5.83,
    top: 6.25, // left-[5.83px] top-[6.25px]
    position: "absolute",
    borderWidth: 0.625, // outline-[1.25px]
    borderColor: "#FFFFFF", // white
  },
  bubbleContainer: {
    padding: toDp(4), // p-4
    shadowColor: "rgba(0,0,0,0.04)", // shadow-[0px_1px_1px_0px_rgba(0,0,0,0.04)]
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 1,
    elevation: 1, // For Android shadow
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: toDp(1), // gap-1
    maxWidth: windowWidth * 0.75, // Adjust max width to prevent bubbles from being too wide
  },
  userBubble: {
    backgroundColor: "#F5F5F5", // neutral-100
    borderTopLeftRadius: 16, // rounded-tl-2xl
    borderTopRightRadius: 4, // rounded-tr
    borderBottomLeftRadius: 16, // rounded-bl-2xl
    borderBottomRightRadius: 16, // rounded-br-2xl
    alignItems: "flex-end", // align-items-end for user
  },
  aiBubble: {
    backgroundColor: "#F5F5F5", // neutral-100
    borderTopLeftRadius: 4, // rounded-tl
    borderTopRightRadius: 16, // rounded-tr-2xl
    borderBottomLeftRadius: 16, // rounded-bl-2xl
    borderBottomRightRadius: 16, // rounded-br-2xl
    alignItems: "flex-start", // align-items-start for AI
  },
  messageText: {
    alignSelf: "stretch",
    color: "#333333", // zinc-800
    fontSize: 16, // text-base
    fontWeight: "300", // light
    fontFamily: "Larsseit",
    lineHeight: 24, // normal
  },
})

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topNavSection: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: getResponsiveHorizontalPadding(20),
    paddingTop: getResponsiveHorizontalPadding(60), // Adjusted to align with HTML's 81px top
    paddingBottom: toDp(10), // Spacing below nav to content
  },
  backButton: {
    width: 48, // w-12 (48px)
    height: 48, // h-12 (48px)
    borderRadius: 9999, // rounded-full
    backgroundColor: "#F3F4F6", // gray-100
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonIcon: {
    width: 8, // w-2 (8px)
    height: 16, // h-4 (16px)
    borderColor: "#171717", // neutral-900
    borderWidth: 1.5,
  },
  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: toDp(1), // gap-1
  },
  screenTitle: {
    color: "#171717", // neutral-900
    fontSize: 16,
    fontWeight: "500", // medium
    fontFamily: "Larsseit",
    lineHeight: 24, // normal
  },
  augustIcon: {
    // Container for the August icon (eyes/mouth)
    width: 20, // w-5
    height: 20, // h-5
    position: "relative",
  },
  augustIconEye1: {
    // Left eye
    width: 12, // w-3
    height: 12, // h-3
    left: 2.5,
    top: 5.83, // left-[2.50px] top-[5.83px]
    position: "absolute",
    borderWidth: 0.75, // outline-[1.50px]
    borderColor: "#171717", // neutral-900
  },
  augustIconEye2: {
    // Right eye/mouth part
    width: 5, // w-[5px]
    height: 5, // h-[5px]
    left: 12.5,
    top: 2.5, // left-[12.50px] top-[2.50px]
    position: "absolute",
    borderWidth: 0.6, // outline-[1.20px]
    borderColor: "#171717", // neutral-900
  },
  profileButton: {
    // Same dimensions as back button
    width: 48,
    height: 48,
    borderRadius: 9999,
    backgroundColor: "#F5F5F5", // violet-100 (if intended) or gray-100 as per HTML
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    transform: [{ rotate: "180deg" }], // To match HTML's rotated element
  },
  profileIcon: {
    // The inner icon for the profile button, assumed to be a generic user icon
    width: 20, // w-5
    height: 20, // h-5
    borderWidth: 0.75, // outline-[1.50px]
    borderColor: "#3B82F6", // blue-700
  },

  keyboardAvoidingView: {
    flex: 1,
  },
  chatContentContainer: {
    flexGrow: 1, // Allows content to grow and be scrollable
    paddingHorizontal: getResponsiveHorizontalPadding(20),
    paddingBottom: toDp(12), // Space between last message and input area
    justifyContent: "flex-end", // For inverted scroll view
  },

  messageInputArea: {
    width: "100%",
    paddingHorizontal: getResponsiveHorizontalPadding(20),
    paddingTop: toDp(5), // space from keyboard avoiding view
    backgroundColor: "#FFFFFF", // bg-white
    flexDirection: "row",
    alignItems: "center",
    gap: toDp(2), // gap-2 between input and button
    borderTopWidth: 0, // shadow-top: 4px -2px 12px 0px rgba(0,0,0,0.04)
    borderBottomWidth: 0,
    shadowColor: "rgba(0,0,0,0.04)",
    shadowOffset: { width: 0, height: -2 }, // Shadow from top
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5, // For Android shadow
  },
  messageTextInput: {
    flex: 1, // flex-1 to fill space
    paddingHorizontal: toDp(4), // px-4
    paddingVertical: toDp(3), // py-3
    backgroundColor: "#FFFFFF", // bg-white
    borderRadius: 8, // rounded-lg
    borderWidth: 1, // outline outline-1
    borderColor: "#E5E7EB", // gray-200
    color: "#4B5563", // text color slate-400 (if typed) or default for gray-200
    fontSize: 16,
    fontWeight: "500", // medium
    fontFamily: "Larsseit",
    lineHeight: 24, // normal
    textAlignVertical: "center", // Align text from top vertically
    minHeight: 48, // min-height for the input to look consistent
  },
  sendButton: {
    width: 48, // w-12
    height: 48, // h-12
    borderRadius: 9999, // rounded-full
    backgroundColor: "#F3F4F6", // gray-100
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  sendIcon: {
    // Icon for send button (right arrow)
    width: 24, // w-6
    height: 24, // h-6
    position: "relative",
    left: 2, // Minor adjustment to center visually
  },
  sendIconBody: {
    // Arrow body (square)
    width: 20, // w-5
    height: 20, // h-5
    left: 2.5,
    top: 2.5, // left-[2.50px] top-[2.50px]
    position: "absolute",
    borderWidth: 0.75, // outline-[1.50px]
    borderColor: "#4B5563", // gray-600
  },
  sendIconTip: {
    // Arrow tip (dot)
    width: 4, // w-1
    height: 4, // h-1
    left: 11.5,
    top: 9, // left-[11.50px] top-[9px]
    position: "absolute",
    borderWidth: 0.75, // outline-[1.50px]
    borderColor: "#4B5563", // gray-600
  },

  iosHomeIndicator: {
    // For iOS devices that show a home indicator bar
    width: toDp(32), // w-32
    height: toDp(1.25), // h-[5px] / 4
    backgroundColor: "#000000", // black
    borderRadius: 9999, // rounded-[100px]
    position: "absolute",
    bottom: toDp(8), // top-[818px] from 852px height, 34px from bottom (HTML value 21px from top of 32px height div)
    alignSelf: "center",
  },
})

export { default } from './ChatScreenClean'
