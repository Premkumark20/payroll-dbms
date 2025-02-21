# Payroll Database Management System

A comprehensive web-based Payroll Management System built with Python Flask, SQLite, and modern frontend technologies. The system handles employee management, attendance tracking, and payroll generation with a secure authentication system.

## Features

### Authentication & Security
- Secure login system
- Session management
- Protected routes
- Default credentials:
  - Username: hr@company.name
  - Password: 123

### Employee Management
- Add and view employees
- Track employee details
- Email and position management
- Salary management in INR (auto-converted from USD inputs)

### Attendance Management
- Daily attendance tracking
- Multiple status options (present, absent, half-day)
- Historical attendance records

### Payroll Management
- Automated payroll generation
- Salary calculations in INR
- Deduction management
- Net salary computation
- Monthly and yearly tracking

### User Interface
- Modern and responsive design
- Loading animations
- Interactive feedback
- Currency formatting in Indian Rupee (₹)
- Smooth transitions and animations

## Technical Features
- Flask backend with SQLite database
- Session-based authentication
- RESTful API endpoints
- Client-side form validation
- Responsive CSS design
- Modern JavaScript with async/await
- USD to INR currency conversion

## Setup Instructions

### Prerequisites
- Python 3.8 or higher
- Git (for version control)
- Web browser (Chrome/Firefox recommended)

### Installation Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/Sairam5566/PDMS.git
   cd payroll_system
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the application:
   ```bash
   python app.py
   ```

4. Access the application:
   - Open your browser and navigate to `http://localhost:5000`
   - You will be redirected to the login page
   - Use the default credentials:
     - Username: hr@company.name
     - Password: 123

## Usage Guide

### First Time Setup
1. Log in using the default credentials
2. Add employees with their details
3. Start tracking attendance
4. Generate payroll as needed

### Daily Operations
1. Mark attendance for employees
2. Update any employee details if needed
3. Generate payroll at the end of the pay period

### Payroll Generation
1. Select an employee
2. Enter the month and year
3. Add any deductions
4. System will automatically:
   - Convert USD amounts to INR
   - Calculate net salary
   - Display formatted results

## Security Notes
- Change the default credentials after first login
- The system uses session-based authentication
- All routes are protected
- Automatic logout on session expiry

## Currency Handling
- All salary inputs are in USD
- System automatically converts to INR (current rate: 1 USD = 83 INR)
- All displays are formatted in Indian currency format
- Supports proper decimal handling

## Support and Updates
For issues and feature requests, please create an issue in the GitHub repository.

## License
This project is licensed under the MIT License - see the LICENSE file for details.
