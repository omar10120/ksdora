'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { useLanguage } from '@/context/LanguageContext'

interface Route {
  id: string
  departureCity: { name: string }
  arrivalCity: { name: string }
}

interface Bus {
  id: string
  plateNumber: string
  capacity: number
}

interface PageProps {
  params: {
    id: string
  }
}


export default function EditTripPage({ params }: PageProps) {
  const router = useRouter()
  const { language, translations } = useLanguage()
  const t = translations.dashboard.trips.form
  const [routes, setRoutes] = useState<Route[]>([])
  const [buses, setBuses] = useState<Bus[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const token = localStorage.getItem('token')

  
  
  const [newImages, setNewImages] = useState<File[]>([])

  const [existingImages, setExistingImages] = useState<any[]>([])
  const [existingPrimaryImage, setExistingPrimaryImage] = useState<any>(null)
  



  const [formData, setFormData] = useState({
    routeId: '',
    busId: '',
    departureTime: '',
    arrivalTime: '',
    price: '',
    status: 'scheduled',
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    descriptionEn: '',
    latitude: '',
    longitude: '',
    lastBookingTime: '',
    primaryImage: '' as unknown as File | null,
    images: [] as File[] | null,
  } as any)

  useEffect(() => {
    fetchTripDetails()
    fetchRoutes()
    fetchBuses()
  }, [])

  const fetchTripDetails = async () => {
    try {
      
      const response = await fetch(`/api/admin/trips/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) throw new Error(t.errors.loadFailed)
      
      const data = await response.json()
      console.log('Trip details fetched:', data)
      
      setFormData({
        routeId: data.data.routeId,
        busId: data.data.busId,
        departureTime: new Date(data.data.departureTime).toISOString().slice(0, 16),
        arrivalTime: new Date(data.data.arrivalTime).toISOString().slice(0, 16),
        lastBookingTime: new Date(data.data.lastBookingTime).toISOString().slice(0, 16),
        price: data.data.price.toString(),
        status: data.data.status, 
        titleAr: data.data.titleAr,
        titleEn: data.data.titleEn,
        descriptionAr: data.data.descriptionAr,
        descriptionEn: data.data.descriptionEn,
        latitude: data.data.latitude,
        longitude: data.data.longitude,
        primaryImage: null, // Will be set from file input if user selects new primary image
        images: data.data.images,
        
        
      })
      // Handle images - should be array of image objects with id, imageUrl, altText
      let images = data.data.images
      console.log('Raw images from API:', images, 'Type:', typeof images)
      
      if (images) {
        if (Array.isArray(images)) {
          // Already an array of image objects
          console.log('Images is already an array:', images)
          setExistingImages(images)
        } else if (typeof images === 'string') {
          try {
            // Try to parse as JSON first
            const parsed = JSON.parse(images)
            console.log('Parsed JSON:', parsed)
            setExistingImages(Array.isArray(parsed) ? parsed : [images])
          } catch (error) {
            // If not JSON, treat as single string
            console.log('Not JSON, treating as single string:', images)
            setExistingImages([images])
          }
        }
      } else {
        console.log('No images found, setting empty array')
        setExistingImages([])
      }
      
      console.log('Final existingImages:', existingImages)
      setExistingPrimaryImage(data.data.primaryImage)
    } catch (err: any) {
      toast.error(t.errors.loadFailed)
      console.error(err)
    }
  }

  const fetchRoutes = async () => {
    try {
      

      const response = await fetch(`/api/admin/routes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      setRoutes(data.data)
      if (data.success && Array.isArray(data.data)) {
        setRoutes(data.data)
      }
    } catch (error) {
      console.error('Error fetching routes:', error)
    }
  }

  const fetchBuses = async () => {
    try {
      
      

      const response = await fetch(`/api/admin/buses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success && Array.isArray(data.data)) {
        setBuses(data.data)
      }
    } catch (error) {
      console.error('Error fetching buses:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
  
    try {
      
      const form = new FormData();
  
      form.append('routeId', formData.routeId);
      form.append('busId', formData.busId);
      form.append('departureTime', formData.departureTime);
      form.append('arrivalTime', formData.arrivalTime);
      form.append('lastBookingTime', formData.lastBookingTime);
      form.append('price', formData.price);
      form.append('status', formData.status);
      form.append('titleAr', formData.titleAr);
      form.append('titleEn', formData.titleEn);
      form.append('descriptionAr', formData.descriptionAr);
      form.append('descriptionEn', formData.descriptionEn);
      
      form.append('latitude', formData.latitude);
      form.append('longitude', formData.longitude);
      
      // Handle primary image
      if (formData.primaryImage) {
        form.append('primaryImage', formData.primaryImage);
      }
      
      // Send existing image IDs (not the full image objects)
      const existingImageIds = existingImages.map(img => img.id || img).filter(id => id);
      form.append('existingImageIds', JSON.stringify(existingImageIds));
  
      newImages.forEach((file) => {
        form.append('images', file);
      });
      
      // Debug: Log form data being sent
      console.log('Edit form data being sent:')
      console.log('Existing images:', existingImages)
      console.log('New images count:', newImages.length)
      for (let [key, value] of Array.from(form.entries())) {
        if (value instanceof File) {
          console.log(`${key}: File(${value.name}, ${value.size} bytes)`)
        } else {
          console.log(`${key}: ${value}`)
        }
      }
  
      const response = await fetch(`/api/admin/trips/${params.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });
  
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json();
      console.log('Update success response:', data)
  
      toast.success(t.success.updated);
      setTimeout(() => {
        router.push('/admin/trips');
      }, 2000);
    } catch (err: any) {
      toast.error(err.message || t.errors.updateFailed);
    } finally {
      setLoading(false);
    }
  };
  


  

  return (
    <div className={`max-w-2xl mx-auto text-black ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <Toaster />
      <h1 className="text-2xl font-semibold text-gray-800 max-sm:w-full mb-6">{t.title.edit}</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.labels.titleAr}
            </label>
            <input
              type="text"
              
              value={formData.titleAr}
              onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.labels.titleEn}
            </label>
            <input
              type="text"
              
              value={formData.titleEn}
              onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.labels.route}
          </label>
          <select
            required
            value={formData.routeId}
            onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">{t.placeholders.selectRoute}</option>
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.departureCity.name} → {route.arrivalCity.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.labels.bus}
          </label>
          <select
            required
            value={formData.busId}
            onChange={(e) => setFormData({ ...formData, busId: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">{t.placeholders.selectBus}</option>
            {buses.map((bus) => (
              <option key={bus.id} value={bus.id}>
                {bus.plateNumber} ({t.placeholders.busCapacity}: {bus.capacity})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.labels.departureTime}
          </label>
          <input
            type="datetime-local"
            required
            value={formData.departureTime}
            onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.labels.arrivalTime}
          </label>
          <input
            type="datetime-local"
            required
            value={formData.arrivalTime}
            onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.labels.lastbookingTime}
          </label>
          <input
            type="datetime-local"
            required
            value={formData.lastBookingTime}
            onChange={(e) => setFormData({ ...formData, lastBookingTime: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.labels.price}
          </label>
          <input
            type="number"
            required
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.labels.status}
          </label>
          <select
            required
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {Object.entries(t.status.options).map(([key, value]) => (
              <>
                <option key={key} value={key}>{value}</option>
              </>
            ))}
          </select>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.labels.descriptionAr}
            </label>
            <input
              type="text"
              
              value={formData.descriptionAr}
              onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.labels.descriptionEn}
            </label>
            <input
              type="text"
              
              value={formData.descriptionEn}
              onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.labels.latitude}
            </label>
            <input
              type="text"
              
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.labels.longitude}
            </label>
            <input
              type="text"
              
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.labels.primaryImage}
            
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFormData({ ...formData, primaryImage: e.target.files?.[0] })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        {existingPrimaryImage && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.labels.primaryImage}
            </label>
            <img
              src={existingPrimaryImage}
                alt={t.labels.primaryImage}
                
              className="rounded-lg w-full h-32 object-cover border"
            />
          </div>
        )}
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.labels.images}
              </label>
              <input
                accept="image/*"
                multiple
                type="file"
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  if (files) {
                    setNewImages(files)
                  }
                }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
          </div>
          
            {existingImages?.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Existing Images
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {existingImages?.map((img: any, index: number) => (
                    <img
                      key={img.id || index}
                      src={img.imageUrl || img}
                      alt={img.altText || `Trip image ${index + 1}`}
                      className="rounded-lg w-full h-32 object-cover border"
                    />
                  ))}
                  
                </div>
              </div>
            )}

            {newImages?.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Images Preview
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {newImages?.map((file: File, index: number) => (
                    <img
                      key={index}
                      src={URL.createObjectURL(file)}
                      alt={`New image ${index + 1}`}
                      className="rounded-lg w-full h-32 object-cover border"
                    />
                  ))}
                  
                </div>
              </div>
            )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            {t.buttons.cancel}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
          >
            {loading ? t.buttons.updating : t.buttons.update}
          </button>
        </div>

       
      </form>

      
    </div>
  )
}