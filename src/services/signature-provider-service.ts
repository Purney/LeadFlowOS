import { requireEnv } from "@/lib/env";

export type SignatureEnvelopeInput = {
  title: string;
  signerName: string;
  signerEmail: string;
  termsMarkdown: string;
};

export type SignatureEnvelopeResult = {
  provider: "external";
  providerEnvelopeId: string;
  providerStatus: string;
  providerSigningUrl?: string;
};

export async function createSignatureEnvelope(
  input: SignatureEnvelopeInput,
): Promise<SignatureEnvelopeResult> {
  requireEnv("SIGNATURE_PROVIDER_API_KEY");

  throw new Error(
    `Signature provider SDK is not configured for "${input.title}". Add a provider implementation before enabling external envelopes.`,
  );
}
