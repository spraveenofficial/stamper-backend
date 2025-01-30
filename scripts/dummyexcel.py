import pandas as pd
import random
from faker import Faker

# Initialize Faker for generating random names, emails, and phone numbers
fake = Faker()

# Constants for consistent values
office = "Organisation Main Office"
department = "kkknkn"
job_title = "jjjj"

# Function to generate 10,000 rows of dummy data
def generate_dummy_data(num_rows):
    data = {
        "Employee Name": [fake.name() for _ in range(num_rows)],
        "Joining Date": [fake.date_this_decade() for _ in range(num_rows)],
        "Office": [office] * num_rows,
        "Department": [department] * num_rows,
        "Job Title": [job_title] * num_rows,
        "Phone Number": [fake.msisdn() for _ in range(num_rows)],
        "Email": [fake.email() for _ in range(num_rows)],
    }
    return pd.DataFrame(data)

# Generate dummy data with 10,000 rows
dummy_data = generate_dummy_data(10000)

# Save the generated data to an Excel file
output_path = "dummy_employee_data.xlsx"
dummy_data.to_excel(output_path, index=False, sheet_name="Employee Upload")

# Confirm the file was created successfully
output_path