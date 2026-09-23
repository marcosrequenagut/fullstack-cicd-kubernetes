import os

import requests

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

URL = f"https://api.telegram.org/bot{TOKEN}/sendMessage"

def send_telegram_message(text: str):

    data = {
        "chat_id": CHAT_ID,
        "text": text
    }

    response = requests.post(URL, data=data)
    
    return response.json()