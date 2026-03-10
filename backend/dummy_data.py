from app.database import SessionLocal, engine, Base
from app.models import Plant, Employee, Job, JobOperation, Downtime
from datetime import datetime, timedelta
import random

Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Clear existing data
db.query(Downtime).delete()
db.query(JobOperation).delete()
db.query(Job).delete()
db.query(Employee).delete()
db.query(Plant).delete()
db.commit()

# ---------- PLANTS ----------
plants_data = [
    {"name": "Plant A - CNC & Lathe", "location": "Brampton", "lat": 43.7315, "lng": -79.7624},
    {"name": "Plant B - Excello & Deburring", "location": "Mississauga", "lat": 43.5890, "lng": -79.6441},
    {"name": "Plant C - Inspection", "location": "Oakville", "lat": 43.4675, "lng": -79.6877},
    {"name": "Plant D - Assembly & Shipping", "location": "Burlington", "lat": 43.3255, "lng": -79.7990},
]

plants = []
for p in plants_data:
    plant = Plant(**p)
    db.add(plant)
    db.flush()
    plants.append(plant)
db.commit()

print(f"Created {len(plants)} plants")

# ---------- EMPLOYEES ----------
roles_by_dept = [
    ("operator", "CNC", 0),
    ("operator", "Lathe", 0),
    ("operator", "Excello", 1),
    ("operator", "Deburring", 1),
    ("operator", "Inspection", 2),
    ("operator", "Assembly", 3),
    ("supervisor", "CNC", 0),
    ("supervisor", "Deburring", 1),
    ("supervisor", "Inspection", 2),
    ("supervisor", "Assembly", 3),
    ("manager", "Operations", 3),
    ("driver", "Logistics", 0),
    ("driver", "Logistics", 1),
    ("driver", "Logistics", 2),
    ("driver", "Logistics", 3),
]

first_names = ["James", "Maria", "David", "Sarah", "Kevin", "Linda", "Carlos", "Emma", "Raj", "Priya",
               "Ahmed", "Fatima", "John", "Mei", "Daniel", "Aisha", "Chris", "Nina", "Tom", "Zara"]
last_names = ["Smith", "Johnson", "Patel", "Williams", "Brown", "Garcia", "Kim", "Singh", "Chen", "Davis"]

employees = []
emp_code = 1000
for i, (role, dept, plant_idx) in enumerate(roles_by_dept):
    for j in range(3 if role == "operator" else 1):
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        emp = Employee(
            name=name,
            employee_code=f"EMP{emp_code}",
            role=role,
            department=dept,
            plant_id=plants[plant_idx].id
        )
        db.add(emp)
        db.flush()
        employees.append(emp)
        emp_code += 1

db.commit()
print(f"Created {len(employees)} employees")

# ---------- JOBS ----------
part_catalog = [
    {"part_number": "AE-1042", "part_name": "Turbine Bracket", "customer": "Boeing", "base_time": 45},
    {"part_number": "AE-2031", "part_name": "Fuselage Clamp", "customer": "Airbus", "base_time": 30},
    {"part_number": "AE-3087", "part_name": "Engine Mount Pin", "customer": "Bombardier", "base_time": 60},
    {"part_number": "AE-4012", "part_name": "Wing Rib Connector", "customer": "Boeing", "base_time": 25},
    {"part_number": "AE-5066", "part_name": "Landing Gear Sleeve", "customer": "Airbus", "base_time": 90},
    {"part_number": "AE-6023", "part_name": "Hydraulic Fitting", "customer": "Bombardier", "base_time": 20},
    {"part_number": "AE-7041", "part_name": "Cabin Frame Bolt", "customer": "Boeing", "base_time": 15},
    {"part_number": "AE-8055", "part_name": "Exhaust Manifold Stud", "customer": "Airbus", "base_time": 35},
]

operations_sequence = [
    {"name": "CNC Machining", "plant_idx": 0, "setup": 30},
    {"name": "Lathe", "plant_idx": 0, "setup": 20},
    {"name": "Excello", "plant_idx": 1, "setup": 15},
    {"name": "Deburring", "plant_idx": 1, "setup": 0},
    {"name": "Inspection", "plant_idx": 2, "setup": 10},
    {"name": "Assembly", "plant_idx": 3, "setup": 20},
]

