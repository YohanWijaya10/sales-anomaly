import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const SALESMEN = [
  { id: "11111111-1111-1111-1111-111111111111", code: "SM001", name: "Andi Pratama" },
  { id: "22222222-2222-2222-2222-222222222222", code: "SM002", name: "Budi Santoso" },
  { id: "33333333-3333-3333-3333-333333333333", code: "SM003", name: "Citra Wulandari" },
  { id: "44444444-4444-4444-4444-444444444444", code: "SM004", name: "Dewi Lestari" },
  { id: "55555555-5555-5555-5555-555555555555", code: "SM005", name: "Eko Saputra" },
  { id: "66666666-6666-6666-6666-666666666666", code: "SM006", name: "Farhan Maulana" },
];

const OUTLETS = [
  { id: "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT001", name: "Toko Makmur Jaya" },
  { id: "aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT002", name: "Warung Berkah" },
  { id: "aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT003", name: "Sumber Rezeki" },
  { id: "aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT004", name: "Toko Sentosa" },
  { id: "aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT005", name: "Maju Bersama" },
  { id: "aaaaaaa6-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT006", name: "Abadi Store" },
  { id: "aaaaaaa7-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT007", name: "Harapan Jaya" },
  { id: "aaaaaaa8-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT008", name: "Cahaya Mart" },
  { id: "aaaaaaa9-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT009", name: "Prima Sejahtera" },
  { id: "aaaaaa10-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT010", name: "Untung Selalu" },
  { id: "aaaaaa11-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT011", name: "Sentral Grosir" },
  { id: "aaaaaa12-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT012", name: "Bintang Baru" },
  { id: "aaaaaa13-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT013", name: "Sinar Jaya" },
  { id: "aaaaaa14-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT014", name: "Mitra Usaha" },
  { id: "aaaaaa15-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT015", name: "Sejahtera Mart" },
];

