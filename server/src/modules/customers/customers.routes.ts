import { Router } from 'express';
import * as controller from './customers.controller.js';
import { customerBodySchema, listQuerySchema, publicIdParam } from './customers.schema.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../lib/async-handler.js';
import { PERMISSIONS } from '../../config/permissions.js';

export const customersRouter = Router();

// Every route requires a signed-in user; writes additionally require manage.
customersRouter.use(authenticate);

customersRouter.get(
  '/',
  authorize(PERMISSIONS.CUSTOMER_VIEW),
  validate({ query: listQuerySchema }),
  asyncHandler(controller.list),
);

customersRouter.get(
  '/:publicId',
  authorize(PERMISSIONS.CUSTOMER_VIEW),
  validate({ params: publicIdParam }),
  asyncHandler(controller.getOne),
);

customersRouter.post(
  '/',
  authorize(PERMISSIONS.CUSTOMER_MANAGE),
  validate({ body: customerBodySchema }),
  asyncHandler(controller.create),
);

customersRouter.put(
  '/:publicId',
  authorize(PERMISSIONS.CUSTOMER_MANAGE),
  validate({ params: publicIdParam, body: customerBodySchema }),
  asyncHandler(controller.update),
);

customersRouter.delete(
  '/:publicId',
  authorize(PERMISSIONS.CUSTOMER_MANAGE),
  validate({ params: publicIdParam }),
  asyncHandler(controller.remove),
);
