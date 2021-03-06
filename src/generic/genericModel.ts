/**
 * @file An example of a database model and CRUD methods
 */

import { keys } from 'ts-transformer-keys';
import { ITrx } from 'lib/trx';
import { generic as ID } from 'lib/id';

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

/** List of all DB columns (Created automatically from TS interface) */
export const columns = keys<IGeneric>();

/** Transform data after DB query (if required) */
export const dto = (row: IGeneric): IGeneric => ({
  ...row,
  _id: ID.encode(row._id),
});

/** Create a new DB record */
export const create = async (trx: ITrx, data: Pick<IGeneric, 'message'>) => {
  const { rows } = await trx.sql`
    INSERT INTO ${trx.table(table)}
    ${trx.insert(data)}
    RETURNING ${trx.select(columns)}
  `;

  if (!rows.length) throw new Error(`Could not create "${table}" record`);

  return dto(rows[0]);
};

/** Find an existing DB record */
export const findByID = async (trx: ITrx, _id: string) => {
  const { rows } = await trx.sql`
    SELECT ${trx.select(columns)}
    FROM ${trx.table(table)}
    WHERE _id = ${ID.decode(_id)[0]}
  `;

  if (!rows.length) return null;

  return dto(rows[0]);
};

/** Update an existing DB record */
export const updateByID = async (
  trx: ITrx,
  { _id, message }: Pick<IGeneric, '_id' | 'message'>
) => {
  const { rows } = await trx.sql`
    UPDATE ${trx.table(table)}
    SET ${trx.update({ message })}
    WHERE _id = ${ID.decode(_id)[0]}
    RETURNING ${trx.select(columns)}
  `;

  if (!rows.length) throw new Error(`Could not update "${table}"`);

  return dto(rows[0]);
};

/** Remove an existing DB record */
export const removeByID = async (trx: ITrx, _id: string) => {
  const { rows } = await trx.sql`
    DELETE FROM ${trx.table(table)}
    WHERE _id = ${ID.decode(_id)[0]}
  `;

  if (!rows.length) return false;

  return true;
};

/** Count all DB records of type */
export const count = async (trx: ITrx) => {
  const { rows } = await trx.sql`
    SELECT COUNT(*) FROM ${trx.table(table)}
  `;

  if (!rows.length) return null;

  return rows[0].count;
};
