import * as React from 'react';
import { cn } from '@/lib/utils';

// table variants 추가
type TableVariants = 'default' | 'primary';
type TableAlign = 'left' | 'center' | 'right';
const TableContext = React.createContext<{ variant: TableVariants; align: TableAlign }>({ variant: 'default', align: 'center' });

function Table({
  className,
  variant = 'default',
  align = 'center',
  ...props
}: React.ComponentProps<'table'> & { variant?: TableVariants; align?: TableAlign }) {
  return (
    <TableContext.Provider value={{ variant, align }}>
      <div data-slot="table-container" className="relative w-full overflow-x-auto">
        <table data-slot="table" className={cn('w-full caption-bottom text-base font-light', className)} {...props} />
      </div>
    </TableContext.Provider>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  const { variant } = React.useContext(TableContext);

  return (
    <thead
      data-slot="table-header"
      className={cn(
        'text-gray-900 [&_tr]:border-b',
        variant === 'default' && '[&_tr]:bg-gray-200',
        variant === 'primary' && '[&_tr]:bg-primary-blue-100 [&_tr]:hover:bg-primary-blue-100',
        className
      )}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  const { variant } = React.useContext(TableContext);

  return <tbody data-slot="table-body" className={cn(variant === 'primary' && '[&_tr]:text-gray-800', className)} {...props} />;
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return <tfoot data-slot="table-footer" className={cn('bg-muted/50 border-t font-medium [&>tr]:last:border-b-0', className)} {...props} />;
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'data-[state=selected]:bg-muted hover:bg-muted/30 border-b border-gray-300 transition-colors',
        '[&.anchor]:bg-primary-blue-100',
        className
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  const { align } = React.useContext(TableContext);

  return (
    <th
      data-slot="table-head"
      className={cn(
        'text-foreground h-11 px-5 align-middle font-normal whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        align === 'right' && 'text-right',
        className
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  const { align } = React.useContext(TableContext);

  return (
    <td
      data-slot="table-cell"
      className={cn(
        'p-2.5 px-5 align-middle font-normal whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        align === 'right' && 'text-right',
        className
      )}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return <caption data-slot="table-caption" className={cn('text-muted-foreground mt-4 text-sm', className)} {...props} />;
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
