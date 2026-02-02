import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import * as fs from "fs";
import * as path from "path";

// Load .env.local
config({ path: ".env.local" });

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inString = false;
  let stringChar = "";

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const prevChar = i > 0 ? sql[i - 1] : "";

    // Handle string literals
    if ((char === "'" || char === '"') && prevChar !== "\\") {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
    }

    current += char;

    // Split on semicolon when not in string
    if (char === ";" && !inString) {
      const trimmed = current.trim();
      if (trimmed.length > 1) {
        statements.push(trimmed);
      }
      current = "";
    }
  }

  // Add remaining content
  const remaining = current.trim();
  if (remaining.length > 0 && remaining !== ";") {
    statements.push(remaining);
  }

  return statements.filter((s) => {
    const clean = s.replace(/--.*$/gm, "").trim();
    return clean.length > 0 && clean !== ";";
  });
}

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL not found in environment");
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  console.log("Running migrations...\n");

  // Run schema
  console.log("1. Creating tables (schema.sql)...");
  const schemaPath = path.join(process.cwd(), "sql", "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");
  const schemaStatements = splitSqlStatements(schemaSql);

  for (const statement of schemaStatements) {
    try {
      await sql.query(statement);
      process.stdout.write(".");
    } catch (error: unknown) {
      const err = error as Error;
      if (!err.message?.includes("already exists")) {
        console.error(`\n   Error: ${err.message.slice(0, 100)}`);
      }
    }
  }
  console.log("\n   Tables created!\n");

  // Run seed
  console.log("2. Seeding data (seed.sql)...");
  const seedPath = path.join(process.cwd(), "sql", "seed.sql");
  const seedSql = fs.readFileSync(seedPath, "utf-8");
  const seedStatements = splitSqlStatements(seedSql);

  let successCount = 0;
  let errorCount = 0;

  for (const statement of seedStatements) {
    try {
      await sql.query(statement);
      successCount++;
      process.stdout.write(".");
    } catch (error: unknown) {
      errorCount++;
      const err = error as Error;
      // Only log non-cascade errors
      if (!err.message?.includes("CASCADE")) {
        console.error(`\n   Error: ${err.message.slice(0, 80)}`);
      }
    }
  }
  console.log(`\n   Executed: ${successCount} success, ${errorCount} errors\n`);

  // Verify
  console.log("3. Verifying...");
  try {
    const salesmen = await sql`SELECT COUNT(*) as count FROM salesmen`;
    const outlets = await sql`SELECT COUNT(*) as count FROM outlets`;
    const checkins = await sql`SELECT COUNT(*) as count FROM checkins`;
    const sales = await sql`SELECT COUNT(*) as count FROM sales`;

    console.log(`   - Salesmen: ${salesmen[0].count}`);
    console.log(`   - Outlets: ${outlets[0].count}`);
    console.log(`   - Checkins: ${checkins[0].count}`);
    console.log(`   - Sales: ${sales[0].count}`);
    console.log("\nMigration complete!");
  } catch (error) {
    console.error("   Verification failed - tables may not exist");
    console.error(error);
  }
}

migrate().catch(console.error);
