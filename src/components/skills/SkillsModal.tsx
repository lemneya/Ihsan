"use client";

import { useState, useEffect } from "react";
import {
  X,
  Search,
  Plus,
  ChevronDown,
  Settings,
  User,
  Calendar,
  Mail,
  Database,
  Cloud,
  Monitor,
  Cpu,
  Zap,
  LayoutGrid,
  Shield,
  CreditCard,
  Sparkles,
  Filter,
  Moon,
  Globe,
  BrainCircuit,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────────

interface Skill {
  id: string;
  title: string;
  desc: string;
  enabled: boolean;
  official: boolean;
  date: string;
  tools: string[];
}

interface Connector {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: "connected" | "disconnected";
  category: string;
}

interface Integration {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  workflows: number;
}

interface Personalization {
  theme: "light" | "dark" | "system";
  language: string;
  memory: boolean;
  tone: string;
}

// ─── Menu Data ──────────────────────────────────────────────────────

const menuItems = [
  { icon: User, label: "Account" },
  { icon: Settings, label: "Settings" },
  { icon: Calendar, label: "Scheduled tasks" },
  { icon: Mail, label: "Mail Ihsan" },
  { icon: Database, label: "Data controls" },
  { icon: Cloud, label: "Cloud browser" },
  { icon: Monitor, label: "Personalization" },
  { icon: Cpu, label: "Skills" },
  { icon: Zap, label: "Connectors" },
  { icon: LayoutGrid, label: "Integrations" },
];

const teamItems = [
  { icon: User, label: "Team settings" },
  { icon: User, label: "Members" },
  { icon: Shield, label: "Security" },
  { icon: Sparkles, label: "Usage" },
  { icon: CreditCard, label: "Billing" },
];

// ─── Helpers ────────────────────────────────────────────────────────

function connectorEmoji(icon: string): string {
  switch (icon) {
    case "chrome": return "🌐";
    case "gmail": return "✉️";
    case "calendar": return "📅";
    case "drive": return "📁";
    case "outlook": return "📧";
    case "github": return "🐙";
    case "slack": return "💬";
    case "notion": return "📝";
    case "zapier": return "⚡";
    default: return "🔗";
  }
}

// ─── Component ──────────────────────────────────────────────────────

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";

interface SkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SkillsModal({ isOpen, onClose }: SkillsModalProps) {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenu, setActiveMenu] = useState("Skills");

  // Data states
  const [skills, setSkills] = useState<Skill[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [personalization, setPersonalization] = useState<Personalization | null>(null);

  // Fetch data based on active menu tab
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    const fetchData = async () => {
      try {
        if (activeMenu === "Skills") {
          const res = await fetch(`${WS_URL}/api/skills`);
          setSkills(await res.json());
        } else if (activeMenu === "Connectors") {
          const res = await fetch(`${WS_URL}/api/connectors`);
          setConnectors(await res.json());
        } else if (activeMenu === "Integrations") {
          const res = await fetch(`${WS_URL}/api/integrations`);
          setIntegrations(await res.json());
        } else if (activeMenu === "Personalization") {
          const res = await fetch(`${WS_URL}/api/personalization`);
          setPersonalization(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeMenu, isOpen]);

  // Toggle skill via API (optimistic update)
  const toggleSkill = (id: string) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
    fetch(`${WS_URL}/api/skills/${id}/toggle`, { method: "PUT" }).catch(() => {});
  };

  // Update personalization (optimistic)
  const updatePersonalization = (key: keyof Personalization, value: string | boolean) => {
    if (!personalization) return;
    const updated = { ...personalization, [key]: value };
    setPersonalization(updated);
    fetch(`${WS_URL}/api/personalization`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    }).catch(() => {});
  };

  const filtered = skills.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Active tabs that have dedicated views
  const dynamicTabs = ["Skills", "Connectors", "Integrations", "Personalization"];
  const hasDynamicView = dynamicTabs.includes(activeMenu);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
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
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex overflow-hidden ring-1 ring-gray-200"
          >
            {/* ─── Inner Sidebar ─────────────────────────────────── */}
            <div className="w-64 flex-shrink-0 bg-gray-50/50 border-r border-gray-200 flex-col overflow-y-auto hidden md:flex">
              <div className="p-5">
                {/* Brand */}
                <div className="flex items-center gap-2 font-bold text-lg mb-6">
                  <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs">
                    I
                  </div>
                  ihsan
                </div>

                {/* Team selector */}
                <div className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg mb-6 cursor-pointer hover:border-gray-300 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-purple-600 rounded text-white flex items-center justify-center text-[10px] font-bold">
                      I
                    </div>
                    <span className="text-sm font-medium">ihsan</span>
                  </div>
                  <ChevronDown size={14} className="text-gray-400" />
                </div>

                {/* Menu */}
                <div className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        onClick={() => setActiveMenu(item.label)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-sm font-medium transition-all duration-200 ${
                          activeMenu === item.label
                            ? "bg-white shadow-sm text-gray-900"
                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        <Icon size={18} />
                        {item.label}
                      </div>
                    );
                  })}
                </div>

                {/* Team section */}
                <div className="mt-8 mb-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Team
                </div>
                <div className="space-y-1">
                  {teamItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        onClick={() => setActiveMenu(item.label)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-sm font-medium transition-all duration-200 ${
                          activeMenu === item.label
                            ? "bg-white shadow-sm text-gray-900"
                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        <Icon size={18} />
                        {item.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ─── Main Content ───────────────────────────────────── */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
              {/* Header */}
              <div className="px-6 sm:px-8 py-6 border-b border-gray-100 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    {activeMenu}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {activeMenu === "Skills"
                      ? "Prepackaged and repeatable best practices & tools for your agents"
                      : `Manage your ${activeMenu.toLowerCase()} settings`}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                {loading ? (
                  <div className="flex justify-center p-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                  </div>
                ) : (
                  <>
                    {/* ── 1. SKILLS VIEW ──────────────────────────── */}
                    {activeMenu === "Skills" && (
                      <>
                        {/* Toolbar */}
                        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                          <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 cursor-pointer shadow-sm">
                              <Filter size={14} />
                              All type
                              <ChevronDown size={14} />
                            </button>
                            <div className="relative">
                              <Search
                                size={14}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                              />
                              <input
                                type="text"
                                placeholder="Search Skill"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-64 transition-all"
                              />
                            </div>
                          </div>
                          <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium cursor-pointer shadow-sm">
                            <Shield size={14} />
                            Official library
                          </button>
                        </div>

                        {/* Add skill banner */}
                        <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-6 flex items-center justify-between mb-8">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 shadow-sm">
                              <Plus size={20} />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900">
                                Add custom Skills
                              </h3>
                              <p className="text-xs text-gray-500">
                                Add a skill to unlock new capabilities for
                                yourself or your team.
                              </p>
                            </div>
                          </div>
                          <button className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-2 cursor-pointer shadow-lg shadow-gray-200 transition-all active:scale-95">
                            <Plus size={14} /> Add
                          </button>
                        </div>

                        {/* Skills grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {filtered.map((card) => (
                            <div
                              key={card.id}
                              className="border border-gray-200 rounded-xl p-5 hover:border-blue-200 hover:shadow-md transition-all group bg-white"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-gray-900 text-sm">
                                    {card.title}
                                  </h3>
                                  {card.official && (
                                    <Sparkles
                                      size={12}
                                      className="text-blue-500 fill-blue-500"
                                    />
                                  )}
                                </div>
                                <button
                                  onClick={() => toggleSkill(card.id)}
                                  className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out ${
                                    card.enabled
                                      ? "bg-blue-600"
                                      : "bg-gray-200"
                                  }`}
                                >
                                  <div
                                    className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ease-in-out ${
                                      card.enabled
                                        ? "translate-x-4"
                                        : "translate-x-0"
                                    }`}
                                  />
                                </button>
                              </div>
                              <p className="text-xs text-gray-500 leading-relaxed mb-3 h-10 overflow-hidden">
                                {card.desc}
                              </p>
                              {/* Linked tools */}
                              {card.tools && card.tools.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {card.tools.map((t) => (
                                    <span
                                      key={t}
                                      className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-mono"
                                    >
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                                  {card.official && (
                                    <>
                                      <Shield size={10} /> Official
                                      <span className="mx-1">&middot;</span>
                                    </>
                                  )}
                                  <span>Updated on {card.date}</span>
                                </div>
                                <button className="text-gray-400 hover:text-gray-600 font-bold text-xs tracking-widest px-2 py-1 hover:bg-gray-100 rounded cursor-pointer">
                                  &middot;&middot;&middot;
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {filtered.length === 0 && (
                          <p className="text-center text-sm text-gray-400 py-8">
                            No skills found for &ldquo;{searchQuery}&rdquo;
                          </p>
                        )}
                      </>
                    )}

                    {/* ── 2. CONNECTORS VIEW ─────────────────────── */}
                    {activeMenu === "Connectors" && (
                      <div className="grid grid-cols-1 gap-4">
                        {connectors.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:shadow-sm transition-all"
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                                  c.status === "connected"
                                    ? "bg-green-50"
                                    : "bg-gray-100"
                                }`}
                              >
                                {connectorEmoji(c.icon)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-gray-900">
                                    {c.name}
                                  </h3>
                                  {c.status === "connected" && (
                                    <Check
                                      size={14}
                                      className="text-green-500"
                                    />
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {c.description}
                                </p>
                              </div>
                            </div>
                            <button
                              className={`px-4 py-2 text-xs font-medium rounded-lg border transition-colors ${
                                c.status === "connected"
                                  ? "bg-white border-gray-200 text-red-500 hover:bg-red-50"
                                  : "bg-black text-white border-transparent hover:bg-gray-800"
                              }`}
                            >
                              {c.status === "connected"
                                ? "Disconnect"
                                : "Connect"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── 3. INTEGRATIONS VIEW ───────────────────── */}
                    {activeMenu === "Integrations" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {integrations.map((int) => (
                          <div
                            key={int.id}
                            className="p-5 border border-gray-200 rounded-xl hover:border-purple-200 hover:shadow-md transition-all"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-600 font-bold">
                                {int.name[0]}
                              </div>
                              {int.connected && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                  Active
                                </span>
                              )}
                            </div>
                            <h3 className="font-semibold text-gray-900">
                              {int.name}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                              {int.connected
                                ? `${int.workflows} active workflows`
                                : "Not connected"}
                            </p>
                            <button className="mt-4 w-full py-2 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                              Configure
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── 4. PERSONALIZATION VIEW ────────────────── */}
                    {activeMenu === "Personalization" && personalization && (
                      <div className="max-w-2xl space-y-6">
                        {/* Theme */}
                        <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                              <Moon size={20} />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                Theme
                              </h3>
                              <p className="text-xs text-gray-500">
                                Choose your interface appearance
                              </p>
                            </div>
                          </div>
                          <select
                            value={personalization.theme}
                            onChange={(e) =>
                              updatePersonalization(
                                "theme",
                                e.target.value
                              )
                            }
                            className="bg-gray-50 border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value="light">Light Mode</option>
                            <option value="dark">Dark Mode</option>
                            <option value="system">System</option>
                          </select>
                        </div>

                        {/* Language */}
                        <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                              <Globe size={20} />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                Language
                              </h3>
                              <p className="text-xs text-gray-500">
                                Agent response language
                              </p>
                            </div>
                          </div>
                          <select
                            value={personalization.language}
                            onChange={(e) =>
                              updatePersonalization(
                                "language",
                                e.target.value
                              )
                            }
                            className="bg-gray-50 border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option>English (US)</option>
                            <option>French</option>
                            <option>Spanish</option>
                            <option>Arabic</option>
                          </select>
                        </div>

                        {/* Memory */}
                        <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-lg flex items-center justify-center">
                              <BrainCircuit size={20} />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                Memory
                              </h3>
                              <p className="text-xs text-gray-500">
                                Allow agent to remember past conversations
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              updatePersonalization(
                                "memory",
                                !personalization.memory
                              )
                            }
                            className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                              personalization.memory
                                ? "bg-green-500"
                                : "bg-gray-200"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                                personalization.memory
                                  ? "translate-x-4"
                                  : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Tone */}
                        <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                              <Sparkles size={20} />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                Tone
                              </h3>
                              <p className="text-xs text-gray-500">
                                How the agent communicates with you
                              </p>
                            </div>
                          </div>
                          <select
                            value={personalization.tone}
                            onChange={(e) =>
                              updatePersonalization("tone", e.target.value)
                            }
                            className="bg-gray-50 border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option>Professional</option>
                            <option>Casual</option>
                            <option>Friendly</option>
                            <option>Concise</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* ── PLACEHOLDER (other tabs) ───────────────── */}
                    {!hasDynamicView && (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                          {(() => {
                            const item =
                              menuItems.find(
                                (i) => i.label === activeMenu
                              ) ||
                              teamItems.find(
                                (i) => i.label === activeMenu
                              );
                            if (item) {
                              const Icon = item.icon;
                              return <Icon size={24} />;
                            }
                            return null;
                          })()}
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {activeMenu}
                        </h3>
                        <p className="text-sm">
                          This section is under construction.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
