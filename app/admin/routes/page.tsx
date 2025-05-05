'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline'
import toast, { Toaster } from 'react-hot-toast'
import ConfirmDialogAdmin from '@/components/ConfirmDialogAdmin'
import { useLanguage } from '@/context/LanguageContext'
import EditDialog from '@/components/admin/EditRouteDialog'

interface Route {
  id: string
  departureCity: {
    id: string
    name: string
  }
  arrivalCity: {
    id: string
    name: string
  }
  distance: number
  trips: {
    id: string
    bus: {
      plateNumber: string
    }
  }[]
}

export default function RoutesPage() {
  const router = useRouter()
  const { language, translations } = useLanguage()
  const t = translations.dashboard.routes
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchRoutes()
  }, [])

  const fetchRoutes = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/routes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setRoutes(data)
    } catch (error) {
      console.error('Error fetching routes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (routeId: string) => {
    setRouteToDelete(routeId)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteRoute = async () => {
    if (!routeToDelete) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/routes/${routeToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t.delete.error)
      }

      setRoutes(routes.filter(route => route.id !== routeToDelete))
      toast.success(t.delete.success)
    } catch (error: any) {
      toast.error(error.message || t.delete.error)
    } finally {
      setRouteToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }

  const filteredRoutes = routes.filter(route => 
    route.departureCity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.arrivalCity.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Add state for edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)
  
  // Add handleEditClick function
  const handleEditClick = (route: Route) => {
    setSelectedRoute(route)
    setIsEditDialogOpen(true)
  }

  const handleEditComplete = async (updatedRoute: Route) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/routes/${updatedRoute.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedRoute)
      })

      if (!response.ok) {
        throw new Error('Failed to update route')
      }

      // Update routes list with edited route
      setRoutes(routes.map(route => 
        route.id === updatedRoute.id ? updatedRoute : route
      ))
      toast.success(t.edit?.success || 'Route updated successfully')
      setIsEditDialogOpen(false)
    } catch (error) {
      toast.error(t.edit?.error || 'Failed to update route')
    }
  }

  return (
    <div className={language === 'ar' ? 'rtl' : 'ltr'}>
      <Toaster />
      <ConfirmDialogAdmin
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteRoute}
        title={t.delete.title}
        message={t.delete.message}
        confirmText={t.delete.confirm}
        cancelText={t.delete.cancel}
      />

      <div className="flex justify-between max-sm:flex-col items-center mb-6 text-black">
        <h1 className="text-2xl font-semibold text-gray-800 max-sm:w-full">{t.title}</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder={t.search.placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 max-sm:w-full"
            />
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
          <button
            onClick={() => router.push('/admin/routes/new')}
            className="flex items-center space-x-2 px-4 max-sm:px-2 py-2 max-sm:py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <PlusIcon className="h-5 w-5" />
            <span>{t.addButton}</span>
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-scroll">
        <table className="min-w-full divide-y divide-gray-200" dir="ltr">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.columns.from}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.columns.to}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.columns.distance}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.columns.activeTrips}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.columns.actions}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRoutes.map((route) => (
              <tr key={route.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {route.departureCity.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {route.arrivalCity.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {route.distance}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {route.trips.length}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEditClick(route)}
                    
                    className="text-indigo-600 hover:text-indigo-900 cursor-pointer"
                  >
                   
                    
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(route.id)}
                    className="text-red-600 hover:text-red-900 ml-4 cursor-pointer"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    
     
      {/* Add EditDialog */}
      <EditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onUpdate={()=> handleEditComplete}
        route={selectedRoute}
      />
    </div>
  )
}