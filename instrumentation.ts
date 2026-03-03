export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { ensurePaymentSchedulersStarted } = await import(
    "@/lib/server/payment/scheduler"
  );
  ensurePaymentSchedulersStarted();
}
