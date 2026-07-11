import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { ArrowLeft, Play, Search, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/table';

interface PreviewStepProps {
  filename: string;
  headers: string[];
  rows: Record<string, string>[];
  onBack: () => void;
  onConfirm: () => void;
}

export default function PreviewStep({ filename, headers, rows, onBack, onConfirm }: PreviewStepProps) {
  const [globalFilter, setGlobalFilter] = useState('');

  // Generate columns dynamically from headers
  const columns = useMemo<ColumnDef<Record<string, string>>[]>(() => {
    return headers.map((header) => ({
      accessorKey: header,
      header: header,
      cell: (info) => <span className="truncate max-w-[180px] inline-block">{String(info.getValue() || '')}</span>,
    }));
  }, [headers]);

  // Setup Tanstack Table
  const table = useReactTable({
    data: rows,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <Card className="glass-panel border-border/80 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl text-primary glow-btn">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                CSV Data Preview
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5 truncate max-w-[300px] md:max-w-md">
                File: {filename} ({rows.length} total rows)
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={onBack} className="h-9">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button size="sm" onClick={onConfirm} className="h-9 bg-primary text-primary-foreground font-semibold">
              <Play className="h-4 w-4 mr-2 fill-current" />
              Confirm Import
            </Button>
          </div>
        </CardHeader>

        {/* Controls: Search and stats */}
        <div className="px-6 pb-4 border-b border-border/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search preview rows..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10 h-10 border-border/50 bg-background/30 rounded-xl"
            />
          </div>
          <div className="text-xs text-muted-foreground flex items-center space-x-4">
            <span>Showing {table.getRowModel().rows.length} of {rows.length} rows</span>
            <span>Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
          </div>
        </div>

        {/* Table Body Area */}
        <CardContent className="p-0 overflow-auto flex-1 max-h-[50vh]">
          {rows.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No preview data available.
            </div>
          ) : (
            <div className="relative">
              <Table className="border-collapse min-w-full">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent bg-muted/40 border-b border-border/30">
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="whitespace-nowrap px-4 py-3 font-semibold text-xs text-muted-foreground border-r border-border/10">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={headers.length} className="text-center p-8 text-muted-foreground">
                        No records match your search criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} className="hover:bg-muted/10 border-b border-border/10">
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="px-4 py-2.5 text-xs border-r border-border/5">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Footer with Pagination */}
        <CardFooter className="p-4 border-t border-border/20 flex items-center justify-between bg-muted/20">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">Rows per page:</span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              className="bg-background border border-border/40 rounded-lg text-xs p-1 focus:outline-none"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