statuses = ["in_progress", "in_progress", "in_progress", "delayed", "completed", "shipped"]
priorities = ["normal", "normal", "high", "critical", "low"]

jobs = []
for i in range(40):
    part = random.choice(part_catalog)
    quantity = random.randint(5, 50)
    order_date = datetime.utcnow() - timedelta(days=random.randint(5, 30))
    due_date = order_date + timedelta(days=random.randint(10, 25))
    status = random.choice(statuses)
    current_op_idx = random.randint(0, len(operations_sequence) - 1)

    job = Job(
        job_number=f"JOB-{2024000 + i}",
        part_number=part["part_number"],
        part_name=part["part_name"],
        quantity=quantity,
        customer=part["customer"],
        order_date=order_date,
        due_date=due_date,
        predicted_ship_date=due_date + timedelta(days=random.randint(-2, 5)),
        status=status,
        priority=random.choice(priorities),
        current_operation=operations_sequence[current_op_idx]["name"],
        current_plant_id=plants[operations_sequence[current_op_idx]["plant_idx"]].id
    )
    db.add(job)
    db.flush()
    jobs.append((job, part, current_op_idx))

db.commit()

# ---------- JOB OPERATIONS ----------
for job, part, current_op_idx in jobs:
    for seq, op in enumerate(operations_sequence):
        base = part["base_time"]
        predicted = (op["setup"] + base * job.quantity) / 60  # hours to minutes, simplified
        predicted_minutes = round(predicted + random.uniform(-5, 10), 1)

        if seq < current_op_idx:
            op_status = "completed"
            actual = predicted_minutes * random.uniform(0.8, 1.4)
            start = job.order_date + timedelta(hours=seq * 8)
            end = start + timedelta(minutes=actual)
        elif seq == current_op_idx:
            op_status = "in_progress"
            actual = None
            start = datetime.utcnow() - timedelta(minutes=random.randint(10, 120))
            end = None
        else:
            op_status = "pending"
            actual = None
            start = None
            end = None

        operation = JobOperation(
            job_id=job.id,
            operation_name=op["name"],
            plant_id=plants[op["plant_idx"]].id,
            sequence=seq,
            predicted_time_minutes=predicted_minutes,
            actual_time_minutes=actual,
            setup_time_minutes=op["setup"],
            status=op_status,
            start_time=start,
            end_time=end,
            parts_completed=job.quantity if op_status == "completed" else random.randint(0, job.quantity),
        )
        db.add(operation)

db.commit()
print(f"Created {len(jobs)} jobs with operations")

# ---------- DOWNTIME RECORDS ----------
reasons = [
    "Tool mismatch on spindle",
    "Wrong fixture used for part",
    "Machine calibration drift",
    "Coolant system blockage",
    "Part tolerance out of spec from CNC",
    "Operator setup error corrected",
    "Waiting for replacement tooling",
]

cnc_operations = db.query(JobOperation).filter(
    JobOperation.operation_name == "CNC Machining",
    JobOperation.status == "completed"
).all()

operators = [e for e in employees if e.role == "operator"]
supervisors = [e for e in employees if e.role == "supervisor"]

for op in random.sample(cnc_operations, min(10, len(cnc_operations))):
    downtime = Downtime(
        job_operation_id=op.id,
        reported_by=random.choice(operators).id,
        approved_by=random.choice(supervisors).id,
        reason=random.choice(reasons),
        duration_minutes=random.uniform(15, 90),
        is_approved=random.choice([True, True, False]),
        is_recurring=random.choice([True, False, False]),
        technician_notified=random.choice([True, False]),
        machine_id=f"CNC-{random.randint(1,6):02d}",
        part_number=op.job.part_number if op.job else None,
        created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 72))
    )
    db.add(downtime)

db.commit()
print("Created downtime records")
print("\nDummy data generation complete!")
db.close()