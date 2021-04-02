/**
 * @file A wrapper for node-postgres PoolClient to make template literal queries simple
 */

import { PoolClient } from 'pg';

export type ColumnValuePairs = {
  [column: string]: unknown;
};

/** Class to wrap raw SQL values to make identifying them easy */
class RawSql {
  sql: string = '';
  constructor(sql: string) {
    this.sql = sql;
  }
}

/** Escape a value based on it's JavaScript type */
const escapeValue = (value: unknown, poolClient: PoolClient) => {
  // Number, can be used directly
  if (typeof value == 'number' && !isNaN(value)) {
    return value;
  }

  // Null, will be used as is
  if (value === null) {
    return 'NULL';
  }

  // Array, will be converted to "(value, value)"
  if (Array.isArray(value)) {
    return `(${value
      .map((subvalue) => escapeValue(subvalue, poolClient))
      .join(', ')})`;
  }

  // Raw, will be used as is
  if (value instanceof RawSql) {
    return value.sql;
  }

  // Date, will be converted to an ISO string
  if (value instanceof Date) {
    return poolClient.escapeLiteral(value.toISOString());
  }

  // Object, needs to be stringified
  if (typeof value === 'object' && value !== null) {
    return poolClient.escapeLiteral(JSON.stringify(value));
  }

  // Everything else will be converted to a string and escaped as literals
  return poolClient.escapeLiteral(`${value}`);
};

/**
 * Create a raw SQL string that won't be escaped in any way.
 * @example trx.raw('SET "foo" = foo') // SET "foo" = foo
 */
const raw = (sql: string) => new RawSql(sql);

const table = (poolClient: PoolClient) =>
  /**
   * Escape an SQL table name
   * @example trx.table('testName') // "testName"
   */
  (name: string) => raw(poolClient.escapeIdentifier(`${name}`));

const select = (poolClient: PoolClient) =>
  /**
   * Generates SQL SELECT statement columns from an object or array.
   * Escapes column names.
   * @example trx.select({ foo: 'foo', bar: 123 }) // "foo", "bar"
   * trx.select(['foo', 'bar']) // "foo", "bar"
   */
  <T = ColumnValuePairs>(data: T) => {
    const columns = (Array.isArray(data) ? [...data] : Object.keys(data))
      .map((column) => poolClient.escapeIdentifier(`${column}`))
      .join(', ');

    return raw(columns);
  };

const insert = (poolClient: PoolClient) =>
  /**
   * Generates SQL INSERT statement columns and values automatically from an object.
   * Escapes column names and values.
   * @example trx.insert({ foo: 'bar' }) // ("foo") VALUES ('bar')
   */
  <T = ColumnValuePairs>(data: T) => {
    const columns = Object.keys(data)
      .map((column) => poolClient.escapeIdentifier(`${column}`))
      .join(', ');
    const values = Object.values(data)
      .map((value) => escapeValue(value, poolClient))
      .join(', ');

    return raw(`(${columns}) VALUES (${values})`);
  };

const update = (poolClient: PoolClient) =>
  /**
   * Generates SQL UPDATE statement columns and values automatically from an object.
   * Escapes column names and values.
   * @example trx.update({ foo: 'bar' }) // "foo" = 'bar'
   */
  <T = ColumnValuePairs>(data: T) => {
    const columnsToValues = Object.entries(data)
      .map(
        ([column, value]) =>
          `${poolClient.escapeIdentifier(`${column}`)} = ${escapeValue(
            value,
            poolClient
          )}`
      )
      .join(', ');

    return raw(columnsToValues);
  };

/**
 * Generate a SQL statement from a template literal and escape all given arguments
 * @example trx.sql`SELECT * FROM "test" WHERE "foo" = ${123} AND "bar" = ${"test"}`;
 * // SELECT * FROM "test" WHERE "foo" = 123 AND "bar" = 'test'
 */
export const query = (poolClient: PoolClient) => async (
  strings: TemplateStringsArray,
  ...properties: unknown[]
) => {
  let preparedStatement = '';
  let partIndex = 0;

  // Loop trough all parts
  for (const part of strings) {
    preparedStatement += part;

    // If this is not the last part, escape and insert the value that comes after
    if (partIndex < properties.length) {
      preparedStatement += escapeValue(properties[partIndex], poolClient);
    }

    partIndex++;
  }

  return await poolClient.query(preparedStatement);
};

export interface ITrx {
  sql: ReturnType<typeof query>;
  table: ReturnType<typeof table>;
  select: ReturnType<typeof select>;
  insert: ReturnType<typeof insert>;
  update: ReturnType<typeof update>;
  raw: typeof raw;
  pg: PoolClient;
}

/**
 * Quality of life wrapper for a node-postgres PoolClient to allow for easy template literal queries
 */
export const trx = (poolClient: PoolClient): ITrx => ({
  sql: query(poolClient),
  table: table(poolClient),
  select: select(poolClient),
  insert: insert(poolClient),
  update: update(poolClient),
  raw,

  /** Easy access to the node-postgres PoolClient instance */
  pg: poolClient,
});
