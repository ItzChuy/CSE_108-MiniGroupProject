# reference:
# https://www.geeksforgeeks.org/how-to-add-authentication-to-your-app-with-flask-login/
# https://www.forestadmin.com/blog/flask-tastic-admin-panel-a-step-by-step-guide-to-building-your-own-2/

from flask import Flask, request, redirect, url_for, render_template, jsonify, flash
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_login import LoginManager, UserMixin, login_user, logout_user, current_user
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.ext.mutable import MutableDict, MutableList
from flask_admin.form import BaseForm
from wtforms import StringField, PasswordField, BooleanField, Field
from wtforms.validators import DataRequired
from wtforms.fields import TextAreaField
import json

app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///grades.sqlite"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = "thisISaSecrETkeY"
db = SQLAlchemy(app)

admin = Admin(app, name="My Admin Panel", template_mode="bootstrap4")

login_manager = LoginManager()
login_manager.init_app(app)

# Predfined for seeing how it works but maybe admin adds the classes? ###############################
offered_classes = ["Physics 121", "CSE 108", "Math 131", "CSE 162"]

offered_classes_times = {
    "Physics 121": "MWF 2:00-2:50 PM",
    "CSE 108": "TR 11:00-11:50 AM",
    "Math 131": "TR 1:30-2:45 PM",
    "CSE 162": "MWF 10:00-10:50 AM",
}

offered_classes_enrollment = {
    "Physics 121": 5,
    "CSE 108": 4,
    "Math 131": 1,
    "CSE 162": 1,
}

offered_classes_capacity = {
    "Physics 121": 10,
    "CSE 108": 10,
    "Math 131": 10,
    "CSE 162": 10,
}

offered_classes_status = {
    "Physics 121": True,
    "CSE 108": True,
    "Math 131": True,
    "CSE 162": True,
}

offered_classes_professors = {
    "Physics 121": "Susan Walker",
    "CSE 108": "Ammon Hepworth",
    "Math 131": "Juan Meza",
    "CSE 162": "Hua Hang",
}

#########################################################################################################


class Users(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    teacher = db.Column(db.Boolean, nullable=False, default=False)
    classes = db.Column(
        MutableList.as_mutable(db.JSON), default=[]
    )  # list of the class ["CSE 108", "CSE 162"]
    class_time = db.Column(
        MutableDict.as_mutable(db.JSON), default={}
    )  # dict that stores the class times, class_time["CSE 108"] = MWF 10:00-11:15 AM
    class_professor = db.Column(MutableDict.as_mutable(db.JSON), default={})
    class_status = db.Column(MutableDict.as_mutable(db.JSON), default={})
    is_admin = db.Column(
        db.Boolean, nullable=False, default=False
    )  # Use this flag for admin access


class Class(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), unique=True, nullable=False)
    time = db.Column(db.String(255), nullable=False)
    enrolled = db.Column(db.Integer, nullable=False)
    max_capacity = db.Column(db.Integer, nullable=False)


class AdminModelView(ModelView):
    def is_accessible(self):
        return current_user.is_authenticated and current_user.is_admin

    def inaccessible_callback(self, name, **kwargs):
        if current_user.is_authenticated:
            flash("You do not have permission to access the admin dashboard.")
            return redirect(url_for("home"))
        else:
            flash("Please log in.")
            return redirect(url_for("login"))


# Register the models with Flask-Admin
# This code adds the Users model to the admin panel, allowing you to manage them through the Flask-Admin interface
admin.add_view(AdminModelView(Users, db.session))
admin.add_view(AdminModelView(Class, db.session))


# Check access before processing any request to the /admin route
@app.before_request
def restrict_admin():
    # Only allow access to /admin if the user is logged in and is an admin
    if request.path.startswith("/admin"):
        if not current_user.is_authenticated:
            # Redirect to login page if the user is not logged in
            flash("Please log in.")
            return redirect(url_for("login"))
        elif not current_user.is_admin:
            # Redirect to home page if the user is logged in but not an admin
            flash("You do not have permission to access the admin dashboard.")
            return redirect(url_for("home"))


# Creates a user loader callback that returns the user object given an id
@login_manager.user_loader
def user_loader(user_id):
    return Users.query.get(user_id)


# the templates folder has to be at the level of the python file
@app.route("/")
def home():
    # return render_template("home.html")
    return render_template("index.html")
    # return "Home"


