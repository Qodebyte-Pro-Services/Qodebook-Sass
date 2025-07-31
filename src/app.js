const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
require('./config/env');

const authRoutes = require('./routes/authRoutes');
const businessRoutes = require('./routes/businessRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const expenseCategoryRoutes = require('./routes/expenseCategoryRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const importRoutes = require('./routes/importRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const realtimeRoutes = require('./routes/realtimeRoutes');
const barcodeRoutes = require('./routes/barcodeRoutes');
const qrcodeRoutes = require('./routes/qrcodeRoutes');
const branchRoutes = require('./routes/branchRoutes');
const staffRoutes = require('./routes/staffRoutes');
const salesRoutes = require('./routes/salesRoutes');
const orderRoutes = require('./routes/orderRoutes');
const customerRoutes = require('./routes/customerRoutes');
const productRoutes = require('./routes/productRoutes');
const taxRoutes = require('./routes/taxRoutes');
const discountRoutes = require('./routes/discountRoutes');
const couponRoutes = require('./routes/couponRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const attributeRoutes = require('./routes/attributeRoutes');
const variantRoutes = require('./routes/variantRoutes');
const stockRoutes = require('./routes/stockRoutes');
const serviceCategoryRoutes = require('./routes/serviceCategoryRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const serviceStaffAssignmentRoutes = require('./routes/serviceStaffAssignmentRoutes');
const categoryRoutes = require('./routes/categoryRoutes');


const setupSwagger = require('../swagger');
const app = express();


app.use(cors());
app.use(express.json());
app.use(morgan('dev'));


setupSwagger(app);


app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/expense-categories', expenseCategoryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/products', productRoutes); 
app.use('/api/products/import', importRoutes); 
app.use('/api/finance', analyticsRoutes); 
app.use('/api/realtime', realtimeRoutes);
app.use('/api/barcode', barcodeRoutes);
app.use('/api/qrcode', qrcodeRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);

app.use('/api/taxes', taxRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/attributes', attributeRoutes);
app.use('/api/variants', variantRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/service-categories', serviceCategoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/service-staff-assignments', serviceStaffAssignmentRoutes);

app.use('/api/categories', categoryRoutes);

app.get('/', (req, res) => {
  res.send('Qodebook SaaS API is running');
});

module.exports = app;
