import type { Request, Response } from 'express';
import * as service from './projects.service.js';
import { unauthorized } from '../../lib/errors.js';

const actor = (req: Request): service.Actor => {
  if (!req.auth) throw unauthorized();
  return { companyId: req.auth.companyId, userId: req.auth.userId };
};

export const list = async (req: Request, res: Response) => {
  res.json(await service.listProjects(actor(req), req.query as never));
};

export const getOne = async (req: Request, res: Response) => {
  res.json(await service.getProject(actor(req), req.params.publicId!));
};

export const create = async (req: Request, res: Response) => {
  res.status(201).json(await service.createProject(actor(req), req.body));
};

export const update = async (req: Request, res: Response) => {
  res.json(await service.updateProject(actor(req), req.params.publicId!, req.body));
};

export const remove = async (req: Request, res: Response) => {
  await service.deleteProject(actor(req), req.params.publicId!);
  res.status(204).end();
};

export const listBoms = async (req: Request, res: Response) => {
  res.json(await service.listBoms(actor(req), req.params.publicId!));
};

export const createBom = async (req: Request, res: Response) => {
  res.status(201).json(await service.createBom(actor(req), req.params.publicId!, req.body));
};

export const renameBom = async (req: Request, res: Response) => {
  await service.renameBom(actor(req), req.params.publicId!, req.params.bomId!, req.body);
  res.status(204).end();
};

export const removeBom = async (req: Request, res: Response) => {
  await service.deleteBom(actor(req), req.params.publicId!, req.params.bomId!);
  res.status(204).end();
};
