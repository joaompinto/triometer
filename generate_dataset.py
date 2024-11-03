
import uuid
import random
from sqlmodel import SQLModel, Field, Session, create_engine, select
from collections import defaultdict

# Define the database model (same as in main.py)
class Selection(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    user_id: str = Field(index=True, unique=True)
    country: str
    salary: int
    people: int
    work: int

# Create the database engine
DATABASE_URL = "sqlite:///database.db"
engine = create_engine(DATABASE_URL, echo=True)

# Initialize the database (ensure tables are created)
SQLModel.metadata.create_all(engine)

# List of sample countries
COUNTRIES = [
    "United States",
    "Canada",
    "United Kingdom",
    "Germany",
    "France",
    "Australia",
    "Japan",
    "Brazil",
    "India",
    "South Africa"
]

def generate_random_selection():
    """Generate a random Selection entry."""
    return Selection(
        user_id=str(uuid.uuid4()),
        country=random.choice(COUNTRIES),
        salary=random.randint(1, 10),
        people=random.randint(1, 10),
        work=random.randint(1, 10)
    )

def populate_database(num_entries: int):
    """Populate the database with a specified number of random entries."""
    with Session(engine) as session:
        for _ in range(num_entries):
            selection = generate_random_selection()
            session.add(selection)
        session.commit()
    print(f"Successfully added {num_entries} random entries to the database.")

if __name__ == "__main__":
    try:
        entries = int(input("Enter the number of random entries to generate: "))
        populate_database(entries)
    except ValueError:
        print("Please enter a valid integer.")
