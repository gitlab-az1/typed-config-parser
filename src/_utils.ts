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
