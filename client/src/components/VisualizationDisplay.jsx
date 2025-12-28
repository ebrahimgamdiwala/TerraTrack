import { Line, Bar, Doughnut, Scatter } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const VisualizationDisplay = ({ data }) => {
  if (!data || !data.type) return null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#ffffff',
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: data.title || 'Climate Data Visualization',
        color: '#10b981',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#10b981',
        bodyColor: '#ffffff',
        borderColor: '#10b981',
        borderWidth: 1
      }
    },
    scales: data.type !== 'doughnut' ? {
      x: {
        ticks: {
          color: '#9ca3af'
        },
        grid: {
          color: 'rgba(16, 185, 129, 0.1)'
        }
      },
      y: {
        ticks: {
          color: '#9ca3af'
        },
        grid: {
          color: 'rgba(16, 185, 129, 0.1)'
        }
      }
    } : {}
  }

  const renderChart = () => {
    switch (data.type) {
      case 'line':
        return <Line data={data.chartData} options={chartOptions} />
      case 'bar':
        return <Bar data={data.chartData} options={chartOptions} />
      case 'doughnut':
        return <Doughnut data={data.chartData} options={chartOptions} />
      case 'scatter':
        return <Scatter data={data.chartData} options={chartOptions} />
      default:
        return <div className="text-gray-400 text-center py-8">Unsupported chart type: {data.type}</div>
    }
  }

  return (
    <div className="w-full">
      <div className="h-64 w-full">
        {renderChart()}
      </div>
      
      {/* Chart Description */}
      {data.description && (
        <div className="mt-4 text-sm text-white/70 bg-white/5 rounded-lg p-3 border border-white/10">
          <p>{data.description}</p>
        </div>
      )}
    </div>
  )
}

export default VisualizationDisplay