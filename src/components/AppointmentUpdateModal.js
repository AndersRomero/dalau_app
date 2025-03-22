import React, { useState, useEffect } from "react";
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { updateAppointment, getAppointmentsByDate, services } from "../database/db";
import { Picker } from "@react-native-picker/picker";

const AppointmentUpdateModal = ({ visible, onClose, appointment, onSave }) => {
  const [clientName, setClientName] = useState(appointment.clientName);
  const [clientPhone, setClientPhone] = useState(appointment.clientPhone);
  const [service, setService] = useState(appointment.service);
  const [startTime, setStartTime] = useState(new Date(`1970-01-01T${appointment.startTime}:00`));
  const [endTime, setEndTime] = useState(new Date(`1970-01-01T${appointment.endTime}:00`));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [existingAppointments, setExistingAppointments] = useState([]);
  const [customAlertVisible, setCustomAlertVisible] = useState(false); // Estado para la alerta personalizada
  const [alertMessage, setAlertMessage] = useState(""); // Mensaje de la alerta
  const [alertType, setAlertType] = useState("info"); // Tipo de alerta (info, error, success)

  // Obtener las citas existentes para la fecha seleccionada
  useEffect(() => {
    const fetchAppointments = async () => {
      const appointments = await getAppointmentsByDate(appointment.date);
      setExistingAppointments(appointments);
    };
    fetchAppointments();
  }, [appointment.date]);

  // Formatear la hora en formato de 12 horas para mostrar al usuario
  const formatTimeForDisplay = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  // Formatear la hora en formato de 24 horas para guardar y comparar
  const formatTimeForValidation = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  // Validar solapamiento de citas y devolver la cita existente que causa el conflicto
  const isOverlapping = (newStart, newEnd) => {
    for (const existingAppointment of existingAppointments) {
      if (existingAppointment.id === appointment.id) continue;

      const existingStart = new Date(`1970-01-01T${existingAppointment.startTime}:00`);
      const existingEnd = new Date(`1970-01-01T${existingAppointment.endTime}:00`);
      const newStartTime = new Date(`1970-01-01T${newStart}:00`);
      const newEndTime = new Date(`1970-01-01T${newEnd}:00`);

      if (
        (newStartTime >= existingStart && newStartTime < existingEnd) ||
        (newEndTime > existingStart && newEndTime <= existingEnd) ||
        (newStartTime <= existingStart && newEndTime >= existingEnd)
      ) {
        return existingAppointment;
      }
    }
    return null;
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

  const handleSave = async () => {
    if (!clientName || !clientPhone || !startTime || !endTime || !service) {
      showCustomAlert("Todos los campos son obligatorios", "error");
      return;
    }
    if (clientPhone.length !== 10 || isNaN(clientPhone)) {
      showCustomAlert("El número de teléfono debe tener 10 dígitos", "error");
      return;
    }

    const formattedStartTime = formatTimeForValidation(startTime);
    const formattedEndTime = formatTimeForValidation(endTime);

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
      const updatedData = {
        clientName,
        clientPhone,
        service,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
      };

      await updateAppointment(
        appointment.id,
        updatedData.clientName,
        updatedData.clientPhone,
        updatedData.service,
        updatedData.startTime,
        updatedData.endTime
      );

      showCustomAlert("Cita actualizada correctamente", "success");
      onClose();
      onSave();
    } catch (error) {
      showCustomAlert("No se pudo actualizar la cita", "error");
      console.error(error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Editar Cita</Text>

          <Text style={styles.label}>Nombre del Cliente:</Text>
          <TextInput
            style={styles.input}
            value={clientName}
            onChangeText={setClientName}
            placeholder="Nombre del cliente"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Número de Teléfono:</Text>
          <TextInput
            style={styles.input}
            value={clientPhone}
            onChangeText={setClientPhone}
            keyboardType="numeric"
            maxLength={10}
            placeholder="Número de teléfono"
            placeholderTextColor="#999"
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
            <Text style={styles.timeText}>{endTime ? formatTimeForDisplay(endTime) : "Seleccionar hora"}</Text>
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
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
              <Text style={styles.buttonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
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
            <TouchableOpacity style={styles.alertButton} onPress={closeCustomAlert}>
              <Text style={styles.alertButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#FFF0F5",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 35,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#FF1493",
  },
  label: {
    fontSize: 23,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 5,
    color: "#333",
  },
  input: {
    fontSize: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: "#fff",
    color: "#333",
  },
  timeInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  timeText: {
    fontSize: 20,
    color: "#333",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  buttonRow: {
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
  cancelButton: {
    backgroundColor: "#FF69B4",
  },
  saveButton: {
    backgroundColor: "#FF1493",
  },
  buttonText: {
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
  alertText: {
    fontSize: 25,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  alertButton: {
    backgroundColor: "#FF69B4",
    padding: 10,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  alertButtonText: {
    color: "#fff",
    fontSize: 25,
    fontWeight: "bold",
  },
});

export default AppointmentUpdateModal;