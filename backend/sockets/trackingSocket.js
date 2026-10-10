const Order = require("../models/Order");
const DeliveryPartner = require("../models/DeliveryPartner");

const registerTrackingSocket = (io, socket) => {

    // ==================================================
    // UPDATE DELIVERY PARTNER LOCATION
    // ==================================================

    socket.on("updateLocation", async (data) => {

        try {

            // ==========================================
            // ONLY DELIVERY PARTNER CAN UPDATE LOCATION
            // ==========================================

            if (socket.user.role !== "delivery") {

                return socket.emit("locationError", {
                    success: false,
                    message:
                        "Only delivery partners can update location",
                });
            }


            // ==========================================
            // GET DATA
            // ==========================================

            const {
                orderId,
                latitude,
                longitude,
            } = data;


            // ==========================================
            // VALIDATE REQUIRED DATA
            // ==========================================

            if (
                !orderId ||
                latitude === undefined ||
                longitude === undefined
            ) {

                return socket.emit("locationError", {
                    success: false,
                    message:
                        "Order ID, latitude and longitude are required",
                });
            }


            // ==========================================
            // VALIDATE DATA TYPE
            // ==========================================

            if (
                typeof latitude !== "number" ||
                typeof longitude !== "number"
            ) {

                return socket.emit("locationError", {
                    success: false,
                    message:
                        "Latitude and longitude must be numbers",
                });
            }


            // ==========================================
            // VALIDATE GPS RANGE
            // ==========================================

            if (
                latitude < -90 ||
                latitude > 90 ||
                longitude < -180 ||
                longitude > 180
            ) {

                return socket.emit("locationError", {
                    success: false,
                    message:
                        "Invalid latitude or longitude",
                });
            }


            // ==========================================
            // FIND DELIVERY PARTNER
            // ==========================================

            const deliveryPartner =
                await DeliveryPartner.findOne({
                    user: socket.user.userId,
                    isActive: true,
                });


            if (!deliveryPartner) {

                return socket.emit("locationError", {
                    success: false,
                    message:
                        "Delivery partner profile not found",
                });
            }


            // ==========================================
            // FIND ORDER
            // ==========================================

            const order =
                await Order.findById(orderId);


            if (!order) {

                return socket.emit("locationError", {
                    success: false,
                    message:
                        "Order not found",
                });
            }


            // ==========================================
            // CHECK ORDER ASSIGNMENT
            // ==========================================

            if (
                !order.deliveryPartner ||
                order.deliveryPartner.toString() !==
                deliveryPartner._id.toString()
            ) {

                return socket.emit("locationError", {
                    success: false,
                    message:
                        "This order is not assigned to you",
                });
            }


            // ==========================================
            // UPDATE GPS LOCATION
            // ==========================================

            deliveryPartner.currentLocation = {
                latitude: latitude,
                longitude: longitude,
            };


            // ==========================================
            // UPDATE LOCATION TIMESTAMP
            // ==========================================

            deliveryPartner.locationUpdatedAt =
                new Date();


            // ==========================================
            // SAVE TO MONGODB
            // ==========================================

            await deliveryPartner.save();


            // ==========================================
            // ORDER ROOM
            // ==========================================

            const roomName =
                `order_${orderId}`;


            // ==========================================
            // DEBUG ROOM
            // ==========================================

            const roomSockets =
                io.sockets.adapter.rooms.get(roomName);


            console.log("\n====================================");
            console.log("📡 BROADCASTING LIVE LOCATION");
            console.log("====================================");

            console.log(
                "Room:",
                roomName
            );

            console.log(
                "Sender Socket ID:",
                socket.id
            );

            console.log(
                "Sender Role:",
                socket.user.role
            );

            console.log(
                "Connected sockets in room:",
                roomSockets
                    ? Array.from(roomSockets)
                    : []
            );

            console.log(
                "Socket count:",
                roomSockets
                    ? roomSockets.size
                    : 0
            );

            console.log(
                "Latitude:",
                latitude
            );

            console.log(
                "Longitude:",
                longitude
            );

            console.log("====================================\n");


            // ==========================================
            // BROADCAST LIVE LOCATION
            // ==========================================

            io.to(roomName).emit(
                "locationUpdated",
                {
                    success: true,

                    orderId:
                        orderId,

                    latitude:
                        latitude,

                    longitude:
                        longitude,

                    updatedAt:
                        deliveryPartner.locationUpdatedAt,
                }
            );


            // ==========================================
            // SEND SUCCESS TO DELIVERY PARTNER
            // ==========================================

            socket.emit(
                "locationUpdateSuccess",
                {
                    success: true,

                    orderId:
                        orderId,

                    latitude:
                        latitude,

                    longitude:
                        longitude,

                    updatedAt:
                        deliveryPartner.locationUpdatedAt,

                    message:
                        "Location updated successfully",
                }
            );


            // ==========================================
            // SERVER LOG
            // ==========================================

            console.log(
                `Location updated 📍 Order: ${orderId} | Lat: ${latitude} | Lng: ${longitude}`
            );

            console.log(
                `Location updated at: ${deliveryPartner.locationUpdatedAt.toISOString()}`
            );


        } catch (error) {

            console.error(
                "Location update error:",
                error
            );


            socket.emit(
                "locationError",
                {
                    success: false,

                    message:
                        "Failed to update location",
                }
            );

        }

    });

};


module.exports = registerTrackingSocket;