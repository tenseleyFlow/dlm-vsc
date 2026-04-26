import * as vscode from "vscode";
import { insertSection } from "../snippets";

export function registerCommands(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("dlm.train", () => {
      runDlmInTerminal("train");
    }),
    vscode.commands.registerCommand("dlm.export", () => {
      runDlmInTerminal("export");
    }),
    vscode.commands.registerCommand("dlm.synth", () => {
      runDlmInTerminal("synth", "instructions");
    }),
    vscode.commands.registerCommand("dlm.showHistory", () => {
      runDlmInTerminal("metrics");
    }),
    vscode.commands.registerCommand("dlm.openStore", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== "dlm") {
        vscode.window.showWarningMessage("Open a .dlm file first.");
        return;
      }
      const home = vscode.workspace.getConfiguration("dlm").get<string>("home", "");
      const homeArg = home ? `--home ${home} ` : "";
      const terminal = vscode.window.createTerminal("dlm show");
      terminal.sendText(`dlm ${homeArg}show ${editor.document.uri.fsPath}`);
      terminal.show();
    }),
    vscode.commands.registerCommand("dlm.insertInstruction", () => {
      insertSection("instruction");
    }),
    vscode.commands.registerCommand("dlm.insertPreference", () => {
      insertSection("preference");
    })
  );
}

function runDlmInTerminal(...args: string[]) {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== "dlm") {
    vscode.window.showWarningMessage("Open a .dlm file first.");
    return;
  }
  const path = editor.document.uri.fsPath;
  const home = vscode.workspace.getConfiguration("dlm").get<string>("home", "");
  const homeArg = home ? `--home ${home} ` : "";
  const terminal = vscode.window.createTerminal(`dlm ${args[0]}`);
  terminal.sendText(`dlm ${homeArg}${args.join(" ")} ${path}`);
  terminal.show();
}
