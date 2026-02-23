"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { AuthConfig, AuthResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  loginPasswordSchema,
  loginSmsSchema,
  registerNoSmsSchema,
  registerSchema,
} from "@/lib/validation/auth";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (result: AuthResult) => void;
}

type AuthFormValues = {
  username: string;
  phone: string;
  captcha?: string;
  sms?: string;
  password: string;
  confirmPassword?: string;
};

type LoginMethod = "password" | "sms";

const emptyConfig: AuthConfig = { password: true, sms: true };

const generateCaptchaCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 4; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function AuthDialog({
  open,
  onOpenChange,
  onSuccess,
}: AuthDialogProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("password");
  const [authConfig, setAuthConfig] = useState<AuthConfig>(emptyConfig);
  const [captchaCode, setCaptchaCode] = useState(generateCaptchaCode());
  const [countdown, setCountdown] = useState(0);
  const [smsHint, setSmsHint] = useState("");

  const allowPassword = authConfig.password;
  const allowSms = authConfig.sms;

  const schema = useMemo(() => {
    if (mode === "register") {
      return allowSms ? registerSchema : registerNoSmsSchema;
    }
    return loginMethod === "password" ? loginPasswordSchema : loginSmsSchema;
  }, [allowSms, loginMethod, mode]);

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(schema as z.ZodType<AuthFormValues>),
    defaultValues: {
      username: "",
      phone: "",
      captcha: "",
      sms: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    api
      .authConfig()
      .then((response) => {
        if (response.code === 0 && response.data) {
          setAuthConfig(response.data);
        }
      })
      .catch(() => null);
  }, [open]);

  useEffect(() => {
    if (!allowPassword && !allowSms) return;
    if (!allowPassword && loginMethod === "password") {
      setLoginMethod("sms");
      return;
    }
    if (!allowSms && loginMethod === "sms") {
      setLoginMethod("password");
    }
    if (!allowPassword && mode === "register") {
      setMode("login");
    }
  }, [allowPassword, allowSms, loginMethod, mode]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendSms = async () => {
    if (!allowSms) return;
    const phone = form.getValues("phone")?.trim() ?? "";
    const captcha = form.getValues("captcha")?.toUpperCase();

    if (!/^\d{9,15}$/.test(phone)) {
      form.setError("phone", { message: "请输入至少9位数字手机号" });
      return;
    }

    if (mode === "register") {
      if (!captcha || captcha !== captchaCode) {
        form.setError("captcha", { message: "验证码错误" });
        setCaptchaCode(generateCaptchaCode());
        return;
      }
    }

    const response = await api.sendSms({
      phone,
      purpose: mode === "register" ? "register" : "login",
    });

    if (response.code !== 0) {
      form.setError("sms", { message: response.message ?? "发送失败" });
      return;
    }

    setCountdown(60);
    setSmsHint("验证码已发送，请注意查收");
  };

  const handleSubmit = async (values: AuthFormValues) => {
    if (mode === "login") {
      if (loginMethod === "password") {
        const response = await api.authLoginPassword({
          username: values.username,
          password: values.password,
        });
        if (response.code !== 0 || !response.data) {
          form.setError("username", {
            message: response.message ?? "登录失败",
          });
          return;
        }
        onSuccess(response.data);
      } else {
        const response = await api.authLoginSms({
          phone: values.phone,
          sms: values.sms ?? "",
        });
        if (response.code !== 0 || !response.data) {
          form.setError("sms", {
            message: response.message ?? "登录失败",
          });
          return;
        }
        onSuccess(response.data);
      }
    } else {
      const response = await api.authRegister({
        username: values.username,
        phone: values.phone,
        sms: allowSms ? values.sms ?? "" : undefined,
        password: values.password,
      });
      if (response.code !== 0 || !response.data) {
        form.setError("username", {
          message: response.message ?? "注册失败",
        });
        return;
      }
      onSuccess(response.data);
    }

    onOpenChange(false);
  };

  const handleSwitchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setSmsHint("");
    setCountdown(0);
    setCaptchaCode(generateCaptchaCode());
    form.reset();
  };

  const showMethodTabs = allowPassword && allowSms;
  const showRegister = allowPassword;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden p-0">
        <div className="p-10">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-3xl font-[900] text-slate-900 tracking-tight">
              {mode === "register" ? "加入 PatentLens" : "欢迎回来"}
            </DialogTitle>
          </DialogHeader>

          {showMethodTabs && mode === "login" && (
            <div className="mb-6 rounded-2xl bg-slate-100 p-2 flex gap-2">
              <Button
                type="button"
                onClick={() => setLoginMethod("password")}
                className={cn(
                  "flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest",
                  loginMethod === "password"
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-transparent text-slate-500 hover:text-slate-900"
                )}
              >
                密码登录
              </Button>
              <Button
                type="button"
                onClick={() => setLoginMethod("sms")}
                className={cn(
                  "flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest",
                  loginMethod === "sms"
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-transparent text-slate-500 hover:text-slate-900"
                )}
              >
                短信登录
              </Button>
            </div>
          )}

          {!allowPassword && !allowSms && (
            <div className="mb-6 rounded-2xl bg-slate-100 px-4 py-3 text-xs font-bold text-slate-500">
              当前未启用任何登录方式，请稍后再试。
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
              {mode === "login" && loginMethod === "password" && (
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        用户名
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="请输入用户名"
                          className="bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 font-bold"
                        />
                      </FormControl>
                      <FormMessage className="text-rose-500 text-xs" />
                    </FormItem>
                  )}
                />
              )}

              {(mode === "login" && loginMethod === "sms") ||
              mode === "register" ? (
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
                          maxLength={15}
                          placeholder="请输入至少9位手机号"
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
              ) : null}

              {mode === "register" && (
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        用户名
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="3-20位字母/数字/下划线"
                          className="bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500/20 font-bold"
                        />
                      </FormControl>
                      <FormMessage className="text-rose-500 text-xs" />
                    </FormItem>
                  )}
                />
              )}

              {mode === "register" && allowSms && (
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
                      onClick={() => setCaptchaCode(generateCaptchaCode())}
                      className="bg-slate-900 text-white px-4 py-4 rounded-2xl font-black italic tracking-[0.3em] cursor-pointer select-none border-4 border-slate-100 shadow-sm"
                    >
                      {captchaCode}
                    </button>
                  </div>
                </div>
              )}

              {(mode === "login" && loginMethod === "sms") ||
              (mode === "register" && allowSms) ? (
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
              ) : null}

              {(mode === "register" || loginMethod === "password") && (
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
                          placeholder="至少8位，包含字母和数字"
                          className="bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500/20 font-bold"
                        />
                      </FormControl>
                      <FormMessage className="text-rose-500 text-xs" />
                    </FormItem>
                  )}
                />
              )}

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
                disabled={!allowPassword && !allowSms}
                className="w-full h-auto bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-slate-200 active:scale-95"
              >
                {mode === "register"
                  ? "立即注册并加入"
                  : loginMethod === "sms"
                  ? "短信验证码登录"
                  : "登录控制台"}
              </Button>
            </form>
          </Form>

          {showRegister && (
            <div className="mt-8 text-center">
              <button
                onClick={handleSwitchMode}
                className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors"
              >
                {mode === "login" ? "没有账号？立即注册" : "已有账号？直接登录"}
              </button>
            </div>
          )}

          {!showRegister && allowSms && (
            <p className="mt-6 text-center text-xs text-slate-400 font-bold">
              短信登录将自动创建账号
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
