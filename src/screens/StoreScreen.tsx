import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  StatusBar,
  Platform,
  SafeAreaView,
} from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { AppStackParamList } from "../navigation/AppNavigator";

// Talk to August Design System colors
const colors = {
  gray900: "#1A1F24",
  gray800: "#242B33",
  gray700: "#495766",
  gray500: "#A1AEBC",
  gray300: "#D7DCE2",
  gray100: "#F2F3F5",
  white: "#FFFFFF",
  ttaBlue500: "#2154E0",
  ttaBlue50: "#E9EEFC",
  black: "#000000",
};

const StoreScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Store URL
  const storeUrl = "https://order.famasi.me/order?redirect=4oKYj";

  // Background image
  const backgroundImage = require("../../assets/images/Backgroundforaudio.png");

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <ImageBackground source={backgroundImage} style={styles.background}>
        {/* WebView - Full Screen */}
          <View style={styles.webViewContainer}>
            <View style={styles.webViewWrapper}>
              <WebView
                source={{ uri: storeUrl }}
              style={[styles.webView, isLoading ? { opacity: 0 } : { opacity: 1 }]}
                onLoadStart={() => setIsLoading(true)}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
                startInLoadingState={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
              />
            </View>

            {isLoading && (
              <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.white} />
                <Text style={styles.loadingText}>Loading store...</Text>
              </View>
            )}

            {hasError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  Sorry, we couldn't load the store.
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    setHasError(false);
                    setIsLoading(true);
                  }}
                >
                  <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}
        </View>

        {/* Header - Positioned as overlay */}
        <SafeAreaView style={styles.headerOverlay}>
          <View style={styles.headerRowCentered}>
            <View style={styles.closeButtonPlaceholder} />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => navigation.goBack()}
            >
              <View style={styles.closeButtonContent}>
                <Text style={styles.closeButtonText}>Close</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.titleWrapperAbsolute} pointerEvents="none">
              <Text style={styles.headerTitleAbsolute}>Store</Text>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  background: {
    flex: 1,
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerRowCentered: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.white,
    fontFamily: "Larsseit",
  },
  placeholderView: {
    width: 44, // Same width as backButton for balanced layout
  },
  webViewContainer: {
    flex: 1,
  },
  webViewWrapper: {
    flex: 1,
    overflow: "hidden",
  },
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.white,
    fontWeight: "500",
  },
  errorContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(33, 84, 224, 0.8)",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: colors.white,
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.ttaBlue500,
    borderRadius: 12,
  },
  retryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    padding: 12,
    backgroundColor: colors.ttaBlue50,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    minWidth: 44,
    minHeight: 44,
  },
  closeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeButtonText: {
    color: colors.ttaBlue500,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Larsseit",
    lineHeight: 18,
  },
  closeButtonPlaceholder: {
    minWidth: 44,
    minHeight: 44,
  },
  titleWrapperAbsolute: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  headerTitleAbsolute: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    fontFamily: 'Larsseit',
  },
});

export default StoreScreen;
