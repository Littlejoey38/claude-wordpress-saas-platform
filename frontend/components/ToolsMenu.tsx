'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings2, Wrench } from 'lucide-react'

export interface Tool {
  id: string
  name: string
  category: 'wordpress' | 'gutenberg' | 'fse'
  enabled: boolean
}

interface ToolsMenuProps {
  tools: Tool[]
  onToolsChange: (tools: Tool[]) => void
}

const TOOL_CATEGORIES = {
  wordpress: { label: 'WordPress', icon: '🔧' },
  gutenberg: { label: 'Gutenberg (Temps Réel)', icon: '⚡' },
  fse: { label: 'Full Site Editing', icon: '🎨' },
}

export function ToolsMenu({ tools, onToolsChange }: ToolsMenuProps) {
  const [open, setOpen] = useState(false)

  const toggleTool = (toolId: string) => {
    const updatedTools = tools.map((tool) =>
      tool.id === toolId ? { ...tool, enabled: !tool.enabled } : tool
    )
    onToolsChange(updatedTools)
  }

  const enableCategory = (category: string) => {
    const updatedTools = tools.map((tool) =>
      tool.category === category ? { ...tool, enabled: true } : tool
    )
    onToolsChange(updatedTools)
  }

  const disableCategory = (category: string) => {
    const updatedTools = tools.map((tool) =>
      tool.category === category ? { ...tool, enabled: false } : tool
    )
    onToolsChange(updatedTools)
  }

  const enabledCount = tools.filter((t) => t.enabled).length
  const totalCount = tools.length

  // Group tools by category
  const toolsByCategory = tools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = []
    }
    acc[tool.category].push(tool)
    return acc
  }, {} as Record<string, Tool[]>)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Wrench className="h-4 w-4" />
          <span className="text-xs">
            {enabledCount}/{totalCount} tools
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          <span>Tools Disponibles</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {Object.entries(toolsByCategory).map(([category, categoryTools]) => {
          const categoryInfo = TOOL_CATEGORIES[category as keyof typeof TOOL_CATEGORIES]
          const allEnabled = categoryTools.every((t) => t.enabled)
          const someEnabled = categoryTools.some((t) => t.enabled)

          return (
            <div key={category} className="py-1">
              <div className="flex items-center justify-between px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span>{categoryInfo.icon}</span>
                  <span>{categoryInfo.label}</span>
                </span>
                <div className="flex gap-1">
                  {!allEnabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => enableCategory(category)}
                    >
                      Tout
                    </Button>
                  )}
                  {someEnabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => disableCategory(category)}
                    >
                      Aucun
                    </Button>
                  )}
                </div>
              </div>
              {categoryTools.map((tool) => (
                <DropdownMenuCheckboxItem
                  key={tool.id}
                  checked={tool.enabled}
                  onCheckedChange={() => toggleTool(tool.id)}
                  className="pl-8"
                >
                  <span className="text-sm">{tool.name}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </div>
          )
        })}

        <DropdownMenuSeparator />
        <div className="px-2 py-2 text-xs text-muted-foreground">
          {enabledCount === totalCount
            ? 'Tous les tools sont activés'
            : `${enabledCount} tool${enabledCount > 1 ? 's' : ''} activé${enabledCount > 1 ? 's' : ''}`}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
