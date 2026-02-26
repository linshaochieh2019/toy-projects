const STORAGE_KEY = 'mini-task-board.tasks.v1';

const form = document.getElementById('task-form');
const titleInput = document.getElementById('title');
const dueDateInput = document.getElementById('dueDate');
const priorityInput = document.getElementById('priority');
const formError = document.getElementById('form-error');
const taskListEl = document.getElementById('task-list');
const emptyStateEl = document.getElementById('empty-state');
const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));

let filter = 'all';
let tasks = loadTasks();

render();

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = titleInput.value.trim();

  if (!title) {
    formError.textContent = 'Title is required.';
    return;
  }

  const newTask = {
    id: crypto.randomUUID(),
    title,
    dueDate: dueDateInput.value || null,
    priority: priorityInput.value || 'med',
    done: false,
    createdAt: Date.now(),
  };

  tasks.unshift(newTask);
  persistTasks();

  form.reset();
  priorityInput.value = 'med';
  formError.textContent = '';
  render();
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    filter = button.dataset.filter;
    filterButtons.forEach((btn) => btn.classList.toggle('active', btn === button));
    render();
  });
});

function render() {
  const visibleTasks = tasks.filter((task) => {
    if (filter === 'open') return !task.done;
    if (filter === 'done') return task.done;
    return true;
  });

  taskListEl.innerHTML = '';

  visibleTasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = 'task-item';

    const main = document.createElement('div');
    main.className = 'task-main';

    const title = document.createElement('p');
    title.className = `task-title ${task.done ? 'done' : ''}`;
    title.textContent = task.title;

    const meta = document.createElement('p');
    meta.className = 'meta';
    meta.textContent = task.dueDate ? `Due: ${task.dueDate}` : 'No due date';

    const priority = document.createElement('span');
    priority.className = `badge priority-${task.priority}`;
    priority.textContent = task.priority;

    main.appendChild(title);
    main.appendChild(meta);
    main.appendChild(priority);

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.textContent = task.done ? 'Mark Open' : 'Mark Done';
    toggleBtn.addEventListener('click', () => {
      task.done = !task.done;
      persistTasks();
      render();
    });

    item.appendChild(main);
    item.appendChild(toggleBtn);
    taskListEl.appendChild(item);
  });

  emptyStateEl.hidden = visibleTasks.length > 0;
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}
