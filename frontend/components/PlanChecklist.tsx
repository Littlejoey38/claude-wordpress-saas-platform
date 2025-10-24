'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle2, Circle, Loader2, Edit2 } from 'lucide-react'

export interface PlanTask {
  id: string
  label: string
  status: 'pending' | 'in_progress' | 'completed'
}

export interface Plan {
  tasks: PlanTask[]
}

interface PlanChecklistProps {
  plan: Plan
  onApprove: () => void
  onReject: () => void
  onEditPlan?: (modifiedPlan: Plan) => void
  isExecuting?: boolean
  currentTaskId?: string | null
}

export function PlanChecklist({
  plan,
  onApprove,
  onReject,
  onEditPlan,
  isExecuting = false,
  currentTaskId = null,
}: PlanChecklistProps) {
  const [isEditing, setIsEditing] = useState(false)

  const getTaskIcon = (task: PlanTask) => {
    if (task.status === 'completed') {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />
    }

    if (task.status === 'in_progress' || task.id === currentTaskId) {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
    }

    return <Circle className="h-5 w-5 text-muted-foreground" />
  }

  const getTaskClasses = (task: PlanTask) => {
    const baseClasses = 'flex items-start gap-3 py-3 px-4 rounded-md transition-colors'

    if (task.status === 'completed') {
      return `${baseClasses} bg-green-50 border border-green-200`
    }

    if (task.status === 'in_progress' || task.id === currentTaskId) {
      return `${baseClasses} bg-blue-50 border border-blue-200`
    }

    return `${baseClasses} hover:bg-muted/50`
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-primary" />
          Plan d&apos;exécution
        </CardTitle>
        <CardDescription>
          Vérifiez les étapes ci-dessous avant de commencer l&apos;exécution.
          {isExecuting && (
            <span className="ml-2 text-blue-600 font-medium">
              Exécution en cours...
            </span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {plan.tasks.map((task, index) => (
              <div key={task.id} className={getTaskClasses(task)}>
                <div className="flex-shrink-0 mt-0.5">
                  {getTaskIcon(task)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-muted-foreground flex-shrink-0">
                      {index + 1}.
                    </span>
                    <p className={`text-sm ${
                      task.status === 'completed'
                        ? 'text-muted-foreground line-through'
                        : 'text-foreground'
                    }`}>
                      {task.label}
                    </p>
                  </div>

                  {task.status === 'in_progress' && (
                    <div className="mt-2">
                      <div className="h-1 w-full bg-blue-200 rounded-full overflow-hidden">
                        <div className="h-full w-1/2 bg-blue-600 rounded-full animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {!isExecuting && (
          <div className="mt-4 p-3 bg-muted/50 rounded-md">
            <p className="text-xs text-muted-foreground">
              💡 Vous pouvez modifier ce plan avant de l&apos;exécuter en cliquant sur &quot;Modifier le plan&quot;
            </p>
          </div>
        )}
      </CardContent>

      {!isExecuting && (
        <CardFooter className="flex gap-3">
          <Button
            onClick={onReject}
            variant="outline"
            className="flex-1"
          >
            Annuler
          </Button>

          {onEditPlan && (
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant="secondary"
              className="flex-1"
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Modifier le plan
            </Button>
          )}

          <Button
            onClick={onApprove}
            className="flex-1"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Exécuter le plan
          </Button>
        </CardFooter>
      )}

      {isExecuting && (
        <CardFooter>
          <div className="w-full text-center py-2">
            <p className="text-sm text-muted-foreground">
              {plan.tasks.filter(t => t.status === 'completed').length} / {plan.tasks.length} tâches terminées
            </p>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
