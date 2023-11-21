const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const moment = require('moment');
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

app.post("/attendance", async (req, res) => {
    try {

        const { employeeId, employeeName, date, status } = req.body;
        const existingAttendance = await Attendance.findOne({ employeeId, date });

        if (existingAttendance) {
            existingAttendance.status = status;
            await existingAttendance.save();
            res.status(200).json(existingAttendance);
        } else {

            const newAttendance = new Attendance({
                employeeId,
                employeeName,
                date,
                status
            });

            await newAttendance.save();
            res.status(200).json(newAttendance);
        }


    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});

app.get("/attendance", async (req, res) => {
    try {

        const { date } = req.query;
        const attendance = await Attendance.find({ date });
        res.status(200).json(attendance);

    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});

app.get("/attendance-report-all-employees", async (req, res) => {
    try {
        const { month, year } = req.query;
        const startDate = moment(`${year}-${month}-01`).format("YYYY-MM-DD");
        const endDate = moment(startDate).endOf("month").format("YYYY-MM-DD");

        const report = await Attendance.aggregate([
            {
                $match: {
                    $expr: {
                        $and: [
                            {
                                $eq: [
                                    { $month: { $dateFromString: { dateString: "$date" } } },
                                    parseInt(month)
                                ]
                            },
                            {
                                $eq: [
                                    { $year: { $dateFromString: { dateString: "$date" } } },
                                    parseInt(year)
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: "$employeeId",
                    present: {
                        $sum: {
                            $cond: { if: { $eq: ["$status", "present"] }, then: 1, else: 0 }
                        }
                    },
                    absent: {
                        $sum: {
                            $cond: { if: { $eq: ["$status", "absent"] }, then: 1, else: 0 }
                        }

                    },
                    halfday: {
                        $sum: {
                            $cond: { if: { $eq: ["$status", "halfday"] }, then: 1, else: 0 }
                        }
                    },
                    holiday: {
                        $sum: {
                            $cond: { if: { $eq: ["$status", "holiday"] }, then: 1, else: 0 }
                        }
                    }

                }
            },
            {
                $lookup: {
                    from: "employees",
                    localField: "_id",
                    foreignField: "employeeId",
                    as: "employeeDetails"
                }
            },
            {
                $unwind: "$employeeDetails"
            },
            {
                $project: {
                    _id: 1,
                    present: 1,
                    absent: 1,
                    halfday: 1,
                    holiday: 1,
                    name: "$employeeDetails.employeeName",
                    designation: "$employeeDetails.designation",
                    salary: "$employeeDetails.salary",
                    employeeId: "$employeeDetails.employeeId"
                }
            },
            res.status(200).json({ report })

        ])

    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});
