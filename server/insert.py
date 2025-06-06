import requests
from faker import Faker
import random

fake = Faker()

def generate_name():
    return fake.name().replace("'", "")  # elkerüljük az aposztróf hibákat

def generate_number():
    return random.randint(0, 100000)

url = 'http://localhost:4000/database/row/insert'
total_rows = 10000
batch_size = 10000
current_id = 0

values = []
for _ in range(batch_size):  # <- javított sor
    name = generate_name()
    age = generate_number()
    values.append(f"({current_id}, '{age}', {name})")
    current_id += 1

values_str = ",\n".join(values)
query = f"USE school;\nINSERT INTO classroom(id, stud_id, subject) VALUES\n{values_str};"

data = {'query': query}
response = requests.post(url, json=data)

if response.ok:
    try:
        result = response.json()
        print(f"Inserted batch ending at ID {current_id}: {result}")
    except ValueError:
        print(f"Batch ending at ID {current_id}: Failed to parse JSON. Raw response: {response.text}")
else:
    print(f"Batch ending at ID {current_id}: HTTP error {response.status_code} - {response.text}")
    
