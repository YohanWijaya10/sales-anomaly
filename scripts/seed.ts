import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const SALESMEN = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    code: "SM001",
    name: "Andi Pratama",
    leader_id: "aaaa1111-1111-1111-1111-111111111111",
    region_id: "dddd1111-1111-1111-1111-111111111111",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    code: "SM002",
    name: "Budi Santoso",
    leader_id: "aaaa1111-1111-1111-1111-111111111111",
    region_id: "dddd1111-1111-1111-1111-111111111111",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    code: "SM003",
    name: "Citra Wulandari",
    leader_id: "bbbb2222-2222-2222-2222-222222222222",
    region_id: "eeee2222-2222-2222-2222-222222222222",
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    code: "SM004",
    name: "Dewi Lestari",
    leader_id: "bbbb2222-2222-2222-2222-222222222222",
    region_id: "eeee2222-2222-2222-2222-222222222222",
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    code: "SM005",
    name: "Eko Saputra",
    leader_id: "cccc3333-3333-3333-3333-333333333333",
    region_id: "ffff3333-3333-3333-3333-333333333333",
  },
  {
    id: "66666666-6666-6666-6666-666666666666",
    code: "SM006",
    name: "Farhan Maulana",
    leader_id: "cccc3333-3333-3333-3333-333333333333",
    region_id: "ffff3333-3333-3333-3333-333333333333",
  },
  {
    id: "77777777-7777-7777-7777-777777777777",
    code: "SM007",
    name: "Gita Permata",
    leader_id: "dddd4444-4444-4444-4444-444444444444",
    region_id: "99991111-1111-1111-1111-111111111111",
  },
  {
    id: "88888888-8888-8888-8888-888888888888",
    code: "SM008",
    name: "Hafiz Ramadhan",
    leader_id: "dddd4444-4444-4444-4444-444444444444",
    region_id: "aaaa2222-2222-2222-2222-222222222222",
  },
  {
    id: "99999999-9999-9999-9999-999999999999",
    code: "SM009",
    name: "Intan Sari",
    leader_id: "eeee5555-5555-5555-5555-555555555555",
    region_id: "bbbb3333-3333-3333-3333-333333333333",
  },
  {
    id: "abababab-abab-abab-abab-abababababab",
    code: "SM010",
    name: "Joko Winarto",
    leader_id: "eeee5555-5555-5555-5555-555555555555",
    region_id: "cccc4444-4444-4444-4444-444444444444",
  },
  {
    id: "cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd",
    code: "SM011",
    name: "Kezia Putri",
    leader_id: "aaaa1111-1111-1111-1111-111111111111",
    region_id: "dddd1111-1111-1111-1111-111111111111",
  },
  {
    id: "efefefef-efef-efef-efef-efefefefefef",
    code: "SM012",
    name: "Lukman Hakim",
    leader_id: "bbbb2222-2222-2222-2222-222222222222",
    region_id: "eeee2222-2222-2222-2222-222222222222",
  },
  {
    id: "10101010-1010-1010-1010-101010101010",
    code: "SM013",
    name: "Mega Pratiwi",
    leader_id: "cccc3333-3333-3333-3333-333333333333",
    region_id: "ffff3333-3333-3333-3333-333333333333",
  },
  {
    id: "12121212-1212-1212-1212-121212121212",
    code: "SM014",
    name: "Nanda Saputri",
    leader_id: "dddd4444-4444-4444-4444-444444444444",
    region_id: "99991111-1111-1111-1111-111111111111",
  },
  {
    id: "13131313-1313-1313-1313-131313131313",
    code: "SM015",
    name: "Oki Firmansyah",
    leader_id: "eeee5555-5555-5555-5555-555555555555",
    region_id: "bbbb3333-3333-3333-3333-333333333333",
  },
];

const LEADERS = [
  { id: "aaaa1111-1111-1111-1111-111111111111", code: "LD001", name: "Raka Pramudya" },
  { id: "bbbb2222-2222-2222-2222-222222222222", code: "LD002", name: "Sari Kartika" },
  { id: "cccc3333-3333-3333-3333-333333333333", code: "LD003", name: "Hendra Wijaya" },
  { id: "dddd4444-4444-4444-4444-444444444444", code: "LD004", name: "Maya Lestari" },
  { id: "eeee5555-5555-5555-5555-555555555555", code: "LD005", name: "Rizal Aditya" },
];

