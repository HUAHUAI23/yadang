import { z } from "zod";

export const phoneSchema = z
  .string()
  .regex(/^1\d{10}$/, "请输入合法的11位手机号");

export const usernameSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_]{3,20}$/, "用户名需为3-20位字母/数字/下划线");

export const passwordSchema = z
  .string()
  .min(8, "密码至少8位")
  .max(20, "密码最多20位")
  .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "密码需包含字母与数字");

export const smsCodeSchema = z
  .string()
  .regex(/^\d{6}$/, "请输入6位验证码");

export const loginPasswordSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, "请输入密码"),
});

export const loginSmsSchema = z.object({
  phone: phoneSchema,
  sms: smsCodeSchema,
});

export const registerSchema = z
  .object({
    username: usernameSchema,
    phone: phoneSchema,
    sms: smsCodeSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "请确认密码"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

export const registerNoSmsSchema = z
  .object({
    username: usernameSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "请确认密码"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

export const registerPayloadSchema = z.object({
  username: usernameSchema,
  phone: phoneSchema,
  sms: smsCodeSchema.optional(),
  password: passwordSchema,
});

export const sendSmsSchema = z.object({
  phone: phoneSchema,
  purpose: z.enum(["login", "register"]),
});
