import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { backendUrl } from "../config";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false); // mobile menu (hamburger)
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  // state variable that tracks whether a token exists in localStorage
  const [tokenExists, setTokenExists] = useState(Boolean(localStorage.getItem("token")));

  // keep tokenExists in sync across tabs
  useEffect(() => {
    const handleStorage = () => setTokenExists(Boolean(localStorage.getItem("token")));
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // listen for same-tab auth changes (signin/signup) via custom event
  useEffect(() => {
    const onAuth = () => setTokenExists(Boolean(localStorage.getItem("token")));
    window.addEventListener("auth", onAuth);
    return () => window.removeEventListener("auth", onAuth);
  }, []);

  // also update tokenExists on mount (same-tab changes won't fire storage)
  useEffect(() => {
    setTokenExists(Boolean(localStorage.getItem("token")));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      // also close suggestions when clicking outside
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const NAV_ITEMS = ["Dashboard", "Profile", "Portfolio", "Friends", "Leaderboard"];
  const PATHS = {
    Dashboard: "/",
    Profile: "/profile",
    Portfolio: "/portfolio",
    Friends: "/friends",
    Leaderboard: "/leaderboard",
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("avatar");
    localStorage.removeItem("points");
    setTokenExists(false);
    navigate("/signin");
  };

  // -------------------------
  // Search & suggestions logic
  // -------------------------
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]); // array of { name, ... }
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef(null);
  const searchRef = useRef(null);
  const lastFetchController = useRef(null); // cancel in-flight requests

  // improved: send q as query param, cancel previous request, handle aborts
  const fetchSuggestions = async (q) => {
    if (!q || q.trim() === "") {
      if (lastFetchController.current) {
        lastFetchController.current.abort();
        lastFetchController.current = null;
      }
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // cancel previous in-flight request
    if (lastFetchController.current) {
      lastFetchController.current.abort();
    }
    const controller = new AbortController();
    lastFetchController.current = controller;

    setSearchLoading(true);
    try {
      // include q so server can filter (faster & consistent)
      const url = `${backendUrl}/url/leaderboard?q=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          token: localStorage.getItem("token") || "",
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const data = await res.json();
      const list = Array.isArray(data.userleaderboard) ? data.userleaderboard : [];
      const qLower = q.toLowerCase();
      const filtered = list.filter((u) => (u.name || "").toLowerCase().includes(qLower));
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } catch (err) {
      if (err.name === "AbortError") {
        // request was cancelled, ignore
        return;
      }
      console.error("search fetch error", err);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setSearchLoading(false);
      lastFetchController.current = null;
    }
  };

  const onSearchChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    // debounce requests
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => fetchSuggestions(v), 300);
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const onSuggestionClick = async (u) => {
    // set query UI and close suggestions
    setQuery(u.name || "");
    setShowSuggestions(false);

    // navigate to portfolio route and pass only the selected name.
    // Portfolio component will fetch the profile and use the name for add-friend.
    navigate("/search/portfolio", { state: { name: u.name } });
  };

  return (
    <nav className="fixed top-4 left-1/2 z-50 w-[90vw] -translate-x-1/2 transform bg-gray-800/50 backdrop-blur-sm text-[110%] rounded-lg border border-white/5">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-20">
          {/* Left: Logo */}
          <div className="flex items-center mr-6 shrink-0">
            <Link to="/">
              <img
                src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
                alt="logo"
                className="h-10 w-auto"
              />
            </Link>
          </div>

          {/* Center: Nav links */}
          <div className="hidden sm:flex flex-1 justify-center">
            <div className="flex gap-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item}
                  to={PATHS[item] || "#"}
                  className="rounded-md px-4 py-2 text-base font-medium text-gray-200 hover:bg-white/5 hover:text-white transition"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile hamburger */}
          <div className="sm:hidden flex-1 flex justify-start">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-300 hover:bg-white/5 hover:text-white focus:outline-2 focus:outline-offset-2 focus:outline-indigo-500"
            >
              <span className="sr-only">Open main menu</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
                <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Right: Search, points, profile */}
          <div className="ml-4 flex items-center space-x-3">
            <div className="hidden md:block" ref={searchRef} style={{ position: "relative" }}>
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search users..."
                  value={query}
                  onChange={onSearchChange}
                  onFocus={() => setShowSuggestions(suggestions.length > 0)}
                  className="w-64 bg-gray-800/60 placeholder-gray-400 text-sm text-white px-3 py-2 rounded-lg border border-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white px-2">
                  {searchLoading ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                      <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="11" cy="11" r="6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>

              {/* suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 mt-2 w-80 max-h-64 overflow-auto rounded-md bg-gray-900/95 border border-white/5 shadow-lg z-50">
                  {suggestions.map((u, i) => (
                    <button
                      key={u.id || `${u.name}-${i}`}
                      onClick={() => onSuggestionClick(u)}
                      className="w-full text-left px-4 py-2 hover:bg-white/5 text-gray-200"
                    >
                      {u.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-3">
              {tokenExists ? (
                // show sign out button next to avatar when logged in
                <>
                  <button
                    onClick={handleSignOut}
                    className="rounded-md px-4 py-2 text-base font-medium text-gray-200 hover:bg-white/5 hover:text-white transition"
                  >
                    Sign out
                  </button>
                  
                </>
              ) : (
                <div>
                  <Link
                    to="/signin"
                    className="rounded-md px-4 py-2 text-base font-medium text-gray-200 hover:bg-white/5 hover:text-white transition"
                  >
                    Sign in
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu panel */}
        <div className={`${menuOpen ? "block" : "hidden"} sm:hidden mt-2 pb-3`}>
          <div className="space-y-2 flex flex-col items-start">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item + "-mobile"}
                to={PATHS[item] || "#"}
                onClick={() => setMenuOpen(false)}
                className="w-full text-left px-4 py-2 rounded-md text-gray-200 hover:bg-white/5"
              >
                {item}
              </Link>
            ))}
            <div className="px-4">
              <input
                type="search"
                placeholder="Search..."
                className="w-full bg-gray-800/60 placeholder-gray-400 text-sm text-white px-3 py-2 rounded-lg border border-white/5"
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}