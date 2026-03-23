"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserAgreementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserAgreementDialog({
  open,
  onOpenChange,
}: UserAgreementDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="wide"
        className="max-w-3xl rounded-[2rem] border-slate-200 p-0 shadow-2xl"
      >
        <DialogHeader className="border-b border-slate-100 px-8 pt-8 pb-6 text-left">
          <DialogTitle className="text-2xl font-[900] tracking-tight text-slate-900">
            立搜用户服务协议 V1.05
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-slate-500">
            欢迎您选择使用立搜！在您开始浏览立搜网站或使用立搜提供的产品或服务之前，请认真阅读并完全理解本协议。
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[70vh] px-8 py-6">
          <div className="space-y-6 pr-6 text-sm leading-7 text-slate-600">
            <p>
              欢迎您选择使用立搜！在您开始浏览立搜网站或使用立搜（以下简称“我们”）提供的产品或服务（以下统称为“服务”）之前，请务必认真阅读并完全理解本用户服务协议（以下简称为“本协议”），并在确认您已经完全理解之后，决定是否接受本协议。
            </p>

            <section className="space-y-3">
              <h3 className="text-base font-black text-slate-900">1. 核心服务说明</h3>
              <p>
                <strong className="font-black text-slate-900">服务本质：</strong>
                立搜提供在用户指令下，按照用户需求进行图片编辑的服务，本质为智能改图工具。
              </p>
              <p>
                <strong className="font-black text-slate-900">权利声明：</strong>
                对于您输入的图片与最终输出的图片，我们均不主张任何所有权。
              </p>
              <p>
                <strong className="font-black text-slate-900">接受协议：</strong>
                当您点击“同意用户服务协议”或开始使用立搜服务，即表示您已接受本协议所有条款。若不同意，请立即停止注册或使用。
              </p>
              <p>
                <strong className="font-black text-slate-900">特别提醒：</strong>
                请注意粗体标记的限制或免除责任条款，以及限制或排除您权利的条款。
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-black text-slate-900">2. 用户承诺与声明</h3>
              <p>
                <strong className="font-black text-slate-900">民事能力：</strong>
                您必须具有中华人民共和国（不含港澳台）法律规定的签订合同的民事行为能力。
              </p>
              <p>
                <strong className="font-black text-slate-900">机构授权：</strong>
                若代表法人或非法人组织签订本协议，您需承诺拥有合法代表权。
              </p>
              <p>
                <strong className="font-black text-slate-900">合规要求：</strong>
                境外用户需同时遵守中华人民共和国法律及所在国家或地区的法律。
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-black text-slate-900">3. 数据安全及知识产权</h3>
              <p>
                <strong className="font-black text-slate-900">AI生成内容：</strong>
                平台生成的图片和信息基于算法自动化分析，不构成专业法律意见。严禁在未验证情况下用于重大商业决策或法律程序。因依赖生成内容引发的侵权纠纷，由您独立承担。
              </p>
              <p>
                <strong className="font-black text-slate-900">模型训练许可：</strong>
                您理解并同意，立搜会收集用户提供的实际使用数据来训练模型或对外宣传。当您提交内容时，即授予立搜及其合作伙伴一项全球性许可，允许我们托管、存储、修改、创建衍生作品、传播及公开展示此类内容。
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-black text-slate-900">4. 版权检测免责声明</h3>
              <p>
                <strong className="font-black text-slate-900">参考目的：</strong>
                版权检测服务中的信息仅供参考，不具法律约束力。
              </p>
              <p>
                <strong className="font-black text-slate-900">第三方链接：</strong>
                为方便用户，立搜可能包含第三方网站链接。我们不对这些外部资源的真实性、合法性负责，因使用第三方资源造成的直接或间接损失，立搜不承担责任。
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-black text-slate-900">5. 账户管理</h3>
              <p>
                <strong className="font-black text-slate-900">所有权与权限：</strong>
                立搜拥有账户所有权，用户根据服务类型获得使用权。
              </p>
              <p>
                <strong className="font-black text-slate-900">多账户规则：</strong>
                一般情况下，同一法律主体不允许拥有多个账户。确需多账户操作的可通过【管理员功能】设立子账户。
              </p>
              <p>
                <strong className="font-black text-slate-900">禁止转让：</strong>
                未经立搜书面同意，不得出租、借用、转让、共享或分时使用账户。
              </p>
              <p>
                <strong className="font-black text-slate-900">安全责任：</strong>
                您需妥善保管密码。发现账户被盗应立即通知立搜冻结。
              </p>
              <div className="space-y-2">
                <p>
                  <strong className="font-black text-slate-900">冻结与注销：</strong>
                </p>
                <p>1. 违反法律或协议、应国家机关要求、保护第三方利益等情形下，立搜有权冻结账户。</p>
                <p>2. 连续12个月未登录且无到期收费服务的账户，立搜有权注销。</p>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-black text-slate-900">6. 服务费用</h3>
              <p>
                <strong className="font-black text-slate-900">付费模式：</strong>
                立搜采用“充值支付即采购”模式。
              </p>
              <p>
                <strong className="font-black text-slate-900">时效限制：</strong>
                充值兑换的点数或赠送点数均有时效期限，到期未使用的点数不予提现。
              </p>
              <p>
                <strong className="font-black text-slate-900">优惠策略：</strong>
                营销策略赠送的点数仅限限定期限内使用，不提供延期或退款。
              </p>
              <p>
                <strong className="font-black text-slate-900">计费规则：</strong>
                按使用次数计费；浏览历史记录免费，但重新“检测”需再次计费。
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-black text-slate-900">7. 使用规则与限制</h3>
              <div className="space-y-2">
                <p>
                  <strong className="font-black text-slate-900">严禁行为：</strong>
                </p>
                <p>1. 利用立搜服务危害国家利益、损害公共利益或侵犯他人合法权益。</p>
                <p>2. 使用插件、外挂、机器人程序等自动化方式非法获取、监控或转卖立搜数据。</p>
                <p>3. 利用立搜数据针对竞争模型进行训练。</p>
                <p>4. 将账户或API接口转借第三方使用。</p>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-black text-slate-900">8. 责任限制</h3>
              <p>
                <strong className="font-black text-slate-900">误差声明：</strong>
                立搜基于AI技术，评估结果仅供参考，请务必自行验证。您需承担使用建议引起的任何间接或偶然损失。
              </p>
              <p>
                <strong className="font-black text-slate-900">赔偿限额：</strong>
                在任何情况下，立搜因本协议承担的责任总额，不超过您当年度支付给立搜的费用总额。
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-black text-slate-900">9. 管辖与法律适用</h3>
              <p>
                <strong className="font-black text-slate-900">适用法律：</strong>
                本协议适用中华人民共和国法律（不含港澳台）。
              </p>
              <p>
                <strong className="font-black text-slate-900">签订地：</strong>
                中华人民共和国浙江省杭州市拱墅区。
              </p>
              <p>
                <strong className="font-black text-slate-900">争议解决：</strong>
                协商不成时，提交至
                <strong className="font-black text-slate-900">
                  本协议签订地（杭州市拱墅区）
                </strong>
                有管辖权的人民法院解决。
              </p>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter className="border-t border-slate-100 px-8 py-5 sm:justify-end">
          <DialogClose asChild>
            <Button
              type="button"
              className="rounded-xl bg-slate-900 px-6 text-xs font-black tracking-[0.18em] text-white hover:bg-slate-800"
            >
              我已阅读
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
