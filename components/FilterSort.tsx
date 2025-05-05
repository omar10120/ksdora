'use client'

import { useLanguage } from '@/context/LanguageContext'

interface FilterSortProps {
  onSortChange: (value: string) => void
  onPriceRangeChange: (min: number, max: number) => void
  onTimeRangeChange: (time: string) => void
}


const FilterSort = ({ onSortChange, onPriceRangeChange, onTimeRangeChange }: FilterSortProps) => {
  const { language, translations } = useLanguage()

  return (
    <div className={`bg-white p-4 rounded-lg shadow-md mb-6 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-black">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {translations.trips.filters.sortBy}
          </label>
            <select
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="price_asc">{translations.trips.filters.sortOptions.priceAsc}</option>
              <option value="price_desc">{translations.trips.filters.sortOptions.priceDesc}</option>
              <option value="time_asc">{translations.trips.filters.sortOptions.timeAsc}</option>
              <option value="time_desc">{translations.trips.filters.sortOptions.timeDesc}</option>
            </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {translations.trips.filters.priceRange}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder={translations.trips.filters.min}
              className="w-full p-2 border rounded-md"
              onChange={(e) => onPriceRangeChange(Number(e.target.value), 0)}
            />
            <input
              type="number"
              placeholder={translations.trips.filters.max}
              className="w-full p-2 border rounded-md"
              onChange={(e) => onPriceRangeChange(0, Number(e.target.value))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {translations.trips.filters.departureTime}
          </label>
          <select
            onChange={(e) => onTimeRangeChange(e.target.value)}
            className="w-full p-2 border rounded-md text-black"
          >
            <option value="all">{translations.trips.filters.allTimes}</option>
            <option value="morning">{translations.trips.filters.morning}</option>
            <option value="afternoon">{translations.trips.filters.afternoon}</option>
            <option value="evening">{translations.trips.filters.evening}</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default FilterSort