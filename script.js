async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Could not load ${path}`);
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

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text, query) {
  const safeText = escapeHtml(text || "");
  if (!query) return safeText;

  const pattern = new RegExp(`(${escapeRegex(query)})`, "gi");
  return safeText.replace(pattern, "<mark>$1</mark>");
}

function formatRole(role) {
  if (!role) return "";
  return role
    .split("-")
    .map((word) => capitalize(word))
    .join(" ");
}

async function loadIndexPage() {
  const listEl = document.getElementById("service-list");
  const searchInput = document.getElementById("service-search");
  if (!listEl) return;

  try {
    const index = await fetchJson("content/index.json");
    const services = index.services || [];

    function renderList(filter = "") {
      listEl.innerHTML = "";
      const q = filter.trim().toLowerCase();

      const filtered = services.filter((service) => {
        return (
          (service.title || "").toLowerCase().includes(q) ||
          (service.id || "").toLowerCase().includes(q) ||
          (service.category || "").toLowerCase().includes(q)
        );
      });

      if (filtered.length === 0) {
        listEl.innerHTML = `<div class="empty-message">No services found.</div>`;
        return;
      }

      filtered.forEach((service) => {
        const link = document.createElement("a");
        link.className = "card";
        link.href = `service.html?id=${encodeURIComponent(service.id)}`;

        link.innerHTML = `
          <div class="card-title">${escapeHtml(service.title || "")}</div>
          <div class="card-meta">
            ${escapeHtml(capitalize(service.category || ""))} · ${escapeHtml((service.languages || []).join(" / "))}
          </div>
        `;

        listEl.appendChild(link);
      });
    }

    renderList();

    if (searchInput) {
      searchInput.addEventListener("input", (event) => {
        renderList(event.target.value);
      });
    }
  } catch (error) {
    listEl.textContent = error.message;
  }
}

function setMode(mode) {
  document.body.dataset.mode = mode;

  document.querySelectorAll(".mode-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });

  document.querySelectorAll(".text-en").forEach((el) => {
    el.classList.toggle("hidden", mode === "cu");
  });

  document.querySelectorAll(".text-cu").forEach((el) => {
    el.classList.toggle("hidden", mode === "en");
  });
}

function buildSectionNav(sections) {
  const nav = document.getElementById("section-nav");
  if (!nav) return;

  nav.innerHTML = "";

  sections.forEach((section) => {
    const link = document.createElement("a");
    link.href = `#${section.id}`;
    link.textContent = section.title;
    nav.appendChild(link);
  });
}

function createItemElement(item) {
  const itemEl = document.createElement("article");
  const roleClass = item.role ? `role-${item.role}` : "";
  itemEl.className = `item ${item.role === "rubric" ? "rubric" : ""}`;
  itemEl.dataset.searchEn = (item.en || "").toLowerCase();
  itemEl.dataset.searchCu = (item.cu || "").toLowerCase();

  const roleEl = document.createElement("div");
  roleEl.className = `role ${roleClass}`.trim();
  roleEl.textContent = formatRole(item.role || "");
  itemEl.appendChild(roleEl);

  const textRow = document.createElement("div");
  textRow.className = "text-row";

  const enEl = document.createElement("div");
  enEl.className = "text-cell text-en";
  enEl.dataset.original = item.en || "";
  enEl.textContent = item.en || "";

  const cuEl = document.createElement("div");
  cuEl.className = "text-cell text-cu";
  cuEl.dataset.original = item.cu || "";
  cuEl.textContent = item.cu || "";

  textRow.appendChild(enEl);
  textRow.appendChild(cuEl);
  itemEl.appendChild(textRow);

  return itemEl;
}

function toggleSection(sectionEl, forceExpand = null) {
  const isCollapsed =
    forceExpand === null
      ? sectionEl.classList.contains("collapsed")
      : !forceExpand;

  sectionEl.classList.toggle("collapsed", !isCollapsed);

  const button = sectionEl.querySelector(".section-toggle");
  if (button) {
    const expanded = sectionEl.classList.contains("collapsed") ? "false" : "true";
    button.setAttribute("aria-expanded", expanded);
  }
}

