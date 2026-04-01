// mongo-init.js

// Connect to the database
db = db.getSiblingDB('healio');

// Drop existing collections to start fresh
db.users.drop();
db.medications.drop();
db.appointments.drop();
db.reminders.drop();
db.biometrics.drop();
db.alerts.drop();
db.achievements.drop();

// Create collections with validation if needed (optional but good practice)
db.createCollection("users");
db.createCollection("medications");
db.createCollection("appointments");
db.createCollection("reminders");
db.createCollection("biometrics");
db.createCollection("alerts");
db.createCollection("achievements");

// --- Predefined Users ---
// Passwords are plain text here. The application backend should hash them on first login or have a seeding script.
// For a real-world scenario, you would use a secure way to handle initial passwords.
const users = [
  {
    _id: ObjectId("60c72b9f9b1d8c001f8e4c1a"),
    name: "Admin User",
    email: "admin@healio.com",
    password: "adminpassword", // Plain text, to be hashed by the application
    role: "admin",
    active: true,
    created_at: new Date(),
    phone: "123-456-7890",
    specialty: null,
    profile: {},
    assigned_doctor_id: null
  },
  {
    _id: ObjectId("60c72b9f9b1d8c001f8e4c1b"),
    name: "Doctor Who",
    email: "doctor@healio.com",
    password: "doctorpassword",
    role: "doctor",
    active: true,
    created_at: new Date(),
    phone: "987-654-3210",
    specialty: "Cardiology",
    profile: {},
    assigned_doctor_id: null
  },
  {
    _id: ObjectId("60c72b9f9b1d8c001f8e4c1c"),
    name: "Patient Zero",
    email: "patient@healio.com",
    password: "patientpassword",
    role: "patient",
    active: true,
    created_at: new Date(),
    phone: "555-555-5555",
    specialty: null,
    profile: {
      date_of_birth: "1990-01-01",
      gender: "Male",
      address: "123 Main St, Anytown, USA",
      blood_type: "O+",
      height: 180,
      weight: 75,
      allergies: ["Peanuts"],
      emergency_contact: {
        name: "Jane Doe",
        relationship: "Spouse",
        phone: "555-123-4567"
      }
    },
    assigned_doctor_id: "60c72b9f9b1d8c001f8e4c1b"
  }
];

db.users.insertMany(users);

// --- Predefined Medications for Patient Zero ---
const medications = [
  {
    user_id: ObjectId("60c72b9f9b1d8c001f8e4c1c"),
    name: "Lisinopril",
    dosage: "10mg",
    frequency: "Once daily",
    time_of_day: "Morning",
    instructions: "Take with food.",
    start_date: new Date("2025-01-01"),
    end_date: null,
    active: true,
    created_at: new Date()
  },
  {
    user_id: ObjectId("60c72b9f9b1d8c001f8e4c1c"),
    name: "Aspirin",
    dosage: "81mg",
    frequency: "Once daily",
    time_of_day: "Morning",
    instructions: "Take with a full glass of water.",
    start_date: new Date("2025-01-01"),
    end_date: null,
    active: true,
    created_at: new Date()
  }
];

db.medications.insertMany(medications);

// --- Predefined Appointments for Patient Zero ---
const appointments = [
  {
    user_id: ObjectId("60c72b9f9b1d8c001f8e4c1c"),
    title: "Annual Checkup",
    type: "checkup",
    date: "2026-05-15",
    time: "10:00",
    doctor: "Dr. Who",
    location: "Healio Clinic, Room 3",
    notes: "Discuss recent blood work.",
    reminder: true,
    status: "upcoming",
    created_at: new Date()
  },
  {
    user_id: ObjectId("60c72b9f9b1d8c001f8e4c1c"),
    title: "Dental Cleaning",
    type: "dental",
    date: "2026-06-01",
    time: "14:00",
    doctor: "Dr. Tooth",
    location: "Dental Care Center",
    notes: "",
    reminder: true,
    status: "upcoming",
    created_at: new Date()
  }
];

db.appointments.insertMany(appointments);

// --- Predefined Reminders for Patient Zero ---
const reminders = [
    {
        user_id: ObjectId("60c72b9f9b1d8c001f8e4c1c"),
        title: "Take Lisinopril",
        description: "Take with food.",
        time: "08:00",
        frequency: "daily",
        category: "medication",
        active: true,
        history: [],
        created_at: new Date()
    },
    {
        user_id: ObjectId("60c72b9f9b1d8c001f8e4c1c"),
        title: "Check Blood Pressure",
        description: "Measure and record blood pressure.",
        time: "08:30",
        frequency: "daily",
        category: "measurement",
        active: true,
        history: [],
        created_at: new Date()
    }
];

db.reminders.insertMany(reminders);


print("Healio database initialized successfully.");
