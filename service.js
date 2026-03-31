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
  showRubrics: "orthodox-reader-show-rubrics",
  fontSize: "orthodox-reader-font-size"
};

function getSavedPreference(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

function savePreference(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function applyLanguageMode(mode) {
  document.body.classList.remove("lang-both", "lang-en", "lang-cu");
  if (mode === "en") document.body.classList.add("lang-en");
  else if (mode === "cu") document.body.classList.add("lang-cu");
  else document.body.classList.add("lang-both");
}

function applyRubricVisibility(showRubrics) {
  document.body.classList.toggle("hide-rubrics", !showRubrics);
}

function applyFontSize(size) {
  document.documentElement.style.setProperty("--font-size-base", `${size}px`);
}

function toggleSection(sectionEl, forceExpand = null) {
  let shouldCollapse;

  if (forceExpand === null) {
    shouldCollapse = !sectionEl.classList.contains("collapsed");
  } else {
    shouldCollapse = !forceExpand;
  }

  sectionEl.classList.toggle("collapsed", shouldCollapse);

  const button = sectionEl.querySelector(".section-toggle");
  if (button) {
    button.setAttribute("aria-expanded", shouldCollapse ? "false" : "true");
  }
}

function createItemElement(item) {
  const itemEl = document.createElement("article");
  itemEl.className = `item ${item.role === "rubric" ? "rubric" : ""}`;

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

  row.appendChild(en);
  row.appendChild(cu);

  itemEl.appendChild(roleEl);
  itemEl.appendChild(row);

  const haystack = `${item.role || ""} ${item.en || ""} ${item.cu || ""}`.toLowerCase();
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

function wireSectionToggle(toggle, sectionEl) {
  let touchHandled = false;

  toggle.addEventListener("touchend", (event) => {
    event.preventDefault();
    touchHandled = true;
    toggleSection(sectionEl);
  }, { passive: false });

  toggle.addEventListener("click", (event) => {
    if (touchHandled) {
      touchHandled = false;
      return;
    }
    event.preventDefault();
    toggleSection(sectionEl);
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
    sectionEl.className = "section collapsed";
    sectionEl.id = section.id;

    const heading = document.createElement("h2");
    heading.className = "section-title";

    const toggle = document.createElement("button");
    toggle.className = "section-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = `
      <span class="section-toggle-label">${escapeHtml(section.title)}</span>
      <span class="section-toggle-icon">▾</span>
    `;

    wireSectionToggle(toggle, sectionEl);
    heading.appendChild(toggle);

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

    sectionEl.appendChild(heading);
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

    if (query && visibleInSection) {
      toggleSection(section, true);
    }
  });

  if (!query) {
    status.textContent = "";
  } else {
    status.textContent = `${visibleItems} item${visibleItems === 1 ? "" : "s"} in ${visibleSections} section${visibleSections === 1 ? "" : "s"} found.`;
  }
}

function bindControls() {
  const languageSelect = document.getElementById("language-mode");
  const showRubricsCheckbox = document.getElementById("show-rubrics");
  const fontSizeInput = document.getElementById("font-size");
  const expandAllBtn = document.getElementById("expand-all-btn");
  const collapseAllBtn = document.getElementById("collapse-all-btn");
  const searchInput = document.getElementById("service-search");

  const savedLanguage = getSavedPreference(STORAGE_KEYS.language, "both");
  const savedRubrics = getSavedPreference(STORAGE_KEYS.showRubrics, "true") === "true";
  const savedFontSize = Number(getSavedPreference(STORAGE_KEYS.fontSize, "18"));

  languageSelect.value = savedLanguage;
  showRubricsCheckbox.checked = savedRubrics;
  fontSizeInput.value = savedFontSize;

  applyLanguageMode(savedLanguage);
  applyRubricVisibility(savedRubrics);
  applyFontSize(savedFontSize);

  languageSelect.addEventListener("change", () => {
    applyLanguageMode(languageSelect.value);
    savePreference(STORAGE_KEYS.language, languageSelect.value);
  });

  showRubricsCheckbox.addEventListener("change", () => {
    applyRubricVisibility(showRubricsCheckbox.checked);
    savePreference(STORAGE_KEYS.showRubrics, String(showRubricsCheckbox.checked));
  });

  fontSizeInput.addEventListener("input", () => {
    applyFontSize(fontSizeInput.value);
    savePreference(STORAGE_KEYS.fontSize, String(fontSizeInput.value));
  });

  expandAllBtn.addEventListener("click", () => {
    document.querySelectorAll(".section:not(.hidden)").forEach((section) => {
      toggleSection(section, true);
    });
  });

  collapseAllBtn.addEventListener("click", () => {
    document.querySelectorAll(".section:not(.hidden)").forEach((section) => {
      toggleSection(section, false);
    });
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
