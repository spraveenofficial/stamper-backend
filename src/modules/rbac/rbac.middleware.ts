import { Request, Response, NextFunction } from 'express';
import { User } from '../user';
import { defaultPermissions } from './constants';
import { rolesEnum } from '../../config/roles';
import httpStatus from 'http-status';

export const checkPermission = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure the user is authenticated
      if (!req.user?.id) {
        return res.status(httpStatus.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
      }

      // Fetch the user and populate permissions
      const user = await User.findById(req.user.id).populate('permissions');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Get the role-based default permissions
      const rolePermissions = defaultPermissions[user.role as rolesEnum] || [];
      // Merge default permissions and custom user permissions
      const allPermissions = [...rolePermissions, ...user.permissions.map((perm: any) => perm.name)];

      // Check if the required permission exists in the merged list
      const hasPermission = allPermissions.includes(requiredPermission);

      if (!hasPermission) {
        return res.status(httpStatus.FORBIDDEN).json({
          success: false,
          message: 'Permission denied',
          required: requiredPermission,
        });
      }

      // If permission check passes, proceed to the next middleware
      return next();
    } catch (error) {
      // Catch any unexpected errors and return a server error response
      return res.status(500).json({
        message: 'Error checking permissions',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
};
