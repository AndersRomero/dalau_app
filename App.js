import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "./src/screens/HomeScreen";
import AppointmentFormScreen from "./src/screens/AppointmentFormScreen";
import AppointmentDetailsScreen from "./src/screens/AppointmentDetailsScreen";
import { createTable } from "./src/database/db";
import { ActivityIndicator, View, StyleSheet, Alert, Text, Animated, Easing } from "react-native";
import * as Notifications from "expo-notifications";
import { scheduleFollowUpNotification, scheduleDailyReminder } from "./src/notifications/index";

// Configurar cómo se muestran las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Stack = createStackNavigator();

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const fadeAnim = new Animated.Value(0); // Animación de desvanecimiento

  // Inicializar la base de datos al cargar la aplicación
  useEffect(() => {
    const initializeDB = async () => {
      try {
        await createTable(); // Crear la tabla de citas
        console.log("Base de datos inicializada correctamente");
        setDbInitialized(true); // Marcar la base de datos como lista
      } catch (error) {
        console.error("Error al inicializar la base de datos:", error);
        Alert.alert(
          "Error",
          "No se pudo inicializar la base de datos. Por favor, reinicia la aplicación."
        );
      }
    };

    initializeDB();
  }, []);

  useEffect(() => {
    scheduleFollowUpNotification();
    scheduleDailyReminder();
  }, []);

  const pedirPermisos = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const { status: nuevoStatus } = await Notifications.requestPermissionsAsync();
      if (nuevoStatus !== "granted") {
        Alert.alert(
          "Permisos denegados",
          "Necesitamos permisos para enviarte notificaciones."
        );
      }
    }
  };

  useEffect(() => {
    pedirPermisos();
  }, []);

  // Animación de desvanecimiento
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Mostrar un indicador de carga mientras se inicializa la base de datos
  if (!dbInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF69B4" />
        <Text style={styles.loadingText}>Inicializando la aplicación...</Text>
      </View>
    );
  }



  // Renderizar la navegación una vez que la base de datos esté lista
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: "#FF69B4", // Fondo rosa para la barra de navegación
          },
          headerTintColor: "#FFF", // Color del texto de la barra de navegación
          headerTitleAlign: "center", // Centrar texto en la barrade navegación
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 30,
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Dalau Studio" }}
          style={styles.title}
        />
        <Stack.Screen
          name="AppointmentFormScreen"
          component={AppointmentFormScreen}
          options={{ title: "Crear Cita" }}
        />
        <Stack.Screen
          name="AppointmentDetailsScreen"
          component={AppointmentDetailsScreen}
          options={{ title: "Detalles de la Cita" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF0F5", // Fondo rosa claro
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#FF69B4", // Texto rosa
    fontWeight: "bold",
  },
  title: {
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
  },
});