from requests import *

BASE_URL = 'http://localhost:3000/api'

print(
    get(
        BASE_URL +
        '/meeting/5b9a341cf6e8531918155bdb/attendance/5b9a32a4f6e8531918155bd9'
    ).json()
)

print(
    post(
        BASE_URL +
        '/meeting/5b9a341cf6e8531918155bdb/attendance/5b9a32a4f6e8531918155bd9'
    ).json()
)

print(
    get(
        BASE_URL +
        '/meeting/5b9a341cf6e8531918155bdb/attendance/5b9a32a4f6e8531918155bd9'
    ).json()
)