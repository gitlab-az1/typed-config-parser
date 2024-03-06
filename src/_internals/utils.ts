export function applyAliases<K extends string | number | symbol = string, AliasKey extends string | number | symbol = string>(
  object: Record<K, any>,
  aliases: Record<K, AliasKey>): Record<AliasKey, any> {
  for(const prop in object) {
    if(typeof object[prop] === 'object') {
      object[prop] = applyAliases(object[prop], aliases);
    }

    if(!(prop in aliases)) continue;

    (object as Record<any, any>)[aliases[prop]] = object[prop];
    delete object[prop];
  }

  return object as any;
}


const kindOf = (cache => (thing: any) => {
  const str = Object.prototype.toString.call(thing);
  return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
})(Object.create(null));

export function isPlainObject(val: any): boolean {
  if(Array.isArray(val)) return false;
  if(kindOf(val) !== 'object' || typeof val !== 'object') return false;

  const prototype = Object.getPrototypeOf(val);
  return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in val) && !(Symbol.iterator in val);
}
