import { CheckCircle, Circle, Package, Truck, Home, Clock } from 'lucide-react'

interface OrderTimelineProps {
  status: string
  buyType?: string
}

interface TimelineStep {
  key: string
  label: string
  icon: React.ReactNode
}

export function OrderTimeline({ status, buyType = 'buy_now' }: OrderTimelineProps) {
  const steps: TimelineStep[] = [
    {
      key: 'pending_confirmation',
      label: 'Awaiting Confirmation',
      icon: <Clock className="h-5 w-5" />,
    },
    {
      key: 'pending',
      label: 'Order Placed',
      icon: <Package className="h-5 w-5" />,
    },
    {
      key: 'processing',
      label: 'Processing',
      icon: <Circle className="h-5 w-5" />,
    },
    {
      key: 'shipped',
      label: 'Shipped',
      icon: <Truck className="h-5 w-5" />,
    },
    {
      key: 'delivered',
      label: 'Delivered',
      icon: <Home className="h-5 w-5" />,
    },
  ]

  // Filter steps based on buy_type
  const filteredSteps = buyType === 'reserve' 
    ? steps 
    : steps.filter(step => step.key !== 'pending_confirmation')

  const getStatusIndex = () => {
    const statusOrder = ['pending_confirmation', 'pending', 'processing', 'shipped', 'delivered']
    return statusOrder.indexOf(status)
  }

  const currentStatusIndex = getStatusIndex()

  const getStepStatus = (stepKey: string) => {
    const stepIndex = filteredSteps.findIndex(s => s.key === stepKey)
    if (stepIndex < currentStatusIndex) return 'completed'
    if (stepIndex === currentStatusIndex) return 'current'
    return 'pending'
  }

  return (
    <div className="space-y-4">
      {filteredSteps.map((step, index) => {
        const stepStatus = getStepStatus(step.key)
        const isLast = index === filteredSteps.length - 1

        return (
          <div key={step.key} className="relative">
            {/* Timeline line */}
            {!isLast && (
              <div
                className={`absolute left-[23px] top-10 w-0.5 h-12 ${
                  stepStatus === 'completed' ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}

            <div className="flex items-start gap-4">
              {/* Icon */}
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  stepStatus === 'completed'
                    ? 'bg-primary text-primary-foreground'
                    : stepStatus === 'current'
                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {stepStatus === 'completed' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  step.icon
                )}
              </div>

              {/* Label */}
              <div className="flex-1 pt-2">
                <p
                  className={`font-medium ${
                    stepStatus === 'completed' || stepStatus === 'current'
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </p>
                {stepStatus === 'current' && (
                  <p className="text-sm text-muted-foreground mt-1">In progress</p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
