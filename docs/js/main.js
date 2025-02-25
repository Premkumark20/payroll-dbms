// Global state
let employees = [];
const USD_TO_INR_RATE = 83;

// Utility functions
const convertUSDtoINR = (usdAmount) => {
    return usdAmount * USD_TO_INR_RATE;
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

const showLoading = () => {
    document.querySelector('.loading-screen').classList.remove('hidden');
};

const hideLoading = () => {
    document.querySelector('.loading-screen').classList.add('hidden');
};

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

// Immediate authentication check
if (!localStorage.getItem('isAuthenticated')) {
    window.location.replace('login.html');
}

document.addEventListener('DOMContentLoaded', () => {
    // Hide loading screen
    document.querySelector('.loading-screen').classList.add('hidden');

    // Format currency in INR
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Get stored employees or initialize empty array
    const getEmployees = () => {
        return JSON.parse(localStorage.getItem('employees') || '[]');
    };

    // Save employees to localStorage
    const saveEmployees = (employees) => {
        localStorage.setItem('employees', JSON.stringify(employees));
    };

    // Display employees in the grid
    const displayEmployees = () => {
        const employees = getEmployees();
        const employeeList = document.getElementById('employeeList');
        
        employeeList.innerHTML = `
            <div class="grid-header">
                <span>Name</span>
                <span>Email</span>
                <span>Position</span>
                <span>Salary (INR)</span>
                <span>Join Date</span>
            </div>
        `;

        employees.forEach(employee => {
            const row = document.createElement('div');
            row.className = 'grid-row';
            row.innerHTML = `
                <span>${employee.name}</span>
                <span>${employee.email}</span>
                <span>${employee.position}</span>
                <span>${formatCurrency(employee.salary)}</span>
                <span>${new Date(employee.join_date).toLocaleDateString()}</span>
            `;
            employeeList.appendChild(row);
        });
    };

    // Handle employee form submission
    const employeeForm = document.getElementById('employeeForm');
    if (employeeForm) {
        employeeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const position = document.getElementById('position').value;
            const salary = parseFloat(document.getElementById('salary').value);

            // Show loading screen
            document.querySelector('.loading-screen').classList.remove('hidden');

            // Add new employee
            const employees = getEmployees();
            const newEmployee = {
                id: Date.now(),
                name,
                email,
                position,
                salary,  // Store directly in INR
                join_date: new Date().toISOString()
            };
            
            employees.push(newEmployee);
            saveEmployees(employees);
            
            // Clear form
            employeeForm.reset();
            
            // Refresh display
            displayEmployees();
            
            // Hide loading screen
            document.querySelector('.loading-screen').classList.add('hidden');
        });
    }

    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Clear authentication state
            localStorage.removeItem('isAuthenticated');
            // Redirect to login page
            window.location.replace('login.html');
        });
    }

    // Employee management
    document.getElementById('employeeForm').addEventListener('submit', (e) => {
        e.preventDefault();
        showLoading();
        
        const formData = {
            id: Date.now(),
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            position: document.getElementById('position').value,
            salary: parseFloat(document.getElementById('salary').value), // Store directly in INR
            join_date: new Date().toISOString()
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
                <span>${formatCurrency(formData.salary)}</span>
                <span>${new Date(formData.join_date).toLocaleDateString()}</span>
            </div>
        `;
        e.target.reset();
        hideLoading();
    });

    // Attendance management
    document.getElementById('attendanceForm').addEventListener('submit', (e) => {
        e.preventDefault();
        showLoading();
        
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
        hideLoading();
    });

    // Payroll management
    document.getElementById('payrollForm').addEventListener('submit', (e) => {
        e.preventDefault();
        showLoading();
        
        const employeeId = document.getElementById('payrollEmployee').value;
        const employee = employees.find(emp => emp.id == employeeId);
        
        const formData = {
            employeeId: employeeId,
            month: parseInt(document.getElementById('month').value),
            year: parseInt(document.getElementById('year').value),
            basicSalary: employee.salary,
            deductions: parseFloat(document.getElementById('deductions').value) // Store directly in INR
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
                <strong>Basic Salary:</strong> ${formatCurrency(formData.basicSalary)}<br>
                <strong>Deductions:</strong> ${formatCurrency(formData.deductions)}<br>
                <strong>Net Salary:</strong> ${formatCurrency(formData.basicSalary - formData.deductions)}
            </div>
        `;
        e.target.reset();
        hideLoading();
    });

    // Load existing data
    const loadEmployees = () => {
        showLoading();
        const employeeList = document.getElementById('employeeList');
        employeeList.innerHTML = `
            <div class="grid-header">
                <span>Name</span>
                <span>Email</span>
                <span>Position</span>
                <span>Salary (INR)</span>
                <span>Join Date</span>
            </div>
        `;
        employees.forEach(emp => {
            const row = document.createElement('div');
            row.className = 'grid-row';
            row.innerHTML = `
                <span>${emp.name}</span>
                <span>${emp.email}</span>
                <span>${emp.position}</span>
                <span>${formatCurrency(emp.salary)}</span>
                <span>${new Date(emp.join_date).toLocaleDateString()}</span>
            `;
            employeeList.appendChild(row);
        });
        hideLoading();
    };

    // Initial setup
    employees = getFromLocalStorage('employees');
    updateEmployeeSelects();
    loadEmployees();
    hideLoading();
});
