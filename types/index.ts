import { z } from "zod";

export const UserRoleEnum = z.enum(["CUSTOMER", "ADMIN"]);
export const UserStatusEnum = z.enum(["ACTIVE", "DISABLED"]);
export const OrderStatusEnum = z.enum([
  "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED", "PARTIALLY_REFUNDED",
]);
export const ReviewStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED"]);
export const ArticleStatusEnum = z.enum(["DRAFT", "PUBLISHED"]);
export const CurrencyEnum = z.enum(["USD", "INR"]);

// ─── Auth Schemas ───

export const RegisterSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).regex(/[A-Z]/, "Must contain uppercase").regex(/[a-z]/, "Must contain lowercase").regex(/[0-9]/, "Must contain digit"),
  confirmPassword: z.string().min(1),
  firstName: z.string().min(1).max(100).regex(/^[a-zA-ZÀ-ÿ '-]+$/),
  lastName: z.string().min(1).max(100).regex(/^[a-zA-ZÀ-ÿ '-]+$/),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional().default(false),
});

export const SocialLoginSchema = z.object({
  provider: z.enum(["google", "apple"]),
  idToken: z.string().min(1),
});

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
});

export const UpdateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).regex(/^[a-zA-ZÀ-ÿ '-]+$/).optional(),
  lastName: z.string().min(1).max(100).regex(/^[a-zA-ZÀ-ÿ '-]+$/).optional(),
  email: z.string().email().max(255).optional(),
  currentPassword: z.string().min(1).optional(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).optional(),
});

// ─── Product Schemas ───

export const ProductFilterSchema = z.object({
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().max(10000).optional(),
  sortBy: z.enum(["price", "name", "newest"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
});

export const SearchSchema = z.object({
  q: z.string().min(2).max(200),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
});

export const CreateProductSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  price: z.coerce.number().min(49).max(289),
  stock: z.coerce.number().int().min(0).default(0),
  materialTag: z.string().max(100).default("Pineapple Fiber"),
  sustainabilityBadge: z.boolean().default(true),
  published: z.boolean().default(false),
});

export const UpdateProductSchema = CreateProductSchema.partial();

// ─── Cart Schemas ───

export const AddCartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(99),
});

export const UpdateCartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(0).max(99),
});

export const RemoveCartItemSchema = z.object({
  productId: z.string().uuid(),
});

// ─── Checkout Schemas ───

export const AddressSchema = z.object({
  street: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  zip: z.string().min(1).max(20),
  country: z.string().min(1).max(100).default("US"),
});

export const ShippingAddressSchema = z.object({
  shippingAddress: AddressSchema,
});

// ─── Review Schemas ───

export const CreateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().min(1).max(2000),
});

export const UpdateReviewSchema = CreateReviewSchema.partial();

// ─── Order Schemas ───

export const UpdateOrderStatusSchema = z.object({
  status: OrderStatusEnum,
  trackingNumber: z.string().max(100).optional(),
  carrier: z.string().max(100).optional(),
  reason: z.string().max(500).optional(),
});

export const RefundSchema = z.object({
  amount: z.coerce.number().positive(),
  reason: z.string().max(500).optional(),
});

// ─── Blog Schemas ───

export const CreateBlogSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(50000),
  metaDescription: z.string().max(160).optional(),
  featuredImage: z.string().url().optional(),
  status: ArticleStatusEnum.default("DRAFT"),
});

export const UpdateBlogSchema = CreateBlogSchema.partial();

// ─── Pagination ───

export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// ─── Type Exports ───

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type AddCartItemInput = z.infer<typeof AddCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
export type RemoveCartItemInput = z.infer<typeof RemoveCartItemSchema>;
export type AddressInput = z.infer<typeof AddressSchema>;
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type UpdateReviewInput = z.infer<typeof UpdateReviewSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type RefundInput = z.infer<typeof RefundSchema>;
export type CreateBlogInput = z.infer<typeof CreateBlogSchema>;
export type UpdateBlogInput = z.infer<typeof UpdateBlogSchema>;
export type ProductFilter = z.infer<typeof ProductFilterSchema>;

