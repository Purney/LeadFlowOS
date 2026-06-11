import { connectToDatabase } from "@/lib/db";
import { Organisation } from "@/models/organisation";
import { User } from "@/models/user";
import { createSlug } from "@/utils/slug";

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
