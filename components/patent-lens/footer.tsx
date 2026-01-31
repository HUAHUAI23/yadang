export default function Footer() {
  return (
    <footer className="py-20 text-center">
      <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
        © 2026 PatentLens - Professional IP Visual Search
      </p>
      <div className="mt-4 flex justify-center space-x-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <a href="#" className="hover:text-slate-900 transition-colors">
          隐私政策
        </a>
        <a href="#" className="hover:text-slate-900 transition-colors">
          服务条款
        </a>
        <a href="#" className="hover:text-slate-900 transition-colors">
          联系我们
        </a>
      </div>
    </footer>
  );
}
