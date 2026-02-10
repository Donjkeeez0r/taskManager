const { getTasks, saveTasks } = require('./storage'); 

// создание экземпляра эмиттера (станция)
const EventEmitter = require('node:events');
const taskEmitter = new EventEmitter();

// слушатель
taskEmitter.on('taskCreated', (task) => {
    console.log(`[Уведомление]: Создана новая задача - ${task.title}!`);
});

taskEmitter.on('taskDeleted', (task) => {
    console.log(`[Уведомление]: 
        Удалена задача с ID: ${task.id}, 
        Заголовок задачи: ${task.title}!`);
});

const addTask = async (title, description) => {
    // массив актуальных задач
    const tasks = await getTasks();

    // объект новой задачи
    const newTask = {
        id: Date.now(),
        title: title,
        description: description,
        isDone: false,
    };

    tasks.push(newTask);

    // вызов события
    taskEmitter.emit('taskCreated', newTask);

    // записываем массив tasks обратно в файл
    await saveTasks(tasks);
};

const listTask = async () => {
    // получаем массив задач
    const tasks = await getTasks();

    if (tasks.length === 0) {
        console.log('Список задач пуст!');
    } 
    else {
        for (const task of tasks) {
            console.log(`ID задачи: ${task.id}, Заголовок: ${task.title}, Статус: ${task.isDone}`);
        }
    }
};

const completeTask = async (taskId) => {
    // получаем массив задач
    const tasks = await getTasks();
    const task = tasks.find(t => t.id === taskId);

    if (task) {
        task.isDone = true;
        await saveTasks(tasks);
    } 
    else {
        console.log('Задача с таким ID не найдена!');
    }
};

const deleteTask = async (taskID) => {
    const tasks = await getTasks();

    const deletedTask = tasks.find(t => t.id === taskID);

    if (!deletedTask) {
        console.log('Задача с таким ID не найдена!');
        return;
    }

    const filteredTasks = tasks.filter(t => t.id !== taskID);
    
    taskEmitter.emit('taskDeleted', deletedTask);
    
    await saveTasks(filteredTasks);
}

const main = async () => {
    try {
        const action = process.argv[2];
        const param1 = process.argv[3];
        const param2 = process.argv[4];

        if (action === 'add') {
            await addTask(param1, param2);
            console.log('Задача добавлена!');
        } 
        else if (action === 'list') {
            await listTask();
        } 
        else if (action === 'done') {
            await completeTask(Number(param1));
            console.log('Задача выполнена!');
        } 
        else if (action === 'delete') {
            await deleteTask(Number(param1));
            console.log('Задача удалена из списка!');
        } 
        else {
            console.log('Неизвестная команда. Доступны: add, list, done, delete!');
        }
    } catch (error) {
        console.log('Произошла ошибка в работе приложения!');
        console.error(`Детали: ${error.message}`);
        process.exit(1);
    }
};

main();