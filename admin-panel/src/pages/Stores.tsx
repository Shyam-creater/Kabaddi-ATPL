// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import {
  Package, Plus, Download, Search, Edit3, Trash2,
  Layers, Info, PlusCircle, ImageIcon as LucideImage, Tag, Sparkles,
  RefreshCcw, Filter, ShoppingBag, TrendingUp, AlertCircle,
  CheckCircle, XCircle, BarChart3, ArrowUpRight, Eye, X
} from "lucide-react";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Avatar,
  Chip,
  InputAdornment,
  TablePagination,
  Tooltip,
  CircularProgress,
  Grid,
  Stack,
  Checkbox,
  FormControlLabel,
  Autocomplete,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import ImageIcon from "@mui/icons-material/Image";
import InventoryIcon from "@mui/icons-material/Inventory";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import SearchIcon from "@mui/icons-material/Search";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import InfoIcon from "@mui/icons-material/Info";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import WarningIcon from "@mui/icons-material/Warning";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CloseIcon from "@mui/icons-material/Close";
import * as XLSX from "xlsx";
import { useSnackbar } from "notistack";
import { productApi } from "../services/productApi";
import { categoryApi } from "../services/categoryApi";
import { variantApi } from "../services/variantApi";
import { brandApi } from "../services/brandApi";
import { useLocation } from "react-router-dom";

// Mock permissions for this environment
const usePermissions = () => ({ canWrite: () => true, canDelete: () => true, canRead: () => true });
const PERMISSIONS = { PRODUCTS: 'PRODUCTS' };
const ACTIONS = { CREATE: 'CREATE', UPDATE: 'UPDATE', DELETE: 'DELETE' };

