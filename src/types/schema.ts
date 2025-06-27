// Schema.org types for JSON-LD structured data

export interface SchemaOrgBase {
  '@context': string;
  '@type': string;
  [key: string]: unknown;
}

export interface Article extends SchemaOrgBase {
  '@type': 'Article';
  headline: string;
  description: string;
  author: Person | Organization;
  datePublished?: string;
  dateModified?: string;
  url?: string;
  image?: string | ImageObject;
  publisher?: Person | Organization;
  mainEntityOfPage?: string;
  keywords?: string;
  articleSection?: string;
}

export interface Person extends SchemaOrgBase {
  '@type': 'Person';
  name: string;
  url?: string;
  image?: string | ImageObject;
  jobTitle?: string;
  worksFor?: Organization;
  sameAs?: string[];
  alumniOf?: EducationalOrganization;
  address?: PostalAddress;
  knowsAbout?: string[];
}

export interface Organization extends SchemaOrgBase {
  '@type': 'Organization';
  name: string;
  url?: string;
  logo?: string | ImageObject;
}

export interface EducationalOrganization extends SchemaOrgBase {
  '@type': 'EducationalOrganization';
  name: string;
}

export interface PostalAddress extends SchemaOrgBase {
  '@type': 'PostalAddress';
  addressLocality?: string;
  addressRegion?: string;
  addressCountry?: string;
  streetAddress?: string;
  postalCode?: string;
}

export interface ImageObject extends SchemaOrgBase {
  '@type': 'ImageObject';
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

export interface WebPage extends SchemaOrgBase {
  '@type': 'WebPage';
  name: string;
  description: string;
  url: string;
  author?: Person | Organization;
  publisher?: Person | Organization;
  datePublished?: string;
  dateModified?: string;
}

export interface BreadcrumbList extends SchemaOrgBase {
  '@type': 'BreadcrumbList';
  itemListElement: ListItem[];
}

export interface ListItem extends SchemaOrgBase {
  '@type': 'ListItem';
  position: number;
  name: string;
  item: string;
}

export interface FAQPage extends SchemaOrgBase {
  '@type': 'FAQPage';
  mainEntity: Question[];
}

export interface Question extends SchemaOrgBase {
  '@type': 'Question';
  name: string;
  acceptedAnswer: Answer;
}

export interface Answer extends SchemaOrgBase {
  '@type': 'Answer';
  text: string;
}

// Union type for all supported schema types
export type Schema = 
  | Article
  | Person
  | Organization
  | WebPage
  | BreadcrumbList
  | FAQPage
  | SchemaOrgBase;

// Type for JSON-LD data that can be single schema or array
export type JsonLdData = Schema | Schema[];
