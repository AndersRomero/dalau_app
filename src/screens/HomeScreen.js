import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Button } from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { getAppointmentsByDate, getAllAppointmentDates } from "../database/db";
import AppointmentListModal from "../components/AppointmentListModal";
import { useFocusEffect } from "@react-navigation/native";

// Configuración del idioma español
LocaleConfig.locales["es"] = {
  monthNames: [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ],
  monthNamesShort: [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ],
  dayNames: [
    "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
  ],
  dayNamesShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
  today: "Hoy",
};
LocaleConfig.defaultLocale = "es";

const HomeScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [markedDates, setMarkedDates] = useState({});

  const loadAppointments = async (date) => {
    if (date) {
      const data = await getAppointmentsByDate(date);
      setAppointments(data);
    }
  };

  const loadMarkedDates = async () => {
    const dates = await getAllAppointmentDates();
    const marked = {};
    dates.forEach((date) => {
      marked[date] = {
        selected: true,
        selectedColor: "lightpink",
        marked: true,
      };
    });
    setMarkedDates(marked);
  };

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  const handleLongPress = (day) => {
    setSelectedDate(day.dateString);
    loadAppointments(day.dateString);
    setModalVisible(true);
  };

  useEffect(() => {
    if (selectedDate) {
      loadAppointments(selectedDate);
    }
  }, [selectedDate]);

  // Recargar las fechas marcadas cuando se vuelva a esta pantalla
  useFocusEffect(
    useCallback(() => {
      loadMarkedDates();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={handleDayPress}
        onDayLongPress={handleLongPress}
        markedDates={{
          ...markedDates,
          ...(selectedDate
            ? { [selectedDate]: { selected: true, selectedColor: "blue" } }
            : {}),
        }}
        monthFormat={"MMMM yyyy"}
        theme={{
          calendarBackground: "#ffffff",
          selectedDayBackgroundColor: "blue",
          selectedDayTextColor: "#ffffff",
          todayTextColor: "blue",
          dotColor: "red",
          arrowColor: "blue",
        }}
      />

      {selectedDate && (
        <View style={styles.buttonContainer}>
          <Button
            title="Agendar Cita"
            onPress={() =>
              navigation.navigate("AppointmentFormScreen", { selectedDate })
            }
          />
        </View>
      )}

      <AppointmentListModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        appointments={appointments}
        selectedDate={selectedDate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  buttonContainer: {
    marginTop: 20,
  },
});

export default HomeScreen;
