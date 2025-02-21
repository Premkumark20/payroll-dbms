from flask import Flask, render_template, request, jsonify, url_for
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'payroll.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy()
db.init_app(app)

# Database Models
class Employee(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    position = db.Column(db.String(100))
    salary = db.Column(db.Float)
    join_date = db.Column(db.DateTime, default=datetime.utcnow)

class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'))
    date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20))  # present, absent, half-day

class Payroll(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'))
    month = db.Column(db.Integer)
    year = db.Column(db.Integer)
    basic_salary = db.Column(db.Float)
    deductions = db.Column(db.Float)
    net_salary = db.Column(db.Float)

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/employees', methods=['GET', 'POST'])
def handle_employees():
    if request.method == 'POST':
        data = request.json
        new_employee = Employee(
            name=data['name'],
            email=data['email'],
            position=data['position'],
            salary=data['salary']
        )
        db.session.add(new_employee)
        db.session.commit()
        return jsonify({'message': 'Employee added successfully'})
    
    employees = Employee.query.all()
    return jsonify([{
        'id': e.id,
        'name': e.name,
        'email': e.email,
        'position': e.position,
        'salary': e.salary
    } for e in employees])

@app.route('/api/attendance', methods=['POST'])
def mark_attendance():
    data = request.json
    attendance = Attendance(
        employee_id=data['employee_id'],
        status=data['status']
    )
    db.session.add(attendance)
    db.session.commit()
    return jsonify({'message': 'Attendance marked successfully'})

@app.route('/api/payroll/generate', methods=['POST'])
def generate_payroll():
    data = request.json
    payroll = Payroll(
        employee_id=data['employee_id'],
        month=data['month'],
        year=data['year'],
        basic_salary=data['basic_salary'],
        deductions=data['deductions'],
        net_salary=data['basic_salary'] - data['deductions']
    )
    db.session.add(payroll)
    db.session.commit()
    return jsonify({'message': 'Payroll generated successfully'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
