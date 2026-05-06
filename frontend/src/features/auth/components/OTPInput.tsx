import React, { useState, useRef, useEffect } from 'react';

interface OTPInputProps {
    length?: number;
    onComplete: (code: string) => void;
    disabled?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
    length = 6,
    onComplete,
    disabled = false
}) => {
    const [values, setValues] = useState<string[]>(Array(length).fill(''));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Focus first input on mount
        inputRefs.current[0]?.focus();
    }, []);

    const handleChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newValues = [...values];
        newValues[index] = value;
        setValues(newValues);

        // Move to next input
        if (value && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Check if complete
        if (newValues.every(v => v) && newValues.length === length) {
            onComplete(newValues.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !values[index] && index > 0) {
            // Move to previous input on backspace if current is empty
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, length);

        if (/^\d+$/.test(pastedData)) {
            const newValues = [...values];
            pastedData.split('').forEach((char, i) => {
                if (i < length) newValues[i] = char;
            });
            setValues(newValues);

            // Focus last filled input or last input
            const lastIndex = Math.min(pastedData.length, length) - 1;
            inputRefs.current[lastIndex]?.focus();

            if (newValues.every(v => v)) {
                onComplete(newValues.join(''));
            }
        }
    };

    return (
        <div className="flex gap-2 justify-center">
            {values.map((value, index) => (
                <input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className="w-12 h-14 text-center text-xl font-semibold border-2 border-surface-200 rounded-xl 
                     focus:border-primary-500 focus:ring-2 focus:ring-primary-100 
                     disabled:bg-surface-100 disabled:text-surface-400
                     transition-all duration-200"
                />
            ))}
        </div>
    );
};
