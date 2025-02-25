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
        if (select) {
            select.innerHTML = '<option value="">Select Employee</option>';
            employees.forEach(emp => {
                select.innerHTML += `<option value="${emp.id}">${emp.name}</option>`;
            });
        }
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
        currency: 'INR'
    }).format(amount);
};

// Constants for payroll calculations
const LATE_THRESHOLD_MINUTES = 15;
const LATE_DEDUCTION_PER_MINUTE = 10; // INR
const ABSENT_DEDUCTION_PERCENT = 5; // 5% of daily salary
const HALF_DAY_DEDUCTION_PERCENT = 2.5; // 2.5% of daily salary

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
        const response = await fetch('/add_employee', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        const data = await response.json();
        if (data.success) {
            alert('Employee added successfully');
            loadEmployees();
            e.target.reset();
        } else {
            alert(data.message || 'Error adding employee');
        }
    } catch (error) {
        alert('Error adding employee');
    }
});

const loadEmployees = async () => {
    try {
        const response = await fetch('/employees');
        const data = await response.json();
        employees = data.employees;
        updateEmployeeSelects();
        
        displayEmployees(employees);
    } catch (error) {
        console.error('Error loading employees:', error);
        alert('Error loading employees');
    }
};

function displayEmployees(employees) {
    const employeeList = document.getElementById('employeeList');
    employeeList.innerHTML = `
        <div class="employee-row">
            <strong>Name</strong>
            <strong>Email</strong>
            <strong>Position</strong>
            <strong>Salary (INR)</strong>
            <strong>Actions</strong>
        </div>
    `;
    
    employees.forEach(emp => {
        const row = document.createElement('div');
        row.className = 'employee-row';
        row.innerHTML = `
            <span>${emp.name}</span>
            <span>${emp.email}</span>
            <span>${emp.position}</span>
            <span>${formatCurrency(emp.salary)}</span>
            <span>
                <button onclick="deleteEmployee(${emp.id})" class="delete-btn">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </span>
        `;
        employeeList.appendChild(row);
    });
}

async function deleteEmployee(employeeId) {
    if (!confirm('Are you sure you want to delete this employee? This will also delete all related attendance and payroll records.')) {
        return;
    }

    showLoading();
    try {
        const response = await fetch(`/delete_employee/${employeeId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        if (data.success) {
            // Refresh the employee list
            loadEmployees();
        } else {
            alert('Error deleting employee: ' + data.message);
        }
    } catch (error) {
        alert('Error deleting employee: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Attendance management
document.getElementById('attendanceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const employeeId = document.getElementById('attendanceEmployee').value;
        const date = document.getElementById('date').value;
        const status = document.getElementById('status').value;
        const arrivalTime = status !== 'absent' ? document.getElementById('arrivalTime').value : null;

        if (!employeeId || !date || !status) {
            alert('Please fill in all required fields');
            return;
        }

        const formData = {
            employee_id: employeeId,
            date: date,
            status: status,
            arrival_time: arrivalTime
        };

        const response = await fetch('/add_attendance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        
        if (data.success) {
            alert('Attendance recorded successfully');
            e.target.reset();
            await loadAttendance();
            
            // Reset the form to default state
            const arrivalTimeGroup = document.getElementById('arrivalTimeGroup');
            if (arrivalTimeGroup) {
                arrivalTimeGroup.style.display = 'block';
            }
            const arrivalTimeInput = document.getElementById('arrivalTime');
            if (arrivalTimeInput) {
                arrivalTimeInput.setAttribute('required', 'required');
            }
        } else {
            alert(data.message || 'Error recording attendance');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error recording attendance');
    }
});

document.getElementById('status').addEventListener('change', (e) => {
    const arrivalTimeGroup = document.getElementById('arrivalTimeGroup');
    const arrivalTimeInput = document.getElementById('arrivalTime');
    const status = e.target.value;
    
    if (!arrivalTimeGroup || !arrivalTimeInput) {
        console.error('Arrival time elements not found');
        return;
    }
    
    if (status === 'absent') {
        arrivalTimeGroup.style.display = 'none';
        arrivalTimeInput.removeAttribute('required');
        arrivalTimeInput.value = '';  // Clear the time input
    } else {
        arrivalTimeGroup.style.display = 'block';
        arrivalTimeInput.setAttribute('required', 'required');
    }
});

// Load employees into attendance dropdown
const loadEmployeesIntoAttendanceDropdown = async () => {
    try {
        const response = await fetch('/employees');
        const data = await response.json();
        
        if (!data.success) {
            console.error('Error loading employees:', data);
            return;
        }

        const dropdown = document.getElementById('attendanceEmployee');
        if (!dropdown) {
            console.error('Attendance employee dropdown not found');
            return;
        }

        // Clear existing options
        dropdown.innerHTML = '';
        
        // Add default option
        dropdown.innerHTML = '<option value="" disabled selected>Select Employee</option>';
        
        // Add employee options
        if (data.employees && data.employees.length > 0) {
            data.employees.forEach(emp => {
                dropdown.innerHTML += `<option value="${emp.id}">${emp.name} (${emp.position})</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading employees:', error);
    }
};

// Initialize attendance form when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadEmployeesIntoAttendanceDropdown();
    
    // Set default date to today
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        dateInput.max = today;  // Prevent future dates
    }
});

