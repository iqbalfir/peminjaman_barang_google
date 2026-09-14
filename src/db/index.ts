/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema.ts';

export const isDatabaseConfigured = Boolean(process.env.SQL_HOST && process.env.SQL_DB_NAME);

export const createPool = () => {
  return new Pool({
    host: process.env.SQL_HOST || '127.0.0.1',
    user: process.env.SQL_USER || 'postgres',
    password: process.env.SQL_PASSWORD || '',
    database: process.env.SQL_DB_NAME || 'postgres',
    connectionTimeoutMillis: 3000,
  });
};

const pool = createPool();

pool.on('error', (err) => {
  console.warn('PostgreSQL pool idle warning:', err.message || err);
});

export const db = drizzle(pool, { schema });
