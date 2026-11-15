'use strict';

/* ============================================================
   Трекер витрат — Завдання 1 і 3
   Дані зберігаються в LocalStorage під ключем STORAGE_KEY.
   ============================================================ */

const STORAGE_KEY = 'expenseTracker.expenses';

const CATEGORIES = ['Їжа', 'Транспорт', 'Покупки', 'Інше'];
const CATEGORY_ICONS = { 'Їжа': '🍽️', 'Транспорт': '🚌', 'Покупки': '🛍️', 'Інше': '📦' };

const MAX_NAME_LENGTH = 60;

// ---------- Елементи сторінки ----------
const form = document.getElementById('expense-form');
const nameInput = document.getElementById('expense-name');
const amountInput = document.getElementById('expense-amount');
const categorySelect = document.getElementById('expense-category');
const nameError = document.getElementById('name-error');
const amountError = document.getElementById('amount-error');

const totalAmountEl = document.getElementById('total-amount');
const categoryTotalsEl = document.getElementById('category-totals');

const searchInput = document.getElementById('search-input');
const filterSelect = document.getElementById('filter-category');
const listInfo = document.getElementById('list-info');
const listEl = document.getElementById('expense-list');
const emptyMessage = document.getElementById('empty-message');
const clearBtn = document.getElementById('clear-btn');

const dialog = document.getElementById('confirm-dialog');
const confirmText = document.getElementById('confirm-text');
const storageWarning = document.getElementById('storage-warning');

// ---------- Стан ----------
let expenses = loadExpenses();

// ---------- Форматування ----------
const moneyFormatter = new Intl.NumberFormat('uk-UA', {
  style: 'currency',
  currency: 'UAH',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function formatMoney(value) {
  return moneyFormatter.format(value);
}

function formatDate(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('uk-UA', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

// Сума в копійках → без похибок типу 0.1 + 0.2 = 0.30000000000000004
function sumAmounts(list) {
  const cents = list.reduce((acc, item) => acc + Math.round(item.amount * 100), 0);
  return cents / 100;
}

// ---------- LocalStorage ----------
function isValidExpense(item) {
  return item
    && typeof item.id === 'string'
    && typeof item.name === 'string' && item.name.trim() !== ''
    && typeof item.amount === 'number' && Number.isFinite(item.amount) && item.amount > 0
    && CATEGORIES.includes(item.category);
}

function loadExpenses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidExpense) : [];
  } catch (error) {
    // Пошкоджені дані або LocalStorage недоступний — починаємо з порожнього списку
    return [];
  }
}

function saveExpenses() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    storageWarning.hidden = true;
  } catch (error) {
    storageWarning.hidden = false;
  }
}

// ---------- Валідація ----------
function validateForm() {
  const name = nameInput.value.trim();
  const amountText = amountInput.value.trim();
  const amount = Number(amountText);
  const errors = {};

  if (name === '') {
    errors.name = 'Введіть назву витрати.';
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.name = `Назва не може бути довшою за ${MAX_NAME_LENGTH} символів.`;
  }

  if (amountText === '' || amountInput.validity.badInput) {
    errors.amount = 'Введіть суму числом.';
  } else if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = 'Сума повинна бути більшою за нуль.';
  }

  return { name, amount, errors };
}

function showFieldError(input, errorEl, message) {
  errorEl.textContent = message || '';
  input.classList.toggle('invalid', Boolean(message));
}

// ---------- Дії ----------
function addExpense(name, amount, category) {
  expenses.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    amount: Math.round(amount * 100) / 100,
    category,
    createdAt: new Date().toISOString()
  });
  saveExpenses();
  render();
}

function deleteExpense(id) {
  expenses = expenses.filter((item) => item.id !== id);
  saveExpenses();
  render();
}

function clearAllExpenses() {
  expenses = [];
  saveExpenses();
  render();
}

