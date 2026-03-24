(function () {
  const STORAGE_KEY = "fashion_tryon_api_base";

  const el = {
    apiBase: document.getElementById("apiBase"),
    btnSaveBase: document.getElementById("btnSaveBase"),
    btnHealth: document.getElementById("btnHealth"),
    btnProvider: document.getElementById("btnProvider"),
    outBackend: document.getElementById("outBackend"),
    btnLoadCatalog: document.getElementById("btnLoadCatalog"),
    btnFlipkartSearch: document.getElementById("btnFlipkartSearch"),
    flipkartQuery: document.getElementById("flipkartQuery"),
    catalogGrid: document.getElementById("catalogGrid"),
    catalogHint: document.getElementById("catalogHint"),
    fileDrop: document.getElementById("fileDrop"),
    fileInput: document.getElementById("fileInput"),
    previewWrap: document.getElementById("previewWrap"),
    preview: document.getElementById("preview"),
    stylePrompt: document.getElementById("stylePrompt"),
    category: document.getElementById("category"),
    btnGenerate: document.getElementById("btnGenerate"),
    statusLine: document.getElementById("statusLine"),
    resultCard: document.getElementById("resultCard"),
    resultImage: document.getElementById("resultImage"),
    productList: document.getElementById("productList"),
  };

  /** @type {File | null} */
  let selectedFile = null;

  /** @type {Record<string, unknown> | null} */
  let selectedCatalogProduct = null;

  function getApiBase() {
    const fromInput = el.apiBase.value.trim();
    if (fromInput) return fromInput.replace(/\/$/, "");
    if (window.location.protocol !== "file:") {
      return `${window.location.protocol}//${window.location.host}`;
    }
    return localStorage.getItem(STORAGE_KEY) || "http://127.0.0.1:8010";
  }

  function initApiBaseInput() {
    if (window.location.protocol !== "file:") {
      el.apiBase.value = `${window.location.protocol}//${window.location.host}`;
    } else {
      el.apiBase.value = localStorage.getItem(STORAGE_KEY) || "http://127.0.0.1:8010";
    }
  }

  function showBackend(data) {
    el.outBackend.hidden = false;
    el.outBackend.textContent =
      typeof data === "string" ? data : JSON.stringify(data, null, 2);
  }

  async function fetchJson(path, options) {
    const base = getApiBase();
    const res = await fetch(`${base}${path}`, options);
    const text = await res.text();
    let body;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.body = body;
      throw err;
    }
    return body;
  }

  function setStatus(msg, isError) {
    el.statusLine.textContent = msg || "";
    el.statusLine.classList.toggle("error", !!isError);
  }

  function renderCatalog(items) {
    selectedCatalogProduct = null;
    el.catalogGrid.innerHTML = "";
    if (!items || !items.length) {
      el.catalogHint.textContent = "No items for this category — try another or Flipkart search.";
      return;
    }
    items.forEach((p) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "catalog-tile";
      btn.innerHTML = `
        <img src="${escapeAttr(p.image_url)}" alt="" />
        <div class="cap">
          <span class="retail">${escapeHtml(p.retailer || "shop")}</span>
          <strong>${escapeHtml(p.title)}</strong>
          ${escapeHtml(p.currency || "INR")} ${p.price}
        </div>
      `;
      btn.addEventListener("click", () => {
        el.catalogGrid.querySelectorAll(".catalog-tile").forEach((t) => t.classList.remove("selected"));
        btn.classList.add("selected");
        selectedCatalogProduct = p;
        setStatus(`Selected outfit: ${p.title}`);
      });
      el.catalogGrid.appendChild(btn);
    });
    el.catalogHint.textContent = `${items.length} items — tap one to use its garment photo for try-on.`;
  }

  async function loadCatalog() {
    const cat = el.category.value;
    try {
      const items = await fetchJson(
        `/v1/catalog?category=${encodeURIComponent(cat)}&limit=20`
      );
      renderCatalog(items);
    } catch (e) {
      el.catalogHint.textContent = "Could not load catalog.";
      showBackend(e.body || e.message);
    }
  }

  async function searchFlipkart() {
    const q = el.flipkartQuery.value.trim();
    if (!q) {
      el.catalogHint.textContent = "Enter a Flipkart search keyword.";
      return;
    }
    try {
      const items = await fetchJson(
        `/v1/catalog/flipkart-search?q=${encodeURIComponent(q)}&limit=10`
      );
      renderCatalog(items);
      if (!items.length) {
        el.catalogHint.textContent = "No Flipkart results — verify affiliate keys in backend .env";
      }
    } catch (e) {
      const detail = e.body && (e.body.detail || e.body.message);
      el.catalogHint.textContent = detail || e.message || "Flipkart search failed.";
      showBackend(e.body || e.message);
    }
  }

  function onFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      setStatus("Please choose an image file.", true);
      return;
    }
    selectedFile = file;
    const url = URL.createObjectURL(file);
    el.preview.src = url;
    el.previewWrap.hidden = false;
    el.btnGenerate.disabled = false;
    setStatus("Ready to generate.");
  }

  el.btnSaveBase.addEventListener("click", () => {
    const v = el.apiBase.value.trim().replace(/\/$/, "");
    if (v) localStorage.setItem(STORAGE_KEY, v);
    setStatus("API base saved for file:// mode.");
  });

  el.btnHealth.addEventListener("click", async () => {
    try {
      const data = await fetchJson("/health");
      showBackend(data);
      setStatus("Health OK.");
    } catch (e) {
      showBackend(e.body || e.message);
      setStatus("Health request failed.", true);
    }
  });

  el.btnProvider.addEventListener("click", async () => {
    try {
      const data = await fetchJson("/v1/provider/status");
      showBackend(data);
      setStatus("Provider status loaded.");
    } catch (e) {
      showBackend(e.body || e.message);
      setStatus("Provider status failed.", true);
    }
  });

  el.btnLoadCatalog.addEventListener("click", () => loadCatalog());
  el.btnFlipkartSearch.addEventListener("click", () => searchFlipkart());
  el.category.addEventListener("change", () => loadCatalog());

  el.fileDrop.addEventListener("click", () => el.fileInput.click());
  el.fileInput.addEventListener("change", () => {
    const f = el.fileInput.files && el.fileInput.files[0];
    if (f) onFile(f);
  });

  ["dragenter", "dragover"].forEach((ev) => {
    el.fileDrop.addEventListener(ev, (e) => {
      e.preventDefault();
      el.fileDrop.classList.add("dragover");
    });
  });
  ["dragleave", "drop"].forEach((ev) => {
    el.fileDrop.addEventListener(ev, (e) => {
      e.preventDefault();
      el.fileDrop.classList.remove("dragover");
    });
  });
  el.fileDrop.addEventListener("drop", (e) => {
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) onFile(f);
  });

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function pollJob(jobId) {
    for (let i = 0; i < 45; i += 1) {
      const job = await fetchJson(`/v1/try-on/${jobId}`);
      setStatus(`Job: ${job.status}`);
      if (job.status === "completed" || job.status === "failed") return job;
      await sleep(1000);
    }
    throw new Error("Timed out waiting for try-on result.");
  }

  el.btnGenerate.addEventListener("click", async () => {
    if (!selectedFile) return;
    el.resultCard.hidden = true;
    el.btnGenerate.disabled = true;
    setStatus("Uploading image…");

    try {
      const base = getApiBase();
      const form = new FormData();
      form.append("image", selectedFile, selectedFile.name || "photo.jpg");

      const uploadRes = await fetch(`${base}/v1/try-on/upload`, {
        method: "POST",
        body: form,
      });
      const uploadText = await uploadRes.text();
      let uploadBody;
      try {
        uploadBody = uploadText ? JSON.parse(uploadText) : null;
      } catch {
        uploadBody = uploadText;
      }
      if (!uploadRes.ok) {
        throw Object.assign(new Error("Upload failed"), { body: uploadBody });
      }

      setStatus("Creating job…");
      const payload = {
        person_image_url: uploadBody.image_url,
        style_prompt: el.stylePrompt.value.trim() || "fashion try-on",
        category: el.category.value,
      };
      if (selectedCatalogProduct) {
        const p = selectedCatalogProduct;
        payload.selected_product = {
          id: p.id,
          title: p.title,
          brand: p.brand,
          price: p.price,
          currency: p.currency || "INR",
          image_url: p.image_url,
          purchase_url: p.purchase_url,
          retailer: p.retailer || null,
        };
      }

      const jobStart = await fetchJson("/v1/try-on/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setStatus("Generating…");
      const result = await pollJob(jobStart.job_id);

      if (result.status === "failed") {
        throw new Error(result.error_message || "Try-on failed");
      }

      el.resultImage.src = result.generated_image_url;
      el.productList.innerHTML = "";

      (result.products || []).forEach((p) => {
        const li = document.createElement("li");
        li.className = "product-item";
        li.innerHTML = `
          <img src="${escapeAttr(p.image_url)}" alt="" />
          <div class="product-meta">
            <strong>${escapeHtml(p.title)}</strong>
            <span>${escapeHtml([p.retailer, p.brand].filter(Boolean).join(" · "))} · ${escapeHtml(
              String(p.currency)
            )} ${p.price}</span>
          </div>
          <a href="${escapeAttr(p.purchase_url)}" target="_blank" rel="noopener noreferrer">Buy</a>
        `;
        el.productList.appendChild(li);
      });

      el.resultCard.hidden = false;
      setStatus("Done.");
    } catch (e) {
      const msg = e.body ? JSON.stringify(e.body, null, 2) : e.message;
      showBackend(msg);
      setStatus(e.message || "Something went wrong.", true);
    } finally {
      el.btnGenerate.disabled = !selectedFile;
    }
  });

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  initApiBaseInput();
  loadCatalog();
})();
