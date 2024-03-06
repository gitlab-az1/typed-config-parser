import type { Doc } from './_internals/types';
import { isPlainObject } from './_internals/utils';
import Parser, { type ParserOptions } from './parser';
import { jsonSafeStringify } from './_internals/safe-json';


/**
 * Represents a utility class for converting JavaScript objects into strings, suitable for formats like INI.
 */
export class Stringify {
  readonly #originalContent: Doc;
  readonly #lineEnding: string;

  public constructor(input: Doc, lineEnding?: string);
  public constructor(input: Parser<Doc>, parseOptions?: ParserOptions);

  /**
   * Constructs a new Stringify instance.
   * 
   * @param input The input object or a Parser instance to stringify.
   * @param parseOptionsOrLineEnding Optional. If `input` is an object, specifies line ending for the string output. 
   *                                  If `input` is a Parser instance, specifies parsing options or line ending.
   * @throws TypeError If the input is not an object or a Parser instance.
   */
  public constructor(input: Doc | Parser<Doc>, parseOptionsOrLineEnding?: ParserOptions | string) {
    if(typeof input !== 'object') {
      throw new TypeError('The input must be an object or a Parser instance');
    }

    if(input instanceof Parser) {
      this.#originalContent = input.parse(typeof parseOptionsOrLineEnding === 'object' ? parseOptionsOrLineEnding : undefined);
      this.#lineEnding = input.eol;
    } else if(!isPlainObject(input)) {
      throw new TypeError('The input must be an object or a Parser instance');
    } else {
      this.#originalContent = input;
      this.#lineEnding = typeof parseOptionsOrLineEnding === 'string' ? parseOptionsOrLineEnding : '\n';
    }
  }

  /**
   * Converts the parsed content into a string representation.
   * 
   * @returns A string representation of the parsed content.
   * @throws TypeError If a property value is not a string, a number, a boolean or an array.
   */
  public toString(): string {
    const lines = [] as string[];
    const sections = [] as [string, Doc][];

    const produceLines = (obj: Doc) => {
      for(const prop in obj) {
        if(!Object.prototype.hasOwnProperty.call(obj, prop)) continue;

        if(typeof obj[prop] === 'object') {
          sections.push([prop, obj[prop] as Record<string, string | number>]);
        } else {
          if(!['string', 'number', 'boolean'].includes(typeof obj[prop]) ||
              (typeof obj[prop] === 'object' && !Array.isArray(obj[prop]))) {
            throw new TypeError(`The value of the property "${prop}" must be a string or a number`);
          }

          lines.push(`${prop} = ${obj[prop]}`);
        }
      }

      if(sections.length < 1) return;

      const eachSections = (n: number, pos: number = 0) => {
        if(pos <= n) {
          const [name, items] = sections[pos];
          lines.push(`${this.#lineEnding}[${name}]`);

          for(const prop in items) {
            if(!Object.prototype.hasOwnProperty.call(items, prop)) continue;

            if(!['string', 'number', 'boolean'].includes(typeof items[prop]) ||
              (typeof items[prop] === 'object' && !Array.isArray(items[prop]))) {
              throw new TypeError(`The value of the property "${prop}" must be a string or a number`);
            }

            lines.push(`${prop} = ${items[prop]}`);
          }

          eachSections(n, pos + 1);
        }
      };

      eachSections(sections.length - 1);
    };

    produceLines(this.#originalContent);
    return `${lines.join(this.#lineEnding)}${this.#lineEnding}`;
  }

  /**
   * Converts the original content into a JSON string.
   * 
   * @returns A JSON string representation of the original content.
   */
  public toJSON(): string {
    return jsonSafeStringify(this.#originalContent) || '{}'; 
  }

  /**
   * Implements the iterable protocol, allowing iteration over the original content.
   * 
   * @returns A generator yielding each property of the original content as an object with a single key-value pair.
   */
  public *[Symbol.iterator](): Generator<Doc> {
    for(const prop in this.#originalContent) {
      if(!Object.prototype.hasOwnProperty.call(this.#originalContent, prop)) continue;
      yield { [prop]: this.#originalContent[prop] };
    }
  }

  /**
   * Returns a string representation of the class.
   * 
   * @returns A string representation of the class.
   */
  public [Symbol.toStringTag]() {
    return '[object Stringify]';
  }
}

export default Stringify;
