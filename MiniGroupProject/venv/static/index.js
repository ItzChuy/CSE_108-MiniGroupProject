// Shows the table regarding the user's classes by default when the page is loaded
document.addEventListener("DOMContentLoaded", () => {
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
    // table.innerHTML = `
    //                     <tr>
    //                         <th> Course Name </th>
    //                         <th> Teacher </th>
    //                         <th> Time </th>
    //                         <th> Students Enrolled </th>
    //                     </tr>
    //                 `;

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

            // Reload the page to re-render the correct image
            // location.reload();
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

            // Reload the page to re-render the correct image
            // location.reload();
        })
        .catch(error => {
            console.error(error);
        })
    }
} 