import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
} from "vscode-languageclient/node";

export function createLspClient(lspPath: string): LanguageClient {
  const serverOptions: ServerOptions = {
    command: lspPath,
    args: [],
    options: { shell: false },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "dlm" }],
  };

  return new LanguageClient("dlm-lsp", "DLM Language Server", serverOptions, clientOptions);
}
