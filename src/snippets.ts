import * as vscode from "vscode";
import * as path from "path";

export type SectionType = "instruction" | "preference" | "image" | "audio";

const SECTION_SNIPPETS: Record<string, string> = {
  instruction: "::instruction::\n### Q\n${1:Question here}\n\n### A\n${2:Answer here}\n",
  preference:
    "::preference::\n### Prompt\n${1:Prompt here}\n\n### Chosen\n${2:Preferred response}\n\n### Rejected\n${3:Rejected response}\n",
};

export function insertSection(sectionType: SectionType) {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== "dlm") {
    vscode.window.showWarningMessage("Open a .dlm file first.");
    return;
  }

  if (sectionType === "image") {
    insertMediaSection(editor, "image");
    return;
  }
  if (sectionType === "audio") {
    insertMediaSection(editor, "audio");
    return;
  }

  const template = SECTION_SNIPPETS[sectionType];
  if (!template) return;

  const position = editor.selection.active;
  const insertLine = position.line + 1;
  const insertPos = new vscode.Position(insertLine, 0);
  editor.insertSnippet(new vscode.SnippetString("\n" + template), insertPos);
}

async function insertMediaSection(
  editor: vscode.TextEditor,
  mediaType: "image" | "audio"
) {
  const filters =
    mediaType === "image"
      ? { Images: ["png", "jpg", "jpeg", "gif", "webp"] }
      : { Audio: ["wav", "flac", "ogg", "mp3"] };

  const uris = await vscode.window.showOpenDialog({
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: false,
    filters,
    openLabel: `Select ${mediaType} file`,
  });

  if (!uris || uris.length === 0) return;

  const dlmDir = path.dirname(editor.document.uri.fsPath);
  const relativePath = path.relative(dlmDir, uris[0].fsPath);

  const position = editor.selection.active;
  const insertLine = position.line + 1;
  const insertPos = new vscode.Position(insertLine, 0);

  const template =
    mediaType === "image"
      ? `\n::image path="${relativePath}" alt="\${1:alt text}"::\n\${2:Optional caption}\n`
      : `\n::audio path="${relativePath}" transcript="\${1:transcript}"::\n\${2:Optional caption}\n`;

  editor.insertSnippet(new vscode.SnippetString(template), insertPos);
}
