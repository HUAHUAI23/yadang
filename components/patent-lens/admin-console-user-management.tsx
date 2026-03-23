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
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { AdminUserView } from "@/lib/types";

import {
  type AdjustmentAction,
  formatAmount,
  formatDatetime,
  getUserLabel,
} from "./admin-console-shared";

type AdminConsoleUserManagementProps = {
  keyword: string;
  loading: boolean;
  submitting: boolean;
  users: AdminUserView[];
  selectedUserId: number | null;
  selectedUser: AdminUserView | null;
  adjustmentAction: AdjustmentAction;
  adjustmentAmount: string;
  adjustmentReason: string;
  blacklistReason: string;
  onKeywordChange: (value: string) => void;
  onSearch: () => void;
  onRefresh: () => void;
  onSelectUser: (userId: number) => void;
  onAdjustmentActionChange: (value: AdjustmentAction) => void;
  onAdjustmentAmountChange: (value: string) => void;
  onAdjustmentReasonChange: (value: string) => void;
  onBlacklistReasonChange: (value: string) => void;
  onToggleAdmin: (user: AdminUserView) => void;
  onToggleBlacklist: (user: AdminUserView) => void;
  onAdjustBalance: () => void;
};

const adjustmentActionLabels: Record<AdjustmentAction, string> = {
  add: "加钱",
  subtract: "扣钱",
  reset: "账户归 0",
};

