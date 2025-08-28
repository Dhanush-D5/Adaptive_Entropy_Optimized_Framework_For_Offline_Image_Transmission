import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import * as Contacts from "expo-contacts";
import { useRouter } from "expo-router";

export default function FetchContacts() {
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Contacts</Text>

      <FlatList
        data={contacts}
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
  container: { flex: 1, padding: 20, backgroundColor: "#140028" },
  title: { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 10 },
  contactCard: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  contactName: { fontSize: 18, fontWeight: "500", color: "#fff" },
  phone: { color: "#aaa", marginTop: 2 },
});
