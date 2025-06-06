import requests
import random
<<<<<<< HEAD

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
    
=======
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


# use Bemutato1;
# select *;
# FROM student s;
# join book b on s.id = b.studentFk;
# join teacher t on s.id = t.id;
# where s.age < 20 AND t.age > 63622;
>>>>>>> c33e75ca38b220ce8d6e67bbffce2e53f65c369b
