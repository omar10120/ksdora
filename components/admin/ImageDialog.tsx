'use client'
import { useState, useEffect } from 'react'
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface ImageDialogProps {
  isOpen: boolean
  onClose: () => void
  images: string[]
  title?: string
}

export default function ImageDialog({ isOpen, onClose, images, title = "Images" }: ImageDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Reset current index when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0)
      setIsFullscreen(false)
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      switch (event.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          event.preventDefault()
          setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
          break
        case 'ArrowRight':
          event.preventDefault()
          setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
          break
        case 'f':
        case 'F':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            setIsFullscreen(!isFullscreen)
          }
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, images.length, onClose, isFullscreen])

  const nextImage = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }

  const goToImage = (index: number) => {
    setCurrentIndex(index)
  }

  if (!isOpen || images.length === 0) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className={`relative bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'max-w-6xl max-h-[95vh] w-[90vw]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-semibold text-gray-900">
              {title} ({images.length})
            </h3>
            <span className="text-sm text-gray-500">
              {currentIndex + 1} of {images.length}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Fullscreen toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Toggle fullscreen (Ctrl+F)"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Main Image Display */}
        <div className="relative bg-gray-100 flex items-center justify-center min-h-[400px]">
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200 z-10"
                title="Previous image (←)"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>
              
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200 z-10"
                title="Next image (→)"
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Current Image */}
          <div className="flex items-center justify-center p-4 w-full h-full">
            <img
              src={images[currentIndex]}
              alt={`${title} ${currentIndex + 1}`}
              className={`max-w-full max-h-full object-contain rounded-lg shadow-lg transition-all duration-300 ${
                isFullscreen ? 'max-h-[calc(100vh-120px)]' : 'max-h-[60vh]'
              }`}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling?.classList.remove('hidden')
              }}
            />
            
            {/* Error fallback */}
            <div className="hidden flex items-center justify-center w-full h-64 bg-gray-200 rounded-lg">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-2">📷</div>
                <p className="text-gray-500">Failed to load image</p>
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnail Navigation */}
        {images.length > 1 && (
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    index === currentIndex 
                      ? 'border-indigo-500 ring-2 ring-indigo-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAyMEg0MFY0NEgyNFYyMFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTI4IDI0SDM2VjQwSDI4VjI0WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K'
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer with controls */}
        <div className="flex justify-between items-center p-4 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Use arrow keys to navigate • ESC to close • Ctrl+F for fullscreen
          </div>
          
          <div className="flex space-x-2">
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  disabled={currentIndex === 0}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={nextImage}
                  disabled={currentIndex === images.length - 1}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
