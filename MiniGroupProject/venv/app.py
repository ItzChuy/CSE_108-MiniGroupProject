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
from wtforms import StringField, PasswordField, BooleanField, Field, TextAreaField, ValidationError
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
    "Physics 121": 8,
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
    names = db.Column(MutableList.as_mutable(db.JSON), default=["Physics 121", "CSE 108", "Math 131", "CSE 162"])
    name = db.Column(db.String(255), unique=True, nullable=False)
    time = db.Column(db.String(255), nullable=False)
    enrolled = db.Column(db.Integer, nullable=False)
    max_capacity = db.Column(db.Integer, nullable=False)


class AdminModelView(ModelView):
    # form_excluded_columns = ['password']
    # Make the 'password' field read-only in the form
    form_widget_args = {
        'password': {
            'readonly': True
        },
        'username': {
            'readonly': True
        }
    }
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
    class_names = [item['class_name'] for item in current_user.classes]

    # Iterate over the list and print only the class names
    # for item in current_user.classes:
    #     print(item['class_name']) ahhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
    return render_template("classes.html",class_names=class_names)





@app.route("/addClasses")
def addClasses():
    return render_template("addclasses.html")

from flask_login import current_user

@app.route('/teacher')
def teacher():
    if current_user.is_authenticated and current_user.teacher:  # Check if the user is logged in and is a teacher
        teacher_classes = current_user.classes  # Get the list of classes the teacher is teaching

        # Prepare a list of class details to pass to the template
        class_details = []
        for class_name in teacher_classes:
            class_info = {
                'course_name': class_name,
                'teacher': offered_classes_professors.get(class_name, 'N/A'),
                'time': offered_classes_times.get(class_name, 'N/A'),
                'enrollment': f"{offered_classes_enrollment.get(class_name, 0)} / {offered_classes_capacity.get(class_name, 0)}"
            }
            class_details.append(class_info)

        return render_template('teacher.html', class_details=class_details)

    return redirect(url_for('login'))  # Redirect if user is not logged in or not a teacher



@app.route("/updateClasses/<string:action>", methods=["GET", "POST"])
def updateClasses(action):
    if request.method == "GET":
        return jsonify({
            "classes": current_user.classes,
            "class_professor": current_user.class_professor,
            "class_time": current_user.class_time,
            "class_status": current_user.class_status,
        })

    # else the method is "POST"

    data = request.get_json()  # expecting data as a JSON object, e.g., {"class_name": "CSE 108", "grade": 100}
    class_name = data["class_name"]
    grade = data.get("grade", 100)  

    if action == "add":
        
        if any(cls["class_name"] == class_name for cls in current_user.classes):
            return jsonify({"error": "Already registered for this class"}), 400
        
        if offered_classes_status[class_name] == False:
            return jsonify({"error": "class is full"}), 400
      
        current_user.classes.append({"class_name": class_name, "grade": grade})
        current_user.class_time[class_name] = offered_classes_times[class_name]
        current_user.class_professor[class_name] = offered_classes_professors[class_name]
        
        offered_classes_enrollment[class_name] += 1
        current_user.class_status[class_name] = (
            f"{offered_classes_enrollment[class_name]}/{offered_classes_capacity[class_name]}"
        )

       
        if offered_classes_enrollment[class_name] == offered_classes_capacity[class_name]:
            offered_classes_status[class_name] = False

        db.session.merge(current_user)
        db.session.commit()

        return jsonify({
            "classes": current_user.classes,
            "class_professor": current_user.class_professor,
            "class_time": current_user.class_time,
            "class_status": current_user.class_status,
        })

    elif action == "drop":
        current_user.classes = [cls for cls in current_user.classes if cls["class_name"] != class_name]
        del current_user.class_time[class_name]
        del current_user.class_professor[class_name]
        del current_user.class_status[class_name]
        offered_classes_enrollment[class_name] -= 1

        if offered_classes_enrollment[class_name] != offered_classes_capacity[class_name]:
            offered_classes_status[class_name] = True

        db.session.merge(current_user)
        db.session.commit()

        return jsonify({
            "classes": current_user.classes,
            "class_professor": current_user.class_professor,
            "class_time": current_user.class_time,
            "class_status": current_user.class_status,
        })

# # # dont uncomment this!!
# @app.route("/add_class_to_teacher")
# def add_class_to_teacher():
#     teacher = Users.query.filter_by(username="Juan Meza").first()
    
#     if teacher and "Math 131" not in teacher.classes:
#         teacher.classes.append("Math 131")
#         db.session.commit()  # Save the changes
#         return "Class added successfully!"
    
#     return "Class already exists or user not found."




@app.route("/user_table")
def userTable():
    return render_template("classes.html")

@app.route("/enrollment/<string:class_name>")
def enrollmentUpdate(class_name):
    class_enrollment = offered_classes_enrollment[class_name]
    class_enrollment_string = ""
    if class_enrollment == offered_classes_capacity[class_name]:
        class_enrollment_string = "FULL"
    else:
        class_enrollment_string = str(class_enrollment) + "/" + str(offered_classes_capacity[class_name])
    class_id_format = class_name.strip().replace(" ", "-") # e.g. CSE 108 -> CSE-108
    return jsonify(
        {
            "class_enrollment": class_enrollment_string,
            "class_id_format": class_id_format
        }
    )
    
@app.route("/updateCourses", methods=["GET"])
def updateCourses():
    formatted_classes = []
    class_enrollment = {}
    for cls in offered_classes:
        format = cls.strip().replace(" ", "-")
        formatted_classes.append(format)
        class_enrollment[format] = f"{offered_classes_enrollment[cls]}/{offered_classes_capacity[cls]}"

    return jsonify({
            "classes": formatted_classes,
            "enrollment": class_enrollment
        })

@app.route("/class_details/<string:class_name>")
def class_details(class_name):
    students = []
    for user in Users.query.all():
        print(user.username)
        
        # Check if the class name is in the user's classes list
        if isinstance(user.classes, list) and class_name in user.classes and not user.teacher:
            print("Hello", class_name)
            print(user.username)
            print("===================")

            # Since grade data is not stored in user.classes, use a default or add a separate mechanism to track it
            grade = "N/A"  # Or get grade from another source if available
            students.append({
                "name": user.username,
                "grade": grade
            })
        else:
            print(f"Unexpected structure for user.classes: {user.classes}")
    
    return render_template("class_details.html", class_name=class_name, students=students)



if __name__ == "__main__":
    app.run(debug=True)
