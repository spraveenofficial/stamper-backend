/* eslint-disable no-param-reassign */
import { Document, ToObjectOptions } from 'mongoose';

/**
 * A mongoose schema plugin which applies the following in the toJSON transform call:
 *  - removes __v, createdAt, updatedAt, and any path that has private: true
 *  - replaces _id with id
 */

// Extend the ToObjectOptions to include your custom options
interface CustomToObjectOptions extends ToObjectOptions {
  keepCreatedAt?: boolean; // Add your custom property
}

// Create a custom Document interface that uses your new options

const deleteAtPath = (obj: any, path: any, index: number) => {
  if (index === path.length - 1) {
    // eslint-disable-next-line no-param-reassign
    delete obj[path[index]];
    return;
  }
  deleteAtPath(obj[path[index]], path, index + 1);
};

const toJSON = (schema: any) => {
  let transform: Function;
  if (schema.options.toJSON && schema.options.toJSON.transform) {
    transform = schema.options.toJSON.transform;
  }

  // eslint-disable-next-line no-param-reassign
  schema.options.toJSON = Object.assign(schema.options.toJSON || {}, {
    transform(doc: Document, ret: any, options: CustomToObjectOptions) {
      Object.keys(schema.paths).forEach((path) => {
        if (schema.paths[path].options && schema.paths[path].options.private) {
          deleteAtPath(ret, path.split('.'), 0);
        }
      });

      // eslint-disable-next-line no-param-reassign
      ret.id = ret._id.toString();
      // eslint-disable-next-line no-param-reassign
      delete ret._id;
      // eslint-disable-next-line no-param-reassign
      delete ret.__v;

      // delete ret.deletedAt;
      // eslint-disable-next-line no-param-reassign
      // delete ret.createdAt;
      // // eslint-disable-next-line no-param-reassign
      delete ret.updatedAt;

      // Now apply your custom transformation
      if (ret.permissions && Array.isArray(ret.permissions)) {
        ret.permissions = ret.permissions.map((perm: any) => perm.name);
      }
      
      if (transform) {
        return transform(doc, ret, options);
      }
    },
  });
};

export default toJSON;
