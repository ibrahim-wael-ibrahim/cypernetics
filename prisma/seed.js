import 'dotenv/config';
import bcrypt from 'bcrypt';
// import { PrismaClient } from './generated/client';
import { PrismaClient } from './generated/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';


const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./prisma/db/database.db',
});

const prisma = new PrismaClient({ adapter });

const products = [
  {
    name: 'InMoov (Open-Source Humanoid Robot Hand/Arm)',
    description:
      'InMoov Humanoid Robot Hand & Arm is an open-source robotic system designed for research, robotics education, and AI development. It features realistic finger movement, making it ideal for studying hand kinematics and coordination. Built using 3D-printed parts, Arduino, and servo motors, it offers flexibility and customization. Suitable for students, researchers, and hobbyists, it is available as a DIY build or commercial kit. Note: Not intended for medical or prosthetic use.',
    price: 999.99,
    stockQuantity: 25,
    category: 'Upper Limb',
    imageUrl: '/uploads/products/prosthetic-arm-1.jpeg',
  },
  {
    name: 'Microprocessor Knee (Ottobock C-Leg 4)',
    description:
      'The Ottobock C-Leg 4 is a world-class microprocessor-controlled knee (MPK) designed for advanced mobility. It utilizes real-time sensors to adjust hydraulic resistance 100 times per second, ensuring stability on stairs, uneven terrain, and during stumble recovery. Ideal for individuals with above-knee amputations who maintain a moderate to high activity level.',
    price: 35000.00,
    stockQuantity: 10,
    category: 'Lower Limb',
    imageUrl: '/uploads/products/prosthetic-knee-1.jpeg',
  },
  {
    name: 'e-NABLE / UnLimbited Arm',
    description:
      'A body-powered mechanical hand designed specifically for children with below-elbow congenital differences. This lightweight, 3D-printed device uses elbow movement to pull internal strings, allowing the fingers to grip objects like balls or bicycle handlebars. It provides essential functional support and psychological confidence for young users.',
    price: 49.99,
    stockQuantity: 50,
    category: 'Upper Limb',
    imageUrl: '/uploads/products/prosthetic-arm-2.jpeg',
  },
  {
    name: 'Cybernetic/Futuristic Concept Art (Digital Model)',
    description:
      'A premium 3D digital model designed by Hussain Almossawi & Benjamin Cotter for use in sci-fi films, video games, and digital media. This asset features ultra-realistic textures and intricate mechanical details. Please note: This is a digital file for artistic use and does not exist as a functional medical device.',
    price: 150.00,
    stockQuantity: 100,
    category: 'Digital Assets',
    imageUrl: '/uploads/products/prosthetic-concept-1.jpeg',
  },
  {
    name: 'MCPDriver (Naked Prosthetics)',
    description:
      'The MCPDriver is a custom-engineered mechanical prosthetic for partial finger amputations. It tracks the natural movement of the remaining proximal phalanx to drive the mechanical finger, restoring high-precision grip and pinch capabilities. Designed for durability, it allows users to return to manual labor and precise daily activities.',
    price: 10000.00,
    stockQuantity: 15,
    category: 'Hand/Finger',
    imageUrl: '/uploads/products/prosthetic-finger-1.jpeg',
  },
];

async function main() {
  console.log('🌱 Starting database seed...');

  // --- Users ---
  const adminPassword = await bcrypt.hash('admin123', 10);
  const customerPassword = await bcrypt.hash('customer123', 10);

  const users = [
    {
      email: 'admin@prostheticstore.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'admin',
    },
    {
      email: 'customer@example.com',
      name: 'Test Customer',
      password: customerPassword,
      role: 'customer',
    },
  ];

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { password: u.password, name: u.name, role: u.role },
      create: u,
    });
    console.log(`✅ Upserted user: ${user.email}`);
  }

  // --- Products (NO upsert) ---
  for (const p of products) {
    const existing = await prisma.product.findFirst({
      where: { name: p.name },
    });

    if (existing) {
      const updated = await prisma.product.update({
        where: { id: existing.id },
        data: {
          description: p.description,
          price: p.price,
          stockQuantity: p.stockQuantity,
          category: p.category,
          imageUrl: p.imageUrl,
        },
      });

      console.log(`🔄 Updated product: ${updated.name}`);
    } else {
      const created = await prisma.product.create({
        data: p,
      });

      console.log(`✅ Created product: ${created.name}`);
    }
  }

  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });