const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const PORT = 8000;
const cors = require('cors');
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());


mongoose.connect("mongodb+srv://ashelake:325411@cluster0.zshh9qv.mongodb.net/Attendance_Management", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to database");
}).catch((err) => {
    console.log("Not Connected to database", err);
});

app.listen(PORT, () => {
    console.log("Server is running on PORT:", PORT);
});

const Employee = require('./models/employee');
const Attendance = require('./models/attendance');



// endpoint to register a employee

app.post("/addEmployee", async (req, res) => {
    try {
        const { employeeId, employeeName, designation, phoneNumber, dateOfBirth, joiningDate, activeEmployee, salary, address } = req.body;

        // create new employee object
        const newEmployee = new Employee({
            employeeId,
            employeeName,
            designation,
            phoneNumber,
            dateOfBirth,
            joiningDate,
            activeEmployee,
            salary,
            address
        });

        await newEmployee.save();
        res.status(200).json({ message: "Employee Added Successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


// endpoint to get all employees
app.get("/employees", async (req, res) => {
    try {
        const employees = await Employee.find();
        res.status(200).json({ employees });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});