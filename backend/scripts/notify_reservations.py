import os
from datetime import datetime, timedelta

from database import SessionLocal
from models import Reservations
from telegram_notifier import send_telegram_message

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

URL = f"https://api.telegram.org/bot{TOKEN}/sendMessage"

db = SessionLocal()

try:
    today = datetime.now() 
    tomorrow = today + timedelta(days=1)

    reservations = db.query(Reservations).filter(
        Reservations.date_of_reservation.between(today, tomorrow),
        Reservations.notified == False
    ).all()

    for reservation in reservations:
        send_telegram_message(
            f"Reservation ID: {reservation.id}\n"
            f"Date of Reservation: {reservation.date_of_reservation}\n"
            f"Start Time: {reservation.start_time}\n"
            f"End Time: {reservation.end_time}"
        )

        # When the reservation message is sent, we marked it as send it using
        # a boolean expression to not to send it again the day before
        reservation.notified = True

finally:
    db.close()