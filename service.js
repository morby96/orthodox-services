async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path}`);
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
  document.body.classList.remove("lang-all", "lang-en", "lang-cu", "lang-sr");

  if (mode === "en") {
    document.body.classList.add("lang-en");
  } else if (mode === "cu") {
    document.body.classList.add("lang-cu");
  } else if (mode === "sr") {
    document.body.classList.add("lang-sr");
  } else {
    document.body.classList.add("lang-all");
  }
}

function applyFontSize(size) {
  document.documentElement.style.setProperty("--font-size-base", `${size}px`);
}

function createItemElement(item) {
  const roleClass = item.role === "rubric" || item.role === "note" ? item.role : "";
  const itemEl = document.createElement("article");
  itemEl.className = `item ${roleClass}`;

  const roleEl = document.createElement("div");
  roleEl.className = `role role-${item.role || ""}`;
  roleEl.textContent = capitalize(item.role || "");

  const row = document.createElement("div");
  row.className = "text-row";

  const en = document.createElement("div");
  en.className = "text-cell text-en";
  en.textContent = item.en || "";

  const cu = document.createElement("div");
  cu.className = "text-cell text-cu";
  cu.textContent = item.cu || "";

  const sr = document.createElement("div");
  sr.className = "text-cell text-sr";
  sr.textContent = item.sr || "";

  row.appendChild(en);
  row.appendChild(cu);
  row.appendChild(sr);

  itemEl.appendChild(roleEl);
  itemEl.appendChild(row);

  const haystack = `${item.role || ""} ${item.en || ""} ${item.cu || ""} ${item.sr || ""}`.toLowerCase();
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
    const sr = item.querySelector(".text-sr");

    if (en) en.innerHTML = highlightText(en.textContent, query);
    if (cu) cu.innerHTML = highlightText(cu.textContent, query);
    if (sr) sr.innerHTML = highlightText(sr.textContent, query);
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
  const fontMinusBtn = document.getElementById("font-minus");
  const fontPlusBtn = document.getElementById("font-plus");
  const searchInput = document.getElementById("service-search");

  const savedLanguage = getSavedPreference(STORAGE_KEYS.language, "all");
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
    const size = Number(fontSizeInput.value);
    applyFontSize(size);
    savePreference(STORAGE_KEYS.fontSize, String(size));
  });

  fontMinusBtn.addEventListener("click", () => {
    const current = Number(fontSizeInput.value);
    const next = Math.max(12, current - 1);
    fontSizeInput.value = next;
    applyFontSize(next);
    savePreference(STORAGE_KEYS.fontSize, String(next));
  });

  fontPlusBtn.addEventListener("click", () => {
    const current = Number(fontSizeInput.value);
    const next = Math.min(24, current + 1);
    fontSizeInput.value = next;
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

  try {
    const service = await fetchJson(`content/services/${id}.json`);
    renderService(service);
    bindControls();
  } catch (err) {
    document.getElementById("service-title").textContent = "Could not load service";
    document.getElementById("service-content").innerHTML =
      '<div class="empty-message">Could not load service.</div>';
  }
}

loadServicePage();
