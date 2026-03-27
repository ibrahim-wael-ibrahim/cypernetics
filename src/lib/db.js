import { PrismaClient } from '../../prisma/generated/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const globalForPrisma = globalThis;

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./prisma/db/database.db',
});

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,        
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}