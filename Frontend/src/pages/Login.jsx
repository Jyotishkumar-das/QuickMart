
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

const API_URL = "https://quickmart-api-b27r.onrender.com/api";

const Login = ({ expectedRole = "customer" }) => {
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [resendSeconds, setResendSeconds] = useState(0);

    const otpRefs = useRef([]);
    const navigate = useNavigate();

    const roleConfig = {
        customer: {
            title: "Customer Login",
            destination: "/",
        },
        admin: {
            title: "Admin Login",
            destination: "/admin",
        },
        delivery: {
            title: "Delivery Partner Login",
            destination: "/delivery-dashboard",
        },
    };

    const config = roleConfig[expectedRole] || roleConfig.customer;

    useEffect(() => {
        if (!otpSent || resendSeconds <= 0) return;

        const timer = setTimeout(() => {
            setResendSeconds((seconds) => seconds - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [otpSent, resendSeconds]);

    const sendOtp = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!/^\d{10}$/.test(phone)) {
            setError("Please enter a valid 10-digit Indian mobile number.");
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

            setOtp("");
            setOtpSent(true);
            setResendSeconds(30);
            setMessage(data.message || "OTP generated successfully.");

            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        } catch (err) {
            setError(err.message || "Unable to connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    const resendOtp = async () => {
        if (resendSeconds > 0 || loading) return;

        setError("");
        setMessage("");

        try {
            setLoading(true);

            const response = await fetch(`${API_URL}/auth/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to resend OTP.");
            }

            setOtp("");
            setResendSeconds(30);
            setMessage(data.message || "A new OTP has been generated.");

            otpRefs.current[0]?.focus();
        } catch (err) {
            setError(err.message || "Unable to resend OTP.");
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!/^\d{6}$/.test(otp)) {
            setError("Please enter the complete 6-digit OTP.");
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
            const user = data.user;

            if (!token || !user) {
                throw new Error("Login response is missing the token or user.");
            }

            if (user.role !== expectedRole) {
                throw new Error(
                    `This account is registered as ${user.role}. Please use the correct login page.`
                );
            }

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            navigate(config.destination, { replace: true });
        } catch (err) {
            setError(err.message || "Login failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (value, index) => {
        const digit = value.replace(/\D/g, "").slice(-1);
        const digits = otp.split("");
        digits[index] = digit;

        setOtp(digits.join("").slice(0, 6));

        if (digit && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }

        if (e.key === "ArrowLeft" && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }

        if (e.key === "ArrowRight" && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();

        const pastedOtp = e.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 6);

        setOtp(pastedOtp);

        const focusIndex = Math.min(pastedOtp.length, 5);
        otpRefs.current[focusIndex]?.focus();
    };

    const changeNumber = () => {
        setOtpSent(false);
        setOtp("");
        setError("");
        setMessage("");
        setResendSeconds(0);
    };

    return (
        <main className="login-page relative flex min-h-screen items-center justify-center px-4 py-10">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(0,130,45,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,130,45,.04) 1px, transparent 1px)",
                    backgroundSize: "34px 34px",
                }}
            />

            <section className="login-card relative z-10 w-full max-w-lg overflow-hidden rounded-[28px] border border-white bg-white">
                <div className="login-header relative overflow-hidden bg-gradient-to-br from-green-800 via-green-700 to-green-600 px-6 py-8 text-center text-white">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 opacity-15"
                        style={{
                            backgroundImage:
                                "radial-gradient(circle at 15% 20%, white 1px, transparent 2px), radial-gradient(circle at 80% 60%, white 1px, transparent 2px)",
                            backgroundSize: "28px 28px",
                        }}
                    />

                    <div className="relative">
                        <div className="mb-2 flex items-center justify-center gap-3">
                            <span className="login-logo text-4xl" aria-hidden="true">
                                🛒
                            </span>

                            <h1 className="text-4xl font-extrabold tracking-tight">
                                QuickMart
                            </h1>
                        </div>

                        <p className="text-sm text-green-50">
                            Fresh groceries, delivered with care.
                        </p>
                    </div>
                </div>

                <div className="px-6 py-8 sm:px-10 sm:py-9">
                    <h2
                        key={otpSent ? "otp-title" : "login-title"}
                        className="login-title mb-2 text-center text-2xl font-bold text-gray-900"
                    >
                        {otpSent ? "Enter Your OTP" : config.title}
                    </h2>

                    <p className="mb-7 text-center text-sm leading-6 text-gray-500">
                        {otpSent
                            ? `Enter the 6-digit verification code for +91 ${phone}.`
                            : "Login or create your account using your mobile number."}
                    </p>

                    {error && (
                        <div
                            role="alert"
                            className="login-message mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                        >
                            {error}
                        </div>
                    )}

                    {message && (
                        <div
                            role="status"
                            className="login-message mb-5 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700"
                        >
                            {message}
                        </div>
                    )}

                    {!otpSent ? (
                        <form onSubmit={sendOtp} className="login-form">
                            <label
                                htmlFor="phone"
                                className="mb-2 block text-sm font-semibold text-gray-800"
                            >
                                Mobile Number
                            </label>

                            <div className="mb-5 flex overflow-hidden rounded-xl border border-green-300 bg-white focus-within:border-green-600 focus-within:ring-4 focus-within:ring-green-100">
                                <div className="flex items-center gap-2 border-r border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-700">
                                    <span aria-hidden="true">🇮🇳</span>
                                    <span>+91</span>
                                </div>

                                <input
                                    id="phone"
                                    type="tel"
                                    inputMode="numeric"
                                    autoComplete="tel-national"
                                    value={phone}
                                    onChange={(e) =>
                                        setPhone(
                                            e.target.value
                                                .replace(/\D/g, "")
                                                .slice(0, 10)
                                        )
                                    }
                                    placeholder="Enter mobile number"
                                    maxLength={10}
                                    required
                                    className="login-input min-w-0 flex-1 bg-transparent px-4 py-4 text-base text-gray-900 outline-none placeholder:text-gray-400"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="login-button w-full rounded-xl bg-green-600 py-4 font-bold text-white shadow-sm"
                            >
                                {loading ? "Please wait..." : "Continue"}
                            </button>
                        </form>
                    ) : (
                        <form
                            onSubmit={verifyOtp}
                            className="otp-screen"
                        >
                            <div className="mb-6 flex justify-center gap-2 sm:gap-3">
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <input
                                        key={index}
                                        ref={(element) => {
                                            otpRefs.current[index] = element;
                                        }}
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete={
                                            index === 0 ? "one-time-code" : "off"
                                        }
                                        aria-label={`OTP digit ${index + 1}`}
                                        value={otp[index] || ""}
                                        onChange={(e) =>
                                            handleOtpChange(
                                                e.target.value,
                                                index
                                            )
                                        }
                                        onKeyDown={(e) =>
                                            handleOtpKeyDown(e, index)
                                        }
                                        onPaste={handleOtpPaste}
                                        maxLength={1}
                                        className="otp-box h-12 w-10 rounded-xl border border-gray-200 bg-gray-50 text-center text-xl font-bold text-gray-900 outline-none sm:h-14 sm:w-12"
                                    />
                                ))}
                            </div>

                            <div className="mb-6 text-center text-sm">
                                {resendSeconds > 0 ? (
                                    <p className="text-gray-500">
                                        Resend OTP in{" "}
                                        <span className="font-semibold text-green-700">
                                            {resendSeconds}s
                                        </span>
                                    </p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={resendOtp}
                                        disabled={loading}
                                        className="font-semibold text-green-700 hover:underline"
                                    >
                                        Resend OTP
                                    </button>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="login-button w-full rounded-xl bg-green-700 py-4 font-bold text-white shadow-sm"
                            >
                                {loading ? "Verifying..." : "Verify Code"}
                            </button>

                            <button
                                type="button"
                                onClick={changeNumber}
                                disabled={loading}
                                className="mt-4 w-full text-sm font-medium text-gray-500 hover:text-green-700"
                            >
                                ← Change mobile number
                            </button>
                        </form>
                    )}

                    <div className="login-links mt-8 flex flex-wrap justify-center gap-x-5 gap-y-3 border-t border-gray-100 pt-6 text-sm">
                        <Link to="/">Home</Link>

                        {expectedRole !== "customer" && (
                            <Link to="/login">Customer Login</Link>
                        )}

                        {expectedRole !== "admin" && (
                            <Link to="/admin-login">Admin Login</Link>
                        )}

                        {expectedRole !== "delivery" && (
                            <Link to="/delivery-login">Delivery Login</Link>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Login;
