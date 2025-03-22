import { openDatabaseAsync } from "expo-sqlite";

export const services = [
  "Tradicional",
  "Semipermanente",
  "Recubrimiento en polygel",
  "Polygel",
  "PressOn",
  "Acrílico",
  "Dipping",
  "Rubber",
  "Pedicure",
  "Manicure y pedicure tradicional",
  "Manicure semipermanente y pedicure"
]


// Función para abrir la base de datos
export const openDB = async () => {
  return await openDatabaseAsync("appointments.db");
};

// Crear la tabla de citas
export const createTable = async () => {
  const db = await openDB();
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      clientName TEXT NOT NULL,
      clientPhone TEXT NOT NULL,
      service TEXT NOT NULL,
      notificationScheduled BOOLEAN DEFAULT FALSE

    );
  `);
  console.log("Tabla de citas creada correctamente");
};

// Guardar una nueva cita
export const saveAppointment = async (date, startTime, endTime, clientName, clientPhone, service) => {
  const db = await openDB();
  const result = await db.runAsync(
    "INSERT INTO appointments (date, startTime, endTime, clientName, clientPhone, service) VALUES (?,?,?, ?, ?, ?);",
    date,
    startTime,
    endTime,
    clientName,
    clientPhone,
    service
  );
  return result.lastInsertRowId; // Devuelve el ID de la cita insertada
};

// Obtener todas las citas
export const getAppointments = async () => {
  const db = await openDB();
  return await db.getAllAsync("SELECT * FROM appointments");
};

export const getAllAppointmentDates = async () => {
  const db = await openDB();
  const results = await db.getAllAsync("SELECT DISTINCT date FROM appointments");
  return results.map((item) => item.date);
}

export const getAppointmentsByDate = async (date) => {
  const db = await openDB();
  console.log("🔎 Buscando citas para la fecha:", date);
  const results = await db.getAllAsync("SELECT * FROM appointments WHERE date = ?", date);
  console.log("📌 Resultados obtenidos:", results);
  return results;
};

export const getAppointmentById = async (id) => {
  // Validación del ID
  if (!id) {
    console.error("ID no válido:", id);
    return null;
  }

  try {
    const db = await openDB();
    console.log("🔎 Buscando cita con ID:", id);

    // Ejecutar la consulta
    const appointment = await db.getFirstSync("SELECT * FROM appointments WHERE id = ?", id);

    // Verificar si se encontró la cita
    if (appointment) {
      console.log("Cita encontrada:", appointment);
      return appointment;
    } else {
      console.log("No se encontró la cita con ID:", id);
      return null;
    }
  } catch (error) {
    console.error("Error al buscar la cita:", error);
    return null;
  }
};

// Eliminar una cita por ID
export const deleteAppointment = async (id) => {
  const db = await openDB();
  await db.runAsync("DELETE FROM appointments WHERE id = ?", id);
};

// Actualizar una cita por ID
export const updateAppointment = async (id, clientName, clientPhone, service, startTime, endTime) => {
  const db = await openDB();

  // Validar que todos los campos estén presentes
  if (!id || !startTime || !endTime || !clientName || !clientPhone || !service) {
    throw new Error("Todos los campos son obligatorios");
  }

  // Validar que el número de teléfono tenga 10 dígitos
  if (clientPhone.length !== 10 || !/^\d+$/.test(clientPhone)) {
    throw new Error("El número de teléfono debe tener 10 dígitos");
  }

  try {
    // Ejecutar la consulta SQL
    await db.runAsync(
      "UPDATE appointments SET clientName = ?, clientPhone = ?, service = ?, startTime = ?, endTime = ? WHERE id = ?",
      clientName,
      clientPhone,
      service,
      startTime,
      endTime,
      id
    );

    console.log("Cita actualizada correctamente");
  } catch (error) {
    console.error("Error al actualizar la cita:", error);
    throw new Error("No se pudo actualizar la cita");
  }
};

export const getStartTimeById = async (id) => {
  const db = await openDB();
  const result = await db.getFirstAsync("SELECT startTime FROM appointments WHERE id = ?", id);
  return result.startTime;
};

export const updateNotifications = async (id, notificationScheduled) => {
  const db = await openDB();
  await db.runAsync("UPDATE appointments SET notificationScheduled = ? WHERE id = ?", notificationScheduled, id);
}