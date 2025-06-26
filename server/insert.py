import requests
import random
from faker import Faker

url = 'http://localhost:4000/database/row/insert'
fake = Faker()

total_rows = 10000
start_id = 0

values_list = []

for id in range(start_id, start_id + total_rows):
    name = fake.name().replace("'", "")  # Apostrof eltávolítása, hogy ne legyen SQL hiba
    age = random.randint(18, 25)
    values_list.append(f"({id}, '{name}', {age})")

# Összefűzzük egyetlen lekérdezéssé
values_str = ",\n".join(values_list)
query = f"USE bemutat3;\nINSERT INTO student(id, name, age) VALUES\n{values_str};"
print(query)  # Debugging célokra, ha szükséges
# Küldjük a lekérdezést
data = {'query': query}
response = requests.post(url, json=data)

# Eredmény feldolgozás
if response.ok:
    try:
        result = response.json()
        print("Insert sikeres:", result)
    except ValueError:
        print("Sikeres válasz, de nem JSON:", response.text)
else:
    print(f"Hiba: {response.status_code} - {response.text}")
