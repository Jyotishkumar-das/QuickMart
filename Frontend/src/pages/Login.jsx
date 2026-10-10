
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const navigate = useNavigate();
    const API_URL = "http://localhost:5000/api";

    const sendOtp = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!/^\d{10}$/.test(phone)) {
            setError("Enter a valid 10-digit mobile number.");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(`${API_URL}/auth/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to send OTP.");
            }

            setOtpSent(true);
            setMessage(
                data.message || "OTP requested. Check your backend terminal if using development OTP."
            );
        } catch (err) {
            setError(err.message || "Unable to connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!/^\d{6}$/.test(otp)) {
            setError("Enter the 6-digit OTP.");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(`${API_URL}/auth/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, otp }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "OTP verification failed.");
            }

            const token = data.token || data.accessToken;

            if (!token) {
                throw new Error(
                    "Login response has no token. Check your backend verify-OTP response."
                );
            }

            localStorage.setItem("token", token);

            if (data.user) {
                localStorage.setItem("user", JSON.stringify(data.user));
            }

            setMessage("Login successful!");
            navigate("/orders");
        } catch (err) {
            setError(err.message || "Login failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
                <h1 className="mb-2 text-center text-3xl font-bold text-green-600">
                    🛒 QuickMart
                </h1>

                <h2 className="mb-6 text-center text-xl font-semibold text-gray-800">
                    Login with Mobile
                </h2>

                {error && (
                    <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                        {error}
                    </p>
                )}

                {message && (
                    <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                        {message}
                    </p>
                )}

                {!otpSent ? (
                    <form onSubmit={sendOtp}>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Mobile Number
                        </label>

                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) =>
                                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                            }
                            placeholder="Enter 10-digit mobile number"
                            maxLength={10}
                            required
                            className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-500"
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                        >
                            {loading ? "Please wait..." : "Send OTP"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={verifyOtp}>
                        <p className="mb-4 text-sm text-gray-600">
                            OTP requested for {phone}. If using development OTP, check your
                            backend terminal.
                        </p>

                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Enter OTP
                        </label>

                        <input
                            type="text"
                            inputMode="numeric"
                            value={otp}
                            onChange={(e) =>
                                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                            }
                            placeholder="Enter 6-digit OTP"
                            maxLength={6}
                            required
                            className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-500"
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                        >
                            {loading ? "Verifying..." : "Verify OTP & Login"}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setOtpSent(false);
                                setOtp("");
                                setError("");
                                setMessage("");
                            }}
                            className="mt-3 w-full text-sm text-green-700 hover:underline"
                        >
                            Change mobile number
                        </button>
                    </form>
                )}

                <p className="mt-6 text-center text-sm text-gray-600">
                    <Link to="/" className="font-medium text-green-600 hover:underline">
                        Back to Home
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
