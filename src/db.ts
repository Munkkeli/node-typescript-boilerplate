import { PoolClient, Pool } from 'pg';

/** Connect to a PostgreSQL DB */
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT),
  max: parseInt(process.env.POSTGRES_CONNECTIONS) || 10,
});

/** Make sure the connection is functional */
(async () => {
  let trx: PoolClient;
  try {
    trx = await pool.connect();
  } catch (error) {
    console.log('Could not connect to the DB', error);
    process.exit();
  } finally {
    if (trx) trx.release();
  }
})();

/** Lease out a single connection from the pool */
export const connect = async () => {
  return await pool.connect();
};
