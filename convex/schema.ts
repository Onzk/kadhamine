import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';

const userRole = v.union(
  v.literal('client'),
  v.literal('provider'),
  v.literal('admin'),
);

const accountStatus = v.union(
  v.literal('pending'),
  v.literal('active'),
  v.literal('suspended'),
  v.literal('rejected'),
);

const gender = v.union(
  v.literal('male'),
  v.literal('female'),
  v.literal('other'),
);

const availability = v.union(
  v.literal('available'),
  v.literal('busy'),
  v.literal('unavailable'),
);

const pricingType = v.union(
  v.literal('fixed'),
  v.literal('negotiable'),
);

const orderStatus = v.union(
  v.literal('pending'),
  v.literal('accepted'),
  v.literal('completed'),
  v.literal('cancelled'),
);

const paymentMethod = v.union(
  v.literal('fedapay'),
  v.literal('airtel_money'),
  v.literal('moov_money'),
  v.literal('off_platform'),
);

const paymentStatus = v.union(
  v.literal('pending'),
  v.literal('held'),
  v.literal('released'),
  v.literal('refunded'),
  v.literal('failed'),
);

const badgeType = v.union(
  v.literal('beginner'),
  v.literal('confirmed'),
  v.literal('expert'),
  v.literal('top_talent'),
  v.literal('verified'),
  v.literal('premium'),
);

const verificationStatus = v.union(
  v.literal('pending'),
  v.literal('approved'),
  v.literal('rejected'),
);

const reportType = v.union(
  v.literal('user'),
  v.literal('review'),
  v.literal('service'),
  v.literal('order'),
);

const reportStatus = v.union(
  v.literal('open'),
  v.literal('in_review'),
  v.literal('resolved'),
  v.literal('dismissed'),
);

const notificationType = v.union(
  v.literal('order'),
  v.literal('payment'),
  v.literal('message'),
  v.literal('review'),
  v.literal('validation'),
  v.literal('rejection'),
  v.literal('subscription'),
  v.literal('system'),
);

const mediaType = v.union(
  v.literal('image'),
  v.literal('video'),
  v.literal('document'),
);

