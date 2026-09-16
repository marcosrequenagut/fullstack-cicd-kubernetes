import pandas as pd
from db_connection import engine

df = pd.read_csv("data/olist_order_items_dataset.csv")
df.to_sql("order_items", con=engine, if_exists="replace", index=False)
