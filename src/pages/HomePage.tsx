import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { HeroSection } from "../components/HeroSection";
import { ContentRow } from "../components/ContentRow";
import { MovieCard } from "../components/MovieCard";
import { TVChannelCard } from "../components/TVChannelCard";
import { ContinueWatchingCard } from "../components/ContinueWatchingCard";
import { AddNewRow } from "../components/AddNewRow";
import { ContentItem, ContentRowConfig, WatchHistoryItem } from "../types/content";
import { GroupedSeries } from "../utils/seriesGrouping";

// Draggable Row Component
interface DraggableRowProps {
  config: ContentRowConfig;
  index: number;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  onConfigure: (config: ContentRowConfig) => void;
  onPlay: (item: ContentItem) => void;
  onItemHover?: (item: ContentItem | null) => void;
  onToggleMyList: (item: ContentItem) => void;
  isItemInMyList: (itemUrl: string) => boolean;
  onContentClick: (item: ContentItem, group?: GroupedSeries) => void;
  filteredItems: ContentItem[];
  limitedItems: ContentItem[];
}

function DraggableRow({ 
  config, 
  index, 
  moveRow, 
  onConfigure, 
  onPlay, 
  onItemHover, 
  onToggleMyList, 
  isItemInMyList,
  onContentClick,
  limitedItems
}: DraggableRowProps) {
  const [{ isDragging }, drag] = useDrag({
    type: "ROW",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "ROW",
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveRow(item.index, index);
        item.index = index;
      }
    },
  });

  if (limitedItems.length === 0) {
    return null;
  }

  return (
    <div ref={drop} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <ContentRow
        title={config.title}
        rowId={config.id}
        onConfigure={() => onConfigure(config)}
        dragHandleProps={{ ref: drag }}
        isDraggable={true}
      >
        {limitedItems.map((item) => {
          if (item.type === "TV") {
            return <TVChannelCard key={item.id} item={item} onPlay={onPlay} onHover={onItemHover} onToggleMyList={onToggleMyList} isInMyList={isItemInMyList(item.url)} />;
          }
          return <MovieCard key={item.id} item={item} onDetailsClick={onContentClick} onHover={onItemHover} />;
        })}
      </ContentRow>
    </div>
  );
}

interface HomePageProps {
  trendingContent: ContentItem[];
  hoveredHome: ContentItem | null;
  watchHistory: WatchHistoryItem[];
  myList: ContentItem[];
  contentRows: ContentRowConfig[];
  onPlay: (item: ContentItem) => void;
  onContinueWatching: (historyItem: WatchHistoryItem) => void;
  onRemoveFromHistory: (url: string) => void;
  onItemHover: (item: ContentItem | null) => void;
  onToggleMyList: (item: ContentItem) => void;
  isItemInMyList: (itemUrl: string) => boolean;
  onConfigureRow: (config: ContentRowConfig) => void;
  onAddRow: () => void;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  getRowItems: (config: ContentRowConfig) => { filtered: ContentItem[]; limited: ContentItem[] };
  onContentClick: (item: ContentItem, group?: GroupedSeries) => void;
}

export function HomePage({
  trendingContent,
  hoveredHome,
  watchHistory,
  myList,
  contentRows,
  onPlay,
  onContinueWatching,
  onRemoveFromHistory,
  onItemHover,
  onToggleMyList,
  isItemInMyList,
  onConfigureRow,
  onAddRow,
  moveRow,
  getRowItems,
  onContentClick
}: HomePageProps) {
  const backgroundItem = hoveredHome || trendingContent[0];

  return (
    <DndProvider backend={HTML5Backend}>
      <HeroSection
        title={backgroundItem?.name || "Quantum Nexus"}
        imageUrl={backgroundItem?.logo || "https://images.unsplash.com/photo-1739891251370-05b62a54697b?w=1920"}
        item={backgroundItem}
      />
      
      <div className="relative z-10 mt-32 space-y-12 pb-12">
        {/* Continue Watching Row */}
        {watchHistory.length > 0 && (
          <ContentRow title="Continue Watching">
            {watchHistory.map((historyItem) => (
              <ContinueWatchingCard
                key={historyItem.content.url}
                historyItem={historyItem}
                onPlay={onContinueWatching}
                onRemove={onRemoveFromHistory}
              />
            ))}
          </ContentRow>
        )}

        {/* My List Row */}
        {myList.length > 0 && (
          <ContentRow title="My List">
            {myList.map((item) => {
              if (item.type === "TV") {
                return <TVChannelCard key={item.id} item={item} onPlay={onPlay} onHover={onItemHover} onToggleMyList={onToggleMyList} isInMyList={isItemInMyList(item.url)} />;
              }
              return <MovieCard key={item.id} item={item} onDetailsClick={onContentClick} onHover={onItemHover} />;
            })}
          </ContentRow>
        )}

        {/* Dynamic Content Rows */}
        {contentRows.map((config, index) => {
          const { limited } = getRowItems(config);
          return (
            <DraggableRow
              key={config.id}
              config={config}
              index={index}
              moveRow={moveRow}
              onConfigure={onConfigureRow}
              onPlay={onPlay}
              onItemHover={onItemHover}
              onToggleMyList={onToggleMyList}
              isItemInMyList={isItemInMyList}
              onContentClick={onContentClick}
              filteredItems={[]}
              limitedItems={limited}
            />
          );
        })}
        
        <AddNewRow onAdd={onAddRow} />
      </div>
    </DndProvider>
  );
}
