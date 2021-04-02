import { Router } from 'express';
import { Request, protect } from '../middleware';
import * as Generic from './genericModel';

const genericRouter = Router();

/** An example route returning a record from DB */
genericRouter.get(
  '/generic/:id',
  Request(async (trx, req, res) => {
    const { id } = req.body;
    return Generic.findByID(trx, id);
  })
);

export { genericRouter };
