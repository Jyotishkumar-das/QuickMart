import React from "react";

const App = () => {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <div className="shrink-0">
            <h1 className="text-2xl font-bold text-green-600">
              🛒 QuickMart
            </h1>
          </div>

          {/* Location */}
          <div className="hidden md:block">
            <p className="text-xs text-gray-500">Deliver to</p>
            <p className="font-semibold text-gray-800">
              📍 Your Location
            </p>
          </div>

          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search for products..."
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Login */}
          <button className="hidden rounded-lg px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-100 sm:block">
            Login
          </button>

          {/* Cart */}
          <button className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700">
            🛒 <span className="hidden sm:inline">Cart</span>
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-green-100 px-6 py-12 sm:px-10 lg:px-16">
          <div className="max-w-2xl">
            <p className="mb-3 font-semibold text-green-600">
              QUICK DELIVERY ⚡
            </p>

            <h2 className="text-4xl font-bold leading-tight text-gray-900 sm:text-5xl">
              Groceries delivered fast
            </h2>

            <p className="mt-4 text-base text-gray-600 sm:text-lg">
              Fresh groceries and daily essentials delivered to your
              doorstep in minutes.
            </p>

            <button className="mt-6 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700">
              Shop Now
            </button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <h2 className="mb-5 text-2xl font-bold text-gray-900">
          Shop by Category
        </h2>

        <div className="flex gap-4 overflow-x-auto pb-3">
          <button className="min-w-32 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="text-3xl">🍎</div>
            <p className="mt-2 text-sm font-medium">Fruits</p>
          </button>

          <button className="min-w-32 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="text-3xl">🥛</div>
            <p className="mt-2 text-sm font-medium">Dairy</p>
          </button>

          <button className="min-w-32 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="text-3xl">🍪</div>
            <p className="mt-2 text-sm font-medium">Snacks</p>
          </button>

          <button className="min-w-32 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="text-3xl">🥤</div>
            <p className="mt-2 text-sm font-medium">Beverages</p>
          </button>

          <button className="min-w-32 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="text-3xl">🧴</div>
            <p className="mt-2 text-sm font-medium">Personal Care</p>
          </button>

          <button className="min-w-32 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="text-3xl">🏠</div>
            <p className="mt-2 text-sm font-medium">Household</p>
          </button>
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <h2 className="mb-5 text-2xl font-bold text-gray-900">
          Popular Products
        </h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex h-40 items-center justify-center rounded-lg bg-gray-100 text-5xl">
              🥛
            </div>

            <h3 className="mt-3 font-semibold">Fresh Milk</h3>
            <p className="mt-1 text-sm text-gray-500">500 ml</p>

            <div className="mt-3 flex items-center justify-between">
              <span className="font-bold">₹35</span>

              <button className="rounded-lg border border-green-600 px-3 py-1 text-sm font-semibold text-green-600 hover:bg-green-600 hover:text-white">
                ADD
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex h-40 items-center justify-center rounded-lg bg-gray-100 text-5xl">
              🍎
            </div>

            <h3 className="mt-3 font-semibold">Fresh Apples</h3>
            <p className="mt-1 text-sm text-gray-500">1 kg</p>

            <div className="mt-3 flex items-center justify-between">
              <span className="font-bold">₹120</span>

              <button className="rounded-lg border border-green-600 px-3 py-1 text-sm font-semibold text-green-600 hover:bg-green-600 hover:text-white">
                ADD
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex h-40 items-center justify-center rounded-lg bg-gray-100 text-5xl">
              🍪
            </div>

            <h3 className="mt-3 font-semibold">Cookies</h3>
            <p className="mt-1 text-sm text-gray-500">200 g</p>

            <div className="mt-3 flex items-center justify-between">
              <span className="font-bold">₹80</span>

              <button className="rounded-lg border border-green-600 px-3 py-1 text-sm font-semibold text-green-600 hover:bg-green-600 hover:text-white">
                ADD
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex h-40 items-center justify-center rounded-lg bg-gray-100 text-5xl">
              🥤
            </div>

            <h3 className="mt-3 font-semibold">Cold Drink</h3>
            <p className="mt-1 text-sm text-gray-500">750 ml</p>

            <div className="mt-3 flex items-center justify-between">
              <span className="font-bold">₹50</span>

              <button className="rounded-lg border border-green-600 px-3 py-1 text-sm font-semibold text-green-600 hover:bg-green-600 hover:text-white">
                ADD
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default App;