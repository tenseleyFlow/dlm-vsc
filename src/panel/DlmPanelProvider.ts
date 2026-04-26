import * as vscode from "vscode";
import * as path from "path";
import { insertSection } from "../snippets";
import type { LanguageClient } from "vscode-languageclient/node";
import type { BaseModelEntry, TemplateEntry, WebviewMessage } from "./messages";

export class DlmPanelProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _baseModels: BaseModelEntry[] = [];
  private _templates: TemplateEntry[] = [];

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _client: LanguageClient
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((msg: WebviewMessage) => {
      this._handleMessage(msg);
    });

    this._fetchRegistryData();
    this._pushDocumentState();
  }

  private async _handleMessage(msg: WebviewMessage) {
    switch (msg.type) {
      case "quickInsert":
        insertSection(msg.sectionType);
        break;

      case "addSource":
        await this._addSourceDirectory();
        break;

      case "pickBaseModel":
        await this._showBaseModelPicker();
        break;

      case "pickTemplate":
        await this._showTemplatePicker();
        break;

      case "runTrain":
        vscode.commands.executeCommand("dlm.train");
        break;

      case "stopTrain":
        vscode.window.showInformationMessage(
          "Use Ctrl+C in the terminal to stop training."
        );
        break;

      case "requestState":
        this._pushDocumentState();
        break;
    }
  }

  private async _showBaseModelPicker() {
    if (this._baseModels.length === 0) {
      await this._fetchRegistryData();
    }

    const items: vscode.QuickPickItem[] = this._baseModels.map((m) => ({
      label: m.key,
      description: `${formatParams(m.params)} · ${m.size_gb_fp16.toFixed(1)} GB · ctx ${m.context_length}`,
      detail: `${m.hf_id} · ${m.license_spdx}${m.requires_acceptance ? " (gated)" : ""}${m.modality !== "text" ? ` · ${m.modality}` : ""}`,
    }));

    const picked = await vscode.window.showQuickPick(items, {
      placeHolder: "Select a base model",
      matchOnDescription: true,
      matchOnDetail: true,
    });

    if (!picked) return;

    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== "dlm") return;

    await this._client.sendRequest("workspace/executeCommand", {
      command: "dlm.setBaseModel",
      arguments: [editor.document.uri.toString(), picked.label],
    });

    this._pushDocumentState();
  }

  private async _showTemplatePicker() {
    if (this._templates.length === 0) {
      await this._fetchRegistryData();
    }

    const items: vscode.QuickPickItem[] = this._templates.map((t) => ({
      label: t.title,
      description: t.domain_tags.join(", "),
      detail: t.summary,
    }));

    const picked = await vscode.window.showQuickPick(items, {
      placeHolder: "Select a starter template",
      matchOnDescription: true,
      matchOnDetail: true,
    });

    if (!picked) return;

    const template = this._templates.find((t) => t.title === picked.label);
    if (!template) return;

    const saveUri = await vscode.window.showSaveDialog({
      filters: { "DLM Document": ["dlm"] },
      saveLabel: "Create .dlm",
    });

    if (!saveUri) return;

    const terminal = vscode.window.createTerminal("dlm init");
    terminal.sendText(
      `dlm init ${saveUri.fsPath} --template ${template.name}`
    );
    terminal.show();
  }

  private async _addSourceDirectory() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== "dlm") {
      vscode.window.showWarningMessage("Open a .dlm file first.");
      return;
    }

    const uris = await vscode.window.showOpenDialog({
      canSelectFolders: true,
      canSelectFiles: false,
      canSelectMany: false,
      openLabel: "Select Source Directory",
      defaultUri: vscode.Uri.file(path.dirname(editor.document.uri.fsPath)),
    });

    if (!uris || uris.length === 0) return;

    const dlmDir = path.dirname(editor.document.uri.fsPath);
    const relativePath = path.relative(dlmDir, uris[0].fsPath);

    if (relativePath.startsWith("../..")) {
      const proceed = await vscode.window.showWarningMessage(
        "This path is outside the .dlm's directory tree. Under sources_policy: strict, it would be rejected at train time.",
        "Insert anyway",
        "Cancel"
      );
      if (proceed !== "Insert anyway") return;
    }

    await this._client.sendRequest("workspace/executeCommand", {
      command: "dlm.addSourceDirective",
      arguments: [editor.document.uri.toString(), relativePath],
    });
  }

  private async _fetchRegistryData() {
    try {
      const models = (await this._client.sendRequest(
        "workspace/executeCommand",
        { command: "dlm/listBaseModels", arguments: [] }
      )) as BaseModelEntry[] | null;
      if (models) this._baseModels = models;
    } catch {
      /* LSP not ready */
    }

    try {
      const templates = (await this._client.sendRequest(
        "workspace/executeCommand",
        { command: "dlm/listTemplates", arguments: [] }
      )) as TemplateEntry[] | null;
      if (templates) this._templates = templates;
    } catch {
      /* LSP not ready */
    }
  }

  private async _pushDocumentState() {
    if (!this._view) return;

    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== "dlm") return;

    try {
      const state = await this._client.sendRequest(
        "workspace/executeCommand",
        {
          command: "dlm/documentState",
          arguments: [editor.document.uri.toString()],
        }
      );
      this._view.webview.postMessage({ type: "documentState", data: state });
    } catch {
      /* LSP not ready */
    }
  }

  private _getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "panel.js")
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      padding: 8px;
      margin: 0;
    }
    h2 {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--vscode-sideBarSectionHeader-foreground);
      margin: 12px 0 6px;
      border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border);
      padding-bottom: 4px;
    }
    button {
      display: block;
      width: 100%;
      padding: 6px 10px;
      margin: 3px 0;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
      text-align: left;
    }
    button:hover {
      background: var(--vscode-button-hoverBackground);
    }
    button.secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    .badge {
      display: inline-block;
      padding: 1px 5px;
      border-radius: 2px;
      font-size: 10px;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
    }
    .overview-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
      font-size: 12px;
    }
    .overview-label { color: var(--vscode-descriptionForeground); }
    .summary-card {
      padding: 6px 8px;
      margin: 3px 0;
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-widget-border);
      border-radius: 3px;
      font-size: 11px;
    }
    .summary-card .key { font-weight: 600; }
    .summary-card .detail { color: var(--vscode-descriptionForeground); }
  </style>
</head>
<body>
  <div id="overview"></div>
  <h2>Quick Insert</h2>
  <div id="quick-insert"></div>
  <h2>Source Directories</h2>
  <div id="source-manager"></div>
  <h2>Base Model</h2>
  <div id="base-model-summary"></div>
  <h2>Templates</h2>
  <div id="template-actions"></div>
  <h2>Training</h2>
  <div id="training-controls"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function formatParams(params: number): string {
  if (params >= 1_000_000_000)
    return `${(params / 1_000_000_000).toFixed(1)}B`;
  if (params >= 1_000_000) return `${Math.round(params / 1_000_000)}M`;
  return `${Math.round(params / 1_000)}K`;
}
