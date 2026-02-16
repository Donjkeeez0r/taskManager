const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'tasks.json');
const ALLOWED_STATUSES = ['todo', 'in-progress', 'done'];


const getTasks = async () => {
    try {
        // читаем файл
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};


const saveTasks = async (tasks) => {
    try {
        // массив tasks записываем в файл и превращаем в JSON-строку
        await fs.writeFile(DATA_FILE, JSON.stringify(tasks, null, 2));
    } catch (err) {
        throw err;
    }
}

/*
JSON.stringify - упаковывает файл для записи (используем перед отправкой данных в файл)
JSON.parse() - распаковывает файл (получаем данные из файла или от пользователя)
*/

const server = http.createServer(async (request, response) => {
    // Главная страница
    if (request.method === 'GET' && request.url === '/') {
        try {
            const data = await fs.readFile(path.join(__dirname, 'public', 'index.html'));
            response.writeHead(200, { 'content-type': 'text/html' });
            response.end(data);
        } catch (err) {
            response.writeHead(500);
            response.end('Ошибка загрузки');
        }
    }

    // API: получение всех задач
    else if (request.method === 'GET' && request.url === '/tasks') {
        const data = await getTasks();
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify(data));
    }

    // API: создание новой задачи
    else if (request.method === 'POST' && request.url === '/tasks') {
        const chunks = [];

        request.on('data', (chunk) => {
            chunks.push(chunk);
        });

        request.on('end', async () => {
            const bufferString = Buffer.concat(chunks).toString();
            
            // парсим данные из запроса
            const newTask = JSON.parse(bufferString);

            const tasks = await getTasks();

            // модифицируем новую задачу
            newTask.id = Date.now();
            newTask.status = 'todo';
            newTask.createdAt = new Date();

            // добавляем новую задачу в массив
            tasks.unshift(newTask);

            // записываем все обратно в файл
            await saveTasks(tasks);

            // ответ что все успешно
            response.writeHead(201, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify(newTask));
        })
    }

    // API: обновление задачи
    else if (request.method === 'PUT' && request.url.startsWith('/tasks/')) {
        const idRaw = request.url.split('/')[2];
        const idTask = parseInt(idRaw);

        const chunks = [];
        request.on('data', (chunk) => {
            chunks.push(chunk);
        });

        request.on('end', async () => {
            const body = Buffer.concat(chunks).toString();
            const updatedData = JSON.parse(body);

            const tasks = await getTasks();
            const index = tasks.findIndex(t => t.id === idTask);

            if (index !== -1) {
                if (updatedData.text !== undefined && updatedData.text.trim() === '') {
                    response.writeHead(400);
                    return response.end('Текст задачи не должен быть пустым!');
                };

                if (updatedData.status && !ALLOWED_STATUSES.includes(updatedData.status)) {
                    response.writeHead(400);
                    return response.end('Недопустимый статус!');
                }

                tasks[index] = { ...tasks[index], ...updatedData };
                await saveTasks(tasks);
                response.writeHead(200, { 'content-type': 'text/plain'});
                response.end();
            } else {
                response.writeHead(404, { 'content-type': 'text/plain'});
                response.end('Ошибка');
            }
        })

    }

    // API: удаление задачи
    else if (request.method === 'DELETE' && request.url.startsWith('/tasks/')) {
        const idTask = parseInt(request.url.split('/')[2]);

        const tasks = await getTasks();

        const initialLenght = tasks.length;
        const filteredTasks = tasks.filter(t => t.id !== idTask);

        if (filteredTasks.length < initialLenght) {
            await saveTasks(filteredTasks);
            response.writeHead(200, { 'Content-Type': 'application/json'});
            response.end(JSON.stringify(filteredTasks));
        } else {
            response.writeHead(404, { 'content-type': 'application/json' });
            response.end('Задача не найдена!');
        }
    }
    else {
        response.statusCode = 404;
        response.end('Ничего не найдено!');
    }
});

server.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});