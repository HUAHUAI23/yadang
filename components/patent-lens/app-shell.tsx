"use client";

import { useMemo, useState } from "react";
import Header from "@/components/patent-lens/header";
import Landing from "@/components/patent-lens/landing";
import UploadSection from "@/components/patent-lens/upload-section";
import SearchResults from "@/components/patent-lens/search-results";
import PatentDetail from "@/components/patent-lens/patent-detail";
import RechargeDialog from "@/components/patent-lens/recharge-dialog";
import HistorySidebar from "@/components/patent-lens/history-sidebar";
import Footer from "@/components/patent-lens/footer";
import AuthDialog from "@/components/patent-lens/auth-dialog";
import { api } from "@/lib/api";
import {
  SEARCH_COST_BOTH,
  SEARCH_COST_SINGLE,
} from "@/lib/constants";
import type { PatentResult, SearchConfig, SearchResponse } from "@/lib/types";
import { usePatentLensStore } from "@/stores/patent-lens";

const initialConfig: SearchConfig = { patents: true, trademarks: true };

const calculateCost = (config: SearchConfig) => {
  if (config.patents && config.trademarks) return SEARCH_COST_BOTH;
  if (config.patents || config.trademarks) return SEARCH_COST_SINGLE;
  return 0;
};

export default function AppShell() {
  const [preview, setPreview] = useState<string | null>(null);
  const [searchConfig, setSearchConfig] = useState<SearchConfig>(initialConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse>({
    patents: [],
    trademarks: [],
  });
  const [selectedItem, setSelectedItem] = useState<PatentResult | null>(null);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const {
    isAuthenticated,
    credits,
    setAuthenticated,
    logout,
    debitCredits,
    rechargeCredits,
    history,
    addHistory,
    clearHistory,
  } = usePatentLensStore();

  const cost = useMemo(() => calculateCost(searchConfig), [searchConfig]);

  const handleSearch = async (base64: string, config: SearchConfig) => {
    if (!isAuthenticated) {
      setIsAuthOpen(true);
      return;
    }

    const requestCost = calculateCost(config);
    if (credits.balance < requestCost) {
      setIsRechargeOpen(true);
      return;
    }

    setIsLoading(true);
    setResults({ patents: [], trademarks: [] });

    try {
      const response = await api.search({ imageBase64: base64, config });
      if (response.code !== 0) {
        window.alert(response.message ?? "检索失败，请稍后再试。");
        return;
      }

      setResults(response.data);
      debitCredits(requestCost);

      addHistory({
        id: Date.now().toString(),
        timestamp: Date.now(),
        thumbnail: base64,
        config: { ...config },
        cost: requestCost,
        results: response.data,
      });
    } catch (error) {
      console.error("Search failed:", error);
      window.alert("检索失败，请稍后再试。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecharge = async (packageId: string) => {
    const response = await api.recharge(packageId);
    if (response.code !== 0) {
      window.alert(response.message ?? "充值失败，请稍后再试。");
      return;
    }

    rechargeCredits(response.data.credits, response.data.amount);
    setIsRechargeOpen(false);
    window.alert(`充值成功！已增加 ${response.data.credits} 积分。`);
  };

  const handleSelectHistoryItem = (item: {
    thumbnail: string;
    config: SearchConfig;
    results: SearchResponse;
  }) => {
    setPreview(item.thumbnail);
    setSearchConfig(item.config);
    setResults(item.results);

    setTimeout(() => {
      const resultsEl = document.getElementById("search-results-anchor");
      if (resultsEl) {
        resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 400, behavior: "smooth" });
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
    clearHistory();
  };

  const handleLogout = () => {
    logout();
    setResults({ patents: [], trademarks: [] });
    setPreview(null);
    setSearchConfig(initialConfig);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfdfe]">
      <div className="nebula-1" />
      <div className="nebula-2" />

      <Header
        credits={credits}
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
              currentBalance={credits.balance}
              preview={preview}
              setPreview={setPreview}
              searchConfig={searchConfig}
              setSearchConfig={setSearchConfig}
              cost={cost}
            />

            <div id="search-results-anchor" className="scroll-mt-24">
              <SearchResults
                patents={results.patents}
                trademarks={results.trademarks}
                onSelect={setSelectedItem}
              />
            </div>

            <Footer />
          </div>
        </div>
      )}

      <PatentDetail item={selectedItem} onClose={() => setSelectedItem(null)} />

      <RechargeDialog
        open={isRechargeOpen}
        onOpenChange={setIsRechargeOpen}
        onRecharge={handleRecharge}
      />

      {isAuthOpen && (
        <AuthDialog
          open={isAuthOpen}
          onOpenChange={setIsAuthOpen}
          onSuccess={() => setAuthenticated(true)}
        />
      )}
    </div>
  );
}
