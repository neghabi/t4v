import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL تنظیم نشده است.");
  }

  const adapter = new PrismaPg({
    connectionString,
    options: "-c timezone=UTC",
  });
  return new PrismaClient({ adapter });
}

let client: PrismaClient | undefined = globalForPrisma.prisma;
// Initialize inside the request, so configuration errors reach JSON error handlers.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    client ??= createClient();
    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
