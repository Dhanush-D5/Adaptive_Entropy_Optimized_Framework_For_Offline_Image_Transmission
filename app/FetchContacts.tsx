import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import * as Contacts from "expo-contacts";
import { useRouter } from "expo-router";

export default function FetchContacts() {
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const router = useRouter();

  const loadContacts = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === "granted") {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      const filtered = data.filter(
        (c) => c.phoneNumbers && c.phoneNumbers.some((p) => p.number)
      );
      setContacts(filtered);
    } else {
      alert("Permission denied.");
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  // Filter contacts based on search
  const filteredContacts = contacts.filter((c) =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contacts Directory</Text>

      {/* Search Bar */}
      <TextInput
        placeholder="Search contacts..."
        placeholderTextColor="#999"
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
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
                  pathname: "/Base64Conversion",
                  params: {
                    contactId: item.id ?? "",
                    name: item.name ?? "Unnamed",
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#140028",
    padding: 20,
  },
  title: {
    fontSize: 36, // larger title for directory feel
    fontWeight: "700",
    color: "#fff",
    marginBottom: 15,
    textAlign: "center",
  },
  searchInput: {
    backgroundColor: "#1e1e2f",
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
    padding: 20, // increased padding for larger cards
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  contactName: {
    fontSize: 24, // larger contact name
    fontWeight: "700",
    color: "#6a0dad",
    marginBottom: 10,
  },
  phone: {
    fontSize: 18, // larger phone number
    color: "#d1c4e9",
    marginTop: 3,
  },
});
