import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AutoCreditRuleView } from "@/lib/types";

import { formatAmount, formatDatetime } from "./admin-console-shared";

type AdminConsoleAutoCreditProps = {
  submitting: boolean;
  rules: AutoCreditRuleView[];
  ruleName: string;
  ruleIntervalDays: string;
  ruleAmount: string;
  ruleEnabled: boolean;
  onRuleNameChange: (value: string) => void;
  onRuleIntervalDaysChange: (value: string) => void;
  onRuleAmountChange: (value: string) => void;
  onRuleEnabledChange: (value: boolean) => void;
  onCreateRule: () => void;
  onToggleRule: (rule: AutoCreditRuleView) => void;
};

export function AdminConsoleAutoCredit({
  submitting,
  rules,
  ruleName,
  ruleIntervalDays,
  ruleAmount,
  ruleEnabled,
  onRuleNameChange,
  onRuleIntervalDaysChange,
  onRuleAmountChange,
  onRuleEnabledChange,
  onCreateRule,
  onToggleRule,
}: AdminConsoleAutoCreditProps) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="gap-2 border-b border-slate-100">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Auto Credit
        </p>
        <CardTitle className="text-slate-950">自动加钱规则</CardTitle>
        <CardDescription>
          规则由服务端定时任务执行，黑名单用户不会被自动加钱。
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 xl:grid-cols-[minmax(18rem,0.9fr)_minmax(0,1.1fr)]">
        <section className="space-y-4 rounded-xl border border-slate-200 p-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">新建规则</p>
            <p className="text-sm text-slate-500">
              例如每 7 天为所有非黑名单用户加 500 积分。
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rule-name">规则名称</Label>
            <Input
              id="rule-name"
              value={ruleName}
              onChange={(event) => onRuleNameChange(event.target.value)}
              placeholder="例如：每周赠送积分"
              className="border-slate-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rule-interval">周期天数</Label>
            <Input
              id="rule-interval"
              value={ruleIntervalDays}
              onChange={(event) => onRuleIntervalDaysChange(event.target.value)}
              placeholder="7"
              className="border-slate-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rule-amount">每次金额</Label>
            <Input
              id="rule-amount"
              value={ruleAmount}
              onChange={(event) => onRuleAmountChange(event.target.value)}
              placeholder="500"
              className="border-slate-200"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">创建后立即启用</p>
              <p className="text-sm text-slate-500">关闭后规则保留，但不会执行。</p>
            </div>
            <Switch checked={ruleEnabled} onCheckedChange={onRuleEnabledChange} />
          </div>

          <Button
            onClick={onCreateRule}
            disabled={submitting}
            className="w-full bg-slate-900 text-white hover:bg-slate-800"
          >
            创建规则
          </Button>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-slate-50">
                <TableHead>规则</TableHead>
                <TableHead>周期</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>最近执行</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <Empty className="rounded-none border-0 py-10">
                      <EmptyHeader>
                        <EmptyTitle>暂无自动加钱规则</EmptyTitle>
                        <EmptyDescription>创建第一条规则后，系统会按 cron 定时执行。</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="space-y-1 font-medium text-slate-900">
                      <p>{rule.name}</p>
                      <p className="text-xs text-slate-500">
                        创建人：{rule.createdByName || "-"}
                      </p>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      每 {rule.intervalDays} 天
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900">
                      ¥{formatAmount(rule.amount)}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {formatDatetime(rule.lastExecutedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => onToggleRule(rule)}
                        />
                        <span
                          className={rule.enabled ? "text-emerald-600" : "text-slate-500"}
                        >
                          {rule.enabled ? "启用" : "停用"}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </section>
      </CardContent>
    </Card>
  );
}
