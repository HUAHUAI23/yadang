"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { api } from "@/lib/api";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type AuthFormValues = {
  phone: string;
  captcha?: string;
  sms?: string;
  password: string;
  confirmPassword?: string;
};

const phoneSchema = z
  .string()
  .regex(/^\d{11}$/, "请输入合法的11位手机号");

const passwordSchema = z
  .string()
  .regex(/^(?=.*[A-Za-z])(?=.*[\u4e00-\u9fa5]).{8,20}$/, "密码须包含字母与汉字，8-20位");

const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "请输入密码"),
});

const registerSchema = z
  .object({
    phone: phoneSchema,
    captcha: z.string().min(4, "请输入验证码"),
    sms: z.string().min(6, "请输入短信验证码"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "请确认密码"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

export default function AuthDialog({
  open,
  onOpenChange,
  onSuccess,
}: AuthDialogProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [captchaCode, setCaptchaCode] = useState("ABCD");
  const [countdown, setCountdown] = useState(0);
  const [smsHint, setSmsHint] = useState("");

  const schema = useMemo(
    () => (mode === "login" ? loginSchema : registerSchema),
    [mode]
  );

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: "",
      captcha: "",
      sms: "",
      password: "",
      confirmPassword: "",
    },
  });

  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 4; i += 1) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(result);
  };

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendSms = async () => {
    const phone = form.getValues("phone");
    const captcha = form.getValues("captcha")?.toUpperCase();

    if (!/^\d{11}$/.test(phone)) {
      form.setError("phone", { message: "请输入合法的11位手机号" });
      return;
    }
    if (!captcha || captcha !== captchaCode) {
      form.setError("captcha", { message: "验证码错误" });
      generateCaptcha();
      return;
    }

    const response = await api.sendSms(phone);
    if (response.code !== 0) {
      form.setError("sms", { message: response.message ?? "发送失败" });
      return;
    }

    setCountdown(60);
    setSmsHint("验证码已发送（模拟）：123456");
  };

  const handleSubmit = async (values: AuthFormValues) => {
    if (mode === "login") {
      const response = await api.authLogin({
        phone: values.phone,
        password: values.password,
      });
      if (response.code !== 0) {
        form.setError("phone", { message: response.message ?? "登录失败" });
        return;
      }
    } else {
      const response = await api.authRegister({
        phone: values.phone,
        sms: values.sms ?? "",
        password: values.password,
      });
      if (response.code !== 0) {
        form.setError("phone", { message: response.message ?? "注册失败" });
        return;
      }
    }

    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden p-0">
        <div className="p-10">
          <DialogHeader className="mb-10">
            <DialogTitle className="text-3xl font-[900] text-slate-900 tracking-tight">
              {mode === "register" ? "加入 PatentLens" : "欢迎回来"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      手机号码
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        maxLength={11}
                        placeholder="请输入11位中国手机号"
                        className="bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 font-bold"
                        onChange={(event) =>
                          field.onChange(event.target.value.replace(/\D/g, ""))
                        }
                      />
                    </FormControl>
                    <FormMessage className="text-rose-500 text-xs" />
                  </FormItem>
                )}
              />

              {mode === "register" && (
                <>
                  <div className="flex space-x-3">
                    <FormField
                      control={form.control}
                      name="captcha"
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            人机验证码
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="验证码"
                              className="bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500/20 font-bold"
                              onChange={(event) =>
                                field.onChange(event.target.value.toUpperCase())
                              }
                            />
                          </FormControl>
                          <FormMessage className="text-rose-500 text-xs" />
                        </FormItem>
                      )}
                    />
                    <div className="pt-6 flex flex-col justify-end">
                      <button
                        type="button"
                        onClick={generateCaptcha}
                        className="bg-slate-900 text-white px-4 py-4 rounded-2xl font-black italic tracking-[0.3em] cursor-pointer select-none border-4 border-slate-100 shadow-sm"
                      >
                        {captchaCode}
                      </button>
                    </div>
                  </div>

                  <div className="flex space-x-3 items-start">
                    <FormField
                      control={form.control}
                      name="sms"
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormLabel className="sr-only">短信验证码</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="6位验证码"
                              className="bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500/20 font-bold"
                            />
                          </FormControl>
                          <FormMessage className="text-rose-500 text-xs" />
                          {smsHint && (
                            <p className="text-[10px] text-slate-400 font-bold mt-2">
                              {smsHint}
                            </p>
                          )}
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      disabled={countdown > 0}
                      onClick={handleSendSms}
                      className="px-6 mt-7 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      {countdown > 0 ? `${countdown}s` : "获取验证码"}
                    </Button>
                  </div>
                </>
              )}

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {mode === "register" ? "设置密码" : "登录密码"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="8-20位，须含字母与汉字"
                        className="bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500/20 font-bold"
                      />
                    </FormControl>
                    <FormMessage className="text-rose-500 text-xs" />
                    {mode === "register" && (
                      <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-tight">
                        密码要求：字母+汉字，8-20位
                      </p>
                    )}
                  </FormItem>
                )}
              />

              {mode === "register" && (
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        确认密码
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="再次输入密码"
                          className="bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500/20 font-bold"
                        />
                      </FormControl>
                      <FormMessage className="text-rose-500 text-xs" />
                    </FormItem>
                  )}
                />
              )}

              <Button
                type="submit"
                className="w-full h-auto bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-slate-200 active:scale-95"
              >
                {mode === "register" ? "立即注册并加入" : "登录控制台"}
              </Button>
            </form>
          </Form>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setSmsHint("");
                setCountdown(0);
                generateCaptcha();
                form.reset();
              }}
              className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors"
            >
              {mode === "login" ? "没有账号？立即注册" : "已有账号？直接登录"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
