export type Locale = "en" | "id";
export type Localized = Record<Locale, string>;
export type Value = string | number | boolean | string[] | null;
export type Values = Record<string, Value>;

export interface FieldDefinition {
  key: string;
  label: Localized;
  type: string;
  default: Value;
  required?: boolean;
  min?: number;
  max?: number;
  options?: { value: string; label: Localized }[];
}

export interface FormSchema {
  title: Localized;
  reference: string;
  groups: { title: Localized; fields: FieldDefinition[] }[];
}

export interface CardDefinition {
  title: Localized;
  copy: Localized;
  href: string;
  action: Localized;
  extra: boolean;
}

export interface Content {
  ui: Record<string, Localized>;
  navigation: { key: string; href: string; label: Localized; hidden?: boolean }[];
  modules: Record<string, { title: Localized; copy: Localized; action?: Localized }>;
  cards: Record<string, CardDefinition[]>;
  statuses: Record<string, Localized>;
}
