// Shows the table regarding the user's classes by default when the page is loaded
document.addEventListener("DOMContentLoaded", () => {
    // Load the saved table on page load (new)
    loadTableFromLocalStorage();
    loadCoursesTableFromLocalStorage();
    tableStartUp();

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

async function class_enrollment(class_name) {
    try {
        const response = await fetch(`/enrollment/${class_name}`);
        if (!response.ok) {
            throw new Error(`Network error: ${response.statusText}`);
        }

        const data = await response.json();

        // Update the capacity cell
        const capacityCell = document.getElementById(`capacity-${data.class_id_format}`);
        if (capacityCell) {
            capacityCell.textContent = data.class_enrollment;
            console.log(`Updated ${data.class_id_format} capacity to ${data.class_enrollment}`); // Debug log

            // Save the updated table to localStorage
            saveCoursesTableToLocalStorage();
        } else {
            console.warn(`Capacity cell not found for ${data.class_id_format}`);
        }
    } catch (error) {
        console.error(`Error updating enrollment for ${class_name}:`, error);
    }
}

// async function updateClasses(data, method) {
//     const table = document.getElementById("user_classes");

//     const url = method === "add" ? "/updateClasses/add" : "/updateClasses/drop";

//     // try {
//     //     const response = await fetch(`http://127.0.0.1:5000${url}`, {
//     //         method: "POST",
//     //         headers: {
//     //             "Content-Type": "application/json"
//     //         },
//     //         body: JSON.stringify(data_input),
//     //     })

//     //     if (!response.ok) {
//     //         throw new Error(`Failed to update classes: ${response.statusText}`);
//     //     }

//     //     const data = await response.json();
//     //     console.log(data);

//     //     // Reset and rebuild the user_classes table
//     //     table.innerHTML = `
//     //         <tr>
//     //             <th>Course Name</th>
//     //             <th>Teacher</th>
//     //             <th>Time</th>
//     //             <th>Students Enrolled</th>
//     //         </tr>
//     //     `;

//     //     for (let cls of data.classes) {
//     //         let current_class = cls.class_name;
//     //         table.insertAdjacentHTML("beforeend", `
//     //             <tr> 
//     //                 <td> ${cls.class_name} </td> 
//     //                 <td> ${data.class_professor[current_class]} </td> 
//     //                 <td> ${data.class_time[current_class]} </td> 
//     //                 <td> ${data.class_status[current_class]} </td> 
//     //             </tr>
//     //         `);
//     //     }

//     //     // Update courses_table enrollment dynamically
//     //     await class_enrollment(data.class_name);
//     //     saveTableToLocalStorage();
//     //     // location.reload();

//     // } catch (error) {
//     //     console.error(`Error updating classes for ${data.class_name}:`, error);
//     // }

//     fetch(`http://127.0.0.1:5000${url}`, {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json"
//         },
//         body: JSON.stringify(data),
//     })
//     .then(res => res.json())
//     .then(data => {
//         console.log(data);

//         table.innerHTML = `
//             <tr>
//                 <th>Course Name</th>
//                 <th>Teacher</th>
//                 <th>Time</th>
//                 <th>Students Enrolled</th>
//             </tr>
//         `;

//         for (let cls of data.classes) {
//             let current_class = cls.class_name;
//             table.insertAdjacentHTML("beforeend", `
//                 <tr> 
//                     <td> ${cls.class_name} </td> 
//                     <td> ${data.class_professor[current_class]} </td> 
//                     <td> ${data.class_time[current_class]} </td> 
//                     <td> ${data.class_status[current_class]} </td> 
//                 </tr>
//             `);
//         }

//         // Update courses_table enrollment dynamically
//         // await class_enrollment(data.class_name);
//         saveTableToLocalStorage();
//         location.reload();
//     })
//     .catch(error => {
//         console.error(error);
//     });
// }

function tableStartUp() {
    const table = document.getElementById("user_classes");

    try {
        fetch("http://127.0.0.1:5000/updateClasses/start")
            .then(res => res.json())
            .then(data => {
                console.log(data)
                // Reset and rebuild the user_classes table
                table.innerHTML = `
                <tr>
                    <th>Course Name</th>
                    <th>Teacher</th>
                    <th>Time</th>
                    <th>Students Enrolled</th>
                </tr>
                `;

                for (let cls of data.classes) {
                    const current_class = cls.class_name;
                    table.insertAdjacentHTML("beforeend", `
                        <tr>
                            <td>${cls.class_name}</td>
                            <td>${data.class_professor[current_class]}</td>
                            <td>${data.class_time[current_class]}</td>
                            <td>${data.class_status[current_class]}</td>
                        </tr>
                    `);
                }
            })

    } catch (error) {
        console.error(error);
    }

    try {
        fetch("http://127.0.0.1:5000/updateCourses")
            .then(res => res.json())
            .then(data => {
                console.log(data)
                
                for(let cls of data.classes) {
                    // console.log(`capacity-${cls}`)
                    // console.log(`capacity-${cls} = ${data.enrollment[cls]}`)
                    const capacityCell = document.getElementById(`capacity-${cls}`);

                    if(data.enrollment[cls] === "10/10") {
                        capacityCell.innerText = "FULL";
                    }
                    else {
                        capacityCell.innerText = `${data.enrollment[cls]}`;
                    }
                    // capacityCell.innerText = `${currentEnrollment}/${totalCapacity}`;
                }
            })

    } catch (error) {
        console.error(error);
    }
}

async function updateClasses(class_data, method) {
    const table = document.getElementById("user_classes");

    try {
        const url = `http://127.0.0.1:5000/updateClasses/${method}`;
        console.log("Sending data to:", url, "with payload:", class_data);
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(class_data),
        });

        if (!response.ok) {
            throw new Error(`Failed to update classes: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Response from server:", data)
        // console.log(data);

        // Reset and rebuild the user_classes table
        table.innerHTML = `
            <tr>
                <th>Course Name</th>
                <th>Teacher</th>
                <th>Time</th>
                <th>Students Enrolled</th>
            </tr>
        `;

        for (let cls of data.classes) {
            const current_class = cls.class_name;
            table.insertAdjacentHTML("beforeend", `
                <tr>
                    <td>${cls.class_name}</td>
                    <td>${data.class_professor[current_class]}</td>
                    <td>${data.class_time[current_class]}</td>
                    <td>${data.class_status[current_class]}</td>
                </tr>
            `);
        }

        // Update courses_table enrollment dynamically
        await class_enrollment(class_data.class_name);

        // Save updated tables to localStorage
        saveTableToLocalStorage();

        // Optionally reload the page to reflect changes
        // location.reload();
    } catch (error) {
        console.error(`Error updating classes for ${class_data.class_name}:`, error);
    }
}

function editGrade(studentName) {
    var gradeDisplay = document.getElementById('grade-display-' + studentName);
    var gradeInput = document.getElementById('grade-input-' + studentName);
    
    gradeDisplay.style.display = 'none';
    gradeInput.style.display = 'inline-block';
    gradeInput.focus();
}

function saveGrade(studentName) {
    var gradeInput = document.getElementById('grade-input-' + studentName);
    var newGrade = gradeInput.value.trim();
    
    // check if grade is b/t 0 and 100
    newGrade = parseFloat(newGrade);
    if (isNaN(newGrade) || newGrade < 0 || newGrade > 100) {
    console.error("Invalid grade input. Please enter a number between 0 and 100.");
    return;
}
    
    // Get class_name from URL
    var className = window.location.pathname.split('/')[2]; 

    fetch(`/update_grade/${className}/${studentName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            new_grade: parseFloat(newGrade)
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log(data.message); 
            document.getElementById('grade-display-' + studentName).innerText = newGrade;
            document.getElementById('grade-display-' + studentName).style.display = 'inline-block';
            gradeInput.style.display = 'none';
        } else {
            console.error(data.message); 
        }
    })
    .catch(error => {
        console.error("An error occurred while updating the grade:", error);
    });
}
