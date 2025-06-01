import requests
from faker import Faker
import random
fake = Faker()
def generate_name():
    return fake.name()
def generate_number():
    return random.randint(17, 35)
url = 'http://localhost:4000/database/row/insert'
for id in range(25):
    data = {
        'query': f"Use school;\ninsert into student('id', 'name', 'age') values({id}, {generate_name()}, {generate_number()});"
    }

    id = id + 1
    response = requests.post(url, json=data)
    
    # Optional: print status every 1000 requests
    if response.ok:
        try:
            result = response.json()
            print(result)
        except ValueError:
            print(f"ID {id}: Failed to parse JSON. Raw response: {response}")