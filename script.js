async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
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

function renderServiceList(services) {
  const list = document.getElementById("service-list");
  list.innerHTML = "";

  if (!Array.isArray(services) || services.length === 0) {
    list.innerHTML = `<div class="empty-message">No services found.</div>`;
    return;
  }

  services.forEach((service) => {
    const card = document.createElement("a");
    card.className = "card";
    card.href = `service.html?id=${encodeURIComponent(service.id)}`;
    card.dataset.search = `${service.title || ""} ${service.category || ""} ${(service.languages || []).join(" ")}`.toLowerCase();

    card.innerHTML = `
      <h2 class="card-title">${escapeHtml(service.title || "Untitled Service")}</h2>
      <div class="card-meta">
        ${escapeHtml(service.category || "service")}
        ${service.languages ? ` • ${escapeHtml(service.languages.join(" / "))}` : ""}
      </div>
    `;

    list.appendChild(card);
  });
}

function setupSearch() {
  const input = document.getElementById("site-search");
  const list = document.getElementById("service-list");

  input.addEventListener("input", debounce(() => {
    const query = input.value.trim().toLowerCase();
    const cards = Array.from(list.querySelectorAll(".card"));
    let visible = 0;

    cards.forEach((card) => {
      const matches = !query || (card.dataset.search || "").includes(query);
      card.classList.toggle("hidden", !matches);
      if (matches) visible += 1;
    });

    const existingEmpty = list.querySelector(".search-empty");
    if (existingEmpty) existingEmpty.remove();

    if (visible === 0 && cards.length > 0) {
      const empty = document.createElement("div");
      empty.className = "empty-message search-empty";
      empty.textContent = "No matching services found.";
      list.appendChild(empty);
    }
  }, 100));
}

async function loadIndexPage() {
  try {
    const services = await fetchJson("content/index.json");
    renderServiceList(services);
    setupSearch();
  } catch (err) {
    document.getElementById("service-list").innerHTML =
      `<div class="empty-message">Could not load services list.</div>`;
  }
}

loadIndexPage();
