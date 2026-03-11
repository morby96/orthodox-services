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

function toggleSection(sectionEl, forceExpand = null) {

  const shouldCollapse =
    forceExpand === null
      ? !sectionEl.classList.contains("collapsed")
      : !forceExpand;

  sectionEl.classList.toggle("collapsed", shouldCollapse);

  const button = sectionEl.querySelector(".section-toggle");

  if (button) {
    button.setAttribute(
      "aria-expanded",
      sectionEl.classList.contains("collapsed") ? "false" : "true"
    );
  }
}

function createItemElement(item) {

  const itemEl = document.createElement("article");
  itemEl.className = `item ${item.role === "rubric" ? "rubric" : ""}`;

  const roleEl = document.createElement("div");
  roleEl.className = `role role-${item.role}`;
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

function renderService(service) {

  const content = document.getElementById("service-content");
  const title = document.getElementById("service-title");

  title.textContent = service.title;

  service.sections.forEach(section => {

    const sectionEl = document.createElement("section");
    sectionEl.className = "section";
    sectionEl.id = section.id;

    const heading = document.createElement("h2");
    heading.className = "section-title";

    const toggle = document.createElement("button");

    toggle.className = "section-toggle";
    toggle.setAttribute("aria-expanded", "true");

    toggle.innerHTML = `
      <span class="section-toggle-label">${escapeHtml(section.title)}</span>
      <span class="section-toggle-icon">▾</span>
    `;

    function handleToggle(e) {
      e.preventDefault();
      toggleSection(sectionEl);
    }

    toggle.addEventListener("click", handleToggle);
    toggle.addEventListener("touchend", handleToggle, { passive: false });

    heading.appendChild(toggle);

    const body = document.createElement("div");
    body.className = "section-body";

    (section.items || []).forEach(item => {
      body.appendChild(createItemElement(item));
    });

    sectionEl.appendChild(heading);
    sectionEl.appendChild(body);

    content.appendChild(sectionEl);
  });
}

async function loadServicePage() {

  const id = getQueryParam("id");
  if (!id) return;

  const service = await fetchJson(`content/services/${id}.json`);

  renderService(service);
}

loadServicePage();
