interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
}

export default function StatsCard({ title, value, icon, color }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`${color} p-3 rounded-full`}>
          {icon}
        </div>
        <div className="ml-5">
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-semibold text-gray-800 max-sm:w-full">{value}</p>
        </div>
      </div>
    </div>
  )
}