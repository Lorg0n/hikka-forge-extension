import React from 'react';

interface EpisodeItemProps {
  id: string | number;
  imageUrl: string;
  imageAlt?: string;
  imageTitle?: string;
  episodeTitle: string;
  details: string[];
  isActive: boolean;
  onSelect: (id: string | number) => void;
}

const EpisodeItem: React.FC<EpisodeItemProps> = ({
  id,
  imageUrl,
  imageAlt = "Episode Preview",
  imageTitle = "Preview",
  episodeTitle,
  details,
  isActive,
  onSelect
}) => {
  const handleClick = () => {
    onSelect(id);
  };

  const activeClasses = isActive
    ? 'ring-2 ring-primary ring-offset-2 ring-offset-black'
    : '';

  return (
    <div
      className="flex gap-4 cursor-pointer"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      <div 
        className={`w-36 h-17 flex-shrink-0 rounded-sm overflow-hidden ${activeClasses}`}
      >
        <div className="relative w-full h-full">
          <img
            src={imageUrl}
            title={imageTitle}
            className="absolute inset-0 w-full h-full object-cover rounded-sm"
            alt={imageAlt}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 py-2 min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">{episodeTitle}</p>
        <div className="flex flex-col gap-0">
          {details.map((line, index) => (
            <p key={index} className="text-sm text-muted-foreground truncate">
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EpisodeItem;