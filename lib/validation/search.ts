import { z } from "zod";

export const searchPayloadSchema = z.object({
  imageBase64: z.string().min(1, "请上传图片"),
});
