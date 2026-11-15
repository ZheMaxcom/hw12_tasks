'use strict';

/* ============================================================
   Форма реєстрації — Завдання 2
   Уся перевірка робиться через JavaScript, без перезавантаження.
   Пароль нікуди не зберігається (ні в LocalStorage, ні в змінних між відправками).
   ============================================================ */

const form = document.getElementById('register-form');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmInput = document.getElementById('confirm-password');
const termsInput = document.getElementById('terms');
const successMessage = document.getElementById('success-message');

const errorEls = {
  username: document.getElementById('username-error'),
  email: document.getElementById('email-error'),
  password: document.getElementById('password-error'),
  confirm: document.getElementById('confirm-error'),
  terms: document.getElementById('terms-error')
};

const MIN_USERNAME = 3;
const MIN_PASSWORD = 8;

// Простий і зрозумілий шаблон: щось@щось.щось, без пробілів
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ---------- Правила перевірки: кожна повертає текст помилки або '' ----------
const validators = {
  username() {
    const value = usernameInput.value.trim();
    if (value === '') return 'Введіть ім\'я користувача.';
    if (value.length < MIN_USERNAME) return `Ім'я має містити мінімум ${MIN_USERNAME} символи.`;
    return '';
  },

  email() {
    const value = emailInput.value.trim();
    if (value === '') return 'Введіть email.';
    if (!EMAIL_PATTERN.test(value)) return 'Введіть коректний email, наприклад name@example.com.';
    return '';
  },

  password() {
    const value = passwordInput.value;
    if (value === '') return 'Введіть пароль.';
    if (value.length < MIN_PASSWORD) return `Пароль має містити мінімум ${MIN_PASSWORD} символів.`;
    return '';
  },

  confirm() {
    if (confirmInput.value === '') return 'Повторіть пароль.';
    if (confirmInput.value !== passwordInput.value) return 'Паролі не збігаються.';
    return '';
  },

  terms() {
    return termsInput.checked ? '' : 'Потрібно погодитися з умовами.';
  }
};

const inputs = {
  username: usernameInput,
  email: emailInput,
  password: passwordInput,
  confirm: confirmInput,
  terms: termsInput
};

// ---------- Показ результату перевірки під полем ----------
function validateField(name) {
  const message = validators[name]();
  errorEls[name].textContent = message;

  if (name !== 'terms') {
    inputs[name].classList.toggle('invalid', message !== '');
    inputs[name].classList.toggle('valid', message === '');
  }
  return message === '';
}

function validateAll() {
  // Перевіряємо ВСІ поля (не зупиняємось на першому), щоб показати всі помилки одразу
  const results = Object.keys(validators).map((name) => ({ name, ok: validateField(name) }));
  const firstBad = results.find((item) => !item.ok);
  if (firstBad) inputs[firstBad.name].focus();
  return !firstBad;
}

function clearFormState() {
  form.reset();
  Object.keys(inputs).forEach((name) => {
    errorEls[name].textContent = '';
    inputs[name].classList.remove('invalid', 'valid');
  });
}

// ---------- Події ----------
form.addEventListener('submit', (event) => {
  event.preventDefault(); // не перезавантажуємо сторінку

  successMessage.hidden = true;

  if (!validateAll()) return;

  // Тут у справжньому проєкті дані пішли б на сервер. У навчальній формі просто вітаємо.
  clearFormState();
  successMessage.hidden = false;
});

// Перевірка «наживо»: після виходу з поля, а потім — під час введення
Object.keys(inputs).forEach((name) => {
  const input = inputs[name];
  let touched = false;

  input.addEventListener('blur', () => {
    touched = true;
    validateField(name);
  });

  const liveEvent = name === 'terms' ? 'change' : 'input';
  input.addEventListener(liveEvent, () => {
    successMessage.hidden = true;
    if (touched || errorEls[name].textContent !== '') validateField(name);

    // Якщо змінили пароль — підтвердження теж треба перевірити заново
    if (name === 'password' && confirmInput.value !== '') validateField('confirm');
  });
});
