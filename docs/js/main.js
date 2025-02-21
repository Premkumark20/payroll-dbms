// Global state
let employees = [];

// Utility functions
const showSection = (sectionId) => {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
};

const updateEmployeeSelects = () => {
    const selects = ['employeeSelect', 'payrollEmployee'];
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">Select Employee</option>';
        employees.forEach(emp => {
            select.innerHTML += `<option value="${emp.id}">${emp.name}</option>`;
        });
    });
};

// Local Storage functions
const saveToLocalStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

const getFromLocalStorage = (key) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
};

// Load initial data
employees = getFromLocalStorage('employees');
updateEmployeeSelects();

// Employee management
document.getElementById('employeeForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = {
        id: Date.now(), // Simple way to generate unique ID
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        position: document.getElementById('position').value,
        salary: parseFloat(document.getElementById('salary').value)
    };

    employees.push(formData);
    saveToLocalStorage('employees', employees);
    updateEmployeeSelects();
    
    const employeeList = document.getElementById('employeeList');
    employeeList.innerHTML += `
        <div>
            <span>${formData.name}</span>
            <span>${formData.email}</span>
            <span>${formData.position}</span>
            <span>$${formData.salary}</span>
        </div>
    `;
    e.target.reset();
});

// Attendance management
document.getElementById('attendanceForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = {
        employeeId: document.getElementById('employeeSelect').value,
        status: document.getElementById('status').value,
        date: new Date().toISOString()
    };

    let attendance = getFromLocalStorage('attendance');
    attendance.push(formData);
    saveToLocalStorage('attendance', attendance);
    
    alert('Attendance marked successfully!');
    e.target.reset();
});

// Payroll management
document.getElementById('payrollForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const employeeId = document.getElementById('payrollEmployee').value;
    const employee = employees.find(emp => emp.id == employeeId);
    
    const formData = {
        employeeId: employeeId,
        month: parseInt(document.getElementById('month').value),
        year: parseInt(document.getElementById('year').value),
        basicSalary: employee.salary,
        deductions: parseFloat(document.getElementById('deductions').value)
    };

    let payroll = getFromLocalStorage('payroll');
    payroll.push({
        ...formData,
        netSalary: formData.basicSalary - formData.deductions
    });
    saveToLocalStorage('payroll', payroll);
    
    const payrollResult = document.getElementById('payrollResult');
    payrollResult.innerHTML = `
        <div>
            <strong>Employee:</strong> ${employee.name}<br>
            <strong>Basic Salary:</strong> $${formData.basicSalary}<br>
            <strong>Deductions:</strong> $${formData.deductions}<br>
            <strong>Net Salary:</strong> $${formData.basicSalary - formData.deductions}
        </div>
    `;
    e.target.reset();
});

// Load existing data
const loadEmployees = () => {
    const employeeList = document.getElementById('employeeList');
    employeeList.innerHTML = '';
    employees.forEach(emp => {
        employeeList.innerHTML += `
            <div>
                <span>${emp.name}</span>
                <span>${emp.email}</span>
                <span>${emp.position}</span>
                <span>$${emp.salary}</span>
            </div>
        `;
    });
};

// Initial load
loadEmployees();
