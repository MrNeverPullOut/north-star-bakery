"use strict";

/* ==========================================================
   North Star Bakery - script.js
   Feature: a saved Pre-Order List (products.html) that carries
   over to the pre-order form (contact.html), plus form validation.
   ========================================================== */

/* ---------- Data: objects and arrays ---------- */

// Object: the localStorage keys used by the site
const STORAGE_KEYS = {
  list: "northStarPreorderList",
  contact: "northStarContact"
};

// Array of objects: every item a customer can add to a pre-order list
const products = [
  { id: "signature-loaf", name: "Signature Loaf", category: "Breads", price: "$6 to $10 per loaf" },
  { id: "sourdough", name: "Country Sourdough", category: "Breads", price: "$6 to $10 per loaf" },
  { id: "seeded-rye", name: "Seeded Rye", category: "Breads", price: "$6 to $10 per loaf" },
  { id: "croissant", name: "Butter Croissant", category: "Pastries", price: "$3 to $6 each" },
  { id: "cinnamon-roll", name: "Cinnamon Roll", category: "Pastries", price: "$3 to $6 each" },
  { id: "fruit-danish", name: "Seasonal Fruit Danish", category: "Pastries", price: "$3 to $6 each" },
  { id: "birthday-cake", name: "Custom Birthday Cake", category: "Cakes", price: "$35 to $90 by size" },
  { id: "office-cake", name: "Office Event Cake", category: "Cakes", price: "$35 to $90 by size" }
];

// Object: error messages used by the form validation
const ERROR_MESSAGES = {
  nameRequired: "Please enter your full name.",
  nameShort: "Your name needs at least 2 characters.",
  nameLetters: "Use letters, spaces, apostrophes, or hyphens only.",
  emailRequired: "Please enter your email address.",
  emailFormat: "Enter a valid email address, such as name@example.com.",
  pickupRequired: "Please choose a pickup date.",
  pickupPast: "Pickup date cannot be in the past.",
  typeRequired: "Please choose a request type.",
  detailsRequired: "Please describe the items you would like.",
  detailsShort: "Item details need at least 5 characters.",
  detailsLong: "Item details must be 500 characters or fewer.",
  allergiesLong: "Allergy notes must be 300 characters or fewer."
};

// Array: the ids (strings) of items currently on the saved list
let preorderList = [];

/* ---------- Storage helpers ---------- */

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;   // storage blocked or data damaged
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    /* storage unavailable: the site still works, it just won't remember */
  }
}

/* ---------- Pre-order list logic ---------- */

function findProduct(id) {
  return products.find(function (item) { return item.id === id; });
}

function loadList() {
  const saved = readStorage(STORAGE_KEYS.list, []);
  // keep only ids that still match a real product
  preorderList = Array.isArray(saved) ? saved.filter(findProduct) : [];
}

function saveList() {
  writeStorage(STORAGE_KEYS.list, preorderList);
}

function isOnList(id) {
  return preorderList.includes(id);
}

function toggleItem(id) {
  if (isOnList(id)) {
    preorderList = preorderList.filter(function (itemId) { return itemId !== id; });
  } else {
    preorderList.push(id);
  }
  saveList();
  renderProducts();
  renderMyList();
}

function clearList() {
  preorderList = [];
  saveList();
  renderProducts();
  renderMyList();
}

function getListNames() {
  return preorderList.map(function (id) { return findProduct(id).name; });
}

/* ---------- Products page: rendering ---------- */

function renderProducts() {
  const grid = document.getElementById("product-grid");
  if (!grid) { return; }              // only the products page has a grid
  grid.innerHTML = "";

  products.forEach(function (item) {
    const added = isOnList(item.id);

    const card = document.createElement("li");
    card.className = added ? "product-card in-list" : "product-card";

    const title = document.createElement("h4");
    title.textContent = item.name;

    const info = document.createElement("p");
    info.textContent = item.category + " | " + item.price;

    const button = document.createElement("button");
    button.type = "button";
    button.dataset.id = item.id;
    button.setAttribute("aria-pressed", String(added));
    button.textContent = added ? "Remove from list" : "Add to list";

    card.append(title, info, button);
    grid.appendChild(card);
  });
}

function renderMyList() {
  const listEl = document.getElementById("my-list");
  const status = document.getElementById("list-status");
  const clearButton = document.getElementById("clear-list");
  if (!listEl) { return; }            // only the products page shows the list
  listEl.innerHTML = "";

  if (preorderList.length === 0) {
    status.textContent = "Your list is empty. Choose items above to start a pre-order.";
    clearButton.hidden = true;
    return;
  }

  status.textContent = preorderList.length === 1
    ? "1 item on your list."
    : preorderList.length + " items on your list.";
  clearButton.hidden = false;

  preorderList.forEach(function (id) {
    const row = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = findProduct(id).name;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "secondary small";
    remove.dataset.remove = id;
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", "Remove " + findProduct(id).name + " from list");

    row.append(label, remove);
    listEl.appendChild(row);
  });
}

