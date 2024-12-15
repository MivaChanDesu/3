import { StatusBar } from "expo-status-bar";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
  TextInput,
} from "react-native";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { useState, useEffect } from "react";
import { AntDesign } from "@expo/vector-icons";

async function initializeDatabase(db) {
  try {
    await db.execAsync(`
     PRAGMA journal_mode = WAL;
     DROP TABLE IF EXISTS students;
     CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lastName TEXT,
        firstName TEXT,
        middleName TEXT,
        addedTime TEXT
     );
    `);
    console.log("Database initialized");

    const students = [
      { lastName: "Иванов", firstName: "Иван", middleName: "Иванович" },
      { lastName: "Петров", firstName: "Петр", middleName: "Петрович" },
      { lastName: "Сидоров", firstName: "Сидор", middleName: "Сидорович" },
      { lastName: "Кузнецов", firstName: "Кузьма", middleName: "Кузьмич" },
      { lastName: "Смирнов", firstName: "Сергей", middleName: "Сергеевич" },
    ];

    for (const student of students) {
      await db.runAsync(
        "INSERT INTO students (lastName, firstName, middleName, addedTime) VALUES (?, ?, ?, ?)",
        [
          student.lastName,
          student.firstName,
          student.middleName,
          new Date().toISOString(),
        ]
      );
    }
    console.log("Initial students added");
  } catch (error) {
    console.log("Error while initializing database: ", error);
  }
}

const StudentButton = ({ student, deleteStudent, updateStudent }) => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedStudent, setEditedStudent] = useState({
    lastName: student.lastName,
    firstName: student.firstName,
    middleName: student.middleName,
  });

  const handleDelete = () => {
    Alert.alert(
      "Attention!",
      "Are you sure you want to delete the student?",
      [
        { text: "No", onPress: () => {}, style: "cancel" },
        { text: "Yes", onPress: () => deleteStudent(student.id) },
      ],
      { cancelable: true }
    );
  };

  const handleEdit = () => {
    updateStudent(
      student.id,
      editedStudent.lastName,
      editedStudent.firstName,
      editedStudent.middleName
    );
    setIsEditing(false);
  };

  return (
    <View>
      <Pressable
        style={styles.studentButton}
        onPress={() => {
          setSelectedStudent(
            selectedStudent === student.id ? null : student.id
          );
        }}
      >
        <Text style={styles.studentText}>
          {student.id} - {student.lastName}
        </Text>
        {selectedStudent === student.id && (
          <View style={styles.actions}>
            <AntDesign
              name="edit"
              size={18}
              color="blue"
              onPress={() => setIsEditing(true)}
              style={styles.icon}
            />
            <AntDesign
              name="delete"
              size={18}
              color="red"
              onPress={handleDelete}
              style={styles.icon}
            />
          </View>
        )}
      </Pressable>
      {selectedStudent === student.id && !isEditing && (
        <View style={styles.studentContent}>
          <Text>Id: {student.id}</Text>
          <Text>Фамилия: {student.lastName}</Text>
          <Text>Имя: {student.firstName}</Text>
          <Text>Отчество: {student.middleName}</Text>
          <Text>Время добавления: {student.addedTime}</Text>
        </View>
      )}
      {selectedStudent === student.id && isEditing && (
        <StudentForm
          student={editedStudent}
          setStudent={setEditedStudent}
          onSave={handleEdit}
          setShowForm={setIsEditing}
        />
      )}
    </View>
  );
};

