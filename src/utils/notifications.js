/* // utils/notifications.js
import * as Notifications from "expo-notifications";
import { Alert } from "react-native";

// Configuración para mostrar notificaciones incluso cuando la app está en primer plano
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

// Función para solicitar permisos
export const requestNotificationPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== "granted") {
            Alert.alert("Permiso denegado", "No podrás recibir notificaciones.");
            return false;
        }
    }
    return true;
};

// Función para programar una notificación local
export const scheduleNotification = async (title, body, date) => {
    try {
        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: title,
                body: body,
                sound: true,
            },
            trigger: {
                date: date,
            },
        });
        console.log("Notificación programada con ID:", notificationId);
    } catch (error) {
        console.log("Error al programar la notificación:", error);
    }
}; */