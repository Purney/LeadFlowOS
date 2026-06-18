import mongoose, { type InferSchemaType, Schema } from "mongoose";

const leadCustomFieldSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const outboundSettingsSchema = new Schema(
  {
    globalSignature: { type: String, trim: true },
    positiveAutoReplyEnabled: { type: Boolean, default: false },
    positiveAutoReplyDelayMinutes: { type: Number, min: 0, max: 60, default: 60 },
    positiveAutoReplySubject: {
      type: String,
      trim: true,
      default: "Re: {NORMALISED_COMPANY}",
    },
    positiveAutoReplyBody: {
      type: String,
      trim: true,
      default:
        "Thanks {FIRST_NAME}, glad this is relevant.\n\nThe easiest next step is to book a short call so I can understand the workflow and show where automation would fit.\n\nYou can book a time here: {BOOKING_LINK}\n\n{GLOBAL_SIGNATURE}",
    },
    bookingLink: { type: String, trim: true },
  },
  { _id: false },
);

const organisationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    leadCustomFields: { type: [leadCustomFieldSchema], default: [] },
    outboundSettings: { type: outboundSettingsSchema, default: {} },
  },
  { timestamps: true },
);

export type OrganisationDocument = InferSchemaType<typeof organisationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Organisation =
  mongoose.models.Organisation ||
  mongoose.model("Organisation", organisationSchema);
