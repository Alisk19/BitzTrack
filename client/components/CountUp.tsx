import React, { useState, useEffect, useRef } from 'react';

interface CountUpProps {
    end: number;
    duration?: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
}

const CountUp: React.FC<CountUpProps> = ({ end, duration = 1500, decimals = 0, prefix = '', suffix = '', className = '' }) => {
    const [count, setCount] = useState(0);
    const countRef = useRef(0);
    const startTimeRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const startValue = countRef.current;
        startTimeRef.current = null;

        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const progress = timestamp - startTimeRef.current;
            const rawPercentage = Math.min(progress / duration, 1);

            // Easing function: easeOutQuart
            const percentage = 1 - Math.pow(1 - rawPercentage, 4);

            const nextValue = startValue + (end - startValue) * percentage;
            setCount(nextValue);
            countRef.current = nextValue;

            if (progress < duration) {
                rafRef.current = requestAnimationFrame(animate);
            } else {
                setCount(end);
                countRef.current = end;
            }
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [end, duration]);

    const formattedValue = count.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });

    return (
        <span className={className}>
            {prefix}{formattedValue}{suffix}
        </span>
    );
};

export default CountUp;
