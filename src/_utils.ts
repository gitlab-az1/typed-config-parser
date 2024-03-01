export function applyAliases(object: Record<string, any>, aliases: Record<string, string>): Record<string, any> {
  for(const prop in object) {
    if(typeof object[prop] === 'object') {
      object[prop] = applyAliases(object[prop], aliases);
    }

    if(!(prop in aliases)) continue;

    object[aliases[prop]] = object[prop];
    delete object[prop];
  }

  return object;
}