const REGIONS = [
  {
    id: "dddd1111-1111-1111-1111-111111111111",
    code: "RG-JKT",
    name: "Jakarta",
    leader_id: "aaaa1111-1111-1111-1111-111111111111",
  },
  {
    id: "eeee2222-2222-2222-2222-222222222222",
    code: "RG-BDG",
    name: "Bandung",
    leader_id: "bbbb2222-2222-2222-2222-222222222222",
  },
  {
    id: "ffff3333-3333-3333-3333-333333333333",
    code: "RG-SBY",
    name: "Surabaya",
    leader_id: "cccc3333-3333-3333-3333-333333333333",
  },
  {
    id: "99991111-1111-1111-1111-111111111111",
    code: "RG-MDN",
    name: "Medan",
    leader_id: "dddd4444-4444-4444-4444-444444444444",
  },
  {
    id: "aaaa2222-2222-2222-2222-222222222222",
    code: "RG-MLG",
    name: "Malang",
    leader_id: "dddd4444-4444-4444-4444-444444444444",
  },
  {
    id: "bbbb3333-3333-3333-3333-333333333333",
    code: "RG-MKS",
    name: "Makassar",
    leader_id: "eeee5555-5555-5555-5555-555555555555",
  },
  {
    id: "cccc4444-4444-4444-4444-444444444444",
    code: "RG-SMG",
    name: "Semarang",
    leader_id: "eeee5555-5555-5555-5555-555555555555",
  },
];

const OUTLETS = [
  { id: "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT001", name: "Toko Makmur Jaya", lat: -6.2088, lng: 106.8456 },
  { id: "aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT002", name: "Warung Berkah", lat: -6.212, lng: 106.851 },
  { id: "aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT003", name: "Sumber Rezeki", lat: -6.215, lng: 106.842 },
  { id: "aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT004", name: "Toko Sentosa", lat: -6.22, lng: 106.838 },
  { id: "aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT005", name: "Maju Bersama", lat: -6.225, lng: 106.849 },
  { id: "aaaaaaa6-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT006", name: "Abadi Store", lat: -6.23, lng: 106.855 },
  { id: "aaaaaaa7-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT007", name: "Harapan Jaya", lat: -6.235, lng: 106.84 },
  { id: "aaaaaaa8-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT008", name: "Cahaya Mart", lat: -6.24, lng: 106.847 },
  { id: "aaaaaaa9-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT009", name: "Prima Sejahtera", lat: -6.245, lng: 106.853 },
  { id: "aaaaaa10-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT010", name: "Untung Selalu", lat: -6.25, lng: 106.86 },
  { id: "aaaaaa11-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT011", name: "Sentral Grosir", lat: -6.207, lng: 106.8525 },
  { id: "aaaaaa12-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT012", name: "Bintang Baru", lat: -6.2135, lng: 106.8445 },
  { id: "aaaaaa13-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT013", name: "Sinar Jaya", lat: -6.2185, lng: 106.8575 },
  { id: "aaaaaa14-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT014", name: "Mitra Usaha", lat: -6.2265, lng: 106.8465 },
  { id: "aaaaaa15-aaaa-aaaa-aaaa-aaaaaaaaaaaa", code: "OUT015", name: "Sejahtera Mart", lat: -6.2325, lng: 106.8585 },
];

const SEED_START_DATE = "2026-01-01";
const SEED_END_DATE = "2026-02-05";

