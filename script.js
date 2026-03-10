async function fetchJson(path){
  const r = await fetch(path)
  return r.json()
}

function getQueryParam(name){
  const p = new URLSearchParams(window.location.search)
  return p.get(name)
}

async function loadIndexPage(){
  const list = document.getElementById("service-list")
  if(!list) return

  const index = await fetchJson("content/index.json")

  function render(q=""){
    list.innerHTML=""
    const f = index.services.filter(s=>s.title.toLowerCase().includes(q.toLowerCase()))
    f.forEach(service=>{
      const a=document.createElement("a")
      a.className="card"
      a.href=`service.html?id=${service.id}`
      a.innerHTML=`<b>${service.title}</b><br>${service.category}`
      list.appendChild(a)
    })
  }

  render()

  const search=document.getElementById("service-search")
  if(search){
    search.addEventListener("input",e=>render(e.target.value))
  }
}

function setMode(mode){
  document.querySelectorAll(".text-en").forEach(e=>e.classList.toggle("hidden",mode==="cu"))
  document.querySelectorAll(".text-cu").forEach(e=>e.classList.toggle("hidden",mode==="en"))
}

function buildSectionNav(sections){
  const nav=document.getElementById("section-nav")
  if(!nav) return
  sections.forEach(s=>{
    const a=document.createElement("a")
    a.href="#"+s.id
    a.textContent=s.title
    nav.appendChild(a)
  })
}

function renderService(service){
  const title=document.getElementById("service-title")
  const content=document.getElementById("service-content")

  title.textContent=service.title

  buildSectionNav(service.sections)

  service.sections.forEach(section=>{
    const sec=document.createElement("section")
    sec.className="section"
    sec.id=section.id

    const h=document.createElement("h2")
    h.className="section-title"
    h.textContent=section.title
    sec.appendChild(h)

    section.items.forEach(item=>{
      const el=document.createElement("div")
      el.className="item"

      el.innerHTML=`
        <div class="role">${item.role}</div>
        <div class="text-row">
          <div class="text-en">${item.en||""}</div>
          <div class="text-cu">${item.cu||""}</div>
        </div>
      `

      sec.appendChild(el)
    })

    content.appendChild(sec)
  })
}

async function loadServicePage(){
  const content=document.getElementById("service-content")
  if(!content) return

  const id=getQueryParam("id")
  if(!id) return

  const service=await fetchJson(`content/services/${id}.json`)
  renderService(service)

  document.querySelectorAll(".mode-button").forEach(b=>{
    b.onclick=()=>setMode(b.dataset.mode)
  })
}

loadIndexPage()
loadServicePage()