@app.route("/register", methods=["GET", "POST"])
def register():
    # If the user made a POST request, create a new user
    if request.method == "POST":
        username_in_use = Users.query.filter_by(
            username=request.form.get("username")
        ).first()
        if username_in_use:
            flash("Username is already in use!", category="error")
            return redirect(url_for("register"))

        password = request.form.get("password")
        hashed_password = generate_password_hash(password)
        isTeacher = request.form.get("teacherRole") == "True"
        isAdmin = request.form.get("adminRole") == "True"
        user = Users(
            username=request.form.get("username"),
            password=hashed_password,
            teacher=isTeacher,
            is_admin=isAdmin,
        )
        db.session.add(user)
        db.session.commit()

        # Once user account created, redirect them to login route
        return redirect(url_for("login"))

    # Renders sign_up template if user made a GET request
    # return render_template("sign_up.html")
    return render_template("register.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    # If a post request was made, find the user by filtering for the username
    if request.method == "POST":
        # user = Users.query.filter_by(username=request.form.get("username")).first()

        # if not user:
        #     flash('User does not exist', category='error')

        # # Check if the password entered is the same as the user's password
        # elif user.password == request.form.get("password"):
        #     # Use the login_user method to log in the user
        #     login_user(user)
        #     # Redirect the user back to the home
        #     flash('Log in successfull')
        #     return redirect(url_for("classes"))
        # else:
        #     flash('Incorrect password', category='error')

        user = Users.query.filter_by(username=request.form.get("username")).first()
        entered_password = request.form.get("password")
        if user and check_password_hash(user.password, entered_password):
            # Use the login_user method to log in the user
            login_user(user)
            # Redirect the user back to the home
            flash("Log in successfull")
            return redirect(url_for("home"))
        elif not user:
            flash("User does not exist", category="error")
        else:
            flash("Incorrect password", category="error")

    # return render_template("loginTUT.html")
    return render_template("login.html")


@app.route("/logout")
def logout():
    logout_user()
    return redirect(url_for("home"))


@app.route("/classes")
def classes():
    return render_template("classes.html")


@app.route("/addClasses")
def addClasses():
    return render_template("addclasses.html")


@app.route("/updateClasses/<string:action>", methods=["POST"])
def updateClasses(action):

    user_class = request.get_json()
    print(user_class)

    if offered_classes_status[user_class] == False:
        return jsonify({"error": "class is full"}), 400  # Send 400 status for an error

    if action == "add":

        if user_class in current_user.classes:
            return (
                jsonify({"error": "Already registered for this class"}),
                400,
            )  # Send 400 status for an error

        current_user.classes.append(user_class)
        current_user.class_time[user_class] = offered_classes_times[user_class]
        current_user.class_professor[user_class] = offered_classes_professors[
            user_class
        ]
        offered_classes_enrollment[user_class] = (
            offered_classes_enrollment[user_class] + 1
        )
        current_user.class_status[user_class] = (
            str(offered_classes_enrollment[user_class])
            + "/"
            + str(offered_classes_capacity[user_class])
        )

        if (
            offered_classes_enrollment[user_class]
            == offered_classes_capacity[user_class]
        ):
            offered_classes_status[user_class] = False
        # print(current_user.classes)
        # print(current_user.class_professor)
        # print(current_user.class_time)
        # print(current_user.class_status)

        db.session.merge(current_user)  # Ensures current_user is tracked in session
        db.session.commit()

        # print(current_user.classes)
        # print(current_user.class_professor)
        # print(current_user.class_time)
        # print(current_user.class_status)

        return jsonify(
            {
                "classes": current_user.classes,
                "class_professor": current_user.class_professor,
                "class_time": current_user.class_time,
                # 'class_time': ["TH 10:30-11:45 AM"],
                "class_status": current_user.class_status,
            }
        )

    if action == "drop":
        current_user.classes.remove(user_class)
        del current_user.class_time[user_class]
        del current_user.class_professor[user_class]
        del current_user.class_status[user_class]
        offered_classes_enrollment[user_class] = (
            offered_classes_enrollment[user_class] - 1
        )

        if (
            offered_classes_enrollment[user_class]
            != offered_classes_capacity[user_class]
        ):
            offered_classes_status[user_class] = True

        db.session.merge(current_user)  # Ensures current_user is tracked in session
        db.session.commit()

        return jsonify(
            {
                "classes": current_user.classes,
                "class_professor": current_user.class_professor,
                "class_time": current_user.class_time,
                "class_status": current_user.class_status,
            }
        )


@app.route("/user_table")
def userTable():
    return render_template("classes.html")


if __name__ == "__main__":
    app.run(debug=True)
