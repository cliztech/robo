import { DegenMixer } from '../audio/DegenMixer';

export type MixerPanelProps = {
    className?: string;
};

export function MixerPanel({ className }: MixerPanelProps) {
    return (
        <div className={className}>
            <DegenMixer />
        </div>
    );
}
