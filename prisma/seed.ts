import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data for idempotent re-seeding
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // Ensure admin user exists
  const adminEmail = "admin@pinenova.com";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash("Admin1234", 12);
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, firstName: "Admin", lastName: "User", role: "ADMIN" },
    });
    console.log("Admin user created: admin@pinenova.com / Admin1234");
  } else {
    console.log("Admin user already exists");
  }

  const bags = await prisma.category.create({
    data: { name: "Bags", slug: "bags", description: "Vegan leather bags for every occasion", sortOrder: 1 },
  });
  const wallets = await prisma.category.create({
    data: { name: "Wallets", slug: "wallets", description: "Sleek and sustainable wallets", sortOrder: 2 },
  });
  const belts = await prisma.category.create({
    data: { name: "Belts", slug: "belts", description: "Eco-friendly belts crafted from pineapple fiber", sortOrder: 3 },
  });
  const footwear = await prisma.category.create({
    data: { name: "Footwear", slug: "footwear", description: "Vegan leather shoes and sandals", sortOrder: 4 },
  });

  // === BAGS ===

  await prisma.product.create({
    data: {
      categoryId: bags.id,
      name: "Classic Tote Bag",
      slug: "classic-tote-bag",
      description: "A spacious tote bag made from premium pineapple vegan leather. Features reinforced stitching, interior pocket, and comfortable shoulder straps. Perfect for daily use with a timeless design.",
      price: 89.99,
      sku: "TOTE-001",
      stock: 25,
      materialTag: "Pineapple Fiber",
      sustainabilityBadge: true,
      published: true,
      images: {
        create: [
          { url: "/images/products/tote-1-1.jpg", altText: "Classic Tote Bag front view", sortOrder: 0 },
          { url: "/images/products/tote-1-2.jpg", altText: "Classic Tote Bag side view", sortOrder: 1 },
          { url: "/images/products/tote-1-3.jpg", altText: "Classic Tote Bag detail", sortOrder: 2 },
          { url: "/images/products/tote-2-1.jpg", altText: "Classic Tote Bag lifestyle", sortOrder: 3 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      categoryId: bags.id,
      name: "Mini Crossbody Bag",
      slug: "mini-crossbody-bag",
      description: "Compact crossbody bag with adjustable strap and multiple compartments. Crafted from sustainable pineapple leather with a sleek, modern finish.",
      price: 59.99,
      sku: "CROSS-001",
      stock: 40,
      materialTag: "Pineapple Fiber",
      sustainabilityBadge: true,
      published: true,
      images: {
        create: [
          { url: "/images/products/crossbody-1-1.jpg", altText: "Mini Crossbody Bag front", sortOrder: 0 },
          { url: "/images/products/crossbody-1-2.jpg", altText: "Mini Crossbody Bag back", sortOrder: 1 },
          { url: "/images/products/crossbody-1-3.jpg", altText: "Mini Crossbody Bag detail", sortOrder: 2 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      categoryId: bags.id,
      name: "Weekender Duffle Bag",
      slug: "weekender-duffle-bag",
      description: "Extra-large duffle bag for weekend getaways. Made with reinforced pineapple fiber fabric, water-resistant coating, and padded shoulder strap.",
      price: 129.99,
      sku: "DUFFLE-001",
      stock: 12,
      materialTag: "Pineapple Fiber",
      sustainabilityBadge: true,
      published: true,
      images: {
        create: [
          { url: "/images/products/duffle-1-1.jpg", altText: "Weekender Duffle Bag front", sortOrder: 0 },
          { url: "/images/products/duffle-1-2.jpg", altText: "Weekender Duffle Bag side", sortOrder: 1 },
          { url: "/images/products/duffle-1-3.jpg", altText: "Weekender Duffle Bag detail", sortOrder: 2 },
        ],
      },
    },
  });

  // === WALLETS ===

  await prisma.product.create({
    data: {
      categoryId: wallets.id,
      name: "Slim Bifold Wallet",
      slug: "slim-bifold-wallet",
      description: "Minimalist bifold wallet with RFID protection. Holds up to 8 cards and includes a clear ID window. Crafted from smooth vegan leather.",
      price: 39.99,
      sku: "WALLET-001",
      stock: 60,
      materialTag: "Pineapple Fiber",
      sustainabilityBadge: true,
      published: true,
      images: {
        create: [
          { url: "/images/products/wallet-1-1.jpg", altText: "Slim Bifold Wallet open", sortOrder: 0 },
          { url: "/images/products/wallet-1-2.jpg", altText: "Slim Bifold Wallet closed", sortOrder: 1 },
          { url: "/images/products/wallet-1-3.jpg", altText: "Slim Bifold Wallet detail", sortOrder: 2 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      categoryId: wallets.id,
      name: "Zip-Around Cardholder",
      slug: "zip-around-cardholder",
      description: "Compact zip-around cardholder with 6 card slots and a coin pocket. Made from textured vegan leather with a durable YKK zipper.",
      price: 29.99,
      sku: "WALLET-002",
      stock: 35,
      materialTag: "Cactus Leather",
      sustainabilityBadge: true,
      published: true,
      images: {
        create: [
          { url: "/images/products/cardholder-1-1.jpg", altText: "Zip-Around Cardholder front", sortOrder: 0 },
          { url: "/images/products/cardholder-1-2.jpg", altText: "Zip-Around Cardholder back", sortOrder: 1 },
        ],
      },
    },
  });

  // === BELTS ===

  await prisma.product.create({
    data: {
      categoryId: belts.id,
      name: "Classic Dress Belt",
      slug: "classic-dress-belt",
      description: "Elegant dress belt suitable for formal and business casual wear. Features a polished metal buckle and adjustable sizing. Made from premium pineapple vegan leather.",
      price: 44.99,
      sku: "BELT-001",
      stock: 50,
      materialTag: "Pineapple Fiber",
      sustainabilityBadge: true,
      published: true,
      images: {
        create: [
          { url: "/images/products/belt-1-1.jpg", altText: "Classic Dress Belt front", sortOrder: 0 },
          { url: "/images/products/belt-1-2.jpg", altText: "Classic Dress Belt buckle detail", sortOrder: 1 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      categoryId: belts.id,
      name: "Braided Casual Belt",
      slug: "braided-casual-belt",
      description: "Hand-braided casual belt made from sustainable apple leather. Features a vintage-style brass buckle and is available in multiple colors.",
      price: 38.99,
      sku: "BELT-002",
      stock: 20,
      materialTag: "Apple Leather",
      sustainabilityBadge: true,
      published: true,
      images: {
        create: [
          { url: "/images/products/braided-belt-1-1.jpg", altText: "Braided Casual Belt front", sortOrder: 0 },
          { url: "/images/products/braided-belt-1-2.jpg", altText: "Braided Casual Belt detail", sortOrder: 1 },
          { url: "/images/products/braided-belt-1-3.jpg", altText: "Braided Casual Belt lifestyle", sortOrder: 2 },
        ],
      },
    },
  });

  // === FOOTWEAR ===

  await prisma.product.create({
    data: {
      categoryId: footwear.id,
      name: "Vegan Leather Loafers",
      slug: "vegan-leather-loafers",
      description: "Classic penny loafers crafted from high-quality vegan leather. Features a cushioned insole, rubber outsole, and breathable lining for all-day comfort.",
      price: 94.99,
      sku: "SHOE-001",
      stock: 30,
      materialTag: "Pineapple Fiber",
      sustainabilityBadge: true,
      published: true,
      images: {
        create: [
          { url: "/images/products/loafers-1-1.jpg", altText: "Vegan Leather Loafers front", sortOrder: 0 },
          { url: "/images/products/loafers-1-2.jpg", altText: "Vegan Leather Loafers side", sortOrder: 1 },
          { url: "/images/products/loafers-1-3.jpg", altText: "Vegan Leather Loafers detail", sortOrder: 2 },
          { url: "/images/products/loafers-2-1.jpg", altText: "Loafers lifestyle", sortOrder: 3 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      categoryId: footwear.id,
      name: "Eco-Friendly Sandals",
      slug: "eco-friendly-sandals",
      description: "Lightweight sandals with a contoured footbed and adjustable straps. Made from recycled materials and sustainable vegan leather. Perfect for warm weather.",
      price: 54.99,
      sku: "SANDAL-001",
      stock: 15,
      materialTag: "Recycled Materials",
      sustainabilityBadge: true,
      published: true,
      images: {
        create: [
          { url: "/images/products/sandals-1-1.jpg", altText: "Eco-Friendly Sandals front", sortOrder: 0 },
          { url: "/images/products/sandals-1-2.jpg", altText: "Eco-Friendly Sandals side", sortOrder: 1 },
          { url: "/images/products/sandals-1-3.jpg", altText: "Eco-Friendly Sandals detail", sortOrder: 2 },
        ],
      },
    },
  });

  console.log("Seed completed: categories + products with images created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
