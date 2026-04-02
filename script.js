async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
  return response.json();
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

function formatLanguages(languages) {
  if (!Array.isArray(languages) || languages.length === 0) return "";
  const names = {
    en: "English",
    cu: "Church Slavonic",
    sr: "Serbian"
  };
  return languages.map((lang) => names[lang] || lang).join(" • ");
}

function createServiceCard(service) {
  const card = document.createElement("a");
  card.className = "card";
  card.href = `service.html?id=${encodeURIComponent(service.id)}`;

  const imageHtml = service.image
    ? `<img class="card-image" src="${escapeHtml(service.image)}" alt="${escapeHtml(service.title)}">`
    : "";

  const metaParts = [
    service.category ? escapeHtml(service.category) : "",
    formatLanguages(service.languages)
  ].filter(Boolean);

  card.innerHTML = `
    ${imageHtml}
    <div class="card-body">
      <h2 class="card-title">${escapeHtml(service.title)}</h2>
      <div class="card-meta">${metaParts.join(" • ")}</div>
    </div>
  `;

  card.dataset.search = [
    service.title || "",
    service.category || "",
    ...(service.languages || [])
  ].join(" ").toLowerCase();

  return card;
}

function renderServices(services) {
  const list = document.getElementById("service-list");
  list.innerHTML = "";

  if (!Array.isArray(services) || services.length === 0) {
    list.innerHTML = `<div class="empty-message">No services found in index.json.</div>`;
    return;
  }

  services.forEach((service) => {
    list.appendChild(createServiceCard(service));
  });
}

function setupSearch() {
  const input = document.getElementById("site-search");
  const cards = () => Array.from(document.querySelectorAll(".card"));

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();

    cards().forEach((card) => {
      const matches = !query || (card.dataset.search || "").includes(query);
      card.classList.toggle("hidden", !matches);
    });
  });
}

async function loadHomePage() {
  const list = document.getElementById("service-list");

  try {
    const services = await fetchJson("index.json");
    renderServices(services);
    setupSearch();
  } catch (error) {
    console.error(error);
    list.innerHTML = `<div class="empty-message">${escapeHtml(error.message)}</div>`;
  }
}

loadHomePage();
