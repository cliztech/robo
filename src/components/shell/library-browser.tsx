import { DegenTrackList } from '../audio/DegenTrackList';

export type LibraryBrowserProps = {
    className?: string;
};

export function LibraryBrowser({ className }: LibraryBrowserProps) {
    return <DegenTrackList className={className} />;
}
