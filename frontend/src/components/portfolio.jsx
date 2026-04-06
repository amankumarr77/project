import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { backendUrl } from "../config";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

export default function Portfolio({ forceIncoming, onFriendRemoved } = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const isSearchPath = location.pathname === "/search/portfolio";
  const navIncoming = location.state?.profileData || location.state; // data passed when clicking a search result
  const incoming = forceIncoming || navIncoming;

  // add-friend UI state & handler
  const [addingFriend, setAddingFriend] = useState(false);
  const [friendMsg, setFriendMsg] = useState("");
  // track whether the viewed user is already a friend
  const [isFriend, setIsFriend] = useState(
    Boolean(
      incoming &&
        (incoming.isFriend ||
          incoming.friend ||
          (incoming.data && incoming.data.isFriend) ||
          (incoming.profile && incoming.profile.isFriend))
    )
  );

  // helper to extract the friend's name
  const getFriendName = () =>
    incoming?.name ||
    incoming?.profile?.name ||
    incoming?.data?.name ||
    (data && (data.name || data.userName));

  const handleAddFriend = async () => {
    const friendName = getFriendName();
    if (!friendName) {
      setFriendMsg("No user selected");
      setTimeout(() => setFriendMsg(""), 2000);
      return;
    }

    setAddingFriend(true);
    setFriendMsg("");
    try {
      const res = await fetch(`${backendUrl}/url/addfriend`, {
        method: "POST",
        headers:
          {
            "Content-Type": "application/json",
            token: localStorage.getItem("token") || "",
          },
        body: JSON.stringify({ name: friendName }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFriendMsg(json.msg || json.message || "Failed to add friend");
      } else {
        setFriendMsg(json.msg || json.message || "Friend request sent");
        // mark as friend on success so UI updates to "Remove Friend"
        setIsFriend(true);
      }
    } catch (err) {
      console.error("addfriend error", err);
      setFriendMsg("Failed to add friend");
    } finally {
      setAddingFriend(false);
      setTimeout(() => setFriendMsg(""), 3000);
    }
  };
  const [CheckingFriend, setCheckingFriend] = useState(false);
  const handleCheckFriend = async () => {
    const friendName = getFriendName();
    if (!friendName) return;

    setCheckingFriend(true);
    try {
      const res = await fetch(
        `${backendUrl}/url/checkfriend`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token: localStorage.getItem("token") || "",
          },
          body: JSON.stringify({ name: friendName }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (json.msg==true) {
        setIsFriend(true);
      } else {
        setIsFriend(false);
      }
    } catch (err) {
      console.error("isfriend error", err);
    } finally {
      setCheckingFriend(false);
    }
  };
  const [removingFriend, setRemovingFriend] = useState(false);
  const handleRemoveFriend = async () => {
    try {
      setRemovingFriend(true);
      setFriendMsg("");
      const friendName = getFriendName();
      const res = await fetch(`${backendUrl}/url/removefriend`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          token: localStorage.getItem("token") || "",
        },
        body: JSON.stringify({ name: friendName }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFriendMsg(json.msg || json.message || "Failed to remove friend");
      } else {
        setIsFriend(false);
        setFriendMsg("Removed friend");
        const fname = getFriendName();
        if (typeof onFriendRemoved === "function") onFriendRemoved(fname);
      }
    } catch (err) {
      console.error(err);
      setFriendMsg("Failed to remove friend");
    } finally {
      setRemovingFriend(false);
    }
  };

  // Use incoming data when present and skip fetching user's own data
  const [data, setData] = useState(incoming || null);
  const [loading, setLoading] = useState(incoming ? false : true);
  const [error, setError] = useState("");

  useEffect(() => {
    // If navigation passed profileData (full object), use it and skip fetching
    if (incoming) {
      // If incoming is just { name }, fetch that user's profile from server
      const looksLikeNameOnly =
        typeof incoming.name === "string" &&
        !incoming.cf &&
        !incoming.cc &&
        !incoming.lc &&
        !incoming.profile &&
        !incoming.data &&
        !incoming.user;

      if (looksLikeNameOnly) {
        let cancelled = false;
        const fetchProfile = async () => {
          try {
            setLoading(true);
            const res = await fetch(`${backendUrl}/url/viewprofile`, {
              method: "POST", // change to GET ?name= if your backend expects GET
              headers: {
                "Content-Type": "application/json",
                token: localStorage.getItem("token") || "",
              },
              body: JSON.stringify({ name: incoming.name }),
            });
            if (!res.ok) throw new Error("Failed to fetch profile");
            const json = await res.json();
            let payload = json;
            if (json.profile) payload = json.profile;
            if (json.data) payload = json.data;
            if (json.user) payload = json.user;
            if (!cancelled) {
              setData(payload);
              setError("");
            }
          } catch (err) {
            console.error("fetchProfile error", err);
            if (!cancelled) setError("Failed to load profile");
          } finally {
            if (!cancelled) setLoading(false);
          }
        };
        fetchProfile();
        return () => {
          cancelled = true;
        };
      }

      // Otherwise incoming already contains full profile data — normalize & use it
      let payload = incoming;
      if (incoming.data) payload = incoming.data;
      if (incoming.profile) payload = incoming.profile;
      if (incoming.user) payload = incoming.user;
      if (incoming.result) payload = incoming.result;
      setData(payload);
      setLoading(false);
      setError("");
      return;
    }

    // otherwise fetch current user's portfolio (requires token)
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(`${backendUrl}/url/getdata`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            token: token,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch data");
        const result = await res.json();
        // normalize server response if wrapped
        let payload = result;
        if (result.data) payload = result.data;
        if (result.profile) payload = result.profile;
        setData(payload);
      } catch (err) {
        setError("Failed to load data. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [incoming]);

  // call handleCheckFriend when rendering via /search/portfolio
  // and when incoming/data changes so we have the friend's name available
  useEffect(() => {
    // run check whenever we're viewing another user's profile (incoming present)
    // (keeps previous behavior for /search/portfolio because incoming will be provided there)
    if (!incoming) return;
    const friendName = getFriendName();
    if (!friendName) return;
    handleCheckFriend();
  }, [incoming, data]);

  if (loading)
    return (
      <div className="flex items-center justify-center w-[100vw] h-[100vh] bg-gray-900 text-white text-2xl">
        Loading Portfolio...
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center w-[100vw] h-[100vh] bg-gray-900 text-red-400 text-2xl">
        {error}
      </div>
    );

  if (!data)
    return (
      <div className="flex items-center justify-center w-[100vw] h-[100vh] bg-gray-900 text-gray-400 text-2xl">
        No Profiles Found — backend returned no profile. Check console for incoming payload.
      </div>
    );

  const { cf, cc, lc } = data || {};

  const isAllZero =
    (!cf || Object.values(cf).every((v) => v === 0)) &&
    (!cc || Object.values(cc).every((v) => v === 0)) &&
    (!lc || Object.values(lc).every((v) => v === 0));

  if (isAllZero)
    return (
      <div className="flex items-center justify-center w-[100vw] h-[100vh] bg-gray-900 text-gray-400 text-2xl">
        No Profiles Found
      </div>
    );

  const COLORS = ["#7289da", "#f08000", "#fcd34d"];
  const questionData = [
    { name: "Codeforces", value: cf?.cf_questionNo || 0 },
    { name: "CodeChef", value: cc?.cc_questionNo || 0 },
    { name: "LeetCode", value: lc?.lc_questionNo || 0 },
  ];
  const totalPoints =
    (cf?.cf_points || 0) + (cc?.cc_points || 0) + (lc?.lc_points || 0);

  return (
    <div className="w-[100vw] min-h-[100vh] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col items-center justify-start overflow-x-hidden py-12 px-4">
      {/* Render top bar when path is /search/portfolio */}
      {/* show top bar (with Add/Remove Friend) when on search route OR when viewing an incoming profile */}
      {(isSearchPath || incoming) && (
        <div className="w-full max-w-7xl px-4 mb-6 flex justify-between items-center">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500"
            >
              Back to search
            </button>
          </div>

          {/* top-right: Add Friend button (no logic as requested) */}
          <div className="flex items-center gap-3">
            {isFriend ? (
              <button
                onClick={handleRemoveFriend}
                disabled={removingFriend}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-500 disabled:opacity-60"
              >
                {removingFriend ? "Removing..." : "Remove Friend"}
              </button>
            ) : (
              <button
                onClick={handleAddFriend}
                disabled={addingFriend}
                className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-500 disabled:opacity-60"
              >
                {addingFriend ? "Adding..." : "Add Friend"}
              </button>
            )}
            {friendMsg && <div className="text-sm text-gray-300">{friendMsg}</div>}
          </div>
        </div>
      )}

      {/* Title */}
      <h1 className="text-4xl font-extrabold mb-10 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">
        CODER’S PROFILE
      </h1>

      {/* Top Layout */}
      <div className="relative w-[100vw] max-w-7xl flex flex-col md:flex-row items-center justify-evenly px-4">
        {/* Left Card */}
        <div className="bg-gray-800/70 p-6 rounded-xl shadow-lg w-64 mb-8 md:mb-0 text-center border border-gray-700 hover:scale-105 transition-transform">
          <h2 className="text-xl font-bold text-indigo-400 mb-2">Codeforces</h2>
          <p className="text-gray-300">Contests: {cf?.cf_contest}</p>
          <p className="text-gray-300">Questions: {cf?.cf_questionNo}</p>
        </div>

        {/* Pie Chart Center */}
        <div className="relative flex flex-col items-center justify-center">
          <div className="absolute -top-10 -right-24 hidden md:block text-sm text-gray-300">
            <ArrowUpRight className="inline mr-1" /> cc question
          </div>
          <div className="absolute -bottom-10 left-0 hidden md:block text-sm text-gray-300">
            <ArrowDownLeft className="inline mr-1" /> cf question
          </div>
          <div className="absolute -bottom-10 right-0 hidden md:block text-sm text-gray-300">
            <ArrowDownLeft className="inline mr-1" /> lc question
          </div>

          <ResponsiveContainer width={260} height={260}>
            <PieChart>
              <Pie
                data={questionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={110}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {questionData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "none",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-gray-400 mt-3">
            Total Questions:{" "}
            {questionData.reduce((acc, cur) => acc + cur.value, 0)}
          </p>
        </div>

        {/* Right Card */}
        <div className="bg-gray-800/70 p-6 rounded-xl shadow-lg w-64 text-center border border-gray-700 hover:scale-105 transition-transform">
          <h2 className="text-xl font-bold text-orange-400 mb-2">CodeChef</h2>
          <p className="text-gray-300">Contests: {cc?.cc_contest}</p>
          <p className="text-gray-300">Questions: {cc?.cc_questionNo}</p>
        </div>
      </div>

      {/* LeetCode Card */}
      <div className="bg-gray-800/70 p-6 rounded-xl shadow-lg w-64 mt-12 text-center border border-gray-700 hover:scale-105 transition-transform">
        <h2 className="text-xl font-bold text-yellow-400 mb-2">LeetCode</h2>
        <p className="text-gray-300">Contests: {lc?.lc_contest}</p>
        <p className="text-gray-300">Questions: {lc?.lc_questionNo}</p>
      </div>

      {/* Ratings Section */}
      <div className="mt-16 w-[100vw] max-w-7xl px-4">
        <h2 className="text-center text-2xl font-bold text-gray-200 mb-6">
          Ratings
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-800/60 p-6 rounded-lg border border-gray-700">
            <p className="font-semibold text-indigo-400 mb-2">Codeforces</p>
            <p>Handle: {cf?.cf_url}</p>
            <p>Current Rating: {cf?.cf_currentrating}</p>
            <p>Max Rating: {cf?.cf_maxrating}</p>
          </div>
          <div className="bg-gray-800/60 p-6 rounded-lg border border-gray-700">
            <p className="font-semibold text-orange-400 mb-2">CodeChef</p>
            <p>Handle: {cc?.cc_url}</p>
            <p>Current Rating: {cc?.cc_currentrating}</p>
            <p>Max Rating: {cc?.cc_maxrating}</p>
          </div>
          <div className="bg-gray-800/60 p-6 rounded-lg border border-gray-700">
            <p className="font-semibold text-yellow-400 mb-2">LeetCode</p>
            <p>Username: {lc?.lc_url}</p>
            <p>Current Rating: {lc?.lc_currentrating}</p>
            <p>Max Rating: {lc?.lc_maxrating}</p>
          </div>
        </div>
      </div>

      {/* CoderHub Score */}
      <div className="mt-16 w-[100vw] max-w-7xl px-4">
        <h2 className="text-center text-2xl font-bold text-gray-200 mb-4">
          CoderHub Score
        </h2>
        <div className="w-full bg-gray-700 rounded-full h-8 flex overflow-hidden border border-gray-600">
          <div
            className="bg-indigo-500 h-8 flex items-center justify-center text-sm font-semibold"
            style={{
              width: `${((cf?.cf_points || 0) / totalPoints) * 100}%`,
            }}
          >
            {cf?.cf_points}
          </div>
          <div
            className="bg-orange-500 h-8 flex items-center justify-center text-sm font-semibold"
            style={{
              width: `${((cc?.cc_points || 0) / totalPoints) * 100}%`,
            }}
          >
            {cc?.cc_points}
          </div>
          <div
            className="bg-yellow-400 h-8 flex items-center justify-center text-sm font-semibold text-gray-800"
            style={{
              width: `${((lc?.lc_points || 0) / totalPoints) * 100}%`,
            }}
          >
            {lc?.lc_points}
          </div>
        </div>
        <p className="text-center mt-3 text-gray-400">
          Total Points: {totalPoints}
        </p>
      </div>
    </div>
  );
}
