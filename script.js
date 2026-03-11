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

/* ---------- HOMEPAGE ---------- */

function renderServiceList(services) {
  const listEl = document.getElementById("service-list");
  if (!listEl) return;

  listEl.innerHTML = "";

  if (!services || services.length === 0) {
    listEl.innerHTML = `<div class="empty-message">No services found.</div>`;
    return;
  }

  services.forEach((service) => {
    const link = document.createElement("a");
    link.className = "card";
    link.href = `service.html?id=${encodeURIComponent(service.id)}`;

    const languages = Array.isArray(service.languages)
      ? service.languages.join(" / ")
      : "";

    link.innerHTML = `
      <div class="card-title">${escapeHtml(service.title || "")}</div>
      <div class="card-meta">
        ${escapeHtml(capitalize(service.category || ""))}${languages ? " · " + escapeHtml(languages) : ""}
      </div>
    `;

    listEl.appendChild(link);
  });
}

async function loadIndexPage() {
  const listEl = document.getElementById("service-list");
  if (!listEl) return;

  try {
    const index = await fetchJson("content/index.json");
    const services = index.services || [];
    renderServiceList(services);
  } catch (err) {
    listEl.innerHTML = `<div class="empty-message">Could not load services.</div>`;
  }
}

/* ---------- SECTION COLLAPSE LOGIC ---------- */

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

/* ---------- ITEM RENDERING ---------- */

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

  return itemEl;
}

/* ---------- SECTION CONTROLS ---------- */

function addSectionControls() {
  const content = document.getElementById("service-content");
  if (!content) return;

  const existing = document.querySelector(".section-controls");
  if (existing) return;

  const controls = document.createElement("div");
  controls.className = "section-controls";

  const expandBtn = document.createElement("button");
  expandBtn.textContent = "Expand All";
  expandBtn.className = "mode-button";

  const collapseBtn = document.createElement("button");
  collapseBtn.textContent = "Collapse All";
  collapseBtn.className = "mode-button";

  expandBtn.onclick = () => {
    document.querySelectorAll(".section").forEach((section) => {
      toggleSection(section, true);
    });
  };

  collapseBtn.onclick = () => {
    document.querySelectorAll(".section").forEach((section) => {
      toggleSection(section, false);
    });
  };

  controls.appendChild(expandBtn);
  controls.appendChild(collapseBtn);

  content.before(controls);
}

/* ---------- SERVICE PAGE ---------- */

function renderService(service) {
  const content = document.getElementById("service-content");
  const title = document.getElementById("service-title");

  if (!content || !title) return;

  title.textContent = service.title || "Service";
  content.innerHTML = "";

  addSectionControls();

  (service.sections || []).forEach((section) => {
    const sectionEl = document.createElement("section");
    sectionEl.className = "section collapsed";
    sectionEl.id = section.id;

    const heading = document.createElement("h2");
    heading.className = "section-title";

    const toggle = document.createElement("button");
    toggle.className = "section-toggle";
    toggle.setAttribute("aria-expanded", "false");

    toggle.innerHTML = `
      <span class="section-toggle-label">${escapeHtml(section.title || "")}</span>
      <span class="section-toggle-icon">▾</span>
    `;

    function handleToggle(event) {
      event.preventDefault();
      toggleSection(sectionEl);
    }

    toggle.addEventListener("click", handleToggle);
    toggle.addEventListener("touchend", handleToggle, { passive: false });

    heading.appendChild(toggle);

    const body = document.createElement("div");
    body.className = "section-body";

    (section.items || []).forEach((item) => {
      body.appendChild(createItemElement(item));
    });

    sectionEl.appendChild(heading);
    sectionEl.appendChild(body);

    content.appendChild(sectionEl);
  });
}

async function loadServicePage() {
  const contentEl = document.getElementById("service-content");
  if (!contentEl) return;

  const id = getQueryParam("id");
  if (!id) return;

  try {
    const service = await fetchJson(`content/services/${id}.json`);
    renderService(service);
  } catch (err) {
    contentEl.textContent = "Could not load service.";
  }
}

/* ---------- INIT ---------- */

loadIndexPage();
loadServicePage();
