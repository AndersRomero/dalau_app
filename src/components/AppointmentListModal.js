import React from "react";
import { View, Text, Modal, FlatList, TouchableOpacity, Button, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

const AppointmentListModal = ({ visible, onClose, appointments }) => {
  const navigation = useNavigation();

  // Función para formatear la hora en formato de 12 horas (AM/PM)
  const formatTimeForDisplay = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const date = new Date(`1970-01-01T${hours}:${minutes}:00`);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  // Ordenar las citas por hora de inicio (startTime) en orden ascendente
  const sortedAppointments = appointments.slice().sort((a, b) => {
    const timeA = new Date(`1970-01-01T${a.startTime}:00`).getTime();
    const timeB = new Date(`1970-01-01T${b.startTime}:00`).getTime();
    return timeA - timeB; // Orden ascendente (de la más temprana a la más tarde)
  });

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <Text style={styles.title}>Citas del Día {appointments.date}</Text>

        {sortedAppointments.length === 0 ? (
          <Text style={styles.noAppointments}>No hay citas para este día.</Text>
        ) : (
          <FlatList
            data={sortedAppointments} // Usar la lista ordenada
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.appointmentItem}
                onPress={() => {
                  onClose();
                  navigation.navigate("AppointmentDetailsScreen", { appointmentId: item.id }); // Pasamos "appointmentId"
                }}
              >
                <Text style={styles.appointmentText}> {item.service} --- {item.clientName}  </Text>
                <Text style={styles.appointmentText}>
                  {formatTimeForDisplay(item.startTime)} - {formatTimeForDisplay(item.endTime)}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}

        <Button title="Cerrar" onPress={onClose} color="red" />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  noAppointments: {
    textAlign: "center",
    fontSize: 16,
    color: "gray",
  },
  appointmentItem: {
    padding: 15,
    backgroundColor: "#f0f0f0",
    marginVertical: 5,
    borderRadius: 5,
  },
  appointmentText: {
    fontSize: 16,
  },
});

export default AppointmentListModal;