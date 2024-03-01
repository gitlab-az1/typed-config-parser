import { applyAliases } from './_utils';


interface ValuesMap {
  string: string;
  number: number;
  boolean: boolean;
  array: any[];
}

/**
 * Represents a typed value with a specific type and corresponding value.
 * 
 * @template K Type key from ValuesMap.
 */
export interface Value<K extends keyof ValuesMap> {
  type: K;
  value: ValuesMap[K];
}


/**
 * Represents options for the reader.
 */
export type ReaderOptions = {

  /** The character(s) that represents a comment. */
  commentWith?: string | string[];
}

/**
 * Represents options for the parser.
 */
export type ParserOptions = {

  /** How to handle keys with spaces. */
  keysWithSpaces?: 'ignore' | 'allow' | 'error';

  /** A record of aliases to be applied to the parsed object. */
  aliases?: Record<string, string>;
}


// eslint-disable-next-line @typescript-eslint/ban-types
export class Parser<Output extends {}> {

  /**
   * Reads input data and returns a Parser instance.
   * 
   * @param input Input data to be parsed.
   * @param options Options for reading.
   * @returns A new Parser instance.
   */
  public static read<T extends Record<string, any>>(input: string, options?: ReaderOptions): Parser<T>

  /**
   * Reads input data and returns a Parser instance.
   * 
   * @param input Input data to be parsed.
   * @param options Options for reading.
   * @returns A new Parser instance.
   */
  public static read<T extends Record<string, any>>(input: Buffer, options?: ReaderOptions): Parser<T>

  /**
   * Reads input data and returns a Parser instance.
   * 
   * @param input Input data to be parsed.
   * @param options Options for reading.
   * @returns A new Parser instance.
   */
  public static read<T extends Record<string, any>>(input: Uint8Array, options?: ReaderOptions): Parser<T>

  /**
   * Reads input data and returns a Parser instance.
   * 
   * @param input Input data to be parsed.
   * @param options Options for reading.
   * @returns A new Parser instance.
   */
  public static read<T extends Record<string, any>>(input: string | Buffer | Uint8Array, options?: ReaderOptions): Parser<T> {
    const file = (Buffer.isBuffer(input) ? input : Buffer.from(input)).toString('utf-8');
    const lineSeparator = file.indexOf('\r\n') > -1 ? '\r\n' : '\n';

    const lines = file.split(lineSeparator);
    const commentWith = Array.isArray(options?.commentWith) ? options.commentWith : [options?.commentWith || ';'];

    const clearLines = [] as string[];

    const eachLine = (n: number, pos: number = 0) => {
      if(pos <= n) {
        const line = lines[pos];
        const hasComments = line.split('').some(char => commentWith.includes(char));

        if(!hasComments && line.trim().length > 0) {
          clearLines.push(line.trim());
        } else {
          let currentLine = line;

          const eachComment = (n: number, pos: number = 0) => {
            if(pos <= n) {
              const comment = commentWith[pos];
              const index = currentLine.indexOf(comment);

              if(index > -1) {
                currentLine = currentLine.slice(0, index);
                const hasCommentsInLine = currentLine.split('').some(char => commentWith.includes(char));

                if(!hasCommentsInLine) {
                  if(currentLine.trim().length > 0) {
                    clearLines.push(currentLine);
                  }

                  pos = Infinity - 1;
                }
              }

              eachComment(n, pos + 1);
            }
          };

          eachComment(commentWith.length - 1);
        }

        eachLine(n, pos + 1);
      }
    };

    eachLine(lines.length - 1);
    
    return new Parser(clearLines.map(item => item.trim()),
      lineSeparator,
      new Uint8Array((Buffer.isBuffer(input) ? input : Buffer.from(input)).buffer));
  }

  readonly #lines: string[];
  readonly #eolSequence: string;
  readonly #originalBuffer: Uint8Array;

  private constructor(
    lines: string[],
    eolSequence: string,
    originalBuffer: Uint8Array // eslint-disable-line comma-dangle
  ) {
    this.#lines = lines;
    this.#eolSequence = eolSequence;
    this.#originalBuffer = originalBuffer;
  }

