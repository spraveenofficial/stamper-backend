import random
import faker
from datetime import datetime, timedelta
import json

# Initialize Faker instance
fake = faker.Faker()

# List of sample job titles, departments, and offices (these would ideally be actual IDs in your database)
job_titles = [
   "66f7e9782f1b6c01120dcc3e"
]
departments = [
    '66f7e8a82f1b6c01120dcc32'
]
offices = [
    '66f7e88b2f1b6c01120dcc2b'
]

# Generate 200 dummy users with the same structure as the example
dummy_users = []

for _ in range(100):
    user = {
        "name": fake.name(),
        "email": fake.email(),
        "jobTitle": random.choice(job_titles),
        "department": random.choice(departments),
        "office": random.choice(offices),
        "joiningDate": (datetime.now() + timedelta(days=random.randint(0, 365))).strftime("%Y-%m-%d"),
        "phoneNumber": fake.phone_number(),
    }
    dummy_users.append(user)

# Save the dummy users to a JSON file
with open("dummy",'w') as json_file:
    json.dump(dummy_users, json_file, indent=4)
