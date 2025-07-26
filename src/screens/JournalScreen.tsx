"use client"

import { View, Text, StyleSheet, StatusBar, Platform, TouchableOpacity, Dimensions, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import PropTypes from "prop-types"

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
 * Renders the fixed bottom navigation bar.
 * @param {string} activeTab - The currently active tab ('Home', 'Journal', 'Goals', 'Shop', 'August').
 * @param {function} onTabPress - Callback when a tab is pressed.
 */
const BottomNavBar = ({ activeTab, onTabPress }) => {
  const tabs = [
    { name: "Home", icon: "home" },
    { name: "Journal", icon: "journal" },
    { name: "Goals", icon: "goals" },
    { name: "Shop", icon: "shop" },
    { name: "August", icon: "august" },
  ]

  return (
    <View style={bottomNavBarStyles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.name
        const iconColor = isActive ? "#FFFFFF" : "#64748B" // white : slate-500
        const textColor = isActive ? "#FFFFFF" : "#4B5563" // white : gray-600

        // Custom icons based on HTML SVG/path data
        const renderIcon = (iconType) => {
          switch (iconType) {
            case "home":
              return (
                <View style={bottomNavBarStyles.homeIcon}>
                  <View
                    style={[
                      bottomNavBarStyles.iconOutline,
                      bottomNavBarStyles.homeIconPart1,
                      { borderColor: iconColor },
                    ]}
                  />
                  <View
                    style={[
                      bottomNavBarStyles.iconOutline,
                      bottomNavBarStyles.homeIconPart2,
                      { borderColor: iconColor },
                    ]}
                  />
                </View>
              )
            case "journal":
              return (
                <View style={bottomNavBarStyles.journalIcon}>
                  <View
                    style={[
                      bottomNavBarStyles.iconOutline,
                      bottomNavBarStyles.journalIconPart1,
                      { borderColor: iconColor },
                    ]}
                  />
                  <View
                    style={[
                      bottomNavBarStyles.iconOutline,
                      bottomNavBarStyles.journalIconPart2,
                      { borderColor: iconColor },
                    ]}
                  />
                  <View
                    style={[
                      bottomNavBarStyles.iconOutline,
                      bottomNavBarStyles.journalIconPart3,
                      { borderColor: iconColor },
                    ]}
                  />
                </View>
              )
            case "goals":
              return (
                <View style={bottomNavBarStyles.goalsIcon}>
                  <View
                    style={[
                      bottomNavBarStyles.iconOutline,
                      bottomNavBarStyles.goalsIconPart1,
                      { borderColor: iconColor },
                    ]}
                  />
                  <View
                    style={[
                      bottomNavBarStyles.iconOutline,
                      bottomNavBarStyles.goalsIconPart2,
                      { borderColor: iconColor },
                    ]}
                  />
                  <View
                    style={[
                      bottomNavBarStyles.iconOutline,
                      bottomNavBarStyles.goalsIconPart3,
                      { borderColor: iconColor },
                    ]}
                  />
                  <View
                    style={[
                      bottomNavBarStyles.iconOutline,
                      bottomNavBarStyles.goalsIconPart4,
                      { borderColor: iconColor },
                    ]}
                  />
                  <View
                    style={[
                      bottomNavBarStyles.iconOutline,
                      bottomNavBarStyles.goalsIconPart5,
                      { borderColor: iconColor },
                    ]}
                  />
                </View>
              )
            case "shop":
              return (
                <View style={bottomNavBarStyles.shopIcon}>
                  <View
                    style={[
                      bottomNavBarStyles.iconOutline,
                      bottomNavBarStyles.shopIconPart1,
                      { borderColor: iconColor },
                    ]}
                  />
                  <View
                    style={[
                      bottomNavBarStyles.iconOutline,
                      bottomNavBarStyles.shopIconPart2,
                      { borderColor: iconColor },
                    ]}
                  />
                  <View
                    style={[
                      bottomNavBarStyles.iconOutline,
                      bottomNavBarStyles.shopIconPart3,
                      { borderColor: iconColor },
                    ]}
                  />
                </View>
              )
            case "august": // Assuming "August" is a new icon, repurposing 'guides' icon for now
              return (
                <View style={bottomNavBarStyles.guidesIcon}>
                  {/* Reusing existing guides icon for 'August' */}
                  <View
                    style={[
                      bottomNavBarStyles.iconOutline,
                      bottomNavBarStyles.guidesIconPart1,
                      { borderColor: iconColor },
                    ]}
                  />
                  <View
                    style={[
                      bottomNavBarStyles.iconOutline,
                      bottomNavBarStyles.guidesIconPart2,
                      { borderColor: iconColor },
                    ]}
                  />
                </View>
              )
            default:
              return null
          }
        }

        return (
          <TouchableOpacity
            key={tab.name}
            onPress={() => onTabPress(tab.name)}
            activeOpacity={0.7}
            style={bottomNavBarStyles.tabItem}
          >
            <View style={bottomNavBarStyles.tabIconWrapper}>{renderIcon(tab.icon)}</View>
            <Text style={[bottomNavBarStyles.tabText, { color: textColor }]}>{tab.name}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

BottomNavBar.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onTabPress: PropTypes.func,
}
BottomNavBar.defaultProps = {
  onTabPress: () => {},
}

/**
 * Renders a single journal entry card.
 * @param {string} title - The title of the journal entry.
 * @param {string} description - The description/content of the entry.
 * @param {string} timestamp - The time and date of the entry.
 * @param {function} onMenuPress - Callback for pressing the three-dot menu.
 */
const JournalEntryCard = ({ title, description, timestamp, onMenuPress }) => (
  <View style={journalEntryCardStyles.container}>
    <View style={journalEntryCardStyles.contentWrapper}>
      <View style={journalEntryCardStyles.header}>
        <Text style={journalEntryCardStyles.title}>{title}</Text>
      </View>
      <Text style={[journalEntryCardStyles.description, { marginTop: 2 }]}>{description}</Text>
    </View>
    <Text style={journalEntryCardStyles.timestamp}>{timestamp}</Text>
  </View>
)

JournalEntryCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  timestamp: PropTypes.string.isRequired,
  onMenuPress: PropTypes.func,
}
JournalEntryCard.defaultProps = {
  onMenuPress: () => {},
}

/**
 * Renders a floating action button for "Talk to August".
 * @param {function} onPress - Callback for button press.
 */
const FloatingActionButton = ({ onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={fabStyles.container}>
    <View style={fabStyles.iconWrapper}>
      {/* Icon for guides/August - same as bottom nav guides icon */}
      <View style={fabStyles.iconStyle}>
        <View style={fabStyles.iconPart1} />
        <View style={fabStyles.iconPart2} />
      </View>
    </View>
    <Text style={fabStyles.text}>Talk to August</Text>
  </TouchableOpacity>
)

FloatingActionButton.propTypes = {
  onPress: PropTypes.func,
}
FloatingActionButton.defaultProps = {
  onPress: () => {},
}

// --- Main JournalScreen Component ---

const JournalScreen = () => {
  const handleBack = () => {
    console.log("Back button pressed")
    // Implement navigation.goBack() here
  }

  const handleNewEntry = () => {
    console.log("New entry button pressed")
    // Navigate to JournalEntry screen
  }

  const handleJournalMenu = (entryId) => {
    console.log(`Menu pressed for entry: ${entryId}`)
    // Show options for editing/deleting entry
  }

  const handleTalkToAugust = () => {
    console.log("Talk to August button pressed")
    // Navigate to Chat screen
  }

  const handleTabPress = (tabName) => {
    console.log(`Bottom nav tab pressed: ${tabName}`)
    // Implement navigation to respective screens
  }

  const journalEntries = [
    {
      id: "1",
      title: "Reflecting on my wellness journey",
      description:
        "Today I took some time to think about my personal growth and the small steps I'm taking toward better self-care and understanding.",
      timestamp: "Tue, Aug 3, 2025 at 3:18pm",
    },
    {
      id: "2",
      title: "Gratitude and mindfulness practice",
      description:
        "Spent time in quiet reflection, focusing on the things I'm grateful for and practicing being present in the moment.",
      timestamp: "Mon, Aug 2, 2025 at 7:45am",
    },
    {
      id: "3",
      title: "Learning about myself",
      description:
        "Had some important realizations about my needs, boundaries, and what makes me feel most authentic and confident.",
      timestamp: "Sun, Aug 1, 2025 at 9:22pm",
    },
  ]

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Navigation: Back Button, Title, and New Entry Button */}
      <View style={styles.topNavSection}>
        <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={styles.backButton}>
          <View style={styles.backButtonIcon} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Journal</Text>
        <TouchableOpacity onPress={handleNewEntry} activeOpacity={0.7} style={styles.newEntryButton}>
          <View style={styles.newEntryIcon}>
            <View style={styles.newEntryIconLine1} />
            <View style={styles.newEntryIconLine2} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
        <View style={styles.journalEntriesContainer}>
          {journalEntries.map((entry) => (
            <JournalEntryCard
              key={entry.id}
              title={entry.title}
              description={entry.description}
              timestamp={entry.timestamp}
              onMenuPress={() => handleJournalMenu(entry.id)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FloatingActionButton onPress={handleTalkToAugust} />

      {/* Bottom Navigation Bar */}
      <BottomNavBar activeTab="Journal" onTabPress={handleTabPress} />
    </SafeAreaView>
  )
}

// --- Stylesheets ---

const bottomNavBarStyles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: toDp(4), // px-4 (16px)
    paddingVertical: toDp(3), // py-3 (12px)
    backgroundColor: "#171717", // neutral-900
    borderRadius: 16, // rounded-2xl (top corners) - applies to overall container in HTML
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    overflow: "hidden",
    position: "absolute", // Fixed at bottom
    bottom: Platform.OS === "ios" ? toDp(20) : toDp(10), // Adjust for safe area and look
    alignSelf: "center", // Center it on the screen
    width: windowWidth - getResponsiveHorizontalPadding(20) * 2, // Matches overall content width
  },
  tabItem: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: toDp(1), // 4px
    paddingVertical: toDp(1), // Add some padding to increase touch area
    flex: 1, // Distribute space evenly
  },
  tabIconWrapper: {
    width: 24, // w-6
    height: 24, // h-6
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  tabText: {
    fontSize: 12, // text-xs
    fontWeight: "500", // medium
    fontFamily: "Larsseit",
    lineHeight: 12, // leading-none
  },
  // Reusable outline style for icons
  iconOutline: {
    borderWidth: 0.75, // outline-[1.50px] in HTML usually means 0.75px border in RN
    position: "absolute",
  },
  // Home Icon
  homeIcon: { width: 24, height: 24, position: "relative" },
  homeIconPart1: { width: 20, height: 20, left: 2, top: 2.02, borderRadius: 0 },
  homeIconPart2: { width: 0, height: 3, left: 12, top: 14.99 },
  // Journal Icon
  journalIcon: { width: 24, height: 24, position: "relative" },
  journalIconPart1: { width: 16, height: 20, left: 4, top: 2 },
  journalIconPart2: { width: 0, height: 5, left: 18, top: 17 },
  journalIconPart3: { width: 0, height: 4, left: 8, top: 4 },
  // Goals Icon
  goalsIcon: { width: 24, height: 24, position: "relative" },
  goalsIconPart1: { width: 0, height: 6, left: 12, top: 12 },
  goalsIconPart2: { width: 8, height: 4, left: 8, top: 18 },
  goalsIconPart3: { width: 3, height: 6, left: 2, top: 5 },
  goalsIconPart4: { width: 3, height: 6, left: 19, top: 5 },
  goalsIconPart5: { width: 14, height: 10, left: 5, top: 2 },
  // Shop Icon
  shopIcon: { width: 24, height: 24, position: "relative" },
  shopIconPart1: { width: 16, height: 10, left: 3, top: 10.99 },
  shopIconPart2: { width: 6, height: 1, left: 9, top: 16.98 },
  shopIconPart3: { width: 20, height: 10, left: 2, top: 2.5 },
  // Guides/August Icon (reused for August tab)
  guidesIcon: { width: 24, height: 24, position: "relative" },
  guidesIconPart1: { width: 14, height: 14, left: 3, top: 7 },
  guidesIconPart2: { width: 6, height: 6, left: 15, top: 3 },
})

const journalEntryCardStyles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    padding: toDp(4), // p-4 (16px)
    backgroundColor: "#FAFAFA", // stone-50
    borderRadius: 20, // rounded-[20px]
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: toDp(4), // 16px
    overflow: "hidden",
  },
  contentWrapper: {
    alignSelf: "stretch",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: toDp(1.5), // 6px
  },
  header: {
    alignSelf: "stretch",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: "#171717", // neutral-900
    fontSize: 18, // text-lg
    fontWeight: "500", // medium
    fontFamily: "Larsseit",
    lineHeight: 28, // relaxed
    flexShrink: 1, // Allow title to wrap
  },
  menuDots: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: toDp(1), // 4px
    paddingVertical: toDp(1), // Increase touchable area
    paddingHorizontal: toDp(0.5),
  },
  dot: {
    width: toDp(1), // w-1 (4px)
    height: toDp(1), // h-1 (4px)
    backgroundColor: "#4B5563", // gray-600
    borderRadius: 9999, // rounded-full
  },
  description: {
    alignSelf: "stretch",
    color: "#4B5563", // gray-600
    fontSize: 16, // text-base
    fontWeight: "500", // medium
    fontFamily: "Larsseit",
    lineHeight: 24, // normal
  },
  timestamp: {
    color: "#94A3B8", // slate-400
    fontSize: 12, // text-xs
    fontWeight: "500", // medium
    fontFamily: "Larsseit",
    lineHeight: 12, // leading-none
  },
})

