import { PrismaClient, Role, OrderStatus, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

const FIRST_NAMES = [
  "Ahmed", "Fatima", "Mohammed", "Noura", "Omar", "Sarah", "Tariq", "Layla",
  "Khalid", "Maha", "Fahad", "Reem", "Zaid", "Huda", "Abdullah", "Aisha",
  "Yousef", "Dana", "Sultan", "Lina", "Ali", "Hana", "Hamza", "Salma",
  "James", "Emma", "Liam", "Olivia", "Noah", "Sophia", "Lucas", "Mia"
];

const LAST_NAMES = [
  "Al-Harbi", "Al-Ghamdi", "Al-Otaibi", "Al-Zahrani", "Al-Shehri", "Al-Dossari",
  "Al-Mutairi", "Al-Qarni", "Al-Anzi", "Al-Shammari", "Smith", "Johnson",
  "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson", "Taylor", "Anderson"
];

const DOMAINS = ["example.com", "sample.org", "testmail.dev", "customer.local"];

const CATALOG = [
  { name: "Ergonomic Office Chair", price: 249.99 },
  { name: "Standing Desk 140x70", price: 399.50 },
  { name: "Ultra-Wide Monitor 34\"", price: 499.00 },
  { name: "Mechanical Keyboard RGB", price: 89.95 },
  { name: "Wireless Precision Mouse", price: 59.99 },
  { name: "USB-C Multi-Port Hub", price: 39.50 },
  { name: "Noise-Cancelling Headset", price: 149.00 },
  { name: "Aluminum Laptop Stand", price: 29.99 },
  { name: "Desk Leather Pad XL", price: 19.99 },
  { name: "1080p Streaming Webcam", price: 69.00 },
  { name: "Braided Thunderbolt 4 Cable", price: 24.50 },
  { name: "Smart LED Desk Lamp", price: 44.00 }
];

const STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PROCESSING,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED
];

// Development credentials
export const SEED_USERS = [
  {
    email: "admin@sarh.dev",
    password: "AdminPassword123!",
    role: Role.ADMIN,
  },
  {
    email: "agent@sarh.dev",
    password: "AgentPassword123!",
    role: Role.AGENT,
  },
];

async function main() {
  console.log("=== SARH Take-Home Database Seed ===");
  console.log("1. Seeding deterministic development accounts...");

  for (const user of SEED_USERS) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        passwordHash,
        role: user.role,
      },
      create: {
        email: user.email,
        passwordHash,
        role: user.role,
      },
    });
    console.log(`   - Seeded user: ${user.email} (${user.role})`);
  }

  console.log("2. Cleaning existing order datasets to maintain deterministic count (repeatable seed)...");
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "idempotency_records", "order_items", "orders" CASCADE;'
  );

  const TOTAL_ORDERS = 50_000;
  const BATCH_SIZE = 5_000;
  const now = Date.now();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

  console.log(`3. Generating and inserting ${TOTAL_ORDERS.toLocaleString()} orders in batches of ${BATCH_SIZE.toLocaleString()}...`);
  const startTime = Date.now();

  let totalItemsCreated = 0;

  for (let batchStart = 0; batchStart < TOTAL_ORDERS; batchStart += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, TOTAL_ORDERS - batchStart);
    const orderData: Prisma.OrderCreateManyInput[] = [];
    const itemData: Prisma.OrderItemCreateManyInput[] = [];

    for (let i = 0; i < batchSize; i++) {
      const orderIndex = batchStart + i;
      const orderId = crypto.randomUUID();

      const firstName = FIRST_NAMES[orderIndex % FIRST_NAMES.length];
      const lastName = LAST_NAMES[(orderIndex * 3) % LAST_NAMES.length];
      const domain = DOMAINS[(orderIndex * 7) % DOMAINS.length];
      const customerName = `${firstName} ${lastName}`;
      const customerEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z]/g, "")}${orderIndex + 1}@${domain}`;

      const status = STATUSES[orderIndex % STATUSES.length];

      // Random createdAt within the last 90 days
      const randomOffset = Math.floor(Math.random() * ninetyDaysMs);
      const createdAt = new Date(now - randomOffset);

      // 1 to 5 line items per order
      const itemCount = (orderIndex % 5) + 1;
      let orderTotal = 0;

      for (let j = 0; j < itemCount; j++) {
        const catalogItem = CATALOG[(orderIndex + j) % CATALOG.length];
        const quantity = ((orderIndex + j) % 4) + 1; // 1 to 4 quantity
        const unitPrice = catalogItem.price;
        const lineTotal = Number((quantity * unitPrice).toFixed(2));
        orderTotal = Number((orderTotal + lineTotal).toFixed(2));

        itemData.push({
          id: crypto.randomUUID(),
          orderId,
          itemName: catalogItem.name,
          quantity,
          unitPrice: new Prisma.Decimal(unitPrice.toFixed(2)),
          createdAt,
        });
      }

      totalItemsCreated += itemCount;

      orderData.push({
        id: orderId,
        customerName,
        customerEmail,
        status,
        totalAmount: new Prisma.Decimal(orderTotal.toFixed(2)),
        createdAt,
        updatedAt: createdAt,
      });
    }

    // Insert orders batch then items batch
    await prisma.order.createMany({ data: orderData });
    await prisma.orderItem.createMany({ data: itemData });

    const progress = Math.min(100, Math.round(((batchStart + batchSize) / TOTAL_ORDERS) * 100));
    console.log(`   - Inserted ${batchStart + batchSize}/${TOTAL_ORDERS} orders (${progress}%)...`);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\nSeed completed successfully in ${durationSec}s!`);
  console.log(`Total Orders: ${TOTAL_ORDERS.toLocaleString()}`);
  console.log(`Total Order Items: ${totalItemsCreated.toLocaleString()}`);

  // Validation
  const orderCount = await prisma.order.count();
  const itemCount = await prisma.orderItem.count();
  const userCount = await prisma.user.count();

  console.log("\nDatabase verification:");
  console.log(` - users row count: ${userCount}`);
  console.log(` - orders row count: ${orderCount}`);
  console.log(` - order_items row count: ${itemCount}`);

  // Verify line items constraint (every order has 1-5 items)
  const minMaxCheck = await prisma.$queryRaw<Array<{ min_items: bigint; max_items: bigint; avg_items: number }>>`
    SELECT
      MIN(item_count) as min_items,
      MAX(item_count) as max_items,
      ROUND(AVG(item_count), 2) as avg_items
    FROM (
      SELECT "orderId", COUNT(*) as item_count
      FROM "order_items"
      GROUP BY "orderId"
    ) counts;
  `;

  console.log(` - items per order verification: min=${minMaxCheck[0]?.min_items}, max=${minMaxCheck[0]?.max_items}, avg=${minMaxCheck[0]?.avg_items}`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
