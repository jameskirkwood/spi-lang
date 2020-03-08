import requests, json, sys
from bs4 import BeautifulSoup

username = sys.argv[-2]
password = sys.argv[-1]

session = requests.Session()

res = session.get(r'https://login.adelaide.edu.au/cas/login?service=https%3a%2f%2fcs.adelaide.edu.au%2fservices%2fspi%2f')
soup = BeautifulSoup(res.text, 'html.parser')
inputs = {e.get('name'): e.get('value') for e in soup.form.find_all('input')}
inputs['username'] = username
inputs['password'] = password
res = session.post(res.url, data=inputs)

print(session.cookies['MOD_AUTH_CAS_S'])
