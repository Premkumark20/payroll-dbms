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

const checkAuth = async () => {
    try {
        const response = await fetch('/');
        if (response.redirected) {
            window.location.href = '/login';
            return false;
        }
        return true;
    } catch (error) {
        console.error('Auth check error:', error);
        return false;
    }
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

// Employee management
document.getElementById('employeeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        position: document.getElementById('position').value,
        salary: parseFloat(document.getElementById('salary').value)
    };

    try {
        const response = await fetch('/api/employees', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        const data = await response.json();
        alert(data.message);
        loadEmployees();
        e.target.reset();
    } catch (error) {
        alert('Error adding employee');
    }
});

const loadEmployees = async () => {
    try {
        const response = await fetch('/api/employees');
        employees = await response.json();
        updateEmployeeSelects();
        
        const employeeList = document.getElementById('employeeList');
        employeeList.innerHTML = '';
        employees.forEach(emp => {
            employeeList.innerHTML += `
                <div>
                    <span>${emp.name}</span>
                    <span>${emp.email}</span>
                    <span>${emp.position}</span>
                    <span>${formatCurrency(emp.salary)}</span>
                </div>
            `;
        });
    } catch (error) {
        alert('Error loading employees');
    }
};

// Attendance management
document.getElementById('attendanceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = {
        employee_id: document.getElementById('employeeSelect').value,
        status: document.getElementById('status').value
    };

    try {
        const response = await fetch('/api/attendance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        const data = await response.json();
        alert(data.message);
        e.target.reset();
    } catch (error) {
        alert('Error marking attendance');
    }
});

// Payroll management
document.getElementById('payrollForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const employeeId = document.getElementById('payrollEmployee').value;
    const employee = employees.find(emp => emp.id == employeeId);
    
    const formData = {
        employee_id: employeeId,
        month: parseInt(document.getElementById('month').value),
        year: parseInt(document.getElementById('year').value),
        basic_salary: employee.salary,
        deductions: parseFloat(document.getElementById('deductions').value)
    };

    try {
        const response = await fetch('/api/payroll/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        const data = await response.json();
        alert(data.message);
        
        const payrollResult = document.getElementById('payrollResult');
        payrollResult.innerHTML = `
            <div>
                <strong>Employee:</strong> ${employee.name}<br>
                <strong>Basic Salary:</strong> ${formatCurrency(formData.basic_salary)}<br>
                <strong>Deductions:</strong> ${formatCurrency(formData.deductions)}<br>
                <strong>Net Salary:</strong> ${formatCurrency(formData.basic_salary - formData.deductions)}
            </div>
        `;
        e.target.reset();
    } catch (error) {
        alert('Error generating payroll');
    }
});

// Add logout functionality
const setupLogout = () => {
    const nav = document.querySelector('nav');
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'nav-btn';
    logoutBtn.textContent = 'Logout';
    logoutBtn.onclick = async () => {
        showLoading();
        try {
            await fetch('/logout');
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
            hideLoading();
        }
    };
    nav.appendChild(logoutBtn);
};

// Initial setup
document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAuth()) return;
    
    showLoading();
    try {
        // Load employees from API
        const response = await fetch('/api/employees');
        employees = await response.json();
        
        updateEmployeeSelects();
        loadEmployees();
        setupLogout();
    } catch (error) {
        console.error('Initialization error:', error);
    } finally {
        hideLoading();
    }
});
