import { useEffect, useState } from "react";
import { backendUrl } from "../config";

export default function Profile() {
  const [cf, setCf] = useState("");
  const [cc, setCc] = useState("");
  const [lc, setLc] = useState("");
  

  const [loading, setLoading] = useState({ cf: false, cc: false, lc: false });
  const [status, setStatus] = useState({ cf: "", cc: "", lc: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/"; // redirect to signin if not authenticated
    }
  }, []);

  const postHandle = async (endpoint, body) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${backendUrl}/url/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: token,
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, body: json };
  };

  const submitCF = async () => {
    setError("");
    if (!cf) { setError("Enter Codeforces handle."); return; }
    setLoading(l => ({ ...l, cf: true }));
    try {
      const r = await postHandle("cfurl", { cf_url: cf });
      setStatus(s => ({ ...s, cf: r.ok ? (r.body.msg || "CF added") : (r.body.msg || "CF error") }));
    } catch (e) {
      console.error(e);
      setStatus(s => ({ ...s, cf: "Network error" }));
    } finally {
      setLoading(l => ({ ...l, cf: false }));
    }
  };

  const submitCC = async () => {
    setError("");
    if (!cc) { setError("Enter CodeChef handle."); return; }
    setLoading(l => ({ ...l, cc: true }));
    try {
      const r = await postHandle("ccurl", { cc_url: cc });
      setStatus(s => ({ ...s, cc: r.ok ? (r.body.msg || "CC added") : (r.body.msg || "CC error") }));
    } catch (e) {
      console.error(e);
      setStatus(s => ({ ...s, cc: "Network error" }));
    } finally {
      setLoading(l => ({ ...l, cc: false }));
    }
  };

  const submitLC = async () => {
    setError("");
    if (!lc) { setError("Enter LeetCode username."); return; }
    setLoading(l => ({ ...l, lc: true }));
    try {
      const r = await postHandle("lcurl", { lc_url: lc });
      setStatus(s => ({ ...s, lc: r.ok ? (r.body.msg || "LC added") : (r.body.msg || "LC error") }));
    } catch (e) {
      console.error(e);
      setStatus(s => ({ ...s, lc: "Network error" }));
    } finally {
      setLoading(l => ({ ...l, lc: false }));
    }
  };

  return (
    <div className="flex">
      <div className="w-full max-w-2xl bg-gray-800/50 backdrop-blur-sm border border-white/6 rounded-2xl p-10 shadow-xl">
        <h1 className="text-3xl font-extrabold text-white text-center mb-3">Add / Update Profiles</h1>
        <br />
        <div className="space-y-6 text-left">
          <div>
            <label htmlFor="cf" className="block text-sm font-medium text-gray-200">Codeforces handle</label>
            <div className="mt-3 flex gap-3">
              <input
                id="cf"
                value={cf}
                onChange={(e) => setCf(e.target.value)}
                placeholder="e.g. tourist"
                className="flex-1 rounded-lg bg-white/5 px-4 py-3 text-lg text-white placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-500"
              />
              <button
                onClick={submitCF}
                disabled={loading.cf}
                className="inline-flex items-center justify-center rounded-lg bg-indigo-500 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
              >
                {loading.cf ? "Saving..." : "Save CF"}
              </button>
            </div>
            {status.cf && <div className="mt-2 text-sm text-green-300">{status.cf}</div>}
          </div>

          <div>
            <label htmlFor="cc" className="block text-sm font-medium text-gray-200">CodeChef handle</label>
            <div className="mt-3 flex gap-3">
              <input
                id="cc"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="e.g. neal"
                className="flex-1 rounded-lg bg-white/5 px-4 py-3 text-lg text-white placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-500"
              />
              <button
                onClick={submitCC}
                disabled={loading.cc}
                className="inline-flex items-center justify-center rounded-lg bg-indigo-500 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
              >
                {loading.cc ? "Saving..." : "Save CC"}
              </button>
            </div>
            {status.cc && <div className="mt-2 text-sm text-green-300">{status.cc}</div>}
          </div>

          <div>
            <label htmlFor="lc" className="block text-sm font-medium text-gray-200">LeetCode username</label>
            <div className="mt-3 flex gap-3">
              <input
                id="lc"
                value={lc}
                onChange={(e) => setLc(e.target.value)}
                placeholder="e.g. leetcode_user"
                className="flex-1 rounded-lg bg-white/5 px-4 py-3 text-lg text-white placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-500"
              />
              <button
                onClick={submitLC}
                disabled={loading.lc}
                className="inline-flex items-center justify-center rounded-lg bg-indigo-500 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
              >
                {loading.lc ? "Saving..." : "Save LC"}
              </button>
            </div>
            {status.lc && <div className="mt-2 text-sm text-green-300">{status.lc}</div>}
          </div>

          {error && <div className="text-sm text-red-400">{error}</div>}

        </div>
    </div>
    </div>
  );
}