function addSectionControls() {
  const contentEl = document.getElementById("service-content");
  if (!contentEl) return;

  const existing = document.getElementById("section-controls");
  if (existing) return;

  const controls = document.createElement("div");
  controls.id = "section-controls";
  controls.className = "section-controls";

  const expandBtn = document.createElement("button");
  expandBtn.type = "button";
  expandBtn.className = "mode-button";
  expandBtn.textContent = "Expand all";

  const collapseBtn = document.createElement("button");
  collapseBtn.type = "button";
  collapseBtn.className = "mode-button";
  collapseBtn.textContent = "Collapse all";

  expandBtn.addEventListener("click", () => {
    document.querySelectorAll(".section").forEach((section) => {
      toggleSection(section, true);
    });
  });

  collapseBtn.addEventListener("click", () => {
    document.querySelectorAll(".section").forEach((section) => {
      toggleSection(section, false);
    });
  });

  controls.appendChild(expandBtn);
  controls.appendChild(collapseBtn);
  contentEl.before(controls);
}

function renderService(service) {
  const titleEl = document.getElementById("service-title");
  const metaEl = document.getElementById("service-meta");
  const contentEl = document.getElementById("service-content");

  titleEl.textContent = service.title || "Service";
  document.title = service.title || "Service";

  metaEl.textContent = `${capitalize(service.category || "")}${service.source ? " · " + service.source : ""}`;

  buildSectionNav(service.sections || []);
  addSectionControls();

  (service.sections || []).forEach((section) => {
    const sectionEl = document.createElement("section");
    sectionEl.className = "section";
    sectionEl.id = section.id;

    const heading = document.createElement("h2");
    heading.className = "section-title";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "section-toggle";
    toggle.setAttribute("aria-expanded", "true");
    toggle.innerHTML = `
      <span class="section-toggle-label">${escapeHtml(section.title || "")}</span>
      <span class="section-toggle-icon" aria-hidden="true">▾</span>
    `;

    toggle.addEventListener("click", () => {
      toggleSection(sectionEl);
    });

    heading.appendChild(toggle);
    sectionEl.appendChild(heading);

    const sectionBody = document.createElement("div");
    sectionBody.className = "section-body";

    (section.items || []).forEach((item) => {
      sectionBody.appendChild(createItemElement(item));
    });

    sectionEl.appendChild(sectionBody);
    contentEl.appendChild(sectionEl);
  });
}

function applyTextSearch(query) {
  const normalized = query.trim().toLowerCase();
  const items = document.querySelectorAll(".item");
  const sections = document.querySelectorAll(".section");
  const status = document.getElementById("search-status");

  let visibleItems = 0;

  items.forEach((item) => {
    const en = item.dataset.searchEn || "";
    const cu = item.dataset.searchCu || "";
    const matches = !normalized || en.includes(normalized) || cu.includes(normalized);

    item.classList.toggle("hidden", !matches);

    const enEl = item.querySelector(".text-en");
    const cuEl = item.querySelector(".text-cu");

    if (enEl) {
      enEl.innerHTML = highlightText(enEl.dataset.original || "", normalized);
    }

    if (cuEl) {
      cuEl.innerHTML = highlightText(cuEl.dataset.original || "", normalized);
    }

    if (matches) {
      visibleItems += 1;
    }
  });

  sections.forEach((section) => {
    const hasVisibleItems = section.querySelector(".item:not(.hidden)");
    section.classList.toggle("hidden", !hasVisibleItems);

    if (normalized && hasVisibleItems) {
      section.classList.remove("collapsed");
      const button = section.querySelector(".section-toggle");
      if (button) button.setAttribute("aria-expanded", "true");
    }
  });

  if (!status) return;

  if (!normalized) {
    status.textContent = "";
  } else if (visibleItems === 0) {
    status.textContent = `No results for “${query}”.`;
  } else {
    status.textContent = `${visibleItems} result${visibleItems === 1 ? "" : "s"} for “${query}”.`;
  }
}

async function loadServicePage() {
  const contentEl = document.getElementById("service-content");
  if (!contentEl) return;

  const id = getQueryParam("id");
  if (!id) {
    contentEl.textContent = "Missing service id.";
    return;
  }

  try {
    const service = await fetchJson(`content/services/${id}.json`);
    renderService(service);

    document.querySelectorAll(".mode-button[data-mode]").forEach((button) => {
      button.addEventListener("click", () => setMode(button.dataset.mode));
    });

    const searchInput = document.getElementById("text-search");
    if (searchInput) {
      searchInput.addEventListener("input", (event) => {
        applyTextSearch(event.target.value);
      });
    }

    setMode("parallel");
  } catch (error) {
    contentEl.textContent = error.message;
  }
}

loadIndexPage();
loadServicePage();
