import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, Linking } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { getAppointmentById, deleteAppointment } from "../database/db"; // Importar funciones de la base de datos
import AppointmentUpdateModal from "../components/AppointmentUpdateModal"; // Importar el modal de actualización

const AppointmentDetailsScreen = ({ route, navigation }) => {
  const { appointmentId } = route.params || {};
  const [appointment, setAppointment] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  // Cargar los datos de la cita
  const loadAppointment = async () => {
    try {
      const data = await getAppointmentById(appointmentId);
      if (data) {
        setAppointment(data);
      } else {
        Alert.alert("Error", "No se encontró la cita seleccionada");
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo cargar la cita");
      console.error(error);
    }
  };

  // Cargar la cita al iniciar la pantalla
  useEffect(() => {
    loadAppointment();
  }, [appointmentId]);

  // Eliminar la cita
  const handleDelete = async () => {
    try {
      Alert.alert("Confirmar", "¿Estás seguro de eliminar la cita?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", onPress: deleteAppointmentHandler },
      ]);
    } catch (error) {
      Alert.alert("Error", "No se pudo eliminar la cita");
      console.error(error);
    }
  };

  // Función para eliminar la cita
  const deleteAppointmentHandler = async () => {
    try {
      await deleteAppointment(appointmentId);
      Alert.alert("Éxito", "La cita ha sido eliminada");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "No se pudo eliminar la cita");
      console.error(error);
    }
  };

  // Recargar los datos después de actualizar
  const handleSave = () => {
    loadAppointment(); // Recargar los datos de la cita
  };

  // Abrir WhatsApp con el número de teléfono
  const openWhatsApp = () => {
    if (!appointment || !appointment.clientPhone) {
      Alert.alert("Error", "No hay un número de teléfono válido");
      return;
    }

    // Limpiar el número de teléfono (eliminar espacios, guiones, etc.)
    const cleanPhone = appointment.clientPhone.replace(/\D/g, "");

    // Crear el enlace de WhatsApp
    const url = `https://wa.me/+57${cleanPhone}`;

    // Abrir el enlace
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "No se pudo abrir WhatsApp");
    });
  };

  if (!appointment) {
    return (
      <View style={styles.container}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.card}>
        <Text style={styles.title}>Detalles de la Cita</Text>

        <View style={styles.infoContainer}>
          <Icon name="user" size={20} color="#4CAF50" style={styles.icon} />
          <Text style={styles.label}>Nombre del Cliente:</Text>
          <Text style={styles.infoText}>{appointment.clientName}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Icon name="phone" size={20} color="#4CAF50" style={styles.icon} />
          <Text style={styles.label}>Teléfono:</Text>
          <Text style={styles.infoText}>{appointment.clientPhone}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Icon name="calendar" size={20} color="#4CAF50" style={styles.icon} />
          <Text style={styles.label}>Servicio:</Text>
          <Text style={styles.infoText}>{appointment.service}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Icon name="clock-o" size={20} color="#4CAF50" style={styles.icon} />
          <Text style={styles.label}>Hora de Inicio:</Text>
          <Text style={styles.infoText}>{appointment.startTime}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Icon name="clock-o" size={20} color="#4CAF50" style={styles.icon} />
          <Text style={styles.label}>Hora de Fin:</Text>
          <Text style={styles.infoText}>{appointment.endTime}</Text>
        </View>

        {/* Botón de WhatsApp */}
        <TouchableOpacity style={styles.whatsappButton} onPress={openWhatsApp}>
          <Icon name="whatsapp" size={30} color="#25D366" />
        </TouchableOpacity>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.updateButton]}
            onPress={() => setIsEditModalVisible(true)} // Abrir el modal
          >
            <Text style={styles.buttonText}>Actualizar Cita</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
            <Text style={styles.buttonText}>Eliminar Cita</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de actualización */}
      <AppointmentUpdateModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        appointment={appointment}
        onSave={handleSave} // Recargar los datos después de guardar
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  icon: {
    marginRight: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
    marginRight: 10,
  },
  infoText: {
    fontSize: 16,
    color: "#333",
  },
  whatsappButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  whatsappButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  updateButton: {
    backgroundColor: "#4CAF50",
  },
  deleteButton: {
    backgroundColor: "#F44336",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AppointmentDetailsScreen;