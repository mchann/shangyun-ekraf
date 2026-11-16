import { neon } from '@neondatabase/serverless';

function getDatabaseUrl() {
  if (typeof process !== 'undefined' && process.env?.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.DATABASE_URL) {
    return import.meta.env.DATABASE_URL;
  }
  return '';
}

let sqlInstance = null;

export function getServerSql() {
  const url = getDatabaseUrl();
  if (!url) return null;
  if (!sqlInstance) {
    sqlInstance = neon(url);
  }
  return sqlInstance;
}

