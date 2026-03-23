import { generateShortCode } from "../utils/short-code";

for (let i = 0; i < 10; i++) {
  const code = generateShortCode();
  console.log(code);

  console.assert(code.length === 7, `Expected length 7, got ${code.length}`);
  console.assert(
    /^[a-zA-Z0-9]+$/.test(code),
    `Code "${code}" contains non-base62 characters`,
  );
}

const codes = new Set<string>();
for (let i = 0; i < 10000; i++) {
  codes.add(generateShortCode());
}
console.log(`Generated 10,000 codes, ${codes.size} unique (expect ~10,000)`);
