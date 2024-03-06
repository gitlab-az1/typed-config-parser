export type Doc = Record<string, string | number | Record<string, string | number>>


export type SchemaValue = ['string' | 'email' | 'url' | 'hex' | 'number' | 'boolean' | 'array' | 'section-header' | string[], boolean];
export type Schema = Record<string, SchemaValue | Record<string, SchemaValue>>;

