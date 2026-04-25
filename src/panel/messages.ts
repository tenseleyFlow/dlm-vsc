/** Typed message protocol between extension host and webview. */

export type WebviewMessage =
  | { type: "quickInsert"; sectionType: "instruction" | "preference" | "image" | "audio" }
  | { type: "addSource" }
  | { type: "setBaseModel"; key: string }
  | { type: "useTemplate"; templateName: string }
  | { type: "runTrain" }
  | { type: "stopTrain" }
  | { type: "requestState" };

export interface BaseModelEntry {
  key: string;
  hf_id: string;
  params: number;
  size_gb_fp16: number;
  context_length: number;
  modality: string;
  license_spdx: string;
  requires_acceptance: boolean;
}

export interface TemplateEntry {
  name: string;
  title: string;
  domain_tags: string[];
  recommended_base: string;
  summary: string;
  sample_prompts: string[];
}

export interface DocumentStatePayload {
  uri: string;
  dlm_id?: string;
  dlm_version?: number;
  base_model?: string;
  base_model_spec?: BaseModelEntry | null;
  section_counts?: Record<string, number>;
  error?: string;
}

export type ExtensionMessage =
  | { type: "documentState"; data: DocumentStatePayload }
  | { type: "baseModels"; data: BaseModelEntry[] }
  | { type: "templates"; data: TemplateEntry[] }
  | { type: "trainingProgress"; data: { step: number; total_steps: number; loss?: number } };
