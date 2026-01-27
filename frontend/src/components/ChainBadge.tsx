// Reusable Chain Badge Component
import { getChainConfig } from '@/lib/chainConfig';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ChainBadgeProps {
    chainId: number;
    showIcon?: boolean;
    showName?: boolean;
    showTestnetIndicator?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function ChainBadge({
    chainId,
    showIcon = true,
    showName = true,
    showTestnetIndicator = true,
    size = 'md',
    className,
}: ChainBadgeProps) {
    const chain = getChainConfig(chainId);

    if (!chain) {
        return (
            <Badge variant="outline" className={className}>
                Unknown Chain
            </Badge>
        );
    }

    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-1',
        lg: 'text-base px-3 py-1.5',
    };

    const isTestnet = chain.type === 'testnet';

    return (
        <div className={cn('inline-flex items-center gap-1.5', className)}>
            <Badge
                variant={isTestnet ? 'secondary' : 'default'}
                className={cn(
                    'inline-flex items-center gap-1.5',
                    sizeClasses[size],
                    isTestnet && 'border-amber-500/30'
                )}
            >
                {showIcon && <span className="text-base">{chain.icon}</span>}
                {showName && <span>{chain.name}</span>}
            </Badge>
            {showTestnetIndicator && isTestnet && (
                <Badge variant="outline" className="text-xs px-1.5 py-0 border-amber-500/50 text-amber-500">
                    TEST
                </Badge>
            )}
        </div>
    );
}
