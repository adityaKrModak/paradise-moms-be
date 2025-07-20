# Razorpay Payment Status Sync API

This document describes the new API endpoints for syncing payment status from Razorpay to keep your local database in sync with the latest payment statuses.

## Overview

The sync API provides multiple ways to fetch the latest payment status from Razorpay and update your local database:

1. **Individual Payment Sync** - Sync a single payment by internal ID or Razorpay payment ID
2. **Order Payment Sync** - Sync all payments for a specific order (discovers missing payments from Razorpay)
3. **Bulk Sync** - Sync all pending payments (Admin only)

## 🔄 Enhanced Order Sync

The **Order Payment Sync** now includes advanced discovery features:

- ✅ **Fetches ALL payments from Razorpay** for the order
- ✅ **Discovers missing payments** that exist in Razorpay but not in your DB
- ✅ **Creates new payment records** for discovered payments
- ✅ **Syncs existing payments** with latest status
- ✅ **Handles failures gracefully** with fallback to existing payments

## 🔐 Role-Based Access Control

### Regular Users (USER role):

- ✅ Can sync their own payments only
- ✅ Can sync payments for their own orders only
- ❌ Cannot access bulk operations
- ❌ Cannot sync other users' payments

### Admins (ADMIN role):

- ✅ Can sync any payment
- ✅ Can sync payments for any order
- ✅ Can access bulk operations
- ✅ Full access to all sync endpoints

### Security Features:

- All endpoints require JWT authentication
- Automatic ownership validation for regular users
- Admin-only restrictions on sensitive operations
- Proper error messages for unauthorized access

## GraphQL API

### 1. Sync Payment by Internal ID

```graphql
mutation SyncPaymentStatusFromRazorpay {
  syncPaymentStatusFromRazorpay(paymentId: "your-payment-uuid-here") {
    payment {
      id
      status
      amount
      currency
      gatewayPaymentId
    }
    statusChanged
    previousStatus
    currentStatus
    error
  }
}
```

### 2. Sync Payment by Razorpay Payment ID

```graphql
mutation SyncPaymentStatusByGatewayId {
  syncPaymentStatusByGatewayId(gatewayPaymentId: "pay_razorpay_payment_id") {
    payment {
      id
      status
      gatewayPaymentId
      intent {
        order {
          id
          status
        }
      }
    }
    statusChanged
    previousStatus
    currentStatus
  }
}
```

### 3. Sync All Payments for an Order (Enhanced with Discovery)

```graphql
mutation SyncOrderPaymentsStatus {
  syncOrderPaymentsStatus(orderId: 123) {
    orderId
    totalPayments
    syncResults {
      payment {
        id
        status
        gatewayPaymentId
      }
      statusChanged
      previousStatus
      currentStatus
      error
      gatewayPaymentId  # For discovered payments that failed to create
    }
  }
}
```

**Example Response:**
```json
{
  "data": {
    "syncOrderPaymentsStatus": {
      "orderId": 123,
      "totalPayments": 3,
      "syncResults": [
        {
          "payment": {
            "id": "existing-payment-uuid",
            "status": "success",
            "gatewayPaymentId": "pay_existing123"
          },
          "statusChanged": false,
          "previousStatus": "success",
          "currentStatus": "success"
        },
        {
          "payment": {
            "id": "new-payment-uuid",
            "status": "success", 
            "gatewayPaymentId": "pay_discovered456"
          },
          "statusChanged": true,
          "previousStatus": "not_found",
          "currentStatus": "success"
        },
        {
          "payment": null,
          "statusChanged": false,
          "previousStatus": "unknown",
          "currentStatus": "unknown",
          "error": "Failed to create payment record",
          "gatewayPaymentId": "pay_failed789"
        }
      ]
    }
  }
}
```

### 4. Bulk Sync All Pending Payments

```graphql
mutation SyncAllPendingPayments {
  syncAllPendingPayments {
    totalPayments
    successfulSyncs
    failedSyncs
    syncResults {
      payment {
        id
        status
        gatewayPaymentId
      }
      statusChanged
      previousStatus
      currentStatus
      error
    }
  }
}
```

## REST API

All REST endpoints require JWT authentication.

### 1. Sync Payment by Internal ID

```
POST /payments/sync/{paymentId}
```

### 2. Sync Payment by Razorpay Payment ID

```
POST /payments/sync/gateway/{gatewayPaymentId}
```

### 3. Sync All Payments for an Order

```
POST /payments/sync/order/{orderId}
```

### 4. Bulk Sync All Pending Payments

```
POST /payments/sync/bulk/pending
```

## Response Format

### SyncPaymentStatusResponse

```typescript
{
  payment: Payment;           // Updated payment object
  statusChanged: boolean;     // Whether the status actually changed
  previousStatus: string;     // Status before sync
  currentStatus: string;      // Status after sync
  error?: string;            // Error message if sync failed
}
```

### BulkSyncPaymentsResponse

