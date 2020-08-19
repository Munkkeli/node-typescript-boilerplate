import { PoolClient } from 'pg';
import { Request as ExpressRequest, Response, NextFunction } from 'express';
import * as DB from './db';

/** TODO: Add any types and fields required in the express request object */
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

export const Request = (
  action: (
    trx: PoolClient,
    req: IRequest,
    res: Response,
    next: NextFunction
  ) => Promise<any>
): IExpressMiddleware => async (req, res, next) => {
  const trx = await DB.connect();

  let response: any = null;
  let failed = false;

  try {
    await trx.query('BEGIN');

    response = await action(trx, req, res, next);

    await trx.query('COMMIT');
  } catch (error) {
    await trx.query('ROLLBACK');
    console.error(error);
    failed = true;
  } finally {
    trx.release();

    if (failed) return res.sendStatus(500);
    if (!isNaN(Number(response)) && !Array.isArray(response)) {
      return res.sendStatus(response);
    }

    if (res.headersSent) return;

    if (response) return res.send(response);

    return res.sendStatus(200);
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

export const protect: IExpressMiddleware = (req, res, next) => {
  if (req.user) return next();
  return res.sendStatus(403);
};
