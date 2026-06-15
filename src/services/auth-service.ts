import { getEnv } from "@/lib/env";
import { hashPassword, verifyPassword } from "@/lib/password";
import { connectToDatabase } from "@/lib/db";
import { SetupLock } from "@/models/setup-lock";
import { User } from "@/models/user";
import { createActivity } from "@/services/activity-service";
import { createOrganisation, hasAnyUser } from "@/services/organisation-service";
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from "@/validation/auth";

export class SignupClosedError extends Error {
  constructor() {
    super("Initial owner already exists.");
    this.name = "SignupClosedError";
  }
}

export async function createFirstOwner(input: SignupInput) {
  const data = signupSchema.parse(input);
  const env = getEnv();
  await connectToDatabase();

  if ((await hasAnyUser()) && !env.ALLOW_ADDITIONAL_ORG_SIGNUPS) {
    throw new SignupClosedError();
  }

  let ownsSetupLock = false;

  if (!env.ALLOW_ADDITIONAL_ORG_SIGNUPS) {
    try {
      await SetupLock.create({ key: "initial-owner" });
      ownsSetupLock = true;
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error as { code?: number }).code === 11000
      ) {
        throw new SignupClosedError();
      }
      throw error;
    }
  }

  let organisation;
  let user;

  try {
    organisation = await createOrganisation(data.organisationName);
    user = await User.create({
      organisationId: organisation._id,
      name: data.ownerName,
      email: data.email,
      passwordHash: await hashPassword(data.password),
      role: "owner",
    });
  } catch (error) {
    if (ownsSetupLock) {
      await SetupLock.deleteOne({ key: "initial-owner" });
    }
    throw error;
  }

  try {
    await createActivity({
      organisationId: organisation._id.toString(),
      actorUserId: user._id.toString(),
      entityType: "organisation",
      entityId: organisation._id.toString(),
      action: "organisation.created",
      metadata: { source: "first_owner_signup" },
    });
  } catch (error) {
    console.error("Failed to record first-owner signup activity.", error);
  }

  return {
    user,
    organisation,
  };
}

export async function authenticateCredentials(input: LoginInput) {
  const data = loginSchema.parse(input);
  await connectToDatabase();

  const user = await User.findOne({ email: data.email });

  if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
    return null;
  }

  await createActivity({
    organisationId: user.organisationId.toString(),
    actorUserId: user._id.toString(),
    entityType: "user",
    entityId: user._id.toString(),
    action: "auth.login",
  });

  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    organisationId: user.organisationId.toString(),
    role: user.role,
  };
}