const fabStyles = StyleSheet.create({
  container: {
    padding: toDp(2), // p-2 (8px)
    backgroundColor: "#3B82F6", // blue-700
    borderRadius: 9999, // rounded-full
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: toDp(3), // 12px
    overflow: "hidden",
    position: "absolute",
    // Calculate position based on a common reference point like bottom-center relative to safe area
    bottom: Platform.OS === "ios" ? toDp(85) : toDp(75), // Adjust to be above bottom nav bar
    alignSelf: "center", // Center horizontally
  },
  iconWrapper: {
    width: 24, // w-6
    height: 24, // h-6
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  iconStyle: { width: 24, height: 24, position: "relative" },
  iconPart1: {
    width: 14,
    height: 14,
    left: 3,
    top: 7,
    position: "absolute",
    borderWidth: 0.75,
    borderColor: "white",
  },
  iconPart2: {
    width: 6,
    height: 6,
    left: 15,
    top: 3,
    position: "absolute",
    borderWidth: 0.75,
    borderColor: "white",
  },
  text: {
    color: "#FFFFFF", // white
    fontSize: 14, // text-sm
    fontWeight: "500", // medium
    fontFamily: "Larsseit",
    lineHeight: 18, // tight
  },
})

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    // No specific bottom padding here, let ScrollView handle content
  },
  topNavSection: {
    width: "100%",
    paddingHorizontal: getResponsiveHorizontalPadding(20), // Left-[20px] and right spacing
    marginTop: getResponsiveHorizontalPadding(20), // Top spacing
    marginBottom: toDp(8), // Gap to content (139px from top nav to content 148px = 9px from current design)
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  screenTitle: {
    flex: 1, // Allows title to take available space
    textAlign: "center",
    color: "#171717", // neutral-900
    fontSize: 16,
    fontWeight: "500", // medium
    fontFamily: "Larsseit",
    lineHeight: 24, // normal
  },
  newEntryButton: {
    width: 48, // w-12
    height: 48, // h-12
    borderRadius: 9999, // rounded-full
    backgroundColor: "#3B82F6", // blue-700
    justifyContent: "center",
    alignItems: "center",
  },
  newEntryIcon: {
    // Plus icon
    width: 24, // w-6
    height: 24, // h-6
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  newEntryIconLine1: {
    width: 12, // w-3
    height: 12, // h-3
    left: 8, // left-[8px]
    top: 3, // top-[3px]
    position: "absolute",
    borderWidth: 0.75, // outline-[1.50px]
    borderColor: "#FFFFFF", // white
  },
  newEntryIconLine2: {
    width: 16, // w-4
    height: 16, // h-4
    left: 3, // left-[3px]
    top: 5, // top-[5px]
    position: "absolute",
    borderWidth: 0.75, // outline-[1.50px]
    borderColor: "#FFFFFF", // white
  },

  scrollViewContent: {
    flexGrow: 1, // Allows content to grow and be scrollable
    paddingHorizontal: getResponsiveHorizontalPadding(20), // Match screen horizontal padding
    paddingBottom: Platform.OS === "ios" ? toDp(100) : toDp(90), // Space for FAB and bottom nav
  },
  journalEntriesContainer: {
    flexDirection: "column",
    gap: toDp(3), // 12px gap between entries
  },
})

export default JournalScreen
