'use client'

import { X, Square } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { SelectedBlock } from './WordPressIframe'

interface SelectedBlockBadgeProps {
  selectedBlock: SelectedBlock
  onClear: () => void
}

export function SelectedBlockBadge({ selectedBlock, onClear }: SelectedBlockBadgeProps) {
  // Extraire un nom lisible du block
  const getBlockDisplayName = (blockName: string) => {
    // Transformer "core/paragraph" en "Paragraph"
    const parts = blockName.split('/')
    const name = parts[parts.length - 1]
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ')
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md mb-2">
      <Square className="h-4 w-4 text-blue-600 flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-blue-900">
          Block sélectionné
        </p>
        <p className="text-xs text-blue-700 truncate">
          {getBlockDisplayName(selectedBlock.name)}
        </p>
      </div>

      <Button
        onClick={onClear}
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 hover:bg-blue-100"
      >
        <X className="h-3 w-3 text-blue-700" />
        <span className="sr-only">Désélectionner le block</span>
      </Button>
    </div>
  )
}
