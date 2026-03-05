"use client";

import { useCallback, useEffect, useState } from "react";

import AuthDialog from "@/components/patent-lens/auth-dialog";
import Footer from "@/components/patent-lens/footer";
import Header from "@/components/patent-lens/header";
import HistorySidebar from "@/components/patent-lens/history-sidebar";
import Landing from "@/components/patent-lens/landing";
import PatentDetail from "@/components/patent-lens/patent-detail";
import RechargeDialog from "@/components/patent-lens/recharge-dialog";
import SearchResults from "@/components/patent-lens/search-results";
import UploadSection from "@/components/patent-lens/upload-section";
import { api } from "@/lib/api";
import type { SearchHistoryItem, TrademarkResultItem } from "@/lib/types";
import { usePatentLensStore } from "@/stores/patent-lens";

export default function AppShell() {
  const [preview, setPreview] = useState<string | null>(null);
  const [searchPrice, setSearchPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TrademarkResultItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<TrademarkResultItem | null>(null);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const {
    isAuthenticated,
    account,
    setSession,
    setBalance,
    history,
    setHistory,
    prependHistory,
    clearHistoryLocal,
    logout,
  } = usePatentLensStore();

  const loadDashboard = useCallback(async () => {
    const [priceRes, historyRes] = await Promise.all([
      api.searchPrice(),
      api.searchHistory(),
    ]);

    if (priceRes.code === 0 && priceRes.data) {
      setSearchPrice(priceRes.data.amount);
      setBalance(priceRes.data.balance);
    }

    if (historyRes.code === 0 && historyRes.data) {
      setHistory(historyRes.data.items);
    }
  }, [setBalance, setHistory]);

  const reloadHistory = useCallback(async () => {
    const historyRes = await api.searchHistory();
    if (historyRes.code === 0 && historyRes.data) {
      setHistory(historyRes.data.items);
    }
  }, [setHistory]);

  useEffect(() => {
    let active = true;

    api
      .authMe()
      .then(async (response) => {
        if (!active) return;
        if (response.code !== 0 || !response.data) {
          setSession({ user: null, account: null });
          return;
        }

        setSession({
          user: response.data.user,
          account: response.data.account,
        });
        await loadDashboard();
      })
      .catch(() => setSession({ user: null, account: null }));

    return () => {
      active = false;
    };
  }, [loadDashboard, setSession]);

  const handleSearch = async (base64: string) => {
    if (!isAuthenticated) {
      setIsAuthOpen(true);
      return;
    }

    if (!base64.startsWith("data:image/")) {
      window.alert("历史图片仅用于回看，请重新上传后发起检索。");
      return;
    }

    const balanceYuan = account?.balance ?? 0;
    if (balanceYuan < searchPrice) {
      setIsRechargeOpen(true);
      return;
    }

    setIsLoading(true);
    setResults([]);

    try {
      const response = await api.search({ imageBase64: base64 });
      if (response.code !== 0 || !response.data) {
        await reloadHistory();
        if (response.code === 402) {
          setIsRechargeOpen(true);
        }
        window.alert(response.message ?? "检索失败，请稍后再试。");
        return;
      }

      setResults(response.data.results);
      setPreview(response.data.queryImageUrl);
      setBalance(response.data.balance);

      const newHistoryItem: SearchHistoryItem = {
        id: response.data.searchId,
        timestamp: Date.now(),
        queryImageUrl: response.data.queryImageUrl,
        cost: response.data.cost,
        status: "SUCCESS",
        resultCount: response.data.resultCount,
        results: response.data.results,
      };
      prependHistory(newHistoryItem);
    } catch (error) {
      await reloadHistory();
      console.error("Search failed:", error);
      window.alert("检索失败，请稍后再试。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistoryItem = (item: SearchHistoryItem) => {
    setPreview(item.queryImageUrl);
    setResults(item.results);

    setTimeout(() => {
      const resultsEl = document.getElementById("search-results-anchor");
      if (resultsEl) {
        resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleClearHistory = async () => {
    const confirmed = window.confirm("确定要清空所有查询历史吗？");
    if (!confirmed) return;

    const response = await api.clearHistory();
    if (response.code !== 0) {
      window.alert(response.message ?? "清空失败，请稍后再试。");
      return;
    }
    clearHistoryLocal();
  };

  const handleLogout = () => {
    api.authLogout().catch(() => null);
    logout();
    setResults([]);
    setPreview(null);
    setSearchPrice(0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfdfe]">
      <div className="nebula-1" />
      <div className="nebula-2" />

      <Header
        account={account}
        onOpenRecharge={() =>
          isAuthenticated ? setIsRechargeOpen(true) : setIsAuthOpen(true)
        }
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        onLogin={() => setIsAuthOpen(true)}
      />

      {!isAuthenticated ? (
        <Landing onStart={() => setIsAuthOpen(true)} />
      ) : (
        <div className="flex-grow flex flex-col lg:flex-row animate-in fade-in duration-700">
          <HistorySidebar
            history={history}
            onSelectItem={handleSelectHistoryItem}
            onClearHistory={handleClearHistory}
          />

          <div className="flex-grow min-w-0">
            <UploadSection
              onSearch={handleSearch}
              isLoading={isLoading}
              currentBalance={account?.balance ?? 0}
              preview={preview}
              setPreview={setPreview}
              cost={searchPrice}
            />

            <div id="search-results-anchor" className="scroll-mt-24">
              <SearchResults results={results} onSelect={setSelectedItem} />
            </div>

            <Footer />
          </div>
        </div>
      )}

      <PatentDetail item={selectedItem} onClose={() => setSelectedItem(null)} />

      <RechargeDialog
        open={isRechargeOpen}
        onOpenChange={setIsRechargeOpen}
        onRechargeSuccess={async () => {
          await loadDashboard();
          window.alert("充值成功，余额已更新。");
          setIsRechargeOpen(false);
        }}
      />

      {isAuthOpen && (
        <AuthDialog
          open={isAuthOpen}
          onOpenChange={setIsAuthOpen}
          onSuccess={async (result) => {
            setSession({
              user: result.user,
              account: result.account,
            });
            await loadDashboard();
          }}
        />
      )}
    </div>
  );
}