```typescript
{
  totalPayments: number;      // Total payments processed
  successfulSyncs: number;    // Number of successful syncs
  failedSyncs: number;        // Number of failed syncs
  syncResults: SyncPaymentStatusResponse[];
}
```

## Status Mapping

The API automatically maps Razorpay payment statuses to your internal statuses:

| Razorpay Status | Internal Status |
| --------------- | --------------- |
| `created`       | `pending`       |
| `authorized`    | `pending`       |
| `captured`      | `success`       |
| `failed`        | `failed`        |
| `refunded`      | `refunded`      |

## Automatic Updates

When a payment status is synced, the API automatically updates related entities:

1. **Payment Intent Status**: Updated to `PAID` when payment is captured, `FAILED` when payment fails
2. **Order Status**: Updated to `PROCESSING` when payment is captured, `CANCELLED` when payment fails

## Error Handling

- **404 Not Found**: Payment or order not found in database
- **400 Bad Request**: Invalid Razorpay payment ID or API error
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: Insufficient permissions (trying to access other users' data or admin-only endpoints)

## Use Cases

### 1. Manual Status Check

When a customer reports payment issues, use the individual sync endpoints to check the latest status from Razorpay.

### 2. Order Processing

Before processing an order, sync all its payments to ensure you have the latest status.

### 3. Daily Reconciliation

Use the bulk sync endpoint to reconcile all pending payments daily.

### 4. Webhook Backup

If webhooks fail or are missed, use these endpoints to catch up on status changes.

## 🔍 Enhanced Order Sync Flow

Here's what happens when you sync an order's payments:

### Step 1: Fetch from Razorpay
```
For each Payment Intent in the order:
  1. Call Razorpay API: GET /orders/{gatewayIntentId}/payments
  2. Get ALL payments for that Razorpay order
```

### Step 2: Process Each Razorpay Payment
```
For each payment found in Razorpay:
  1. Check if payment exists in our database (by gatewayPaymentId)
  2. If EXISTS: Sync status with latest from Razorpay
  3. If NOT EXISTS: Create new payment record in our database
  4. Update related Payment Intent and Order status
```

### Step 3: Handle Failures Gracefully
```
If Razorpay API fails:
  - Fallback to syncing existing payments in our database
  - Log error but continue processing other intents
```

### Real-World Example

**Scenario**: Order 123 has 1 payment intent, but customer made 3 payment attempts in Razorpay

**Before Sync** (Our Database):
```
Order 123:
  PaymentIntent: order_razorpay_abc123
    Payment 1: pay_first_attempt (status: pending)
```

**Razorpay Reality**:
```
Order order_razorpay_abc123:
  Payment 1: pay_first_attempt (status: failed)
  Payment 2: pay_second_attempt (status: failed) 
  Payment 3: pay_third_attempt (status: captured)
```

**After Sync** (Our Database):
```
Order 123:
  PaymentIntent: order_razorpay_abc123 (status: PAID)
    Payment 1: pay_first_attempt (status: failed) ✅ Updated
    Payment 2: pay_second_attempt (status: failed) ✅ Created
    Payment 3: pay_third_attempt (status: success) ✅ Created
  Order Status: PROCESSING ✅ Updated
```

## Best Practices

1. **Rate Limiting**: Be mindful of Razorpay's API rate limits when using bulk operations
2. **Error Handling**: Always check the `error` field in responses
3. **Logging**: The API logs all sync operations for audit purposes
4. **Idempotency**: Safe to call multiple times - won't create duplicate records
5. **Discovery Sync**: Use order sync regularly to catch missed payments from webhooks

## Security

### Authentication & Authorization

- **JWT Authentication**: All endpoints require valid JWT token
- **Role-Based Access Control**: Automatic permission validation based on user role
- **Ownership Validation**: Regular users can only access their own data
- **Admin Privileges**: Admins have unrestricted access to all operations

### Permission Examples

**Regular User trying to sync their own payment:**

```bash
# ✅ ALLOWED - User can sync their own payment
curl -X POST /payments/sync/pay_abc123 \
  -H "Authorization: Bearer user_jwt_token"
```

**Regular User trying to sync another user's payment:**

```bash
# ❌ FORBIDDEN - Returns 403 Forbidden
curl -X POST /payments/sync/pay_xyz789 \
  -H "Authorization: Bearer user_jwt_token"
# Response: {"message": "You can only sync your own payments"}
```

**Admin accessing any payment:**

```bash
# ✅ ALLOWED - Admin can sync any payment
curl -X POST /payments/sync/pay_xyz789 \
  -H "Authorization: Bearer admin_jwt_token"
```

**Regular User trying bulk sync:**

```bash
# ❌ FORBIDDEN - Returns 403 Forbidden
curl -X POST /payments/sync/bulk/pending \
  -H "Authorization: Bearer user_jwt_token"
# Response: {"message": "Insufficient permissions"}
```

## Monitoring

The API includes comprehensive logging:

- Successful syncs with status changes
- Failed sync attempts with error details
- Bulk operation summaries

Monitor these logs to ensure payment status synchronization is working correctly.
