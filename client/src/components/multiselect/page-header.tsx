import Balance from 'react-wrap-balancer';

import { cn } from '@/lib/utils';

function PageHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section className={cn('mx-auto mt-4 flex max-w-[980px] flex-col items-center gap-2 py-4', className)} {...props}>
      {children}
    </section>
  );
}

function PageHeaderHeading({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn('text-center text-4xl leading-tight font-bold tracking-tighter md:text-5xl lg:leading-[1.1]', className)}
      {...props}
    />
  );
}

function PageHeaderDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <Balance className={cn('text-muted-foreground max-w-[750px] text-center text-sm sm:text-lg', className)} {...props} />;
}

function PageActions({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex w-full items-center justify-center space-x-4 py-4 md:pb-10', className)} {...props} />;
}

export { PageHeader, PageHeaderHeading, PageHeaderDescription, PageActions };
