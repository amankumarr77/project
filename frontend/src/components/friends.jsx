import React, { useEffect, useRef, useState } from "react";
import { backendUrl } from "../config";
import Portfolio from "./portfolio";

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedName, setSelectedName] = useState(null);
  const isMountedRef = useRef(true);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${backendUrl}/url/getfriends`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          token: localStorage.getItem("token") || "",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch friends");
      const json = await res.json();
      if (isMountedRef.current) setFriends(json.friends || []);
    } catch (err) {
      console.error("getfriends error", err);
      if (isMountedRef.current) setError("Failed to load friends");
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  const onnameClick = (u) => {
    // render the clicked user's portfolio on the right panel
    setSelectedName(u.name);
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchFriends();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // called by Portfolio when a friend is removed
  const handleFriendRemoved = (removedName) => {
    // close right panel if the removed friend was open
    if (removedName && removedName === selectedName) setSelectedName(null);
    // refresh list
    fetchFriends();
  };

  // render sidebar always; show loading/error inside the left bar
  return (
    <div className="w-full min-h-screen bg-gray-900 text-white">
      <aside className="fixed left-0 top-0 pt-30 h-screen w-64 bg-gray-800 border-r border-gray-700 p-4">
        <h2 className="text-lg font-semibold mb-4">Friends</h2>

        {loading ? (
          <div className="text-gray-300">Loading friends...</div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : friends.length === 0 ? (
          <div className="text-gray-400">No friends found</div>
        ) : (
          <div className="flex flex-col">
            {friends.map((f, idx) => (
              <div
                key={idx}
                className="py-2 px-2 text-sm text-gray-200 border-b border-gray-700"
              >
                <button
                  onClick={() => onnameClick(f)}
                  className="w-full text-left hover:bg-gray-700/40 px-1 py-1"
                >
                  {f.name}
                </button>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* Right panel: takes remaining space to the right of the fixed sidebar */}
      <main className="ml-64 h-screen p-4">
        {/* render portfolio for the selected friend (or empty if none) */}
        {selectedName ? (
          <Portfolio
            forceIncoming={{ name: selectedName }}
            onFriendRemoved={handleFriendRemoved}
          />
        ) : null}
      </main>
    </div>
  );
}