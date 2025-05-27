import {
  foreignKey,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

// Tabela user
export const userTable = pgTable('user', {
  userId: serial('user_id').primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).unique(),
  password: varchar('password', { length: 255 }),
  creationDate: timestamp('creation_date').defaultNow(),
})

// Tabela sensor
export const sensorTable = pgTable(
  'sensor',
  {
    sensorId: serial('sensor_id').primaryKey(),
    userId: integer('user_id').references(() => userTable.userId),
    sensorName: varchar('sensor_name', { length: 255 }),
    location: varchar('location', { length: 255 }),
    installationDate: timestamp('installation_date'),
    webhookToken: varchar('weebhook_token', { length: 255 }).unique(), // nova coluna
  },
  (table) => ({
    fkUser: foreignKey({
      columns: [table.userId],
      foreignColumns: [userTable.userId],
      name: 'fk_user',
    }),
  }),
)

// Tabela sensor_data
export const sensorDataTable = pgTable('sensor_data', {
  sensorDataId: serial('sensor_data_id').primaryKey(),
  sensorId: integer('sensor_id').references(() => sensorTable.sensorId),
  soilHumidity: real('soil_humidity'),
  levelHumidity: varchar('level_humidity', { length: 50 }),
  temperature: real('temperature'),
  levelTemperature: varchar('level_temperature', { length: 50 }),
  condutivity: real('condutivity'),
  levelCondutivity: varchar('level_condutivity', { length: 50 }),
  ph: real('ph'),
  levelPh: varchar('level_ph', { length: 50 }),
  nitrogen: real('nitrogen'),
  levelNitrogen: varchar('level_nitrogen', { length: 50 }),
  phosphorus: real('phosphorus'),
  levelPhosphorus: varchar('level_phosphorus', { length: 50 }),
  potassium: real(' potassium'),
  levelPotassium: varchar('level_potassium', { length: 50 }),
  dateTime: timestamp('date_time').defaultNow(),
}, (table) => ({
  fkSensor: foreignKey({
    columns: [table.sensorId],
    foreignColumns: [sensorTable.sensorId],
    name: 'fk_sensor',
  }),
}));

// Tabela alert
export const alertTable = pgTable(
  'alert',
  {
    alertId: serial('alert_id').primaryKey(),
    sensorId: integer('sensor_id').references(() => sensorTable.sensorId),
    message: text('message'),
    level: varchar('level', { length: 50 }),
    timestamp: timestamp('timestamp').defaultNow(),
  },
  (table) => ({
    fkSensorAlert: foreignKey({
      columns: [table.sensorId],
      foreignColumns: [sensorTable.sensorId],
      name: 'fk_sensor_alert',
    }),
  }),
)
