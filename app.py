from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, time
import os
import calendar
from sqlalchemy import Time

app = Flask(__name__)
app.secret_key = 'your-secret-key'  # Change this to a secure secret key
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, 'payroll.db')

# Configure SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + db_path
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = True
db = SQLAlchemy(app)

# Define constants for deductions
ABSENT_DEDUCTION_PERCENT = 10
HALF_DAY_DEDUCTION_PERCENT = 5
LATE_DEDUCTION_PER_MINUTE = 0.1

class Employee(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    position = db.Column(db.String(100), nullable=False)
    salary = db.Column(db.Float, nullable=False)  # Stored in INR
    join_date = db.Column(db.DateTime, default=datetime.utcnow)

class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'), nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), nullable=False)  # present, absent, half-day
    arrival_time = db.Column(db.String(5), nullable=True)  # Store as HH:MM string
    is_late = db.Column(db.Boolean, default=False)
    late_minutes = db.Column(db.Integer, default=0)

class Payroll(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'), nullable=False)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    basic_salary = db.Column(db.Float, nullable=False)
    attendance_deduction = db.Column(db.Float, default=0.0)
    late_deduction = db.Column(db.Float, default=0.0)
    additional_deductions = db.Column(db.Float, default=0.0)
    additional_allowances = db.Column(db.Float, default=0.0)
    final_deductions = db.Column(db.Float, default=0.0)
    net_salary = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    hr_comments = db.Column(db.String(500))

def login_required(f):
    def wrapper(*args, **kwargs):
        if 'logged_in' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper

@app.route('/')
@login_required
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        if data['username'] == 'hr@company.name' and data['password'] == '123':
            session['logged_in'] = True
            return jsonify({'success': True})
        return jsonify({'success': False})
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect(url_for('login'))

@app.route('/add_employee', methods=['POST'])
@login_required
def add_employee():
    try:
        data = request.get_json()
        employee = Employee(
            name=data['name'],
            email=data['email'],
            position=data['position'],
            salary=float(data['salary'])  # Store directly in INR
        )
        db.session.add(employee)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'employee': {
                'id': employee.id,
                'name': employee.name,
                'email': employee.email,
                'position': employee.position,
                'salary': employee.salary,
                'join_date': employee.join_date.strftime('%Y-%m-%d')
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/employees')
@login_required
def get_employees():
    try:
        employees = Employee.query.all()
        return jsonify({
            'success': True,
            'employees': [{
                'id': e.id,
                'name': e.name,
                'email': e.email,
                'position': e.position,
                'salary': e.salary,
                'join_date': e.join_date.strftime('%Y-%m-%d')
            } for e in employees]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/add_attendance', methods=['POST'])
@login_required
def add_attendance():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['employee_id', 'date', 'status']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                })

        # Convert date string to datetime
        try:
            attendance_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid date format. Use YYYY-MM-DD'
            })

        # Check if attendance already exists for this date
        existing_attendance = Attendance.query.filter_by(
            employee_id=data['employee_id'],
            date=attendance_date
        ).first()

        if existing_attendance:
            return jsonify({
                'success': False,
                'message': 'Attendance already marked for this date'
            })

        # Process arrival time only if status is not absent
        arrival_time = None
        is_late = False
        late_minutes = 0

        if data['status'] != 'absent' and 'arrival_time' in data and data['arrival_time']:
            arrival_time = data['arrival_time']
            
            # Parse arrival time
            try:
                time_parts = arrival_time.split(':')
                hours = int(time_parts[0])
                minutes = int(time_parts[1])
                
                # Check if late (after 9:30 AM)
                if hours > 9 or (hours == 9 and minutes > 30):
                    is_late = True
                    late_minutes = (hours - 9) * 60 + minutes - 30
            except (ValueError, IndexError):
                return jsonify({
                    'success': False,
                    'message': 'Invalid time format. Use HH:mm'
                })

        # Create attendance record
        attendance = Attendance(
            employee_id=data['employee_id'],
            date=attendance_date,
            status=data['status'],
            arrival_time=arrival_time,
            is_late=is_late,
            late_minutes=late_minutes
        )

        db.session.add(attendance)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Attendance recorded successfully'
        })

    except Exception as e:
        db.session.rollback()
        print('Error recording attendance:', str(e))
        return jsonify({
            'success': False,
            'message': 'Error recording attendance'
        }), 500

