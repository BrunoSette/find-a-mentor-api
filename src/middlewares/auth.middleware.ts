import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'express-jwt';
import { expressJwtSecret } from 'jwks-rsa';
import Config from '../config';

const middleware = jwt({
  secret: expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${Config.auth0.frontend.DOMAIN}/.well-known/jwks.json`,
  }),
  issuer: `https://${Config.auth0.frontend.DOMAIN}/`,
  algorithm: 'RS256',
});

/**
 * Public paths that doesn't require authentication
 */
const publicUrls = [
  '/mentors',
  '/mentors/featured',
];

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    middleware(req, res, (error) => {
      // For public endpoints we don't need to require authentication
      if (publicUrls.indexOf(req.baseUrl) >= 0) {
        next();
      } else {
        if (error) {
          const status = error.status || 401;
          const message = error.message || 'You need to be authenticated in order to access this resource.';

          return res.status(status).send({
            success: false,
            errors: [message],
          });
        }

        // Adding the user id
        // @ts-ignore
        req.user.auth0Id = req.user.sub;

        next();
      }
    });
  }
}
