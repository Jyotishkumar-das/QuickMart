const Product = require("../models/Product");
const Category = require("../models/Category");

// ======================================================
// CREATE PRODUCT
// ======================================================
const createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            discountPrice,
            image,
            category,
            stock,
            unit,
            brand,
        } = req.body;

        if (
            !name ||
            !description ||
            price === undefined ||
            !image ||
            !category ||
            stock === undefined ||
            !unit
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required product fields",
            });
        }

        const existingCategory = await Category.findById(category);

        if (!existingCategory) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        const product = await Product.create({
            name,
            description,
            price,
            discountPrice,
            image,
            category,
            stock,
            unit,
            brand,
        });

        const populatedProduct = await Product.findById(product._id)
            .populate("category", "name");

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            product: populatedProduct,
        });
    } catch (error) {
        console.error("Create Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create product",
        });
    }
};

// ======================================================
// GET ALL PRODUCTS
// Search + Category + Price Filter + Pagination + Sort
// ======================================================
const getProducts = async (req, res) => {
    try {
        const {
            search,
            category,
            minPrice,
            maxPrice,
            page = 1,
            limit = 24,
            sort = "newest",
        } = req.query;

        const query = {
            isActive: true,
        };

        // SEARCH BY NAME, DESCRIPTION, OR BRAND
        if (search && search.trim()) {
            const searchText = search.trim().replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            query.$or = [
                { name: { $regex: searchText, $options: "i" } },
                { description: { $regex: searchText, $options: "i" } },
                { brand: { $regex: searchText, $options: "i" } },
            ];
        }

        // CATEGORY FILTER BY CATEGORY ID
        if (category && category !== "all") {
            if (!/^[0-9a-fA-F]{24}$/.test(category)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid category ID",
                });
            }

            const existingCategory = await Category.findById(category);

            if (!existingCategory) {
                return res.status(404).json({
                    success: false,
                    message: "Category not found",
                });
            }

            query.category = existingCategory._id;
        }

        // PRICE FILTER
        if (minPrice !== undefined || maxPrice !== undefined) {
            query.price = {};

            if (minPrice !== undefined) {
                const min = Number(minPrice);

                if (!Number.isFinite(min) || min < 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid minimum price",
                    });
                }

                query.price.$gte = min;
            }

            if (maxPrice !== undefined) {
                const max = Number(maxPrice);

                if (!Number.isFinite(max) || max < 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid maximum price",
                    });
                }

                query.price.$lte = max;
            }
        }

        // PAGINATION
        const currentPage = Math.max(parseInt(page, 10) || 1, 1);
        const itemsPerPage = Math.min(
            Math.max(parseInt(limit, 10) || 24, 1),
            100
        );

        const skip = (currentPage - 1) * itemsPerPage;

        // SORTING
        const sortOptions = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            priceLow: { price: 1 },
            priceHigh: { price: -1 },
            nameAZ: { name: 1 },
            nameZA: { name: -1 },
        };

        const sortOption = sortOptions[sort] || sortOptions.newest;

        // FETCH PRODUCTS
        const totalProducts = await Product.countDocuments(query);

        const products = await Product.find(query)
            .populate("category", "name")
            .sort(sortOption)
            .skip(skip)
            .limit(itemsPerPage);

        const totalPages = Math.ceil(totalProducts / itemsPerPage);

        return res.status(200).json({
            success: true,
            count: products.length,
            totalProducts,
            currentPage,
            totalPages,
            hasNextPage: currentPage < totalPages,
            hasPreviousPage: currentPage > 1,
            products,
        });
    } catch (error) {
        console.error("Get Products Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch products",
        });
    }
};

// ======================================================
// GET SINGLE PRODUCT
// ======================================================
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate("category", "name");

        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        return res.status(200).json({
            success: true,
            product,
        });
    } catch (error) {
        console.error("Get Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch product",
        });
    }
};

// ======================================================
// UPDATE PRODUCT
// ======================================================
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        if (req.body.category) {
            const category = await Category.findById(req.body.category);

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: "Category not found",
                });
            }
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        ).populate("category", "name");

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product: updatedProduct,
        });
    } catch (error) {
        console.error("Update Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update product",
        });
    }
};

// ======================================================
// DELETE PRODUCT (SOFT DELETE)
// ======================================================
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        product.isActive = false;
        await product.save();

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully",
        });
    } catch (error) {
        console.error("Delete Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete product",
        });
    }
};

// ======================================================
// EXPORT
// ======================================================
module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
};
