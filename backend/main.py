from fastapi import FastAPI
from db_connection import engine
import pandas as pd

app = FastAPI()


@app.get("/")
def read_root():
    return {"message": "Hello, it's working!"}


@app.get("/order-items")
def get_order_items_data():
    query = "SELECT * FROM order_items LIMIT 10"

    df = pd.read_sql(query, con=engine)

    return df.to_dict(orient="records")