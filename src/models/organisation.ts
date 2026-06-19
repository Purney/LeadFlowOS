import mongoose, { type InferSchemaType, Schema } from "mongoose";

const leadCustomFieldSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const organisationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    leadCustomFields: { type: [leadCustomFieldSchema], default: [] },
  },
  { timestamps: true },
);

export type OrganisationDocument = InferSchemaType<typeof organisationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Organisation =
  mongoose.models.Organisation ||
  mongoose.model("Organisation", organisationSchema);
