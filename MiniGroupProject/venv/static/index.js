// Shows the table regarding the user's classes by default when the page is loaded
document.addEventListener("DOMContentLoaded", () => {
    // Load the saved table on page load (new)
    loadTableFromLocalStorage();
    loadCoursesTableFromLocalStorage();

    // shows the user_classes table by default
    showTable('user_classes');
});

function showTable(tableId) {
    // Get all tables with the class 'tables'
    const tables = document.querySelectorAll('.tables');
    
    // If no tables are found, exit the function early
    if (!tables.length) return;

    // Hide all tables
    tables.forEach(table => table.style.display = 'none');

    // Show the selected table, if it exists
    const selectedTable = document.getElementById(tableId);
    if (selectedTable) {
        selectedTable.style.display = 'block';
    }
}

// Save the current table to localStorage
function saveTableToLocalStorage() {
    // Clear the previous saved data from localStorage
    localStorage.removeItem("userClassesTable");

    const table = document.getElementById("user_classes");
    const rows = table.querySelectorAll("tr"); // Get all rows
    const tableData = [];

    rows.forEach(row => {
        const cells = row.querySelectorAll("th, td"); // Include headers and data cells
        const rowData = Array.from(cells).map(cell => cell.textContent.trim()); // Extract text content
        tableData.push(rowData); // Add the row data
    });

    // Save the table data as JSON in localStorage
    localStorage.setItem("userClassesTable", JSON.stringify(tableData));
}

// Load the table from localStorage
function loadTableFromLocalStorage() {
    const tableData = JSON.parse(localStorage.getItem("userClassesTable")); // Parse saved data

    // if a saved table called "userClassesTable" is not found
    if (!tableData) {
        console.log("No saved table data found.");
        return;
    }

    const table = document.getElementById("user_classes");
    table.innerHTML = ""; // Clear the current table

    tableData.forEach((rowData, rowIndex) => {
        const row = document.createElement("tr");

        rowData.forEach(cellData => {
            const cell = document.createElement(rowIndex === 0 ? "th" : "td"); // Headers for the first row
            cell.textContent = cellData; // Set the cell content
            row.appendChild(cell); // Append the cell to the row
        });

        table.appendChild(row); // Append the row to the table
    });
}

function saveCoursesTableToLocalStorage() {
    // Clear the previous saved data from localStorage
    localStorage.removeItem("coursesTable");

    const coursesTable = document.getElementById("courses_table");
    const coursesData = [];

    // Loop through each row and find `capacity-...` cells
    coursesTable.querySelectorAll("[id^='capacity-']").forEach(cell => {
        coursesData.push({
            id: cell.id, // Save the unique id (e.g., capacity-CSE-108)
            value: cell.textContent.trim() // Save the cell's text content
        });
    });

    // console.log("Saved Courses Data:", coursesData); // Debug log
    localStorage.setItem("coursesTable", JSON.stringify(coursesData));
}

// Load the courses_table specific <td> data from localStorage
function loadCoursesTableFromLocalStorage() {
    const coursesData = JSON.parse(localStorage.getItem("coursesTable"));

    if (!coursesData) {
        console.log("No saved courses table data found.");
        return;
    }

    console.log("Loaded Courses Data:", coursesData); // Debug log

    coursesData.forEach(item => {
        const cell = document.getElementById(item.id); // Find the cell by its unique id
        if (cell) {
            // console.log(`Updating cell ${item.id} with value ${item.value}`); // Debug log
            cell.textContent = item.value; // Update the cell's content
        }
    });
}

function addClass(content) {
    let class_name = content.getAttribute('course-name');
    let grade = 100;  // Default grade value

    return updateClasses({ class_name, grade }, 'add');
}

function dropClass(content) {
    let class_name = content.getAttribute('course-name');
    return updateClasses({ class_name }, 'drop');  // grade is not needed for dropping
}

function updateClasses(data, method) {
    const table = document.getElementById("user_classes");

    const url = method === "add" ? "/updateClasses/add" : "/updateClasses/drop";
    fetch(`http://127.0.0.1:5000${url}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
    })
    .then(res => res.json())
    .then(data => {
        console.log(data);

        table.innerHTML = `
            <tr>
                <th>Course Name</th>
                <th>Teacher</th>
                <th>Time</th>
                <th>Students Enrolled</th>
            </tr>
        `;

        for (let cls of data.classes) {
            let current_class = cls.class_name;
            table.insertAdjacentHTML("beforeend", `
                <tr> 
                    <td> ${cls.class_name} </td> 
                    <td> ${data.class_professor[current_class]} </td> 
                    <td> ${data.class_time[current_class]} </td> 
                    <td> ${data.class_status[current_class]} </td> 
                </tr>
            `);
        }

        saveTableToLocalStorage();
        location.reload();
    })
    .catch(error => {
        console.error(error);
    });
}
