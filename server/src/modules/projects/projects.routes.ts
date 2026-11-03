import { Router } from 'express';
import * as controller from './projects.controller.js';
import {
  projectBodySchema,
  projectUpdateSchema,
  bomBodySchema,
  listQuerySchema,
  publicIdParam,
  bomParams,
} from './projects.schema.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../lib/async-handler.js';
import { PERMISSIONS } from '../../config/permissions.js';

export const projectsRouter = Router();

projectsRouter.use(authenticate);

projectsRouter.get(
  '/',
  authorize(PERMISSIONS.PROJECT_VIEW),
  validate({ query: listQuerySchema }),
  asyncHandler(controller.list),
);
projectsRouter.get(
  '/:publicId',
  authorize(PERMISSIONS.PROJECT_VIEW),
  validate({ params: publicIdParam }),
  asyncHandler(controller.getOne),
);
projectsRouter.post(
  '/',
  authorize(PERMISSIONS.PROJECT_MANAGE),
  validate({ body: projectBodySchema }),
  asyncHandler(controller.create),
);
projectsRouter.put(
  '/:publicId',
  authorize(PERMISSIONS.PROJECT_MANAGE),
  validate({ params: publicIdParam, body: projectUpdateSchema }),
  asyncHandler(controller.update),
);
projectsRouter.delete(
  '/:publicId',
  authorize(PERMISSIONS.PROJECT_DELETE),
  validate({ params: publicIdParam }),
  asyncHandler(controller.remove),
);

// BOMs within a project
projectsRouter.get(
  '/:publicId/boms',
  authorize(PERMISSIONS.PROJECT_VIEW),
  validate({ params: publicIdParam }),
  asyncHandler(controller.listBoms),
);
projectsRouter.post(
  '/:publicId/boms',
  authorize(PERMISSIONS.PROJECT_MANAGE),
  validate({ params: publicIdParam, body: bomBodySchema }),
  asyncHandler(controller.createBom),
);
projectsRouter.put(
  '/:publicId/boms/:bomId',
  authorize(PERMISSIONS.PROJECT_MANAGE),
  validate({ params: bomParams, body: bomBodySchema }),
  asyncHandler(controller.renameBom),
);
projectsRouter.delete(
  '/:publicId/boms/:bomId',
  authorize(PERMISSIONS.PROJECT_DELETE),
  validate({ params: bomParams }),
  asyncHandler(controller.removeBom),
);
