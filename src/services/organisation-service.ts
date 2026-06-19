import { connectToDatabase } from "@/lib/db";
import { Organisation } from "@/models/organisation";
import { User } from "@/models/user";
import { createSlug } from "@/utils/slug";
import {
  organisationSettingsSchema,
  type OrganisationSettingsInput,
} from "@/validation/organisation";

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
    .select("leadCustomFields")
    .lean();

  return {
    leadCustomFields: organisation?.leadCustomFields ?? [],
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
      },
    },
    { returnDocument: "after" },
  );
}
