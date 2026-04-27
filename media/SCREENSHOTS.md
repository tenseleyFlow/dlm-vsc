# Screenshots to capture before marketplace publish

The marketplace README references these images. Capture each one in VSCode's Extension Development Host (F5) and save as a PNG with the exact filename below.

| File              | What to show                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| `overview.png`    | Editor with a `.dlm` file open + DLM side panel visible. Hero shot.                                   |
| `syntax.png`      | Close-up of frontmatter + an `::instruction::` block with Q/A headers. Highlight the fence colors.    |
| `completions.png` | Completion popup open on a `base_model:` line, showing several registry keys.                        |
| `hover.png`       | Hover tooltip over a base-model key showing params/VRAM/context/license.                             |
| `diagnostics.png` | Inline red squiggles on a malformed frontmatter field with the diagnostic tooltip visible.            |
| `side-panel.png`  | DLM side panel expanded, ideally showing the Quick-Insert buttons + a few sources + the model browser.|

Suggested capture settings:
- Window size ~1400x900, theme: Dark+ (default)
- Crop tightly to the relevant region for feature shots; full window for `overview.png` and `side-panel.png`
- Save as PNG, no compression artifacts. Aim for 1200–1800 px wide.
