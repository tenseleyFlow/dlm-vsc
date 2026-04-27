# Changelog

All notable changes to the DLM VSCode extension will be documented in this file.

## [0.1.0] — Initial release

First public release.

- TextMate grammar for `.dlm` (YAML frontmatter + markdown body + section fences)
- LSP client wired to `dlm-lsp` (completions, hover, diagnostics, code actions)
- Activity-bar side panel with quick-insert palette, source directory manager, base model browser, template gallery, document overview, and training controls
- Commands: `train`, `export`, `synth`, `showHistory`, `openStore`, `insertInstruction`, `insertPreference`
- Configurable `dlm.command`, `dlm.home`, `dlm.defaultBase`, `dlm.watchOnSave`, `dlm.lspPath`
- Transparent store creation on document open
