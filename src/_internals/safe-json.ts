import { isPlainObject } from './utils';
import { Either, left, right } from './Either';


/**
 * Safely parse JSON data
 * 
 * @param {string} data A JSON string 
 * @returns {*} The parsed data or null if an error occurred
 */
export function jsonSafeParser<T>(data: string): Either<Error, T> {
  try {
    const d = JSON.parse(data);
    return right(d);
  } catch (err: any) {
    return left(err instanceof Error ? err : new Error(err.message));
  }
}


/**
 * Safely stringify JSON data
 * 
 * @param {*} data The data to stringify
 * @returns {string} A JSON string or null if an error occurred
 */
export function jsonSafeStringify<T>(data: T): string | null;

/**
 * Safely stringify JSON data
 * 
 * @param {*} data The data to stringify
 * @returns {string} A JSON string or null if an error occurred
 */
export function jsonSafeStringify<T>(data: T, replacer: ((this: any, key: string, value: any) => any), space?: string | number): string | null;
/**
 * Safely stringify JSON data
 * 
 * @param {*} data The data to stringify
 * @returns {string} A JSON string or null if an error occurred
 */
export function jsonSafeStringify<T>(data: T, replacer?: (string | number)[] | null, space?: string | number): string | null;

/**
 * Safely stringify JSON data
 * 
 * @param {*} data The data to stringify
 * @returns {string} A JSON string or null if an error occurred
 */
export function jsonSafeStringify<T>(data: T, replacer?: ((this: any, key: string, value: any) => any) | (string | number)[] | null, space?: string | number): string | null {
  if(typeof data !== 'object' && !Array.isArray(data)) return JSON.stringify(data);

  try {
    const safeData = Array.isArray(data) ? _replaceArrayCirculars(data) : _replaceObjectCirculars(data);
    return JSON.stringify(safeData, replacer as unknown as any, space);
  } catch (err: any) {
    return null;
  }
}

function _replaceArrayCirculars(arr: any[]): any[] {
  const safeValues = [] as unknown[];

  for(const item of arr) {
    if(Array.isArray(item)) {
      safeValues.push(_replaceArrayCirculars(item));
    } else if(typeof item === 'object') {
      safeValues.push(_replaceObjectCirculars(item));
    } else {
      safeValues.push(item);
    }
  }

  return safeValues;
}

function _replaceObjectCirculars(obj: any): any {
  const safeValues: Record<string | number | symbol, any> = {};
  let refsCount = 0,
    circularCount = 0;

  for(const prop in obj) {
    if(typeof obj[prop] === 'object') {
      if(Array.isArray(obj[prop])) {
        safeValues[prop] = _replaceArrayCirculars(obj[prop]);
      } else if(_isInstanceOf(obj[prop])) {
        if(Object.prototype.hasOwnProperty.call(obj[prop], Symbol.toStringTag)) {
          safeValues[prop] = typeof obj[prop][Symbol.toStringTag] === 'function' ? obj[prop][Symbol.toStringTag]() : obj[prop][Symbol.toStringTag];
        } else {
          safeValues[prop] = `<InstanceRef *${++refsCount}>${obj[prop].constructor.name ? ' (' + obj[prop].constructor.name + ')' : ''}`;
        }
      } else if(_isCircularObject(obj[prop])) {
        safeValues[prop] = `[Circular *${++circularCount}]`;
      } else {
        safeValues[prop] = _replaceObjectCirculars(obj[prop]);
      }
    } else {
      safeValues[prop] = obj[prop];
    }
  }

  return safeValues;
}

function _isInstanceOf(thing: any) {
  return (
    !isPlainObject(thing) &&
    Object.getPrototypeOf(thing) !== Object.prototype
  );
}

function _isCircularObject(thing: any): boolean {
  try {
    JSON.stringify(thing);
    return false;
  } catch {
    return true;
  }
}


const _default = {
  safeParse: jsonSafeParser,
  safeStringify: jsonSafeStringify,
} as const;

export default Object.freeze(_default);
