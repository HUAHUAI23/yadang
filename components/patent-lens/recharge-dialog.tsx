"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RECHARGE_PACKAGES } from "@/lib/constants";

interface RechargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecharge: (packageId: string) => void;
}

export default function RechargeDialog({
  open,
  onOpenChange,
  onRecharge,
}: RechargeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden p-0">
        <DialogHeader className="px-10 py-8 border-b border-slate-100 flex justify-between items-center">
          <div>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
              积分充值
            </DialogTitle>
            <p className="text-slate-500 text-sm mt-1">
              1元人民币 = 10积分，多充多送
            </p>
          </div>
        </DialogHeader>

        <div className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {RECHARGE_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => onRecharge(pkg.id)}
                className={`relative p-8 rounded-3xl border-2 transition-all text-left flex flex-col justify-between hover:scale-[1.02] active:scale-95 ${
                  pkg.isPopular
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-slate-100 hover:border-blue-200"
                }`}
              >
                {pkg.isPopular && (
                  <span className="absolute -top-3 right-6 bg-blue-600 text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                    最划算
                  </span>
                )}
                <div>
                  <span className="block text-4xl font-black text-slate-900">
                    ¥{pkg.amount}
                  </span>
                  <span className="block text-slate-500 text-lg mt-1 font-bold">
                    {pkg.credits} 积分
                  </span>
                </div>
                <div className="mt-6 flex items-center text-blue-600 font-black text-xs uppercase tracking-widest">
                  立即充值
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-10 bg-slate-50 rounded-3xl p-6 border border-slate-100">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3">
              资费说明
            </h3>
            <ul className="text-xs text-slate-500 space-y-2 font-medium">
              <li className="flex items-center">
                <span className="w-1 h-1 bg-slate-300 rounded-full mr-2" />
                单次检索扣除 20-30 积分
              </li>
              <li className="flex items-center">
                <span className="w-1 h-1 bg-slate-300 rounded-full mr-2" />
                积分永久有效，不支持退款
              </li>
              <li className="flex items-center">
                <span className="w-1 h-1 bg-slate-300 rounded-full mr-2" />
                支付成功后积分实时到账
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
