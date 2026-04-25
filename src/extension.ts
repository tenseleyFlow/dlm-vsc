import * as vscode from "vscode";
import { createLspClient } from "./lspClient";
import { registerCommands } from "./commands/index";
import { DlmPanelProvider } from "./panel/DlmPanelProvider";

import type { LanguageClient } from "vscode-languageclient/node";

let client: LanguageClient | undefined;

export async function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration("dlm");
  const lspPath = config.get<string>("lspPath", "dlm-lsp");

  client = createLspClient(lspPath);
  await client.start();

  const panelProvider = new DlmPanelProvider(context.extensionUri, client);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("dlm.sidePanel", panelProvider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );

  registerCommands(context);
}

export async function deactivate() {
  if (client) {
    await client.stop();
    client = undefined;
  }
}
