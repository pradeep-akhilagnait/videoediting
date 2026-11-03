import type { Request, Response } from 'express';
import * as service from './customers.service.js';
import { unauthorized } from '../../lib/errors.js';

/** Pull the tenant + actor from the authenticated request. */
const actor = (req: Request): service.Actor => {
  if (!req.auth) throw unauthorized();
  return { companyId: req.auth.companyId, userId: req.auth.userId };
};

export const list = async (req: Request, res: Response) => {
  res.json(await service.listCustomers(actor(req), req.query as never));
};

export const getOne = async (req: Request, res: Response) => {
  res.json(await service.getCustomer(actor(req), req.params.publicId!));
};

export const create = async (req: Request, res: Response) => {
  res.status(201).json(await service.createCustomer(actor(req), req.body));
};

export const update = async (req: Request, res: Response) => {
  res.json(await service.updateCustomer(actor(req), req.params.publicId!, req.body));
};

export const remove = async (req: Request, res: Response) => {
  await service.deleteCustomer(actor(req), req.params.publicId!);
  res.status(204).end();
};
