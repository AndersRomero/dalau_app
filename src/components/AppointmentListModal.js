import React from "react";
import { View, Text, Modal, FlatList, TouchableOpacity, StyleSheet } from "react-native";
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
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Citas del Día</Text>

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
                  <Text style={styles.appointmentService}>{item.service}</Text>
                  <Text style={styles.appointmentClient}>{item.clientName}</Text>
                  <Text style={styles.appointmentTime}>
                    {formatTimeForDisplay(item.startTime)} - {formatTimeForDisplay(item.endTime)}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Fondo semitransparente
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#FFF0F5", // Fondo rosa claro
    borderRadius: 10,
    padding: 20,
    maxHeight: "80%", // Limitar la altura del modal
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#FF1493", // Rosa más intenso
    textAlign: "center",
    marginBottom: 20,
  },
  noAppointments: {
    textAlign: "center",
    fontSize: 25,
    color: "#666",
    marginTop: 20,
  },
  appointmentItem: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appointmentService: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FF69B4", // Rosa más intenso
  },
  appointmentClient: {
    fontSize: 20,
    color: "#333",
    marginTop: 5,
  },
  appointmentTime: {
    fontSize: 18,
    color: "#666",
    marginTop: 5,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#FF69B4", // Rosa oscuro
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 25,
    color: "#fff",
    fontWeight: "bold",
  },
});

export default AppointmentListModal;