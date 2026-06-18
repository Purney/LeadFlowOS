import { connectToDatabase } from "@/lib/db";
import { Organisation } from "@/models/organisation";
import { User } from "@/models/user";
import { createSlug } from "@/utils/slug";
import {
  organisationSettingsSchema,
  type OrganisationSettingsInput,
} from "@/validation/organisation";

const defaultPositiveReplyBody =
  "Thanks {FIRST_NAME}, glad this is relevant.\n\nThe easiest next step is to book a short call so I can understand the workflow and show where automation would fit.\n\nYou can book a time here: {BOOKING_LINK}\n\n{GLOBAL_SIGNATURE}";

type OutboundSettingsView = {
  positiveAutoReplyEnabled?: boolean;
  positiveAutoReplyDelayMinutes?: number;
  positiveAutoReplySubject?: string;
  positiveAutoReplyBody?: string;
  bookingLink?: string;
  globalSignature?: string;
};

export async function hasAnyUser() {
  await connectToDatabase();
  return (await User.exists({})) !== null;
}

export async function createOrganisation(name: string) {
  await connectToDatabase();

  const baseSlug = createSlug(name);
  let slug = baseSlug;
  let suffix = 2;

  while (await Organisation.exists({ slug })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return Organisation.create({ name, slug });
}

export async function getBootstrapStatus() {
  return {
    hasOwner: await hasAnyUser(),
  };
}

export async function getOrganisationSettings(organisationId: string) {
  await connectToDatabase();

  const organisation = await Organisation.findById(organisationId)
    .select("leadCustomFields outboundSettings")
    .lean();
  const outboundSettings =
    (organisation?.outboundSettings as OutboundSettingsView | undefined) ?? {};

  return {
    leadCustomFields: organisation?.leadCustomFields ?? [],
    outboundSettings: {
      positiveAutoReplyEnabled:
        outboundSettings.positiveAutoReplyEnabled ?? false,
      positiveAutoReplyDelayMinutes:
        outboundSettings.positiveAutoReplyDelayMinutes ?? 60,
      positiveAutoReplySubject:
        outboundSettings.positiveAutoReplySubject ?? "Re: {NORMALISED_COMPANY}",
      positiveAutoReplyBody:
        outboundSettings.positiveAutoReplyBody ?? defaultPositiveReplyBody,
      bookingLink: outboundSettings.bookingLink,
      globalSignature: outboundSettings.globalSignature,
    },
  };
}

export async function updateOrganisationSettings(
  organisationId: string,
  input: OrganisationSettingsInput,
) {
  const data = organisationSettingsSchema.parse(input);
  await connectToDatabase();

  return Organisation.findByIdAndUpdate(
    organisationId,
    {
      $set: {
        leadCustomFields: data.leadCustomFields,
        outboundSettings: data.outboundSettings,
      },
    },
    { returnDocument: "after" },
  );
}
