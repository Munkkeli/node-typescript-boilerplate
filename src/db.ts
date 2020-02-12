import { PoolClient, Pool } from 'pg';

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT),
  max: parseInt(process.env.POSTGRES_CONNECTIONS) || 10
});

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

export const connect = async () => {
  return await pool.connect();
};
