import { useState, useEffect } from "react";
import { TopBar } from "./components/TopBar";
import { VideoPlayer } from "./components/VideoPlayer";
import { RowConfigPanel } from "./components/RowConfigPanel";
import { HomePage } from "./pages/HomePage";
import { MoviesPage } from "./pages/MoviesPage";
import { SeriesPage } from "./pages/SeriesPage";
import { YouTubePage } from "./pages/YouTubePage";
import { LiveTVPage } from "./pages/LiveTVPage";
import { RadioPage } from "./pages/RadioPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ContentItem, ContentRowConfig, WatchHistoryItem } from "./types/content";
import { GroupedSeries } from "./utils/seriesGrouping";
import { 
  getMovies, 
  getSeries, 
  getTVChannels, 
  getRadioStations, 
  getTrending,
  getAllContent,
  limitItems
} from "./utils/dataLoader";
import { loadRows, saveRows, generateRowId } from "./utils/rowStorage";
import { filterContent, applySimpleFilters, applyLiveTVFilters, applyRadioFilters } from "./utils/contentFilters";
import { loadWatchHistory, removeFromWatchHistory } from "./utils/watchHistory";
import { getMyList, addToMyList, removeFromMyList } from "./utils/myList";
import { computeAlphabetCounts } from "./components/FilteredPaginatedContent";
import { loadSettings, AppSettings } from "./utils/settings";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { autoSyncIfDue as autoSyncIPTV } from "./utils/iptvSync";
import { autoSyncIfDue as autoSyncPlex } from "./utils/plexSync";

