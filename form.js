const http = require('http');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const PORT = 3000;
const FILE_PATH = 'data.txt'; // Change the file name to data.txt

const parseData = (data) => {
    return data.split('\n').filter(line => line.trim()).map(line => {
        const [name, email, department, salary] = line.split(',');
        return { name, email, department, salary };
    });
};

const formatData = (jsonData) => {
    return jsonData.map(item => `${item.name},${item.email},${item.department},${item.salary}`).join('\n');
};

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        fs.createReadStream(path.join(__dirname, 'index.html')).pipe(res);
    } else if (req.method === 'GET' && req.url === '/data') {
        fs.readFile(FILE_PATH, 'utf8', (err, data) => {
            if (err && err.code !== 'ENOENT') {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                return res.end('Error reading data file');
            }
            let jsonData = [];
            if (!err && data) {
                jsonData = parseData(data);
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(`
                <html>
                <head>
                    <link rel="stylesheet" type="text/css" href="/styles.css">
                </head>
                <body>
                    <h1>Stored Data</h1>
                    <table border="1">
                        <tr><th>Name</th><th>Email</th><th>Department</th><th>Salary</th><th>Update</th><th>Delete</th></tr>
            `);
            jsonData.forEach((item, index) => {
                res.write(`<tr><td>${item.name}</td><td>${item.email}</td><td>${item.department}</td><td>${item.salary}</td>
                    <td><a href="/update?id=${index}">Update</a></td>
                    <td><a href="/delete?id=${index}">Delete</a></td></tr>`);
            });
            res.write('</table><br><a href="/" style="display: block; text-align: center; font-size: 20px; padding: 10px 20px; border: 2px solid #333; width: fit-content; margin: 20px auto; text-decoration: none; color: #4CAF50; background-color: #fff; border-radius: 5px;">Back to Form</a></body></html>');
            res.end();
        });
    } else if (req.method === 'POST' && req.url.startsWith('/submit')) {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const formData = querystring.parse(body);
            fs.readFile(FILE_PATH, 'utf8', (err, data) => {
                if (err && err.code !== 'ENOENT') {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    return res.end('Error reading data file');
                }
                let jsonData = [];
                if (!err && data) {
                    jsonData = parseData(data);
                }
                if (req.url === '/submit') {
                    jsonData.push(formData);
                } else if (req.url.startsWith('/submit-update')) {
                    const id = querystring.parse(req.url.split('?')[1]).id;
                    jsonData[Number(id)] = formData;
                }
                fs.writeFile(FILE_PATH, formatData(jsonData), 'utf8', (err) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        return res.end('Error writing data file');
                    }
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.write('<html><head><style></style><link rel="stylesheet" type="text/css" href="/styles.css"></head><body><h1>Form data saved successfully</h1><a href="/">Back to Form</a></body></html>');
                    res.end();
                });
            });
        });
    } else if (req.method === 'GET' && req.url.startsWith('/update')) {
        const id = querystring.parse(req.url.split('?')[1]).id;
        fs.readFile(FILE_PATH, 'utf8', (err, data) => {
            if (err && err.code !== 'ENOENT') {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                return res.end('Error reading data file');
            }
            let jsonData = [];
            if (!err && data) {
                jsonData = parseData(data);
            }
            const item = jsonData[Number(id)];
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(`
                <html>
                <head>
                    <link rel="stylesheet" type="text/css" href="/styles.css">
                </head>
                <body>
                    <h1>Update Form</h1>
                    <form action="/submit-update?id=${id}" method="POST">
                        <label for="name">Name:</label>
                        <input type="text" id="name" name="name" value="${item.name}" required>
                        <br><br>
                        <label for="email">Email:</label>
                        <input type="email" id="email" name="email" value="${item.email}" required>
                        <br><br>
                        <label for="department">Department:</label>
                        <input type="text" id="department" name="department" value="${item.department}" required>
                        <br><br>
                        <label for="salary">Salary:</label>
                        <input type="number" id="salary" name="salary" value="${item.salary}" required>
                        <br><br>
                        <button type="submit">Update</button>
                    </form>
                </body>
                </html>
            `);
            res.end();
        });
    } else if (req.method === 'GET' && req.url.startsWith('/delete')) {
        const id = querystring.parse(req.url.split('?')[1]).id;
        fs.readFile(FILE_PATH, 'utf8', (err, data) => {
            if (err && err.code !== 'ENOENT') {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                return res.end('Error reading data file');
            }
            let jsonData = [];
            if (!err) {
                jsonData = parseData(data);
            }
            jsonData.splice(Number(id), 1);
            fs.writeFile(FILE_PATH, formatData(jsonData), 'utf8', (err) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    return res.end('Error writing data file');
                }
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.write('<html><head><link rel="stylesheet" type="text/css" href="/styles.css"></head><body><h1>Data deleted successfully</h1><a href="/">Back to Form</a></body></html>');
                res.end();
            });
        });
    } else if (req.method === 'GET' && req.url === '/styles.css') {
        res.writeHead(200, { 'Content-Type': 'text/css' });
        fs.createReadStream(path.join(__dirname, 'styles.css')).pipe(res);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
