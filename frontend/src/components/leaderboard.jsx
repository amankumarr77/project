import React, { useEffect, useState } from "react";
import { backendUrl } from "../config";
import { Medal } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Leaderboard() {
  const [data, setData] = useState(null);
  const [criteria, setCriteria] = useState("points");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const openProfile = (name) => {
    if (!name) return;
    navigate("/leaderboard/portfolio", { state: { name } });
  };

  const CRITERIA_LABELS = {
    points: "CoderHub Score",
    cf: "Codeforces Rating",
    cc: "CodeChef Rating",
    lc: "LeetCode Rating",
  };

  // helper to call backend getname and attach name if missing
  const attachNames = async (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return [];
    const token = localStorage.getItem("token");
    const promises = arr.map(async (u) => {
      if (u.name) return u;
      const id = u.userId || u._id || u.id;
      if (!id) return { ...u, name: "Unknown" };
      try {
        const res = await fetch(
          `${backendUrl}/url/getname?id=${encodeURIComponent(id)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              token: token,
            },
          }
        );
        if (!res.ok) return { ...u, name: "Unknown" };
        const json = await res.json();
        return { ...u, name: json.name || "Unknown" };
      } catch (err) {
        console.error("attachNames error for id", id, err);
        return { ...u, name: "Unknown" };
      }
    });
    return Promise.all(promises);
  };

  // Fetch leaderboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${backendUrl}/url/leaderboard`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            token: token,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch leaderboard");
        const json = await res.json();
        console.log("Fetched leaderboard:", json);
        setData(json);
        // attach names before setting users
        const usersWithNames = await attachNames(json.userleaderboard || []);
        setUsers(usersWithNames);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!data) return;
    const updateUsersForCriteria = async () => {
      switch (criteria) {
        case "points":
          setUsers(await attachNames(data.userleaderboard || []));
          break;
        case "cf":
          setUsers(await attachNames(data.cfleaderboard || []));
          break;
        case "cc":
          setUsers(await attachNames(data.ccleaderboard || []));
          break;
        case "lc":
          setUsers(await attachNames(data.lcleaderboard || []));
          break;
        default:
          setUsers([]);
      }
    };
    updateUsersForCriteria();
  }, [criteria, data]);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-950 text-white text-2xl">
        Loading Leaderboard...
      </div>
    );

  if (!users || users.length === 0)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-950 text-gray-400 text-2xl">
        No Data Found
      </div>
    );

  const getMedal = (rank) => {
    // always return an inline-flex centered container so medal and number align the same
    if (rank === 1)
      return (
        <span className="inline-flex items-center justify-center w-6 h-6 mx-auto">
          <Medal className="text-yellow-400 w-6 h-6" title="Gold Medal" />
        </span>
      );
    if (rank === 2)
      return (
        <span className="inline-flex items-center justify-center w-6 h-6 mx-auto">
          <Medal className="text-gray-300 w-6 h-6" title="Silver Medal" />
        </span>
      );
    if (rank === 3)
      return (
        <span className="inline-flex items-center justify-center w-6 h-6 mx-auto">
          <Medal className="text-orange-400 w-6 h-6" title="Bronze Medal" />
        </span>
      );
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 mx-auto">
        {rank}
      </span>
    );
  };

  // get correct score key for selected criteria
  const getScoreValue = (user) => {
    switch (criteria) {
      case "points":
        return user.points ?? 0;
      case "cf":
        return user.cf_currentrating ?? 0;
      case "cc":
        return user.cc_currentrating ?? 0;
      case "lc":
        return user.lc_currentrating ?? 0;
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col items-center py-12 px-4">
      {/* Title */}
      <h1 className="text-4xl font-extrabold mb-10 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">
        Leaderboard
      </h1>

      {/* Criteria Selection */}
      <div className="flex flex-wrap justify-center gap-4 mb-10">
        {Object.entries(CRITERIA_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setCriteria(key)}
            className={`px-5 py-3 rounded-lg border transition-all duration-200 ${
              criteria === key
                ? "bg-indigo-500 border-indigo-400 text-white"
                : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Top 3 Candidates */}
      <div className="flex flex-wrap justify-center gap-6 mb-10">
        {users.slice(0, 3).map((user, index) => (
          <div
            key={index}
            className={`p-6 w-64 rounded-xl text-center shadow-md border ${
              index === 0
                ? "bg-yellow-500/20 border-yellow-400"
                : index === 1
                ? "bg-gray-500/20 border-gray-300"
                : "bg-orange-500/20 border-orange-400"
            }`}
          >
            <div className="flex justify-center mb-2">{getMedal(index + 1)}</div>
            <button
              onClick={() => openProfile(user.name)}
              className="text-xl font-semibold mb-1 hover:underline focus:outline-none"
            >
              {user.name}
            </button>
            <p className="text-gray-300">
              {CRITERIA_LABELS[criteria]}:{" "}
              <span className="font-bold text-white">
                {getScoreValue(user)}
              </span>
            </p>
          </div>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="w-full max-w-5xl bg-gray-800/60 p-6 rounded-xl border border-gray-700">
        <div className="grid grid-cols-3 text-center font-semibold text-gray-300 mb-3 border-b border-gray-600 pb-2">
          <span>Rank</span>
          <span>Name</span>
          <span>{CRITERIA_LABELS[criteria]}</span>
        </div>

        {users.map((user, index) => (
          <div
            key={index}
            className="grid grid-cols-3 text-center py-3 border-b border-gray-700 last:border-none"
          >
            <span>{getMedal(index + 1)}</span>
            <span>
              <button
                onClick={() => openProfile(user.name)}
                className="text-indigo-300 hover:underline focus:outline-none"
              >
                {user.name}
              </button>
            </span>
            <span>{getScoreValue(user)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
