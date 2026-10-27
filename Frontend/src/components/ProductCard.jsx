import React from "react";
import { useCart } from "../context/CartContext";

const ProductCard = ({ product }) => {
  const { addToCart, cartItems } = useCart();

  const displayPrice = product.discountPrice ?? product.price;

  const cartItem = cartItems.find(
    (item) => item._id === product._id
  );

  const quantity = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = product.stock <= 0;

  const isDiscounted =
    product.discountPrice != null &&
    product.discountPrice < product.price;

  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">

      {/* Product Image */}
      <div className="relative flex h-48 items-center justify-center overflow-hidden bg-white p-3 sm:h-52">

        {isDiscounted && (
          <span className="absolute left-3 top-3 z-10 rounded-md bg-green-700 px-2 py-1 text-xs font-bold text-white">
            SALE
          </span>
        )}

        <img
          src={product.image}
          alt={product.name || "Grocery product"}
          loading="lazy"
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src =
              "https://placehold.co/600x450/f3f4f6/6b7280?text=Image+Unavailable";
          }}
        />

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/75">
            <span className="rounded-md bg-gray-900 px-3 py-2 text-xs font-bold text-white">
              OUT OF STOCK
            </span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4">

        <p className="mb-1 text-xs font-medium text-green-700">
          {product.brand || "QuickMart"}
        </p>

        <h3
          className="min-h-10 line-clamp-2 text-sm font-semibold text-gray-900 sm:text-base"
          title={product.name}
        >
          {product.name}
        </h3>

        <p className="mt-1 text-xs text-gray-500">
          {product.unit || "1 unit"}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-base font-extrabold text-gray-900 sm:text-lg">
            ₹{Number(displayPrice).toFixed(2)}
          </span>

          {isDiscounted && (
            <span className="text-xs text-gray-400 line-through">
              ₹{Number(product.price).toFixed(2)}
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={!product.isActive || isOutOfStock}
          onClick={() => addToCart(product)}
          className="mt-4 w-full rounded-lg bg-green-600 px-3 py-3 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isOutOfStock
            ? "OUT OF STOCK"
            : !product.isActive
              ? "UNAVAILABLE"
              : quantity > 0
                ? `ADD MORE(${quantity})`
                : "ADD TO CART"}
        </button>
      </div>
    </article>
  );
};

export default ProductCard;