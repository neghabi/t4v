import { NextResponse } from "next/server";
const error = {
  description: "خطای درخواست",
  content: {
    "application/json": {
      schema: { type: "object", properties: { error: { type: "string" } } },
    },
  },
};
const code = {
  name: "code",
  in: "path",
  required: true,
  schema: { type: "string" },
};
const linkInput = {
  type: "object",
  properties: {
    url: { type: "string", format: "uri" },
    title: { type: "string", maxLength: 120 },
    tags: {
      type: "array",
      maxItems: 8,
      items: { type: "string", maxLength: 30 },
    },
    customCode: { type: "string", pattern: "^[A-Za-z0-9_-]{3,32}$" },
    password: { type: "string" },
    expiresInDays: { type: "integer", minimum: 1, maximum: 3650 },
    codeLength: { type: "integer", minimum: 5, maximum: 16 },
  },
};
export function GET() {
  return NextResponse.json(
    {
      openapi: "3.1.0",
      info: {
        title: "T4V API",
        version: "1.0.0",
        description:
          "Bearer key authentication. GET requires links:read; mutations require links:write. Link creation costs 3 credits. Idempotency-Key is scoped to the account; retries with the same payload reuse the original link without another debit. A changed payload returns 409.",
      },
      servers: [{ url: "/" }],
      security: [{ bearerAuth: [] }],
      components: {
        securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
      },
      paths: {
        "/api/v1/links": {
          get: {
            summary: "List owned links",
            parameters: [
              {
                name: "page",
                in: "query",
                schema: { type: "integer", minimum: 1 },
              },
              { name: "q", in: "query", schema: { type: "string" } },
              {
                name: "status",
                in: "query",
                schema: { enum: ["active", "expired", "protected"] },
              },
              {
                name: "sort",
                in: "query",
                schema: { enum: ["newest", "oldest", "clicks"] },
              },
            ],
            responses: {
              200: {
                description: "Paginated links, pageSize 25, total, totalPages",
              },
              401: error,
              429: error,
            },
          },
          post: {
            summary: "Create a link",
            parameters: [
              {
                name: "Idempotency-Key",
                in: "header",
                schema: { type: "string", maxLength: 200 },
              },
            ],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: { ...linkInput, required: ["url"] },
                },
              },
            },
            responses: {
              201: { description: "Created short URL and remaining credits" },
              200: { description: "Created short URL or idempotent replay" },
              400: error,
              401: error,
              402: error,
              409: error,
              429: error,
            },
          },
        },
        "/api/v1/links/{code}": {
          get: {
            summary: "Owned link details and recent clicks",
            parameters: [code],
            responses: {
              200: { description: "Link details" },
              401: error,
              404: error,
            },
          },
          patch: {
            summary: "Update owned link",
            parameters: [code],
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      url: { type: "string", format: "uri" },
                      title: { type: "string", maxLength: 120 },
                      tags: { type: "array", items: { type: "string" } },
                      password: { type: ["string", "null"] },
                      expiresAt: {
                        type: ["number", "null"],
                        description:
                          "Unix milliseconds, or null to remove expiration",
                      },
                    },
                  },
                },
              },
            },
            responses: {
              200: { description: "Updated link" },
              400: error,
              401: error,
              404: error,
            },
          },
          delete: {
            summary: "Delete owned link",
            parameters: [code],
            responses: {
              200: { description: "Deleted" },
              401: error,
              404: error,
            },
          },
        },
      },
    },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
