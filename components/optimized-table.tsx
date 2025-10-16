"use client"

import React, { memo, useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getStatusColor, getStatusLabel } from '@/lib/cleanup-utils'

interface OptimizedTableProps {
  data: any[]
  columns: {
    key: string
    label: string
    render?: (value: any, item: any) => React.ReactNode
  }[]
  onEdit?: (item: any) => void
  onDelete?: (item: any) => void
  onView?: (item: any) => void
  loading?: boolean
}

const OptimizedTable = memo(function OptimizedTable({
  data,
  columns,
  onEdit,
  onDelete,
  onView,
  loading = false
}: OptimizedTableProps) {
  const memoizedData = useMemo(() => data, [data])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (!memoizedData || memoizedData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucune donnée disponible
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>
                {column.label}
              </TableHead>
            ))}
            {(onEdit || onDelete || onView) && (
              <TableHead className="text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {memoizedData.map((item, index) => (
            <TableRow key={item.id || index}>
              {columns.map((column) => (
                <TableCell key={column.key}>
                  {column.render 
                    ? column.render(item[column.key], item)
                    : item[column.key]
                  }
                </TableCell>
              ))}
              {(onEdit || onDelete || onView) && (
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onView && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onView(item)}
                      >
                        Voir
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(item)}
                      >
                        Modifier
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(item)}
                      >
                        Supprimer
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
})

export default OptimizedTable
