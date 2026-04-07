alert("service.js is running");

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
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
    document.getElementById("service-title").textContent = service.title || "Loaded";
    document.getElementById("service-content").innerHTML =
      `<div class="empty-message">Loaded successfully. Sections found: ${(service.sections || []).length}</div>`;
  } catch (err) {
    console.error(err);
    document.getElementById("service-title").textContent = "Could not load service";
    document.getElementById("service-content").innerHTML =
      `<div class="empty-message">${err.message}</div>`;
  }
}

loadServicePage();
