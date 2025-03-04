import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, Pressable } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { saveAppointment, getAppointmentsByDate, services } from "../database/db";
import { Picker } from "@react-native-picker/picker";

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

  useEffect(() => {
    const fetchAppointments = async () => {
      const appointments = await getAppointmentsByDate(selectedDate);
      setExistingAppointments(appointments);
    };
    fetchAppointments();
  }, [selectedDate]);

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
        return appointment; // Devuelve la cita existente que causa el conflicto
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
      await saveAppointment(selectedDate, formattedStartTime, formattedEndTime, clientName, clientPhone, service);
      Alert.alert("Éxito", "Cita agendada correctamente");
      navigation.navigate("Home", { shouldRefresh: true });
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar la cita");
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.labelHora}>{selectedDate}</Text>

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
        <Pressable onPress={handleSave} style={[styles.button, { backgroundColor: "green" }]}>
          <Text style={styles.buttonText}>Guardar</Text>
        </Pressable>
        <Pressable onPress={() => navigation.goBack()} style={[styles.button, { backgroundColor: "red" }]}>
          <Text style={styles.buttonText}>Cancelar</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  label: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 10,
    color: "#333",
    textAlign: "center"
  },
  labelHora: {
    fontSize: 50,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 10,
    color: "#333",
    textAlign: "center"
  },
  input: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginTop: 5,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    textAlign: "center"
  },
  timeInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginTop: 5,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 5,
    backgroundColor: "#007BFF",
    elevation: 3,
  },
  buttonText: {
    fontSize: 20,
    color: "#fff",
  },
  buttonPressable: {
    transform: [{ scale: 0.98 }],
    backgroundColor: "#0056b3",
  },
});

export default AppointmentFormScreen;