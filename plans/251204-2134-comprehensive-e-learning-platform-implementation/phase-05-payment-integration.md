# Phase 05: Payment Integration

## Context Links
- [Payment Integration Research](../research/researcher-02-payment-integration.md)
- [Student Dashboard](phase-04-student-dashboard-learning-interface.md)

## Overview
Integrate PayOS payment gateway for Vietnamese market with VietQR support, implementing secure payment processing, automated course unlocking, webhook handling, and comprehensive order management for seamless student enrollment experience.

## Key Insights
- PayOS ideal for Vietnamese market ($32-60/month) with latest security patches
- NestJS webhook controller with HMAC signature verification using latest crypto
- VietQR essential for local payment preferences with secure QR generation
- Automated course unlocking reduces manual intervention with secure transaction handling
- Payment retry mechanism improves conversion with secure error handling
- Latest dependency versions ensure PCI DSS compliance and payment security

## Requirements
1. PayOS payment gateway integration
2. VietQR code generation for bank transfers
3. Webhook handling for payment confirmations
4. Order status tracking and management
5. Payment retry and failure handling
6. Receipt generation and email delivery
7. Refund processing capability
8. Payment analytics dashboard

## Architecture

### Payment Flow
1. **Initiation**: User selects course → Choose payment method → Create order
2. **Processing**: Redirect to PayOS/VietQR → Complete payment → Webhook triggered
3. **Confirmation**: Verify webhook → Update order status → Unlock course
4. **Completion**: Send receipt → Update enrollment → Notify user

### Data Models
```typescript
// Order Structure
Order {
  id: string
  userId: string
  courseId: string
  amount: number
  currency: 'VND' | 'USD'
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  paymentMethod: 'PAYOS' | 'VIETQR' | 'BANK_TRANSFER'
  paymentId?: string
  transactionId?: string
  createdAt: DateTime
  completedAt?: DateTime
}

// Payment Transaction
PaymentTransaction {
  id: string
  orderId: string
  amount: number
  status: string
  gateway: 'PAYOS' | 'VIETQR'
  gatewayTransactionId: string
  metadata: Json
  createdAt: DateTime
}
```

### Security Measures
- HMAC signature verification for webhooks
- Order amount validation
- Idempotency keys for duplicate prevention
- Webhook retry mechanism
- Payment status encryption

## Related Code Files
- `app/api/payments/create-order/route.ts` - Order creation
- `app/api/payments/webhook/route.ts` - Webhook handler
- `app/api/payments/vietqr/route.ts` - VietQR generation
- `lib/payos.ts` - PayOS client configuration
- `components/payment/payment-modal.tsx` - Payment UI
- `components/payment/payment-status.tsx` - Status display

## Implementation Steps

### Step 1: Configure PayOS Integration
```typescript
// lib/payos.ts
import { PayOS } from '@payos/node'

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID!,
  apiKey: process.env.PAYOS_API_KEY!,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY!,
})

export async function createPaymentOrder(orderData: {
  orderId: string
  amount: number
  description: string
  returnUrl: string
  cancelUrl: string
}) {
  const order = await payos.createPaymentLink({
    orderCode: parseInt(orderData.orderId),
    amount: orderData.amount,
    description: orderData.description,
    returnUrl: orderData.returnUrl,
    cancelUrl: orderData.cancelUrl,
    buyerName: '',
    buyerEmail: '',
    buyerPhone: '',
    buyerAddress: '',
  })

  return order
}

export function verifyWebhookSignature(body: string, signature: string) {
  return payos.verifyPaymentWebhookSignature(body, signature)
}
```

### Step 2: Order Creation API
```typescript
// app/api/payments/create-order/route.ts
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { courseId, paymentMethod } = await request.json()

  // Get course details
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { title: true, price: true }
  })

  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  // Create order
  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      courseId,
      amount: course.price,
      currency: 'VND',
      status: 'PENDING',
      paymentMethod,
    }
  })

  // Create payment link if PayOS
  if (paymentMethod === 'PAYOS') {
    const payment = await createPaymentOrder({
      orderId: order.id,
      amount: Number(course.price),
      description: `Thanh toan khoa hoc: ${course.title}`,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
    })

    return NextResponse.json({
      orderId: order.id,
      paymentUrl: payment.checkoutUrl,
      orderCode: payment.orderCode
    })
  }

  return NextResponse.json({ orderId: order.id })
}
```

