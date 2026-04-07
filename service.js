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
  return String(text ?? "").replace(/[&<>"']/g, (char) => {
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

  if (mode === "en") document.body.classList.add("lang-en");
  else if (mode === "cu") document.body.classList.add("lang-cu");
  else if (mode === "sr") document.body.classList.add("lang-sr");
  else document.body.classList.add("lang-all");
}

function applyFontSize(size) {
  document.documentElement.style.setProperty("--font-size-base", `${size}px`);
}

function createSectionNav(sections) {
  const nav = document.getElementById("section-nav");
  nav.innerHTML = "";

  (sections || []).forEach((section) => {
    const sectionLink = document.createElement("a");
    sectionLink.href = `#${section.id}`;
    sectionLink.textContent = section.title;
    nav.appendChild(sectionLink);

    (section.subsections || []).forEach((subsection) => {
      const subsectionLink = document.createElement("a");
      subsectionLink.href = `#${subsection.id}`;
      subsectionLink.textContent = `— ${subsection.title}`;
      subsectionLink.className = "subsection-nav-link";
      nav.appendChild(subsectionLink);
    });
  });
}

function createItemElement(item) {
  const type = item.type || "line";

  if (type === "header") {
    const headerEl = document.createElement("div");
    headerEl.className = `subheader ${item.role || "note"}`;

    const title = item.en || item.cu || item.sr || "";
    headerEl.textContent = title;

    headerEl.dataset.search = [
      item.role || "",
      item.en || "",
      item.cu || "",
      item.sr || ""
    ].join(" ").toLowerCase();

    return headerEl;
  }

  const extraClass =
    item.role === "rubric" ? "rubric" :
    item.role === "note" ? "note" : "";

  const itemEl = document.createElement("article");
  itemEl.className = `item ${extraClass}`;

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

  itemEl.dataset.search = [
    item.role || "",
    item.en || "",
    item.cu || "",
    item.sr || ""
  ].join(" ").toLowerCase();

  return itemEl;
}

function createSubsectionElement(subsection) {
  const subsectionEl = document.createElement("section");
  subsectionEl.className = "subsection";
  subsectionEl.id = subsection.id;

  const heading = document.createElement("h3");
  heading.className = "subsection-heading";
  heading.textContent = subsection.title;

  const body = document.createElement("div");
  body.className = "subsection-body";

  (subsection.items || []).forEach((item) => {
    body.appendChild(createItemElement(item));
  });

  if (!subsection.items || subsection.items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-message";
    empty.textContent = "No items in this subsection yet.";
    body.appendChild(empty);
  }

  subsectionEl.appendChild(heading);
  subsectionEl.appendChild(body);

  return subsectionEl;
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

    const sectionTitleWrap = document.createElement("div");
    sectionTitleWrap.className = "section-title";

    const sectionHeading = document.createElement("h2");
    sectionHeading.className = "section-heading";
    sectionHeading.textContent = section.title;

    sectionTitleWrap.appendChild(sectionHeading);
    sectionEl.appendChild(sectionTitleWrap);

    const sectionBody = document.createElement("div");
    sectionBody.className = "section-body";

    (section.subsections || []).forEach((subsection) => {
      sectionBody.appendChild(createSubsectionElement(subsection));
    });

    if (!section.subsections || section.subsections.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-message";
      empty.textContent = "No subsections in this section yet.";
      sectionBody.appendChild(empty);
    }

    sectionEl.appendChild(sectionBody);
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

  const searchable = Array.from(document.querySelectorAll(".item, .subheader"));
  const subsections = Array.from(document.querySelectorAll(".subsection"));
  const sections = Array.from(document.querySelectorAll(".section"));

  let visibleItems = 0;
  let visibleSubsections = 0;
  let visibleSections = 0;

  searchable.forEach((el) => {
    const matches = !query || (el.dataset.search || "").includes(query);
    el.classList.toggle("hidden", !matches);
    if (matches) visibleItems += 1;

    const en = el.querySelector(".text-en");
    const cu = el.querySelector(".text-cu");
    const sr = el.querySelector(".text-sr");

    if (en) en.innerHTML = highlightText(en.textContent, query);
    if (cu) cu.innerHTML = highlightText(cu.textContent, query);
    if (sr) sr.innerHTML = highlightText(sr.textContent, query);
  });

  subsections.forEach((subsection) => {
    const hasVisibleContent = Array.from(subsection.querySelectorAll(".item, .subheader"))
      .some((el) => !el.classList.contains("hidden"));

    subsection.classList.toggle("hidden", !hasVisibleContent);

    if (hasVisibleContent) visibleSubsections += 1;
  });

  sections.forEach((section) => {
    const hasVisibleSubsection = Array.from(section.querySelectorAll(".subsection"))
      .some((subsection) => !subsection.classList.contains("hidden"));

    section.classList.toggle("hidden", !hasVisibleSubsection);

    if (hasVisibleSubsection) visibleSections += 1;
  });

  if (!query) {
    status.textContent = "";
  } else {
    status.textContent =
      `${visibleItems} match${visibleItems === 1 ? "" : "es"} in ` +
      `${visibleSubsections} subsection${visibleSubsections === 1 ? "" : "s"} / ` +
      `${visibleSections} section${visibleSections === 1 ? "" : "s"}.`;
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
    console.error(err);
    document.getElementById("service-title").textContent = "Could not load service";
    document.getElementById("service-content").innerHTML =
      `<div class="empty-message">${escapeHtml(err.message)}</div>`;
  }
}

loadServicePage();
