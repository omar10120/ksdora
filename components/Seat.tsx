interface SeatProps {
  number: string;
  isBooked: boolean;
  isBlocked: boolean;
  isSelected: boolean;
  onSelect: (seatNumber: string) => void;
}

export default function Seat({ number, isBooked,isBlocked, isSelected, onSelect }: SeatProps) {
  return (
    <button
      onClick={() => !isBooked && onSelect(number)}
      disabled={isBooked}
      className={`
        w-full p-4 rounded-lg text-center transition-colors
        ${isBooked || isBlocked
          ? `bg-gray-300 ${isBlocked ? 'bg-red-300' : ''} cursor-not-allowed` 
          : isSelected 
            ? 'bg-blue-500 text-white' 
            : 'bg-white border border-gray-300 hover:border-blue-500 text-black'
        }
        
      `}
    >
      {number}
    </button>
  )
}