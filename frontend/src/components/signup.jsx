import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { backendUrl } from "../config";


export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(`${backendUrl}/user/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        // store token + profile info if backend returns them
        if (data.token) {
          localStorage.setItem("token", data.token);
          if (data.name) localStorage.setItem("name", data.name);
          if (data.avatar) localStorage.setItem("avatar", data.avatar);
          if (data.points) localStorage.setItem("points", data.points);
          // notify same-tab listeners (Navbar) and navigate to root
          window.dispatchEvent(new Event("auth"));
          navigate("/", { replace: true });
          return;
        }

        if (data.message && data.message.toLowerCase().includes("you are logged in")) {
          setSuccess(data.message || "Signup successful");
          window.dispatchEvent(new Event("auth"));
          navigate("/", { replace: true });
          return;
        }

        setSuccess(data.message || "Signup successful");
        // fallback: redirect to signin if no token returned
        navigate("/signin", { replace: true });
      } else {
        const msg = data.message || "Signup failed";
        setError(msg);
      }
    } catch (err) {
      setError("Network or server error");
      console.error("signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex min-h-full flex-col justify-center px-6 py-16 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-4xl font-extrabold tracking-tight text-white">
            Create your account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
          <form onSubmit={handleSubmit} className="space-y-8 text-left">
            <div>
              <label htmlFor="name" className="block text-lg font-medium text-gray-100 text-left">
                 Full name
               </label>
               <div className="mt-3">
                 <input
                   id="name"
                   type="text"
                   name="name"
                   required
                   value={name}
                   onChange={(e) => setName(e.target.value)}
                   className="block w-full rounded-lg bg-white/5 px-6 py-4 text-xl text-white placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-500 text-left"
                 />
               </div>
             </div>

             <div>
               <label htmlFor="email" className="block text-lg font-medium text-gray-100 text-left">
                 Email
               </label>
               <div className="mt-3">
                 <input
                   id="email"
                   type="email"
                   name="email"
                   required
                   autoComplete="email"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   className="block w-full rounded-lg bg-white/5 px-6 py-4 text-xl text-white placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-500 text-left"
                 />
               </div>
             </div>

             <div>
               <label htmlFor="password" className="block text-lg font-medium text-gray-100 text-left">
                 Password
               </label>
               <div className="mt-3">
                 <input
                   id="password"
                   type="password"
                   name="password"
                   required
                   autoComplete="new-password"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   className="block w-full rounded-lg bg-white/5 px-6 py-4 text-xl text-white placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-500 text-left"
                 />
               </div>
             </div>

             {error && <div className="text-red-400 text-center">{error}</div>}
             {success && <div className="text-green-400 text-center">{success}</div>}

             <div>
               <button
                 type="submit"
                 disabled={loading}
                 className="flex w-full justify-center rounded-lg bg-indigo-500 px-8 py-4 text-xl font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
               >
                 {loading ? "Creating account..." : "Create account"}
               </button>
             </div>
           </form>
         </div>
       </div>
     </div>
   );
}
