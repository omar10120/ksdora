'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  PencilIcon, 
  TrashIcon,
  TruckIcon,
  UsersIcon,
  CogIcon
} from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'

interface Bus {
  id: string
  plateNumber: string
  capacity: number
  model: string
  status: 'active' | 'maintenance' | 'inactive' | 'passenger_filling' | 'in_trip'
}

interface BusCardProps {
  bus: Bus
  onDeleteClick: (busId: string) => void
}

export default function BusCard({ bus, onDeleteClick }: BusCardProps) {
  const router = useRouter()
  const { language, translations } = useLanguage()
  const t = translations.dashboard.buses

  const getStatusColor = (status: Bus['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'inactive': return 'bg-red-100 text-red-800 border-red-200'
      case 'passenger_filling': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in_trip': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: Bus['status']) => {
    switch (status) {
      case 'active': return '🟢'
      case 'maintenance': return '🔧'
      case 'inactive': return '🔴'
      case 'passenger_filling': return '👥'
      case 'in_trip': return '🚌'
      default: return '⚪'
    }
  }

  const getStatusDescription = (status: Bus['status']) => {
    switch (status) {
      case 'active': return 'Ready for service'
      case 'maintenance': return 'Under maintenance'
      case 'inactive': return 'Out of service'
      case 'passenger_filling': return 'Boarding passengers'
      case 'in_trip': return 'Currently on trip'
      default: return 'Unknown status'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
      {/* Header with Status */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <TruckIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{bus.plateNumber}</h3>
              <p className="text-indigo-100 text-sm">{bus.model}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl">{getStatusIcon(bus.status)}</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Capacity Info */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-gray-100 p-3 rounded-lg">
            <UsersIcon className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Capacity</p>
            <p className="text-xl font-semibold text-gray-900">{bus.capacity} seats</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-4">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(bus.status)}`}>
            <span className="mr-2">{getStatusIcon(bus.status)}</span>
            {t.status[bus.status]}
          </div>
          <p className="text-xs text-gray-500 mt-1">{getStatusDescription(bus.status)}</p>
        </div>

        {/* Bus Details */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Plate Number</span>
            <span className="text-sm font-medium text-gray-900">{bus.plateNumber}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Model</span>
            <span className="text-sm font-medium text-gray-900">{bus.model}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-500">Capacity</span>
            <span className="text-sm font-medium text-gray-900">{bus.capacity} passengers</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={() => router.push(`/admin/buses/${bus.id}/edit`)}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors group"
          >
            <PencilIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Edit</span>
          </button>
          
          <button
            onClick={() => onDeleteClick(bus.id)}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors group"
          >
            <TrashIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Delete</span>
          </button>
        </div>
      </div>

      {/* Hover Effect Border */}
      <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
    </div>
  )
}
