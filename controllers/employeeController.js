const db = require('../db');

// Generate a random Employee ID (EMP_XXXX)
const generateEmpId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let id = 'EMP_';
    for (let i = 0; i < 4; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
};

// List all Employees
function listEmployees(req, res) {
    db.all(`SELECT * FROM Employee`, [], (err, rows) => {
        if (err) {
            return console.error(err.message);
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write('<!DOCTYPE html>')
        res.write('<html>');
        res.write('<head>');
        res.write(
            `<style> 
            
            body{
                background-color:yellow;
            }

            a{
                text-decoration:none;
            }
            
            </style>`)
        res.write('</head>');
        res.write('<body>');
        res.write('<h1 style="color:red;">Employees</h1>');
        res.write('<a href="/employees/add">Add Employee</a>');
        res.write('<table border="1">');
        res.write('<tr><th>EMP ID</th><th>First Name</th><th>Last Name</th><th>DOB</th></tr>');
        rows.forEach((row) => {
            res.write(`<tr> 
                <td>${row.id}</td>  
                <td> ${row.firstname}</td> 
                <td> ${row.lastname}</td> 
                <td>${row.dob}</td> 
                <td><a href="/employees/view?empId=${row.id}">view</a></td> 
                <td><a href="/employees/edit?empId=${row.id}">edit</a></td> 
                </tr>`);
        });
        res.write('</table>');
        res.write(
            `<script>
            document.addEventListener('DOMContentLoaded',function(){
            console.log('print message in browser console in List Employee');
                alert('Hi , testing Client javascript render in List Employee');
                })
            </script>`)
        res.write('</body>');
        res.write('</html>');
        res.end();
    });
}

// View a single employee with contact details
function viewEmployee(req, res, employeeId) {
    db.get(`SELECT * FROM Employee WHERE id = ?`, [employeeId], (err, row) => {
        if (err) {
            return console.error(err.message);
        }
        if (!row) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.write('<h1>Employee Not Found</h1>');
            return res.end();
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write("<a href='/employees'>back</a>");
        res.write(`<h1>${row.firstname} ${row.lastname}</h1><p>DOB: ${row.dob}</p>`);

        db.all(`SELECT * FROM EmployeeContact WHERE employeeId = ?`, [employeeId], (err, contacts) => {
            if (err) return console.error(err.message);
            res.write('<h2>Contact Details</h2>');
            contacts.forEach((contact) => {
                res.write(`<p>Phone Numbers: ${contact.phoneNumbers}</p><p>Addresses: ${contact.addresses}</p>`);
            });
            res.end();
        });
    });
}

function viewEmployeeWithJoin(req, res, employeeId) {
    const sql = `
        SELECT e.id, e.firstname, e.lastname, e.dob, 
               ec.phoneNumbers, ec.addresses 
        FROM Employee e
        LEFT JOIN EmployeeContact ec 
        ON e.id = ec.employeeId
        WHERE e.id = ?
    `;

    db.get(sql, [employeeId], (err, row) => {
        if (err) {
            return console.error(err.message);
        }
        if (!row) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.write('<h1>Employee Not Found</h1>');
            return res.end();
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(`<h1>${row.firstname} ${row.lastname}</h1>`);
        res.write(`<p>DOB: ${row.dob}</p>`);
        res.write(`<h2>Contact Details</h2>`);
        res.write(`<p>Phone Numbers: ${row.phoneNumbers ? row.phoneNumbers : 'N/A'}</p>`);
        res.write(`<p>Addresses: ${row.addresses ? row.addresses : 'N/A'}</p>`);
        res.end();
    });
}

// Add new employee
function addEmployee(req, res, formData) {
    const empId = generateEmpId();
    const { firstname, lastname, dob, phoneNumbers, addresses } = formData;

    db.run(
        `INSERT INTO Employee (id, firstname, lastname, dob) VALUES (?, ?, ?, ?)`,
        [empId, firstname, lastname, dob],
        function (err) {
            if (err) return console.error(err.message);

            const phones = JSON.stringify(phoneNumbers.split(','));
            const addressList = JSON.stringify(addresses.split(','));

            db.run(
                `INSERT INTO EmployeeContact (employeeId, phoneNumbers, addresses) VALUES (?, ?, ?)`,
                [empId, phones, addressList],
                function (err) {
                    if (err) return console.error(err.message);
                    res.writeHead(302, { Location: '/employees' });
                    res.end();
                }
            );
        }
    );
}

// Delete employee
function deleteEmployee(req, res, employeeId) {
    db.run(`DELETE FROM Employee WHERE id = ?`, [employeeId], function (err) {
        if (err) return console.error(err.message);
        res.writeHead(302, { Location: '/employees' });
        res.end();
    });
}

function editEmployee(req, res, employeeId) {
    const sql = `SELECT e.id, e.firstname, e.lastname, e.dob FROM Employee e WHERE e.id = ?`;

    db.get(sql, [employeeId], (err, row) => {
        if (err) {
            return console.error(err.message);
        }
        if (!row) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>Employee Not Found</h1>');
            return;
        }

        // Dynamically generate the Edit Employee HTML form
        let html = `
            <html>
            <head>
                <title>Edit Employee</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    label { display: inline-block; width: 100px; margin-bottom: 10px; }
                    input { padding: 5px; margin-bottom: 10px; }
                </style>
            </head>
            <body>
                <h1>Edit Employee</h1>
                <form action="/employees/update" method="POST">
                    <input type="hidden" name="id" value="${row.id}">
                    <label>First Name:</label>
                    <input type="text" name="firstname" value="${row.firstname}">
                    <br>
                    <label>Last Name:</label>
                    <input type="text" name="lastname" value="${row.lastname}">
                    <br>
                    <label>Date of Birth:</label>
                    <input type="date" name="dob" value="${row.dob}">
                    <br>
                    <button type="submit">Update</button>
                </form>
                <a href="/employees">Back to List</a>
            </body>
            </html>
        `;

        // Send the dynamically generated HTML response
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    });
}

function updateEmployee(req, res, formData) {
    const id = formData.id;
    const firstname = formData.firstname;
    const lastname = formData.lastname;
    const dob = formData.dob;

    const sql = `UPDATE Employee 
    SET firstname = ?, lastname = ?, dob = ? 
    WHERE id = ?`;

    db.run(sql, [firstname, lastname, dob, id], function (err) {
        if (err) {
            return console.error(err.message);
        }
        // After updating, redirect back to the employee list
        res.writeHead(302, { 'Location': '/employees' });
        res.end();
    });
}




module.exports = {
    listEmployees,
    viewEmployee,
    viewEmployeeWithJoin,
    addEmployee,
    editEmployee,
    updateEmployee,
    deleteEmployee
};
