/**
 * Resolves the database the suite runs against.
 *
 * Order of preference: TEST_DATABASE_URL, else DATABASE_URL with its database
 * name swapped for `four_test`, else a local default. The name must end in
 * `_test` - the suite writes and deletes rows, so pointing it at a development
 * or production database has to be impossible rather than merely unlikely.
 */
export function resolveTestDatabaseUrl(): string {
  const explicit = process.env.TEST_DATABASE_URL;
  const raw = explicit ?? swapDatabaseName(process.env.DATABASE_URL) ?? "postgresql://postgres:four@localhost:5432/four_test";

  const name = new URL(raw).pathname.replace(/^\//, "");
  if (!name.endsWith("_test")) {
    throw new Error(
      `Refusing to run tests against database "${name}": the name must end in "_test". ` +
        `Set TEST_DATABASE_URL to a dedicated database.`,
    );
  }
  return raw;
}

function swapDatabaseName(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    parsed.pathname = "/four_test";
    return parsed.toString();
  } catch {
    return undefined;
  }
}
