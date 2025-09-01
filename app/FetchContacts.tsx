import * as Contacts from "expo-contacts";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
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
      alert("Permission denied.");
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
    const index = filteredContacts.findIndex((contact) =>
      contact.name?.toUpperCase().startsWith(letter)
    );
    if (index !== -1) {
      flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0 });
    }
  };

  const handleLogout = () => {
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      {/* Logout Button */}
      <View style={styles.topSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Contacts</Text>

      {/* Search Bar */}
      <TextInput
        placeholder="Search contacts..."
        placeholderTextColor="#999"
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={{ flexDirection: "row", flex: 1 }}>
        <FlatList
          ref={flatListRef}
          data={filteredContacts}
          keyExtractor={(item) => item.id ?? Math.random().toString()}
          renderItem={({ item }) => {
            const uniqueNumbers = [
              ...new Set(
                item.phoneNumbers
                  ?.map((p) => p.number)
                  .filter((num): num is string => Boolean(num))
                  .map((num) => num.replace(/\D/g, ""))
              ),
            ];

            return (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/ImageTransmissionScreen",
                    params: {
                      contactId: item.id ?? "",
                      contactName: item.name ?? "Unnamed", // pass name param here
                      numbers: JSON.stringify(uniqueNumbers),
                    },
                  })
                }
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
          }}
          initialNumToRender={15}
          maxToRenderPerBatch={20}
          windowSize={10}
          style={{ flex: 1 }}
          getItemLayout={(_, index) => ({
            length: 100,
            offset: 100 * index,
            index,
          })}
        />

        {/* Alphabet Sidebar with ScrollView */}
        <View style={styles.alphabetContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {ALPHABETS.map((letter) => (
              <TouchableOpacity
                key={letter}
                onPress={() => scrollToLetter(letter)}
                activeOpacity={0.6}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.letter}>{letter}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#140028",
    padding: 20,
  },
  topSection: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: "#6a0dad",
    paddingVertical: 14,
    paddingHorizontal: 160,
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
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
    textAlign: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 15,
    textAlign: "center",
  },
  searchInput: {
    backgroundColor: "#1e1e2f",
    width: "100%",
    color: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 15,
    fontSize: 18,
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
    fontSize: 24,
    fontWeight: "700",
    color: "#6a0dad",
    marginBottom: 10,
  },
  phone: {
    fontSize: 18,
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
    height: 590,
  },
  letter: {
    fontSize: 18,
    color: "#6a0dad",
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontWeight: "700",
    userSelect: "none",
  },
});
