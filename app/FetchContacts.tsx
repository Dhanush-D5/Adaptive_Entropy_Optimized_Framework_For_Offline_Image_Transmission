import * as Contacts from "expo-contacts";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const ALPHABETS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function FetchContacts() {
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const router = useRouter();
  const flatListRef = useRef<FlatList<Contacts.Contact>>(null);

  const loadContacts = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === "granted") {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      const filtered = data.filter(
        (c) => c.phoneNumbers && c.phoneNumbers.some((p) => p.number)
      );

      filtered.sort((a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "", undefined, { sensitivity: "base" })
      );
      setContacts(filtered);
    } else {
      alert("Permission denied. Please enable contacts permission.");
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const filteredContacts = contacts.filter((c) =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollToLetter = (letter: string) => {
    if (!flatListRef.current) return;
    const index = filteredContacts.findIndex(
      (contact) => contact.name?.toUpperCase().startsWith(letter)
    );
    if (index !== -1) {
      flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0 });
    }
  };

  const handleLogout = () => {
    router.replace("/");
  };

  const renderContact = ({ item }: { item: Contacts.Contact }) => {
    const uniqueNumbers = [
      ...new Set(
        item.phoneNumbers
          ?.map((p) => p.number)
          .filter((num): num is string => Boolean(num))
          .map((num) => num.replace(/\D/g, "")) // digits only
      ),
    ];

    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/ImageTransmissionScreen",
            params: {
              contactId: item.id ?? "",
              name: item.name ?? "Unnamed",
              numbers: JSON.stringify(uniqueNumbers),
            },
          })
        }
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Open contact ${item.name}`}
      >
        <View style={styles.contactCard}>
          <Text style={styles.contactName}>{item.name}</Text>
          {uniqueNumbers.map((num, i) => (
            <Text key={i} style={styles.phone}>
              {num}
            </Text>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.select({ ios: 100, android: 80 })}
    >
      {/* Logout Button */}
      <View style={styles.topSection}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          accessibilityRole="button"
          accessibilityLabel="Logout"
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Title with Icon */}
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/images/icons_155043.png")}
          style={styles.largeLogoImage}
          accessibilityIgnoresInvertColors={true}
          accessible
          accessibilityLabel="Contacts icon"
        />
        <Text style={styles.titleLarge}>Contacts</Text>
      </View>

      {/* Search Bar */}
      <TextInput
        placeholder="Search contacts..."
        placeholderTextColor="#999"
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        accessibilityLabel="Search contacts"
        accessibilityHint="Filter contacts by name"
        clearButtonMode="while-editing"
      />

      <View style={styles.listAndSidebar}>
        <FlatList
          ref={flatListRef}
          data={filteredContacts}
          keyExtractor={(item) => item.id ?? Math.random().toString()}
          renderItem={renderContact}
          initialNumToRender={15}
          maxToRenderPerBatch={20}
          windowSize={10}
          contentContainerStyle={{ paddingBottom: 20 }}
          style={{ flex: 1 }}
          getItemLayout={(_, index) => ({
            length: 90,
            offset: 90 * index,
            index,
          })}
          keyboardShouldPersistTaps="handled"
        />

        {/* Alphabet Sidebar */}
        <View style={styles.alphabetContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {ALPHABETS.map((letter) => (
              <TouchableOpacity
                key={letter}
                onPress={() => scrollToLetter(letter)}
                activeOpacity={0.6}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={`Scroll to contacts starting with letter ${letter}`}
              >
                <Text style={styles.letter}>{letter}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#140028",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  topSection: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: "#6a0dad",
    paddingVertical: 14,
    paddingHorizontal: 80,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
    textAlign: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  largeLogoImage: {
    width: 100,
    height: 100,
    marginBottom: 8,
  },
  titleLarge: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  searchInput: {
    backgroundColor: "#1e1e2f",
    width: "100%",
    color: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 15,
    fontSize: 18,
  },
  listAndSidebar: {
    flexDirection: "row",
    flex: 1,
  },
  contactCard: {
    backgroundColor: "#1e1e2f",
    width: "100%",
    borderRadius: 20,
    padding: 15,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  contactName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#6a0dad",
    marginBottom: 6,
  },
  phone: {
    fontSize: 16,
    color: "#d1c4e9",
    marginTop: 3,
  },
  alphabetContainer: {
    width: 50,
    justifyContent: "flex-start",
    alignItems: "center",
    marginLeft: 10,
    backgroundColor: "#000000",
    borderRadius: 14,
    paddingVertical: 10,
    height: "100%",
  },
  letter: {
    fontSize: 18,
    color: "#6a0dad",
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontWeight: "700",
    userSelect: "none",
  },
});
