import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

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

        try {
            setLoading(true);

            const response = await fetch(
                "http://localhost:5000/api/orders",
                {
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
                        paymentMethod: "COD",
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/login");
                    return;
                }

                throw new Error(data.message || "Unable to place order.");
            }

            // Clear the cart only after the server confirms success.
            clearCart();

            const orderId = data.order?._id || data._id;

            if (orderId) {
                navigate(`/track-order/${orderId}`, {
                    state: {
                        order: data.order || data,
                        message: "Your order was placed successfully!",
                    },
                });
            } else {
                navigate("/orders", {
                    state: {
                        message: "Your order was placed successfully!",
                    },
                });
            }
        } catch (err) {
            setError(
                err.message ||
                "Unable to place your order. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-16 text-center">
                <div className="mb-4 text-6xl">🛒</div>

                <h2 className="text-2xl font-bold">
                    Your cart is empty
                </h2>

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
                <h1 className="text-3xl font-bold">
                    Shopping Cart
                </h1>

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
                    <h2 className="text-xl font-bold">
                        Order Summary
                    </h2>

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
                            {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
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

                        <div className="mt-6 rounded-lg bg-gray-50 p-4">
                            <p className="font-semibold">
                                Payment Method
                            </p>

                            <p className="mt-2 text-gray-700">
                                💵 Cash on Delivery (COD)
                            </p>

                            <p className="mt-3 text-lg font-bold">
                                Order Total: ₹{grandTotal}
                            </p>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading
                                    ? "Placing Order..."
                                    : `Place Order · ₹${grandTotal}`}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowCheckout(false);
                                    setError("");
                                }}
                                disabled={loading}
                                className="rounded-lg border px-5 py-3 font-semibold"
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
