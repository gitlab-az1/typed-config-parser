import * as fs from 'fs';
import { resolve } from 'path';

import Parser, { type ReaderOptions, type ParserOptions } from './parser';

export * from './parser';


// eslint-disable-next-line @typescript-eslint/ban-types
export async function parseFile<T extends {}>(path: string, options?: ReaderOptions & ParserOptions): Promise<T> {
  if(path.charAt(0) === '.') {
    path = resolve(path);
  }

  if(!fs.existsSync(path)) {
    throw new ReferenceError(`Failed to find file at "${path}"`);
  }

  const buffer = await fs.promises.readFile(path);
  const parser = Parser.read<T>(buffer, { commentWith: options?.commentWith });
  
  return parser.parse({
    aliases: options?.aliases,
    keysWithSpaces: options?.keysWithSpaces,
  });
}


// eslint-disable-next-line @typescript-eslint/ban-types
export function parseFileSync<T extends {}>(path: string, options?: ReaderOptions & ParserOptions): T {
  if(path.charAt(0) === '.') {
    path = resolve(path);
  }

  if(!fs.existsSync(path)) {
    throw new ReferenceError(`Failed to find file at "${path}"`);
  }

  const buffer = fs.readFileSync(path);
  const parser = Parser.read<T>(buffer, { commentWith: options?.commentWith });

  return parser.parse({
    aliases: options?.aliases,
    keysWithSpaces: options?.keysWithSpaces,
  });
}


// eslint-disable-next-line @typescript-eslint/ban-types
export function parse<T extends {}>(input: string | Buffer | Uint8Array, options?: ReaderOptions & ParserOptions): T {
  const parser = Parser.read<T>(input, { commentWith: options?.commentWith });

  return parser.parse({
    aliases: options?.aliases,
    keysWithSpaces: options?.keysWithSpaces,
  });
}



const _default = {
  Parser,
  parseFile,
  parseFileSync,
  parse,
} as const;

export default Object.freeze(_default) as typeof _default;
