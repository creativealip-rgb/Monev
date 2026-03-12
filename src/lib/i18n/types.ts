import { id } from "./locales/id";

export type Locale = "id" | "en";
export type TranslationKey = keyof typeof id;

export interface I18nContextType {
    locale: Locale;
    t: (key: string, params?: Record<string, string | number>) => string;
    setLocale: (locale: Locale) => void;
}
