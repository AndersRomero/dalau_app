import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Text, TouchableOpacity, StatusBar } from "react-native";
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
  dayNamesShort: ["Do", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
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
        selectedColor: "#FF69B4",
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

  useFocusEffect(
    useCallback(() => {
      loadMarkedDates();
    }, [])
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FF69B4" barStyle="light-content" />
      <Calendar
        onDayPress={handleDayPress}
        onDayLongPress={handleLongPress}
        markedDates={{
          ...markedDates,
          ...(selectedDate
            ? { [selectedDate]: { selected: true, selectedColor: "#FF69B4" } }
            : {}),
        }}
        monthFormat={"MMMM yyyy"}
        theme={{
          calendarBackground: "#FFF0F5",
          textSectionTitleColor: "#000",
          selectedDayBackgroundColor: "#FF1493",
          selectedDayTextColor: "#FFFFFF",
          weekVerticalMargin: 24,
          todayTextColor: "#FF1493",
          arrowColor: "#FF69B4",
          textMonthFontWeight: "bold",
          textMonthFontSize: 50,
          textDayHeaderFontWeight: "bold",
          textDayFontSize: 25,
          textDayHeaderFontSize: 17,
          // Nuevas propiedades para aumentar el tamaño de los círculos
          'stylesheet.day.basic': {
            base: {
              width: 50,
              height: 50,
              alignItems: 'center',
              justifyContent: 'center',
            },
            selected: {
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: '#FF1493',
            }
          },
        }}
        style={{}}
      />

      {selectedDate && (
        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            navigation.navigate("AppointmentFormScreen", { selectedDate })
          }
        >
          <Text style={styles.buttonText}>Agendar Cita</Text>
        </TouchableOpacity>
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
    backgroundColor: "#FFF0F5",
  },
  button: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#FF69B4",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    elevation: 5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "bold",
  },
});

export default HomeScreen;
