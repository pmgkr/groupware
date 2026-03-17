'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Badge } from './ui/badge';
import { useTheme } from 'next-themes';

interface CodeSheetProps {
  title: string;
  description?: string;
  code: string;
  language?: string;
  triggerText?: string;
  triggerVariant?: 'default' | 'outline' | 'secondary' | 'ghost';
  fileName?: string;
  children?: React.ReactNode;
}

export function CodeSheet({
  title,
  description,
  code,
  language = 'tsx',
  triggerText = 'Code',
  triggerVariant = 'ghost',
  fileName,
  children,
}: CodeSheetProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      toast.success('Code copied to clipboard!', {
        description: 'Ready to paste in your project',
        duration: 2000,
      });

      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy code', {
        description: 'Please try selecting and copying manually',
        duration: 3000,
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button variant={triggerVariant} size="sm" className="transition-all duration-200 hover:scale-105 hover:bg-transparent">
            <Icons.code className="mr-2 h-4 w-4" />
            <p className="text-xs">{triggerText}</p>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-xl font-semibold">
              <Icons.code className="text-primary h-5 w-5" />
              {title}
            </SheetTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {language.toUpperCase()}
              </Badge>
              {fileName && (
                <Badge variant="outline" className="text-xs">
                  {fileName}
                </Badge>
              )}
            </div>
          </div>
          {description && <SheetDescription className="text-muted-foreground">{description}</SheetDescription>}
        </SheetHeader>

        <div className="mt-6">
          {/* Header with copy button */}
          <div className="bg-muted/50 flex items-center justify-between rounded-t-lg border px-4 py-3">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Icons.harddrive className="h-4 w-4" />
              <span>Code Example</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className={cn(
                'transition-all duration-200',
                isCopied && 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
              )}>
              {isCopied ? <Icons.check className="mr-2 h-4 w-4" /> : <Icons.copy className="mr-2 h-4 w-4" />}
              <span className="text-xs">{isCopied ? 'Copied!' : 'Copy Code'}</span>
            </Button>
          </div>

          {/* Code block */}
          <div className="relative">
            <div className="bg-muted/30 overflow-auto rounded-b-lg border border-t-0 pt-2 [&_code]:!text-sm [&_pre]:!text-sm">
              <SyntaxHighlighter
                language={language}
                style={theme === 'dark' ? oneDark : oneLight}
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  background: 'transparent',
                  fontSize: '0.75rem !important',
                  lineHeight: '1.5',
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  whiteSpace: 'pre',
                  wordBreak: 'normal',
                  overflowWrap: 'normal',
                }}
                codeTagProps={{
                  style: {
                    fontFamily: 'inherit',
                    whiteSpace: 'pre',
                    fontSize: '0.75rem !important',
                  },
                }}
                showLineNumbers={true}
                lineNumberStyle={{
                  minWidth: '3rem',
                  paddingRight: '1rem',
                  color: theme === 'dark' ? 'rgb(156 163 175)' : 'rgb(107 114 128)',
                  borderRight: `1px solid ${theme === 'dark' ? 'rgb(55 65 81)' : 'rgb(229 231 235)'}`,
                  marginRight: '1rem',
                  textAlign: 'right',
                  userSelect: 'none',
                }}
                wrapLines={false}
                wrapLongLines={false}
                PreTag={({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
                  <pre {...props} style={{ margin: 0, background: 'transparent' }}>
                    {children}
                  </pre>
                )}>
                {code}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* Additional info */}
          <div className="bg-muted/20 mt-4 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <Icons.activity className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <h4 className="mb-1 text-sm font-medium">Integration Tips</h4>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>• Copy the code and paste it into your component</li>
                  <li>• Make sure to import the MultiSelect component</li>
                  <li>• Adjust the options array for your use case</li>
                  <li>• Add proper TypeScript types if needed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
