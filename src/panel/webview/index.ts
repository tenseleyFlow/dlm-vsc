/** Webview entry point — vanilla TypeScript, no framework. */

declare function acquireVsCodeApi(): {
  postMessage(msg: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

const vscode = acquireVsCodeApi();

interface BaseModelSpec {
  key: string;
  params: number;
  size_gb_fp16: number;
  context_length: number;
  modality: string;
  license_spdx: string;
}

interface DocumentState {
  base_model?: string;
  base_model_spec?: BaseModelSpec | null;
  dlm_version?: number;
  section_counts?: Record<string, number>;
  error?: string;
}

let currentState: DocumentState | null = null;

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

// --- Base Model Summary ---
function renderBaseModelSummary() {
  const container = document.getElementById("base-model-summary")!;
  container.innerHTML = "";

  if (currentState?.base_model) {
    const card = document.createElement("div");
    card.className = "summary-card";
    const spec = currentState.base_model_spec;
    if (spec) {
      card.innerHTML = `
        <div class="key">${spec.key}</div>
        <div class="detail">
          ${formatParams(spec.params)} &middot; ${spec.size_gb_fp16.toFixed(1)} GB &middot;
          ctx ${spec.context_length}
          ${spec.modality !== "text" ? ` &middot; <span class="badge">${spec.modality}</span>` : ""}
        </div>
        <div class="detail">${spec.license_spdx}</div>
      `;
    } else {
      card.innerHTML = `<div class="key">${currentState.base_model}</div>
        <div class="detail">Custom HF model</div>`;
    }
    container.appendChild(card);
  } else {
    const empty = document.createElement("div");
    empty.className = "detail";
    empty.textContent = "No base model set";
    container.appendChild(empty);
  }

  const btn = document.createElement("button");
  btn.textContent = "Change Base Model...";
  btn.className = "secondary";
  btn.addEventListener("click", () => {
    vscode.postMessage({ type: "pickBaseModel" });
  });
  container.appendChild(btn);
}

// --- Template Actions ---
function renderTemplateActions() {
  const container = document.getElementById("template-actions")!;
  container.innerHTML = "";
  const btn = document.createElement("button");
  btn.textContent = "New from Template...";
  btn.className = "secondary";
  btn.addEventListener("click", () => {
    vscode.postMessage({ type: "pickTemplate" });
  });
  container.appendChild(btn);
}

// --- Document Overview ---
function renderOverview() {
  const container = document.getElementById("overview")!;
  if (!currentState || currentState.error) {
    container.innerHTML = currentState?.error
      ? `<div style="color:var(--vscode-errorForeground)">Parse error</div>`
      : "";
    return;
  }
  const counts = currentState.section_counts || {};
  container.innerHTML = `
    <h2>Document</h2>
    <div class="overview-row">
      <span class="overview-label">Schema</span>
      <span>v${currentState.dlm_version || "?"}</span>
    </div>
    <div class="overview-row">
      <span class="overview-label">Sections</span>
      <span>
        ${Object.entries(counts)
          .map(([k, v]) => `${k}: ${v}`)
          .join(" &middot; ")}
      </span>
    </div>
  `;
}

// --- Training Controls ---
function renderTrainingControls() {
  const container = document.getElementById("training-controls")!;
  container.innerHTML = "";
  const btn = document.createElement("button");
  btn.textContent = "Train";
  btn.addEventListener("click", () => {
    vscode.postMessage({ type: "runTrain" });
  });
  container.appendChild(btn);
}

// --- Helpers ---
function formatParams(params: number): string {
  if (params >= 1_000_000_000)
    return `${(params / 1_000_000_000).toFixed(1)}B`;
  if (params >= 1_000_000) return `${Math.round(params / 1_000_000)}M`;
  return `${Math.round(params / 1_000)}K`;
}

// --- Message handler ---
window.addEventListener("message", (event) => {
  const msg = event.data;
  switch (msg.type) {
    case "documentState":
      currentState = msg.data;
      renderOverview();
      renderBaseModelSummary();
      break;
  }
});

// --- Init ---
renderQuickInsert();
renderSourceManager();
renderBaseModelSummary();
renderTemplateActions();
renderTrainingControls();
renderOverview();
