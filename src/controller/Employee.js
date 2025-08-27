import User from "../models/User.js";
import bcrypt from "bcrypt";

// Create new employee (admin only)
export const createEmployee = async (req, res) => {
  try {
         const {
       firstName,
       lastName,
       email,
       contact,
       phone,
       department,
       position,
       hireDate,
       salary,
       address
     } = req.body;

     // Handle address - if it's a string, convert to object
     let addressObj = address;
     if (typeof address === 'string') {
       addressObj = { street: address };
     }

    // Check if employee already exists
    const existingEmployee = await User.findOne({ email });
    if (existingEmployee) {
      return res.status(409).json({ error: "Employee with this email already exists" });
    }

    // Fallbacks and defaults
    const resolvedContact = contact || phone || "";
    if (!resolvedContact) {
      return res.status(400).json({ error: "Contact or phone number is required" });
    }
    const defaultHashedPassword = await bcrypt.hash("defaultPassword123", 10);

    // Generate employee ID
    const employeeId = `EMP${Date.now()}`;

    // Create user with employee details
    const newEmployee = new User({
      name: `${firstName} ${lastName}`,
      email,
      contact: resolvedContact,
      password: defaultHashedPassword, // Should be changed on first login
      role: "user",
      employeeId,
      firstName,
      lastName,
      phone,
      department,
      position,
      hireDate,
      salary,
             address: addressObj,
       status: "active"
    });

    await newEmployee.save();

    // Remove sensitive fields
    const safeEmployee = newEmployee.toObject();
    delete safeEmployee.password;

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      employee: safeEmployee
    });
     } catch (error) {
     console.error("Create Employee Error:", error);
     if (error.name === "ValidationError") {
       const messages = Object.values(error.errors).map((e) => e.message);
       return res.status(400).json({ error: messages[0] || "Validation error" });
     }
     if (error.code === 11000) {
       return res.status(409).json({ error: "Email already exists" });
     }
     res.status(500).json({ error: "Server error", details: error.message });
   }
};

// Get all employees (admin only)
export const getAllEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: "user" })
      .select('-password') // Don't send password
      .sort({ createdAt: -1 });

    // Separate complete and incomplete profiles
    const completeProfiles = employees.filter(emp => 
      emp.department && emp.position && emp.hireDate && emp.salary && emp.status !== 'pending'
    );
    
    const incompleteProfiles = employees.filter(emp => 
      !emp.department || !emp.position || !emp.hireDate || !emp.salary || emp.status === 'pending'
    );

    res.status(200).json({
      success: true,
      employees,
      completeProfiles,
      incompleteProfiles,
      stats: {
        total: employees.length,
        complete: completeProfiles.length,
        incomplete: incompleteProfiles.length,
        pending: incompleteProfiles.filter(emp => emp.status === 'pending').length
      }
    });
  } catch (error) {
    console.error("Get Employees Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Complete employee profile (admin only)
export const completeEmployeeProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { department, position, hireDate, salary, status = 'active' } = req.body;

    if (!department || !position || !hireDate || !salary) {
      return res.status(400).json({ error: "Department, position, hire date, and salary are required" });
    }

    const employee = await User.findById(id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    if (employee.role !== "user") {
      return res.status(400).json({ error: "Can only complete profiles for employees" });
    }

    // Update employee profile
    employee.department = department;
    employee.position = position;
    employee.hireDate = new Date(hireDate);
    employee.salary = Number(salary);
    employee.status = status;

    await employee.save();

    // Remove sensitive fields
    const safeEmployee = employee.toObject();
    delete safeEmployee.password;

    res.status(200).json({
      success: true,
      message: "Employee profile completed successfully",
      employee: safeEmployee
    });
  } catch (error) {
    console.error("Complete Profile Error:", error.message);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ error: messages[0] || "Validation error" });
    }
    res.status(500).json({ error: "Server error" });
  }
};

// Get employee by ID
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await User.findOne({ _id: id, role: "user" })
      .select('-password');

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.status(200).json({
      success: true,
      employee
    });
  } catch (error) {
    console.error("Get Employee Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Update employee
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Don't allow role change through this endpoint
    delete updateData.role;
    delete updateData.password;

    const employee = await User.findOneAndUpdate(
      { _id: id, role: "user" },
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      employee
    });
  } catch (error) {
    console.error("Update Employee Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete employee
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await User.findOneAndDelete({ _id: id, role: "user" });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully"
    });
  } catch (error) {
    console.error("Delete Employee Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get employee dashboard profile
export const getEmployeeDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'user') {
      return res.status(404).json({ error: "Employee profile not found" });
    }

    res.status(200).json({
      success: true,
      employee: user
    });
  } catch (error) {
    console.error("Get Employee Dashboard Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get employee performance data for reports (admin)
export const getEmployeePerformanceData = async (req, res) => {
  try {
    // Simplified version for testing
    const employees = await User.find({ role: 'user' })
      .select('firstName lastName employeeId department')
      .lean();

    const performanceData = employees.map(employee => ({
      employeeId: employee.employeeId,
      name: `${employee.firstName} ${employee.lastName}`,
      department: employee.department || 'Not Assigned',
      attendanceScore: 85, // Placeholder
      taskScore: 90, // Placeholder
      overallScore: 87.5, // Placeholder
      grade: 'B+',
      metrics: {
        totalDays: 20,
        presentDays: 18,
        lateDays: 2,
        totalTasks: 10,
        completedTasks: 9,
        overdueTasks: 1
      }
    }));

    res.status(200).json({
      success: true,
      performanceData,
      departmentStats: {},
      totalEmployees: performanceData.length,
      averageScore: 87.5
    });
  } catch (error) {
    console.error("Get Employee Performance Data Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
}; 