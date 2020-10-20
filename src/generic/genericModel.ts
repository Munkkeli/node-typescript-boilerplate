/**
 * @file An example of a database model and CRUD methods
 */

import { PoolClient } from 'pg';
import { keys } from 'ts-transformer-keys';
import { generic as ID } from '../lib/id';

/*
create table generic
(
  _id serial not null,
  message text not null,
  "updatedAt" timestamp default NOW() not null,
  "createdAt" timestamp default NOW() not null
);

create unique index generic__id_uindex
  on generic (_id);

alter table generic
  add constraint generic_pk
    primary key (_id);
*/

export interface IGeneric {
  _id: string;
  message: string;
  updatedAt: Date;
  createdAt: Date;
}

/** DB table name */
export const table = 'generic';

/** Create a SQL statement of all columns automatically */
export const columns = keys<IGeneric>()
  .map((column) => `"${column}"`)
  .join(', ');

/** Transform data after DB query (if required) */
export const dto = (row: IGeneric): IGeneric => ({
  ...row,
  _id: ID.encode(row._id),
});

/** Create a new DB record */
export const create = async (
  trx: PoolClient,
  { message }: Pick<IGeneric, 'message'>
) => {
  const { rows } = await trx.query(
    `INSERT INTO "${table}" (message)
    VALUES ($1)
    RETURNING ${columns}`,
    [message]
  );

  if (!rows.length) throw new Error(`Could not create "${table}" record`);

  return dto(rows[0]);
};

/** Find an existing DB record */
export const findByID = async (trx: PoolClient, _id: string) => {
  const {
    rows,
  } = await trx.query(`SELECT ${columns} FROM "${table}" WHERE _id = $1`, [
    ID.decode(_id)[0],
  ]);

  if (!rows.length) return null;

  return dto(rows[0]);
};

/** Update an existing DB record */
export const updateByID = async (
  trx: PoolClient,
  { _id, message }: Pick<IGeneric, '_id' | 'message'>
) => {
  const { rows } = await trx.query(
    `UPDATE "${table}" SET "message" = $2 WHERE _id = $1
    RETURNING ${columns}`,
    [ID.decode(_id)[0], message]
  );

  if (!rows.length) throw new Error(`Could not update "${table}"`);

  return dto(rows[0]);
};

/** Remove an existing DB record */
export const removeByID = async (trx: PoolClient, _id: string) => {
  const { rows } = await trx.query(`DELETE FROM "${table}" WHERE _id = $1`, [
    ID.decode(_id)[0],
  ]);

  if (!rows.length) return false;

  return true;
};

/** Count all DB records of type */
export const count = async (trx: PoolClient) => {
  const { rows } = await trx.query(`SELECT COUNT(*) FROM "${table}"`);

  if (!rows.length) return null;

  return rows[0].count;
};
