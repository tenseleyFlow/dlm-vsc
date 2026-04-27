"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const FIXTURE_DIR = path.resolve(__dirname, "../../test/fixtures");
const SAMPLE_DLM = path.join(FIXTURE_DIR, "sample.dlm");
suite("Extension Activation", () => {
    test("extension is present in the registry", () => {
        const ext = vscode.extensions.getExtension("tenseleyFlow.dlm-vsc");
        // In dev mode the publisher may not match; check by scanning all extensions
        const all = vscode.extensions.all.map((e) => e.id);
        // The extension ID in dev is just the package name without publisher
        assert.ok(all.some((id) => id.includes("dlm-vsc")), `dlm-vsc not found in extensions: ${all.join(", ")}`);
    });
    test("dlm language is registered", () => {
        // Opening a .dlm file should associate with our language
        const langs = vscode.extensions.all
            .flatMap((e) => {
            const langs = e.packageJSON?.contributes?.languages;
            return Array.isArray(langs) ? langs : [];
        })
            .filter((l) => l.id === "dlm");
        assert.ok(langs.length > 0, "dlm language not registered by any extension");
    });
    test("extension activates when opening a .dlm file", async () => {
        const doc = await vscode.workspace.openTextDocument(SAMPLE_DLM);
        await vscode.window.showTextDocument(doc);
        // Give the extension a moment to activate
        await sleep(2000);
        const editor = vscode.window.activeTextEditor;
        assert.ok(editor, "no active editor after opening .dlm file");
        assert.strictEqual(editor.document.languageId, "dlm");
    });
});
suite("Command Registration", () => {
    const EXPECTED_COMMANDS = [
        "dlm.train",
        "dlm.export",
        "dlm.synth",
        "dlm.showHistory",
        "dlm.openStore",
        "dlm.insertInstruction",
        "dlm.insertPreference",
    ];
    test("all 7 DLM commands are registered", async () => {
        const allCommands = await vscode.commands.getCommands(true);
        for (const cmd of EXPECTED_COMMANDS) {
            assert.ok(allCommands.includes(cmd), `command ${cmd} not registered`);
        }
    });
});
suite("Language Configuration", () => {
    test(".dlm files get dlm languageId", async () => {
        const doc = await vscode.workspace.openTextDocument(SAMPLE_DLM);
        assert.strictEqual(doc.languageId, "dlm");
    });
    test("non-.dlm files do not get dlm languageId", async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: "hello world",
            language: "plaintext",
        });
        assert.notStrictEqual(doc.languageId, "dlm");
    });
});
suite("Document Content", () => {
    test("sample fixture has valid frontmatter", async () => {
        const doc = await vscode.workspace.openTextDocument(SAMPLE_DLM);
        const text = doc.getText();
        assert.ok(text.startsWith("---"), "file does not start with ---");
        assert.ok(text.includes("dlm_id:"), "missing dlm_id");
        assert.ok(text.includes("base_model:"), "missing base_model");
        assert.ok(text.includes("dlm_version:"), "missing dlm_version");
        // Count frontmatter delimiters
        const lines = text.split("\n");
        const delimCount = lines.filter((l) => l.trim() === "---").length;
        assert.ok(delimCount >= 2, `expected at least 2 --- delimiters, got ${delimCount}`);
    });
    test("sample fixture has instruction sections", async () => {
        const doc = await vscode.workspace.openTextDocument(SAMPLE_DLM);
        const text = doc.getText();
        const fences = text.split("\n").filter((l) => l.trim().startsWith("::instruction::"));
        assert.ok(fences.length >= 2, `expected at least 2 instruction fences, got ${fences.length}`);
    });
});
suite("Edge Cases", () => {
    test("commands warn when no .dlm file is open", async () => {
        // Open a non-.dlm file
        const doc = await vscode.workspace.openTextDocument({
            content: "not a dlm file",
            language: "plaintext",
        });
        await vscode.window.showTextDocument(doc);
        // These should not throw — they show a warning message instead
        await vscode.commands.executeCommand("dlm.train");
        await vscode.commands.executeCommand("dlm.export");
        await vscode.commands.executeCommand("dlm.synth");
        await vscode.commands.executeCommand("dlm.insertInstruction");
    });
    test("commands handle no active editor gracefully", async () => {
        // Close all editors
        await vscode.commands.executeCommand("workbench.action.closeAllEditors");
        // These should not throw
        await vscode.commands.executeCommand("dlm.train");
        await vscode.commands.executeCommand("dlm.insertInstruction");
    });
    test("opening an empty file with .dlm extension", async () => {
        const emptyUri = vscode.Uri.file(path.join(FIXTURE_DIR, "empty.dlm"));
        try {
            // Create a temporary empty .dlm
            await vscode.workspace.fs.writeFile(emptyUri, Buffer.from(""));
            const doc = await vscode.workspace.openTextDocument(emptyUri);
            assert.strictEqual(doc.languageId, "dlm");
            assert.strictEqual(doc.getText(), "");
        }
        finally {
            try {
                await vscode.workspace.fs.delete(emptyUri);
            }
            catch {
                /* cleanup best-effort */
            }
        }
    });
    test("opening a .dlm with invalid frontmatter does not crash", async () => {
        const badUri = vscode.Uri.file(path.join(FIXTURE_DIR, "bad.dlm"));
        try {
            await vscode.workspace.fs.writeFile(badUri, Buffer.from("not valid frontmatter\njust plain text\n"));
            const doc = await vscode.workspace.openTextDocument(badUri);
            await vscode.window.showTextDocument(doc);
            assert.strictEqual(doc.languageId, "dlm");
            // Extension should still be alive — commands should still be registered
            const cmds = await vscode.commands.getCommands(true);
            assert.ok(cmds.includes("dlm.train"));
        }
        finally {
            try {
                await vscode.workspace.fs.delete(badUri);
            }
            catch {
                /* cleanup best-effort */
            }
        }
    });
});
suite("Configuration", () => {
    test("dlm.command setting exists with default", () => {
        const config = vscode.workspace.getConfiguration("dlm");
        const cmd = config.get("command");
        assert.strictEqual(cmd, "uv run dlm");
    });
    test("dlm.lspPath setting exists with default", () => {
        const config = vscode.workspace.getConfiguration("dlm");
        const lsp = config.get("lspPath");
        assert.strictEqual(lsp, "dlm-lsp");
    });
    test("dlm.home setting exists and defaults to empty", () => {
        const config = vscode.workspace.getConfiguration("dlm");
        const home = config.get("home");
        assert.strictEqual(home, "");
    });
    test("dlm.watchOnSave setting exists and defaults to false", () => {
        const config = vscode.workspace.getConfiguration("dlm");
        const watch = config.get("watchOnSave");
        assert.strictEqual(watch, false);
    });
});
suite("Webview Provider", () => {
    test("DLM side panel view is registered", () => {
        // The view should be declared in the extension's contributes
        const ext = vscode.extensions.all.find((e) => e.id.includes("dlm-vsc"));
        if (ext) {
            const views = ext.packageJSON?.contributes?.views?.["dlm-panel"];
            assert.ok(Array.isArray(views), "dlm-panel views not declared");
            const panel = views.find((v) => v.id === "dlm.sidePanel");
            assert.ok(panel, "dlm.sidePanel view not found");
            assert.strictEqual(panel.type, "webview");
        }
    });
});
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=extension.test.js.map