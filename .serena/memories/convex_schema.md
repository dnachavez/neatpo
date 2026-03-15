# Convex Schema

## Tables

### vendors
- `name` (string), `contactEmail` (optional string), `contactPhone` (optional string), `address` (optional string), `notes` (optional string)
- `userId` (id → users), `createdAt` (number)
- **Indexes**: `by_user` [userId], `by_name` [name]

### users
- `name` (string), `email` (string), `passwordHash` (string)
- `role` (union: "admin" | "staff")
- `createdAt` (number — timestamp)
- **Indexes**: `by_email` [email]

### fieldConfigs
- `userId` (id → users), `label` (string), `key` (string)
- `type` (union: "string" | "number" | "date" | "boolean" | "email" | "phone" | "url" | "textarea" | "currency" | "select" | "time" | "datetime")
- `required` (boolean), `order` (number), `width` (union: "full" | "half")
- `options` (optional array of strings — used for select/dropdown type)
- `isDefault` (boolean), `createdAt` (number)
- **Indexes**: `by_user` [userId], `by_user_and_key` [userId, key]

### purchaseOrders
- `poNumber` (string), `supplier` (string), `vendorId` (optional id → vendors)
- `orderDate` (number), `expectedDeliveryDate` (number)
- `deliveryFee` (optional number), `totalAmount` (optional string), `currency` (optional string)
- `shippingDetails` (optional string), `trackingNumber` (optional string), `notes` (optional string)
- `items` (array of { product: string, quantity: number })
- `customFields` (optional string — JSON of user-configured field values)
- `status` (union: "draft" | "processing" | "completed")
- `sourceDocumentId` (optional id → documents)
- `userId` (id → users), `createdAt` (number)
- **Indexes**: `by_user` [userId], `by_status` [status], `by_poNumber` [poNumber], `by_trackingNumber` [trackingNumber]

### documents
- `filename` (string), `fileStorageId` (string), `mimeType` (string)
- `status` (union: "uploaded" | "processing" | "extracted" | "matched")
- `documentType` (optional string), `extractedData` (optional string — JSON of OCR results)
- `purchaseOrderId` (optional id → purchaseOrders)
- `userId` (id → users), `uploadedAt` (number)
- **Indexes**: `by_user` [userId], `by_status` [status], `by_purchaseOrder` [purchaseOrderId]

### ocrResults
- `documentId` (id → documents), `extractedData` (string — JSON)
- `confidence` (number), `processedAt` (number)
- **Indexes**: `by_document` [documentId]
