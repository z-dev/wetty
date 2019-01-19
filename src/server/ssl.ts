import { readFile } from 'fs-extra';
import { resolve } from 'path';
import { isUndefined } from 'lodash';
import { SSL, SSLBuffer } from './interfaces';

export default async function loadSSL(ssl?: SSL): Promise<SSLBuffer> {
  if (isUndefined(ssl)) return {};
  const [key, cert]: Buffer[] = await Promise.all([
    readFile(resolve(ssl.key)),
    readFile(resolve(ssl.cert)),
  ]);
  return { key, cert };
}
