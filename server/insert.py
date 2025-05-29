import requests
import random
from faker import Faker
#url = 'http://localhost:4000/database/row/insert'
url = 'http://localhost:4000/database/row/insert'
names_list = ['John', 'Mike', 'Claudia', 'Wilson', 'Kevin', 'Potter', 'Alice', 'Bob', 'Emma', 'Liam']
fake = Faker()
for id in range(47162,100007,1):
    names = fake.name()
    ages = random.randint(18, 25)
    data = {
        'query': f"Use school;\ninsert into student('id', 'name', 'age') values({id}, {names}, {ages});"
    }
    id = id + 1
    response = requests.post(url, json=data)
    
    # Optional: print status every 1000 requests
    if response.ok:
        try:
            result = response.json()
        except ValueError:
            print(f"ID {id}: Failed to parse JSON. Raw response: {response}")