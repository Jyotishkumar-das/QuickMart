import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = "https://quickmart-api-b27r.onrender.com/api";

const AdminLogin = () => {
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const navigate = useNavigate();

    const sendOtp = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!/^[6-9]\d{9}$/.test(phone)) {
            setError("Enter a valid 10-digit Indian mobile number.");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                `${API_URL}/auth/send-otp`,
                { phone }
            );

            setOtpSent(true);
            setMessage(response.data.message || "OTP sent successfully.");
        } catch (err) {
            setError(
                err.response?.data?.message || "Unable to send OTP."
            );
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!otp.trim()) {
            setError("Enter the OTP.");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                `${API_URL}/auth/verify-otp`,
                { phone, otp }
            );

            const data = response.data;
            const token =
                data.token || data.accessToken || data.data?.token;
            const user = data.user || data.data?.user;

            if (!token) {
                setError(
                    "OTP response did not include a token. Check otpController.js response format."
                );
                return;
            }

            if (user?.role !== "admin") {
                setError(
                    `This account is not an admin account. ${user?.role ? `Current role: ${user.role}.` : "User role was not returned."
                    }`
                );
                return;
            }

            localStorage.setItem("token", token);
            navigate("/admin");
        } catch (err) {
            setError(
                err.response?.data?.message || "OTP verification failed."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
            <form
                onSubmit={otpSent ? verifyOtp : sendOtp}
                className="w-full max-w-md rounded-2xl bg-white p-8 shadow"
            >
                <h1 className="mb-2 text-2xl font-bold text-green-700">
                    QuickMart Admin Login
                </h1>

                <p className="mb-6 text-sm text-gray-500">
                    Verify your registered admin mobile number with OTP.
                </p>

                {error && (
                    <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">
                        {error}
                    </p>
                )}

                {message && (
                    <p className="mb-4 rounded-lg bg-green-50 p-3 text-green-700">
                        {message}
                    </p>
                )}

                <label className="mb-2 block font-medium">
                    Phone Number
                </label>

                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={otpSent || loading}
                    required
                    maxLength={10}
                    className="mb-5 w-full rounded-lg border p-3"
                    placeholder="10-digit mobile number"
                />

                {otpSent && (
                    <>
                        <label className="mb-2 block font-medium">OTP</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            value={otp}
                            onChange={(e) =>
                                setOtp(e.target.value.replace(/\D/g, ""))
                            }
                            required
                            maxLength={6}
                            className="mb-5 w-full rounded-lg border p-3"
                            placeholder="Enter OTP"
                        />
                    </>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-green-700 p-3 font-bold text-white disabled:opacity-50"
                >
                    {loading
                        ? "Please wait..."
                        : otpSent
                            ? "Verify OTP & Login"
                            : "Send OTP"}
                </button>

                {otpSent && (
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => {
                            setOtpSent(false);
                            setOtp("");
                            setMessage("");
                            setError("");
                        }}
                        className="mt-3 w-full rounded-lg border p-3"
                    >
                        Change Phone Number
                    </button>
                )}
            </form>
        </main>
    );
};

export default AdminLogin;