  /**
   * Gets the lines of the parsed data.
   * 
   * @returns An array of lines.
   */
  public get lines(): readonly string[] {
    return Object.freeze([ ...this.#lines ]);
  }

  /**
   * Gets the end-of-line sequence used in the parsed data.
   * 
   * @returns The end-of-line sequence.
   */
  public get eol(): string {
    return `${this.#eolSequence}`;
  }

  /**
   * Gets the raw data buffer.
   * 
   * @returns The raw data buffer.
   */
  public get raw(): Buffer {
    return Buffer.from(this.#originalBuffer);
  }

  /**
   * Parses the data and returns the result.
   * 
   * @param options Options for parsing.
   * @returns The parsed output.
   */
  public parse(options?: ParserOptions): Output {
    const results = {} as Record<string, any>;
    let useSection: string | false = false;

    const eachRow = (n: number, pos: number = 0) => {
      if(pos <= n) {
        const row = this.#lines[pos];
        const sectionRegex = /^\[(\w+)\]$/;

        if(sectionRegex.test(row)) {
          const section = sectionRegex.exec(row)![1].trim();
          results[section] = {};

          useSection = section;
        } else {
          if(row.indexOf('=') < 0) {
            throw new SyntaxError(`Invalid syntax at line ${pos + 1}. Expected a key-value pair.`);
          }

          const [key, value] = row.split('=').map(item => item.trim());

          const processLine = () => {
            if(!useSection) {
              if(key in results && !Array.isArray(results[key])) {
                results[key] = [results[key], value];
              } else if(key in results && Array.isArray(results[key])) {
                results[key].push(value);
              } else {
                results[key] = value;
              }
            } else {
              if(key in results[useSection] && !Array.isArray(results[useSection][key])) {
                results[useSection][key] = [results[useSection][key], value];
              } else if(key in results[useSection] && Array.isArray(results[useSection][key])) {
                results[useSection][key].push(value);
              } else {
                results[useSection][key] = value;
              }
            }
          };

          if(/\s+/.test(key)) {
            switch(options?.keysWithSpaces) {
              case 'allow':
                processLine();
                break;
              case 'ignore':
                break;
              case 'error':
              default:
                throw new SyntaxError(`Invalid syntax at line ${pos + 1}. Key cannot contain spaces.`);
            }
          } else {
            processLine();
          }
        }

        eachRow(n, pos + 1);
      }
    };

    eachRow(this.#lines.length - 1);

    // eslint-disable-next-line no-extra-boolean-cast
    if(!!options?.aliases) {
      applyAliases(results, options.aliases);
    }

    return this.#evalOutputObject(results) as Output;
  }

  #evalOutputObject(obj: Record<string, any>): Record<string, any> {
    const output = {} as Record<string, any>;

    for(const prop in obj) {
      if(!Object.prototype.hasOwnProperty.call(obj, prop)) continue;

      if(typeof obj[prop] === 'object' && Array.isArray(obj[prop])) {
        output[prop] = obj[prop].map((item: any) => this.#evalOutputObject(item));
      } else if(typeof obj[prop] === 'object') {
        output[prop] = this.#evalOutputObject(obj[prop]);
      } else {
        output[prop] = this.#eval(obj[prop]).value;
      }
    }

    return output;
  }

  #eval(input: string): Value<keyof ValuesMap> {
    if(/^[0-9]*\.?[0-9]*$/.test(input)) return {
      type: 'number',
      value: Number(input),
    };

    if(['true', 'false'].includes(input)) return {
      type: 'boolean',
      value: input === 'true',
    };

    if(input.startsWith('[') && input.endsWith(']')) return {
      type: 'array',
      value: input.slice(1, -1).split(',').map(item => item.trim()),
    };

    if(/^0x[0-9A-Fa-f]*$/.test(input)) return {
      type: 'number',
      value: parseInt(input, 16),
    };

    if(/^0b[01]*$/.test(input)) return {
      type: 'number',
      value: parseInt(input, 2),
    };

    if(/^0o[0-7]*$/.test(input)) return {
      type: 'number',
      value: parseInt(input, 8),
    };

    return {
      type: 'string',
      value: input,
    };
  }
}


export default Parser;
