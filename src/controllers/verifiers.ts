import { Response } from 'express';
import { inject, injectable } from 'inversify';
import { controller, httpDelete, httpPost } from 'inversify-express-utils';
import 'reflect-metadata';
import NotFoundException from '../exceptions/not.found';
import { responseWithError, responseAsUnbehaviorError } from '../helpers/responses';
import { AuthorizedRequest } from '../middlewares/common';

import {
  VerificationServiceFactory,
  VerificationServiceFactoryType
} from '../services/verifications';

interface VerifierRequest extends AuthorizedRequest {
  params: {
    method: string;
    verificationId: string;
  };
}

/**
 * VerifiersController resource
 */
@injectable()
@controller(
  '/methods/:method/verifiers',
  'AuthMiddleware',
  'SupportedMethodsMiddleware'
)
export class VerifiersController {

  constructor( @inject(VerificationServiceFactoryType) private verificationFactory: VerificationServiceFactory) {
  }

  /**
   * Verify code for specified Verification Id.
   *
   * @param  req  express req object
   * @param  res  express res object
   */
  @httpPost(
    '/:verificationId/actions/validate'
  )
  async validate(req: VerifierRequest, res: Response): Promise<void> {
    try {
      const verificationService = this.verificationFactory.create(req.params.method);
      const validationResult = await verificationService.validate(req.params.verificationId, req.body, req.tenant);
      if (!validationResult.isValid) {
        responseWithError(res, 422, {
          'error': 'Invalid code'
        });
      } else {
        this.responseSuccessfully(res, validationResult.verification);
      }
    } catch (err) {
      if (err instanceof NotFoundException) {
        this.responseAsNotFound(res);
      } else {
        responseAsUnbehaviorError(res, err);
      }
    }
  }

  /**
   * Delete Verification Id.
   *
   * @param  req  express req object
   * @param  res  express res object
   */
  @httpDelete(
    '/:verificationId'
  )
  async remove(req: VerifierRequest, res: Response): Promise<void> {
    try {
      const verificationService = this.verificationFactory.create(req.params.method);
      if (!await verificationService.remove(req.params.verificationId)) {
        throw new NotFoundException();
      }
      this.responseSuccessfully(res);
    } catch (err) {
      if (err instanceof NotFoundException) {
        this.responseAsNotFound(res);
      } else {
        responseAsUnbehaviorError(res, err);
      }
    }
  }

  private responseSuccessfully(res: Response, data?: any) {
    res.json({
      status: 200,
      data: data
    });
  }

  private responseAsNotFound(res: Response) {
    responseWithError(res, 404, {
      'error': 'Not found'
    });
  }
}
