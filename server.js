const http = require('http');
const url = require('url');
const fs = require('fs');
const qs = require('querystring');

const employeeController = require('./controllers/employeeController');

const server = http.createServer(function (req, res) {

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    if (req.method === 'GET') {
        if (pathname === '/employees') {
            employeeController.listEmployees(req, res);
        } else if (pathname.startsWith('/employees/view')) {
            const employeeId = parsedUrl.query.empId;
            employeeController.viewEmployee(req, res, employeeId);
        } else if (pathname === '/employees/add') {
            fs.readFile('./views/addEmployee.html', (err, data) => {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.write(data);
                res.end();
            });
        } else if (pathname === '/employees/edit' && parsedUrl.query.empId) {
            employeeController.editEmployee(req, res, parsedUrl.query.empId);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>Page Not Found</h1>');
        }
    } else if (req.method === 'POST') {
        if (pathname === '/employees/add') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                const formData = qs.parse(body);      
                employeeController.addEmployee(req, res, formData);
            });
        } else if (pathname === '/employees/update') {

            let body = '';

            req.on('data', chunk => {
                body += chunk.toString(); // Convert Buffer to string
            });

            req.on('end', () => {
                const formData = qs.parse(body);
                employeeController.updateEmployee(req, res, formData);
            });
        }
    }


});

server.listen(3000, function () {
    console.log('Server running on port 3000');
});
