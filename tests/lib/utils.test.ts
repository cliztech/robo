import { describe, it, expect } from 'vitest';
import { formatDuration, cn } from '@/lib/utils';

describe('utils', () => {
    describe('formatDuration', () => {
        it('formats standard durations correctly', () => {
            expect(formatDuration(65)).toBe('1:05');
            expect(formatDuration(125)).toBe('2:05');
        });

        it('formats exact minutes correctly', () => {
            expect(formatDuration(60)).toBe('1:00');
            expect(formatDuration(120)).toBe('2:00');
        });

        it('formats zero correctly', () => {
            expect(formatDuration(0)).toBe('0:00');
        });

        it('formats large durations correctly', () => {
            expect(formatDuration(3600)).toBe('60:00');
            expect(formatDuration(3665)).toBe('61:05');
        });

        it('handles floating point numbers by flooring', () => {
            expect(formatDuration(65.9)).toBe('1:05');
            expect(formatDuration(120.1)).toBe('2:00');
        });

        it('handles Infinity and NaN gracefully', () => {
            expect(formatDuration(Infinity)).toBe('0:00');
            expect(formatDuration(NaN)).toBe('0:00');
            // Check negative infinity too just in case
            expect(formatDuration(-Infinity)).toBe('0:00');
        });

        it('handles negative numbers (current behavior)', () => {
            // Documenting current behavior:
            // -65 / 60 = -1.0833 -> floor is -2
            // -65 % 60 = -5 -> floor is -5
            // Result: "-2:-5" (padded to "-5")
            // This is weird but it's what the code does. We test to ensure no crash.
            expect(formatDuration(-65)).toBe('-2:-5');
            expect(formatDuration(-5)).toBe('-1:-5');
        });
    });

    describe('cn', () => {
        it('merges class names correctly', () => {
            expect(cn('class1', 'class2')).toBe('class1 class2');
        });

        it('handles conditional classes', () => {
            expect(cn('base', true && 'active', false && 'inactive')).toBe('base active');
            expect(cn('base', undefined, null, false)).toBe('base');
        });

        it('resolves tailwind conflicts', () => {
            // p-4 should be overridden by p-2 if p-2 comes last
            expect(cn('p-4', 'p-2')).toBe('p-2');
            // text-red-500 should be overridden by text-blue-500
            expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
        });

        it('handles array inputs', () => {
             // cn uses clsx which handles arrays, but our signature is ...inputs: ClassValue[]
             // So we pass multiple args.
             // If we pass an array as an arg, clsx handles it.
             expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
        });
    });
});
