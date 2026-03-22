import {
  createUrlSchema,
  paginationQuerySchema,
} from "../validators/url.validator";

console.log("=== createUrlSchema tests ===\n");

// Valid URL — should normalize and strip tracking
const valid = createUrlSchema.safeParse({
  longUrl: "  HTTPS://EXAMPLE.COM/path?utm_source=google&id=42  ",
});
console.log("Valid URL:", valid.success ? valid.data : valid.error?.format());
// Expected: { longUrl: "https://example.com/path?id=42" }

// Private IP — should reject
const privateIp = createUrlSchema.safeParse({
  longUrl: "http://192.168.1.1/admin",
});
console.log(
  "Private IP:",
  privateIp.success ? "SHOULD HAVE FAILED" : "Rejected ✓",
);

// Localhost — should reject
const localhost = createUrlSchema.safeParse({
  longUrl: "http://localhost:3000/api",
});
console.log(
  "Localhost:",
  localhost.success ? "SHOULD HAVE FAILED" : "Rejected ✓",
);

// AWS metadata — should reject
const awsMeta = createUrlSchema.safeParse({
  longUrl: "http://169.254.169.254/latest/meta-data/",
});
console.log(
  "AWS metadata:",
  awsMeta.success ? "SHOULD HAVE FAILED" : "Rejected ✓",
);

// JavaScript protocol — should reject
const jsProto = createUrlSchema.safeParse({
  longUrl: "javascript:alert(1)",
});
console.log(
  "JS protocol:",
  jsProto.success ? "SHOULD HAVE FAILED" : "Rejected ✓",
);

// With custom alias
const withAlias = createUrlSchema.safeParse({
  longUrl: "https://example.com/article",
  customAlias: "my-article",
});
console.log("With alias:", withAlias.success ? withAlias.data : "FAILED");

// With expiry in the past — should reject
const pastExpiry = createUrlSchema.safeParse({
  longUrl: "https://example.com",
  expiresAt: "2020-01-01T00:00:00Z",
});
console.log(
  "Past expiry:",
  pastExpiry.success ? "SHOULD HAVE FAILED" : "Rejected ✓",
);

// Empty body — should show all required field errors
const empty = createUrlSchema.safeParse({});
console.log("\nEmpty body errors:");
if (!empty.success) {
  empty.error.issues.forEach((i) =>
    console.log(`  ${i.path.join(".")}: ${i.message}`),
  );
}

console.log("\n=== paginationQuerySchema tests ===\n");

// No params — should use defaults
const defaultPag = paginationQuerySchema.parse({});
console.log("Defaults:", defaultPag);
// Expected: { limit: 20 }

// With cursor
const withCursor = paginationQuerySchema.parse({
  cursor: "507f1f77bcf86cd799439011",
  limit: "10",
});
console.log("With cursor:", withCursor);

// Invalid cursor format
const badCursor = paginationQuerySchema.safeParse({ cursor: "not-valid" });
console.log(
  "Bad cursor:",
  badCursor.success ? "SHOULD HAVE FAILED" : "Rejected ✓",
);