@app.route('/get_attendance', methods=['GET'])
@login_required
def get_attendance():
    try:
        attendances = Attendance.query.all()
        attendance_list = []
        
        for attendance in attendances:
            employee = Employee.query.get(attendance.employee_id)
            if employee:
                attendance_list.append({
                    'id': attendance.id,
                    'employee_name': employee.name,
                    'date': attendance.date.strftime('%Y-%m-%d'),
                    'status': attendance.status,
                    'arrival_time': attendance.arrival_time,
                    'is_late': attendance.is_late,
                    'late_minutes': attendance.late_minutes
                })
        
        return jsonify({
            'success': True,
            'attendances': attendance_list
        })
    except Exception as e:
        print('Error fetching attendance:', str(e))
        return jsonify({
            'success': False,
            'message': 'Error fetching attendance records'
        }), 500

@app.route('/calculate_payroll/<int:employee_id>/<int:year>/<int:month>')
@login_required
def calculate_payroll(employee_id, year, month):
    try:
        print(f"Starting payroll calculation for employee {employee_id}, {month}/{year}")
        
        # Get employee
        employee = Employee.query.get(employee_id)
        if not employee:
            print(f"Employee {employee_id} not found")
            return jsonify({'success': False, 'message': 'Employee not found'})

        print(f"Found employee: {employee.name}, salary: {employee.salary}")

        # Get attendance records for the month
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        
        attendance_records = Attendance.query.filter(
            Attendance.employee_id == employee_id,
            Attendance.date >= start_date,
            Attendance.date < end_date
        ).all()
        
        print(f"Found {len(attendance_records)} attendance records")

        # Calculate working days in the month
        total_days = calendar.monthrange(year, month)[1]
        working_days = len([d for d in attendance_records if d.status != 'absent'])
        daily_salary = employee.salary / total_days if total_days > 0 else 0

        print(f"Total days: {total_days}, Working days: {working_days}, Daily salary: {daily_salary}")

        # Calculate attendance deductions
        absent_days = len([d for d in attendance_records if d.status == 'absent'])
        half_days = len([d for d in attendance_records if d.status == 'half-day'])
        attendance_deduction = (absent_days * daily_salary * ABSENT_DEDUCTION_PERCENT / 100 +
                              half_days * daily_salary * HALF_DAY_DEDUCTION_PERCENT / 100)

        print(f"Absent days: {absent_days}, Half days: {half_days}, Attendance deduction: {attendance_deduction}")

        # Calculate late deductions
        total_late_minutes = sum(a.late_minutes or 0 for a in attendance_records if a.is_late)
        late_deduction = total_late_minutes * LATE_DEDUCTION_PER_MINUTE

        print(f"Total late minutes: {total_late_minutes}, Late deduction: {late_deduction}")

        return jsonify({
            'success': True,
            'basic_salary': employee.salary,
            'attendance_deduction': round(attendance_deduction, 2),
            'late_deduction': round(late_deduction, 2),
            'total_deductions': round(attendance_deduction + late_deduction, 2),
            'working_days': working_days,
            'absent_days': absent_days,
            'half_days': half_days,
            'total_late_minutes': total_late_minutes
        })
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print("Error in calculate_payroll:", error_details)
        return jsonify({
            'success': False,
            'message': str(e),
            'details': error_details
        })