function initProductsPage() {
  loadList();
  renderProducts();
  renderMyList();

  document.getElementById("product-grid").addEventListener("click", function (event) {
    const button = event.target.closest("button[data-id]");
    if (button) { toggleItem(button.dataset.id); }
  });

  document.getElementById("my-list").addEventListener("click", function (event) {
    const button = event.target.closest("button[data-remove]");
    if (button) { toggleItem(button.dataset.remove); }
  });

  document.getElementById("clear-list").addEventListener("click", clearList);
}

/* ---------- Contact page: validation ---------- */

function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return now.getFullYear() + "-" + month + "-" + day;
}

// Object: one validation function per field (each returns a message, or "" if valid)
const validators = {
  name: function (value) {
    if (value === "") { return ERROR_MESSAGES.nameRequired; }
    if (value.length < 2) { return ERROR_MESSAGES.nameShort; }
    if (!/^[\p{L}\s'’-]+$/u.test(value)) { return ERROR_MESSAGES.nameLetters; }
    return "";
  },
  email: function (value) {
    if (value === "") { return ERROR_MESSAGES.emailRequired; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) { return ERROR_MESSAGES.emailFormat; }
    return "";
  },
  pickup: function (value) {
    if (value === "") { return ERROR_MESSAGES.pickupRequired; }
    if (value < todayString()) { return ERROR_MESSAGES.pickupPast; }
    return "";
  },
  "request-type": function (value) {
    return value === "" ? ERROR_MESSAGES.typeRequired : "";
  },
  details: function (value) {
    if (value === "") { return ERROR_MESSAGES.detailsRequired; }
    if (value.length < 5) { return ERROR_MESSAGES.detailsShort; }
    if (value.length > 500) { return ERROR_MESSAGES.detailsLong; }
    return "";
  },
  allergies: function (value) {
    return value.length > 300 ? ERROR_MESSAGES.allergiesLong : "";
  }
};

function showError(field, message) {
  const errorEl = document.getElementById(field.id + "-error");
  errorEl.textContent = message;
  field.setAttribute("aria-invalid", "true");
  field.setAttribute("aria-describedby", errorEl.id);
}

function clearError(field) {
  const errorEl = document.getElementById(field.id + "-error");
  errorEl.textContent = "";
  field.removeAttribute("aria-invalid");
  field.removeAttribute("aria-describedby");
}

function validateField(field) {
  const message = validators[field.id](field.value.trim());
  if (message) { showError(field, message); } else { clearError(field); }
  return message === "";
}

function validateForm(form) {
  let firstInvalid = null;
  Object.keys(validators).forEach(function (id) {
    const field = document.getElementById(id);
    if (!validateField(field) && !firstInvalid) { firstInvalid = field; }
  });
  if (firstInvalid) { firstInvalid.focus(); }
  return firstInvalid === null;
}

/* ---------- Contact page: storage and pre-fill ---------- */

function saveContactDetails() {
  writeStorage(STORAGE_KEYS.contact, {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim()
  });
}

function prefillForm() {
  const saved = readStorage(STORAGE_KEYS.contact, {});
  const nameField = document.getElementById("name");
  const emailField = document.getElementById("email");
  if (saved.name && nameField.value === "") { nameField.value = saved.name; }
  if (saved.email && emailField.value === "") { emailField.value = saved.email; }

  loadList();
  const note = document.getElementById("list-note");
  const details = document.getElementById("details");
  if (preorderList.length > 0 && details.value === "") {
    details.value = "Pre-order list: " + getListNames().join(", ");
    document.getElementById("request-type").value = "preorder";
    note.textContent = "We added the items from your saved pre-order list. Add quantities or change anything below.";
  } else {
    note.textContent = "";
  }
}

function showSuccess(name) {
  const box = document.getElementById("form-success");
  box.textContent = "Thank you, " + name + "! Your request was received. We will confirm by email.";
  box.hidden = false;
}

function handleSubmit(event, form) {
  event.preventDefault();               // no server yet, and stops invalid submits
  const success = document.getElementById("form-success");
  success.hidden = true;

  if (!validateForm(form)) { return; }

  const name = document.getElementById("name").value.trim();
  saveContactDetails();
  clearList();                          // the order was sent, so start a fresh list
  form.reset();
  prefillForm();                        // keeps the remembered name and email
  showSuccess(name);
}

function initContactPage() {
  const form = document.getElementById("preorder-form");
  form.noValidate = true;               // JavaScript messages replace the browser pop-ups
  document.getElementById("pickup").min = todayString();

  prefillForm();

  Object.keys(validators).forEach(function (id) {
    const field = document.getElementById(id);
    field.addEventListener("blur", function () {
      if (field.value.trim() !== "" || field.hasAttribute("aria-invalid")) { validateField(field); }
    });
    field.addEventListener("input", function () {
      if (field.hasAttribute("aria-invalid")) { validateField(field); }   // errors clear as the user fixes them
    });
  });

  document.getElementById("name").addEventListener("input", saveContactDetails);
  document.getElementById("email").addEventListener("input", saveContactDetails);

  form.addEventListener("submit", function (event) { handleSubmit(event, form); });
}

/* ---------- Start ---------- */

if (document.getElementById("product-grid")) { initProductsPage(); }
if (document.getElementById("preorder-form")) { initContactPage(); }
