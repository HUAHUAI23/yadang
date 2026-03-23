"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { AdminUserView, AutoCreditRuleView } from "@/lib/types";

import { AdminConsoleAutoCredit } from "./admin-console-auto-credit";
import { AdminConsoleFeedbackBanner } from "./admin-console-feedback";
import {
  type AdjustmentAction,
  type AdminConsoleFeedback,
} from "./admin-console-shared";
import { AdminConsoleUserManagement } from "./admin-console-user-management";

const toErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

export default function AdminConsole() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<AdminConsoleFeedback | null>(null);
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [rules, setRules] = useState<AutoCreditRuleView[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [adjustmentAction, setAdjustmentAction] = useState<AdjustmentAction>("add");
  const [adjustmentAmount, setAdjustmentAmount] = useState("500");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [blacklistReason, setBlacklistReason] = useState("");
  const [ruleName, setRuleName] = useState("");
  const [ruleIntervalDays, setRuleIntervalDays] = useState("7");
  const [ruleAmount, setRuleAmount] = useState("500");
  const [ruleEnabled, setRuleEnabled] = useState(true);

  const selectedUser = useMemo(
    () => users.find((item) => item.id === selectedUserId) ?? null,
    [selectedUserId, users],
  );

  const syncUsers = useCallback((items: AdminUserView[]) => {
    startTransition(() => {
      setUsers(items);
      setSelectedUserId((current) => {
        if (!items.length) {
          return null;
        }

        if (current && items.some((item) => item.id === current)) {
          return current;
        }

        return items[0]?.id ?? null;
      });
    });
  }, []);

  const loadUsers = useCallback(
    async (keywordValue: string) => {
      const response = await api.adminUsers(keywordValue || undefined);
      if (response.code !== 0 || !response.data) {
        throw new Error(response.message ?? "获取用户失败");
      }

      syncUsers(response.data.items);
    },
    [syncUsers],
  );

  const loadRules = useCallback(async () => {
    const response = await api.adminAutoCreditRules();
    if (response.code !== 0 || !response.data) {
      throw new Error(response.message ?? "获取自动加钱规则失败");
    }

    const items = response.data.items;
    startTransition(() => {
      setRules(items);
    });
  }, []);

  const loadData = useCallback(
    async (keywordValue: string) => {
      setLoading(true);
      setFeedback(null);

      try {
        const [usersResponse, rulesResponse] = await Promise.all([
          api.adminUsers(keywordValue || undefined),
          api.adminAutoCreditRules(),
        ]);

        if (usersResponse.code !== 0 || !usersResponse.data) {
          throw new Error(usersResponse.message ?? "获取用户失败");
        }

        if (rulesResponse.code !== 0 || !rulesResponse.data) {
          throw new Error(rulesResponse.message ?? "获取自动加钱规则失败");
        }

        const ruleItems = rulesResponse.data.items;
        const userItems = usersResponse.data.items;
        startTransition(() => {
          setRules(ruleItems);
        });
        syncUsers(userItems);
      } catch (error) {
        setFeedback({
          variant: "error",
          title: "加载失败",
          message: toErrorMessage(error, "加载管理后台数据失败"),
        });
      } finally {
        setLoading(false);
      }
    },
    [syncUsers],
  );

  useEffect(() => {
    void loadData("");
  }, [loadData]);

  const withSubmit = useCallback(async (handler: () => Promise<string>) => {
    setSubmitting(true);
    setFeedback(null);

    try {
      const message = await handler();
      setFeedback({
        variant: "success",
        title: "操作完成",
        message,
      });
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "操作失败",
        message: toErrorMessage(error, "请稍后重试"),
      });
    } finally {
      setSubmitting(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    void loadData(keyword.trim());
  }, [keyword, loadData]);

  const handleRefresh = useCallback(() => {
    void loadData(keyword.trim());
  }, [keyword, loadData]);

  const refreshUsers = useCallback(async () => {
    await loadUsers(keyword.trim());
  }, [keyword, loadUsers]);

  const handleToggleAdmin = useCallback(
    (user: AdminUserView) => {
      void withSubmit(async () => {
        const response = await api.adminUpdateRole(user.id, {
          isAdmin: !user.isAdmin,
        });

        if (response.code !== 0) {
          throw new Error(response.message ?? "更新管理员权限失败");
        }

        await refreshUsers();
        return user.isAdmin ? "已取消管理员权限。" : "已授予管理员权限。";
      });
    },
    [refreshUsers, withSubmit],
  );

  const handleToggleBlacklist = useCallback(
    (user: AdminUserView) => {
      void withSubmit(async () => {
        const response = await api.adminUpdateBlacklist(user.id, {
          isBlacklisted: !user.isBlacklisted,
          reason: !user.isBlacklisted
            ? blacklistReason.trim() || "管理员手动拉黑"
            : "",
        });

        if (response.code !== 0) {
          throw new Error(response.message ?? "更新黑名单失败");
        }

        setBlacklistReason("");
        await refreshUsers();
        return user.isBlacklisted ? "已解除黑名单限制。" : "用户已加入黑名单。";
      });
    },
    [blacklistReason, refreshUsers, withSubmit],
  );

  const handleAdjustBalance = useCallback(() => {
    void withSubmit(async () => {
      if (!selectedUser) {
        throw new Error("请选择用户");
      }

      const amount =
        adjustmentAction === "reset"
          ? undefined
          : Number.parseFloat(adjustmentAmount);

      const response = await api.adminAdjustAccount(selectedUser.id, {
        action: adjustmentAction,
        amount,
        reason: adjustmentReason.trim(),
      });

      if (response.code !== 0) {
        throw new Error(response.message ?? "账户调整失败");
      }

      setAdjustmentReason("");
      await refreshUsers();
      return "账户余额已完成调整。";
    });
  }, [
    adjustmentAction,
    adjustmentAmount,
    adjustmentReason,
    refreshUsers,
    selectedUser,
    withSubmit,
  ]);

  const handleCreateRule = useCallback(() => {
    void withSubmit(async () => {
      const response = await api.adminCreateAutoCreditRule({
        name: ruleName.trim(),
        intervalDays: Number.parseInt(ruleIntervalDays, 10),
        amount: Number.parseFloat(ruleAmount),
        enabled: ruleEnabled,
      });

      if (response.code !== 0) {
        throw new Error(response.message ?? "创建规则失败");
      }

      setRuleName("");
      setRuleIntervalDays("7");
      setRuleAmount("500");
      setRuleEnabled(true);
      await loadRules();
      return "自动加钱规则已创建。";
    });
  }, [loadRules, ruleAmount, ruleEnabled, ruleIntervalDays, ruleName, withSubmit]);

  const handleToggleRule = useCallback(
    (rule: AutoCreditRuleView) => {
      void withSubmit(async () => {
        const response = await api.adminUpdateAutoCreditRule(rule.id, {
          enabled: !rule.enabled,
        });

        if (response.code !== 0 || !response.data) {
          throw new Error(response.message ?? "更新规则失败");
        }

        const nextItem = response.data.item;
        startTransition(() => {
          setRules((current) =>
            current.map((item) =>
              item.id === rule.id ? nextItem : item,
            ),
          );
        });

        return rule.enabled ? "自动加钱规则已停用。" : "自动加钱规则已启用。";
      });
    },
    [withSubmit],
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-6 px-6 py-8 sm:px-10">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="gap-4 border-b border-slate-100">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Admin Console
                </p>
                <CardTitle className="text-3xl text-slate-950">管理员后台</CardTitle>
                <CardDescription className="max-w-2xl text-sm leading-6">
                  在这里集中处理管理员授权、账户调账、黑名单和自动加钱规则。
                </CardDescription>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={loading || submitting}
                  className="border-slate-200"
                >
                  刷新数据
                </Button>
                <Button asChild className="bg-slate-900 text-white hover:bg-slate-800">
                  <Link href="/">返回主页面</Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          {feedback ? (
            <CardContent>
              <AdminConsoleFeedbackBanner feedback={feedback} />
            </CardContent>
          ) : null}
        </Card>

        <AdminConsoleUserManagement
          keyword={keyword}
          loading={loading}
          submitting={submitting}
          users={users}
          selectedUserId={selectedUserId}
          selectedUser={selectedUser}
          adjustmentAction={adjustmentAction}
          adjustmentAmount={adjustmentAmount}
          adjustmentReason={adjustmentReason}
          blacklistReason={blacklistReason}
          onKeywordChange={setKeyword}
          onSearch={handleSearch}
          onRefresh={handleRefresh}
          onSelectUser={setSelectedUserId}
          onAdjustmentActionChange={setAdjustmentAction}
          onAdjustmentAmountChange={setAdjustmentAmount}
          onAdjustmentReasonChange={setAdjustmentReason}
          onBlacklistReasonChange={setBlacklistReason}
          onToggleAdmin={handleToggleAdmin}
          onToggleBlacklist={handleToggleBlacklist}
          onAdjustBalance={handleAdjustBalance}
        />

        <AdminConsoleAutoCredit
          submitting={submitting}
          rules={rules}
          ruleName={ruleName}
          ruleIntervalDays={ruleIntervalDays}
          ruleAmount={ruleAmount}
          ruleEnabled={ruleEnabled}
          onRuleNameChange={setRuleName}
          onRuleIntervalDaysChange={setRuleIntervalDays}
          onRuleAmountChange={setRuleAmount}
          onRuleEnabledChange={setRuleEnabled}
          onCreateRule={handleCreateRule}
          onToggleRule={handleToggleRule}
        />
      </div>
    </div>
  );
}
