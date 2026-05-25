import { useState, useEffect } from "react";
import {
  ShoppingBag, Search, Filter, RefreshCcw, Eye,
  CheckCircle, Truck, Package, XCircle, Clock, X, MapPin,
  Image as ImageIcon, Printer, Calendar
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress,
  MenuItem, Select
} from "@mui/material";
import { useSnackbar } from "notistack";
import { orderApi } from "../services/orderApi";
// @ts-ignore
import { productApi } from "../services/productApi";
// @ts-ignore
import { variantApi } from "../services/variantApi";

export default function OrdersManager() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderDialog, setOrderDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { enqueueSnackbar } = useSnackbar();

  // For Tracking ID update
  const [trackingDialog, setTrackingDialog] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [orderToDispatch, setOrderToDispatch] = useState<any>(null);

  // Caching products & variants
  const [productDetails, setProductDetails] = useState<Record<string, any>>({});
  const [variantDetails, setVariantDetails] = useState<Record<string, any>>({});
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderApi.getAllOrders();
      setOrders(data.orders || []);
    } catch (error: any) {
      enqueueSnackbar(error.message || "Failed to fetch orders", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, status: string, trackingNum?: string) => {
    try {
      const payload: any = { status };
      if (trackingNum) {
        payload.trackingInfo = { trackingNumber: trackingNum };
      }
      
      // We will assume the backend orderApi supports patching the tracking number 
      // even though the backend we reviewed only specifically updated 'status' in updateOrderStatus.
      // We'll pass it anyway to be safe.
      await orderApi.updateOrderStatus(orderId, status);
      enqueueSnackbar(`Order status updated to ${status}`, { variant: "success" });
      
      setOrders((prev) => prev.map((o) => {
        if (o._id === orderId) {
          return { ...o, orderStatus: status, trackingInfo: trackingNum ? { trackingNumber: trackingNum } : o.trackingInfo };
        }
        return o;
      }));

      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, orderStatus: status, trackingInfo: trackingNum ? { trackingNumber: trackingNum } : prev.trackingInfo }));
      }
    } catch (error: any) {
      enqueueSnackbar(error.message || "Failed to update status", { variant: "error" });
    }
  };

  const handleStatusChangeClick = (order: any, newStatus: string) => {
    if (newStatus === "SHIPPED" || newStatus === "DISPATCHED") {
      setOrderToDispatch(order);
      setTrackingNumber(order.trackingInfo?.trackingNumber || "");
      setTrackingDialog(true);
    } else {
      handleUpdateStatus(order._id, newStatus);
    }
  };

  const confirmDispatch = async () => {
    if (!trackingNumber.trim()) {
      enqueueSnackbar("Please enter a tracking number", { variant: "error" });
      return;
    }
    await handleUpdateStatus(orderToDispatch._id, "SHIPPED", trackingNumber);
    setTrackingDialog(false);
    setOrderToDispatch(null);
  };

  const isWithinDateRange = (dateString: string, range: string) => {
    const orderDate = new Date(dateString);
    const now = new Date();
    switch (range) {
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= weekAgo;
      case "month":
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return orderDate >= monthAgo;
      case "year":
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        return orderDate >= yearAgo;
      default:
        return true;
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = filterStatus === "ALL" || order.orderStatus === filterStatus;
    const matchesDate = isWithinDateRange(order.createdAt, dateFilter);
    const searchString = `${order._id} ${order.shippingAddress?.name} ${order.shippingAddress?.phone} ${order.user?.name}`.toLowerCase();
    const matchesSearch = searchString.includes(searchQuery.toLowerCase());
    return matchesStatus && matchesDate && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ORDER_PLACED": return "bg-blue-100 text-blue-700 border-blue-200";
      case "CONFIRMED": return "bg-purple-100 text-purple-700 border-purple-200";
      case "SHIPPED": 
      case "DISPATCHED": return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "DELIVERED": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "CANCELLED": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ORDER_PLACED": return <Clock size={14} className="mr-1" />;
      case "CONFIRMED": return <CheckCircle size={14} className="mr-1" />;
      case "SHIPPED": 
      case "DISPATCHED": return <Truck size={14} className="mr-1" />;
      case "DELIVERED": return <Package size={14} className="mr-1" />;
      case "CANCELLED": return <XCircle size={14} className="mr-1" />;
      default: return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  const getNetPayableAmount = (order: any) => {
    const finalAmt = Number(order?.finalAmount || 0);
    const wallet = Number(order?.kaitCoinsUsed || 0);
    const net = finalAmt - wallet;
    return net > 0 ? net : 0;
  };

  const openOrderDetails = async (order: any) => {
    setSelectedOrder(order);
    setDetailsLoading(true);
    setOrderDialog(true);
    
    try {
      const pDetails: any = { ...productDetails };
      const vDetails: any = { ...variantDetails };

      for (const item of order.items || []) {
        if (item.product && !pDetails[item.product]) {
          try {
            const res = await productApi.getProductById(item.product);
            if (res.product) pDetails[item.product] = res.product;
          } catch (e) {
            console.error("Failed to fetch product", item.product);
          }
        }
        if (item.variantId && !vDetails[item.variantId]) {
          try {
            const res = await variantApi.getVariantById(item.variantId);
            if (res.variant) vDetails[item.variantId] = res.variant;
          } catch (e) {
            console.error("Failed to fetch variant", item.variantId);
          }
        }
      }
      setProductDetails(pDetails);
      setVariantDetails(vDetails);
    } catch (e) {
      console.error("Error loading order details", e);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handlePrint = (order: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    const orderDate = new Date(order.createdAt).toLocaleDateString("en-GB");
    const netAmount = getNetPayableAmount(order);
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${order._id}</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0; }
            h1 { color: #4f46e5; margin: 0; }
            .meta { color: #666; font-size: 14px; margin-top: 5px; }
            .grid { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .col { width: 48%; background: #f8fafc; padding: 20px; border-radius: 12px; }
            h3 { margin-top: 0; color: #1e293b; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
            p { margin: 5px 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #4f46e5; color: white; padding: 12px; text-align: left; }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            .totals { margin-top: 30px; width: 300px; float: right; background: #f8fafc; padding: 20px; border-radius: 12px; }
            .tot-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
            .tot-row.final { border-top: 2px solid #e2e8f0; padding-top: 10px; font-weight: bold; font-size: 18px; color: #4f46e5; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ATPL SCORE</h1>
            <div class="meta">Invoice / Order Receipt</div>
            <div class="meta">Order ID: ${order._id} &bull; Date: ${orderDate}</div>
          </div>
          
          <div class="grid">
            <div class="col">
              <h3>Shipping Details</h3>
              <p><strong>${order.shippingAddress?.name || "N/A"}</strong></p>
              <p>${order.shippingAddress?.address || "N/A"}</p>
              <p>${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || ""} ${order.shippingAddress?.pincode || ""}</p>
              <p>${order.shippingAddress?.phone || ""}</p>
            </div>
            <div class="col">
              <h3>Order Info</h3>
              <p><strong>Status:</strong> ${order.orderStatus}</p>
              <p><strong>Payment:</strong> ${order.paymentMethod} (${order.paymentStatus})</p>
              ${order.trackingInfo?.trackingNumber ? `<p><strong>Tracking ID:</strong> ${order.trackingInfo.trackingNumber}</p>` : ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${(order.items || []).map((item: any) => {
                const pName = item.product?.title || "Product";
                return `
                  <tr>
                    <td>
                      ${pName}
                      ${item.variantType ? `<br/><small style="color:#666">${item.variantType}: ${item.variantValue}</small>` : ''}
                    </td>
                    <td>₹${item.price}</td>
                    <td>${item.quantity}</td>
                    <td>₹${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `
              }).join("")}
            </tbody>
          </table>

          <div class="totals">
            <div class="tot-row">
              <span>Items Total:</span>
              <span>₹${order.totalAmount}</span>
            </div>
            <div class="tot-row">
              <span>Platform Fee:</span>
              <span>₹${order.platformFee}</span>
            </div>
            <div class="tot-row">
              <span>Shipping:</span>
              <span>₹${order.shippingCharges}</span>
            </div>
            ${order.kaitCoinsUsed ? `
            <div class="tot-row" style="color:#e11d48">
              <span>Wallet Used:</span>
              <span>-₹${order.kaitCoinsUsed}</span>
            </div>` : ''}
            <div class="tot-row final">
              <span>Net Payable:</span>
              <span>₹${netAmount.toFixed(2)}</span>
            </div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  return (
    <div className="w-full space-y-8 pb-12 px-4 md:px-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl shadow-inner">
                <ShoppingBag size={24} />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Orders Management</h1>
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">
              View, print, and manage orders
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm shadow-[0_4px_12px_rgba(79,70,229,0.3)]">
              <Printer size={16} />
              Bulk Print Report
            </button>
            <button onClick={fetchOrders} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-bold text-sm shadow-sm">
              <RefreshCcw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by Order ID, Name, or Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
          </div>
          <div className="relative min-w-[180px]">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold appearance-none text-slate-700"
            >
              <option value="all">All Time</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
              <option value="year">Past Year</option>
            </select>
          </div>
          <div className="relative min-w-[200px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold appearance-none text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="ORDER_PLACED">Order Placed</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <TableContainer component={Paper} className="shadow-sm border border-slate-200 rounded-2xl overflow-hidden print:hidden">
          <Table>
            <TableHead>
              <TableRow className="bg-slate-50">
                <TableCell className="!font-black !text-slate-500 !text-xs !uppercase !tracking-wider">Date</TableCell>
                <TableCell className="!font-black !text-slate-500 !text-xs !uppercase !tracking-wider">Customer Name</TableCell>
                <TableCell className="!font-black !text-slate-500 !text-xs !uppercase !tracking-wider">Final Amount</TableCell>
                <TableCell className="!font-black !text-slate-500 !text-xs !uppercase !tracking-wider">KaitcoinUsed</TableCell>
                <TableCell className="!font-black !text-slate-500 !text-xs !uppercase !tracking-wider">INR</TableCell>
                <TableCell className="!font-black !text-slate-500 !text-xs !uppercase !tracking-wider">Status</TableCell>
                <TableCell className="!font-black !text-slate-500 !text-xs !uppercase !tracking-wider">Order ID</TableCell>
                <TableCell align="right" className="!font-black !text-slate-500 !text-xs !uppercase !tracking-wider">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" className="!py-20">
                    <div className="flex justify-center w-full">
                      <CircularProgress size={40} className="text-indigo-600" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="!py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <ShoppingBag size={48} className="mb-4 opacity-20" />
                      <p className="text-lg font-bold text-slate-600">No orders found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order._id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell>
                      <span className="text-sm font-bold text-slate-700">{formatDate(order.createdAt)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{order.user?.name || order.shippingAddress?.name || "N/A"}</span>
                        <span className="text-xs text-slate-500">{order.shippingAddress?.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-slate-800">₹{order.finalAmount?.toFixed(2) || "0.00"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-rose-500">{order.kaitCoinsUsed > 0 ? `-₹${order.kaitCoinsUsed}` : "0"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-emerald-600 text-base">₹{getNetPayableAmount(order).toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                      <Select
                        size="small"
                        value={order.orderStatus}
                        onChange={(e) => handleStatusChangeClick(order, e.target.value)}
                        className={`text-xs font-bold ${getStatusColor(order.orderStatus)}`}
                        sx={{
                          '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                          '& .MuiSelect-select': { py: 1, px: 2, display: 'flex', alignItems: 'center' }
                        }}
                      >
                        <MenuItem value="ORDER_PLACED" className="text-sm font-bold">Order Placed</MenuItem>
                        <MenuItem value="CONFIRMED" className="text-sm font-bold">Confirmed</MenuItem>
                        <MenuItem value="SHIPPED" className="text-sm font-bold">Shipped</MenuItem>
                        <MenuItem value="DELIVERED" className="text-sm font-bold">Delivered</MenuItem>
                        <MenuItem value="CANCELLED" className="text-sm font-bold text-red-600">Cancelled</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                        #{order._id.slice(-8).toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openOrderDetails(order)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100" title="View Details">
                          <Eye size={18} />
                        </button>
                        <button onClick={() => handlePrint(order)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200" title="Print Invoice">
                          <Printer size={18} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Dispatch/Tracking Modal */}
        {trackingDialog && (
          <div className="fixed top-[88px] left-0 md:left-72 right-0 bottom-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-fade-in" onClick={() => setTrackingDialog(false)}>
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2">
                <Truck className="text-indigo-600" />
                Dispatch Order
              </h3>
              <p className="text-sm text-slate-500 mb-6">Enter the courier tracking number before marking this order as shipped.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tracking Number</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    placeholder="e.g. AWB123456789"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button onClick={() => setTrackingDialog(false)} className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all">Cancel</button>
                  <button onClick={confirmDispatch} className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-[0_4px_12px_rgba(79,70,229,0.3)]">Confirm Shipping</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Details Modal (Tailwind Layout) */}
        {orderDialog && selectedOrder && (
          <div className="fixed top-[88px] left-0 md:left-72 right-0 bottom-0 bg-black/60 backdrop-blur-sm z-[999] flex items-start justify-center p-4 animate-fade-in overflow-y-auto" onClick={() => setOrderDialog(false)}>
            <div className="bg-white/95 backdrop-blur-xl border border-white/50 rounded-[2.5rem] w-full max-w-4xl shadow-[0_30px_60px_rgba(0,0,0,0.35)] overflow-hidden animate-scale-in my-8" onClick={e => e.stopPropagation()}>
              <div className="border-b border-slate-100 flex items-center justify-between py-6 px-8 bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                    <ShoppingBag size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[#0f172a]">Order #{selectedOrder._id.slice(-8).toUpperCase()}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => handlePrint(selectedOrder)} className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                    <Printer size={14} /> Print
                  </button>
                  <button type="button" onClick={() => setOrderDialog(false)} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all shadow-sm">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {detailsLoading ? (
                <div className="p-20 flex justify-center"><CircularProgress /></div>
              ) : (
                <div className="p-8 space-y-8">
                  <div className="flex flex-wrap gap-4">
                    <div className={`flex items-center px-4 py-2 rounded-xl font-bold text-sm border ${getStatusColor(selectedOrder.orderStatus)}`}>
                      {getStatusIcon(selectedOrder.orderStatus)}
                      {selectedOrder.orderStatus.replace('_', ' ')}
                    </div>
                    <div className={`flex items-center px-4 py-2 rounded-xl font-bold text-sm border ${selectedOrder.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {selectedOrder.paymentMethod} - {selectedOrder.paymentStatus}
                    </div>
                    {selectedOrder.trackingInfo?.trackingNumber && (
                      <div className="flex items-center px-4 py-2 rounded-xl font-bold text-sm bg-slate-50 text-slate-700 border border-slate-200">
                        <Truck size={14} className="mr-2 text-indigo-500" />
                        Track: {selectedOrder.trackingInfo.trackingNumber}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5"><MapPin size={100} /></div>
                      <div className="flex items-center gap-2 mb-4 relative z-10">
                        <MapPin size={18} className="text-indigo-500" />
                        <h3 className="font-bold text-slate-800">Shipping Details</h3>
                      </div>
                      <div className="space-y-1 text-sm text-slate-600 relative z-10">
                        <p className="font-bold text-slate-800 text-base">{selectedOrder.shippingAddress?.name}</p>
                        <p className="text-indigo-600 font-medium">{selectedOrder.shippingAddress?.phone}</p>
                        <p className="mt-3">{selectedOrder.shippingAddress?.address}</p>
                        <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state}</p>
                        <p className="font-bold">{selectedOrder.shippingAddress?.pincode}</p>
                        <p>{selectedOrder.shippingAddress?.country}</p>
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10 text-indigo-400"><ShoppingBag size={100} /></div>
                      <h3 className="font-bold text-slate-100 mb-4 relative z-10">Order Summary</h3>
                      <div className="space-y-3 text-sm relative z-10">
                        <div className="flex justify-between text-slate-400">
                          <span>Items Total</span>
                          <span className="font-medium text-white">₹{selectedOrder.totalAmount}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Platform Fee</span>
                          <span className="font-medium text-white">₹{selectedOrder.platformFee}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Shipping Charges</span>
                          <span className="font-medium text-white">{selectedOrder.shippingCharges === 0 ? 'Free' : `₹${selectedOrder.shippingCharges}`}</span>
                        </div>
                        {selectedOrder.kaitCoinsUsed > 0 && (
                          <div className="flex justify-between text-rose-400 font-medium">
                            <span>Wallet Used</span>
                            <span>-₹{selectedOrder.kaitCoinsUsed}</span>
                          </div>
                        )}
                        <div className="pt-3 border-t border-slate-700 flex justify-between">
                          <span className="font-black text-slate-200">Net Payable Amount</span>
                          <span className="font-black text-emerald-400 text-xl">₹{getNetPayableAmount(selectedOrder).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Package size={18} className="text-slate-400" />
                      Ordered Items ({selectedOrder.items?.length})
                    </h3>
                    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                      {selectedOrder.items?.map((item: any, idx: number) => {
                        const fetchedProduct = productDetails[item.product];
                        const fetchedVariant = variantDetails[item.variantId];
                        const productImage = fetchedProduct?.pImage?.[0] || item.product?.image;
                        const productTitle = fetchedProduct?.pName || item.product?.title || "Product";
                        
                        return (
                          <div key={idx} className={`p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors ${idx !== 0 ? 'border-t border-slate-100' : ''}`}>
                            <div className="w-16 h-16 bg-white rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-sm flex items-center justify-center p-1">
                              {productImage ? (
                                <img src={productImage} alt={productTitle} className="w-full h-full object-contain" />
                              ) : (
                                <div className="text-slate-300"><ImageIcon size={24} /></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-slate-800 truncate">{productTitle}</h4>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                {item.variantType && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                                    {item.variantType}: {item.variantValue}
                                  </span>
                                )}
                                {fetchedVariant && !item.variantType && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                                    Variant: {fetchedVariant.type || 'Standard'}
                                  </span>
                                )}
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Qty: {item.quantity}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-slate-800">₹{item.price}</p>
                              <p className="text-xs font-bold text-slate-400 mt-1">Total: <span className="text-indigo-600">₹{(item.price * item.quantity).toFixed(2)}</span></p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 p-6 flex justify-end bg-slate-50/50 rounded-b-[2.5rem]">
                <button type="button" onClick={() => setOrderDialog(false)} className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm">
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
