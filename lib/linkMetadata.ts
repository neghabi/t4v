import { ApiError } from "@/lib/apiResponse";
export function parseLinkMetadata(body: Record<string, unknown>) {
  if (body.title !== undefined && typeof body.title !== "string")
    throw new ApiError("عنوان باید متن باشد.");
  if (body.customCode !== undefined && typeof body.customCode !== "string")
    throw new ApiError("شناسه باید متن باشد.");
  if (
    body.tags !== undefined &&
    (!Array.isArray(body.tags) ||
      !body.tags.every((t) => typeof t === "string"))
  )
    throw new ApiError("برچسب‌ها باید آرایه‌ای از متن باشند.");
  return {
    title: body.title as string | undefined,
    customCode: body.customCode as string | undefined,
    tags: body.tags as string[] | undefined,
  };
}
