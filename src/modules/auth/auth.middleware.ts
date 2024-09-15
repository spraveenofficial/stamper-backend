import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import ApiError from '../errors/ApiError';
import { roleRights } from '../../config/roles';
import { IUserDoc } from '../user/user.interfaces';
import jwt from 'jsonwebtoken';
import config from '../../config/config';

const verifyCallback =
  (req: Request, resolve: any, reject: any, requiredRights: string[]) =>
  async (err: Error, user: IUserDoc, info: string) => {
    if (err || info || !user) {
      return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }
    req.user = user;
    if (requiredRights.length) {
      const userRights = roleRights.get(user.role);
      if (!userRights) return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));

      const hasRequiredRights = requiredRights.every((requiredRight: string) =>
        userRights.includes(requiredRight)
      );
      if (!hasRequiredRights && req.params['userId'] !== user.id) {
        return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
      }
    }

    resolve();
  };

const authMiddleware =
  (...requiredRights: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    return new Promise<void>((resolve, reject) => {
      // Extract the token from cookies
      const token = req.cookies['token'];

      console.log('token', token);
      if (!token) {
        return reject(res.status(httpStatus.UNAUTHORIZED).json({ message: 'Please authenticate' }));
      }

      // Verify the JWT token
      jwt.verify(token, config.jwt.secret, (err: any, decodedToken: any) => {
        if (err) {
          return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token'));
        }

        // Invoke the verifyCallback
        verifyCallback(req, resolve, reject, requiredRights)(err, decodedToken, "");
      });
    })
      .then(() => next())
      .catch((err) => next(err));
  };

export default authMiddleware;
