"use client";

import { useState, useEffect } from "react";
import { X, Search, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────────

export interface Connector {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: "connected" | "disconnected";
  category: string;
}

// ─── Icon Helper ────────────────────────────────────────────────────

const iconColors: Record<string, string> = {
  chrome: "bg-blue-500",
  gmail: "bg-red-500",
  calendar: "bg-blue-600",
  drive: "bg-green-500",
  outlook: "bg-blue-700",
  github: "bg-gray-800",
  slack: "bg-purple-500",
  notion: "bg-gray-900",
  zapier: "bg-orange-500",
};

function AppIcon({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const colorClass = iconColors[name] || "bg-gray-500";
  const sizeClass = size === "lg" ? "w-10 h-10 text-lg" : "w-8 h-8 text-sm";
  return (
    <div
      className={`${sizeClass} ${colorClass} text-white rounded-lg flex items-center justify-center font-bold flex-shrink-0`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Tabs ───────────────────────────────────────────────────────────

const tabs = ["Apps", "Custom API", "Custom MCP"] as const;

// ─── Modal Component ────────────────────────────────────────────────

interface ConnectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";

export default function ConnectorModal({ isOpen, onClose }: ConnectorModalProps) {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Apps");

  useEffect(() => {
    if (!isOpen) return;
    fetch(`${WS_URL}/api/connectors`)
      .then((r) => r.json())
      .then((data: Connector[]) => setConnectors(data))
      .catch(() => {});
  }, [isOpen]);

  const featured = connectors.find((c) => c.id === "browser" && c.status === "connected");
  const filtered = connectors.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 h-[80vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">Connectors</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Featured connector */}
              {featured && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <AppIcon name={featured.icon} size="lg" />
                    <div>
                      <h3 className="font-medium text-gray-900">{featured.name}</h3>
                      <p className="text-sm text-gray-500">{featured.description}</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    Connect
                  </button>
                </div>
              )}

              {/* Tabs + search */}
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center gap-6 border-b border-gray-100 text-sm font-medium text-gray-500">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-3 transition-colors cursor-pointer ${
                        activeTab === tab
                          ? "text-gray-900 border-b-2 border-gray-900"
                          : "hover:text-gray-700"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* App grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map((connector) => (
                  <div
                    key={connector.id}
                    className="p-4 border border-gray-100 rounded-xl flex gap-4 hover:shadow-sm transition-shadow bg-white"
                  >
                    <AppIcon name={connector.icon} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900">{connector.name}</h3>
                        {connector.status === "connected" ? (
                          <Check size={18} className="text-green-500" />
                        ) : (
                          <button className="text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
                            Connect
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {connector.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {filtered.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-8">
                  No connectors found for &ldquo;{search}&rdquo;
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
