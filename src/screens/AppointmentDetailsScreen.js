import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Modal } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { getAppointmentById, deleteAppointment } from "../database/db"; // Importar funciones de la base de datos
import AppointmentUpdateModal from "../components/AppointmentUpdateModal"; // Importar el modal de actualización
import { cancelAppointmentNotification } from "../notifications/index"; // Importar la función para cancelar la notificación

const AppointmentDetailsScreen = ({ route, navigation }) => {
  const { appointmentId } = route.params || {};
  const [appointment, setAppointment] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [customAlertVisible, setCustomAlertVisible] = useState(false); // Estado para la alerta personalizada
  const [alertMessage, setAlertMessage] = useState(""); // Mensaje de la alerta
  const [alertType, setAlertType] = useState("info"); // Tipo de alerta (info, error, success)

  // Cargar los datos de la cita
  const loadAppointment = async () => {
    try {
      const data = await getAppointmentById(appointmentId);
      if (data) {
        setAppointment(data);
      } else {
        showCustomAlert("No se encontró la cita seleccionada", "error");
        navigation.goBack();
      }
    } catch (error) {
      showCustomAlert("No se pudo cargar la cita", "error");
      console.error(error);
    }
  };

  // Cargar la cita al iniciar la pantalla
  useEffect(() => {
    loadAppointment();
  }, [appointmentId]);

  // Formatear la hora en formato de 12 horas (AM/PM)
  const formatTimeForDisplay = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const date = new Date(`1970-01-01T${hours}:${minutes}:00`);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  // Mostrar alerta personalizada
  const showCustomAlert = (message, type = "info") => {
    setAlertMessage(message);
    setAlertType(type);
    setCustomAlertVisible(true);
  };

  // Cerrar alerta personalizada
  const closeCustomAlert = () => {
    setCustomAlertVisible(false);
  };

  // Eliminar la cita
  const handleDelete = async () => {
    showCustomAlert("¿Estás seguro de eliminar la cita?", "confirm");
  };

  // Función para eliminar la cita
  const deleteAppointmentHandler = async () => {
    try {
      await deleteAppointment(appointmentId);
      showCustomAlert("La cita ha sido eliminada", "success");
      await cancelAppointmentNotification(appointmentId); // Cancelar la notificación de la cita
      navigation.goBack();
    } catch (error) {
      showCustomAlert("No se pudo eliminar la cita", "error");
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
      showCustomAlert("No hay un número de teléfono válido", "error");
      return;
    }

    // Limpiar el número de teléfono (eliminar espacios, guiones, etc.)
    const cleanPhone = appointment.clientPhone.replace(/\D/g, "");

    // Crear el enlace de WhatsApp
    const url = `https://wa.me/+57${cleanPhone}`;

    // Abrir el enlace
    Linking.openURL(url).catch(() => {
      showCustomAlert("No se pudo abrir WhatsApp", "error");
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
        {/* Información de la cita */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Información de la Cita</Text>
          <View style={styles.infoRow}>
            <Icon name="calendar" size={30} color="#FF69B4" style={styles.icon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Fecha:</Text>
              <Text style={styles.infoText}>{appointment.date}</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Información del Cliente</Text>
          <View style={styles.infoRow}>
            <Icon name="user" size={30} color="#FF69B4" style={styles.icon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Nombre:</Text>
              <Text style={styles.infoText}>{appointment.clientName}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Icon name="phone" size={30} color="#FF69B4" style={styles.icon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Teléfono:</Text>
              <Text style={styles.infoText}>{appointment.clientPhone}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Detalles de la Cita</Text>
          <View style={styles.infoRow}>
            <Icon name="paint-brush" size={30} color="#FF69B4" style={styles.icon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Servicio:</Text>
              <Text style={styles.infoText}>{appointment.service}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Icon name="clock-o" size={30} color="#FF69B4" style={styles.icon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Hora de Inicio:</Text>
              <Text style={styles.infoText}>{formatTimeForDisplay(appointment.startTime)}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Icon name="clock-o" size={30} color="#FF69B4" style={styles.icon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Hora de Fin:</Text>
              <Text style={styles.infoText}>{formatTimeForDisplay(appointment.endTime)}</Text>
            </View>
          </View>
        </View>

        {/* Botones de acciones */}
        <View style={styles.actionsContainer}>
          {/* Botón de WhatsApp */}
          <TouchableOpacity style={styles.actionButton} onPress={openWhatsApp}>
            <Icon name="whatsapp" size={50} color="#25D366" />
          </TouchableOpacity>

          {/* Botón de Actualizar (Lápiz) */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setIsEditModalVisible(true)}
          >
            <Icon name="pencil" size={50} color="#FF69B4" />
          </TouchableOpacity>

          {/* Botón de Eliminar (Basura) */}
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Icon name="trash" size={50} color="#FF1493" />
          </TouchableOpacity>
        </View>

        {/* Botón de Volver */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de actualización */}
      <AppointmentUpdateModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        appointment={appointment}
        onSave={handleSave} // Recargar los datos después de guardar
      />

      {/* Alerta personalizada */}
      <Modal visible={customAlertVisible} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={[
            styles.alertContainer,
            alertType === "error" && styles.alertError,
            alertType === "success" && styles.alertSuccess,
            alertType === "confirm" && styles.alertConfirm,
          ]}>
            <Text style={styles.alertText}>{alertMessage}</Text>
            <View style={styles.alertButtonContainer}>
              {alertType === "confirm" && (
                <TouchableOpacity style={[styles.alertButton, styles.alertButtonCancel]} onPress={closeCustomAlert}>
                  <Text style={styles.alertButtonText}>Cancelar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.alertButton, styles.alertButtonConfirm]}
                onPress={() => {
                  if (alertType === "confirm") {
                    deleteAppointmentHandler();
                  }
                  closeCustomAlert();
                }}
              >
                <Text style={styles.alertButtonText}>{alertType === "confirm" ? "Eliminar" : "Aceptar"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
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
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#FF69B4",
    marginTop: 5,
    marginBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: "#FF69B4",
    paddingBottom: 5,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  icon: {
    marginRight: 15,
  },
  infoLabel: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 5,
  },
  infoText: {
    fontSize: 18,
    color: "#333",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 25,
  },
  actionButton: {
    padding: 10,
  },
  backButton: {
    marginTop: 40, // Más espacio arriba del botón
    backgroundColor: "#FF69B4", // Rosa más intenso
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 25,
    fontWeight: "bold",
  },
  alertOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  alertContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  alertError: {
    borderLeftWidth: 10,
    borderLeftColor: "#FF1493", // Rosa oscuro para errores
  },
  alertSuccess: {
    borderLeftWidth: 10,
    borderLeftColor: "#4CAF50", // Verde para éxito
  },
  alertConfirm: {
    borderLeftWidth: 10,
    borderLeftColor: "#FF69B4", // Rosa más intenso para confirmación
  },
  alertText: {
    fontSize: 25,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  alertButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  alertButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  alertButtonCancel: {
    backgroundColor: "#ccc",
  },
  alertButtonConfirm: {
    backgroundColor: "#FF1493",
  },
  alertButtonText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
});

export default AppointmentDetailsScreen;