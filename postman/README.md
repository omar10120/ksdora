# Booking System API - Postman Collection

This Postman collection contains all the endpoints for the comprehensive booking system with payment processing, seat management, and booking status management.

## 📁 Files Included

- `Booking_System_API.postman_collection.json` - Complete API collection
- `Booking_System_Environment.postman_environment.json` - Environment variables
- `README.md` - This documentation file

## 🚀 Quick Setup

### 1. Import Collection
1. Open Postman
2. Click "Import" button
3. Select `Booking_System_API.postman_collection.json`
4. Click "Import"

### 2. Import Environment
1. Click the gear icon (⚙️) in the top right
2. Click "Import"
3. Select `Booking_System_Environment.postman_environment.json`
4. Click "Import"
5. Select the "Booking System Environment" from the dropdown

### 3. Update Variables
Update the following variables in your environment:
- `baseUrl`: Your API base URL (default: `http://localhost:3000`)
- `userId`: Your test user ID
- `tripId`: A valid trip ID from your database
- `bookingId`: Will be auto-populated from responses

## 📋 Collection Structure

### 1. **Booking Management**
- Create Booking (Quantity-based)
- Create Booking (Specific Seats)
- Get User Bookings
- Get Individual Booking
- Update Booking

### 2. **Payment Processing**
- Process Payment (Card)
- Process Payment (Cash)
- Process Payment (Bank Transfer)
- Process Payment (Company)
- Get Payment History

### 3. **Seat Management**
- Get Trip Seat Availability
- Check Specific Seat Availability

### 4. **Seat Locking System**
- Lock Seats
- Release Seat Locks

### 5. **Booking Status Management**
- Update Booking Status
- Cancel Booking
- Complete Booking
- Get Booking Status & Actions

### 6. **Complete Booking Flow Examples**
Step-by-step examples showing the complete booking process:
1. Check Seat Availability
2. Lock Seats (Optional)
3. Create Booking
4. Make Payment
5. Confirm Booking
6. View Final Booking

### 7. **Error Testing**
Examples for testing error handling scenarios

## 🔄 Complete Booking Flow

### Step-by-Step Process:

1. **Check Seat Availability**
   ```
   GET /api/trips/{tripId}/seats
   ```

2. **Lock Seats (Optional)**
   ```
   POST /api/bookings/lock-seats
   Body: {
     "tripId": "trip456",
     "seatNumbers": ["A1", "A2"],
     "lockDuration": 120
   }
   ```

3. **Create Booking**
   ```
   POST /api/bookings
   Body: {
     "tripId": "trip456",
     "selectedSeats": ["A1", "A2"]
   }
   ```

4. **Make Payment**
   ```
   POST /api/bookings/{bookingId}/payments
   Body: {
     "amount": 150.00,
     "method": "card"
   }
   ```

5. **Confirm Booking**
   ```
   PUT /api/bookings/{bookingId}/status
   Body: {
     "status": "confirmed"
   }
   ```

## 💳 Payment Methods Supported

- `cash` - Cash payment
- `card` - Credit/Debit card
- `bank_transfer` - Bank transfer
- `company_alharam` - Company payment

## 📊 Response Examples

### Successful Booking Creation:
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": "booking123",
    "bookingReference": "BK-BOOKING1",
    "status": "pending",
    "totalPrice": 150.00,
    "route": {
      "from": {
        "city": "Riyadh",
        "cityAr": "الرياض",
        "country": "Saudi Arabia",
        "countryAr": "المملكة العربية السعودية"
      },
      "to": {
        "city": "Jeddah",
        "cityAr": "جدة",
        "country": "Saudi Arabia",
        "countryAr": "المملكة العربية السعودية"
      },
      "distance": 850
    },
    "seats": [
      {
        "id": "seat1",
        "seatNumber": "A1",
        "price": 75.00
      },
      {
        "id": "seat2",
        "seatNumber": "A2",
        "price": 75.00
      }
    ],
    "payment": {
      "billId": "bill123",
      "amount": 150.00,
      "status": "unpaid",
      "payments": []
    }
  }
}
```

### Successful Payment:
```json
{
  "success": true,
  "message": "Payment successful! Booking confirmed.",
  "data": {
    "payment": {
      "id": "payment123",
      "amount": 150.00,
      "method": "card",
      "status": "successful",
      "transactionId": "TXN-1234567890-ABC123"
    },
    "billStatus": "paid",
    "bookingStatus": "confirmed",
    "remainingBalance": 0
  }
}
```

## 🔧 Auto-Population Features

The collection includes automatic variable population:
- `bookingId` is automatically extracted from booking creation responses
- Variables are updated dynamically during the booking flow

## 🧪 Testing Scenarios

### Error Testing Examples:
- Invalid Trip ID
- Invalid Seat Selection
- Unauthorized Access
- Invalid Payment Amount
- Invalid Status Transitions

### Business Logic Testing:
- Duplicate booking prevention
- Seat availability validation
- Payment requirement validation
- Status transition validation

## 📝 Notes

1. **Authentication**: All endpoints require `userId` header for user-specific operations
2. **Dynamic Variables**: The collection automatically updates `bookingId` from responses
3. **Error Handling**: Comprehensive error responses with detailed messages
4. **Validation**: All inputs are validated with detailed error messages
5. **Transactions**: All operations use database transactions for data integrity

## 🚨 Important Headers

All requests require these headers:
- `Content-Type: application/json` (for POST/PUT requests)
- `userId: {your-user-id}` (for authenticated endpoints)

## 🔍 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (Validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (Business logic errors)
- `500` - Internal Server Error

## 🎯 Pro Tips

1. **Use the Complete Booking Flow**: Follow the numbered steps for a realistic booking process
2. **Test Error Scenarios**: Use the Error Testing folder to verify error handling
3. **Check Variables**: Monitor the environment variables tab to see auto-populated values
4. **Save Responses**: Use Postman's "Save Response" feature to store successful responses for reference
5. **Use Collections**: Organize your tests by creating folders for different test scenarios

---

**Happy Testing! 🚀**
