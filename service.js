async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while loading ${path}`);
  }
  return response.json();
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return map[char];
  });
}

function debounce(fn, delay = 120) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

const STORAGE_KEYS = {
  language: "orthodox-reader-language",
  fontSize: "orthodox-reader-font-size"
};

function getSavedPreference(key, fallback) {
  const value = localStorage.getItem(key);
  return value === null ? fallback : value;
}

function savePreference(key, value) {
  localStorage.setItem(key, value);
}

function applyLanguageMode(mode) {
  document.body.classList.remove("lang-both", "lang-en", "lang-cu");
  if (mode === "en") document.body.classList.add("lang-en");
  else if (mode === "cu") document.body.classList.add("lang-cu");
  else document.body.classList.add("lang-both");
}

function applyFontSize(size) {
  const numeric = Math.max(12, Math.min(24, Number(size) || 16));
  document.documentElement.style.setProperty("--font-size-base", `${numeric}px`);
}

function createItemElement(item) {
  const role = (item.role || "").toLowerCase();
  const itemEl = document.createElement("article");
  itemEl.className = `item ${role === "rubric" ? "rubric" : ""} ${role === "note" ? "note" : ""}`;

  const roleEl = document.createElement("div");
  roleEl.className = `role role-${role}`;
  roleEl.textContent = capitalize(role);

  const row = document.createElement("div");
  row.className = "text-row";

  const en = document.createElement("div");
  en.className = "text-cell text-en";
  en.textContent = item.en || "";

  const cu = document.createElement("div");
  cu.className = "text-cell text-cu";
  cu.textContent = item.cu || "";

  row.appendChild(en);
  row.appendChild(cu);

  itemEl.appendChild(roleEl);
  itemEl.appendChild(row);

  const haystack = `${role} ${item.en || ""} ${item.cu || ""}`.toLowerCase();
  itemEl.dataset.search = haystack;

  return itemEl;
}

function createSectionNav(sections) {
  const nav = document.getElementById("section-nav");
  nav.innerHTML = "";

  sections.forEach((section) => {
    const link = document.createElement("a");
    link.href = `#${section.id}`;
    link.textContent = section.title;
    nav.appendChild(link);
  });
}

function renderService(service) {
  const content = document.getElementById("service-content");
  const title = document.getElementById("service-title");
  const meta = document.getElementById("service-meta");

  title.textContent = service.title || "Service";
  meta.textContent = service.category ? capitalize(service.category) : "";

  content.innerHTML = "";
  createSectionNav(service.sections || []);

  (service.sections || []).forEach((section) => {
    const sectionEl = document.createElement("section");
    sectionEl.className = "section";
    sectionEl.id = section.id;

    const headingWrap = document.createElement("div");
    headingWrap.className = "section-title";

    const heading = document.createElement("h2");
    heading.className = "section-heading";
    heading.textContent = section.title;

    headingWrap.appendChild(heading);

    const body = document.createElement("div");
    body.className = "section-body";

    (section.items || []).forEach((item) => {
      body.appendChild(createItemElement(item));
    });

    if (!section.items || section.items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-message";
      empty.textContent = "No items in this section yet.";
      body.appendChild(empty);
    }

    sectionEl.appendChild(headingWrap);
    sectionEl.appendChild(body);
    content.appendChild(sectionEl);
  });
}

function highlightText(text, query) {
  if (!query) return escapeHtml(text);

  const escapedText = escapeHtml(text);
  const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${safeQuery})`, "gi");

  return escapedText.replace(regex, "<mark>$1</mark>");
}

function updateSearch() {
  const searchInput = document.getElementById("service-search");
  const status = document.getElementById("search-status");
  const query = searchInput.value.trim().toLowerCase();

  const items = Array.from(document.querySelectorAll(".item"));
  const sections = Array.from(document.querySelectorAll(".section"));

  let visibleItems = 0;
  let visibleSections = 0;

  items.forEach((item) => {
    const matches = !query || (item.dataset.search || "").includes(query);
    item.classList.toggle("hidden", !matches);
    if (matches) visibleItems += 1;

    const en = item.querySelector(".text-en");
    const cu = item.querySelector(".text-cu");

    if (en) en.innerHTML = highlightText(en.textContent, query);
    if (cu) cu.innerHTML = highlightText(cu.textContent, query);
  });

  sections.forEach((section) => {
    const visibleInSection = Array.from(section.querySelectorAll(".item"))
      .some((item) => !item.classList.contains("hidden"));

    const emptyMessage = section.querySelector(".empty-message");
    const hasOnlyEmpty = !section.querySelector(".item") && emptyMessage;

    const showSection = visibleInSection || (!query && hasOnlyEmpty);
    section.classList.toggle("hidden", !showSection);

    if (showSection) visibleSections += 1;
  });

  if (!query) {
    status.textContent = "";
  } else {
    status.textContent = `${visibleItems} item${visibleItems === 1 ? "" : "s"} in ${visibleSections} section${visibleSections === 1 ? "" : "s"} found.`;
  }
}

function bindControls() {
  const languageSelect = document.getElementById("language-mode");
  const fontSizeInput = document.getElementById("font-size");
  const fontMinus = document.getElementById("font-minus");
  const fontPlus = document.getElementById("font-plus");
  const searchInput = document.getElementById("service-search");

  const savedLanguage = getSavedPreference(STORAGE_KEYS.language, "both");
  const savedFontSize = Number(getSavedPreference(STORAGE_KEYS.fontSize, "16"));

  languageSelect.value = savedLanguage;
  fontSizeInput.value = savedFontSize;

  applyLanguageMode(savedLanguage);
  applyFontSize(savedFontSize);

  languageSelect.addEventListener("change", () => {
    applyLanguageMode(languageSelect.value);
    savePreference(STORAGE_KEYS.language, languageSelect.value);
  });

  fontSizeInput.addEventListener("input", () => {
    applyFontSize(fontSizeInput.value);
    savePreference(STORAGE_KEYS.fontSize, String(fontSizeInput.value));
  });

  fontPlus.addEventListener("click", () => {
    const next = Math.min(24, Number(fontSizeInput.value) + 1);
    fontSizeInput.value = String(next);
    applyFontSize(next);
    savePreference(STORAGE_KEYS.fontSize, String(next));
  });

  fontMinus.addEventListener("click", () => {
    const next = Math.max(12, Number(fontSizeInput.value) - 1);
    fontSizeInput.value = String(next);
    applyFontSize(next);
    savePreference(STORAGE_KEYS.fontSize, String(next));
  });

  searchInput.addEventListener("input", debounce(updateSearch, 100));
}

async function loadServicePage() {
  const id = getQueryParam("id");
  if (!id) {
    document.getElementById("service-title").textContent = "No service selected";
    document.getElementById("service-content").innerHTML =
      '<div class="empty-message">No service ID was provided in the URL.</div>';
    return;
  }

  const path = `content/services/${id}.json`;

  try {
    const service = await fetchJson(path);
    renderService(service);
    bindControls();
  } catch (err) {
    console.error("Service load error:", err);
    document.getElementById("service-title").textContent = "Could not load service";
    document.getElementById("service-content").innerHTML =
      `<div class="empty-message">Could not load service.<br><br>${escapeHtml(err.message)}</div>`;
  }
}

loadServicePage();
