import data from "../app/content.json";
import type { Content } from "./types";

// Temporary local contract. Replace with generated shared-schema types when
// the backend team supplies the canonical OpenAPI / JSON Schema package.
export const content = data as Content;