// ---------- Відображення ----------
function getVisibleExpenses() {
  const query = searchInput.value.trim().toLocaleLowerCase('uk');
  const category = filterSelect.value;

  return expenses
    .filter((item) => category === 'all' || item.category === category)
    .filter((item) => item.name.toLocaleLowerCase('uk').includes(query))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function renderSummary() {
  totalAmountEl.textContent = formatMoney(sumAmounts(expenses));

  categoryTotalsEl.replaceChildren();
  CATEGORIES.forEach((category) => {
    const sum = sumAmounts(expenses.filter((item) => item.category === category));

    const li = document.createElement('li');
    const nameSpan = document.createElement('span');
    nameSpan.className = 'cat-name';
    nameSpan.textContent = `${CATEGORY_ICONS[category]} ${category}`;
    const sumSpan = document.createElement('span');
    sumSpan.className = 'cat-sum';
    sumSpan.textContent = formatMoney(sum);

    li.append(nameSpan, sumSpan);
    categoryTotalsEl.append(li);
  });
}

function createExpenseItem(item) {
  const li = document.createElement('li');
  li.className = 'expense-item';

  const info = document.createElement('div');
  const nameEl = document.createElement('div');
  nameEl.className = 'expense-name';
  nameEl.textContent = item.name; // textContent — безпечно, HTML у назві не виконається

  const meta = document.createElement('div');
  meta.className = 'expense-meta';
  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.textContent = `${CATEGORY_ICONS[item.category]} ${item.category}`;
  meta.append(badge, formatDate(item.createdAt));

  info.append(nameEl, meta);

  const amountEl = document.createElement('div');
  amountEl.className = 'expense-amount';
  amountEl.textContent = formatMoney(item.amount);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'delete-btn';
  deleteBtn.dataset.id = item.id;
  deleteBtn.setAttribute('aria-label', `Видалити витрату «${item.name}»`);
  deleteBtn.title = 'Видалити';
  deleteBtn.textContent = '✕';

  li.append(info, amountEl, deleteBtn);
  return li;
}

function renderList() {
  const visible = getVisibleExpenses();
  const isFiltered = searchInput.value.trim() !== '' || filterSelect.value !== 'all';

  listEl.replaceChildren(...visible.map(createExpenseItem));

  // Підказка над списком
  if (expenses.length === 0) {
    listInfo.textContent = '';
  } else if (isFiltered) {
    listInfo.textContent =
      `Показано ${visible.length} із ${expenses.length} · сума показаних: ${formatMoney(sumAmounts(visible))}`;
  } else {
    listInfo.textContent = `Усього витрат: ${expenses.length}`;
  }

  // Порожні стани
  if (expenses.length === 0) {
    emptyMessage.textContent = 'Поки що немає витрат. Додайте першу за допомогою форми вище 👆';
    emptyMessage.hidden = false;
  } else if (visible.length === 0) {
    emptyMessage.textContent = 'Нічого не знайдено. Змініть пошук або категорію.';
    emptyMessage.hidden = false;
  } else {
    emptyMessage.hidden = true;
  }

  clearBtn.disabled = expenses.length === 0;
}

function render() {
  renderSummary();
  renderList();
}

// ---------- Обробники подій ----------
form.addEventListener('submit', (event) => {
  event.preventDefault();

  const { name, amount, errors } = validateForm();
  showFieldError(nameInput, nameError, errors.name);
  showFieldError(amountInput, amountError, errors.amount);

  if (errors.name) { nameInput.focus(); return; }
  if (errors.amount) { amountInput.focus(); return; }

  addExpense(name, amount, categorySelect.value);

  form.reset();
  nameInput.focus();
});

// Прибираємо помилку, щойно користувач почав виправляти поле
nameInput.addEventListener('input', () => showFieldError(nameInput, nameError, ''));
amountInput.addEventListener('input', () => showFieldError(amountInput, amountError, ''));

// Видалення однієї витрати (делегування: один слухач на весь список)
listEl.addEventListener('click', (event) => {
  const button = event.target.closest('.delete-btn');
  if (button) deleteExpense(button.dataset.id);
});

// Пошук у реальному часі та фільтр
searchInput.addEventListener('input', renderList);
filterSelect.addEventListener('change', renderList);

// Очищення з підтвердженням
clearBtn.addEventListener('click', () => {
  if (expenses.length === 0) return;
  confirmText.textContent =
    `Усі витрати (${expenses.length} шт.) буде видалено назавжди. Цю дію не можна скасувати.`;
  dialog.showModal();
});

dialog.addEventListener('close', () => {
  if (dialog.returnValue === 'confirm') clearAllExpenses();
  dialog.returnValue = '';
});

// ---------- Старт ----------
render();