### Step 3: VietQR Implementation
```typescript
// app/api/payments/vietqr/route.ts
export async function POST(request: Request) {
  const { orderId, amount, bankCode } = await request.json()

  // Generate QR code using VietQR API
  const qrResponse = await fetch('https://api.vietqr.io/api/v2/qr/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VIETQR_API_KEY}`
    },
    body: JSON.stringify({
      accountNo: process.env.VIETQR_ACCOUNT_NO!,
      accountName: process.env.VIETQR_ACCOUNT_NAME!,
      acqId: bankCode,
      amount,
      addInfo: `Thanh toan don hang ${orderId}`,
      template: 'compact'
    })
  })

  const qrData = await qrResponse.json()

  // Store QR info
  await prisma.order.update({
    where: { id: orderId },
    data: {
      metadata: {
        qrId: qrData.data.qrId,
        qrData: qrData.data.qrDataURL,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      }
    }
  })

  return NextResponse.json({
    qrDataURL: qrData.data.qrDataURL,
    qrId: qrData.data.qrId,
    accountInfo: {
      bank: qrData.data.bank,
      accountNo: qrData.data.accountNo,
      accountName: qrData.data.accountName
    }
  })
}
```

### Step 4: Webhook Handler
```typescript
// app/api/payments/webhook/route.ts
export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('payos-signature')

  // Verify webhook signature
  try {
    const isValid = verifyWebhookSignature(body, signature || '')
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  } catch (error) {
    console.error('Webhook verification failed:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
  }

  const webhookData = JSON.parse(body)

  // Process payment
  if (webhookData.code === '00') {
    const orderCode = webhookData.orderCode
    const transactionId = webhookData.transactionId

    // Update order status
    const order = await prisma.order.update({
      where: { id: orderCode.toString() },
      data: {
        status: 'COMPLETED',
        transactionId,
        completedAt: new Date()
      },
      include: {
        user: true,
        course: true
      }
    })

    // Create or activate enrollment
    await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: order.userId,
          courseId: order.courseId
        }
      },
      update: {
        status: 'ACTIVE',
        paidAmount: order.amount
      },
      create: {
        userId: order.userId,
        courseId: order.courseId,
        status: 'ACTIVE',
        paidAmount: order.amount
      }
    })

    // Send confirmation email
    await sendPaymentConfirmationEmail(order.user.email, {
      courseTitle: order.course.title,
      amount: order.amount,
      orderId: order.id,
      transactionId
    })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ received: true })
}
```

### Step 5: Payment Status Tracking
```typescript
// app/api/payments/[orderId]/status/route.ts
export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const session = await getServerSession(authOptions)

  const order = await prisma.order.findFirst({
    where: {
      id: params.orderId,
      userId: session?.user.id
    },
    include: {
      course: true
    }
  })

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Check with PayOS if still pending
  if (order.status === 'PENDING' && order.paymentMethod === 'PAYOS') {
    try {
      const paymentInfo = await payos.getPaymentLink(order.paymentId!)

      if (paymentInfo.status === 'PAID') {
        // Update order status
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date()
          }
        })
      }
    } catch (error) {
      console.error('Failed to check payment status:', error)
    }
  }

  return NextResponse.json({
    id: order.id,
    status: order.status,
    amount: order.amount,
    courseTitle: order.course.title,
    createdAt: order.createdAt,
    completedAt: order.completedAt
  })
}
```

### Step 6: Payment UI Components
```typescript
// components/payment/payment-modal.tsx
'use client'

import { useState } from 'react'

interface PaymentModalProps {
  course: Course
  isOpen: boolean
  onClose: () => void
}

