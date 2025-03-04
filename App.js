import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "./src/screens/HomeScreen";
import AppointmentFormScreen from "./src/screens/AppointmentFormScreen";
import AppointmentDetailsScreen from "./src/screens/AppointmentDetailsScreen";
import { createTable } from "./src/database/db"; // Asegúrate de importar createTable
import { ActivityIndicator, View, StyleSheet } from "react-native";

const Stack = createStackNavigator();

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);

  // Inicializar la base de datos al cargar la aplicación
  useEffect(() => {
    const initializeDB = async () => {
      try {
        await createTable(); // Crear la tabla de citas
        console.log("Base de datos inicializada correctamente");
        setDbInitialized(true); // Marcar la base de datos como lista
      } catch (error) {
        console.error("Error al inicializar la base de datos:", error);
      }
    };

    initializeDB();
  }, []);

  // Mostrar un indicador de carga mientras se inicializa la base de datos
  if (!dbInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Renderizar la navegación una vez que la base de datos esté lista
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Home" }}
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
  },
});