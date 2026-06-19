import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("MONGODB_URI is required.");
  process.exit(1);
}

const outreachCollections = [
  "campaigns",
  "campaignenrollments",
  "sendbatches",
  "emailaccounts",
  "emailmessages",
  "emailevents",
  "suppressions",
];

await mongoose.connect(uri);

try {
  const db = mongoose.connection.db;
  const existingCollections = new Set(
    (await db.listCollections().toArray()).map((collection) => collection.name),
  );

  for (const collectionName of outreachCollections) {
    if (!existingCollections.has(collectionName)) {
      console.log(`Skipped missing collection: ${collectionName}`);
      continue;
    }

    const result = await db.collection(collectionName).deleteMany({});
    console.log(`Deleted ${result.deletedCount} documents from ${collectionName}.`);
  }

  const aiResult = await db.collection("aidrafts").deleteMany({
    type: { $in: ["cold_email", "reply"] },
  });
  console.log(`Deleted ${aiResult.deletedCount} outreach AI drafts.`);

  const organisationResult = await db.collection("organisations").updateMany(
    {},
    { $unset: { outboundSettings: "" } },
  );
  console.log(`Removed outbound settings from ${organisationResult.modifiedCount} organisations.`);

  const leadResult = await db.collection("leads").updateMany(
    {},
    {
      $unset: {
        specificDataPoint: "",
        normalisedCompany: "",
        magnetName: "",
        personalisedWorkflowValue: "",
        senderEmailSignature: "",
      },
    },
  );
  console.log(`Removed outreach lead fields from ${leadResult.modifiedCount} leads.`);

  const leadStatusResult = await db.collection("leads").updateMany(
    { status: { $in: ["contacted", "replied", "new"] } },
    { $set: { status: "discovery_booked" } },
  );
  console.log(`Rebased ${leadStatusResult.modifiedCount} leads to discovery_booked.`);

  const lifecycleResult = await db.collection("lifecycleaccounts").updateMany(
    { stage: "cold_outreach" },
    { $set: { stage: "proposal_sales" } },
  );
  console.log(`Moved ${lifecycleResult.modifiedCount} lifecycle accounts to proposal_sales.`);
} finally {
  await mongoose.disconnect();
}
