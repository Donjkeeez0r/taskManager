const fs = require('node:fs/promises');
const path = require('node:path');

const FILE_PATH = path.join(__dirname, process.env.FILENAME || 'tasks.json');

const getTasks = async () => {
    try {
        // читаем файл 
        const data = await fs.readFile(FILE_PATH, 'utf-8');

        // превращаем строку в массив объектов
        return JSON.parse(data);
    } catch (error) {
        // если файла нет при 1 запуске
        if (error.code === 'ENOENT') {
            return []
        }

        console.log('Критическая ошибка: ', error.message);
        process.exit(1);
    }
};

const saveTasks = async (tasks) => {
    const str = JSON.stringify(tasks, null, 2);
    await fs.writeFile(FILE_PATH, str);
};

// экспорт функций
module.exports = {
    getTasks,
    saveTasks
};