@app.route('/generate_payroll', methods=['POST'])
@login_required
def generate_payroll():
    try:
        data = request.get_json()
        print("Received payroll data:", data)

        # Validate required fields
        required_fields = ['employee_id', 'month', 'year', 'basic_salary']
        for field in required_fields:
            if field not in data:
                print(f"Missing required field: {field}")
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                })

        # Convert data types
        employee_id = int(data['employee_id'])
        month = int(data['month'])
        year = int(data['year'])
        basic_salary = float(data['basic_salary'])
        
        print(f"Processing payroll for employee {employee_id}, {month}/{year}")
        
        # Check if employee exists
        employee = Employee.query.get(employee_id)
        if not employee:
            print(f"Employee {employee_id} not found")
            return jsonify({
                'success': False,
                'message': 'Employee not found'
            })

        # Check if payroll already exists
        existing_payroll = Payroll.query.filter_by(
            employee_id=employee_id,
            month=month,
            year=year
        ).first()
        
        if existing_payroll:
            print(f"Payroll already exists for employee {employee_id}, {month}/{year}")
            return jsonify({
                'success': False,
                'message': 'Payroll already exists for this employee in the specified month'
            })

        # Calculate deductions
        attendance_deduction = float(data.get('attendance_deduction', 0))
        late_deduction = float(data.get('late_deduction', 0))
        additional_deductions = float(data.get('additional_deductions', 0))
        additional_allowances = float(data.get('additional_allowances', 0))
        
        total_deductions = (
            attendance_deduction +
            late_deduction +
            additional_deductions -
            additional_allowances
        )
        
        net_salary = basic_salary - total_deductions

        print(f"Calculated deductions: {total_deductions}, Net salary: {net_salary}")

        # Create payroll record
        payroll = Payroll(
            employee_id=employee_id,
            month=month,
            year=year,
            basic_salary=basic_salary,
            attendance_deduction=attendance_deduction,
            late_deduction=late_deduction,
            additional_deductions=additional_deductions,
            additional_allowances=additional_allowances,
            final_deductions=total_deductions,
            net_salary=net_salary,
            status='pending',
            hr_comments=data.get('hr_comments', '')
        )
        
        db.session.add(payroll)
        db.session.commit()
        
        print("Payroll generated successfully")
        
        return jsonify({
            'success': True,
            'message': 'Payroll generated successfully',
            'payroll': {
                'id': payroll.id,
                'employee_id': payroll.employee_id,
                'month': payroll.month,
                'year': payroll.year,
                'net_salary': payroll.net_salary
            }
        })
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print("Error in generate_payroll:", error_details)
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error generating payroll: {str(e)}',
            'details': error_details
        }), 500

@app.route('/payroll')
@login_required
def get_payroll():
    try:
        payroll_records = Payroll.query.all()
        return jsonify({
            'success': True,
            'payroll': [{
                'id': p.id,
                'employee_name': Employee.query.get(p.employee_id).name,
                'month': p.month,
                'year': p.year,
                'basic_salary': p.basic_salary,
                'attendance_deduction': p.attendance_deduction,
                'late_deduction': p.late_deduction,
                'additional_deductions': p.additional_deductions,
                'additional_allowances': p.additional_allowances,
                'final_deductions': p.final_deductions,
                'net_salary': p.net_salary,
                'status': p.status,
                'hr_comments': p.hr_comments
            } for p in payroll_records]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/delete_employee/<int:employee_id>', methods=['DELETE'])
@login_required
def delete_employee(employee_id):
    try:
        # Delete related attendance records
        Attendance.query.filter_by(employee_id=employee_id).delete()
        
        # Delete related payroll records
        Payroll.query.filter_by(employee_id=employee_id).delete()
        
        # Delete the employee
        employee = Employee.query.get_or_404(employee_id)
        db.session.delete(employee)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Employee deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/clear_data', methods=['POST'])
@login_required
def clear_data():
    try:
        # Clear all tables in reverse order of dependencies
        Payroll.query.delete()
        Attendance.query.delete()
        Employee.query.delete()
        
        # Commit the changes
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'All data has been cleared successfully'
        })
    except Exception as e:
        db.session.rollback()
        print('Error clearing data:', str(e))
        return jsonify({
            'success': False,
            'message': 'Error clearing data'
        }), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)
