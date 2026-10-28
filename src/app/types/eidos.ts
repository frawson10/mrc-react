export type Language = "en" | "es";

export interface EidosPageSettings {
  showMenu?: boolean;
  showFooter?: boolean;
  menuOrder?: number;
  linkType?: "internal" | "external";
  externalUrl?: string;
  [key: string]: unknown;
}

export interface EidosField {
  label?: string;
  type?: string;
  description?: string;
  settings?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export interface EidosBlock {
  nickname?: string;
  type: string;
  description?: string;
  settings?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export interface EidosPage {
  title?: string;
  description?: string;
  keywords?: string[] | string;
  url?: string;
  settings?: EidosPageSettings;
  seo?: Record<string, unknown>;
  content?: EidosBlock[];
  [key: string]: unknown;
}

export type EidosPageMap = Record<string, EidosPage>;

export interface EidosSiteData {
  pages: EidosPageMap;
  settings: Record<string, unknown>;
  commitSha?: string;
}

export interface LoadedSiteData {
  siteData: EidosSiteData;
  source: "bundled" | "preview";
}

export interface ActionLink {
  kind: "internal" | "external";
  href: string;
  label: string;
}
