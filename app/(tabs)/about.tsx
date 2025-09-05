import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const owners = [
  { name: "Ananya K", info: "Passionate about technology and innovation.", icon: "lightbulb-on", color: "#A4508B" },
  { name: "Dhanush D", info: "Expert in software development and design.", icon: "code-tags", color: "#e40a0a" },
  { name: "Bhushan Shenoy", info: "Focused on user experience and interfaces.", icon: "palette", color: "#9D50BB" },
  { name: "Deepali S Kunder", info: "Dedicated to performance and scalability.", icon: "speedometer", color: "#F7981C" },
];

export default function AboutOwnerScreen() {
  return (
    <View style={styles.outerContainer}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: "#e40a0a" }]}>About the Owners 🧑‍💼</Text>
        {owners.map(({ name, info, icon, color }) => (
          <View key={name} style={styles.ownerCard}>
            {/* Watermark background */}
            <Text style={[styles.watermark, { color: `${color}22` }]}>{name}</Text>
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <Icon name={icon} size={36} color={color} />
              </View>
              <View style={styles.ownerInfoContainer}>
                <Text style={[styles.ownerName, { color }]}>{name}</Text>
                <Text style={styles.ownerInfo}>{info}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <Text style={styles.footerText}>© {new Date().getFullYear()} AB2D Company. All rights reserved.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#120045",
  },
  container: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "flex-start",
    paddingBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    marginBottom: 30,
    letterSpacing: 2,
    textShadowColor: "#8A2BE2",
    textShadowRadius: 5,
    textShadowOffset: { width: 1, height: 2 },
    textAlign: "center",
    width: "100%",
  },
  ownerCard: {
    position: "relative",
    paddingVertical: 24,
    marginBottom: 28,
    width: "100%",
    overflow: "hidden",
  },
  watermark: {
    position: "absolute",
    top: 12,
    left: 20,
    fontSize: 86,
    fontWeight: "900",
    letterSpacing: 6,
    opacity: 0.12,
    textTransform: "uppercase",
    zIndex: 0,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    backgroundColor: "transparent",
  },
  ownerInfoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  ownerName: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 0.6,
  },
  ownerInfo: {
    fontSize: 16,
    color: "#E6E6FAcc",
    lineHeight: 22,
    fontWeight: "500",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    paddingVertical: 16,
    backgroundColor: "rgba(18, 0, 69, 0.9)",
    borderTopWidth: 1,
    borderTopColor: "#6a0dad",
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: {
    textAlign: "center",
    color: "#f0e6ffcc",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 1,
  },
});
