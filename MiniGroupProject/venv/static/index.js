// Shows the table regarding the user's classes by default when the page is loaded
document.addEventListener("DOMContentLoaded", () => {
    // Load the saved table on page load (new)
    loadTableFromLocalStorage();

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

function addClass(content) {
    let class_name = content.getAttribute('course-name')
    
    return updateClasses(class_name, 'add')
}

function dropClass(content) {
    let class_name = content.getAttribute('course-name')
    return updateClasses(class_name, 'drop')
}

function updateClasses(class_name, method){
    const table = document.getElementById("user_classes");

    if(method === "add") {
        fetch("http://127.0.0.1:5000/updateClasses/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(class_name),
        })
        .then(res => res.json())
        .then(data => {
            console.log(data)
            // console.log(data.classes.length)

            // Reset the table inside here so we only clear the table when we receive data
                // prevents clearing the data if an error was to occur (having it before the fetch call clears it right away)
            table.innerHTML = `
                                <tr>
                                    <th>Course Name</th>
                                    <th>Teacher</th>
                                    <th>Time</th>
                                    <th>Students Enrolled</th>
                                </tr>
                            `;

            for(let i=0; i<data.classes.length; i++) {
                let current_class = data.classes[i]
                table.insertAdjacentHTML("beforeend", `
                    <tr> 
                        <td> ${data.classes[i]} </td> 
                        <td> ${data.class_professor[current_class]} </td> 
                        <td> ${data.class_time[current_class]} </td> 
                        <td> ${data.class_status[current_class]} </td> 
                    </tr>
                `);
            }

            // Automatically save the updated table
            saveTableToLocalStorage();

            // Reload the page to re-render the correct image
            location.reload();
        })
        .catch(error => {
            console.error(error);
        })
    }
    else if(method === "drop") {
        fetch("http://127.0.0.1:5000/updateClasses/drop", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(class_name),
        })
        .then(res => res.json())
        .then(data => {
            console.log(data)

            // Reset the table inside here so we only clear the table when we receive data
                // prevents clearing the data if an error was to occur (having it before the fetch call clears it right away)
                table.innerHTML = `
                <tr>
                    <th>Course Name</th>
                    <th>Teacher</th>
                    <th>Time</th>
                    <th>Students Enrolled</th>
                </tr>
            `;

            for(let i=0; i<data.classes.length; i++) {
                let current_class = data.classes[i]
                table.insertAdjacentHTML("beforeend", `
                    <tr> 
                        <td> ${data.classes[i]} </td> 
                        <td> ${data.class_professor[current_class]} </td> 
                        <td> ${data.class_time[current_class]} </td> 
                        <td> ${data.class_status[current_class]} </td> 
                    </tr>
                `);
            }

            // Automatically save the updated table
            saveTableToLocalStorage();

            // Reload the page to re-render the correct image
            location.reload();
        })
        .catch(error => {
            console.error(error);
        })
    }
} 