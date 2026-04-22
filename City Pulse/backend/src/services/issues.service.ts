import mongoose from "mongoose";
import { AdminModel } from "../models/admin.model";
import { WorkerModel } from "../models/worker.model";

export const getAssignablePersonnel = async (departmentId: string) => {
    const { DepartmentModel } = await import("../models/department.model");

    // Attempt to find the department by ID or Name to get both formats
    const dept = await DepartmentModel.findOne({
        $or: [
            { _id: mongoose.Types.ObjectId.isValid(departmentId) ? departmentId : new mongoose.Types.ObjectId() },
            { name: departmentId }
        ]
    });

    const searchTerms = [departmentId];
    if (dept) {
        searchTerms.push((dept as any)._id.toString());
        searchTerms.push((dept as any).name);
    }

    const departmentAdmins = await AdminModel.find({
        role: { $in: ["DEPARTMENT_ADMIN", "dept_admin", "admin"] },
        department: { $in: searchTerms }
    }).select("-password -__v");

    const workers = await WorkerModel.find({
        department: { $in: searchTerms }
    }).select("-password -__v");

    return { departmentAdmins, workers };
};