const StudentForm = ({ student, setStudent, onSave, setShowForm }) => {
  return (
    <View>
      <TextInput
        style={styles.input}
        placeholder="Фамилия"
        value={student.lastName}
        onChangeText={(text) => setStudent({ ...student, lastName: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Имя"
        value={student.firstName}
        onChangeText={(text) => setStudent({ ...student, firstName: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Отчество"
        value={student.middleName}
        onChangeText={(text) => setStudent({ ...student, middleName: text })}
      />

      <Pressable onPress={onSave} style={styles.saveButton}>
        <Text style={styles.buttonText}>Сохранить</Text>
      </Pressable>
      <Pressable onPress={() => setShowForm(false)} style={styles.cancelButton}>
        <Text style={styles.buttonText}>Закрыть</Text>
      </Pressable>
    </View>
  );
};

const App = () => {
  return (
    <SQLiteProvider databaseName="example.db" onInit={initializeDatabase}>
      <View style={styles.container}>
        <Text style={styles.title}>Список студентов</Text>
        <Content />
        <StatusBar style="auto" />
      </View>
    </SQLiteProvider>
  );
};

const Content = () => {
  const db = useSQLiteContext();
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showStudents, setShowStudents] = useState(false);
  const [student, setStudent] = useState({
    id: 0,
    lastName: "",
    firstName: "",
    middleName: "",
  });

  const handleSave = () => {
    if (
      student.lastName.length === 0 ||
      student.firstName.length === 0 ||
      student.middleName.length === 0
    ) {
      Alert.alert("Attention", "Please enter all the data!");
    } else {
      addStudent(student);
      setStudent({ id: 0, lastName: "", firstName: "", middleName: "" });
      setShowForm(false);
    }
  };

  const getStudents = async () => {
    try {
      const allRows = await db.getAllAsync("SELECT * FROM students");
      setStudents(allRows);
    } catch (error) {
      console.log("Error while loading students: ", error);
    }
  };

  const addStudent = async (newStudent) => {
    try {
      await db.runAsync(
        "INSERT INTO students (lastName, firstName, middleName, addedTime) VALUES (?, ?, ?, ?)",
        [
          newStudent.lastName,
          newStudent.firstName,
          newStudent.middleName,
          new Date().toISOString(),
        ]
      );
      await getStudents();
    } catch (error) {
      console.log("Error while adding student: ", error);
    }
  };

  const updateLastStudentToIvanov = async () => {
    try {
      const result = await db.getAllAsync(
        "SELECT * FROM students ORDER BY id DESC LIMIT 1"
      );
      const lastStudent = result[0];

      if (lastStudent) {
        await db.runAsync(
          "UPDATE students SET lastName = ?, firstName = ?, middleName = ? WHERE id = ?",
          ["Иванов", "Иван", "Иванович", lastStudent.id]
        );
        console.log("Last student updated to Иванов Иван Иванович");
        await getStudents();
      } else {
        console.log("No students found to update.");
      }
    } catch (error) {
      console.log("Error while updating the last student: ", error);
    }
  };

  const confirmDeleteAll = () => {
    Alert.alert(
      "Внимание!",
      "Изменить ФИО последнего студента на Иванов Иван Иванович?",
      [
        { text: "Нет", onPress: () => {}, style: "cancel" },
        { text: "Да", onPress: updateLastStudentToIvanov },
      ],
      { cancelable: true }
    );
  };

  const updateStudent = async (
    studentId,
    newLastName,
    newFirstName,
    newMiddleName
  ) => {
    try {
      await db.runAsync(
        "UPDATE students SET lastName = ?, firstName = ?, middleName = ? WHERE id = ?",
        [newLastName, newFirstName, newMiddleName, studentId]
      );
      await getStudents();
    } catch (error) {
      console.log("Error while updating student");
    }
  };

  const deleteStudent = async (id) => {
    try {
      await db.runAsync("DELETE FROM students WHERE id = ?", [id]);
      await getStudents();
    } catch (error) {
      console.log("Error while deleting the student: ", error);
    }
  };

  useEffect(() => {
    getStudents();
  }, []);

  return (
    <View style={styles.contentContainer}>
      {!showStudents && (
        <>
          {showForm && (
            <StudentForm
              student={student}
              setStudent={setStudent}
              onSave={handleSave}
              setShowForm={setShowForm}
            />
          )}
          <View style={styles.iconsContent}>
            <AntDesign
              name="pluscircleo"
              size={24}
              color="blue"
              onPress={() => setShowForm(true)}
              style={styles.icon}
            />
            <Text
              name="yhi"
              size={24}
              color="red"
              onPress={confirmDeleteAll}
              style={styles.icon}
            >
              Заменить
            </Text>
          </View>
        </>
      )}
      <Pressable
        onPress={() => setShowStudents(!showStudents)}
        style={styles.showButton}
      >
        <Text style={styles.buttonText}>
          {showStudents ? "Скрыть студентов" : "Показать студентов"}
        </Text>
      </Pressable>
      {showStudents && (
        <FlatList
          data={students}
          renderItem={({ item }) => (
            <StudentButton
              student={item}
              deleteStudent={deleteStudent}
              updateStudent={updateStudent}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 60,
    marginBottom: 20,
  },
  contentContainer: {
    flex: 1,
    width: "90%",
  },
  studentButton: {
    backgroundColor: "lightblue",
    padding: 5,
    marginVertical: 5,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  studentText: {
    fontSize: 20,
    fontWeight: "bolder",
  },
  studentContent: {
    backgroundColor: "#cdcdcd",
    padding: 10,
  },
  icon: {
    marginHorizontal: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    marginVertical: 3,
  },
  saveButton: {
    backgroundColor: "blue",
    padding: 10,
    marginVertical: 5,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
  },
  cancelButton: {
    backgroundColor: "grey",
    padding: 10,
    marginVertical: 5,
  },
  iconsContent: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
  },
  showButton: {
    backgroundColor: "green",
    padding: 10,
    marginVertical: 5,
  },
});

export default App;