export function PaymentModal({ course, isOpen, onClose }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'PAYOS' | 'VIETQR'>('PAYOS')
  const [loading, setLoading] = useState(false)
  const [qrData, setQrData] = useState<any>(null)

  const handlePayment = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({
          courseId: course.id,
          paymentMethod
        })
      })

      const data = await response.json()

      if (paymentMethod === 'PAYOS') {
        // Redirect to PayOS checkout
        window.location.href = data.paymentUrl
      } else if (paymentMethod === 'VIETQR') {
        // Generate QR code
        const qrResponse = await fetch('/api/payments/vietqr', {
          method: 'POST',
          body: JSON.stringify({
            orderId: data.orderId,
            amount: Number(course.price)
          })
        })
        const qrResult = await qrResponse.json()
        setQrData(qrResult)
      }
    } catch (error) {
      console.error('Payment error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Complete Your Purchase</h2>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium">{course.title}</h3>
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(course.price)}
          </p>
        </div>

        <div className="space-y-2">
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              value="PAYOS"
              checked={paymentMethod === 'PAYOS'}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
            />
            <span>Credit/Debit Card (PayOS)</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              value="VIETQR"
              checked={paymentMethod === 'VIETQR'}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
            />
            <span>Bank Transfer (VietQR)</span>
          </label>
        </div>

        {qrData && (
          <div className="text-center space-y-2">
            <img src={qrData.qrDataURL} alt="Payment QR" className="mx-auto" />
            <p className="text-sm text-gray-600">
              Scan this QR code with your banking app
            </p>
            <p className="font-medium">
              {qrData.accountInfo.bank} - {qrData.accountInfo.accountNo}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Processing...' : `Pay ${formatCurrency(course.price)}`}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
```

### Step 7: Payment Retry Logic
```typescript
// lib/payment-retry.ts
export class PaymentRetryHandler {
  static async handleFailedPayment(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, course: true }
    })

    if (!order) return

    // Check if retry limit reached (max 3 attempts)
    if (order.retryCount >= 3) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'FAILED' }
      })

      // Notify support
      await notifySupport(order)
      return
    }

    // Increment retry count
    await prisma.order.update({
      where: { id: orderId },
      data: { retryCount: { increment: 1 } }
    })

    // Generate new payment link
    const newPayment = await createPaymentOrder({
      orderId,
      amount: Number(order.amount),
      description: `Retry payment for ${order.course.title}`,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
    })

    // Send retry email
    await sendPaymentRetryEmail(order.user.email, {
      courseTitle: order.course.title,
      amount: order.amount,
      paymentUrl: newPayment.checkoutUrl,
      attemptNumber: order.retryCount + 1
    })
  }
}
```

### Step 8: Refund Processing
```typescript
// app/api/payments/[orderId]/refund/route.ts
export async function POST(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { reason } = await request.json()

  const order = await prisma.order.findUnique({
    where: { id: params.orderId }
  })

  if (!order || order.status !== 'COMPLETED') {
    return NextResponse.json({ error: 'Invalid order' }, { status: 400 })
  }

  // Process refund with PayOS
  const refund = await payos.createRefund({
    orderCode: parseInt(params.orderId),
    amount: Number(order.amount),
    reason
  })

  // Update order status
  await prisma.order.update({
    where: { id: params.orderId },
    data: {
      status: 'REFUNDED',
      metadata: {
        refundId: refund.data.refundId,
        refundReason: reason
      }
    }
  })

  // Deactivate enrollment
  await prisma.enrollment.updateMany({
    where: {
      userId: order.userId,
      courseId: order.courseId
    },
    data: {
      status: 'CANCELLED'
    }
  })

  return NextResponse.json({ success: true, refundId: refund.data.refundId })
}
```

### Step 9: Payment Analytics
```typescript
// app/api/admin/payments/analytics/route.ts
export async function GET() {
  const dateRange = 30 // Last 30 days

  const [
    totalRevenue,
    paymentMethods,
    dailyRevenue,
    failedPayments
  ] = await Promise.all([
    // Total revenue
    prisma.order.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000)
        }
      },
      _sum: { amount: true },
      _count: true
    }),

    // Payment methods distribution
    prisma.order.groupBy({
      by: ['paymentMethod'],
      where: {
        status: 'COMPLETED'
      },
      _sum: { amount: true },
      _count: true
    }),

    // Daily revenue
    prisma.$queryRaw`
      SELECT DATE_TRUNC('day', "createdAt") as date,
             SUM("amount") as revenue,
             COUNT(*) as orders
      FROM "Order"
      WHERE "status" = 'COMPLETED'
        AND "createdAt" >= NOW() - INTERVAL '${dateRange} days'
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date DESC
    `,

    // Failed payments
    prisma.order.count({
      where: {
        status: 'FAILED',
        createdAt: {
          gte: new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000)
        }
      }
    })
  ])

  return NextResponse.json({
    totalRevenue: totalRevenue._sum.amount || 0,
    totalOrders: totalRevenue._count,
    paymentMethods,
    dailyRevenue,
    failedPayments,
    successRate: ((totalRevenue._count / (totalRevenue._count + failedPayments)) * 100).toFixed(2)
  })
}
```

### Step 10: Email Templates
- Payment confirmation
- Payment failure notification
- Refund confirmation
- Payment retry reminder

## Todo List
- [ ] Configure PayOS client and API keys
- [ ] Implement order creation API
- [ ] Build VietQR code generation
- [ ] Create webhook handler with signature verification
- [ ] Build payment UI components
- [ ] Implement payment status tracking
- [ ] Add payment retry logic
- [ ] Create refund processing
- [ ] Build payment analytics dashboard
- [ ] Set up email notifications
- [ ] Add payment history for users
- [ ] Implement partial payments
- [ ] Create payment receipt PDFs
- [ ] Add support for promotions/coupons
- [ ] Build payment dispute handling
- [ ] Set up payment monitoring alerts

## Success Criteria
1. ✅ PayOS integration fully functional
2. ✅ VietQR codes generate correctly
3. ✅ Webhooks process payments reliably
4. ✅ Courses unlock automatically after payment
5. ✅ Payment retry mechanism working
6. ✅ Refunds processed successfully

## Risk Assessment

**Low Risk**:
- PayOS integration (good documentation)
- Basic payment flows
- Webhook handling

**Medium Risk**:
- VietQR implementation
- Payment security
- Webhook reliability

**High Risk**:
- **Payment Fraud**: Sophisticated fraud attacks on payment processing
- **Webhook Security**: Bypassing HMAC verification for false payment confirmations
- **PCI DSS Compliance**: Payment data security and regulatory requirements
- **Transaction Disputes**: Chargebacks and payment conflicts
- **Financial Data Security**: Exposure of sensitive payment information

**Mitigation Strategies**:
1. **Payment Fraud Prevention**:
   - Advanced fraud detection with machine learning patterns
   - Multi-factor authentication for high-value transactions
   - Device fingerprinting and behavioral analysis
   - Real-time transaction monitoring with anomaly detection

2. **Webhook Security Enhancement**:
   - Implement NestJS crypto with Node.js 22+ latest security features
   - Double verification with PayOS dashboard confirmation
   - Rate limiting and IP whitelisting for webhook endpoints
   - Automated webhook replay attack detection

3. **PCI DSS Compliance**:
   - Never store raw payment card data (use PayOS tokens)
   - Encrypt all sensitive data transmission with TLS 1.3
   - Regular penetration testing and security assessments
   - Maintain compliance documentation and audit trails

4. **Transaction Security**:
   - Atomic database operations for payment processing
   - Comprehensive audit logging for all transactions
   - Automated reconciliation with PayOS reports
   - Secure refund processing with proper authorization

5. **Financial Protection**:
   - Business continuity insurance for payment processing failures
   - Automated chargeback monitoring and response
   - Legal compliance with Vietnamese payment regulations
   - Escrow account setup for disputed funds

## Security Considerations
1. Webhook signature verification mandatory
2. Order amount validation before processing
3. Idempotency keys to prevent duplicates
4. Rate limiting on payment endpoints
5. Secure storage of API keys
6. Payment data encryption
7. PCI DSS compliance
8. Audit trail for all transactions

## Next Steps
1. Complete payment flow testing in sandbox
2. Set up production PayOS account
3. Implement fraud detection rules
4. Begin Phase 06: Admin Features
5. Create payment documentation
6. Set up payment monitoring dashboard