export default function App() {
  const [activeMenu, setActiveMenu] = useState("home");
  const [playingRadio, setPlayingRadio] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<ContentItem | null>(null);
  const [contentRows, setContentRows] = useState<ContentRowConfig[]>([]);
  const [configuringRow, setConfiguringRow] = useState<ContentRowConfig | null>(null);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [myList, setMyList] = useState<ContentItem[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  
  // Series details page state
  const [viewingSeriesDetails, setViewingSeriesDetails] = useState<GroupedSeries | null>(null);
  const [savedSeriesPageState, setSavedSeriesPageState] = useState<{
    filters: any;
    scrollPosition: number;
  } | null>(null);
  
  // Movie details page state
  const [viewingMovieDetails, setViewingMovieDetails] = useState<ContentItem | null>(null);

  // Filter states for Movies and Series pages
  const [movieFilters, setMovieFilters] = useState({
    category: "all",
    platform: "all",
    quality: "all",
    year: "all",
    language: "all"
  });
  const [movieSearchTerm, setMovieSearchTerm] = useState("");
  const [movieSelectedLetter, setMovieSelectedLetter] = useState<string | null>(null);
  
  const [seriesFilters, setSeriesFilters] = useState({
    category: "all",
    platform: "all",
    quality: "all",
    year: "all",
    language: "all"
  });
  const [seriesSearchTerm, setSeriesSearchTerm] = useState("");
  const [seriesSelectedLetter, setSeriesSelectedLetter] = useState<string | null>(null);

  // Filter states for Live TV page
  const [liveTVFilters, setLiveTVFilters] = useState({
    category: "all",
    quality: "all",
    language: "all"
  });
  const [liveTVSearchTerm, setLiveTVSearchTerm] = useState("");
  const [liveTVSelectedLetter, setLiveTVSelectedLetter] = useState<string | null>(null);

  // Filter states for Radio page
  const [radioFilters, setRadioFilters] = useState({
    category: "all",
    language: "all"
  });
  const [radioSearchTerm, setRadioSearchTerm] = useState("");
  const [radioSelectedLetter, setRadioSelectedLetter] = useState<string | null>(null);
  
  // Hover states for dynamic background images
  const [hoveredMovie, setHoveredMovie] = useState<ContentItem | null>(null);
  const [hoveredSeries, setHoveredSeries] = useState<ContentItem | null>(null);
  const [hoveredHome, setHoveredHome] = useState<ContentItem | null>(null);
  const [hoveredTV, setHoveredTV] = useState<ContentItem | null>(null);
  
  // Async loaded data
  const [trendingContent, setTrendingContent] = useState<ContentItem[]>([]);
  const [allMovies, setAllMovies] = useState<ContentItem[]>([]);
  const [popularSeries, setPopularSeries] = useState<ContentItem[]>([]);
  const [tvChannels, setTVChannels] = useState<ContentItem[]>([]);
  const [radioStations, setRadioStations] = useState<ContentItem[]>([]);
  const [allContent, setAllContent] = useState<ContentItem[]>([]);

  // Load rows and watch history from localStorage on mount
  useEffect(() => {
    setContentRows(loadRows());
    setWatchHistory(loadWatchHistory());
    setMyList(getMyList());
    setSettings(loadSettings());
    
    // Check for auto-sync (IPTV and Plex)
    const performAutoSync = async () => {
      let syncPerformed = false;

      // Auto-sync IPTV
      const iptvResult = await autoSyncIPTV((message) => {
        toast.info(message);
      });

      if (iptvResult) {
        if (iptvResult.success) {
          toast.success(`IPTV: ${iptvResult.message} (${iptvResult.itemCount} items)`);
          syncPerformed = true;
        } else {
          toast.error(`IPTV sync failed: ${iptvResult.message}`);
        }
      }

      // Auto-sync Plex
      const plexResult = await autoSyncPlex((message) => {
        toast.info(message);
      });

      if (plexResult) {
        if (plexResult.success) {
          toast.success(`Plex: ${plexResult.message} (${plexResult.itemCount} items)`);
          syncPerformed = true;
        } else {
          toast.error(`Plex sync failed: ${plexResult.message}`);
        }
      }

      // Reload data after sync if any sync was successful
      if (syncPerformed) {
        toast.info("Reloading content...");
        // Give a small delay for the toast to be visible
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    };

    performAutoSync();

    // Load async data
    getTrending().then(setTrendingContent);
    getMovies().then(setAllMovies);
    getSeries().then(setPopularSeries);
    getTVChannels().then(setTVChannels);
    getRadioStations().then(setRadioStations);
    getAllContent().then(setAllContent);
  }, []);

  // Refresh watch history when video closes
  useEffect(() => {
    if (!playingVideo) {
      setWatchHistory(loadWatchHistory());
    }
  }, [playingVideo]);

  // Clear series and movie details view when switching menus
  useEffect(() => {
    setViewingSeriesDetails(null);
    setSavedSeriesPageState(null);
    setViewingMovieDetails(null);
  }, [activeMenu]);

  const handleRadioPlay = (stationUrl: string) => {
    setPlayingRadio((prev) => (prev === stationUrl ? null : stationUrl));
  };

  const handleVideoPlay = (item: ContentItem) => {
    setPlayingVideo(item);
  };

  const handleContinueWatching = (historyItem: WatchHistoryItem) => {
    setPlayingVideo(historyItem.content);
  };

  const handleRemoveFromHistory = (url: string) => {
    removeFromWatchHistory(url);
    setWatchHistory(loadWatchHistory());
  };

  const handleToggleMyList = (item: ContentItem) => {
    const isInList = myList.some(listItem => listItem.url === item.url);
    
    if (isInList) {
      const updatedList = removeFromMyList(item.url);
      setMyList(updatedList);
    } else {
      const updatedList = addToMyList(item);
      setMyList(updatedList);
    }
  };

  const isItemInMyList = (itemUrl: string): boolean => {
    return myList.some(item => item.url === itemUrl);
  };

  const handleVideoClose = () => {
    setPlayingVideo(null);
  };

  const handleAddRow = () => {
    const newRow: ContentRowConfig = {
      id: generateRowId(),
      title: "New Content Row",
      filters: {},
      order: contentRows.length,
      limit: 10,
    };
    const updatedRows = [...contentRows, newRow];
    setContentRows(updatedRows);
    saveRows(updatedRows);
    setConfiguringRow(newRow);
  };

  const handleSaveRow = (updatedConfig: ContentRowConfig) => {
    const updatedRows = contentRows.map((row) =>
      row.id === updatedConfig.id ? updatedConfig : row
    );
    setContentRows(updatedRows);
    saveRows(updatedRows);
  };

  const handleDeleteRow = (rowId: string) => {
    const updatedRows = contentRows
      .filter((row) => row.id !== rowId)
      .map((row, index) => ({ ...row, order: index }));
    setContentRows(updatedRows);
    saveRows(updatedRows);
    setConfiguringRow(null);
  };

  const handleMovieFilterChange = (key: string, value: string) => {
    setMovieFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearMovieFilters = () => {
    setMovieFilters({
      category: "all",
      platform: "all",
      quality: "all",
      year: "all",
      language: "all"
    });
    setMovieSearchTerm("");
    setMovieSelectedLetter(null);
  };

  const handleSeriesFilterChange = (key: string, value: string) => {
    setSeriesFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearSeriesFilters = () => {
    setSeriesFilters({
      category: "all",
      platform: "all",
      quality: "all",
      year: "all",
      language: "all"
    });
    setSeriesSearchTerm("");
    setSeriesSelectedLetter(null);
  };

  const handleLiveTVFilterChange = (key: string, value: string) => {
    setLiveTVFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearLiveTVFilters = () => {
    setLiveTVFilters({
      category: "all",
      quality: "all",
      language: "all"
    });
    setLiveTVSearchTerm("");
    setLiveTVSelectedLetter(null);
  };

  const handleRadioFilterChange = (key: string, value: string) => {
    setRadioFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearRadioFilters = () => {
    setRadioFilters({
      category: "all",
      language: "all"
    });
    setRadioSearchTerm("");
    setRadioSelectedLetter(null);
  };

  const moveRow = (dragIndex: number, hoverIndex: number) => {
    const draggedRow = contentRows[dragIndex];
    const updatedRows = [...contentRows];
    updatedRows.splice(dragIndex, 1);
    updatedRows.splice(hoverIndex, 0, draggedRow);
    
    // Update order property
    const reorderedRows = updatedRows.map((row, index) => ({
      ...row,
      order: index,
    }));
    
    setContentRows(reorderedRows);
    saveRows(reorderedRows);
  };

  // Handle series details navigation
  const handleViewSeriesDetails = (group: GroupedSeries) => {
    // Save current page state
    setSavedSeriesPageState({
      filters: { ...seriesFilters },
      scrollPosition: window.scrollY
    });
    
    setViewingSeriesDetails(group);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromSeriesDetails = () => {
    setViewingSeriesDetails(null);
    
    // Restore scroll position after state updates
    if (savedSeriesPageState) {
      setTimeout(() => {
        window.scrollTo({ top: savedSeriesPageState.scrollPosition, behavior: 'smooth' });
      }, 100);
    }
  };

  // Handle movie details navigation
  const handleViewMovieDetails = (item: ContentItem) => {
    setViewingMovieDetails(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromMovieDetails = () => {
    setViewingMovieDetails(null);
  };

  // Helper function to get row items
  const getRowItems = (config: ContentRowConfig) => {
    const filtered = filterContent(allContent, config.filters);
    const limited = limitItems(filtered, config.limit || 10);
    return { filtered, limited };
  };

  const handleSettingsChange = (newSettings: AppSettings) => {
    setSettings(newSettings);
  };

  const reloadContentData = () => {
    // Reload all content from data sources
    getTrending().then(setTrendingContent);
    getMovies().then(setAllMovies);
    getSeries().then(setPopularSeries);
    getTVChannels().then(setTVChannels);
    getRadioStations().then(setRadioStations);
    getAllContent().then(setAllContent);
  };

  const handleMenuClick = (menu: string) => {
    // Check if trying to access a disabled section
    const isDisabled = 
      (menu === "home" && !settings.showHome) ||
      (menu === "series" && !settings.showSeries) ||
      (menu === "movies" && !settings.showMovies) ||
      (menu === "tv" && !settings.showLive) ||
      (menu === "radio" && !settings.showRadio);
    
    if (isDisabled) {
      // Find the first enabled section (YouTube is always available as fallback)
      if (settings.showHome) {
        setActiveMenu("home");
      } else if (settings.showSeries) {
        setActiveMenu("series");
      } else if (settings.showMovies) {
        setActiveMenu("movies");
      } else if (settings.showLive) {
        setActiveMenu("tv");
      } else if (settings.showRadio) {
        setActiveMenu("radio");
      } else {
        setActiveMenu("youtube"); // Always available fallback
      }
    } else {
      setActiveMenu(menu);
    }
    setShowSettings(false); // Close settings when navigating to other menus
  };

  const renderContent = () => {
    // Show settings page if requested
    if (showSettings) {
      return (
        <SettingsPage
          onClose={() => setShowSettings(false)}
          onSettingsChange={handleSettingsChange}
          onContentReload={reloadContentData}
        />
      );
    }

    if (activeMenu === "home") {
      return (
        <HomePage
          trendingContent={trendingContent}
          hoveredHome={hoveredHome}
          watchHistory={watchHistory}
          myList={myList}
          contentRows={contentRows}
          onPlay={handleVideoPlay}
          onContinueWatching={handleContinueWatching}
          onRemoveFromHistory={handleRemoveFromHistory}
          onItemHover={setHoveredHome}
          onToggleMyList={handleToggleMyList}
          isItemInMyList={isItemInMyList}
          onConfigureRow={setConfiguringRow}
          onAddRow={handleAddRow}
          moveRow={moveRow}
          getRowItems={getRowItems}
          onContentClick={(item, group) => {
            if (item.type === "Series" && group) {
              handleViewSeriesDetails(group);
            } else if (item.type === "Movie") {
              handleViewMovieDetails(item);
            }
          }}
        />
      );
    }

    if (activeMenu === "movies") {
      const filteredMovies = applySimpleFilters(allMovies, movieFilters);
      const movieAlphabetCounts = computeAlphabetCounts(filteredMovies);
      
      return (
        <MoviesPage
          allMovies={allMovies}
          filteredMovies={filteredMovies}
          movieFilters={movieFilters}
          movieSearchTerm={movieSearchTerm}
          movieSelectedLetter={movieSelectedLetter}
          movieAlphabetCounts={movieAlphabetCounts}
          hoveredMovie={hoveredMovie}
          viewingMovieDetails={viewingMovieDetails}
          onFilterChange={handleMovieFilterChange}
          onClearFilters={handleClearMovieFilters}
          onSearchChange={setMovieSearchTerm}
          onLetterChange={setMovieSelectedLetter}
          onPlay={handleVideoPlay}
          onItemHover={setHoveredMovie}
          onToggleMyList={handleToggleMyList}
          isItemInMyList={isItemInMyList}
          onMovieClick={handleViewMovieDetails}
          onBackFromMovieDetails={handleBackFromMovieDetails}
        />
      );
    }

    if (activeMenu === "series") {
      const filteredSeries = applySimpleFilters(popularSeries, seriesFilters);
      const seriesAlphabetCounts = computeAlphabetCounts(filteredSeries);
      
      return (
        <SeriesPage
          popularSeries={popularSeries}
          filteredSeries={filteredSeries}
          seriesFilters={seriesFilters}
          seriesSearchTerm={seriesSearchTerm}
          seriesSelectedLetter={seriesSelectedLetter}
          seriesAlphabetCounts={seriesAlphabetCounts}
          hoveredSeries={hoveredSeries}
          viewingSeriesDetails={viewingSeriesDetails}
          onFilterChange={handleSeriesFilterChange}
          onClearFilters={handleClearSeriesFilters}
          onSearchChange={setSeriesSearchTerm}
          onLetterChange={setSeriesSelectedLetter}
          onPlay={handleVideoPlay}
          onItemHover={setHoveredSeries}
          onToggleMyList={handleToggleMyList}
          isItemInMyList={isItemInMyList}
          onSeriesClick={handleViewSeriesDetails}
          onBackFromSeriesDetails={handleBackFromSeriesDetails}
        />
      );
    }

    if (activeMenu === "tv") {
      const filteredTVChannels = applyLiveTVFilters(tvChannels, liveTVFilters);
      const liveTVAlphabetCounts = computeAlphabetCounts(filteredTVChannels);
      
      return (
        <LiveTVPage
          tvChannels={tvChannels}
          filteredTVChannels={filteredTVChannels}
          liveTVFilters={liveTVFilters}
          liveTVSearchTerm={liveTVSearchTerm}
          liveTVSelectedLetter={liveTVSelectedLetter}
          liveTVAlphabetCounts={liveTVAlphabetCounts}
          hoveredTV={hoveredTV}
          onFilterChange={handleLiveTVFilterChange}
          onClearFilters={handleClearLiveTVFilters}
          onSearchChange={setLiveTVSearchTerm}
          onLetterChange={setLiveTVSelectedLetter}
          onPlay={handleVideoPlay}
          onItemHover={setHoveredTV}
          onToggleMyList={handleToggleMyList}
          isItemInMyList={isItemInMyList}
        />
      );
    }

    if (activeMenu === "youtube") {
      return <YouTubePage onSettingsClick={() => setShowSettings(true)} />;
    }

    if (activeMenu === "radio") {
      const filteredRadioStations = applyRadioFilters(radioStations, radioFilters);
      const radioAlphabetCounts = computeAlphabetCounts(filteredRadioStations);
      
      return (
        <RadioPage
          radioStations={radioStations}
          filteredRadioStations={filteredRadioStations}
          radioFilters={radioFilters}
          radioSearchTerm={radioSearchTerm}
          radioSelectedLetter={radioSelectedLetter}
          radioAlphabetCounts={radioAlphabetCounts}
          playingRadio={playingRadio}
          onFilterChange={handleRadioFilterChange}
          onClearFilters={handleClearRadioFilters}
          onSearchChange={setRadioSearchTerm}
          onLetterChange={setRadioSelectedLetter}
          onRadioPlay={handleRadioPlay}
          onToggleMyList={handleToggleMyList}
          isItemInMyList={isItemInMyList}
        />
      );
    }

    return null;
  };

  return (
    <div className="dark flex h-screen flex-col overflow-hidden bg-black text-white">
      <TopBar 
        onMenuClick={handleMenuClick} 
        activeMenu={activeMenu}
        onSettingsClick={() => setShowSettings(true)}
        showLogo={settings.showLogo}
        showHome={settings.showHome}
        showSeries={settings.showSeries}
        showMovies={settings.showMovies}
        showLive={settings.showLive}
        showRadio={settings.showRadio}
      />
      <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: "touch" }}>
        {renderContent()}
      </main>

      {playingVideo && (
        <VideoPlayer item={playingVideo} onClose={handleVideoClose} />
      )}

      {configuringRow && (
        <RowConfigPanel
          config={configuringRow}
          onSave={handleSaveRow}
          onDelete={() => handleDeleteRow(configuringRow.id)}
          onClose={() => setConfiguringRow(null)}
        />
      )}

      <Toaster />
    </div>
  );
}
