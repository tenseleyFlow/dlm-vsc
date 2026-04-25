# dlm-vsc

VSCode extension for `.dlm` document authoring.

## Features

- **Syntax highlighting** for `.dlm` files (YAML frontmatter + markdown body + section fences)
- **Completions** for base models, adapter types, quantization levels, and section fences
- **Hover info** showing base model specs and section metadata
- **Diagnostics** for schema errors, unknown base models, and doctor warnings
- **Side panel** with:
  - Quick-insert palette for instruction, preference, image, and audio sections
  - Source directory picker with native file dialog
  - Searchable base model browser (click to set)
  - Template gallery for bootstrapping new documents
  - Training controls (run/stop with watch mode)

## Requirements

- [dlm](https://github.com/tenseleyFlow/DocumentLanguageModel) CLI installed
- [dlm-lsp](https://github.com/tenseleyFlow/dlm-lsp) language server: `pip install dlm-lsp`

## Development

```bash
npm install
npm run build
# Press F5 in VSCode to launch Extension Development Host
```
