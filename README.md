# Payroll Database Management System (PDMS)

A comprehensive web-based payroll management system with authentication and employee management features.

## Features

- Authentication System
  - Login credentials: hr@company.name / 123
  - Session-based authentication
  - Protected routes

- Employee Management
  - Add and view employees
  - Track employee details (name, email, position, salary)
  - Salary in Indian Rupees (₹)

- Attendance Management
  - Mark daily attendance
  - Multiple status options (present, absent, half-day)
  - Store attendance records

- Payroll Management
  - Generate monthly payroll
  - Calculate net salary
  - Handle deductions
  - All calculations in INR

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/Sairam5566/PDMS.git
cd PDMS
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the Flask application:
```bash
python app.py
```

4. Access the application:
- Local Flask version: http://localhost:5000
- GitHub Pages version: https://premkumar k20.github.io/payroll-dbms

## Deployment

The application is configured to be deployed on PythonAnywhere or similar Python hosting platforms.

### Deployment Steps:

1. Create an account on PythonAnywhere
2. Upload the code or clone from GitHub
3. Create a virtual environment and install dependencies:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

4. Configure the web app on PythonAnywhere:
   - Set the working directory to your project folder
   - Set the WSGI configuration file to point to app.py
   - Set the virtual environment path

## Technologies Used

- Backend: Python Flask
- Database: SQLite
- Frontend: HTML, CSS, JavaScript
- Storage: Local Storage (GitHub Pages version)

## Default Credentials

- Username: hr@company.name
- Password: 123

## Project Structure

```
PDMS/
├── app.py              # Flask application
├── payroll.db          # SQLite database
├── requirements.txt    # Python dependencies
├── static/            # Static files for Flask
│   ├── css/
│   └── js/
├── templates/         # Flask HTML templates
└── docs/             # GitHub Pages version
```

## Notes

- All salary values are in Indian Rupees (₹)
- The GitHub Pages version uses local storage for data persistence
- The Flask version uses SQLite for data storage
