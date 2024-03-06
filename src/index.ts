import * as fs from 'fs';
import { resolve } from 'path';

import Stringify from './stringify';
import type { Doc } from './_internals/types';
export type { Doc, Schema, SchemaValue } from './_internals/types';
import Parser, { type ReaderOptions, type ParserOptions } from './parser';

export * from './parser';
export * from './stringify';


export async function parseFile<T extends Doc>(path: string, options?: ReaderOptions & ParserOptions): Promise<T> {
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


export function parseFileSync<T extends Doc>(path: string, options?: ReaderOptions & ParserOptions): T {
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



export function parse<T extends Doc>(input: string | Buffer | Uint8Array, options?: ReaderOptions & ParserOptions): T {
  const parser = Parser.read<T>(input, { commentWith: options?.commentWith });

  return parser.parse({
    aliases: options?.aliases,
    keysWithSpaces: options?.keysWithSpaces,
  });
}


export function stringify<T extends Doc>(input: T, lineEnding?: string): string;
export function stringify<T extends Doc>(input: Parser<T>, parseOptions?: ParserOptions): string;
export function stringify<T extends Doc>(input: T | Parser<T>, parseOptionsOrLineEnding?: ParserOptions | string): string {
  const stringify = new Stringify(input as never, parseOptionsOrLineEnding as never);
  return stringify.toString();
}


export function writeFileSync<T extends Doc>(
  path: string,
  input: T | Parser<T>,
  options?: ParserOptions | string // eslint-disable-line comma-dangle
): void {
  if(path.charAt(0) === '.') {
    path = resolve(path);
  }
    
  const content = stringify(input as never, options as never);
  fs.writeFileSync(path, content, { encoding: 'utf-8' });
}


export async function writeFile<T extends Doc>(
  path: string,
  input: T | Parser<T>,
  options?: ParserOptions | string // eslint-disable-line comma-dangle
): Promise<void> {
  if(path.charAt(0) === '.') {
    path = resolve(path);
  }

  const content = stringify(input as never, options as never);
  await fs.promises.writeFile(path, content, { encoding: 'utf-8' });
}



const _default = {
  Parser,
  Stringify,
  parseFile,
  parseFileSync,
  parse,
  stringify,
  writeFileSync,
  writeFile,
} as const;

export default Object.freeze(_default) as typeof _default;
