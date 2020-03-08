import requests, json, sys
from bs4 import BeautifulSoup

username = sys.argv[-4]
cookie = sys.argv[-3]
classname = sys.argv[-2]
sourcefile = sys.argv[-1]
session = requests.Session()
session.cookies['MOD_AUTH_CAS_S'] = cookie

project = '20170221154931653'
ukey = saved = realdstamp = project
url = f'https://cs.adelaide.edu.au/services/spi/ajax/compiler/users/{project}/{username}/src/{ukey}/{saved}/{realdstamp}'
sourcecode = open(sourcefile, 'r').read()
params = {'udata': json.dumps({'classname': classname, 'sourcecode': sourcecode})}
headers = {'X-ECMS-Secret': 'ecms-secret-not-set'}
res = session.post(url, params, headers=headers)

print(res.text)
