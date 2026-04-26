---
dlm_id: 01KPQ9M3000000000000000000
dlm_version: 15
base_model: qwen3-1.7b
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

::preference::
### Prompt
Explain LoRA in one sentence.

### Chosen
LoRA adds small trainable matrices to frozen model layers, enabling efficient fine-tuning.

### Rejected
LoRA is a method for training language models that involves modifying the architecture of the model by introducing additional parameters in the form of low-rank decomposition matrices that are applied to the attention weight matrices, which allows for parameter-efficient fine-tuning while keeping the original pre-trained weights frozen.
