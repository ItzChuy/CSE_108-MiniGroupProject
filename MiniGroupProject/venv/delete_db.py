# This program will drop the database (all tables)

from app import app, db

# Ensure the app context is pushed before working with the database
with app.app_context():
    db.drop_all()

print("The database was deleted successfully")

