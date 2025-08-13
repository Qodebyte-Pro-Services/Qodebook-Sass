
const PRODUCT_PERMISSIONS = {
  CREATE_PRODUCT: 'create_product',
  VIEW_PRODUCT: 'view_product',
  VIEW_PRODUCTS: 'view_products',
  UPDATE_PRODUCT: 'update_product',
  DELETE_PRODUCT: 'delete_product',
  MANAGE_VARIANTS: 'manage_variants',
  MANAGE_CATEGORIES: 'manage_categories',
  MANAGE_ATTRIBUTES: 'manage_attributes',
  CREATE_PRODUCT_CATEGORIES: 'create_product_categories',
  VIEW_PRODUCT_CATEGORIES: 'view_product_categories',
  UPDATE_PRODUCT_CATEGORIES: 'update_product_categories',
  DELETE_PRODUCT_CATEGORIES: 'delete_product_categories',
  CREATE_PRODUCT_ATTRIBUTES: 'create_product_attributes',
  CREATE_ATTRIBUTE_AND_VALUES: 'create_attribute_and_values',
  CREATE_ATTRIBUTE_VALUES: 'create_attribute_values',
  VIEW_PRODUCT_ATTRIBUTES: 'view_product_attributes',
  UPDATE_PRODUCT_ATTRIBUTES: 'update_product_attributes',
  DELETE_PRODUCT_ATTRIBUTES: 'delete_product_attributes',
  DELETE_ATTRIBUTE_VALUES: 'delete_attribute_values',
  CREATE_PRODUCT_VARIANTS: 'create_product_variants',
  VIEW_PRODUCT_VARIANTS: 'view_product_variants',
  UPDATE_PRODUCT_VARIANTS: 'update_product_variants',
  DELETE_PRODUCT_VARIANTS: 'delete_product_variants',
};


const STOCK_PERMISSIONS = {
  VIEW_STOCK: 'view_stock',
  ADJUST_STOCK: 'adjust_stock',
  TRANSFER_STOCK: 'transfer_stock',
  VIEW_STOCK_HISTORY: 'view_stock_history',
  MANAGE_SUPPLIERS: 'manage_suppliers',
  RESTOCK_ITEMS: 'restock_items'
};


const SALES_PERMISSIONS = {
  CREATE_SALE: 'create_sale',
  VIEW_SALES: 'view_sales',
  REFUND_SALE: 'refund_sale',
  MANAGE_ORDERS: 'manage_orders',
  DELETE_ORDERS: 'delete_orders',
  VIEW_ORDERS: 'view_orders',
  CREATE_ORDER: 'create_order',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_DISCOUNTS: 'manage_discounts',
  MANAGE_COUPONS: 'manage_coupons'
};


const STAFF_PERMISSIONS = {
  CREATE_STAFF: 'create_staff',
  VIEW_STAFF: 'view_staff',
  UPDATE_STAFF: 'update_staff',
  DELETE_STAFF: 'delete_staff',
  MANAGE_STAFF: 'manage_staff',
  MANAGE_ROLES: 'manage_roles',
  VIEW_ROLES: 'view_roles',
  VIEW_STAFF_ACTIONS: 'view_staff_actions',
  MANAGE_STAFF_ACTIONS: 'manage_staff_actions',
  MANAGE_STAFF_DOCS: 'manage_staff_docs',
  VIEW_STAFF_DOCS: 'view_staff_docs',
  MANAGE_STAFF_SHIFTS: 'manage_staff_shifts',
  VIEW_LOGIN_HISTORY: 'view_login_history',
  MANAGE_STAFF_SETTINGS: 'manage_staff_settings',
  MANAGE_STAFF_SUBCHARGE: 'manage_staff_subcharge',
  VIEW_STAFF_SUBCHARGE: 'view_staff_subcharge',
  APPROVE_PASSWORD_CHANGE: 'approve_password_change',
  REJECT_PASSWORD_CHANGE: 'reject_password_change',
  CHANGE_PASSWORD: 'change_password',
  VIEW_STAFF_LOGINS: 'view_staff_logins',
};



const APPOINTMENT_PERMISSIONS = {
  CREATE_APPOINTMENT: 'create_appointment',
  VIEW_APPOINTMENT: 'view_appointment',
  UPDATE_APPOINTMENT: 'update_appointment',
  DELETE_APPOINTMENT: 'delete_appointment',
  ASSIGN_APPOINTMENT: 'assign_appointment',
  MANAGE_APPOINTMENT_STATUS: 'manage_appointment_status',
};

const CUSTOMER_PERMISSIONS = {
  CREATE_CUSTOMER: 'create_customer',
  VIEW_CUSTOMER: 'view_customer',
  UPDATE_CUSTOMER: 'update_customer',
  DELETE_CUSTOMER: 'delete_customer',
  MANAGE_APPOINTMENTS: 'manage_appointments',
  VIEW_CUSTOMER_HISTORY: 'view_customer_history',
  MANAGE_CUSTOMER_NOTES: 'manage_customer_notes',
};


