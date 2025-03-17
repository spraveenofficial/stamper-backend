// import { rolesEnum } from '../../config/roles';
// import { accessRoles } from './documents.interfaces';
import { toJSON } from '../toJSON';
import { IDocumentDoc, IDocumentModel } from './documents.interfaces';
import mongoose, { Schema } from 'mongoose';

const EmployeeSchema = new mongoose.Schema({
  _id: { type: Schema.Types.ObjectId, ref: "user" }, 
  email: { type: String, required: true }
});

const documentsSchema = new Schema<IDocumentDoc, IDocumentModel>(
  {
    folderName: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    access: {
      type: [String],
      // enum: accessRoles[],
      required: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department"
    },
    employees: {
      type: [EmployeeSchema]
    },
    documents: {
      type: [
        {
          name: String,
          url: String,
          size: String,
        },
      ],
      required: false,
      default: [],
    },
  },
  { timestamps: true }
);

documentsSchema.statics['isFolderAlreadyAdded'] = async function (
  folderName: string,
  organizationId: mongoose.Types.ObjectId
) {
  const folder = await this.findOne({ folderName, organizationId });
  return !!folder;
};

documentsSchema.plugin(toJSON);

const Document = mongoose.model<IDocumentDoc, IDocumentModel>('Document', documentsSchema);

export default Document;
