import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

const API_URL = "https://quickmart-api-b27r.onrender.com/api";

const Cart = () => {
    const {
        cartItems,
        cartTotal,
        updateQuantity,
        removeFromCart,
        clearCart,
    } = useCart();

    const navigate = useNavigate();

    const [showCheckout, setShowCheckout] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("COD");

    const [address, setAddress] = useState({
        name: "",
        phone: "",
        addressLine: "",
        city: "",
        state: "",
        pincode: "",
    });

    const deliveryFee = cartTotal >= 500 ? 0 : 30;
    const grandTotal = cartTotal + deliveryFee;

    const handleAddressChange = (e) => {
        const { name, value } = e.target;

        setAddress((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // Load Razorpay Checkout script
    const loadRazorpay = () =>
        new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }

            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;

            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);

            document.body.appendChild(script);
        });

    const placeOrder = async (e) => {
        e.preventDefault();
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        if (cartItems.length === 0) {
            setError("Your cart is empty.");
            return;
        }

        if (!/^\d{10}$/.test(address.phone)) {
            setError("Enter a valid 10-digit mobile number.");
            return;
        }

        if (!/^\d{6}$/.test(address.pincode)) {
            setError("Enter a valid 6-digit PIN code.");
            return;
        }

        setLoading(true);

        try {
            // Step 1: Create the QuickMart order on the backend
            const orderResponse = await fetch(`${API_URL}/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    items: cartItems.map((item) => ({
                        product: item._id,
                        quantity: item.quantity,
                    })),
                    shippingAddress: address,
                    paymentMethod,
                }),
            });

            const orderData = await orderResponse.json();

            if (!orderResponse.ok) {
                if (orderResponse.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/login");
                    return;
                }

                throw new Error(
                    orderData.message || "Unable to create order."
                );
            }

            const order = orderData.order || orderData;
            const quickmartOrderId = order._id;

            if (!quickmartOrderId) {
                throw new Error("The server did not return an order ID.");
            }

            // COD: no Razorpay payment required
            if (paymentMethod === "COD") {
                clearCart();

                navigate(`/track-order/${quickmartOrderId}`, {
                    state: {
                        order,
                        message: "Your order was placed successfully!",
                    },
                });

                return;
            }

            // ONLINE: Load Razorpay Checkout
            const scriptLoaded = await loadRazorpay();

            if (!scriptLoaded) {
                throw new Error(
                    "Unable to load Razorpay Checkout. Check your internet connection."
                );
            }

            // Step 2: Create a Razorpay order using the saved QuickMart order
            const paymentOrderResponse = await fetch(
                `${API_URL}/payments/create-order`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        orderId: quickmartOrderId,
                    }),
                }
            );

            const paymentOrderData = await paymentOrderResponse.json();

            if (!paymentOrderResponse.ok) {
                throw new Error(
                    paymentOrderData.message ||
                    "Unable to start Razorpay payment."
                );
            }

            // Step 3: Open Razorpay Checkout
            const options = {
                key: paymentOrderData.keyId,
                amount: paymentOrderData.amount,
                currency: paymentOrderData.currency || "INR",
                name: "QuickMart",
                description: "Grocery order payment",
                order_id: paymentOrderData.razorpayOrderId,

                prefill: {
                    name: address.name,
                    contact: address.phone,
                },

                notes: {
                    quickmartOrderId,
                },

                theme: {
                    color: "#16a34a",
                },

                modal: {
                    ondismiss: () => {
                        setLoading(false);
                        setError(
                            "Payment was not completed. Your order may remain pending; you can retry payment."
                        );
                    },
                },

                // Step 4: Verify the payment signature on the backend
                handler: async (paymentResponse) => {
                    try {
                        const verifyResponse = await fetch(
                            `${API_URL}/payments/verify`,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({
                                    orderId: quickmartOrderId,
                                    razorpay_order_id:
                                        paymentResponse.razorpay_order_id,
                                    razorpay_payment_id:
                                        paymentResponse.razorpay_payment_id,
                                    razorpay_signature:
                                        paymentResponse.razorpay_signature,
                                }),
                            }
                        );

                        const verifyData = await verifyResponse.json();

                        if (!verifyResponse.ok) {
                            throw new Error(
                                verifyData.message ||
                                "Payment verification failed."
                            );
                        }

                        clearCart();

                        navigate(`/track-order/${quickmartOrderId}`, {
                            state: {
                                order: {
                                    ...order,
                                    paymentStatus: "Paid",
                                },
                                message: "Payment successful! Your order is confirmed.",
                            },
                        });
                    } catch (verificationError) {
                        setError(
                            verificationError.message ||
                            "Payment verification failed. Please contact support before retrying."
                        );
                    } finally {
                        setLoading(false);
                    }
                },
            };

            const razorpay = new window.Razorpay(options);

            razorpay.on("payment.failed", (response) => {
                setError(
                    response.error?.description ||
                    "Payment failed. Please try again."
                );
                setLoading(false);
            });

            razorpay.open();
        } catch (err) {
            setError(
                err.message || "Unable to place your order. Please try again."
            );
            setLoading(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-16 text-center">
                <div className="mb-4 text-6xl">🛒</div>

                <h2 className="text-2xl font-bold">Your cart is empty</h2>

                <p className="mt-2 text-gray-500">
                    Add some fresh products to your cart.
                </p>

                <Link
                    to="/"
                    className="mt-6 inline-block rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
                >
                    Continue Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-10">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-3xl font-bold">Shopping Cart</h1>

                <button
                    type="button"
                    onClick={clearCart}
                    className="text-sm font-semibold text-red-600 hover:text-red-700"
                >
                    Clear Cart
                </button>
            </div>

            {error && (
                <div
                    role="alert"
                    className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-700"
                >
                    {error}
                </div>
            )}

            <div className="grid gap-8 md:grid-cols-3">
                {/* CART ITEMS */}
                <div className="space-y-4 md:col-span-2">
                    {cartItems.map((item) => {
                        const price = item.discountPrice ?? item.price;

                        return (
                            <div
                                key={item._id}
                                className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center"
                            >
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="h-24 w-24 rounded-lg bg-gray-100 object-contain"
                                />

                                <div className="flex-1">
                                    <h3 className="font-semibold">
                                        {item.name}
                                    </h3>

                                    <p className="mt-1 text-gray-500">
                                        ₹{price} each
                                    </p>

                                    <p className="mt-1 font-bold">
                                        Subtotal: ₹{price * item.quantity}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            updateQuantity(
                                                item._id,
                                                item.quantity - 1
                                            )
                                        }
                                        disabled={item.quantity <= 1}
                                        className="h-9 w-9 rounded border disabled:opacity-40"
                                    >
                                        −
                                    </button>

                                    <span className="min-w-5 text-center">
                                        {item.quantity}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            updateQuantity(
                                                item._id,
                                                item.quantity + 1
                                            )
                                        }
                                        disabled={item.quantity >= item.stock}
                                        className="h-9 w-9 rounded border disabled:opacity-40"
                                    >
                                        +
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => removeFromCart(item._id)}
                                        className="ml-2 text-sm font-semibold text-red-600"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ORDER SUMMARY */}
                <div className="h-fit rounded-xl bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-bold">Order Summary</h2>

                    <div className="mt-5 flex justify-between">
                        <span>
                            Items (
                            {cartItems.reduce(
                                (sum, item) => sum + item.quantity,
                                0
                            )}
                            )
                        </span>
                        <span>₹{cartTotal}</span>
                    </div>

                    <div className="mt-3 flex justify-between">
                        <span>Delivery fee</span>
                        <span>
                            {deliveryFee === 0
                                ? "FREE"
                                : `₹${deliveryFee}`}
                        </span>
                    </div>

                    <div className="mt-4 flex justify-between border-t pt-4 text-lg font-bold">
                        <span>Total</span>
                        <span>₹{grandTotal}</span>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setError("");

                            if (!localStorage.getItem("token")) {
                                navigate("/login");
                                return;
                            }

                            setShowCheckout(true);
                        }}
                        className="mt-6 w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700"
                    >
                        Proceed to Checkout
                    </button>

                    <Link
                        to="/"
                        className="mt-4 block text-center text-sm text-green-700"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>

            {/* CHECKOUT FORM */}
            {showCheckout && (
                <div className="mt-10 rounded-xl bg-white p-6 shadow-sm">
                    <h2 className="mb-2 text-2xl font-bold">
                        Delivery Details
                    </h2>

                    <p className="mb-6 text-sm text-gray-500">
                        Enter your delivery address and confirm your order.
                    </p>

                    <form onSubmit={placeOrder}>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <input
                                name="name"
                                value={address.name}
                                onChange={handleAddressChange}
                                placeholder="Full name"
                                autoComplete="name"
                                required
                                maxLength={100}
                                className="rounded-lg border p-3"
                            />

                            <input
                                name="phone"
                                type="tel"
                                inputMode="numeric"
                                value={address.phone}
                                onChange={(e) =>
                                    setAddress((previous) => ({
                                        ...previous,
                                        phone: e.target.value
                                            .replace(/\D/g, "")
                                            .slice(0, 10),
                                    }))
                                }
                                placeholder="10-digit mobile number"
                                autoComplete="tel"
                                required
                                maxLength={10}
                                className="rounded-lg border p-3"
                            />

                            <input
                                name="addressLine"
                                value={address.addressLine}
                                onChange={handleAddressChange}
                                placeholder="House number, street, area"
                                autoComplete="street-address"
                                required
                                maxLength={250}
                                className="rounded-lg border p-3 sm:col-span-2"
                            />

                            <input
                                name="city"
                                value={address.city}
                                onChange={handleAddressChange}
                                placeholder="City"
                                autoComplete="address-level2"
                                required
                                maxLength={100}
                                className="rounded-lg border p-3"
                            />

                            <input
                                name="state"
                                value={address.state}
                                onChange={handleAddressChange}
                                placeholder="State"
                                autoComplete="address-level1"
                                required
                                maxLength={100}
                                className="rounded-lg border p-3"
                            />

                            <input
                                name="pincode"
                                value={address.pincode}
                                onChange={(e) =>
                                    setAddress((previous) => ({
                                        ...previous,
                                        pincode: e.target.value
                                            .replace(/\D/g, "")
                                            .slice(0, 6),
                                    }))
                                }
                                placeholder="6-digit PIN code"
                                inputMode="numeric"
                                autoComplete="postal-code"
                                required
                                maxLength={6}
                                className="rounded-lg border p-3"
                            />
                        </div>

                        {/* PAYMENT METHOD */}
                        <div className="mt-6 rounded-lg bg-gray-50 p-4">
                            <p className="font-semibold">Payment Method</p>

                            <label className="mt-4 flex cursor-pointer items-center gap-3">
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="COD"
                                    checked={paymentMethod === "COD"}
                                    onChange={(e) =>
                                        setPaymentMethod(e.target.value)
                                    }
                                />
                                <span>💵 Cash on Delivery (COD)</span>
                            </label>

                            <label className="mt-4 flex cursor-pointer items-center gap-3">
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="ONLINE"
                                    checked={paymentMethod === "ONLINE"}
                                    onChange={(e) =>
                                        setPaymentMethod(e.target.value)
                                    }
                                />
                                <span>
                                    💳 Pay Online using Razorpay (Test Mode)
                                </span>
                            </label>

                            <p className="mt-4 text-lg font-bold">
                                Order Total: ₹{grandTotal}
                            </p>

                            {paymentMethod === "ONLINE" && (
                                <p className="mt-2 text-sm text-gray-600">
                                    Razorpay test checkout will open after you
                                    place the order. No real payment should be
                                    collected in test mode.
                                </p>
                            )}
                        </div>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading
                                    ? "Processing..."
                                    : paymentMethod === "ONLINE"
                                        ? `Pay ₹${grandTotal} with Razorpay`
                                        : `Place Order · ₹${grandTotal}`}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowCheckout(false);
                                    setError("");
                                }}
                                disabled={loading}
                                className="rounded-lg border px-5 py-3 font-semibold disabled:opacity-60"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Cart;