export interface Trip {
  id: string
  departureCity: string
  destinationCity: string
  departureTime: string
  arrivalTime: string
  price: number
  availableSeats: number
}

export interface Seat {
  id: string
  number: string
  isBooked: boolean
  isSelected?: boolean
}

export interface CustomerInfo {
  name: string
  phone: string
  idNumber: string
}

