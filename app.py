from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__)
app.secret_key = 'your-secret-key'  # Change this to a secure secret key
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'payroll.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

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
    status = db.Column(db.String(20), nullable=False)

class Payroll(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'), nullable=False)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    basic_salary = db.Column(db.Float, nullable=False)  # Stored in INR
    deductions = db.Column(db.Float, nullable=False)  # Stored in INR
    net_salary = db.Column(db.Float, nullable=False)  # Stored in INR

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
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/employees')
@login_required
def get_employees():
    employees = Employee.query.all()
    return jsonify({'employees': [{
        'id': e.id,
        'name': e.name,
        'email': e.email,
        'position': e.position,
        'salary': e.salary,  # Return salary in INR
        'join_date': e.join_date.strftime('%Y-%m-%d')
    } for e in employees]})

@app.route('/add_attendance', methods=['POST'])
@login_required
def add_attendance():
    try:
        data = request.get_json()
        attendance = Attendance(
            employee_id=data['employee_id'],
            status=data['status']
        )
        db.session.add(attendance)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/generate_payroll', methods=['POST'])
@login_required
def generate_payroll():
    try:
        data = request.get_json()
        payroll = Payroll(
            employee_id=data['employee_id'],
            month=data['month'],
            year=data['year'],
            basic_salary=float(data['basic_salary']),  # Store in INR
            deductions=float(data['deductions']),      # Store in INR
            net_salary=float(data['basic_salary']) - float(data['deductions'])  # Calculate in INR
        )
        db.session.add(payroll)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
