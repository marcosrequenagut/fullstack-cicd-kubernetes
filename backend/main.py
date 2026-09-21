import pandas as pd
from fastapi import FastAPI

from db_connection import engine
from fastapi.middleware.cors import CORSMiddleware

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