function getDate(daysAgo: number, time: string): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.toISOString().split("T")[0]}T${time}:00.000Z`;
}

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);

  console.log("Seeding database...\n");

  // Clear existing data
  console.log("1. Clearing existing data...");
  await sql`TRUNCATE TABLE daily_insights_cache, sales, checkins, outlets, salesmen CASCADE`;
  console.log("   Done!\n");

  // Insert salesmen
  console.log("2. Inserting salesmen...");
  for (const s of SALESMEN) {
    await sql`INSERT INTO salesmen (id, code, name, active) VALUES (${s.id}, ${s.code}, ${s.name}, true)`;
  }
  console.log(`   ${SALESMEN.length} salesmen inserted!\n`);

  // Insert outlets
  console.log("3. Inserting outlets...");
  for (const o of OUTLETS) {
    await sql`INSERT INTO outlets (id, code, name) VALUES (${o.id}, ${o.code}, ${o.name})`;
  }
  console.log(`   ${OUTLETS.length} outlets inserted!\n`);

  // Insert checkins and sales
  console.log("4. Inserting checkins and sales...");

  const alice = SALESMEN[0].id;
  const bob = SALESMEN[1].id;
  const charlie = SALESMEN[2].id;
  const dewi = SALESMEN[3].id;
  const eko = SALESMEN[4].id;
  const farhan = SALESMEN[5].id;
  const outletCount = OUTLETS.length;

  let checkinCount = 0;
  let salesCount = 0;

  // ALICE - Normal performer (7 days)
  for (let day = 6; day >= 0; day--) {
    const outlets = [0, 1, 2, 3, 4].map((i) => OUTLETS[(day + i) % outletCount].id);
    const times = ["09:00", "10:30", "12:00", "14:00", "15:30"];

    for (let i = 0; i < 5; i++) {
      await sql`INSERT INTO checkins (salesman_id, outlet_id, ts) VALUES (${alice}, ${outlets[i]}, ${getDate(day, times[i])})`;
      checkinCount++;
    }

    // Alice makes 2-3 sales per day
    for (let i = 0; i < 3; i++) {
      if (Math.random() > 0.3) {
        const amount = Math.floor(Math.random() * 2000000) + 500000;
        const qty = Math.floor(amount / 50000);
        await sql`INSERT INTO sales (salesman_id, outlet_id, ts, amount, qty) VALUES (${alice}, ${outlets[i]}, ${getDate(day, times[i])}, ${amount}, ${qty})`;
        salesCount++;
      }
    }
  }

  // BOB - Many visits, ZERO sales (triggers RF_LOW_EFFECTIVENESS)
  for (let day = 6; day >= 0; day--) {
    const outlets = [0, 1, 2, 3, 4, 5].map((i) => OUTLETS[(day + i) % outletCount].id);
    const times = ["08:30", "09:30", "10:30", "13:00", "14:30", "16:00"];

    for (let i = 0; i < 6; i++) {
      await sql`INSERT INTO checkins (salesman_id, outlet_id, ts) VALUES (${bob}, ${outlets[i]}, ${getDate(day, times[i])})`;
      checkinCount++;
    }
    // NO SALES for Bob!
  }

  // CHARLIE - Low coverage, too consistent (triggers RF_LOW_COVERAGE + RF_TOO_CONSISTENT_7D)
  for (let day = 6; day >= 0; day--) {
    // Always exactly 5 visits to same 2 outlets
    const outlet1 = OUTLETS[0].id;
    const outlet2 = OUTLETS[1].id;
    const times = ["09:00", "10:30", "12:00", "14:00", "16:00"];

    await sql`INSERT INTO checkins (salesman_id, outlet_id, ts) VALUES (${charlie}, ${outlet1}, ${getDate(day, times[0])})`;
    await sql`INSERT INTO checkins (salesman_id, outlet_id, ts) VALUES (${charlie}, ${outlet1}, ${getDate(day, times[1])})`;
    await sql`INSERT INTO checkins (salesman_id, outlet_id, ts) VALUES (${charlie}, ${outlet2}, ${getDate(day, times[2])})`;
    await sql`INSERT INTO checkins (salesman_id, outlet_id, ts) VALUES (${charlie}, ${outlet1}, ${getDate(day, times[3])})`;
    await sql`INSERT INTO checkins (salesman_id, outlet_id, ts) VALUES (${charlie}, ${outlet2}, ${getDate(day, times[4])})`;
    checkinCount += 5;

    // Charlie makes 1 small sale per day
    const amount = Math.floor(Math.random() * 200000) + 300000;
    await sql`INSERT INTO sales (salesman_id, outlet_id, ts, amount, qty) VALUES (${charlie}, ${outlet1}, ${getDate(day, "14:30")}, ${amount}, ${Math.floor(amount / 50000)})`;
    salesCount++;
  }

  // DEWI - High performer, banyak kunjungan dan penjualan
  for (let day = 6; day >= 0; day--) {
    const outlets = [0, 1, 2, 3, 4, 5].map((i) => OUTLETS[(day * 2 + i) % outletCount].id);
    const times = ["08:45", "09:45", "11:00", "13:00", "14:30", "16:00"];

    for (let i = 0; i < 6; i++) {
      await sql`INSERT INTO checkins (salesman_id, outlet_id, ts) VALUES (${dewi}, ${outlets[i]}, ${getDate(day, times[i])})`;
      checkinCount++;
    }

    for (let i = 0; i < 5; i++) {
      if (Math.random() > 0.1) {
        const amount = Math.floor(Math.random() * 3500000) + 800000;
        const qty = Math.floor(amount / 50000);
        await sql`INSERT INTO sales (salesman_id, outlet_id, ts, amount, qty) VALUES (${dewi}, ${outlets[i]}, ${getDate(day, times[i])}, ${amount}, ${qty})`;
        salesCount++;
      }
    }
  }

  // EKO - Kunjungan sedikit tapi penjualan besar
  for (let day = 6; day >= 0; day--) {
    const outlets = [0, 3, 6].map((i) => OUTLETS[(day + i) % outletCount].id);
    const times = ["10:00", "13:30", "15:45"];

    for (let i = 0; i < 3; i++) {
      await sql`INSERT INTO checkins (salesman_id, outlet_id, ts) VALUES (${eko}, ${outlets[i]}, ${getDate(day, times[i])})`;
      checkinCount++;
    }

    for (let i = 0; i < 2; i++) {
      const amount = Math.floor(Math.random() * 6000000) + 2000000;
      const qty = Math.floor(amount / 75000);
      await sql`INSERT INTO sales (salesman_id, outlet_id, ts, amount, qty) VALUES (${eko}, ${outlets[i]}, ${getDate(day, times[i])}, ${amount}, ${qty})`;
      salesCount++;
    }
  }

  // FARHAN - Pola tidak stabil, kadang tanpa penjualan
  for (let day = 6; day >= 0; day--) {
    const visitCount = 3 + (day % 3);
    const times = ["09:15", "10:45", "12:30", "14:15", "15:45"];
    const outlets = Array.from({ length: visitCount }, (_, i) => OUTLETS[(day * 3 + i) % outletCount].id);

    for (let i = 0; i < visitCount; i++) {
      await sql`INSERT INTO checkins (salesman_id, outlet_id, ts) VALUES (${farhan}, ${outlets[i]}, ${getDate(day, times[i])})`;
      checkinCount++;
    }

    for (let i = 0; i < visitCount; i++) {
      if (Math.random() > 0.6) {
        const amount = Math.floor(Math.random() * 1500000) + 300000;
        const qty = Math.floor(amount / 50000);
        await sql`INSERT INTO sales (salesman_id, outlet_id, ts, amount, qty) VALUES (${farhan}, ${outlets[i]}, ${getDate(day, times[i])}, ${amount}, ${qty})`;
        salesCount++;
      }
    }
  }

  console.log(`   ${checkinCount} checkins, ${salesCount} sales inserted!\n`);

  // Verify
  console.log("5. Verifying...");
  const counts = await sql`
    SELECT
      (SELECT COUNT(*) FROM salesmen) as salesmen,
      (SELECT COUNT(*) FROM outlets) as outlets,
      (SELECT COUNT(*) FROM checkins) as checkins,
      (SELECT COUNT(*) FROM sales) as sales
  `;

  console.log(`   - Salesmen: ${counts[0].salesmen}`);
  console.log(`   - Outlets: ${counts[0].outlets}`);
  console.log(`   - Checkins: ${counts[0].checkins}`);
  console.log(`   - Sales: ${counts[0].sales}`);

  console.log("\nSeed complete!");
}

seed().catch(console.error);
