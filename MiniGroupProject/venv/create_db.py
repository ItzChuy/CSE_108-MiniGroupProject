# This program creates all the tables defined in app.py

from app import app, db

# Ensure the app context is pushed before working with the database
with app.app_context():
    db.create_all()

print("The database was created successfully")