export function AdminConsoleUserManagement({
  keyword,
  loading,
  submitting,
  users,
  selectedUserId,
  selectedUser,
  adjustmentAction,
  adjustmentAmount,
  adjustmentReason,
  blacklistReason,
  onKeywordChange,
  onSearch,
  onRefresh,
  onSelectUser,
  onAdjustmentActionChange,
  onAdjustmentAmountChange,
  onAdjustmentReasonChange,
  onBlacklistReasonChange,
  onToggleAdmin,
  onToggleBlacklist,
  onAdjustBalance,
}: AdminConsoleUserManagementProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.95fr)]">
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="gap-4 border-b border-slate-100">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              User Control
            </p>
            <CardTitle className="text-slate-950">用户与权限管理</CardTitle>
            <CardDescription>
              搜索用户并处理管理员授权、黑名单和账户余额。
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <Input
              value={keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
              placeholder="手机号 / 用户名"
              className="border-slate-200"
            />
            <div className="flex gap-2">
              <Button
                onClick={onSearch}
                disabled={loading || submitting}
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                搜索
              </Button>
              <Button
                variant="outline"
                onClick={onRefresh}
                disabled={loading || submitting}
                className="border-slate-200"
              >
                刷新
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="hover:bg-slate-50">
                  <TableHead>用户</TableHead>
                  <TableHead>余额</TableHead>
                  <TableHead>管理员</TableHead>
                  <TableHead>黑名单</TableHead>
                  <TableHead>创建时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0">
                      <Empty className="rounded-none border-0 py-10">
                        <EmptyHeader>
                          <EmptyTitle>没有匹配用户</EmptyTitle>
                          <EmptyDescription>调整搜索条件后重试。</EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow
                      key={user.id}
                      data-state={selectedUserId === user.id ? "selected" : undefined}
                      className="cursor-pointer"
                      onClick={() => onSelectUser(user.id)}
                    >
                      <TableCell className="font-medium text-slate-900">
                        <div className="space-y-1">
                          <p>{getUserLabel(user)}</p>
                          <p className="text-xs text-slate-500">ID: {user.id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900">
                        ¥{formatAmount(user.balance)}
                      </TableCell>
                      <TableCell className={user.isAdmin ? "text-emerald-600" : "text-slate-500"}>
                        {user.isAdmin ? "是" : "否"}
                      </TableCell>
                      <TableCell
                        className={user.isBlacklisted ? "text-rose-600" : "text-slate-500"}
                      >
                        {user.isBlacklisted ? "已拉黑" : "正常"}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {formatDatetime(user.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="gap-2 border-b border-slate-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            User Detail
          </p>
          <CardTitle className="text-slate-950">
            {selectedUser ? "用户操作面板" : "请选择用户"}
          </CardTitle>
          <CardDescription>
            管理员授权、黑名单设置和账户调整都在这里处理。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedUser ? (
            <Empty className="border-slate-200 py-12">
              <EmptyContent>
                <EmptyHeader>
                  <EmptyTitle>尚未选择用户</EmptyTitle>
                  <EmptyDescription>
                    从左侧列表选择一个用户后开始处理权限或账户。
                  </EmptyDescription>
                </EmptyHeader>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="space-y-4">
              <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="text-base font-semibold text-slate-950">
                    {getUserLabel(selectedUser)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    更新时间 {formatDatetime(selectedUser.updatedAt)}
                  </p>
                </div>
                <div className="grid gap-2 text-sm text-slate-600">
                  <p>余额：¥{formatAmount(selectedUser.balance)}</p>
                  <p>管理员：{selectedUser.isAdmin ? "是" : "否"}</p>
                  <p>
                    黑名单：
                    {selectedUser.isBlacklisted
                      ? selectedUser.blacklistReason || "已限制业务操作"
                      : "否"}
                  </p>
                </div>
              </section>

              <section className="space-y-3 rounded-xl border border-slate-200 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">管理员授权</p>
                  <p className="text-sm text-slate-500">
                    当前登录管理员不能移除自己的管理员权限。
                  </p>
                </div>
                <Button
                  variant={selectedUser.isAdmin ? "outline" : "default"}
                  onClick={() => onToggleAdmin(selectedUser)}
                  disabled={submitting}
                  className={
                    selectedUser.isAdmin
                      ? "border-slate-200"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }
                >
                  {selectedUser.isAdmin ? "取消管理员" : "设为管理员"}
                </Button>
              </section>

              <section className="space-y-3 rounded-xl border border-slate-200 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">黑名单设置</p>
                  <p className="text-sm text-slate-500">
                    黑名单用户将被禁止执行受限业务操作，也不会参与自动加钱。
                  </p>
                </div>
                <Textarea
                  value={blacklistReason}
                  onChange={(event) => onBlacklistReasonChange(event.target.value)}
                  placeholder="拉黑原因，可选"
                  className="min-h-24 border-slate-200"
                />
                <Button
                  variant={selectedUser.isBlacklisted ? "outline" : "destructive"}
                  onClick={() => onToggleBlacklist(selectedUser)}
                  disabled={submitting}
                  className={selectedUser.isBlacklisted ? "border-slate-200" : undefined}
                >
                  {selectedUser.isBlacklisted ? "解除黑名单" : "加入黑名单"}
                </Button>
              </section>

              <section className="space-y-3 rounded-xl border border-slate-200 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">余额调整</p>
                  <p className="text-sm text-slate-500">
                    所有人工调账都会写入统一流水表。
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(adjustmentActionLabels) as AdjustmentAction[]).map((action) => (
                    <Button
                      key={action}
                      type="button"
                      size="sm"
                      variant={adjustmentAction === action ? "default" : "outline"}
                      onClick={() => onAdjustmentActionChange(action)}
                      className={
                        adjustmentAction === action
                          ? "bg-slate-900 text-white hover:bg-slate-800"
                          : "border-slate-200"
                      }
                    >
                      {adjustmentActionLabels[action]}
                    </Button>
                  ))}
                </div>

                {adjustmentAction !== "reset" ? (
                  <Input
                    value={adjustmentAmount}
                    onChange={(event) => onAdjustmentAmountChange(event.target.value)}
                    placeholder="金额，单位元"
                    className="border-slate-200"
                  />
                ) : null}

                <Textarea
                  value={adjustmentReason}
                  onChange={(event) => onAdjustmentReasonChange(event.target.value)}
                  placeholder="调整原因，必填"
                  className="min-h-24 border-slate-200"
                />
                <Button
                  onClick={onAdjustBalance}
                  disabled={submitting}
                  className="bg-slate-900 text-white hover:bg-slate-800"
                >
                  提交调整
                </Button>
              </section>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
