import pandas as pd
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import get_db
from db_connection import engine
from models import Courts, Players, Reservations
from schemas import (
    CourtCreate,
    CourtOut,
    PlayerCreate,
    PlayerOut,
    ReservationCreate,
    ReservationOut,
)
from telegram_notifier import send_telegram_message

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:8080"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Hello, it's working!"}


@app.get("/order-items")
def get_order_items_data():
    query = "SELECT * FROM order_items LIMIT 100"

    df = pd.read_sql(query, con=engine)

    return df.to_dict(orient="records")


@app.post("/courts", response_model=CourtOut)
def create_court(court: CourtCreate, db: Session = Depends(get_db)):
    db_court = Courts(name=court.name)
    db.add(db_court)
    db.commit()
    db.refresh(db_court)
    return db_court


@app.post("/players", response_model=PlayerOut)
def create_player(player: PlayerCreate, db: Session = Depends(get_db)):
    db_player = Players(name=player.name, surname=player.surname, email=player.email)
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player


@app.post("/reservations", response_model=ReservationOut)
def create_reservation(reservation: ReservationCreate, db: Session = Depends(get_db)):
    db_reservation = Reservations(
        court_id=reservation.court_id,
        player_id=reservation.player_id,
        date_of_reservation=reservation.date_of_reservation,
        start_time=reservation.start_time,
        end_time=reservation.end_time
    )
    db.add(db_reservation)
    db.commit()
    db.refresh(db_reservation)

    send_telegram_message(
        f"Reservation ID: {db_reservation.id}\n"
        f"Date of Reservation: {db_reservation.date_of_reservation}\n"
        f"Start Time: {db_reservation.start_time}\n"
        f"End Time: {db_reservation.end_time}"
    )
    
    return db_reservation


@app.get("/reservations", response_model=list[ReservationOut])
def get_reservations(db: Session = Depends(get_db)):
    reservations = db.query(Reservations).all()
    return reservations