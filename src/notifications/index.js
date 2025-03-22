import * as Notifications from "expo-notifications";
import { getAppointments, getAppointmentsByDate, updateNotifications } from "../database/db";

export const scheduleReminder = async () => {
    try {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        const tomorrowDate = tomorrow.toISOString().split("T")[0];

        const appointments = await getAppointmentsByDate(tomorrowDate);

        if (appointments.length > 0) {
            // Configurar la notificación para hoy a las 9 PM
            const notificationTime = new Date();
            notificationTime.setHours(21, 0, 0, 0); // 21:00:00 (9 PM)

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Recordatorio de citas",
                    body: `Hay ${appointments.length} cita(s) programada(s) para mañana.`,
                    sound: true,
                },
                trigger: {
                    type: "date",
                    date: notificationTime, // Dispara la notificación a las 9 PM de hoy
                },
            });

            console.log(`Notificación programada para ${appointments.length} cita(s) a las 9 PM`);
        } else {
            console.log("No hay citas para mañana. No se programó ninguna notificación.");
        }
    } catch (error) {
        console.log("Error programando notificación diaria", error);
    }
};


// Función para cancelar la notificación de una cita
export const cancelAppointmentNotification = async (id) => {
    try {
        await Notifications.cancelScheduledNotificationAsync(id.toString());
        console.log(`Notificación de la cita con id: ${id} cancelada`);
    } catch (error) {
        console.log("Error cancelando notificación de cita:", error);
    }
}


// Función para programar notificacion de seguimiento a los 28 días para todas las citas
export const scheduleFollowUpNotification = async () => {
    try {
        const appointments = await getAppointments();
        for (const appointment of appointments) {
            if (appointment.notificationScheduled === 1) {
                console.log(`Notificación de seguimiento ya programada para la cita con id: ${appointment.id}`);
                continue;
            }
            const date = new Date(appointment.date);
            date.setDate(date.getDate() + 28);
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Recordatorio de seguimiento",
                    body: `${appointment.clientName} tuvo cita hace 28 días.`,
                    sound: true,
                },
                trigger: {
                    type: "date",
                    date: date,
                },
            });
            await updateNotifications(appointment.id, true);
            console.log(`Notificación de seguimiento programada para la cita con id: ${appointment.id}`);
            console.log(`Notificación de seguimiento programada para: ${date}`);
        }

    } catch (error) {
        console.log("Error programando notificación de seguimiento:", error);
    }
}

// Función para recordatorio diario de citas
export const scheduleDailyReminder = async () => {
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Recordatorio diario",
                body: "Recuerda revisar tus citas para mañana.",
                sound: true,
            },
            trigger: {
                type: "daily",
                hour: 20,
                minute: 0,
                repeats: true,
            },
        });
        console.log("Notificación diaria programada");
    } catch (error) {
        console.log("Error programando notificación diaria", error);
    }
}