const messageType = v.union(
  v.literal('text'),
  v.literal('image'),
  v.literal('document'),
);

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(userRole),
    status: v.optional(accountStatus),
    pushToken: v.optional(v.string()),
    language: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index('email', ['email'])
    .index('phone', ['phone'])
    .index('by_role', ['role'])
    .index('by_status', ['status']),

  profiles: defineTable({
    userId: v.id('users'),
    firstName: v.string(),
    lastName: v.string(),
    gender: v.optional(gender),
    dateOfBirth: v.optional(v.string()),
    city: v.string(),
    region: v.string(),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarStorageId: v.optional(v.id('_storage')),
    avatarUrl: v.optional(v.string()),
    skills: v.array(v.string()),
    experienceYears: v.optional(v.number()),
    hourlyRate: v.optional(v.number()),
    availability: availability,
    socialLinks: v.optional(
      v.object({
        facebook: v.optional(v.string()),
        instagram: v.optional(v.string()),
        linkedin: v.optional(v.string()),
        twitter: v.optional(v.string()),
        website: v.optional(v.string()),
      }),
    ),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    isVerified: v.boolean(),
    isPremium: v.boolean(),
    badge: v.optional(badgeType),
    averageRating: v.number(),
    reviewCount: v.number(),
    completedOrders: v.number(),
    cancelledOrders: v.number(),
    responseTimeMinutes: v.optional(v.number()),
    trustScore: v.number(),
    viewCount: v.number(),
    clickCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_region', ['region'])
    .index('by_city', ['city'])
    .index('by_rating', ['averageRating'])
    .index('by_premium', ['isPremium'])
    .index('by_verified', ['isVerified'])
    .index('by_availability', ['availability']),

  categories: defineTable({
    nameFr: v.string(),
    nameAr: v.optional(v.string()),
    nameSara: v.optional(v.string()),
    slug: v.string(),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_active', ['isActive'])
    .index('by_sort', ['sortOrder']),

  skills: defineTable({
    nameFr: v.string(),
    nameAr: v.optional(v.string()),
    nameSara: v.optional(v.string()),
    categoryId: v.id('categories'),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_category', ['categoryId'])
    .index('by_active', ['isActive']),

  services: defineTable({
    providerId: v.id('users'),
    profileId: v.id('profiles'),
    title: v.string(),
    description: v.string(),
    categoryId: v.id('categories'),
    pricingType: pricingType,
    price: v.optional(v.number()),
    currency: v.string(),
    deliveryDays: v.optional(v.number()),
    photos: v.array(v.string()),
    photoStorageIds: v.optional(v.array(v.id('_storage'))),
    availability: availability,
    isActive: v.boolean(),
    viewCount: v.number(),
    orderCount: v.number(),
    averageRating: v.number(),
    reviewCount: v.number(),
    city: v.string(),
    region: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_provider', ['providerId'])
    .index('by_profile', ['profileId'])
    .index('by_category', ['categoryId'])
    .index('by_region', ['region'])
    .index('by_city', ['city'])
    .index('by_active', ['isActive'])
    .index('by_rating', ['averageRating'])
    .index('by_price', ['price']),

  portfolio: defineTable({
    profileId: v.id('profiles'),
    providerId: v.id('users'),
    title: v.string(),
    description: v.optional(v.string()),
    mediaType: mediaType,
    mediaUrl: v.optional(v.string()),
    storageId: v.optional(v.id('_storage')),
    thumbnailUrl: v.optional(v.string()),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_profile', ['profileId'])
    .index('by_provider', ['providerId'])
    .index('by_sort', ['sortOrder']),

  orders: defineTable({
    clientId: v.id('users'),
    providerId: v.id('users'),
    serviceId: v.id('services'),
    conversationId: v.optional(v.id('conversations')),
    status: orderStatus,
    title: v.string(),
    description: v.optional(v.string()),
    agreedPrice: v.optional(v.number()),
    currency: v.string(),
    deliveryDate: v.optional(v.string()),
    paymentMethod: v.optional(paymentMethod),
    isOffPlatformPayment: v.boolean(),
    canReview: v.boolean(),
    clientNotes: v.optional(v.string()),
    providerNotes: v.optional(v.string()),
    acceptedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_client', ['clientId'])
    .index('by_provider', ['providerId'])
    .index('by_service', ['serviceId'])
    .index('by_status', ['status'])
    .index('by_client_status', ['clientId', 'status'])
    .index('by_provider_status', ['providerId', 'status']),

  payments: defineTable({
    orderId: v.id('orders'),
    clientId: v.id('users'),
    providerId: v.id('users'),
    amount: v.number(),
    commission: v.number(),
    providerAmount: v.number(),
    currency: v.string(),
    method: paymentMethod,
    status: paymentStatus,
    fedapayTransactionId: v.optional(v.string()),
    fedapayReference: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    metadata: v.optional(v.any()),
    heldAt: v.optional(v.number()),
    releasedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_order', ['orderId'])
    .index('by_client', ['clientId'])
    .index('by_provider', ['providerId'])
    .index('by_status', ['status'])
    .index('by_method', ['method'])
    .index('by_fedapay_reference', ['fedapayReference']),

  reviews: defineTable({
    orderId: v.id('orders'),
    clientId: v.id('users'),
    providerId: v.id('users'),
    serviceId: v.id('services'),
    rating: v.number(),
    comment: v.optional(v.string()),
    photos: v.optional(v.array(v.string())),
    providerResponse: v.optional(v.string()),
    providerRespondedAt: v.optional(v.number()),
    isOfficial: v.boolean(),
    isModerated: v.boolean(),
    isVisible: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_provider', ['providerId'])
    .index('by_service', ['serviceId'])
    .index('by_client', ['clientId'])
    .index('by_order', ['orderId'])
    .index('by_rating', ['rating']),

  conversations: defineTable({
    participantIds: v.array(v.id('users')),
    orderId: v.optional(v.id('orders')),
    lastMessageAt: v.optional(v.number()),
    lastMessagePreview: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_participants', ['participantIds'])
    .index('by_order', ['orderId'])
    .index('by_last_message', ['lastMessageAt']),

  messages: defineTable({
    conversationId: v.id('conversations'),
    senderId: v.id('users'),
    type: messageType,
    content: v.string(),
    mediaUrl: v.optional(v.string()),
    storageId: v.optional(v.id('_storage')),
    readBy: v.array(v.id('users')),
    createdAt: v.number(),
  })
    .index('by_conversation', ['conversationId'])
    .index('by_sender', ['senderId'])
    .index('by_conversation_time', ['conversationId', 'createdAt']),

  notifications: defineTable({
    userId: v.id('users'),
    type: notificationType,
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_read', ['userId', 'isRead'])
    .index('by_created', ['createdAt']),

  favorites: defineTable({
    userId: v.id('users'),
    targetType: v.union(v.literal('provider'), v.literal('service')),
    targetId: v.string(),
    providerId: v.optional(v.id('users')),
    serviceId: v.optional(v.id('services')),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_target', ['userId', 'targetType', 'targetId'])
    .index('by_provider', ['providerId'])
    .index('by_service', ['serviceId']),

  subscriptions: defineTable({
    userId: v.id('users'),
    profileId: v.id('profiles'),
    plan: v.literal('premium'),
    status: v.union(
      v.literal('pending'),
      v.literal('active'),
      v.literal('expired'),
      v.literal('cancelled'),
    ),
    startDate: v.number(),
    endDate: v.number(),
    amount: v.number(),
    currency: v.string(),
    paymentId: v.optional(v.id('payments')),
    fedapayTransactionId: v.optional(v.string()),
    fedapayReference: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_profile', ['profileId'])
    .index('by_status', ['status'])
    .index('by_fedapay_reference', ['fedapayReference']),

  verificationRequests: defineTable({
    userId: v.id('users'),
    profileId: v.id('profiles'),
    documentType: v.union(
      v.literal('national_id'),
      v.literal('passport'),
    ),
    documentStorageId: v.id('_storage'),
    selfieStorageId: v.id('_storage'),
    status: verificationStatus,
    reviewedBy: v.optional(v.id('users')),
    reviewNotes: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_status', ['status']),

  reports: defineTable({
    reporterId: v.id('users'),
    targetType: reportType,
    targetId: v.string(),
    reason: v.string(),
    description: v.optional(v.string()),
    status: reportStatus,
    resolvedBy: v.optional(v.id('users')),
    resolution: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_reporter', ['reporterId'])
    .index('by_status', ['status'])
    .index('by_target', ['targetType', 'targetId']),

  searchHistory: defineTable({
    userId: v.id('users'),
    query: v.string(),
    filters: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_time', ['userId', 'createdAt']),

  settings: defineTable({
    key: v.string(),
    value: v.any(),
    updatedAt: v.number(),
  }).index('by_key', ['key']),
});
