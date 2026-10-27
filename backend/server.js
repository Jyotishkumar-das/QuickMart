
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

dotenv.config();

const connectDB = require("./config/db");
const Order = require("./models/Order");
const DeliveryPartner = require("./models/DeliveryPartner");
const registerTrackingSocket = require("./sockets/trackingSocket");

const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= DATABASE =================
connectDB();

// ================= API ROUTES =================
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));

app.use(
  "/api/delivery-partners",
  require("./routes/deliveryPartnerRoutes")
);

app.use("/api/delivery", require("./routes/deliveryRoutes"));

app.use("/api/payments", require("./routes/paymentRoutes"));

// ================= TEST ROUTE =================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "QuickMart Backend is running",
  });
});

// ================= HTTP SERVER =================
const server = http.createServer(app);

// ================= SOCKET.IO =================
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

// Allow controllers to access Socket.IO.
app.set("io", io);

// ================= SOCKET JWT AUTH =================
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing from .env");
      return next(new Error("Server authentication is not configured"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.userId || !decoded.role) {
      return next(new Error("Invalid token payload"));
    }

    socket.user = decoded;
    return next();
  } catch (error) {
    console.error("Socket authentication failed:", error.message);
    return next(new Error("Invalid or expired token"));
  }
});

// ================= SOCKET CONNECTION =================
io.on("connection", (socket) => {
  const userId = String(socket.user.userId);
  const role = socket.user.role;

  console.log("Socket connected:", socket.id);
  console.log("Authenticated user:", userId);
  console.log("User role:", role);

  registerTrackingSocket(io, socket);

  // ================= JOIN ORDER ROOM =================
  socket.on("joinOrderRoom", async (orderId) => {
    try {
      if (!orderId) {
        return socket.emit("orderRoomError", {
          success: false,
          message: "Order ID is required",
        });
      }

      if (!["customer", "delivery", "admin"].includes(role)) {
        return socket.emit("orderRoomError", {
          success: false,
          message: "Invalid user role",
        });
      }

      if (!/^[a-f\d]{24}$/i.test(String(orderId))) {
        return socket.emit("orderRoomError", {
          success: false,
          message: "Invalid order ID",
        });
      }

      const order = await Order.findById(orderId);

      if (!order) {
        return socket.emit("orderRoomError", {
          success: false,
          message: "Order not found",
        });
      }

      // Customers can track only their own orders.
      if (role === "customer") {
        if (!order.user || String(order.user) !== userId) {
          return socket.emit("orderRoomError", {
            success: false,
            message: "You are not authorized to track this order",
          });
        }
      }

      // Delivery partners can track only assigned orders.
      if (role === "delivery") {
        const partner = await DeliveryPartner.findOne({
          user: userId,
          isActive: true,
        }).select("_id");

        if (!partner) {
          return socket.emit("orderRoomError", {
            success: false,
            message: "Delivery partner profile not found",
          });
        }

        if (
          !order.deliveryPartner ||
          String(order.deliveryPartner) !== String(partner._id)
        ) {
          return socket.emit("orderRoomError", {
            success: false,
            message: "This order is not assigned to you",
          });
        }
      }

      const roomName = `order_${orderId}`;

      await socket.join(roomName);

      console.log(`${userId} joined room ${roomName}`);

      return socket.emit("joinedOrderRoom", {
        success: true,
        orderId: String(orderId),
        room: roomName,
        message: "Joined order tracking room",
      });
    } catch (error) {
      console.error("Join order room error:", error.message);

      return socket.emit("orderRoomError", {
        success: false,
        message: "Failed to join order tracking room",
      });
    }
  });

  // ================= LEAVE ORDER ROOM =================
  socket.on("leaveOrderRoom", async (orderId) => {
    try {
      if (!orderId || !/^[a-f\d]{24}$/i.test(String(orderId))) {
        return socket.emit("orderRoomError", {
          success: false,
          message: "Invalid order ID",
        });
      }

      const roomName = `order_${orderId}`;
      await socket.leave(roomName);

      return socket.emit("leftOrderRoom", {
        success: true,
        orderId: String(orderId),
        room: roomName,
        message: "Left order tracking room",
      });
    } catch (error) {
      console.error("Leave order room error:", error.message);

      return socket.emit("orderRoomError", {
        success: false,
        message: "Failed to leave order tracking room",
      });
    }
  });

  // ================= DISCONNECT =================
  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", socket.id, reason);
  });
});

// ================= SERVER ERROR =================
server.on("error", (error) => {
  console.error("HTTP server error:", error);
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`QuickMart server running on port ${PORT}`);
  console.log(`Socket.IO server running on port ${PORT}`);
});
