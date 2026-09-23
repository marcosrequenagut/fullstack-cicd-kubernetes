from datetime import date, time

from pydantic import BaseModel, EmailStr


class CourtCreate(BaseModel):
    name: str


class CourtOut(CourtCreate):
    id: int
    model_config = {"from_attributes": True}

class PlayerCreate(BaseModel):
    name: str
    surname: str
    email: EmailStr


class PlayerOut(PlayerCreate):
    id: int
    model_config = {"from_attributes": True}


class ReservationCreate(BaseModel):
    court_id: int
    player_id: int
    date_of_reservation: date
    start_time: time
    end_time: time


class ReservationOut(ReservationCreate):
    id: int
    notified: bool
    model_config = {"from_attributes": True}