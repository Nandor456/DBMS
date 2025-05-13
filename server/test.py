import requests

url = 'http://localhost:4000/database/row/insert'

for id in range(10000):
    data = {
        'query': f"Use dads;\ninsert into aa(dsada, fwes) values({id}, 'alma');"
    }
    response = requests.post(url, json=data)
    
    # Optional: print status every 1000 requests
    if response.ok:
        try:
            result = response.json()
            print(result)
        except ValueError:
            print(f"ID {id}: Failed to parse JSON. Raw response: {response}")