import requests
import random
from faker import Faker

url = 'http://localhost:4000/database/row/insert'
fake = Faker()

# INSERT fejléc
query = "USE InsertTest;\n\nINSERT INTO tabla ('pk', 'oszlop') VALUES\n"

# Értéksorok összegyűjtése
values = []
for id in range(10000, 100000):
    name = fake.name().replace("'", "")  # egyszerű idézőjel eltávolítás
    age = random.randint(18, 25)
    values.append(f"({id}, '{name})'")

# Az összes értéket összefűzzük 1 nagy stringgé
query += ",\n".join(values) + ";"
print("Kész INSERT lekérdezés:\n", query)
# Lekérdezés POST kéréssel
response = requests.post(url, json={'query': query})

# Eredmény kiírás
if response.ok:
    try:
        print("✅ Sikeres insert:", response.json())
    except ValueError:
        print("❌ JSON parse error:", response.text)
else:
    print("❌ HTTP hiba:", response.status_code, response.text)