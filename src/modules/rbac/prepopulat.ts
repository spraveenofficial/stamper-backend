import { ActionEnum, rolesEnum } from '../../config/roles';
import { User } from '../user';
import { defaultPermissions } from './constants';
import { Permission } from './rbac.model';

export const initializePermissions = async () => {
  console.log('Preparing to initialize permissions...');
  const allPermissions: { name: string; module: string; action: ActionEnum }[] = [];

  Object.values(defaultPermissions).forEach((permissions) => {
    permissions.forEach((permission: any) => {
      const [module, action] = permission.split('.');

      if (module && action) {
        allPermissions.push({ name: permission, module, action: action as ActionEnum });
      }
    });
  });

  // Insert permissions into the database if they don't exist
  for (const perm of allPermissions) {
    await Permission.updateOne({ name: perm.name }, { $setOnInsert: perm }, { upsert: true });
  }

  console.log('Permissions initialized successfully!');
};

export const initializeUserPermissions = async () => {
  console.log('Initializing user permissions based on roles...');

  try {
    // Fetch all users
    const users = await User.find();
    if (!users.length) {
      console.log('No users found in the database.');
      return;
    }

    for (const user of users) {
      const userRole = user.role;

      // Fetch permissions for the user's role
      const permissionsForRole = defaultPermissions[userRole as rolesEnum];
      if (!permissionsForRole) {
        console.log(`No permissions configured for role: ${userRole}`);
        continue;
      }

      // Fetch permission documents for the role
      const permissions = await Permission.find({
        name: { $in: permissionsForRole },
      }).select('_id');

      console.log(`User: ${user.email}, Role: ${userRole}, Permissions: ${permissions.map((p) => p.name).join(', ')}`);
      // Update user's permissions
      user.permissions = permissions.map((p) => p._id);
      await user.save();
    }

    console.log('User permissions initialized successfully!');
  } catch (error) {
    console.error('Error initializing user permissions:', error);
  }
};