const REPORTS_ANALYTICS_PERMISSIONS = {
  VIEW_SALES_OVERVIEW: 'view_sales_overview',
  VIEW_INVENTORY_OVERVIEW: 'view_inventory_overview',
  VIEW_CUSTOMER_OVERVIEW: 'view_customer_overview',
  VIEW_FINANCIAL_OVERVIEW: 'view_financial_overview',
  VIEW_STAFF_OVERVIEW: 'view_staff_overview',
  VIEW_APPOINTMENT_OVERVIEW: 'view_appointment_overview',
  VIEW_PRODUCT_OVERVIEW: 'view_product_overview',
  VIEW_ORDER_OVERVIEW: 'view_order_overview',
  VIEW_ANALYTICS: 'view_analytics',
  VIEW_VARIANTS_OVERVIEW: 'view_variants_overview',
  VIEW_STOCK_OVERVIEW: 'view_stock_overview',
  VIEW_STOCK_MOVEMENT: 'view_stock_movement',
}

const FINANCIAL_PERMISSIONS = {
  CREATE_EXPENSE_CATEGORY: 'create_expense_category',
  VIEW_EXPENSE_CATEGORY: 'view_expense_category',
  UPDATE_EXPENSE_CATEGORY: 'update_expense_category',
  DELETE_EXPENSE_CATEGORY: 'delete_expense_category',
  CREATE_EXPENSE: 'create_expense',
  CREATE_STAFF_SALARY_EXPENSE: 'create_staff_salary_expense',
  VIEW_EXPENSES: 'view_expenses',
  UPDATE_EXPENSE: 'update_expense',
  DELETE_EXPENSE: 'delete_expense',
  APPROVE_EXPENSE: 'approve_expense',
  REJECT_EXPENSE: 'reject_expense',
  MANAGE_BUDGETS: 'manage_budgets',
  CREATE_BUDGET: 'create_budget',
  UPDATE_BUDGET: 'update_budget',
  DELETE_BUDGET: 'delete_budget',
  APPROVE_BUDGET: 'approve_budget',
  REJECT_BUDGET: 'reject_budget',
  VIEW_BUDGETS: 'view_budgets',
  MANAGE_TAXES: 'manage_taxes',
  VIEW_TAXES: 'view_taxes',
  UPDATE_TAXES: 'update_taxes',
  DELETE_TAXES: 'delete_taxes',
  CREATE_TAXES: 'create_taxes',
  VIEW_FINANCIAL_REPORTS: 'view_financial_reports'
};


const BUSINESS_PERMISSIONS = {
  CREATE_BUSINESS: 'create_business',
  VIEW_BUSINESS: 'view_business',
  UPDATE_BUSINESS: 'update_business',
  DELETE_BUSINESS: 'delete_business',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  MANAGE_AUDIT_LOGS: 'manage_audit_logs',
  MANAGE_NOTIFICATIONS: 'manage_notifications',
  MANAGE_SUBSCRIPTIONS: 'manage_subscriptions',
  CREATE_BRANCH: 'create_branch',
  VIEW_BRANCH: 'view_branch',
  UPDATE_BRANCH: 'update_branch',
  DELETE_BRANCH: 'delete_branch',
  MANAGE_BRANCH_SETTINGS: 'manage_branch_settings',
  MANAGE_BUSINESS_SETTINGS: 'manage_business_settings',
};

const INVENTORY_LOG_PERMISSIONS = {
  VIEW_INVENTORY_LOGS: 'view_inventory_logs',
  EXPORT_INVENTORY_LOGS: 'export_inventory_logs',
  DELETE_INVENTORY_LOGS: 'delete_inventory_logs',
};





const SERVICE_PERMISSIONS = {
  CREATE_SERVICE: 'create_service',
  VIEW_SERVICE: 'view_service',
  UPDATE_SERVICE: 'update_service',
  DELETE_SERVICE: 'delete_service',
  MANAGE_SERVICE_CATEGORIES: 'manage_service_categories',
  ASSIGN_SERVICE_STAFF: 'assign_service_staff'
};


const IMPORT_EXPORT_PERMISSIONS = {
  IMPORT_DATA: 'import_data',
  EXPORT_DATA: 'export_data',
  GENERATE_REPORTS: 'generate_reports',
  GENERATE_BARCODES: 'generate_barcodes',
  GENERATE_QRCODES: 'generate_qrcodes'
};


const ALL_PERMISSIONS = {
  ...PRODUCT_PERMISSIONS,
  ...STOCK_PERMISSIONS,
  ...SALES_PERMISSIONS,
  ...STAFF_PERMISSIONS,
  ...CUSTOMER_PERMISSIONS,
  ...APPOINTMENT_PERMISSIONS,
  ...INVENTORY_LOG_PERMISSIONS,
  ...FINANCIAL_PERMISSIONS,
  ...BUSINESS_PERMISSIONS,
  ...SERVICE_PERMISSIONS,
  ...IMPORT_EXPORT_PERMISSIONS,
  ...REPORTS_ANALYTICS_PERMISSIONS
};

module.exports = {
  PRODUCT_PERMISSIONS,
  STOCK_PERMISSIONS,
  SALES_PERMISSIONS,
  STAFF_PERMISSIONS,
  CUSTOMER_PERMISSIONS,
  APPOINTMENT_PERMISSIONS,
  INVENTORY_LOG_PERMISSIONS,
  FINANCIAL_PERMISSIONS,
  BUSINESS_PERMISSIONS,
  SERVICE_PERMISSIONS,
  IMPORT_EXPORT_PERMISSIONS,
  REPORTS_ANALYTICS_PERMISSIONS,
  ALL_PERMISSIONS
};