const Products = () => {
  const fileInputRef1 = useRef(null);
  const fileInputRef2 = useRef(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const { canWrite, canDelete } = usePermissions();
  const { enqueueSnackbar } = useSnackbar();
  const location = useLocation();
  const selectedCategory = location.state?.selectedCategory;
  const [categoryFilter, setCategoryFilter] = useState(selectedCategory || "");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [imagePreviews, setImagePreviews] = useState<any[]>([]);
  const imageInputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];
  const [formData, setFormData] = useState({
    name: "",
    shortDescription: "",
    description: "",
    category: "",
    status: "active",
    brand: "",
    images: [],
    imagesToDelete: [],
    pSubCategory: "",
    pNestedSubCategory: "",
    tax: "5",
    return: "no",
    returnDays: "",
    pType: "product",
    pMetaTitle: "",
    pMetaKeywords: "",
    pMetaDescription: "",
    pCanonicalUrl: "",
    pUrl: "",
    schemaMarkup: "",
    pis_voucher_50: false,
    pis_voucher_100: false,
    freeshipping: false,
  });
  const [errors, setErrors] = useState({});
  const [brandDialog, setBrandDialog] = useState(false);
  const [newBrand, setNewBrand] = useState({ name: "", description: "", logo: "" });
  const brandLogoRef = useRef(null);
  const [brandPreviewLogo, setBrandPreviewLogo] = useState("");
  const [brandErrors, setBrandErrors] = useState({});
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    image: "",
    status: "active",
  });
  const categoryImageRef = useRef(null);
  const [categoryPreviewImage, setCategoryPreviewImage] = useState("");
  const [categoryErrors, setCategoryErrors] = useState({});
  const [imagePreviewDialog, setImagePreviewDialog] = useState(false);
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [stockToAdd, setStockToAdd] = useState("");
  const [stockError, setStockError] = useState("");
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<any>(null);
  const [nestedSubCategories, setNestedSubCategories] = useState<any[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [type, setType] = useState("");
  const [options, setOptions] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] =
    useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [variantLoading, setVariantLoading] = useState(false);
  const [variantFormData, setVariantFormData] = useState({
    attributes: [{ type: "size", value: "" }], // Array of { type, value } objects
    stock: "",
    price: "",
    previousPrice: "",
    offer: "",
    status: "active",
    pvCanonicalUrl: "",
    pvSchemaMarkup: "",
    isDefault: false,
    min: 1,
  });
  const [variantErrors, setVariantErrors] = useState<any>({});
  const [variantStockDialog, setVariantStockDialog] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [productVariantType, setProductVariantType] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteVariantConfirmOpen, setDeleteVariantConfirmOpen] =
    useState(false);
  const [variantToDelete, setVariantToDelete] = useState<any>(null);
  const [deleteVariantLoading, setDeleteVariantLoading] = useState(false);
  const [editVariantDialog, setEditVariantDialog] = useState(false);
  const [editVariantData, setEditVariantData] = useState<any>(null);
  const [addVariantLoading, setAddVariantLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const typeOptions = {
    size: ["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "40 / 6","41 / 7", "42 / 8", "43 / 9", "44 / 10", "45 / 11" ,"Free Size", 
      "29'' x 43''(adjustable)", "36'' x 46''(adjustable)",  "36'' x 47''(adjustable)", "34'' x 49''(adjustable)", "38'' x 48''(adjustable)", "40'' x 50''(adjustable)"
    ],
    color: [
      "Black",
      "White",
      "Red",
      "Tan",
      "Blue",
      "Green",
      "Yellow",
      "Purple",
      "Pink",
      "Orange",
      "Brown",
      "Grey",
      "Navy",
    ],
    weight: [
      "25g",
      "50g",
      "100g",
      "180g",
      "200g",
      "250g",
      "300g",
      "500g",
      "700g",
      "750g",
      "1kg",
      "2kg",
      "3kg",
      "4kg",
      "5kg",
      "10kg",
      "50ml",
      "100ml",
      "150ml",
      "200ml",
      "250ml",
      "300ml",
      "400ml",
      "700ml",
      "500ml",
    ],
    hex: [
      "#000000",
      "#FFFFFF",
      "#FF0000",
      "#00FF00",
      "#0000FF",
      "#FFFF00",
      "#FFA500",
      "#800080",
      "#FFC0CB",
      "#808080",
    ],
    length: ["Free Size"],
  };

  useEffect(() => {
    if (location.state?.fromCategories && selectedCategory) {
      setCategoryFilter(selectedCategory);
    }
  }, [location.state, selectedCategory]);

  const fetchSubcategories = async (categoryName) => {
    try {
      const category = categories.find((cat) => cat.cName === categoryName);
      if (!category) {
        setSubcategories([]);
        return;
      }

      const response = await categoryApi.getSubCategories(category._id);
      if (response.success) {
        setSubcategories(response.subCategories || []);
      }
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      setSubcategories([]);
    }
  };

  const fetchNestedSubCategories = async (categoryId, subCategoryId) => {
    try {
      const response = await categoryApi.getNestedSubCategories(
        categoryId,
        subCategoryId
      );
      if (response.success) {
        setNestedSubCategories(response.subCategories || []);
      } else {
        setNestedSubCategories([]);
      }
    } catch (error) {
      console.error("Error fetching nested subcategories:", error);
      enqueueSnackbar(error.message || "Failed to fetch nested subcategories", {
        variant: "error",
      });
      setNestedSubCategories([]);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productApi.getAllProducts(1, 9999);
      if (response.success) {
        setAllProducts(response.products);
        setTotalProducts(response.products.length);
        updateDisplayedProducts(response.products);
      } else {
        enqueueSnackbar(response.message || "Failed to fetch products", {
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      enqueueSnackbar(error.message || "Failed to fetch products", {
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getAllCategories();
      if (response) {
        setCategories(response);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      enqueueSnackbar(error.message || "Failed to fetch categories", {
        variant: "error",
      });
    }
  };

  const fetchBrands = async () => {
    try {
      const data = await brandApi.getAllBrands();
      setBrands(data);
    } catch (error) {
      console.error("Error fetching brands:", error);
      enqueueSnackbar("Error fetching brands", { variant: "error" });
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBrands();
  }, []);

  useEffect(() => {
    updateDisplayedProducts();
  }, [page, rowsPerPage, searchQuery, categoryFilter]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPage(0);
  };

  const updateDisplayedProducts = (productsToFilter = allProducts) => {
    const filtered = productsToFilter.filter((product) => {
      const matchesSearch = searchQuery
        ? (product.pName?.toLowerCase() || "").includes(
            searchQuery.toLowerCase()
          ) ||
          (product.pShortDescription?.toLowerCase() || "").includes(
            searchQuery.toLowerCase()
          ) ||
          (product.pDescription?.toLowerCase() || "").includes(
            searchQuery.toLowerCase()
          ) ||
          (product.pCategory?.toLowerCase() || "").includes(
            searchQuery.toLowerCase()
          ) ||
          (product.pSubCategory?.toLowerCase() || "").includes(
            searchQuery.toLowerCase()
          ) ||
          (product.pNestedSubCategory?.toLowerCase() || "").includes(
            searchQuery.toLowerCase()
          ) ||
          (product.pBrand?.toLowerCase() || "").includes(
            searchQuery.toLowerCase()
          )
        : true;

      const matchesCategory =
        !categoryFilter || product.pCategory === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    setTotalProducts(filtered.length);
    const start = page * rowsPerPage;
    const paginatedProducts = filtered.slice(start, start + rowsPerPage);
    setProducts(paginatedProducts);
  };

  useEffect(() => {
    if (
      formData.pCategory &&
      !categories.some((cat) => cat.name === formData.pCategory)
    ) {
      setFormData((prev) => ({
        ...prev,
        pCategory: "",
      }));
    }
  }, [categories, formData.pCategory]);

  const handleOpen = (product = null) => {
    if (product && !canWrite(PERMISSIONS.PRODUCTS)) {
      enqueueSnackbar("You do not have permission to edit products", {
        variant: "error",
      });
      return;
    }

    if (product) {
      // console.log('Product data received:', product);
      // console.log('Freeshipping value:', product.freeshipping, typeof product.freeshipping);
      setEditProduct(product);
      setFormData({
        name: product.pName || "",
        shortDescription: product.pShortDescription || "",
        description: product.pDescription || "",
        category: product.pCategory || "",
        status: product.pStatus || "active",
        brand: product.pBrand || "",
        images: product.pImage || [],
        imagesToDelete: [],
        pSubCategory: product.pSubCategory || "",
        pNestedSubCategory: product.pNestedSubCategory || "",
        tax: product.pTax || "5",
        return: product.pReturn || "no",
        returnDays: product.pReturnDays || "",
        pType: product.pType || "product",
        pMetaTitle: product.pMetaTitle || "",
        pMetaKeywords: product.pMetaKeywords || "",
        pMetaDescription: product.pMetaDescription || "",
        pCanonicalUrl: product.pCanonicalUrl || "", 
        pUrl: product.pUrl || "",
        schemaMarkup: product.schemaMarkup || "",
        pis_voucher_50: Boolean(product.pis_voucher_50) || false,
        pis_voucher_100: Boolean(product.pis_voucher_100) || false,
        freeshipping: Boolean(product.freeshipping),
      });
      // console.log('FormData freeshipping set to:', Boolean(product.freeshipping));
      setImagePreviews(product.pImage || []);

      if (product.pCategory) {
        fetchSubcategories(product.pCategory);

        if (product.pSubCategory) {
          const category = categories.find(
            (cat) => cat.cName === product.pCategory
          );
          const subcategory = category?.subCategories?.find(
            (sub) => sub.name === product.pSubCategory
          );
          if (category && subcategory) {
            fetchNestedSubCategories(category._id, subcategory._id);
          }
        }
      }
    } else {
      setEditProduct(null);
      setFormData({
        name: "",
        shortDescription: "",
        description: "",
        category: "",
        status: "active",
        brand: "",
        images: [],
        imagesToDelete: [],
        pSubCategory: "",
        pNestedSubCategory: "",
        tax: "5",
        return: "no",
        returnDays: "",
        pType: "product",
        pMetaTitle: "",
        pMetaKeywords: "",
        pMetaDescription: "",
        pCanonicalUrl: "",
        pUrl: "",
        schemaMarkup: "",
        pis_voucher_50: false,
        pis_voucher_100: false,
        freeshipping: false,
      });
      setImagePreviews([]);
      setSubcategories([]);
      setNestedSubCategories([]);
    }
    setErrors({});
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditProduct(null);
    setFormData({
      name: "",
      shortDescription: "",
      description: "",
      category: "",
      status: "active",
      brand: "",
      pMetaTitle: "",
      pMetaKeywords: "",
      pMetaDescription: "",
      pCanonicalUrl: "",
      pUrl: "",
      schemaMarkup: "",
      images: [],
      imagesToDelete: [],
      pSubCategory: "",
      pNestedSubCategory: "",
      tax: "5",
      return: "no",
      returnDays: "",
      pType: "product",
      pis_voucher_50: false,
      pis_voucher_100: false,
      freeshipping: false,
    });
    setImagePreviews([]);
    setSubcategories([]);
    setNestedSubCategories([]);
    setErrors({});
  };

  const handleImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10000000) {
        // 10MB limit
        setErrors((prev) => ({
          ...prev,
          images: "Image size should be less than 10MB",
        }));
        return;
      }

      // Show message about minimum image requirement if less than 3 images
      // const currentValidImages = formData.images.filter(img => img);
      // if (currentValidImages.length < 2) {
      //   enqueueSnackbar(`Please upload at least ${3 - currentValidImages.length} more images`, {
      //     variant: 'info'
      //   });
      // }

      // Check if maximum images limit is reached
      const currentValidImages = formData.images.filter((img) => img);
      if (currentValidImages.length >= 15) {
        enqueueSnackbar(
          "Maximum 15 images reached. Please remove some images before adding new ones.",
          {
            variant: "warning",
          }
        );
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressedImage = await compressImage(reader.result);

          // Store the old image filename if it exists
          const oldImage = formData.images[index];
          const isOldImageFromServer =
            oldImage &&
            typeof oldImage === "string" &&
            !oldImage.startsWith("data:");

          // Update image previews
          setImagePreviews((prev) => {
            const newPreviews = [...prev];
            newPreviews[index] = compressedImage;
            return newPreviews;
          });

          // Update form data images and track deleted images
          setFormData((prev) => {
            const newImages = [...prev.images];
            newImages[index] = compressedImage;

            // Track the old image for deletion if it exists
            const imagesToDelete = [...(prev.imagesToDelete || [])];
            if (isOldImageFromServer) {
              const filename = oldImage.startsWith("http")
                ? oldImage.split("/").pop()
                : oldImage;
              if (!imagesToDelete.includes(filename)) {
                imagesToDelete.push(filename);
              }
            }

            return {
              ...prev,
              images: newImages,
              imagesToDelete,
            };
          });

          setErrors((prev) => ({ ...prev, images: undefined }));
        } catch (error) {
          console.error("Error compressing image:", error);
          setErrors((prev) => ({
            ...prev,
            images: "Error processing image. Please try again.",
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  
  const handleRemoveImage = async (index) => {
    try {
      const imageToRemove = formData.images[index];

      // Check if removing this image would result in less than 3 images
      // const currentValidImages = formData.images.filter(img => img);
      // if (currentValidImages.length <= 3) {
      //   enqueueSnackbar('Minimum 3 images are required. Cannot remove more images.', {
      //     variant: 'warning'
      //   });
      //   return;
      // }

      if (editProduct && imageToRemove) {
        // If it's an existing image from server (has a URL), call delete API
        if (
          typeof imageToRemove === "string" &&
          !imageToRemove.startsWith("data:image")
        ) {
          const response = await productApi.deleteProductImage(
            editProduct._id,
            imageToRemove
          );
          if (response.success) {
            enqueueSnackbar("Image deleted successfully", {
              variant: "success",
            });

            // Update form data with new image array
            setFormData((prev) => ({
              ...prev,
              images: prev.images.filter((_, i) => i !== index),
            }));

            // Update image previews
            setImagePreviews((prev) => prev.filter((_, i) => i !== index));
          }
        } else {
          // If it's a new image (base64), just remove it from state
          setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
          }));
          setImagePreviews((prev) => prev.filter((_, i) => i !== index));
        }
      } else {
        // If not editing or no image, just remove from state
        setFormData((prev) => ({
          ...prev,
          images: prev.images.filter((_, i) => i !== index),
        }));
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
      }
    } catch (error) {
      console.error("Error removing image:", error);
      enqueueSnackbar(error.message || "Failed to delete image", {
        variant: "error",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setUploadProgress(0);

      // Show progress for image processing
      const validImages = formData.images.filter((img) => img);
      if (validImages.length > 0) {
        enqueueSnackbar(`Processing ${validImages.length} images...`, {
          variant: "info",
        });
      }
      const productData = {
        pName: formData.name,
        pMetaTitle: formData.pMetaTitle,
        pMetaKeywords: formData.pMetaKeywords,
        pMetaDescription: formData.pMetaDescription,
        pCanonicalUrl: formData.pCanonicalUrl,
        pUrl: formData.pUrl,
        schemaMarkup: formData.schemaMarkup,
        pBrand: formData.brand,
        pCategory: formData.category,
        pShortDescription: formData.shortDescription,
        pDescription: formData.description,
        pPrice: Number(0), // Ensure it's a number
        pPreviousPrice: Number(0), // Ensure it's a number
        pOffer: Number(0), // Ensure it's a number
        pTax: formData.tax || "5",
        pStatus: formData.status || "active",
        pSubCategory: formData.pSubCategory || "",
        pNestedSubCategory: formData.pNestedSubCategory || "",
        pReturn: formData.return,
        pReturnDays:
          formData.return === "yes" ? Number(formData.returnDays) : 0,
        pType: formData.pType || "product",
        pis_voucher_50: formData.pis_voucher_50 || false,
        pis_voucher_100: formData.pis_voucher_100 || false,
        freeshipping: formData.freeshipping || false,
        images: formData.images,
        imagesToDelete: formData.imagesToDelete,
      };

      console.log("Submitting product data:", productData); // Add logging to debug

      const response = editProduct
        ? await productApi.updateProduct(editProduct._id, productData)
        : await productApi.createProduct(productData);

      if (response.success) {
        enqueueSnackbar(
          editProduct
            ? "Product updated successfully"
            : "Product added successfully",
          { variant: "success" }
        );
        handleClose();
        fetchProducts();

        // Open variant dialog after product creation
        if (!editProduct) {
          handleVariantDialogOpen(response.product);
        }
      }
    } catch (error) {
      console.error("Error submitting product:", error);

      // Handle timeout errors specifically
      if (error.message && error.message.includes("timeout")) {
        enqueueSnackbar(
          "Upload timed out. Please try again with fewer images or check your internet connection.",
          {
            variant: "error",
            autoHideDuration: 6000,
          }
        );
      } else {
        enqueueSnackbar(error.message || "Failed to submit product", {
          variant: "error",
        });
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.shortDescription.trim())
      newErrors.shortDescription = "Short description is required";
    if (!formData.description.trim())
      newErrors.description = "Full description is required";
    if (!formData.category) newErrors.category = "Category is required";

    // Validate minimum 3 images requirement
    const validImages = formData.images.filter((img) => img);
    if (!validImages || validImages.length < 3) {
      newErrors.images = "At least 3 images are required";
      enqueueSnackbar("At least 3 images are required", { variant: "warning" });
    }

    // Validate maximum 15 images requirement
    if (validImages.length > 15) {
      newErrors.images = "Maximum 15 images are allowed";
      enqueueSnackbar("Maximum 15 images are allowed", { variant: "warning" });
    }

    // Tax validation (optional field but must be valid if provided)
    if (
      formData.tax &&
      (isNaN(formData.tax) ||
        parseFloat(formData.tax) < 0 ||
        parseFloat(formData.tax) > 100)
    ) {
      newErrors.tax = "Tax must be between 0 and 100";
    }

    // Return days validation
    if (
      formData.return === "yes" &&
      (!formData.returnDays ||
        isNaN(formData.returnDays) ||
        parseInt(formData.returnDays) < 1)
    ) {
      newErrors.returnDays = "Return days must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDelete = async (id) => {
    try {
      const response = await productApi.deleteProduct(id);
      if (response.success) {
        enqueueSnackbar(
          response.message || "Product and its variants deleted successfully",
          {
            variant: "success",
            autoHideDuration: 3000,
          }
        );
        fetchProducts(); // Refresh the products list
      } else {
        throw new Error(response.message || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      enqueueSnackbar(
        error.message || "Failed to delete product and its variants",
        {
          variant: "error",
          autoHideDuration: 3000,
        }
      );
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "error";
      case "out_of_stock":
        return "warning";
      default:
        return "default";
    }
  };

  const getFinalPrice = (price, offer, tax) => {
    const discountedPrice = price - price * (offer / 100);
    const finalPrice = discountedPrice + discountedPrice * (tax / 100);
    return finalPrice.toFixed(2);
  };

  const compressImage = (base64String) => {
    // If it's not a base64 image, return as is
    if (!base64String?.startsWith("data:image")) {
      return base64String;
    }

    // Create temporary image for compression
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64String;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 600; // Reduced from 800 to 600 for better compression
        const MAX_HEIGHT = 600;

        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with 0.6 quality for better compression
        resolve(canvas.toDataURL("image/jpeg", 0.6));
      };
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "category") {
      if (value === "add_new_category") {
        setCategoryDialog(true);
        return;
      }
      setFormData((prev) => ({
        ...prev,
        category: value,
        pSubCategory: "", // Reset subcategory when category changes
        pNestedSubCategory: "", // Reset nested subcategory
      }));
      if (value) {
        fetchSubcategories(value);
      } else {
        setSubcategories([]);
        setNestedSubCategories([]); // Clear nested subcategories
      }
      return;
    }

    // Handle subcategory selection
    if (name === "pSubCategory") {
      setFormData((prev) => ({
        ...prev,
        pSubCategory: value,
        pNestedSubCategory: "", // Reset nested subcategory when subcategory changes
      }));

      // Fetch nested subcategories when a subcategory is selected
      if (value) {
        const category = categories.find(
          (cat) => cat.cName === formData.category
        );
        if (category) {
          const subcategory = category.subCategories?.find(
            (sub) => sub.name === value
          );
          if (subcategory) {
            fetchNestedSubCategories(category._id, subcategory._id);
                        }
                      }
                    } else {
                      setNestedSubCategories([]);
                    }
      return;
    }

    // Handle nested subcategory selection
    if (name === "pNestedSubCategory") {
      setFormData((prev) => ({
        ...prev,
        pNestedSubCategory: value,
      }));
      return;
    }

    // Handle numeric fields
    if (["tax"].includes(name)) {
      const numValue = value === "" ? "" : Number(value);
      if (!isNaN(numValue)) {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
      return;
    }

    // Handle checkbox inputs
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoryImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        setCategoryErrors((prev) => ({
          ...prev,
          image: "Image size should be less than 5MB",
        }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressedImage = await compressImage(reader.result);
          setCategoryPreviewImage(compressedImage);
          setNewCategory((prev) => ({
            ...prev,
            image: compressedImage,
          }));
          setCategoryErrors((prev) => ({ ...prev, image: undefined }));
        } catch (error) {
          console.error("Error processing category image:", error);
          setCategoryErrors((prev) => ({
            ...prev,
            image: "Error processing image. Please try again.",
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const validateCategoryForm = () => {
    const errors = {};
    if (!newCategory.name.trim()) errors.name = "Name is required";
    if (!newCategory.description.trim())
      errors.description = "Description is required";
    if (!newCategory.image) errors.image = "Image is required";
    setCategoryErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddNewCategory = async () => {
    if (!validateCategoryForm()) return;

    try {
      setLoading(true);

      if (formData.category && formData.pSubCategory) {
        // Creating a nested subcategory
        const parentCategory = categories.find(
          (cat) => cat.cName === formData.category
        );
        if (!parentCategory) {
          throw new Error("Parent category not found");
        }

        const subcategory = parentCategory.subCategories.find(
          (sub) => sub.name === formData.pSubCategory
        );
        if (!subcategory) {
          throw new Error("Parent subcategory not found");
        }

        const response = await categoryApi.createNestedSubCategory(
          parentCategory._id,
          subcategory._id,
          {
            name: newCategory.name,
            description: newCategory.description,
            status: newCategory.status,
            image: newCategory.image,
          }
        );

        if (response.success) {
          enqueueSnackbar("Nested subcategory added successfully", {
            variant: "success",
          });
          await fetchNestedSubCategories(parentCategory._id, subcategory._id);
        }
      } else if (formData.category) {
        // Creating a subcategory
        const parentCategory = categories.find(
          (cat) => cat.cName === formData.category
        );
        if (!parentCategory) {
          throw new Error("Parent category not found");
        }

        const response = await categoryApi.createSubCategory(
          parentCategory._id,
          {
            name: newCategory.name,
            description: newCategory.description,
            status: newCategory.status,
            image: newCategory.image,
          }
        );

        if (response.success) {
          enqueueSnackbar("Subcategory added successfully", {
            variant: "success",
          });
          await fetchSubcategories(formData.category);
        }
      } else {
        // Creating a main category
        const response = await categoryApi.createCategory(newCategory);

        if (response.success) {
          enqueueSnackbar("Category added successfully", {
            variant: "success",
          });
          await fetchCategories();
          setFormData((prev) => ({
            ...prev,
            category: newCategory.name,
          }));
        }
      }

      // Reset form
      setCategoryDialog(false);
      setNewCategory({
        name: "",
        description: "",
        image: "",
        status: "active",
      });
      setCategoryPreviewImage("");
      setCategoryErrors({});
    } catch (error) {
      console.error("Error adding category:", error);
      enqueueSnackbar(error.message || "Failed to add category", {
        variant: "error",
      });
      setCategoryErrors((prev) => ({
        ...prev,
        submit: "Failed to add category. Please try again.",
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleBrandLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setBrandErrors((prev) => ({
          ...prev,
          logo: "File size must be less than 5MB",
        }));
        return;
      }

      setNewBrand((prev) => ({ ...prev, logo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setBrandPreviewLogo(reader.result);
      };
      reader.readAsDataURL(file);
      setBrandErrors((prev) => ({ ...prev, logo: null }));
    }
  };

  const handleAddBrand = async () => {
    try {
      setLoading(true);
      const newErrors = {};
      if (!newBrand.name.trim()) newErrors.name = "Name is required";
      if (!newBrand.description.trim())
        newErrors.description = "Description is required";

      if (Object.keys(newErrors).length > 0) {
        setBrandErrors(newErrors);
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("name", newBrand.name);
      formData.append("description", newBrand.description);
      formData.append("status", "active");
      if (newBrand.logo) {
        formData.append("logo", newBrand.logo);
      }

      const response = await brandApi.createBrand(formData);

      if (response.success || response) {
        enqueueSnackbar("Brand added successfully", { variant: "success" });
        await fetchBrands();
        setFormData((prev) => ({ ...prev, brand: newBrand.name }));
      }

      setBrandDialog(false);
      setNewBrand({ name: "", description: "", logo: "" });
      setBrandPreviewLogo("");
      setBrandErrors({});
    } catch (error) {
      console.error("Error adding brand:", error);
      enqueueSnackbar(error.message || "Failed to add brand", {
        variant: "error",
      });
      setBrandErrors((prev) => ({
        ...prev,
        submit: "Failed to add brand. Please try again.",
      }));
    } finally {
      setLoading(false);
    }
  };

  // Add CSS for proper image display
  const styles = {
    productImage: {
      width: "60px",
      height: "60px",
      objectFit: "cover",
      borderRadius: "4px",
      border: "1px solid #eee",
    },
    productImages: {
      display: "flex",
      gap: "8px",
      alignItems: "center",
    },
  };

  const handleImageClick = (images) => {
    setSelectedImages(images);
    setCurrentImageIndex(0);
    setImagePreviewDialog(true);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % selectedImages.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + selectedImages.length) % selectedImages.length
    );
  };

  // Add function to calculate total stock
  const calculateTotalStock = (variants) => {
    return variants.reduce(
      (total, variant) => total + (parseInt(variant.stock) || 0),
      0
    );
  };

  // Add function to count low stock items
  const getLowStockCount = () => {
    return products.filter((product) => product.pQuantity <= 10).length;
  };

  // Add function to handle stock update
  const handleAddStock = (product) => {
    setSelectedProduct(product);
    setStockToAdd("");
    setStockError("");
    setStockDialogOpen(true);
  };

  // Add function to save new stock
  const handleStockSubmit = () => {
    if (!stockToAdd || isNaN(stockToAdd) || parseInt(stockToAdd) <= 0) {
      setStockError("Please enter a valid positive number");
      return;
    }

    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        if (p.id === selectedProduct.id) {
          const stockToAddNum = parseInt(stockToAdd);
          const newQuantity = parseInt(p.pQuantity) + stockToAddNum;
          const currentOverallStock = parseInt(p.pStock || p.pQuantity || 0);
          return {
            ...p,
            pQuantity: newQuantity,
            pStock: currentOverallStock + stockToAddNum, // Overall stock only increases
          };
        }
        return p;
      })
    );

    enqueueSnackbar("Stock updated successfully", { variant: "success" });
    setStockDialogOpen(false);
    setSelectedProduct(null);
    setStockToAdd("");
  };

  const handleExportToExcel = () => {
    // Prepare the data for export
    const exportData = products.map((product) => ({
      ID: product._id,
      "Product Name": product.pName,
      "Short Description": product.pShortDescription,
      Description: product.pDescription,
      Category: product.pCategory,
      Subcategory: product.pSubCategory || "-",
      "Nested Subcategory": product.pNestedSubCategory || "-",
      Brand: product.pBrand,
      Price: product.pPrice,
      Stock: product.pStock,
      Quantity: product.pQuantity,
      variants: product.variants ? product.variants.length : 0,
      pis_voucher_100: product.pis_voucher_100 ? "Yes" : "No",
      pis_voucher_50: product.pis_voucher_50 ? "Yes" : "No",
      Tax: product.pTax + "%",
      Status: product.pStatus,
      "Created At": new Date(product.createdAt).toLocaleDateString(),
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");

    // Generate Excel file and trigger download
    XLSX.writeFile(
      wb,
      `products_list_${new Date()
        .toLocaleDateString()
        .replace(/\//g, "-")}.xlsx`
    );
  };

  // Add a clear filter function
  const handleClearFilter = () => {
    setCategoryFilter("");
    setSearchQuery("");
  };

  const handleProductSubmit = async (formData) => {
    try {
      // Make sure the nested subcategory ID is included in the form data
      const productData = new FormData();
      // ... other form fields ...
      if (formData.nestedSubCategory) {
        productData.append(
          "pNestedSubCategory",
          formData.nestedSubCategory._id
        );
      }
      // ... submit product ...
    } catch (error) {
      console.error("Error creating product:", error);
    }
  };

  const handleDeleteClick = (product) => {
    if (!canDelete(PERMISSIONS.PRODUCTS)) {
      enqueueSnackbar("You do not have permission to delete products", {
        variant: "error",
      });
      return;
    }
    setProductToDelete(product);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (productToDelete) {
      try {
        setDeleteLoading(true);
        await handleDelete(productToDelete._id);
      } catch (error) {
        console.error("Error deleting product:", error);
        enqueueSnackbar(
          error.message || "Failed to delete product and its variants",
          {
            variant: "error",
            autoHideDuration: 3000,
          }
        );
      } finally {
        setDeleteLoading(false);
        setDeleteConfirmOpen(false);
        setProductToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setProductToDelete(null);
  };

  // Handle type change
  const handleTypeChange = (event) => {
    const selectedType = event.target.value;
    setType(selectedType);
    setOptions(typeOptions[selectedType] || []);
  };

  // Add this function to handle variant dialog open
  const handleVariantDialogOpen = (product) => {
    setSelectedProductForVariant(product);
    setVariantDialogOpen(true);
    // Reset form data when opening dialog
    setVariantFormData({
      attributes: [{ type: "size", value: "" }],
      stock: "",
      price: "",
      previousPrice: "",
      offer: "",
      status: "active",
      pvCanonicalUrl: "",
      pvSchemaMarkup: "",
      isDefault: false,
      min: 1,
    });
    fetchProductVariants(product._id);
  };

  // Add function to add new attribute field
  const handleAddAttribute = () => {
    setVariantFormData((prev) => ({
      ...prev,
      attributes: [...prev.attributes, { type: "size", value: "" }],
    }));
  };

  // Add function to remove attribute field
  const handleRemoveAttribute = (index) => {
    if (variantFormData.attributes.length > 1) {
      setVariantFormData((prev) => ({
        ...prev,
        attributes: prev.attributes.filter((_, i) => i !== index),
      }));
    }
  };

  // Add function to update attribute
  const handleAttributeChange = (index, field, value) => {
    setVariantFormData((prev) => {
      const newAttributes = [...prev.attributes];
      newAttributes[index] = {
        ...newAttributes[index],
        [field]: value,
      };
      // Reset value when type changes
      if (field === "type") {
        newAttributes[index].value = "";
      }
      return {
        ...prev,
        attributes: newAttributes,
      };
    });
  };

  // Helper function to determine variant type from attributes
  const getVariantTypeFromAttributes = (attributes) => {
    if (attributes?.size) return "size";
    if (attributes?.color) return "color";
    if (attributes?.weight) return "weight";
    if (attributes?.hex) return "hex";
    return "size"; // default
  };

  // Helper function to get variant value from attributes
  const getVariantValueFromAttributes = (attributes) => {
    if (!attributes) return "";
    const values = [];
    if (attributes.size) values.push(`Size: ${attributes.size}`);
    if (attributes.color) values.push(`Color: ${attributes.color}`);
    if (attributes.weight) values.push(`Weight: ${attributes.weight}`);
    if (attributes.hex) values.push(`Hex: ${attributes.hex}`);
    return values.length > 0 ? values.join(", ") : "";
  };

  // Helper function to get variant display value (just the values, no labels)
  const getVariantDisplayValue = (attributes) => {
    if (!attributes) return "-";
    const values = [];
    if (attributes.size) values.push(attributes.size);
    if (attributes.color) values.push(attributes.color);
    if (attributes.weight) values.push(attributes.weight);
    if (attributes.hex) values.push(attributes.hex);
    return values.length > 0 ? values.join(" / ") : "-";
  };

  // Helper function to get variant type display (all types used)
  const getVariantTypeDisplay = (attributes) => {
    if (!attributes) return "-";
    const types = [];
    if (attributes.size) types.push("Size");
    if (attributes.color) types.push("Color");
    if (attributes.weight) types.push("Weight");
    if (attributes.hex) types.push("Hex");
    return types.length > 0 ? types.join(" + ") : "-";
  };

  // Update the fetchProductVariants function with loading state, sorting, and better error handling
  const fetchProductVariants = async (productId) => {
    try {
      setVariantLoading(true);
      const response = await variantApi.getProductVariants(productId);
      if (response.success) {
        // Sort variants ascending (by size, then color, then weight)
        const sortVariantsAscending = (variantList = []) => {
          const getSortKey = (v) => {
            const attrs = v?.attributes || {};
            const size = (attrs.size || v.size || "").toString();
            const color = (attrs.color || v.color || "").toString();
            const weight = (attrs.weight || v.weight || "").toString();
            const hex = (attrs.hex || v.hex || "").toString();
            return `${size}||${color}||${weight}||${hex}`;
          };

          return [...variantList].sort((a, b) => {
            const keyA = getSortKey(a).toLowerCase();
            const keyB = getSortKey(b).toLowerCase();
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
          });
        };

        const sortedVariants = sortVariantsAscending(response.variants || []);
        setVariants(sortedVariants);
        // Set the product's variant type based on existing variants
        if (sortedVariants && sortedVariants.length > 0) {
          const firstVariantType = getVariantTypeFromAttributes(
            sortedVariants[0].attributes
          );
          setProductVariantType(firstVariantType);
          // Don't lock the form if variants exist - allow combinations
        } else {
          setProductVariantType(null);
        }
      } else {
        setVariants([]);
        setProductVariantType(null);
        enqueueSnackbar(response.message || "Failed to fetch variants", {
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error fetching variants:", error);
      setVariants([]);
      setProductVariantType(null);
      enqueueSnackbar(error.message || "Failed to fetch variants", {
        variant: "error",
      });
    } finally {
      setVariantLoading(false);
    }
  };

  // Add this function to handle variant form submission
  const handleVariantSubmit = async (e) => {
    e.preventDefault();
    try {
      setAddVariantLoading(true);

      // Build attributes object from attributes array
      const attributes = {};
      let hasValidAttribute = false;

      variantFormData.attributes.forEach((attr) => {
        if (attr.value && attr.value.trim() !== "") {
          hasValidAttribute = true;
          if (attr.type === "size") {
            attributes.size = attr.value;
          } else if (attr.type === "color") {
            attributes.color = attr.value;
          } else if (attr.type === "weight") {
            attributes.weight = attr.value;
          } else if (attr.type === "hex") {
            attributes.hex = attr.value;
          }
        }
      });

      // Validate that we have at least one attribute with a value
      if (!hasValidAttribute) {
        enqueueSnackbar("Please enter at least one attribute value", {
          variant: "error",
        });
        setAddVariantLoading(false);
        return;
      }

      // Validate that each attribute type is used only once
      const usedTypes = variantFormData.attributes
        .filter((attr) => attr.value && attr.value.trim() !== "")
        .map((attr) => attr.type);
      const uniqueTypes = [...new Set(usedTypes)];
      if (usedTypes.length !== uniqueTypes.length) {
        enqueueSnackbar("Each attribute type (size, color, weight, hex) can only be used once", {
          variant: "error",
        });
        setAddVariantLoading(false);
        return;
      }

      const variantData = {
        productId: selectedProductForVariant._id,
        attributes,
        stock: Number(variantFormData.stock),
        price: !variantFormData.isDefault
          ? Number(variantFormData.previousPrice)
          : Number(variantFormData.price),
        previousPrice: !variantFormData.isDefault
          ? 0
          : Number(variantFormData.previousPrice),
        offer: Number(variantFormData.offer) || 0,
        status: variantFormData.status || "active",
        pvCanonicalUrl: variantFormData.pvCanonicalUrl || "",
        pvSchemaMarkup: variantFormData.pvSchemaMarkup || "",
        isDefault: variantFormData.isDefault || false,
      };

      // Add optional fields only if they have values
      if (variantFormData.min && variantFormData.min !== "") {
        variantData.min = Number(variantFormData.min);
      }

      console.log("Variant data being sent:", variantData);

      const response = await variantApi.createProductVariants([variantData]);
      if (response.success) {
        enqueueSnackbar("Variant added successfully", { variant: "success" });
        fetchProductVariants(selectedProductForVariant._id);
        setVariantFormData({
          attributes: [{ type: productVariantType || "size", value: "" }],
          stock: "",
          price: "",
          previousPrice: "",
          offer: "",
          pvSchemaMarkup: "",
          pvCanonicalUrl: "",
          status: "active",
          isDefault: false,
          min: 1,
        });
      }
    } catch (error) {
      console.error("Error creating variant:", error);
      enqueueSnackbar(error.message || "Failed to create variant", {
        variant: "error",
      });
    } finally {
      setAddVariantLoading(false);
    }
  };

  // Add this function to handle variant deletion
  const handleDeleteVariant = async (variantId) => {
    try {
      const response = await variantApi.deleteProductVariant(variantId);
      if (response.success) {
        enqueueSnackbar("Variant deleted successfully", { variant: "success" });
        fetchProductVariants(selectedProductForVariant._id);
      }
    } catch (error) {
      console.error("Error deleting variant:", error);
      enqueueSnackbar(error.message || "Failed to delete variant", {
        variant: "error",
      });
    }
  };

  const handleVariantStockDialogOpen = (variant) => {
    setSelectedVariant(variant);
    setStockToAdd("");
    setStockError("");
    setVariantStockDialog(true);
  };

  const handleVariantStockSubmit = async () => {
    if (!stockToAdd || isNaN(stockToAdd) || parseInt(stockToAdd) <= 0) {
      setStockError("Please enter a valid positive number");
      return;
    }

    try {
      const response = await variantApi.updateProductVariant(
        selectedVariant._id,
        {
          stock: parseInt(selectedVariant.stock) + parseInt(stockToAdd),
          totalStock:
            parseInt(selectedVariant.totalStock) + parseInt(stockToAdd),
        }
      );

      if (response.success) {
        enqueueSnackbar("Stock updated successfully", { variant: "success" });
        fetchProductVariants(selectedProductForVariant._id);
        setVariantStockDialog(false);
        setSelectedVariant(null);
        setStockToAdd("");
      }
    } catch (error) {
      console.error("Error updating variant stock:", error);
      enqueueSnackbar(error.message || "Failed to update stock", {
        variant: "error",
      });
    }
  };

  // Add this function to handle variant edit dialog open
  const handleEditVariantOpen = (variant) => {
    setEditVariantData(variant);
    
    // Convert attributes object to array format
    const attributesArray = [];
    if (variant.attributes) {
      if (variant.attributes.size) {
        attributesArray.push({ type: "size", value: variant.attributes.size });
      }
      if (variant.attributes.color) {
        attributesArray.push({ type: "color", value: variant.attributes.color });
      }
      if (variant.attributes.weight) {
        attributesArray.push({ type: "weight", value: variant.attributes.weight });
      }
      if (variant.attributes.hex) {
        attributesArray.push({ type: "hex", value: variant.attributes.hex });
      }
    }
    
    // If no attributes found, add default
    if (attributesArray.length === 0) {
      attributesArray.push({ type: "size", value: "" });
    }
    
    setVariantFormData({
      attributes: attributesArray,
      stock: variant.stock || "",
      price: variant.price || "",
      previousPrice: variant.previousPrice || "",
      offer: variant.offer || "",
      status: variant.status || "active",
      isDefault: variant.isDefault || false,
      min: variant.min || 1,
      pvCanonicalUrl: variant.pvCanonicalUrl || "",
      pvSchemaMarkup: variant.pvSchemaMarkup || "",
    });
    setEditVariantDialog(true);
  };

  // Add this function to handle variant edit submission
  const handleEditVariantSubmit = async (e) => {
    e.preventDefault();

    // Validate all required fields
    const errors = {};
    const hasValidAttribute = variantFormData.attributes.some(
      (attr) => attr.value && attr.value.trim() !== ""
    );
    if (!hasValidAttribute) {
      errors.attributes = "At least one attribute value is required";
    }
    
    // Validate that each attribute type is used only once
    const usedTypes = variantFormData.attributes
      .filter((attr) => attr.value && attr.value.trim() !== "")
      .map((attr) => attr.type);
    const uniqueTypes = [...new Set(usedTypes)];
    if (usedTypes.length !== uniqueTypes.length) {
      errors.attributes = "Each attribute type (size, color, weight, hex) can only be used once";
    }
    if (!variantFormData.stock || parseInt(variantFormData.stock) < 0) {
      errors.stock = "Valid stock value is required";
    }
    if (
      variantFormData.price !== "" &&
      variantFormData.price !== null &&
      typeof variantFormData.price !== "undefined" &&
      parseFloat(variantFormData.price) < 0
    ) {
      errors.price = "Valid price value is required";
    }
    if (
      !variantFormData.isDefault &&
      (!variantFormData.previousPrice ||
        parseFloat(variantFormData.previousPrice) <=
          parseFloat(variantFormData.price))
    ) {
      errors.previousPrice =
        "Previous price must be greater than current price";
    }

    // If there are validation errors, show them and stop submission
    if (Object.keys(errors).length > 0) {
      setVariantErrors(errors);
      return;
    }

    try {
      // Build attributes object from attributes array
      const attributes = {};
      variantFormData.attributes.forEach((attr) => {
        if (attr.value && attr.value.trim() !== "") {
          if (attr.type === "size") {
            attributes.size = attr.value;
          } else if (attr.type === "color") {
            attributes.color = attr.value;
          } else if (attr.type === "weight") {
            attributes.weight = attr.value;
          } else if (attr.type === "hex") {
            attributes.hex = attr.value;
          }
        }
      });

      const updatedData = {
        attributes,
        stock: Number(variantFormData.stock),
        price: !variantFormData.isDefault
          ? Number(variantFormData.previousPrice)
          : Number(variantFormData.price),
        previousPrice: !variantFormData.isDefault
          ? 0
          : Number(variantFormData.previousPrice),
        offer: Number(variantFormData.offer) || 0,
        status: variantFormData.status || "active",
        isDefault: variantFormData.isDefault || false,
        pvCanonicalUrl: variantFormData.pvCanonicalUrl || "",  
        pvSchemaMarkup: variantFormData.pvSchemaMarkup || "",
      };

      // Add optional fields only if they have values
      if (variantFormData.min && variantFormData.min !== "") {
        updatedData.min = Number(variantFormData.min);
      }

      const response = await variantApi.updateProductVariant(
        editVariantData._id,
        updatedData
      );
      if (response.success) {
        enqueueSnackbar("Variant updated successfully", { variant: "success" });
        fetchProductVariants(selectedProductForVariant._id);
        setEditVariantDialog(false);
        setEditVariantData(null);
        setVariantFormData({
          attributes: [{ type: productVariantType || "size", value: "" }],
          stock: "",
          price: "",
          previousPrice: "",
          offer: "",
          pvSchemaMarkup: "",
          pvCanonicalUrl: "",
          status: "active",
          isDefault: false,
          min: 1,
        });
      }
    } catch (error) {
      console.error("Error updating variant:", error);
      enqueueSnackbar(error.message || "Failed to update variant", {
        variant: "error",
      });
    }
  };

  // Update the delete variant function to open confirmation dialog
  const handleVariantDeleteClick = (variant) => {
    setVariantToDelete(variant);
    setDeleteVariantConfirmOpen(true);
  };

  // Add function to confirm variant deletion
  const handleConfirmDeleteVariant = async () => {
    if (variantToDelete) {
      try {
        setDeleteVariantLoading(true);
        const response = await variantApi.deleteProductVariant(
          variantToDelete._id
        );
        if (response.success) {
          enqueueSnackbar("Variant deleted successfully", {
            variant: "success",
          });
          fetchProductVariants(selectedProductForVariant._id);
        }
      } catch (error) {
        console.error("Error deleting variant:", error);
        enqueueSnackbar(error.message || "Failed to delete variant", {
          variant: "error",
        });
      } finally {
        setDeleteVariantLoading(false);
        setDeleteVariantConfirmOpen(false);
        setVariantToDelete(null);
      }
    }
  };

  // Add function to cancel variant deletion
  const handleCancelDeleteVariant = () => {
    setDeleteVariantConfirmOpen(false);
    setVariantToDelete(null);
  };

  // Add this function to calculate offer percentage from price and previous price
  const calculateOfferPercentage = (price, previousPrice) => {
    if (
      !previousPrice ||
      previousPrice <= 0 ||
      !price ||
      price <= 0 ||
      previousPrice <= price
    ) {
      return 0;
    }
    return Math.round(((previousPrice - price) / previousPrice) * 100);
  };

  // Update the useEffect hooks to handle the case where there's no previous price
  useEffect(() => {
    // Calculate offer when price or previousPrice changes for new variants
    if (
      !variantFormData.previousPrice ||
      parseFloat(variantFormData.previousPrice) <= 0
    ) {
      // If no previous price or invalid previous price, set offer to 0
      setVariantFormData((prev) => ({
        ...prev,
        offer: "0",
      }));
    } else if (
      variantFormData.price &&
      parseFloat(variantFormData.previousPrice) >
        parseFloat(variantFormData.price)
    ) {
      // Calculate offer only when previous price is greater than current price
      const prevPrice = parseFloat(variantFormData.previousPrice);
      const currentPrice = parseFloat(variantFormData.price);
      const calculatedOffer = calculateOfferPercentage(currentPrice, prevPrice);
      setVariantFormData((prev) => ({
        ...prev,
        offer: calculatedOffer.toString(),
      }));
    } else {
      // If previous price exists but isn't greater than current price, set offer to 0
      setVariantFormData((prev) => ({
        ...prev,
        offer: "0",
      }));
    }
  }, [variantFormData.price, variantFormData.previousPrice]);

  // Update the edit variant useEffect similarly
  useEffect(() => {
    if (editVariantData) {
      if (
        !variantFormData.previousPrice ||
        parseFloat(variantFormData.previousPrice) <= 0
      ) {
        // If no previous price or invalid previous price, set offer to 0
        setVariantFormData((prev) => ({
          ...prev,
          offer: "0",
        }));
      } else if (
        variantFormData.price &&
        parseFloat(variantFormData.previousPrice) >
          parseFloat(variantFormData.price)
      ) {
        // Calculate offer only when previous price is greater than current price
        const prevPrice = parseFloat(variantFormData.previousPrice);
        const currentPrice = parseFloat(variantFormData.price);
        const calculatedOffer = calculateOfferPercentage(
          currentPrice,
          prevPrice
        );
        setVariantFormData((prev) => ({
          ...prev,
          offer: calculatedOffer.toString(),
        }));
      } else {
        // If previous price exists but isn't greater than current price, set offer to 0
        setVariantFormData((prev) => ({
          ...prev,
          offer: "0",
        }));
      }
    }
  }, [editVariantData, variantFormData.price, variantFormData.previousPrice]);

  const activeProducts = allProducts.filter(p => p.pStatus === 'active').length;
  const inactiveProducts = allProducts.filter(p => p.pStatus !== 'active').length;

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-12 px-4 md:px-0">

      {/* ── Category Filter Banner ── */}
      {categoryFilter && (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-indigo-50/80 border border-indigo-100 rounded-2xl backdrop-blur-sm animate-fade-in">
          <Tag size={16} className="text-indigo-500 shrink-0" />
          <span className="text-sm font-bold text-slate-700">
            Filtering by category: <span className="text-indigo-600">{categoryFilter}</span>
          </span>
          <button
            onClick={handleClearFilter}
            className="ml-auto text-xs font-black text-indigo-600 bg-white border border-indigo-200 px-3 py-1.5 rounded-xl hover:bg-indigo-50 transition-all active:scale-95"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-in">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-[#0f172a] tracking-tight flex items-center gap-3">
            Store Products <Sparkles className="text-yellow-500 fill-yellow-500" size={24} />
          </h1>
          <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-500" />
            Manage your entire product catalogue from one place.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportToExcel}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-black text-slate-600 bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-sm hover:border-indigo-200 hover:text-indigo-600 transition-all active:scale-95 ring-1 ring-slate-900/5"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
          <button
            onClick={() => handleOpen()}
            className="flex items-center gap-2 bg-[#0f172a] text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Product</span>
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 animate-slide-in-right">
        {[
          {
            title: 'Total Products',
            value: allProducts.length,
            icon: Package,
            gradient: 'from-blue-500 to-indigo-600',
            trend: 'All Items',
            isPositive: true,
          },
          {
            title: 'Active Products',
            value: activeProducts,
            icon: CheckCircle,
            gradient: 'from-emerald-400 to-teal-600',
            trend: 'Live',
            isPositive: true,
          },
          {
            title: 'Inactive Products',
            value: inactiveProducts,
            icon: XCircle,
            gradient: 'from-rose-400 to-pink-600',
            trend: 'Paused',
            isPositive: false,
          },
          {
            title: 'Showing Now',
            value: totalProducts,
            icon: BarChart3,
            gradient: 'from-violet-500 to-purple-600',
            trend: 'Filtered',
            isPositive: true,
          },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="group relative bg-white/70 backdrop-blur-xl rounded-[2rem] p-6 border border-white/60 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500">
              <div className="flex items-start justify-between mb-8">
                <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg shadow-indigo-500/20 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                  <Icon size={24} />
                </div>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase ${
                  stat.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  <ArrowUpRight size={12} strokeWidth={3} />
                  {stat.trend}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">{stat.title}</p>
                <h3 className="text-3xl font-black text-[#0f172a] tracking-tight">{stat.value.toLocaleString()}</h3>
              </div>
              <div className="absolute bottom-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                <Icon size={80} strokeWidth={1} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main Table Card ── */}
      <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-sm overflow-hidden">

        {/* Table Header */}
        <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-[#0f172a] tracking-tight flex items-center gap-3">
              <ShoppingBag className="text-indigo-600" size={24} /> Product Catalogue
            </h2>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Full product inventory</p>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-3 text-sm font-medium bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all placeholder-slate-400"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">
                <th className="px-8 py-5">Product Details</th>
                <th className="px-8 py-5">Images</th>
                <th className="px-8 py-5">Category</th>
                <th className="px-8 py-5">Type</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                      <p className="text-slate-400 font-bold text-sm animate-pulse">Loading products...</p>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-slate-50 flex items-center justify-center rounded-[2rem] border border-white shadow-inner">
                        <Package className="text-slate-200" size={36} />
                      </div>
                      <h3 className="text-[#0f172a] font-black text-lg tracking-tight">No products found</h3>
                      <p className="text-slate-400 font-bold text-sm max-w-xs text-balance">Try adjusting your search or add a new product to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="group hover:bg-indigo-50/30 transition-all duration-300">

                    {/* Product Details */}
                    <td className="px-8 py-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-400 to-blue-600 flex items-center justify-center text-white font-black text-base shrink-0 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                          {(product.pName || 'P').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-[#0f172a] text-sm tracking-tight truncate max-w-[180px]">{product.pName}</p>
                          <p className="text-[11px] font-semibold text-slate-400 truncate max-w-[180px] mt-0.5">{product.pShortDescription}</p>
                          {product.pBrand && (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-wider">
                              <Tag size={8} /> {product.pBrand}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Images */}
                    <td className="px-8 py-5">
                      <div className="flex gap-1.5 flex-wrap">
                        {(product.pImage || []).slice(0, 3).map((image, index) => (
                          <div
                            key={index}
                            className="relative w-11 h-11 cursor-pointer rounded-xl overflow-hidden border-2 border-white shadow-md hover:scale-110 transition-transform duration-300"
                            onClick={() => handleImageClick(product.pImage)}
                          >
                            <img
                              src={image}
                              alt={`${product.pName} - ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/44?text=?'; }}
                            />
                            {index === 2 && product.pImage.length > 3 && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-[10px] font-black">
                                +{product.pImage.length - 3}
                              </div>
                            )}
                          </div>
                        ))}
                        {(!product.pImage || product.pImage.length === 0) && (
                          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center">
                            <LucideImage size={16} className="text-slate-300" />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1.5">
                        {product.pCategory && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[10px] font-black uppercase tracking-wider">
                            <Layers size={9} /> {product.pCategory}
                          </span>
                        )}
                        {product.pSubCategory && (
                          <span className="inline-flex px-2.5 py-0.5 bg-slate-50 text-slate-500 border border-slate-100 rounded-full text-[10px] font-bold">
                            {product.pSubCategory}
                          </span>
                        )}
                        {product.pNestedSubCategory && (
                          <span className="inline-flex px-2.5 py-0.5 bg-violet-50 text-violet-500 border border-violet-100 rounded-full text-[10px] font-bold">
                            {product.pNestedSubCategory}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-[10px] font-black uppercase tracking-wider">
                        <ShoppingBag size={9} /> {product.pType || 'product'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                        product.pStatus === 'active'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-rose-50 text-rose-500 border-rose-100'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          product.pStatus === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'
                        }`} />
                        {product.pStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <Tooltip title="Edit Product">
                          <span>
                            <button
                              onClick={() => handleOpen(product)}
                              disabled={!canWrite(PERMISSIONS.PRODUCTS)}
                              className="w-9 h-9 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-90 disabled:opacity-40 disabled:pointer-events-none"
                            >
                              <Edit3 size={15} />
                            </button>
                          </span>
                        </Tooltip>

                        <Tooltip title="Manage Variants">
                          <button
                            onClick={() => handleVariantDialogOpen(product)}
                            className="w-9 h-9 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-violet-600 hover:border-violet-200 transition-all shadow-sm active:scale-90"
                          >
                            <Layers size={15} />
                          </button>
                        </Tooltip>

                        <Tooltip
                          title={
                            <Box>
                              <Typography variant="body2">Created by: {product.createdBy || 'super admin'}</Typography>
                              <Typography variant="body2">Created on: {new Date(product.createdAt).toLocaleString()}</Typography>
                              <Typography variant="body2">Edited by: {product.editedBy || 'Not Edited'}</Typography>
                              {product.updatedAt && product.updatedAt !== product.createdAt && (
                                <Typography variant="body2">Last edited: {new Date(product.updatedAt).toLocaleString()}</Typography>
                              )}
                            </Box>
                          }
                        >
                          <button className="w-9 h-9 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-sky-600 hover:border-sky-200 transition-all shadow-sm active:scale-90">
                            <Info size={15} />
                          </button>
                        </Tooltip>

                        <Tooltip title="Delete Product">
                          <span>
                            <button
                              onClick={() => handleDeleteClick(product)}
                              disabled={!canDelete(PERMISSIONS.PRODUCTS)}
                              className="w-9 h-9 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm active:scale-90 disabled:opacity-40 disabled:pointer-events-none"
                            >
                              <Trash2 size={15} />
                            </button>
                          </span>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-slate-100 px-8">
          <TablePagination
            component="div"
            count={totalProducts}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{ fontWeight: 700, fontSize: '12px' }}
          />
        </div>
      </div>

      {open && (
      <div className="fixed top-[88px] left-0 md:left-72 right-0 bottom-0 bg-black/60 backdrop-blur-sm z-[999] flex items-start justify-center p-4 animate-fade-in overflow-y-auto" onClick={handleClose}>
        <div className="bg-white/95 backdrop-blur-xl border border-white/50 rounded-[2.5rem] w-full max-w-4xl shadow-[0_30px_60px_rgba(0,0,0,0.35)] overflow-hidden animate-scale-in my-8" onClick={e => e.stopPropagation()}>
          <form onSubmit={handleSubmit}>
            <div className="border-b border-slate-100 flex items-center justify-between py-6 px-8 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                  {editProduct ? <Edit3 size={24} /> : <Package size={24} />}
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#0f172a]">{editProduct ? "Edit Product Details" : "Add New Product"}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{editProduct ? "Modify existing item" : "Create new item in catalog"}</p>
                </div>
              </div>
              <button type="button" onClick={handleClose} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all shadow-sm">
                <X size={18} />
              </button>
            </div>
            <div className="p-8">
              <Box className="form-grid space-y-6 mt-4">
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Product Images
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Upload 3-15 images for your product. Minimum 3 images
                  required. Images are automatically compressed for faster
                  upload.
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(
                    (index) => (
                      <Box
                        key={index}
                        sx={{
                          position: "relative",
                          width: 150,
                          height: 150,
                          border: "2px dashed #ccc",
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          overflow: "hidden",
                          "&:hover .delete-icon": {
                            opacity: 1,
                          },
                        }}
                      >
                        {imagePreviews[index] ? (
                          <>
                            <img
                              src={
                                imagePreviews[index].startsWith("http")
                                  ? imagePreviews[index]
                                  : imagePreviews[index]
                              }
                              alt={`Product ${index + 1}`}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                            <IconButton
                              className="delete-icon"
                              sx={{
                                position: "absolute",
                                top: 5,
                                right: 5,
                                backgroundColor: "rgba(0, 0, 0, 0.5)",
                                color: "white",
                                opacity: 0,
                                transition: "opacity 0.2s",
                                "&:hover": {
                                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                                },
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveImage(index);
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </>
                        ) : (
                          <Box
                            onClick={() =>
                              imageInputRefs[index].current.click()
                            }
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <AddCircleOutlineIcon
                              sx={{ fontSize: 40, color: "text.secondary" }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Add Image
                            </Typography>
                          </Box>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          ref={imageInputRefs[index]}
                          style={{ display: "none" }}
                          onChange={(e) => handleImageUpload(e, index)}
                        />
                      </Box>
                    )
                  )}
                </Box>
                {errors.images && (
                  <Typography color="error" variant="caption" sx={{ mt: 1 }}>
                    {errors.images}
                  </Typography>
                )}
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={12}>
                  <TextField
                    className="form-field"
                    fullWidth
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    error={!!errors.name}
                    helperText={errors.name}
                  />
                </Grid>
              </Grid>

              <TextField
                className="form-field"
                fullWidth
                label="Short Description"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                required
                error={!!errors.shortDescription}
                helperText={
                  errors.shortDescription ||
                  "Brief summary (max 200 characters)"
                }
                inputProps={{ maxLength: 200 }}
              />

              <TextField
                className="form-field"
                fullWidth
                label="Full Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
                required
                error={!!errors.description}
                helperText={
                  errors.description || "Detailed product description"
                }
              />

              <FormControl className="form-field" fullWidth required>
                <InputLabel>Product Type</InputLabel>
                <Select
                  name="pType"
                  value={formData.pType}
                  onChange={handleChange}
                  label="Product Type"
                >
                  <MenuItem value="product">Product</MenuItem>
                  <MenuItem value="combo">Combo</MenuItem>
                </Select>
              </FormControl>

              <FormControl
                className="form-field"
                fullWidth
                required
                error={!!errors.category}
              >
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category || ""}
                  onChange={handleChange}
                  label="Category"
                >
                  {categories.length === 0 ? (
                    <MenuItem value="" disabled>
                      No categories available
                    </MenuItem>
                  ) : (
                    categories
                      .filter((category) => category.cStatus === "active")
                      .map((category) => (
                        <MenuItem key={category._id} value={category.cName}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {category.cImage && (
                              <Avatar
                                src={`${category.cImage}`}
                                alt={category.cName}
                                sx={{ width: 24, height: 24 }}
                              />
                            )}
                            <Typography>{category.cName}</Typography>
                          </Box>
                        </MenuItem>
                      ))
                  )}
                  <MenuItem
                    value="add_new_category"
                    sx={{
                      borderTop: "1px solid",
                      borderColor: "divider",
                      color: "primary.main",
                    }}
                  >
                    <AddCircleOutlineIcon sx={{ mr: 1 }} />
                    Add New Category
                  </MenuItem>
                </Select>
                {errors.category && (
                  <Typography className="error-text">
                    {errors.category}
                  </Typography>
                )}
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>Subcategory</InputLabel>
                <Select
                  value={formData.pSubCategory || ""}
                  name="pSubCategory"
                  label="Subcategory"
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "add_new_subcategory") {
                      setCategoryDialog(true);
                      return;
                    }
                    setFormData((prev) => ({
                      ...prev,
                      pSubCategory: value,
                      pNestedSubCategory: "", // Reset nested subcategory when subcategory changes
                    }));

                    // Fetch nested subcategories when a subcategory is selected
                    if (value) {
                      const category = categories.find(
                        (cat) => cat.cName === formData.category
                      );
                      if (category) {
                        const subcategory = category.subCategories?.find(
                          (sub) => sub.name === value
                        );
                        if (subcategory) {
                          fetchNestedSubCategories(
                            category._id,
                            subcategory._id
                          );
                        }
                      }
                    } else {
                      setNestedSubCategories([]);
                    }
                  }}
                >
                  <MenuItem value="">None</MenuItem>
                  {subcategories.map((subcat) => (
                    <MenuItem key={subcat._id} value={subcat.name}>
                      {subcat.name}
                    </MenuItem>
                  ))}
                  <MenuItem
                    value="add_new_subcategory"
                    sx={{
                      borderTop: "1px solid",
                      borderColor: "divider",
                      color: "primary.main",
                    }}
                  >
                    <AddCircleOutlineIcon sx={{ mr: 1 }} />
                    Add New Subcategory
                  </MenuItem>
                </Select>
              </FormControl>

              {/* <FormControl fullWidth margin="normal">
                <InputLabel>Nested Subcategory</InputLabel>
                <Select
                  value={formData.pNestedSubCategory || ""}
                  name="pNestedSubCategory"
                  label="Nested Subcategory"
                  onChange={handleChange}
                  disabled={!formData.pSubCategory}
                >
                  <MenuItem value="">None</MenuItem>
                  {nestedSubCategories.map((nestedSubcat) => (
                    <MenuItem key={nestedSubcat._id} value={nestedSubcat.name}>
                      {nestedSubcat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl> */}

              <FormControl
                className="form-field"
                fullWidth
                required
                error={!!errors.brand}
              >
                <InputLabel>Brand</InputLabel>
                <Select
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  label="Brand"
                >
                  {brands.length === 0 ? (
                    <MenuItem value="" disabled>
                      No brands available
                    </MenuItem>
                  ) : (
                    brands.map((brand) => (
                      <MenuItem key={brand._id} value={brand.name}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          {brand.logo && (
                            <img
                              src={brand.logo}
                              alt={brand.name}
                              style={{
                                width: 24,
                                height: 24,
                                objectFit: "contain",
                              }}
                            />
                          )}
                          <Typography>{brand.name}</Typography>
                        </Box>
                      </MenuItem>
                    ))
                  )}
                  <MenuItem
                    value=""
                    sx={{
                      borderTop: "1px solid",
                      borderColor: "divider",
                      color: "primary.main",
                    }}
                    onClick={() => setBrandDialog(true)}
                  >
                    <AddIcon sx={{ mr: 1 }} />
                    Manage Brands
                  </MenuItem>
                </Select>
                {errors.brand && (
                  <FormHelperText error>{errors.brand}</FormHelperText>
                )}
              </FormControl>

              <TextField
                className="form-field"
                fullWidth
                label="Tax (%)"
                name="tax"
                type="number"
                value={formData.tax}
                onChange={handleChange}
                required
                InputProps={{
                  inputProps: { min: 0, max: 100 },
                }}
              />

              <TextField
                className="form-field"
                fullWidth
                label="Meta title"
                name="pMetaTitle"
                type="string"
                value={formData.pMetaTitle}
                onChange={handleChange}
                // required
                InputProps={{
                  inputProps: { min: 0, max: 100 },
                }}
              />
              <TextField
                className="form-field"
                fullWidth
                label="Meta keywords"
                name="pMetaKeywords"
                type="string"
                value={formData.pMetaKeywords}
                onChange={handleChange}
                // required
                InputProps={{
                  inputProps: { min: 0, max: 100 },
                }}
              />
              <TextField
                className="form-field"
                fullWidth
                label="Meta description"
                name="pMetaDescription"
                type="string"
                value={formData.pMetaDescription}
                onChange={handleChange}
                // required
                InputProps={{
                  inputProps: { min: 0, max: 100 },
                }}
              />
              <TextField
                className="form-field"
                fullWidth
                label="Canonical URL"
                name="pCanonicalUrl"
                type="string"
                value={formData.pCanonicalUrl}
                onChange={handleChange}
                // required 
                InputProps={{
                  inputProps: { min: 0, max: 100 },
                }}
              />
              <TextField
                className="form-field"
                fullWidth
                label="URL"
                name="pUrl"
                type="string"
                value={formData.pUrl}
                onChange={handleChange}
                // required 
                InputProps={{
                  inputProps: { min: 0, max: 100 },
                }}
              />
              <TextField
                className="form-field"
                fullWidth
                label="Schema Markup"
                name="schemaMarkup"
                type="string"
                value={formData.schemaMarkup}
                onChange={handleChange}
                // required 
                InputProps={{
                  inputProps: { min: 0, max: 100 },
                }}
              />


              <FormControl className="form-field" fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                </Select>
              </FormControl>

              <FormControl className="form-field" fullWidth required>
                <InputLabel>Return Policy</InputLabel>
                <Select
                  name="return"
                  value={formData.return}
                  onChange={handleChange}
                  label="Return Policy"
                >
                  <MenuItem value="no">No Return</MenuItem>
                  <MenuItem value="yes">Return Allowed</MenuItem>
                </Select>
              </FormControl>

              {formData.return === "yes" && (
                <TextField
                  className="form-field"
                  fullWidth
                  label="Return Days"
                  name="returnDays"
                  type="number"
                  value={formData.returnDays}
                  onChange={handleChange}
                  required
                  InputProps={{
                    inputProps: { min: 1 },
                  }}
                  error={!!errors.returnDays}
                  helperText={errors.returnDays || "Number of days for return"}
                />
              )}

              <Box className="form-field">
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Voucher Options
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="pis_voucher_50"
                      checked={formData.pis_voucher_50}
                      onChange={handleChange}
                    />
                  }
                  label="50 Voucher"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                        name="pis_voucher_100"
                      checked={formData.pis_voucher_100}
                      onChange={handleChange}
                    />
                  }
                  label="100 Voucher"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      name="freeshipping"
                      checked={formData.freeshipping}
                      onChange={handleChange}
                    />
                  }
                  label="Free Shipping"
                />
              </Box>
            </Box>
          </div>
          <div className="border-t border-slate-100 p-6 flex justify-end gap-3 bg-slate-50/50">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-all shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={categories.length === 0 || loading}
              className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <CircularProgress size={16} color="inherit" />
                  <span>{editProduct ? "Updating..." : "Creating..."}</span>
                </>
              ) : (
                <span>{editProduct ? "Update Product" : "Add Product"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    )}

      {/* Add Brand Dialog */}
      <Dialog
        open={brandDialog}
        onClose={() => {
          setBrandDialog(false);
          setBrandPreviewLogo("");
          setNewBrand({
            name: "",
            description: "",
            logo: "",
          });
          setBrandErrors({});
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            borderRadius: '2rem',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
          }
        }}
      >
        <DialogTitle className="border-b border-slate-100 flex items-center gap-3 py-6 px-8">
          <div className="w-10 h-10 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-600">
            <PlusCircle size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#0f172a]">Add New Brand</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Create a new product brand</p>
          </div>
        </DialogTitle>
        <DialogContent className="p-8">
          <Box className="form-grid">
            <Box
              className={`image-upload-container ${
                brandErrors.logo ? "has-error" : ""
              }`}
              onClick={() => brandLogoRef.current.click()}
              sx={{
                backgroundImage: brandPreviewLogo
                  ? `url(${brandPreviewLogo})`
                  : "none",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                cursor: "pointer",
                border: "2px dashed #ccc",
                borderRadius: "8px",
                height: "150px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                mt: 2,
                mb: 2,
              }}
            >
              {!brandPreviewLogo && (
                <>
                  <CloudUploadIcon sx={{ fontSize: 40, color: "text.secondary" }} />
                  <Typography variant="body2" color="textSecondary">
                    Click to upload logo
                  </Typography>
                </>
              )}
            </Box>
            <input
              type="file"
              ref={brandLogoRef}
              hidden
              accept="image/*"
              onChange={handleBrandLogoChange}
            />
            {brandErrors.logo && (
              <Typography color="error" variant="caption" sx={{ ml: 2 }}>
                {brandErrors.logo}
              </Typography>
            )}

            <TextField
              fullWidth
              label="Brand Name"
              value={newBrand.name}
              onChange={(e) =>
                setNewBrand({ ...newBrand, name: e.target.value })
              }
              error={!!brandErrors.name}
              helperText={brandErrors.name}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={newBrand.description}
              onChange={(e) =>
                setNewBrand({ ...newBrand, description: e.target.value })
              }
              error={!!brandErrors.description}
              helperText={brandErrors.description}
              multiline
              rows={3}
              margin="normal"
            />
            {brandErrors.submit && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {brandErrors.submit}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions className="border-t border-slate-100 p-6 flex justify-end gap-3 bg-slate-50/50">
          <button 
            type="button"
            className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-all shadow-sm"
            onClick={() => setBrandDialog(false)}
          >
            Cancel
          </button>
          <button
            onClick={handleAddBrand}
            disabled={loading}
            className="px-6 py-2.5 text-sm font-bold text-white bg-pink-600 hover:bg-pink-700 rounded-2xl transition-all shadow-lg shadow-pink-200 flex items-center gap-2"
          >
            {loading ? <CircularProgress size={16} color="inherit" /> : null}
            <span>Add Brand</span>
          </button>
        </DialogActions>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog
        open={categoryDialog}
        onClose={() => {
          setCategoryDialog(false);
          setCategoryPreviewImage("");
          setNewCategory({
            name: "",
            description: "",
            image: "",
            status: "active",
          });
          setCategoryErrors({});
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            borderRadius: '2rem',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
          }
        }}
      >
        <DialogTitle className="border-b border-slate-100 flex items-center gap-3 py-6 px-8">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <PlusCircle size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#0f172a]">Add New Category</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Create a new product category</p>
          </div>
        </DialogTitle>
        <DialogContent className="p-8">
          <Box className="form-grid">
            <Box
              className={`image-upload-container ${
                categoryErrors.image ? "has-error" : ""
              }`}
              onClick={() => categoryImageRef.current.click()}
              sx={{
                backgroundImage: categoryPreviewImage
                  ? `url(${categoryPreviewImage})`
                  : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
                cursor: "pointer",
                height: 200,
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: "2px dashed",
                borderColor: categoryErrors.image ? "error.main" : "divider",
                borderRadius: 1,
                "&:hover": {
                  borderColor: "primary.main",
                  opacity: 0.8,
                },
              }}
            >
              {!categoryPreviewImage && (
                <>
                  <CloudUploadIcon className="image-upload-icon" />
                  <Typography className="image-upload-text">
                    Click to upload image
                  </Typography>
                </>
              )}
              {categoryErrors.image && (
                <Typography className="error-text">
                  {categoryErrors.image}
                </Typography>
              )}
            </Box>

            <input
              type="file"
              ref={categoryImageRef}
              hidden
              accept="image/*"
              onChange={handleCategoryImageUpload}
            />

            <TextField
              fullWidth
              label="Category Name"
              value={newCategory.name}
              onChange={(e) =>
                setNewCategory({ ...newCategory, name: e.target.value })
              }
              error={!!categoryErrors.name}
              helperText={categoryErrors.name}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Description"
              value={newCategory.description}
              onChange={(e) =>
                setNewCategory({ ...newCategory, description: e.target.value })
              }
              error={!!categoryErrors.description}
              helperText={categoryErrors.description}
              multiline
              rows={3}
              margin="normal"
            />

            {categoryErrors.submit && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {categoryErrors.submit}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions className="border-t border-slate-100 p-6 flex justify-end gap-3 bg-slate-50/50">
          <button 
            type="button"
            className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-all shadow-sm"
            onClick={() => setCategoryDialog(false)}
          >
            Cancel
          </button>
          <button
            onClick={handleAddNewCategory}
            disabled={loading}
            className="px-6 py-2.5 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-2xl transition-all shadow-lg shadow-amber-200 flex items-center gap-2"
          >
            {loading ? <CircularProgress size={16} color="inherit" /> : null}
            <span>Add Category</span>
          </button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={imagePreviewDialog}
        onClose={() => setImagePreviewDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            minHeight: "60vh",
          },
        }}
      >
        <DialogTitle
          className="dialog-title"
          sx={{
            borderBottom: "1px solid",
            borderColor: "divider",
            pb: 2,
          }}
        >
          <Typography variant="h6" component="span">
            Product Images
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            {`${currentImageIndex + 1} of ${selectedImages.length}`}
          </Typography>
        </DialogTitle>
        <DialogContent
          className="dialog-content"
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            p: 4,
          }}
        >
          <Box
            className="image-preview-container"
            sx={{
              position: "relative",
              marginTop: "10px",
              width: "100%",
              height: "300px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <IconButton
              sx={{
                position: "absolute",
                left: 0,
                backgroundColor: "rgba(0,0,0,0.1)",
                "&:hover": {
                  backgroundColor: "rgba(0,0,0,0.2)",
                },
              }}
              onClick={handlePrevImage}
            >
              <NavigateBeforeIcon />
            </IconButton>
            <img
              src={selectedImages[currentImageIndex]}
              alt="Product"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                borderRadius: 8,
              }}
            />
            <IconButton
              sx={{
                position: "absolute",
                right: 0,
                backgroundColor: "rgba(0,0,0,0.1)",
                "&:hover": {
                  backgroundColor: "rgba(0,0,0,0.2)",
                },
              }}
              onClick={handleNextImage}
            >
              <NavigateNextIcon />
            </IconButton>
          </Box>
        </DialogContent>
        <DialogActions
          className="dialog-actions"
          sx={{
            borderTop: "1px solid",
            borderColor: "divider",
            p: 2,
            gap: 1,
          }}
        >
          <Button
            variant="outlined"
            onClick={() => setImagePreviewDialog(false)}
            startIcon={<CloseIcon />}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={stockDialogOpen}
        onClose={() => setStockDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="dialog-title">Add Stock</DialogTitle>
        <DialogContent className="dialog-content">
          <Box className="form-grid">
            <TextField
              className="form-field"
              fullWidth
              label="Stock to Add"
              name="stockToAdd"
              type="number"
              value={stockToAdd}
              onChange={(e) => setStockToAdd(e.target.value)}
              required
              error={!!stockError}
              helperText={stockError}
            />
          </Box>
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button
            className="dialog-button"
            onClick={() => setStockDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button className="dialog-button" onClick={handleStockSubmit}>
            Add Stock
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={handleCancelDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the product "
            {productToDelete?.pName}"? This will also delete all associated
            variants.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCancelDelete}
            color="primary"
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            startIcon={
              deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />
            }
            disabled={deleteLoading}
          >
            {deleteLoading ? "Deleting..." : "Delete Product & Variants"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Variant Dialog */}
      <Dialog
        open={variantDialogOpen}
        onClose={() => setVariantDialogOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{ left: { xs: 0, md: '288px' } }}
        PaperProps={{
          style: {
            borderRadius: '2rem',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
          }
        }}
      >
        <DialogTitle className="border-b border-slate-100 flex items-center justify-between py-6 px-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#0f172a]">Product Variants</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{selectedProductForVariant?.pName}</p>
            </div>
          </div>
          <button 
            onClick={() => setVariantDialogOpen(false)}
            className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <XCircle size={20} />
          </button>
        </DialogTitle>
        <DialogContent className="p-8">
          <Box className="space-y-6 mt-4">
            <Typography variant="h6" gutterBottom>
              Total Available Stock: {calculateTotalStock(variants)}
            </Typography>
<form onSubmit={handleVariantSubmit}>
  <Grid container spacing={3}>
    {/* Attributes Section */}
    <Grid item xs={12}>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
        Variant Attributes
      </Typography>
      {variantFormData.attributes.map((attr, index) => {
        const availableTypes = ["size", "color", "weight", "hex"];
        const usedTypes = variantFormData.attributes
          .map((a, i) => i !== index && a.value ? a.type : null)
          .filter(Boolean);
        const availableTypesForThis = availableTypes.filter(
          (type) => !usedTypes.includes(type)
        );

        return (
          <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth>
                <InputLabel>Attribute Type</InputLabel>
                <Select
                  value={attr.type}
                  onChange={(e) => handleAttributeChange(index, "type", e.target.value)}
                  label="Attribute Type"
                >
                  {availableTypesForThis.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Autocomplete
                freeSolo
                options={typeOptions[attr.type] || []}
                value={attr.value || ""}
                onChange={(event, newValue) =>
                  handleAttributeChange(index, "value", newValue || "")
                }
                onInputChange={(event, newInputValue) =>
                  handleAttributeChange(index, "value", newInputValue || "")
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label={`${
                      attr.type.charAt(0).toUpperCase() + attr.type.slice(1)
                    } Value`}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={2} md={2}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", height: "100%" }}>
                {variantFormData.attributes.length > 1 && (
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveAttribute(index)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
                {index === variantFormData.attributes.length - 1 && (
                  <IconButton
                    color="primary"
                    onClick={handleAddAttribute}
                    size="small"
                    title="Add another attribute"
                  >
                    <AddIcon />
                  </IconButton>
                )}
              </Box>
            </Grid>
          </Grid>
        );
      })}
      {variantErrors.attributes && (
        <Typography color="error" variant="caption" sx={{ mt: 1, display: "block" }}>
          {variantErrors.attributes}
        </Typography>
      )}
    </Grid>

    {/* Stock */}
    <Grid item xs={12} sm={6} md={4}>
      <TextField
        fullWidth
        label="Stock"
        type="number"
        value={variantFormData.stock}
        onChange={(e) =>
          setVariantFormData((prev) => ({
            ...prev,
            stock: e.target.value,
          }))
        }
        required
        inputProps={{ min: 0 }}
      />
    </Grid>

    {/* Minimum Quantity */}
    <Grid item xs={12} sm={6} md={4}>
      <TextField
        fullWidth
        label="Minimum Quantity"
        type="number"
        value={variantFormData.min}
        onChange={(e) =>
          setVariantFormData((prev) => ({
            ...prev,
            min: e.target.value,
          }))
        }
        inputProps={{ min: 1 }}
        // helperText="Optional; backend default will be used if left empty"
      />
    </Grid>

    {/* MRP */}
    <Grid item xs={12} sm={6} md={4}>
      <TextField
        fullWidth
        label="MRP"
        name="previousPrice"
        type="number"
        value={variantFormData.previousPrice}
        onChange={(e) => {
          const newPrev = parseFloat(e.target.value);
          const curr = parseFloat(variantFormData.price);

          setVariantFormData((prev) => ({
            ...prev,
            previousPrice: newPrev,
            offer:
              curr && newPrev > curr
                ? (((newPrev - curr) / newPrev) * 100).toFixed(2)
                : 0,
          }));
        }}
        inputProps={{ min: 0 }}
        required
      />
    </Grid>

    {/* Offer Price */}
    <Grid item xs={12} sm={6} md={4}>
      <TextField
        fullWidth
        label="Offer Price"
        type="number"
        value={variantFormData.price}
        onChange={(e) => {
          const newPrice = parseFloat(e.target.value);
          const prev = parseFloat(variantFormData.previousPrice);

          setVariantFormData((prevState) => ({
            ...prevState,
            price: newPrice,
            offer:
              prev && newPrice < prev
                ? (((prev - newPrice) / prev) * 100).toFixed(2)
                : 0,
          }));
        }}
        inputProps={{ min: 0 }}
      />
    </Grid>

    {/* Offer (%) */}
    <Grid item xs={12} sm={6} md={4}>
      <TextField
        fullWidth
        label="Offer (%)"
        name="offer"
        value={variantFormData.offer}
        disabled
        type="number"
        InputProps={{
          inputProps: { min: 0, max: 100 },
        }}
        helperText="Calculated automatically"
      />
    </Grid>

    {/* Status */}
    <Grid item xs={12} sm={6} md={4}>
      <FormControl fullWidth>
        <InputLabel>Status</InputLabel>
        <Select
          value={variantFormData.status}
          onChange={(e) =>
            setVariantFormData((prev) => ({
              ...prev,
              status: e.target.value,
            }))
          }
          label="Status"
        >
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </Select>
      </FormControl>

      <FormControlLabel
        control={
          <Checkbox
            checked={variantFormData.isDefault}
            onChange={(e) =>
              setVariantFormData((prev) => ({
                ...prev,
                isDefault: e.target.checked,
              }))
            }
          />
        }
        label="Offer this variant as default"
      />
    </Grid>

    {/* SEO Meta Fields Section */}
    <Grid item xs={12}>
      <Typography variant="h6" sx={{ mt: 2, mb: 1, borderBottom: '1px solid #eee', pb: 1 }}>
        Variant SEO & Meta Information
      </Typography>
    </Grid>


    {/* Canonical URL */}
    <Grid item xs={12} sm={6} md={4}>
      <TextField
        fullWidth
        label="Canonical URL"
        name="pvCanonicalUrl"
        value={variantFormData.pvCanonicalUrl || ''}
        onChange={(e) =>
          setVariantFormData((prev) => ({
            ...prev,
            pvCanonicalUrl: e.target.value,
          }))
        }
        type="text"
        helperText="Preferred URL for this variant"
      />
    </Grid>
    
    <Grid item xs={12} sm={6} md={4}>
      <TextField
        fullWidth
        label="Schema"
        name="pvSchemaMarkup"
        value={variantFormData.pvSchemaMarkup || ''}
        onChange={(e) =>
          setVariantFormData((prev) => ({
            ...prev,
            pvSchemaMarkup: e.target.value,
          }))
        }
        type="text"
        helperText="Preferred schema for this variant"
      />
      
    </Grid>

    {/* Submit */}
    <Grid item xs={12}>
      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={addVariantLoading}
        startIcon={
          addVariantLoading ? <CircularProgress size={20} /> : null
        }
      >
        {addVariantLoading ? "Adding..." : "Add Variant"}
      </Button>
    </Grid>
  </Grid>
</form>
            {/* Variants List */}
            <TableContainer component={Paper} sx={{ mt: 4 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Attributes</TableCell>
                    <TableCell>Types</TableCell>
                    <TableCell>Stock</TableCell>
                    {/* <TableCell>Total Stock</TableCell> */}
                    <TableCell>Price</TableCell>
                    <TableCell>MRP Price</TableCell>
                    <TableCell>Offer (%)</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {variantLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : variants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No variants found
                      </TableCell>
                    </TableRow>
                  ) : (
                    variants.map((variant) => {
                      const variantDisplayValue = getVariantDisplayValue(variant.attributes);
                      const variantTypeDisplay = getVariantTypeDisplay(variant.attributes);
                      return (
                        <TableRow key={variant._id}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {variantDisplayValue}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={variantTypeDisplay}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{variant.stock || 0}</TableCell>
                          {/* <TableCell>{variant.totalStock}</TableCell> */}
                          <TableCell>₹{variant.price || 0}</TableCell>
                          <TableCell>₹{variant.previousPrice == "0" ? variant.price : variant.previousPrice}</TableCell>
                          <TableCell>{variant.offer || 0}%</TableCell>
                          <TableCell>
                            <Chip
                              label={variant.status || "active"}
                              color={
                                variant.status === "active" ? "success" : "error"
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Tooltip title="Edit Variant">
                                <IconButton
                                  color="primary"
                                  size="small"
                                  onClick={() => handleEditVariantOpen(variant)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Variant">
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() =>
                                    handleVariantDeleteClick(variant)
                                  }
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVariantDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Variant Stock Dialog */}
      <Dialog
        open={variantStockDialog}
        onClose={() => setVariantStockDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Stock to Variant</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Variant: {getVariantTypeDisplay(selectedVariant?.attributes)} - {getVariantDisplayValue(selectedVariant?.attributes)}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Stock: {selectedVariant?.stock}
            </Typography>
            <TextField
              fullWidth
              label="Stock to Add"
              type="number"
              value={stockToAdd}
              onChange={(e) => setStockToAdd(e.target.value)}
              error={!!stockError}
              helperText={stockError}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVariantStockDialog(false)}>Cancel</Button>
          <Button
            onClick={handleVariantStockSubmit}
            variant="contained"
            color="primary"
          >
            Add Stock
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Variant Edit Dialog */}
      <Dialog
        open={editVariantDialog}
        onClose={() => {
          setEditVariantDialog(false);
          setEditVariantData(null);
        }}
        maxWidth="md"
        fullWidth
        sx={{ left: { xs: 0, md: '288px' } }}
        PaperProps={{
          style: {
            borderRadius: '2rem',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
          }
        }}
      >
        <DialogTitle className="border-b border-slate-100 flex items-center gap-3 py-6 px-8">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Edit3 size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#0f172a]">Edit Variant</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Modify product variant details</p>
          </div>
        </DialogTitle>
        <DialogContent className="p-8">
          <Box className="space-y-6 mt-4">
<form onSubmit={handleEditVariantSubmit}>
  <Grid container spacing={3}>
    {/* Attributes Section for Edit */}
    <Grid item xs={12}>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
        Variant Attributes
      </Typography>
      {variantFormData.attributes.map((attr, index) => {
        const availableTypes = ["size", "color", "weight", "hex"];
        const usedTypes = variantFormData.attributes
          .map((a, i) => i !== index && a.value ? a.type : null)
          .filter(Boolean);
        const availableTypesForThis = availableTypes.filter(
          (type) => !usedTypes.includes(type)
        );

        return (
          <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth>
                <InputLabel>Attribute Type</InputLabel>
                <Select
                  value={attr.type}
                  onChange={(e) => handleAttributeChange(index, "type", e.target.value)}
                  label="Attribute Type"
                >
                  {availableTypesForThis.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Autocomplete
                freeSolo
                options={typeOptions[attr.type] || []}
                value={attr.value || ""}
                onChange={(event, newValue) =>
                  handleAttributeChange(index, "value", newValue || "")
                }
                onInputChange={(event, newInputValue) =>
                  handleAttributeChange(index, "value", newInputValue || "")
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label={`${
                      attr.type.charAt(0).toUpperCase() + attr.type.slice(1)
                    } Value`}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={2} md={2}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", height: "100%" }}>
                {variantFormData.attributes.length > 1 && (
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveAttribute(index)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
                {index === variantFormData.attributes.length - 1 && (
                  <IconButton
                    color="primary"
                    onClick={handleAddAttribute}
                    size="small"
                    title="Add another attribute"
                  >
                    <AddIcon />
                  </IconButton>
                )}
              </Box>
            </Grid>
          </Grid>
        );
      })}
      {variantErrors.attributes && (
        <Typography color="error" variant="caption" sx={{ mt: 1, display: "block" }}>
          {variantErrors.attributes}
        </Typography>
      )}
    </Grid>

    {/* Stock */}
    <Grid item xs={12} sm={6} md={4}>
      <TextField
        fullWidth
        label="Stock"
        type="number"
        value={variantFormData.stock}
        onChange={(e) =>
          setVariantFormData((prev) => ({
            ...prev,
            stock: e.target.value,
          }))
        }
        inputProps={{ min: 0 }}
        required
      />
    </Grid>

    {/* Minimum Quantity */}
    <Grid item xs={12} sm={6} md={4}>
      <TextField
        fullWidth
        label="Minimum Quantity"
        type="number"
        value={variantFormData.min}
        onChange={(e) =>
          setVariantFormData((prev) => ({
            ...prev,
            min: e.target.value,
          }))
        }
        inputProps={{ min: 1 }}
        helperText="Optional; backend default will be used if left empty"
      />
    </Grid>

    {/* Offer Price */}
    <Grid item xs={12} sm={6} md={4}>
      <TextField
        fullWidth
        label="Offer Price"
        type="number"
        value={variantFormData.price}
        onChange={(e) => {
          const newPrice = parseFloat(e.target.value);
          const prev = parseFloat(variantFormData.previousPrice);

          setVariantFormData((prevState) => ({
            ...prevState,
            price: newPrice,
            offer:
              prev && newPrice < prev
                ? (((prev - newPrice) / prev) * 100).toFixed(2)
                : 0,
          }));
        }}
        inputProps={{ min: 0 }}
      />
    </Grid>

    {/* MRP */}
    <Grid item xs={12} sm={6} md={4}>
      <TextField
        fullWidth
        label="MRP"
        type="number"
        value={variantFormData.previousPrice}
        onChange={(e) => {
          const prev = parseFloat(e.target.value);
          const price = parseFloat(variantFormData.price);
          setVariantFormData((prevState) => ({
            ...prevState,
            previousPrice: prev,
            offer:
              price && prev > price
                ? (((prev - price) / prev) * 100).toFixed(2)
                : 0,
          }));
        }}
        inputProps={{ min: 0 }}
      />
    </Grid>

    {/* Offer (%) */}
    <Grid item xs={12} sm={6} md={4}>
      <TextField
        fullWidth
        label="Offer (%)"
        name="offer"
        value={variantFormData.offer}
        disabled
        type="number"
        InputProps={{
          inputProps: { min: 0, max: 100 },
        }}
        helperText="Calculated automatically"
      />
    </Grid>

    {/* Status */}
    <Grid item xs={12} sm={6} md={4}>
      <FormControl fullWidth>
        <InputLabel>Status</InputLabel>
        <Select
          value={variantFormData.status}
          onChange={(e) =>
            setVariantFormData((prev) => ({
              ...prev,
              status: e.target.value,
            }))
          }
          label="Status"
        >
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </Select>
      </FormControl>
    </Grid>

    {/* Default Checkbox */}
    <Grid item xs={12} sm={6} md={4}>
      <FormControlLabel
        control={
          <Checkbox
            checked={variantFormData.isDefault}
            onChange={(e) =>
              setVariantFormData((prev) => ({
                ...prev,
                isDefault: e.target.checked,
              }))
            }
          />
        }
        label="Is Default Variant"
      />
    </Grid>

    {/* SEO Meta Fields Section */}
    <Grid item xs={12}>
      <Typography variant="h6" sx={{ mt: 2, mb: 1, borderBottom: '1px solid #eee', pb: 1 }}>
        Variant SEO & Meta Information
      </Typography>
    </Grid>



    {/* Canonical URL */}
    <Grid item xs={12} sm={6} md={4}>
      <TextField
        fullWidth
        label="Canonical URL"
        name="pvCanonicalUrl"
        value={variantFormData.pvCanonicalUrl || ''}
        onChange={(e) =>
          setVariantFormData((prev) => ({
            ...prev,
            pvCanonicalUrl: e.target.value,
          }))
        }
        type="text"
        helperText="Preferred URL for this variant"
      />
    </Grid>

        <Grid item xs={12} sm={6} md={4}>
      <TextField
        fullWidth
        label="Schema Markup"
        name="pvSchemaMarkup"
        value={variantFormData.pvSchemaMarkup || ''}
        onChange={(e) =>
          setVariantFormData((prev) => ({
            ...prev,
            pvSchemaMarkup: e.target.value,
          }))
        }
        type="text"
        helperText="Preferred schema for this variant"
      />
    </Grid>

    {/* Buttons */}
    <Grid item xs={12}>
      <div className="flex gap-3 justify-end pt-6 mt-4 border-t border-slate-100">
        <button
          type="button"
          className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-all shadow-sm"
          onClick={() => {
            setEditVariantDialog(false);
            setEditVariantData(null);
          }}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
        >
          Update Variant
        </button>
      </div>
    </Grid>
  </Grid>
</form>

          </Box>
        </DialogContent>
      </Dialog>

      {/* Add Variant Delete Confirmation Dialog */}
      <Dialog
        open={deleteVariantConfirmOpen}
        onClose={handleCancelDeleteVariant}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the variant "{getVariantDisplayValue(variantToDelete?.attributes)}
            " ({getVariantTypeDisplay(variantToDelete?.attributes)})?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCancelDeleteVariant}
            color="primary"
            disabled={deleteVariantLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDeleteVariant}
            color="error"
            startIcon={
              deleteVariantLoading ? (
                <CircularProgress size={20} />
              ) : (
                <DeleteIcon />
              )
            }
            disabled={deleteVariantLoading}
          >
            {deleteVariantLoading ? "Deleting..." : "Delete Variant"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Products;
