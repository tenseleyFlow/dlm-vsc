/** Webview entry point — vanilla TypeScript, no framework. */

declare function acquireVsCodeApi(): {
  postMessage(msg: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

const vscode = acquireVsCodeApi();

interface BaseModelEntry {
  key: string;
  hf_id: string;
  params: number;
  size_gb_fp16: number;
  context_length: number;
  modality: string;
  license_spdx: string;
  requires_acceptance: boolean;
}

interface TemplateEntry {
  name: string;
  title: string;
  domain_tags: string[];
  recommended_base: string;
  summary: string;
}

let baseModels: BaseModelEntry[] = [];
let templates: TemplateEntry[] = [];

// --- Quick Insert ---
function renderQuickInsert() {
  const container = document.getElementById("quick-insert")!;
  const sections: Array<{ label: string; type: string }> = [
    { label: "Add Instruction (Q&A)", type: "instruction" },
    { label: "Add Preference (DPO)", type: "preference" },
    { label: "Add Image", type: "image" },
    { label: "Add Audio", type: "audio" },
  ];
  container.innerHTML = "";
  for (const s of sections) {
    const btn = document.createElement("button");
    btn.textContent = s.label;
    btn.addEventListener("click", () => {
      vscode.postMessage({ type: "quickInsert", sectionType: s.type });
    });
    container.appendChild(btn);
  }
}

// --- Source Manager ---
function renderSourceManager() {
  const container = document.getElementById("source-manager")!;
  container.innerHTML = "";
  const btn = document.createElement("button");
  btn.textContent = "Add Source Directory...";
  btn.className = "secondary";
  btn.addEventListener("click", () => {
    vscode.postMessage({ type: "addSource" });
  });
  container.appendChild(btn);
}

// --- Base Models ---
function renderBaseModels(filter: string = "") {
  const container = document.getElementById("base-models")!;
  container.innerHTML = "";

  const search = document.createElement("input");
  search.id = "search";
  search.type = "text";
  search.placeholder = "Search models...";
  search.value = filter;
  search.addEventListener("input", () => {
    renderBaseModelCards(container, search.value);
  });
  container.appendChild(search);

  renderBaseModelCards(container, filter);
}

function renderBaseModelCards(container: HTMLElement, filter: string) {
  const existing = container.querySelectorAll(".model-card");
  existing.forEach((el) => el.remove());

  const lowerFilter = filter.toLowerCase();
  const filtered = baseModels.filter(
    (m) =>
      m.key.toLowerCase().includes(lowerFilter) ||
      m.modality.toLowerCase().includes(lowerFilter)
  );

  for (const m of filtered) {
    const card = document.createElement("div");
    card.className = "model-card";
    card.innerHTML = `
      <div class="key">${m.key}</div>
      <div class="detail">
        ${formatParams(m.params)} &middot; ${m.size_gb_fp16.toFixed(1)} GB &middot;
        ctx ${m.context_length}
        ${m.modality !== "text" ? ` &middot; <span class="badge">${m.modality}</span>` : ""}
      </div>
      <div class="detail">${m.license_spdx}${m.requires_acceptance ? " (gated)" : ""}</div>
    `;
    card.addEventListener("click", () => {
      vscode.postMessage({ type: "setBaseModel", key: m.key });
    });
    container.appendChild(card);
  }
}

// --- Templates ---
function renderTemplates() {
  const container = document.getElementById("templates")!;
  container.innerHTML = "";
  for (const t of templates) {
    const card = document.createElement("div");
    card.className = "model-card";
    card.innerHTML = `
      <div class="key">${t.title}</div>
      <div class="detail">${t.summary}</div>
      <div class="detail">
        ${t.domain_tags.map((tag) => `<span class="badge">${tag}</span>`).join(" ")}
      </div>
    `;
    card.addEventListener("click", () => {
      vscode.postMessage({ type: "useTemplate", templateName: t.name });
    });
    container.appendChild(card);
  }
}

// --- Document Overview ---
function renderOverview(data: Record<string, unknown> | null) {
  const container = document.getElementById("overview")!;
  if (!data || data.error) {
    container.innerHTML = data?.error
      ? `<div style="color:var(--vscode-errorForeground)">Parse error</div>`
      : "";
    return;
  }
  const counts = (data.section_counts as Record<string, number>) || {};
  const spec = data.base_model_spec as BaseModelEntry | null;
  container.innerHTML = `
    <h2>Document</h2>
    <div class="overview-row">
      <span class="overview-label">Base model</span>
      <span>${data.base_model || "—"}${spec ? ` (${formatParams(spec.params)})` : ""}</span>
    </div>
    <div class="overview-row">
      <span class="overview-label">Schema</span>
      <span>v${data.dlm_version || "?"}</span>
    </div>
    <div id="section-counts" class="overview-row">
      <span class="overview-label">Sections</span>
      <span>
        ${Object.entries(counts)
          .map(([k, v]) => `${k}: ${v}`)
          .join(" · ")}
      </span>
    </div>
  `;
}

// --- Training Controls ---
function renderTrainingControls() {
  const container = document.getElementById("training-controls")!;
  container.innerHTML = "";
  const btn = document.createElement("button");
  btn.textContent = "Train (watch mode)";
  btn.addEventListener("click", () => {
    vscode.postMessage({ type: "runTrain" });
  });
  container.appendChild(btn);
}

// --- Helpers ---
function formatParams(params: number): string {
  if (params >= 1_000_000_000) return `${(params / 1_000_000_000).toFixed(1)}B`;
  if (params >= 1_000_000) return `${Math.round(params / 1_000_000)}M`;
  return `${Math.round(params / 1_000)}K`;
}

// --- Message handler ---
window.addEventListener("message", (event) => {
  const msg = event.data;
  switch (msg.type) {
    case "baseModels":
      baseModels = msg.data || [];
      renderBaseModels();
      break;
    case "templates":
      templates = msg.data || [];
      renderTemplates();
      break;
    case "documentState":
      renderOverview(msg.data);
      break;
  }
});

// --- Init ---
renderQuickInsert();
renderSourceManager();
renderBaseModels();
renderTemplates();
renderTrainingControls();
renderOverview(null);