// Payroll management
const loadEmployeesIntoDropdown = async () => {
    try {
        const response = await fetch('/employees');
        const data = await response.json();
        
        if (!data.success) {
            console.error('Error loading employees:', data);
            return;
        }

        const dropdown = document.getElementById('payrollEmployee');
        if (!dropdown) {
            console.error('Payroll employee dropdown not found');
            return;
        }

        // Clear existing options
        dropdown.innerHTML = '';
        
        // Add default option
        dropdown.innerHTML = '<option value="" disabled selected>Select Employee</option>';
        
        // Add employee options
        if (data.employees && data.employees.length > 0) {
            data.employees.forEach(emp => {
                dropdown.innerHTML += `<option value="${emp.id}">${emp.name} (${emp.position})</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading employees:', error);
    }
};

const initializePayrollForm = () => {
    const form = document.getElementById('payrollForm');
    if (!form) {
        console.error('Payroll form not found');
        return;
    }

    // Set default year
    const yearInput = document.getElementById('year');
    if (yearInput) {
        yearInput.value = new Date().getFullYear();
    }

    // Set default values for deductions and allowances
    const deductionsInput = document.getElementById('additionalDeductions');
    const allowancesInput = document.getElementById('additionalAllowances');
    if (deductionsInput) deductionsInput.value = '0';
    if (allowancesInput) allowancesInput.value = '0';
};

const handlePayrollSubmit = async (e) => {
    e.preventDefault();
    
    try {
        // Get form elements
        const form = e.target;
        const employeeSelect = form.querySelector('#payrollEmployee');
        const monthInput = form.querySelector('#month');
        const yearInput = form.querySelector('#year');
        const deductionsInput = form.querySelector('#additionalDeductions');
        const allowancesInput = form.querySelector('#additionalAllowances');
        const commentsInput = form.querySelector('#hrComments');

        // Validate form elements exist
        if (!employeeSelect || !monthInput || !yearInput) {
            console.error('Required form elements not found');
            alert('Form error: Required fields not found');
            return;
        }

        // Get form values
        const employeeId = employeeSelect.value;
        const month = parseInt(monthInput.value);
        const year = parseInt(yearInput.value);
        const additionalDeductions = parseFloat(deductionsInput?.value || '0');
        const additionalAllowances = parseFloat(allowancesInput?.value || '0');
        const hrComments = commentsInput?.value || '';

        // Validate values
        if (!employeeId) {
            alert('Please select an employee');
            return;
        }
        if (!month || month < 1 || month > 12) {
            alert('Please enter a valid month (1-12)');
            return;
        }
        if (!year || year < 2000 || year > 2100) {
            alert('Please enter a valid year');
            return;
        }

        console.log('Submitting payroll:', {
            employeeId,
            month,
            year,
            additionalDeductions,
            additionalAllowances,
            hrComments
        });

        // Calculate payroll
        const response = await fetch(`/calculate_payroll/${employeeId}/${year}/${month}`);
        const data = await response.json();

        if (!data.success) {
            console.error('Calculation error:', data);
            alert(data.message || 'Error calculating payroll');
            return;
        }

        // Generate payroll
        const formData = {
            employee_id: employeeId,
            month: month,
            year: year,
            basic_salary: data.basic_salary,
            attendance_deduction: data.attendance_deduction,
            late_deduction: data.late_deduction,
            additional_deductions: additionalDeductions,
            additional_allowances: additionalAllowances,
            hr_comments: hrComments
        };

        const saveResponse = await fetch('/generate_payroll', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const saveData = await saveResponse.json();

        if (saveData.success) {
            alert('Payroll generated successfully');
            await loadPayroll();  // Reload payroll list
            form.reset();         // Clear form
            
            // Reset default values
            if (yearInput) yearInput.value = new Date().getFullYear();
            if (deductionsInput) deductionsInput.value = '0';
            if (allowancesInput) allowancesInput.value = '0';
        } else {
            console.error('Generation error:', saveData);
            alert(saveData.message || 'Error generating payroll');
        }
    } catch (error) {
        console.error('Error during payroll generation:', error);
        alert('Error generating payroll. Please check the console for details.');
    }
};

document.getElementById('payrollForm').addEventListener('submit', handlePayrollSubmit);

const loadAttendance = async () => {
    try {
        const response = await fetch('/get_attendance');
        const data = await response.json();
        
        if (!data.success) {
            console.error('Error loading attendance:', data.message);
            return;
        }

        const attendanceList = document.getElementById('attendanceList');
        if (!attendanceList) {
            console.error('Attendance list element not found');
            return;
        }

        // Create table if it doesn't exist
        let table = attendanceList.querySelector('table');
        if (!table) {
            table = document.createElement('table');
            table.className = 'data-table';
            attendanceList.appendChild(table);
        }

        // Create table header
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Employee Name</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Arrival Time</th>
                    <th>Late Status</th>
                </tr>
            </thead>
            <tbody>
                ${data.attendances.map(attendance => `
                    <tr>
                        <td>${attendance.employee_name}</td>
                        <td>${attendance.date}</td>
                        <td>${attendance.status}</td>
                        <td>${attendance.arrival_time || '-'}</td>
                        <td>${attendance.is_late ? `Late by ${attendance.late_minutes} minutes` : 'On Time'}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;

        if (data.attendances.length === 0) {
            table.innerHTML += '<tr><td colspan="5" class="no-data">No attendance records found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading attendance:', error);
    }
};

const loadPayroll = async () => {
    try {
        const response = await fetch('/payroll');
        const data = await response.json();
        
        const payrollList = document.getElementById('payrollList');
        if (!payrollList) {
            console.error('Payroll list element not found');
            return;
        }

        if (!data.success) {
            console.error('Error loading payroll:', data);
            payrollList.innerHTML = '<div class="error">Error loading payroll records</div>';
            return;
        }

        // Clear existing content
        payrollList.innerHTML = '';

        if (!data.payroll || data.payroll.length === 0) {
            payrollList.innerHTML = '<div class="no-data">No payroll records found</div>';
            return;
        }

        // Add header
        const header = document.createElement('div');
        header.className = 'payroll-header';
        header.innerHTML = `
            <span>Employee</span>
            <span>Period</span>
            <span>Basic Salary</span>
            <span>Attendance Ded.</span>
            <span>Late Ded.</span>
            <span>Additional Ded.</span>
            <span>Allowances</span>
            <span>Net Salary</span>
            <span>Status</span>
        `;
        payrollList.appendChild(header);

        // Add rows
        data.payroll.forEach(pay => {
            const row = document.createElement('div');
            row.className = 'payroll-row';
            row.innerHTML = `
                <span>${pay.employee_name}</span>
                <span>${pay.month}/${pay.year}</span>
                <span class="currency">${formatCurrency(pay.basic_salary)}</span>
                <span class="currency">-${formatCurrency(pay.attendance_deduction)}</span>
                <span class="currency">-${formatCurrency(pay.late_deduction)}</span>
                <span class="currency">-${formatCurrency(pay.additional_deductions)}</span>
                <span class="currency">+${formatCurrency(pay.additional_allowances)}</span>
                <span class="currency">${formatCurrency(pay.net_salary)}</span>
                <span class="status-${pay.status.toLowerCase()}">${pay.status}</span>
            `;
            payrollList.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading payroll:', error);
        const payrollList = document.getElementById('payrollList');
        if (payrollList) {
            payrollList.innerHTML = '<div class="error">Error loading payroll records</div>';
        }
    }
};

// Function to clear all data
const clearAllData = async () => {
    if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch('/clear_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.success) {
            alert('All data has been cleared successfully');
            // Refresh all data displays
            loadEmployees();
            loadAttendance();
            loadPayroll();
            // Reset all forms
            document.querySelectorAll('form').forEach(form => form.reset());
        } else {
            alert(data.message || 'Error clearing data');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error clearing data');
    }
};

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
    
    try {
        // Show loading screen
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }

        // Load initial data
        await loadEmployees();
        await loadAttendance();
        await loadPayroll();
        loadEmployeesIntoDropdown();
        initializePayrollForm();
        loadEmployeesIntoAttendanceDropdown();
    } catch (error) {
        console.error('Error during initialization:', error);
    } finally {
        // Hide loading screen
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }
});
