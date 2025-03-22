import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Pressable, Animated, Modal, Easing } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { saveAppointment, getAppointmentsByDate, services } from "../database/db";
import { Picker } from "@react-native-picker/picker";
import { scheduleReminder } from "../notifications/index";

const AppointmentFormScreen = ({ route, navigation }) => {
  const { selectedDate } = route.params;
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [service, setService] = useState(services[0]);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [existingAppointments, setExistingAppointments] = useState([]);

  // Estados para la alerta personalizada
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("info");

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchAppointments = async () => {
      const appointments = await getAppointmentsByDate(selectedDate);
      setExistingAppointments(appointments);
    };
    fetchAppointments();

    // Iniciar animación al cargar la pantalla
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [selectedDate]);

  // Función para mostrar alerta personalizada
  const showCustomAlert = (message, type = "info") => {
    setAlertMessage(message);
    setAlertType(type);
    setCustomAlertVisible(true);
  };

  // Función para cerrar la alerta personalizada
  const closeCustomAlert = () => {
    setCustomAlertVisible(false);
  };

  const formatSelectedDate = (dateString) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1);
    const options = { weekday: "long", day: "numeric" };
    return date.toLocaleDateString("es-ES", options).replace(/^\w/, (c) => c.toUpperCase());
  };

  const formatTimeForDisplay = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const formatTimeForValidation = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  const formattedStartTime = formatTimeForValidation(startTime);
  const formattedEndTime = formatTimeForValidation(endTime);

  const isOverlapping = (newStart, newEnd) => {
    for (const appointment of existingAppointments) {
      const existingStart = new Date(`1970-01-01T${appointment.startTime}:00`);
      const existingEnd = new Date(`1970-01-01T${appointment.endTime}:00`);
      const newStartTime = new Date(`1970-01-01T${newStart}:00`);
      const newEndTime = new Date(`1970-01-01T${newEnd}:00`);

      if (
        (newStartTime >= existingStart && newStartTime < existingEnd) ||
        (newEndTime > existingStart && newEndTime <= existingEnd) ||
        (newStartTime <= existingStart && newEndTime >= existingEnd)
      ) {
        return appointment;
      }
    }
    return null;
  };

  const handleSave = async () => {
    if (!clientName || !clientPhone || !startTime || !endTime || !service) {
      showCustomAlert("Todos los campos son obligatorios", "error");
      return;
    }
    if (clientPhone.length !== 10 || isNaN(clientPhone)) {
      showCustomAlert("El número de teléfono debe tener 10 dígitos", "error");
      return;
    }

    const conflictingAppointment = isOverlapping(formattedStartTime, formattedEndTime);
    if (conflictingAppointment) {
      const conflictingStartTime = new Date(`1970-01-01T${conflictingAppointment.startTime}:00`);
      const conflictingEndTime = new Date(`1970-01-01T${conflictingAppointment.endTime}:00`);

      showCustomAlert(
        `Ya existe una cita en ese horario:\n\n` +
        `Cliente: ${conflictingAppointment.clientName}\n` +
        `Servicio: ${conflictingAppointment.service}\n` +
        `Horario: ${formatTimeForDisplay(conflictingStartTime)} - ${formatTimeForDisplay(conflictingEndTime)}`,
        "error"
      );
      return;
    }

    try {
      await saveAppointment(selectedDate, formattedStartTime, formattedEndTime, clientName, clientPhone, service);
      await scheduleReminder();
      showCustomAlert("Cita agendada correctamente", "success");
      navigation.navigate("Home", { shouldRefresh: true });
    } catch (error) {
      showCustomAlert("No se pudo guardar la cita", "error");
      console.error(error);
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.labelHora}>{formatSelectedDate(selectedDate)}</Text>

      <Text style={styles.label}>Nombre del Cliente:</Text>
      <TextInput style={styles.input} value={clientName} onChangeText={setClientName} />

      <Text style={styles.label}>Número de Teléfono:</Text>
      <TextInput
        style={styles.input}
        value={clientPhone}
        onChangeText={setClientPhone}
        keyboardType="numeric"
        maxLength={10}
      />

      <Text style={styles.label}>Hora de Inicio:</Text>
      <TouchableOpacity style={styles.timeInput} onPress={() => setShowStartPicker(true)}>
        <Text style={styles.timeText}>{startTime ? formatTimeForDisplay(startTime) : "Seleccionar hora"}</Text>
      </TouchableOpacity>
      {showStartPicker && (
        <DateTimePicker
          value={startTime || new Date()}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={(event, selected) => {
            setShowStartPicker(false);
            if (selected) setStartTime(selected);
          }}
        />
      )}

      <Text style={styles.label}>Hora de Fin:</Text>
      <TouchableOpacity style={styles.timeInput} onPress={() => setShowEndPicker(true)}>
        <Text style={styles.timeText}> {endTime ? formatTimeForDisplay(endTime) : "Seleccionar hora"}</Text>
      </TouchableOpacity>
      {showEndPicker && (
        <DateTimePicker
          value={endTime || new Date()}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={(event, selected) => {
            setShowEndPicker(false);
            if (selected) setEndTime(selected);
          }}
        />
      )}

      <Text style={styles.label}>Servicio:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={service}
          onValueChange={(itemValue) => setService(itemValue)}
        >
          {services.map((service, index) => (
            <Picker.Item key={index} label={service} value={service} style={styles.timeText} />
          ))}
        </Picker>
      </View>

      <View style={styles.buttonRow}>
        <Pressable onPress={() => navigation.goBack()} style={[styles.button, { backgroundColor: "#FF69B4" }]}>
          <Text style={styles.buttonText}>Cancelar</Text>
        </Pressable>
        <Pressable onPress={handleSave} style={[styles.button, { backgroundColor: "#FF1493" }]}>
          <Text style={styles.buttonText}>Guardar</Text>
        </Pressable>
      </View>

      {/* Alerta personalizada */}
      <Modal visible={customAlertVisible} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={[
            styles.alertContainer,
            alertType === "error" && styles.alertError,
            alertType === "success" && styles.alertSuccess,
          ]}>
            <Text style={styles.alertText}>{alertMessage}</Text>
            <View style={styles.alertButtonContainer}>
              <TouchableOpacity
                style={[styles.alertButton, styles.alertButtonConfirm]}
                onPress={closeCustomAlert}
              >
                <Text style={styles.alertButtonText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFF0F5",
  },
  label: {
    fontSize: 22,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
    color: "#333",
  },
  labelHora: {
    fontSize: 40,
    fontWeight: "800",
    marginTop: 20,
    marginBottom: 25,
    color: "#333",
    textAlign: "center",
  },
  input: {
    fontSize: 18,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginTop: 5,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  timeInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginTop: 5,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  timeText: {
    fontSize: 18,
    color: "#333",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginTop: 5,
    marginBottom: 35,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 5,
    elevation: 3,
  },
  buttonText: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "600",
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
    borderLeftColor: "#FF1493",
  },
  alertSuccess: {
    borderLeftWidth: 10,
    borderLeftColor: "#4CAF50",
  },
  alertText: {
    fontSize: 25,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  alertButtonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
  },
  alertButton: {
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
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

export default AppointmentFormScreen;