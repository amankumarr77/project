import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { backendUrl } from "../config"

export default function Signin() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const res = await fetch(`${backendUrl}/user/signin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            })

            const data = await res.json().catch(() => ({}))

            if (!res.ok) {
                setError(data.message || "Signin failed")
                setLoading(false)
                return
            }
            if (data.token) {
                localStorage.setItem("token", data.token)
                // notify other same-tab listeners (Navbar) to update immediately
                window.dispatchEvent(new Event("auth"))
                // navigate to landing/dashboard
                navigate("/", { replace: true })
            } else {
                setError("SIGNIN FAILED")
            }   
        } catch (err) {
            setError("SIGNIN FAILED")
        } finally {
            setLoading(false)
        }
    }

    return <div>
        <div className="flex min-h-full flex-col justify-center px-6 py-16 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-4xl font-extrabold tracking-tight text-white">Sign in to your account</h2>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div>
                        <div className="flex items-center justify-between">
                        <label htmlFor="email" className="block text-lg font-medium text-gray-100">Email</label>
                        </div>
                        <div className="mt-3">
                            <input id="email" type="email" name="email" required autoComplete="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="block w-full rounded-lg bg-white/5 px-6 py-4 text-xl text-white placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-500" />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="password" className="block text-lg font-medium text-gray-100">Password</label>
                        </div>
                        <div className="mt-3">
                            <input id="password" type="password" name="password" required autoComplete="current-password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="block w-full rounded-lg bg-white/5 px-6 py-4 text-xl text-white placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-500" />
                        </div>
                    </div>

                    {error && <div className="text-red-400 text-center">{error}</div>}

                    <div>
                        <button type="submit" disabled={loading}
                            className="flex w-full justify-center rounded-lg bg-indigo-500 px-8 py-4 text-xl font-semibold text-white hover:bg-indigo-400 disabled:opacity-60">
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                    </div>
                </form>

                <p className="mt-8 text-center text-lg text-gray-400">
                    
                    <Link to="/signup" className="ml-2 font-semibold text-indigo-400 hover:text-indigo-300">Dont Have An Account?</Link>
                </p>
            </div>
        </div>
    </div>
}


