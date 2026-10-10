import React from "react";
import { useCart } from "../context/CartContext";

const ProductCard = ({ product }) => {
  const { addToCart, cartItems } = useCart();

  const displayPrice = product.discountPrice ?? product.price;

  const cartItem = cartItems.find(
    (item) => item._id === product._id
  );

  const quantity = cartItem ? cartItem.quantity : 0;

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex h-44 items-center justify-center bg-gray-100 p-4">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-contain"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900">
          {product.name}
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          {product.brand || "QuickMart"}
        </p>

        <p className="mt-1 text-sm text-gray-500">
          {product.unit || "1 unit"}
        </p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div>
            <span className="text-lg font-bold text-gray-900">
              ₹{displayPrice}
            </span>

            {product.discountPrice != null &&
              product.discountPrice < product.price && (
                <span className="ml-2 text-sm text-gray-400 line-through">
                  ₹{product.price}
                </span>
              )}
          </div>

          <button
            type="button"
            disabled={!product.isActive || product.stock <= 0}
            onClick={() => addToCart(product)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {product.stock <= 0
              ? "OUT OF STOCK"
              : quantity > 0
                ? `ADDED (${quantity})`
                : "ADD"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;