function getDate(daysFromStart: number, time: string): string {
  const d = new Date(`${SEED_START_DATE}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + daysFromStart);
  return `${d.toISOString().split("T")[0]}T${time}:00.000Z`;
}

function getTotalDaysInclusive(): number {
  const start = new Date(`${SEED_START_DATE}T00:00:00.000Z`);
  const end = new Date(`${SEED_END_DATE}T00:00:00.000Z`);
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);

  console.log("Seeding database...\n");

  // Clear existing data
  console.log("1. Clearing existing data...");
  await sql`TRUNCATE TABLE daily_insights_cache, sales, checkins, outlets, salesmen, regions, leaders CASCADE`;
  console.log("   Done!\n");

  // Insert leaders
  console.log("2. Inserting leaders...");
  for (const l of LEADERS) {
    await sql`INSERT INTO leaders (id, code, name, active) VALUES (${l.id}, ${l.code}, ${l.name}, true)`;
  }
  console.log(`   ${LEADERS.length} leaders inserted!\n`);

  // Insert regions
  console.log("3. Inserting regions...");
  for (const r of REGIONS) {
    await sql`INSERT INTO regions (id, code, name, leader_id) VALUES (${r.id}, ${r.code}, ${r.name}, ${r.leader_id})`;
  }
  console.log(`   ${REGIONS.length} regions inserted!\n`);

  // Insert salesmen
  console.log("4. Inserting salesmen...");
  for (const s of SALESMEN) {
    await sql`INSERT INTO salesmen (id, code, name, leader_id, region_id, active)
      VALUES (${s.id}, ${s.code}, ${s.name}, ${s.leader_id}, ${s.region_id}, true)`;
  }
  console.log(`   ${SALESMEN.length} salesmen inserted!\n`);

  // Insert outlets
  console.log("5. Inserting outlets...");
  for (const o of OUTLETS) {
    await sql`INSERT INTO outlets (id, code, name, lat, lng)
      VALUES (${o.id}, ${o.code}, ${o.name}, ${o.lat}, ${o.lng})`;
  }
  console.log(`   ${OUTLETS.length} outlets inserted!\n`);

  // Insert checkins and sales
  console.log("6. Inserting checkins and sales...");

  const alice = SALESMEN[0].id;
  const bob = SALESMEN[1].id;
  const charlie = SALESMEN[2].id;
  const dewi = SALESMEN[3].id;
  const eko = SALESMEN[4].id;
  const farhan = SALESMEN[5].id;
  const outletCount = OUTLETS.length;
  const totalDays = getTotalDaysInclusive();

  let checkinCount = 0;
  let salesCount = 0;

  // ALICE - Normal performer (7 days)
  for (let day = 0; day < totalDays; day++) {
    const outlets = [0, 1, 2, 3, 4].map((i) => OUTLETS[(day + i) % outletCount].id);
    const times = ["09:00", "10:30", "12:00", "14:00", "15:30"];

    for (let i = 0; i < 5; i++) {
      const leaderId = SALESMEN[0].leader_id;
      const regionId = SALESMEN[0].region_id;
      await sql`INSERT INTO checkins (salesman_id, leader_id, region_id, outlet_id, ts)
        VALUES (${alice}, ${leaderId}, ${regionId}, ${outlets[i]}, ${getDate(day, times[i])})`;
      checkinCount++;
    }

    // Alice makes 2-3 sales per day
    for (let i = 0; i < 3; i++) {
      if (Math.random() > 0.3) {
        const amount = Math.floor(Math.random() * 2000000) + 500000;
        const qty = Math.floor(amount / 50000);
        const leaderId = SALESMEN[0].leader_id;
        const regionId = SALESMEN[0].region_id;
        await sql`INSERT INTO sales (salesman_id, leader_id, region_id, outlet_id, ts, amount, qty)
          VALUES (${alice}, ${leaderId}, ${regionId}, ${outlets[i]}, ${getDate(day, times[i])}, ${amount}, ${qty})`;
        salesCount++;
      }
    }
  }

  // BOB - Many visits, ZERO sales (triggers RF_LOW_EFFECTIVENESS)
  for (let day = 0; day < totalDays; day++) {
    const outlets = [0, 1, 2, 3, 4, 5].map((i) => OUTLETS[(day + i) % outletCount].id);
    const times = ["08:30", "09:30", "10:30", "13:00", "14:30", "16:00"];

    for (let i = 0; i < 6; i++) {
      const leaderId = SALESMEN[1].leader_id;
      const regionId = SALESMEN[1].region_id;
      await sql`INSERT INTO checkins (salesman_id, leader_id, region_id, outlet_id, ts)
        VALUES (${bob}, ${leaderId}, ${regionId}, ${outlets[i]}, ${getDate(day, times[i])})`;
      checkinCount++;
    }
    // NO SALES for Bob!
  }

  // CHARLIE - Low coverage, too consistent (triggers RF_LOW_COVERAGE + RF_TOO_CONSISTENT_7D)
  for (let day = 0; day < totalDays; day++) {
    // Always exactly 5 visits to same 2 outlets
    const outlet1 = OUTLETS[0].id;
    const outlet2 = OUTLETS[1].id;
    const times = ["09:00", "10:30", "12:00", "14:00", "16:00"];

    const leaderId = SALESMEN[2].leader_id;
    const regionId = SALESMEN[2].region_id;
    await sql`INSERT INTO checkins (salesman_id, leader_id, region_id, outlet_id, ts)
      VALUES (${charlie}, ${leaderId}, ${regionId}, ${outlet1}, ${getDate(day, times[0])})`;
    await sql`INSERT INTO checkins (salesman_id, leader_id, region_id, outlet_id, ts)
      VALUES (${charlie}, ${leaderId}, ${regionId}, ${outlet1}, ${getDate(day, times[1])})`;
    await sql`INSERT INTO checkins (salesman_id, leader_id, region_id, outlet_id, ts)
      VALUES (${charlie}, ${leaderId}, ${regionId}, ${outlet2}, ${getDate(day, times[2])})`;
    await sql`INSERT INTO checkins (salesman_id, leader_id, region_id, outlet_id, ts)
      VALUES (${charlie}, ${leaderId}, ${regionId}, ${outlet1}, ${getDate(day, times[3])})`;
    await sql`INSERT INTO checkins (salesman_id, leader_id, region_id, outlet_id, ts)
      VALUES (${charlie}, ${leaderId}, ${regionId}, ${outlet2}, ${getDate(day, times[4])})`;
    checkinCount += 5;

    // Charlie makes 1 small sale per day
    const amount = Math.floor(Math.random() * 200000) + 300000;
    const cLeaderId = SALESMEN[2].leader_id;
    const cRegionId = SALESMEN[2].region_id;
    await sql`INSERT INTO sales (salesman_id, leader_id, region_id, outlet_id, ts, amount, qty)
      VALUES (${charlie}, ${cLeaderId}, ${cRegionId}, ${outlet1}, ${getDate(day, "14:30")}, ${amount}, ${Math.floor(amount / 50000)})`;
    salesCount++;
  }

  // DEWI - High performer, banyak kunjungan dan penjualan
  for (let day = 0; day < totalDays; day++) {
    const outlets = [0, 1, 2, 3, 4, 5].map((i) => OUTLETS[(day * 2 + i) % outletCount].id);
    const times = ["08:45", "09:45", "11:00", "13:00", "14:30", "16:00"];

    for (let i = 0; i < 6; i++) {
      const leaderId = SALESMEN[3].leader_id;
      const regionId = SALESMEN[3].region_id;
      await sql`INSERT INTO checkins (salesman_id, leader_id, region_id, outlet_id, ts)
        VALUES (${dewi}, ${leaderId}, ${regionId}, ${outlets[i]}, ${getDate(day, times[i])})`;
      checkinCount++;
    }

    for (let i = 0; i < 5; i++) {
      if (Math.random() > 0.1) {
        const amount = Math.floor(Math.random() * 3500000) + 800000;
        const qty = Math.floor(amount / 50000);
        const leaderId = SALESMEN[3].leader_id;
        const regionId = SALESMEN[3].region_id;
        await sql`INSERT INTO sales (salesman_id, leader_id, region_id, outlet_id, ts, amount, qty)
          VALUES (${dewi}, ${leaderId}, ${regionId}, ${outlets[i]}, ${getDate(day, times[i])}, ${amount}, ${qty})`;
        salesCount++;
      }
    }
  }

  // EKO - Kunjungan sedikit tapi penjualan besar
  for (let day = 0; day < totalDays; day++) {
    const outlets = [0, 3, 6].map((i) => OUTLETS[(day + i) % outletCount].id);
    const times = ["10:00", "13:30", "15:45"];

    for (let i = 0; i < 3; i++) {
      const leaderId = SALESMEN[4].leader_id;
      const regionId = SALESMEN[4].region_id;
      await sql`INSERT INTO checkins (salesman_id, leader_id, region_id, outlet_id, ts)
        VALUES (${eko}, ${leaderId}, ${regionId}, ${outlets[i]}, ${getDate(day, times[i])})`;
      checkinCount++;
    }

    for (let i = 0; i < 2; i++) {
      const amount = Math.floor(Math.random() * 6000000) + 2000000;
      const qty = Math.floor(amount / 75000);
      const leaderId = SALESMEN[4].leader_id;
      const regionId = SALESMEN[4].region_id;
      await sql`INSERT INTO sales (salesman_id, leader_id, region_id, outlet_id, ts, amount, qty)
        VALUES (${eko}, ${leaderId}, ${regionId}, ${outlets[i]}, ${getDate(day, times[i])}, ${amount}, ${qty})`;
      salesCount++;
    }
  }

  // FARHAN - Pola tidak stabil, kadang tanpa penjualan
  for (let day = 0; day < totalDays; day++) {
    const visitCount = 3 + (day % 3);
    const times = ["09:15", "10:45", "12:30", "14:15", "15:45"];
    const outlets = Array.from({ length: visitCount }, (_, i) => OUTLETS[(day * 3 + i) % outletCount].id);

    for (let i = 0; i < visitCount; i++) {
      const leaderId = SALESMEN[5].leader_id;
      const regionId = SALESMEN[5].region_id;
      await sql`INSERT INTO checkins (salesman_id, leader_id, region_id, outlet_id, ts)
        VALUES (${farhan}, ${leaderId}, ${regionId}, ${outlets[i]}, ${getDate(day, times[i])})`;
      checkinCount++;
    }

    for (let i = 0; i < visitCount; i++) {
      if (Math.random() > 0.6) {
        const amount = Math.floor(Math.random() * 1500000) + 300000;
        const qty = Math.floor(amount / 50000);
        const leaderId = SALESMEN[5].leader_id;
        const regionId = SALESMEN[5].region_id;
        await sql`INSERT INTO sales (salesman_id, leader_id, region_id, outlet_id, ts, amount, qty)
          VALUES (${farhan}, ${leaderId}, ${regionId}, ${outlets[i]}, ${getDate(day, times[i])}, ${amount}, ${qty})`;
        salesCount++;
      }
    }
  }

  // OTHER SALESMEN - Pola normal (4-5 kunjungan/hari, 1-3 transaksi)
  for (let sIndex = 6; sIndex < SALESMEN.length; sIndex++) {
    const salesman = SALESMEN[sIndex];
  for (let day = 0; day < totalDays; day++) {
      const visitCount = 4 + (day % 2);
      const times = ["09:10", "10:40", "12:10", "14:05", "15:35"];
      const outlets = Array.from(
        { length: visitCount },
        (_, i) => OUTLETS[(day * 4 + sIndex + i) % outletCount].id
      );

      for (let i = 0; i < visitCount; i++) {
        await sql`INSERT INTO checkins (salesman_id, leader_id, region_id, outlet_id, ts)
          VALUES (${salesman.id}, ${salesman.leader_id}, ${salesman.region_id}, ${outlets[i]}, ${getDate(day, times[i])})`;
        checkinCount++;
      }

      for (let i = 0; i < visitCount; i++) {
        if (Math.random() > 0.4) {
          const amount = Math.floor(Math.random() * 2200000) + 400000;
          const qty = Math.floor(amount / 50000);
          await sql`INSERT INTO sales (salesman_id, leader_id, region_id, outlet_id, ts, amount, qty)
            VALUES (${salesman.id}, ${salesman.leader_id}, ${salesman.region_id}, ${outlets[i]}, ${getDate(day, times[i])}, ${amount}, ${qty})`;
          salesCount++;
        }
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
