import { Request as ExpressRequest, Response, NextFunction } from 'express';
import * as DB from 'db';
import { trx as createTrx, ITrx } from 'lib/trx';

// TODO: Add any types and fields required in the express request object
export interface IRequest extends ExpressRequest {
  session?: string;
  user?: any;
  body: any;
}

export type IExpressMiddleware = (
  req: IRequest,
  res: Response,
  next: NextFunction
) => void;

/**
 * Wrapper around express requests that handles DB transactions, errors, and responses
 */
export const Request = (
  action: (
    trx: ITrx,
    req: IRequest,
    res: Response,
    next: NextFunction
  ) => Promise<any>
): IExpressMiddleware => async (req, res, next) => {
  const poolClient = await DB.connect();
  const trx = createTrx(poolClient);

  let response: any = null;
  let failed = false;

  try {
    await trx.pg.query('BEGIN');

    response = await action(trx, req, res, next);

    await trx.pg.query('COMMIT');
  } catch (error) {
    await trx.pg.query('ROLLBACK');
    console.error(error);
    failed = true;
  } finally {
    trx.pg.release();

    if (failed) return res.sendStatus(500);
    if (!isNaN(Number(response)) && !Array.isArray(response)) {
      return res.sendStatus(response);
    }

    if (res.headersSent) return;

    if (response) return res.send(response);

    return res.sendStatus(200);
  }
};

/**
 * Generic wrapper around an asynchronous action that handles DB transactions
 */
export const Action = <T>(
  action: (trx: ITrx, data: T) => Promise<any>
) => async (data: T) => {
  const poolClient = await DB.connect();
  const trx = createTrx(poolClient);

  try {
    await trx.pg.query('BEGIN');

    await action(trx, data);

    await trx.pg.query('COMMIT');
  } catch (error) {
    await trx.pg.query('ROLLBACK');
    console.error(error);
  } finally {
    trx.pg.release();
  }
};

export const authenticate: IExpressMiddleware = async (req, res, next) => {
  const authorization = req.get('Authorization');
  if (!authorization) return next();
  if (!authorization.includes('Bearer ')) return next();

  const trx = await DB.connect();

  const trxNext = () => {
    trx.release();
    return next();
  };

  // TODO: Authenticate user

  return trxNext();
};

/**
 * Respond with 403 status if user has not authenticated
 */
export const protect: IExpressMiddleware = (req, res, next) => {
  if (req.user) return next();
  return res.sendStatus(403);
};
