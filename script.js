// Authentication Logic
const users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname.split('/').pop();
    
    if (path === 'login.html') {
        document.getElementById('loginForm').addEventListener('submit', login);
    } else if (path === 'signin.html') {
        document.getElementById('signinForm').addEventListener('submit', signin);
    } else if (path === 'index.html') {
        if (!localStorage.getItem('currentUser')) {
            window.location.href = 'login.html';
            return;
        }
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
        initializeTaskManager();
    }
});

function signin(e) {
    e.preventDefault();
    const username = document.getElementById('signinUsername').value;
    const password = document.getElementById('signinPassword').value;

    if (users.some(u => u.username === username)) {
        alert('Username already exists!');
        return;
    }

    users.push({ username, password, tasks: [] });
    localStorage.setItem('users', JSON.stringify(users));
    alert('Signed in successfully! Please login.');
    window.location.href = 'login.html';
}

function login(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        alert('Invalid credentials!');
        return;
    }

    localStorage.setItem('currentUser', JSON.stringify(user));
    window.location.href = 'index.html';
}

// Task Manager Logic
function initializeTaskManager() {
    loadTasks();

    // Event Listeners
    document.getElementById('addTaskBtn').addEventListener('click', addTask);
    document.getElementById('taskInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    document.getElementById('allTasksBtn').addEventListener('click', () => filterTasks('all'));
    document.getElementById('completedTasksBtn').addEventListener('click', () => filterTasks('completed'));
    document.getElementById('incompleteTasksBtn').addEventListener('click', () => filterTasks('incomplete'));
    document.getElementById('deletedTasksBtn').addEventListener('click', () => filterTasks('deleted'));
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

function addTask() {
    const taskInput = document.getElementById('taskInput');
    const deadlineInput = document.getElementById('deadlineInput');
    const taskText = taskInput.value.trim();
    const deadline = deadlineInput.value;

    if (taskText === '') {
        alert('Please enter a task!');
        return;
    }
    if (deadline === '') {
        alert('Please set a deadline with date and time!');
        return;
    }

    const description = prompt('Add a description (optional):') || '';

    const task = {
        id: Date.now(),
        text: taskText,
        deadline,
        description: description.trim(),
        completed: false,
        deleted: false
    };

    renderTask(task);
    saveTask(task);
    taskInput.value = '';
    deadlineInput.value = '';
}

function renderTask(task) {
    const taskList = document.getElementById('taskList');
    const li = document.createElement('li');
    li.className = 'task-item';
    if (task.completed) li.classList.add('completed');
    if (task.deleted) li.classList.add('deleted');
    li.dataset.id = task.id;

    li.innerHTML = `
        <div>
            <span class="task-text">${task.text}</span>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
        </div>
        <span class="task-deadline">Due: ${new Date(task.deadline).toLocaleString()}</span>
        <div class="task-actions">
            <button class="complete-btn" onclick="toggleComplete(${task.id})">
                ${task.completed ? 'Undo' : 'Complete'}
            </button>
            <button class="edit-btn" onclick="editTask(${task.id})">Edit</button>
            <button class="delete-btn" onclick="deleteTask(${task.id})">
                ${task.deleted ? 'Restore' : 'Delete'}
            </button>
        </div>
    `;

    taskList.appendChild(li);
}

function saveTask(task) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    user.tasks.push(task);
    localStorage.setItem('currentUser', JSON.stringify(user));
    updateUsersStorage(user);
}

function loadTasks() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    user.tasks.forEach(task => renderTask(task));
}

function updateUsersStorage(updatedUser) {
    const allUsers = JSON.parse(localStorage.getItem('users'));
    const userIndex = allUsers.findIndex(u => u.username === updatedUser.username);
    allUsers[userIndex] = updatedUser;
    localStorage.setItem('users', JSON.stringify(allUsers));
}

function toggleComplete(id) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    user.tasks = user.tasks.map(task => {
        if (task.id === id && !task.deleted) {
            task.completed = !task.completed;
        }
        return task;
    });
    localStorage.setItem('currentUser', JSON.stringify(user));
    updateUsersStorage(user);
    refreshTaskList();
}

function editTask(id) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const task = user.tasks.find(t => t.id === id);
    if (!task || task.deleted) return;

    const newText = prompt('Edit your task:', task.text);
    const newDeadline = prompt('Edit deadline (YYYY-MM-DDTHH:MM, e.g., 2025-03-23T14:30):', task.deadline);
    const newDescription = prompt('Edit description (optional):', task.description) || '';

    if (newText && newText.trim() && newDeadline) {
        user.tasks.forEach(t => {
            if (t.id === id) {
                t.text = newText.trim();
                t.deadline = newDeadline;
                t.description = newDescription.trim();
            }
        });
        localStorage.setItem('currentUser', JSON.stringify(user));
        updateUsersStorage(user);
        refreshTaskList();
    }
}

function deleteTask(id) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    user.tasks = user.tasks.map(task => {
        if (task.id === id) {
            task.deleted = !task.deleted;
        }
        return task;
    });
    localStorage.setItem('currentUser', JSON.stringify(user));
    updateUsersStorage(user);
    refreshTaskList();
}

function filterTasks(filter) {
    const buttons = document.querySelectorAll('.menu-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${filter}TasksBtn`).classList.add('active');

    refreshTaskList(filter);
}

function refreshTaskList(filter = 'all') {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
    const user = JSON.parse(localStorage.getItem('currentUser'));
    let filteredTasks = user.tasks;

    if (filter === 'completed') {
        filteredTasks = user.tasks.filter(t => t.completed && !t.deleted);
    } else if (filter === 'incomplete') {
        filteredTasks = user.tasks.filter(t => !t.completed && !t.deleted);
    } else if (filter === 'deleted') {
        filteredTasks = user.tasks.filter(t => t.deleted);
    }

    filteredTasks.forEach(task => renderTask(task));
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}