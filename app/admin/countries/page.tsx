'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline'
import ConfirmDialogAdmin from '@/components/ConfirmDialogAdmin'
import { useLanguage } from '@/context/LanguageContext'


interface country {
  id: string
  name: string
  nameAr: string
  code: string

}

export default function CountriesPage() {
  const router = useRouter()
  const { language, translations } = useLanguage()
  const t = translations.dashboard.countries
  const [Countries, setCountries] = useState<country[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [countryToDelete, setcountryToDelete] = useState<string | null>(null)
  

  const fetchCountries = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/countries', {
        
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const result = await response.json()
      
      if (Array.isArray(result.data)) {
        setCountries(result.data)
      } else {
        console.error('Invalid Countries response:', result)
        setCountries([])
      }
    } catch (error) {
      console.error('Error fetching Countries:', error)
      toast.error(t.form.errors.loadFailed)
      setCountries([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isSubscribed = true;

    const initializeFetch = async () => {
      if (isSubscribed) {
        await fetchCountries()
      }
    }

    initializeFetch()

    return () => {
      isSubscribed = false
    }
  }, [])

  const handleDeleteClick = (countryId: string) => {
    setcountryToDelete(countryId)
    setIsDeleteDialogOpen(true)
  }

  const handleDeletecountry = async () => {
    if (!countryToDelete) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/countries/${countryToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.data.error || t.delete.error)
      }

      setCountries(Countries.filter(country => country.id !== countryToDelete))
      toast.success(t.delete.success)
    } catch (error: any) {
      toast.error(error.message || t.delete.error)
    } finally {
      setcountryToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }

  const filteredCountries = Countries.filter(country => 
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.nameAr.includes(searchTerm)
  )

  return (
    <div className={language === 'ar' ? 'rtl' : 'ltr'}>
      <Toaster />
      <ConfirmDialogAdmin
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeletecountry}
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
            onClick={() => router.push('/admin/countries/new')}
            className="flex items-center space-x-2 px-4 max-sm:px-2 py-2 max-sm:py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
                {t.columns.nameEn}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.columns.nameAr}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.columns.code}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.columns.actions}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCountries.map((country) => (
              <tr key={country.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {country.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" dir="rtl">
                  {country.nameAr}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" dir="rtl">
                  {country.code}
                </td>
                
             
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => router.push(`/admin/countries/${country.id}/edit`)}
                    className="text-indigo-600 hover:text-indigo-900 cursor-pointer"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(country.id)}
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
    </div>
  )
}