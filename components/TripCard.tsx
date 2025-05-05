import { Trip } from '@/types'
import { useLanguage } from '@/context/LanguageContext'

interface TripCardProps {
  trip: Trip
  onSelect: (tripId: string) => void
}

const TripCard = ({ trip, onSelect }: TripCardProps) => {
  const { language, translations } = useLanguage()

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {trip.departureCity} → {trip.destinationCity}
          </h3>
          <p className="text-sm text-gray-500">
            {translations.trips.tripCard.date}: {new Date(trip.departureTime).toLocaleString(language === 'ar' ? 'en-US' : 'en-US')}
          </p>
        </div>
        <span className="text-xl font-bold text-blue-600">
          ${trip.price} {translations.trips.tripCard.price}
        </span>
      </div>
      
      <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
        <div>
          <p>{translations.trips.search.from}: {new Date(trip.departureTime).toLocaleTimeString(language === 'ar' ? 'en-US' : 'en-US')}</p>
          <p>{translations.trips.search.to}: {new Date(trip.arrivalTime).toLocaleTimeString(language === 'ar' ? 'en-US' : 'en-US')}</p>
        </div>
        <div>
          <p>{trip.availableSeats} {translations.trips.tripCard.seats}</p>
        </div>
      </div>

      <button
        onClick={() => onSelect(trip.id)}
        disabled={trip.availableSeats === 0}
        className={`w-full py-2 rounded transition-colors ${
          trip.availableSeats === 0 
            ? 'bg-gray-400 text-white cursor-not-allowed' 
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {trip.availableSeats === 0 
          ? translations.trips.tripCard.soldOut 
          : translations.trips.tripCard.bookNow
        }
      </button>
    </div>
  )
}

export default TripCard