// ─── Admin Schemas ───

export const AdminProductCreateSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().min(1).max(5000),
  price: z.coerce.number().min(0.01).max(9999.99),
  sku: z.string().min(1).max(50),
  stock: z.coerce.number().int().min(0).default(0),
  materialTag: z.string().max(100).default("Pineapple Fiber"),
  sustainabilityBadge: z.boolean().default(true),
  published: z.boolean().default(false),
});

export const AdminProductUpdateSchema = AdminProductCreateSchema.partial();

export const AdminStatusUpdateSchema = z.object({
  orderId: z.string().min(1),
  status: OrderStatusEnum,
  trackingNumber: z.string().max(100).optional(),
  carrier: z.string().max(100).optional(),
  reason: z.string().max(500).optional(),
});

export const AdminRefundSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

export const AdminInventoryAdjustSchema = z.object({
  productId: z.string().min(1),
  newStock: z.coerce.number().int(),
  reason: z.string().min(1).max(500),
});

const AdminDiscountCreateBase = z.object({
  code: z.string().min(3).max(50).regex(/^[A-Z0-9_]+$/, "Use uppercase letters, numbers, underscore"),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  value: z.coerce.number().min(0.01),
  maxUses: z.coerce.number().int().min(1).optional(),
  minOrderAmount: z.coerce.number().min(0).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const AdminDiscountCreateSchema = AdminDiscountCreateBase.refine(
  (data) => data.type !== "PERCENTAGE" || data.value <= 100,
  { message: "Percentage discount cannot exceed 100%", path: ["value"] },
);

export const AdminDiscountUpdateSchema = AdminDiscountCreateBase.partial();

export type AdminProductCreateInput = z.infer<typeof AdminProductCreateSchema>;
export type AdminProductUpdateInput = z.infer<typeof AdminProductUpdateSchema>;
export type AdminStatusUpdateInput = z.infer<typeof AdminStatusUpdateSchema>;
export type AdminRefundInput = z.infer<typeof AdminRefundSchema>;
export type AdminInventoryAdjustInput = z.infer<typeof AdminInventoryAdjustSchema>;
export type AdminDiscountCreateInput = z.infer<typeof AdminDiscountCreateSchema>;
export type AdminDiscountUpdateInput = z.infer<typeof AdminDiscountUpdateSchema>;
export type SearchInput = z.infer<typeof SearchSchema>;

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
    requestId?: string;
  };
}

export interface JwtPayload {
  sub: string;
  role: "CUSTOMER" | "ADMIN";
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ─── 2FA Schemas ───

export const TwoFactorSetupSchema = z.object({
  password: z.string().min(1),
});

export const TwoFactorVerifySchema = z.object({
  token: z.string().length(6).regex(/^\d{6}$/),
  secret: z.string().min(10),
});

export const TwoFactorDisableSchema = z.object({
  password: z.string().min(1),
  token: z.string().length(6).regex(/^\d{6}$/),
});

export const TwoFactorChallengeSchema = z.object({
  tempToken: z.string().min(1),
  token: z.string().length(6).regex(/^\d{6}$/),
  rememberMe: z.boolean().optional().default(false),
});

// ─── Admin User Management ───

export const AdminUserUpdateSchema = z.object({
  userId: z.string().min(1),
  role: UserRoleEnum.optional(),
  status: UserStatusEnum.optional(),
});

// ─── Webhook & Admin Schemas ───

export const AdminRateLimitResetSchema = z.object({
  key: z.string().min(1),
});

export const AdminWebhookReplaySchema = z.object({
  webhookEventId: z.string().uuid(),
});

export type TwoFactorSetupInput = z.infer<typeof TwoFactorSetupSchema>;
export type TwoFactorVerifyInput = z.infer<typeof TwoFactorVerifySchema>;
export type TwoFactorDisableInput = z.infer<typeof TwoFactorDisableSchema>;
export type TwoFactorChallengeInput = z.infer<typeof TwoFactorChallengeSchema>;
export type AdminUserUpdateInput = z.infer<typeof AdminUserUpdateSchema>;
