const express = require("express");

const {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
} = require("../controllers/productController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Public routes
router.get("/", getProducts);
router.get("/:id", getProductById);

// Admin routes
router.post(
    "/",
    protect,
    authorizeRoles("admin"),
    createProduct
);

router.put(
    "/:id",
    protect,
    authorizeRoles("admin"),
    updateProduct
);

router.delete(
    "/:id",
    protect,
    authorizeRoles("admin"),
    deleteProduct
);

module.exports = router;