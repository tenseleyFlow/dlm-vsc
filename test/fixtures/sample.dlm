---
dlm_id: 01KQ46YWFCW4EAVC0K638ZAFD8
dlm_version: 15
base_model: qwen3-1.7b-thinking
training:
  adapter: lora
  lora_r: 16
  learning_rate: 2e-4
  num_epochs: 3
---
# Sample Document

This is a sample DLM document for testing the VSCode extension.

::instruction::
### Q
What is a Document Language Model?

### A
A .dlm file is a single UTF-8 text file that becomes a local, reproducible,
trainable LLM. Edit the document, retrain, share.

::instruction::
### Q
How do you train a DLM?

### A
Run `dlm train your-file.dlm` and the adapter trains on the document content.

::instruction::
### Q
What is LoRA?

### A
LoRA adds small trainable matrices to frozen model layers, enabling efficient fine-tuning without modifying the full model weights.
