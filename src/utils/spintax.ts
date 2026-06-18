function hashSeed(seed: string) {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash);
}

const spintaxPattern = /\{\{\s*RANDOM\s*\|([^{}]+)\}\}/gi;

export function renderSpintax(template: string, seed = "") {
  let occurrence = 0;

  return template.replace(spintaxPattern, (match, options: string) => {
    const choices = options
      .split("|")
      .map((choice) => choice.trim())
      .filter(Boolean);

    if (choices.length === 0) {
      return match;
    }

    const index = hashSeed(`${seed}:${occurrence}`) % choices.length;
    occurrence += 1;
    return choices[index];
  });
}
