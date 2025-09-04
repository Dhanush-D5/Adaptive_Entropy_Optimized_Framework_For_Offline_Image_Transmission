import { View, Text, StyleSheet, ScrollView } from "react-native";

export default function AboutOwnerScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>About the Owners 🧑‍💼</Text>

      <View style={styles.ownerCard}>
        <Text style={styles.ownerName}>Ananya K</Text>
        <Text style={styles.ownerInfo}>Passionate about technology and innovation.</Text>
      </View>

      <View style={styles.ownerCard}>
        <Text style={styles.ownerName}>Bhushan Shenoy</Text>
        <Text style={styles.ownerInfo}>Expert in software development and design.</Text>
      </View>

      <View style={styles.ownerCard}>
        <Text style={styles.ownerName}>Deepali S Kunder</Text>
        <Text style={styles.ownerInfo}>Focused on user experience and interfaces.</Text>
      </View>

      <View style={styles.ownerCard}>
        <Text style={styles.ownerName}>Dhanush D</Text>
        <Text style={styles.ownerInfo}>Dedicated to performance and scalability.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: "#140028", // deep purple background
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    color: "#6a0dad", // vibrant purple
    fontWeight: "700",
    marginBottom: 30,
    textAlign: "center",
  },
  ownerCard: {
    backgroundColor: "#1e1e2f", // dark card
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    width: "100%",
    shadowColor: "#6a0dad", // subtle purple shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  ownerName: {
    fontSize: 22,
    color: "#6a0dad", // vibrant purple
    fontWeight: "700",
    marginBottom: 8,
  },
  ownerInfo: {
    fontSize: 16,
    color: "#d1c4e9", // muted purple-grey
    lineHeight: 22,
  },
});
