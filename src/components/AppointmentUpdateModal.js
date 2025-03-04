import React, { useState, useEffect } from "react";
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { updateAppointment, getAppointmentsByDate, services } from "../database/db";
import { Picker } from "@react-native-picker/picker";

const AppointmentUpdateModal = ({ visible, onClose, appointment, onSave }) => {
  // Validar que appointment tenga la propiedad id
  if (!appointment || !appointment.id) {
    Alert.alert("Error", "No se pudo cargar la cita");
    onClose(); // Cerrar el modal si no hay un ID válido
    return null; // Evitar que el modal se renderice
  }

  const [clientName, setClientName] = useState(appointment.clientName);
  const [clientPhone, setClientPhone] = useState(appointment.clientPhone);
  const [service, setService] = useState(appointment.service);
  const [startTime, setStartTime] = useState(new Date(`1970-01-01T${appointment.startTime}:00`));
  const [endTime, setEndTime] = useState(new Date(`1970-01-01T${appointment.endTime}:00`));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [existingAppointments, setExistingAppointments] = useState([]);

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
      // Ignorar la cita actual que se está editando
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
        return existingAppointment; // Devuelve la cita existente que causa el conflicto
      }
    }
    return null; // No hay conflicto
  };

  const handleSave = async () => {
    if (!clientName || !clientPhone || !startTime || !endTime || !service) {
      Alert.alert("Error", "Todos los campos son obligatorios");
      return;
    }
    if (clientPhone.length !== 10 || isNaN(clientPhone)) {
      Alert.alert("Error", "El número de teléfono debe tener 10 dígitos");
      return;
    }

    const formattedStartTime = formatTimeForValidation(startTime);
    const formattedEndTime = formatTimeForValidation(endTime);

    if (formattedStartTime >= formattedEndTime) {
      Alert.alert("Error", "La hora de inicio debe ser menor a la hora de fin");
      return;
    }

    // Validar solapamiento
    const conflictingAppointment = isOverlapping(formattedStartTime, formattedEndTime);
    if (conflictingAppointment) {
      // Convertir las horas de la cita existente a formato de 12 horas
      const conflictingStartTime = new Date(`1970-01-01T${conflictingAppointment.startTime}:00`);
      const conflictingEndTime = new Date(`1970-01-01T${conflictingAppointment.endTime}:00`);

      Alert.alert(
        "Error",
        `Ya existe una cita en ese horario:\n\n` +
        `Cliente: ${conflictingAppointment.clientName}\n` +
        `Servicio: ${conflictingAppointment.service}\n` +
        `Horario: ${formatTimeForDisplay(conflictingStartTime)} - ${formatTimeForDisplay(conflictingEndTime)}`
      );
      return;
    }

    try {
      // Crear el objeto con los datos actualizados
      const updatedData = {
        clientName,
        clientPhone,
        service,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
      };

      // Actualizar la cita en la base de datos
      await updateAppointment(
        appointment.id, // Asegúrate de que appointment.id esté definido
        updatedData.clientName,
        updatedData.clientPhone,
        updatedData.service,
        updatedData.startTime,
        updatedData.endTime
      );

      // Notificar que la cita se actualizó correctamente
      Alert.alert("Éxito", "Cita actualizada correctamente");

      // Cerrar el modal
      onClose();

      // Notificar a la pantalla principal que los datos se actualizaron
      onSave();
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar la cita");
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
          />

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
            <Text>{startTime ? formatTimeForDisplay(startTime) : "Seleccionar hora"}</Text>
          </TouchableOpacity>
          {showStartPicker && (
            <DateTimePicker
              value={startTime || new Date()}
              mode="time"
              is24Hour={false} // Mostrar en formato de 12 horas
              display="default"
              onChange={(event, selected) => {
                setShowStartPicker(false);
                if (selected) setStartTime(selected);
              }}
            />
          )}

          <Text style={styles.label}>Hora de Fin:</Text>
          <TouchableOpacity style={styles.timeInput} onPress={() => setShowEndPicker(true)}>
            <Text>{endTime ? formatTimeForDisplay(endTime) : "Seleccionar hora"}</Text>
          </TouchableOpacity>
          {showEndPicker && (
            <DateTimePicker
              value={endTime || new Date()}
              mode="time"
              is24Hour={false} // Mostrar en formato de 12 horas
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
                <Picker.Item key={index} label={service} value={service} />
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
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
    color: "#333",
  },
  input: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  timeInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
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
    backgroundColor: "#F44336",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AppointmentUpdateModal;