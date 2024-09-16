import mongoose from "mongoose";
import { toJSON } from "../toJSON";
import {IEmployeeDoc, IEmployeeModel } from "./employee.interfaces";


const employeeSchema = new mongoose.Schema<IEmployeeDoc, IEmployeeModel>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    jobTitle: {
        type: String,
        required: true
    },
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    department: {
        type: String,
        required: true
    },
    office: {
        type: String,
        required : true,
    },
    employeeStatus: {
        type: String,
        required: true
    },
    accountStatus: {
        type: String,
        required: true
    }
}, {
    timestamps: true
})

employeeSchema.plugin(toJSON);


const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;