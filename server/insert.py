import requests

#url = 'http://localhost:4000/database/row/insert'
url = 'http://localhost:4000/database/row/insert'
names = ['John', 'Mike', 'Claudia', 'Wilson', 'Kevin', 'Potter']
ages = ['21', '23', '19', '18', '21', '21']
for id in range(6):
    data = {
        'query': f"Use school;\ninsert into student('id', 'name', 'age') values({id}, {names[id]}, {ages[id]});"
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