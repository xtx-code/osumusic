import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion'
import { Howl } from 'howler'
import './App.css'

interface Beatmap {
    id: string; // UUID from Realm
    difficulty: string;
    starRating: number;
    bpm: number;
    totalLength: number;
    cs: number;
    ar: number;
    od: number;
    hp: number;
    audioPath: string;
    backgroundPath: string;
    mapper: string;
    onlineId: number;
    rulesetId: number;
}



interface BeatmapSet {
    id: string;
    onlineId: number;
    title: string;
    unicodeTitle: string;
    artist: string;
    unicodeArtist: string;
    coverPath: string;
    status: number;
    beatmaps: Beatmap[];
}

function formatTime(ms: number) {
    if (!ms || isNaN(ms)) return "0:00";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

const StarIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle', marginTop: '-2px' }}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
);

const OsuIcon = () => (
    <svg width="20" height="20" viewBox="0 0 100 100" fill="currentColor">
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" />
        <circle cx="50" cy="50" r="22" />
    </svg>
);

const TaikoIcon = () => (
    <svg width="20" height="20" viewBox="0 0 100 100" fill="currentColor">
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" />
        <rect x="46" y="25" width="8" height="50" rx="4" />
        <circle cx="50" cy="50" r="15" stroke="currentColor" strokeWidth="6" fill="none" />
    </svg>
);

const CatchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 100 100" fill="currentColor">
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" />
        <circle cx="50" cy="38" r="7" />
        <circle cx="38" cy="58" r="7" />
        <circle cx="62" cy="58" r="7" />
    </svg>
);

const ManiaIcon = () => (
    <svg width="20" height="20" viewBox="0 0 100 100" fill="currentColor">
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" />
        <rect x="35" y="30" width="6" height="40" rx="3" />
        <rect x="47" y="30" width="6" height="40" rx="3" />
        <rect x="59" y="30" width="6" height="40" rx="3" />
    </svg>
);

const SearchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

function App() {
    const [beatmaps, setBeatmaps] = useState<BeatmapSet[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSet, setSelectedSet] = useState<BeatmapSet | null>(null);
    const [selectedMap, setSelectedMap] = useState<Beatmap | null>(null);
    const [showDiffSelector, setShowDiffSelector] = useState(false);
    const soundRef = useRef<Howl | null>(null);

    const [seek, setSeek] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSeeking, setIsSeeking] = useState(false);
    const requestRef = useRef<number | null>(null);

    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Standard Motion Values (Removing Springiness)
    const y = useMotionValue(0);
    const isDragging = useRef(false);

    useEffect(() => {
        const animate = () => {
            if (!isSeeking && soundRef.current && soundRef.current.playing()) {
                setSeek(soundRef.current.seek());
                setDuration(soundRef.current.duration());
                setIsPlaying(true);
            } else if (!soundRef.current || !soundRef.current.playing()) {
                setIsPlaying(false);
            }

            requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(requestRef.current as number);
    }, [isSeeking]);

    const [selectedMode, setSelectedMode] = useState(3); // Default to osu!mania (3)

    const modes = [
        { id: 0, label: 'osu!', icon: <OsuIcon /> },
        { id: 1, label: 'taiko', icon: <TaikoIcon /> },
        { id: 2, label: 'catch', icon: <CatchIcon /> },
        { id: 3, label: 'mania', icon: <ManiaIcon /> },
    ];

    // Filter beatmaps based on selected mode AND search query
    const filteredBeatmaps = beatmaps.filter(set => {
        const matchesMode = set.beatmaps.some(map => map.rulesetId === selectedMode);
        if (!matchesMode) return false;

        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;

        const matchesTitle = set.title.toLowerCase().includes(query) || (set.unicodeTitle && set.unicodeTitle.toLowerCase().includes(query));
        const matchesArtist = set.artist.toLowerCase().includes(query) || (set.unicodeArtist && set.unicodeArtist.toLowerCase().includes(query));
        const matchesMapper = set.beatmaps.some(map => map.mapper.toLowerCase().includes(query));

        return matchesTitle || matchesArtist || matchesMapper;
    });

    // Reset scroll when searching starts
    useEffect(() => {
        if (isSearching) {
            y.set(0);
        }
    }, [isSearching, y]);

    // Clamp scroll when filtered list changes
    useEffect(() => {
        // We use a small timeout to let the DOM update scrollHeight
        const timer = setTimeout(() => {
            const container = document.querySelector('.carousel-area');
            const inner = document.querySelector('.bounce-inner-container');
            if (container && inner) {
                const limit = inner.scrollHeight - container.clientHeight;
                const currentY = y.get();
                const maxScroll = Math.max(0, limit);
                if (currentY < -maxScroll) {
                    animate(y, -maxScroll, { type: 'spring', damping: 25, stiffness: 200 });
                }
            }
        }, 50);
        return () => clearTimeout(timer);
    }, [filteredBeatmaps.length, y]);

    useEffect(() => {
        const loadBeatmaps = async () => {
            if (window.electron) {
                try {
                    const maps = await window.electron.getBeatmaps();
                    setBeatmaps(maps);
                    // Initial selection logic moved to useEffect below to handle mode default
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        loadBeatmaps();
    }, []);

    // Effect to select first map when mode changes or maps load
    useEffect(() => {
        if (beatmaps.length > 0 && !selectedSet) {
            // Find first set with current mode
            const firstSet = beatmaps.find(set => set.beatmaps.some(m => m.rulesetId === selectedMode));
            if (firstSet) {
                // For initial load, we don't necessarily want to scroll/animate
                handleSelectSet(firstSet, false);
            }
        }
    }, [beatmaps, selectedMode]); // Re-run if mode changes

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (filteredBeatmaps.length === 0) return;
            const currentIndex = selectedSet ? filteredBeatmaps.findIndex(b => b.id === selectedSet.id) : -1;

            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                const prevIndex = currentIndex <= 0 ? filteredBeatmaps.length - 1 : currentIndex - 1;
                handleSelectSet(filteredBeatmaps[prevIndex]);
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                const nextIndex = (currentIndex + 1) % filteredBeatmaps.length;
                handleSelectSet(filteredBeatmaps[nextIndex]);
            } else if (e.key === 'Enter') {
                if (isSearching) {
                    setIsSearching(false);
                    setSearchQuery('');
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [filteredBeatmaps, selectedSet]);

    const selectBeatmap = (map: Beatmap, autoPlay: boolean = true) => {
        // If we represent the same audio file, don't restart playback
        const isSameAudio = selectedMap?.audioPath === map.audioPath;

        setSelectedMap(map);

        if (isSameAudio) {
            // If it's the same audio, we just update metadata.
            return;
        }

        // New audio track
        if (soundRef.current) {
            soundRef.current.stop();
            soundRef.current.unload();
        }

        if (map.audioPath) {
            const sound = new Howl({
                src: [`file://${map.audioPath}`], // Direct file access for better seeking support
                html5: true, // Restore HTML5 Audio
                volume: 0.5,
                autoplay: autoPlay, // Only auto-play if requested (e.g. new set selected)
            });
            if (autoPlay) {
                sound.play();
            }
            soundRef.current = sound;
        }
    };

    const handleSelectSet = (set: BeatmapSet, shouldAnimate: boolean = true) => {
        if (selectedSet?.id === set.id) {
            // Scroll to center even if already selected
            if (shouldAnimate) scrollToCenter(set.id);
            return;
        }
        setSelectedSet(set);
        setIsSearching(false);
        setSearchQuery('');

        // Find best map for current mode
        const modeMaps = set.beatmaps.filter(m => m.rulesetId === selectedMode);
        const mapsToUse = modeMaps.length > 0 ? modeMaps : set.beatmaps;

        if (mapsToUse.length > 0) {
            const sorted = [...mapsToUse].sort((a, b) => a.starRating - b.starRating);
            selectBeatmap(sorted[0], true);
        }

        if (shouldAnimate) {
            scrollToCenter(set.id);
        }
    };

    const scrollToCenter = (setId: string) => {
        // Use a slight timeout to ensure React has rendered the .active-set class if it was just changed,
        // though we use setId to be more reliable.
        setTimeout(() => {
            const container = document.querySelector('.carousel-area');
            const items = document.querySelectorAll('.beatmap-set-container');
            const targetIndex = filteredBeatmaps.findIndex(b => b.id === setId);
            const item = items[targetIndex] as HTMLElement;

            if (container && item) {
                const containerHeight = container.clientHeight;
                const itemTop = item.offsetTop;
                const itemHeight = item.clientHeight;

                // Center focus shifted one block higher (subtracting height + margin)
                let targetY = (containerHeight / 2) - itemTop - (itemHeight / 2) - (itemHeight + 6);

                // Clamping
                const inner = document.querySelector('.bounce-inner-container');
                if (inner) {
                    const limit = inner.scrollHeight - containerHeight;
                    const maxScroll = Math.max(0, limit);
                    if (targetY > 0) targetY = 0;
                    if (targetY < -maxScroll) targetY = -maxScroll;
                }

                animate(y, targetY, {
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    mass: 0.8
                });
            }
        }, 10);
    };

    const handleNext = () => {
        if (!selectedSet || filteredBeatmaps.length === 0) return;
        const currentIndex = filteredBeatmaps.findIndex(b => b.id === selectedSet.id);
        const nextIndex = (currentIndex + 1) % filteredBeatmaps.length;
        handleSelectSet(filteredBeatmaps[nextIndex]);
    };

    const handlePrev = () => {
        if (!selectedSet || filteredBeatmaps.length === 0) return;
        const currentIndex = filteredBeatmaps.findIndex(b => b.id === selectedSet.id);
        const prevIndex = (currentIndex - 1 + filteredBeatmaps.length) % filteredBeatmaps.length;
        handleSelectSet(filteredBeatmaps[prevIndex]);
    };

    // ... seek handlers ...
    const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newSeek = parseFloat(e.target.value);
        setSeek(newSeek);
    };

    const handleSeekMouseDown = () => {
        setIsSeeking(true);
    };

    const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
        const target = e.currentTarget as HTMLInputElement;
        const newSeek = parseFloat(target.value);

        if (soundRef.current && !isNaN(newSeek)) {
            soundRef.current.seek(newSeek);
            setSeek(newSeek);
        }

        setTimeout(() => {
            setIsSeeking(false);
        }, 500);
    };

    const handleMapperClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedMap && window.electron && window.electron.openExternal) {
            // We need the integer OnlineID, not the Realm UUID.
            if (selectedMap.onlineId && selectedMap.onlineId > 0) {
                const url = `https://osu.ppy.sh/b/${selectedMap.onlineId}`;
                window.electron.openExternal(url);
            } else {
                // Fallback for offline/unsubmitted maps: Search by title
                const query = `${selectedSet?.artist} - ${selectedSet?.title}`;
                const url = `https://osu.ppy.sh/beatmapsets?q=${encodeURIComponent(query)}`;
                window.electron.openExternal(url);
            }
        }
    };

    return (
        <div className="app-container">
            {/* Background Layer */}
            <div className="background-layer">
                <AnimatePresence mode="wait">
                    {selectedMap && (
                        <motion.img
                            key={selectedMap.backgroundPath}
                            src={selectedMap.backgroundPath ? `osumusic://${selectedMap.backgroundPath}` : ''}
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 0.6, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8 }}
                            className="bg-image"
                        />
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {loading ? (
                    // ... loader ...
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="loader"
                    >
                        INITIALIZING...
                    </motion.div>
                ) : (
                    <div className="ui-layer mobile-layout">
                        {/* Top Bar */}
                        <header className="top-bar">
                            <div className="branding">
                                <div className="logo">osu! music</div>
                                <div className={`search-container ${isSearching ? 'active' : ''}`}>
                                    <button
                                        className="search-toggle-btn"
                                        onClick={() => setIsSearching(!isSearching)}
                                    >
                                        <SearchIcon />
                                    </button>
                                    <AnimatePresence>
                                        {isSearching && (
                                            <motion.input
                                                initial={{ width: 0, opacity: 0 }}
                                                animate={{ width: 200, opacity: 1 }}
                                                exit={{ width: 0, opacity: 0 }}
                                                autoFocus
                                                type="text"
                                                className="search-input"
                                                placeholder="Search song, artist, mapper..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <AnimatePresence>
                                {!isSearching && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="mode-selector"
                                    >
                                        {modes.map(mode => (
                                            <button
                                                key={mode.id}
                                                className={`mode-btn-icon ${selectedMode === mode.id ? 'active' : ''}`}
                                                onClick={() => setSelectedMode(mode.id)}
                                                title={mode.label}
                                            >
                                                {mode.icon}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </header>

                        {/* Main Content Area - Just the Carousel */}
                        <div className="main-content full-width">
                            <div className="carousel-area full-width-carousel" style={{ overflow: 'hidden' }}>
                                <motion.div
                                    drag="y"
                                    style={{ y, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', touchAction: 'none', paddingBottom: '400px' }}
                                    dragConstraints={(() => {
                                        const container = document.querySelector('.carousel-area');
                                        const inner = document.querySelector('.bounce-inner-container');
                                        if (container && inner) {
                                            const limit = inner.scrollHeight - container.clientHeight;
                                            return { top: -Math.max(0, limit), bottom: 0 };
                                        }
                                        return { top: 0, bottom: 0 };
                                    })()}
                                    dragElastic={0}
                                    dragMomentum={true}
                                    onDragStart={() => { isDragging.current = true; }}
                                    onDragEnd={() => { isDragging.current = false; }}
                                    className="bounce-inner-container"
                                    onWheel={(e) => {
                                        const container = document.querySelector('.carousel-area');
                                        const inner = e.currentTarget;
                                        if (container && inner) {
                                            const limit = inner.scrollHeight - container.clientHeight;
                                            const currentY = y.get();
                                            const maxScroll = Math.max(0, limit);

                                            let delta = e.deltaY;
                                            let nextY = currentY - delta;

                                            // Strict Clamping (Removing "Drunk" Springiness)
                                            if (nextY > 0) nextY = 0;
                                            if (nextY < -maxScroll) nextY = -maxScroll;

                                            y.set(nextY);
                                        }
                                    }}
                                >
                                    {filteredBeatmaps.map(set => (
                                        <div
                                            key={set.id}
                                            className={`beatmap-set-container ${selectedSet?.id === set.id ? 'active-set' : ''}`}
                                        >
                                            <div
                                                className={`beatmap-card mobile-card ${selectedSet?.id === set.id ? 'active' : ''}`}
                                                onClick={() => handleSelectSet(set)}
                                            >
                                                <div className="card-bg" style={{
                                                    backgroundImage: set.coverPath ? `url("osumusic://${set.coverPath}")` : 'none'
                                                }} />
                                                <div className="card-content">
                                                    <div className="info">
                                                        <h3 className="card-title">{set.title}</h3>
                                                        <p className="card-artist">{set.artist}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            </div>
                        </div>

                        {/* Fixed Bottom Player Bar */}
                        <footer className="player-bar mobile-footer">
                            {selectedSet && selectedMap && (
                                <div className="footer-content">
                                    {/* 1. Controls (Top of footer) */}
                                    <div className="mobile-controls">
                                        <button className="control-btn" onClick={handlePrev}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
                                        </button>
                                        <button className="control-btn play-btn" onClick={() => {
                                            if (soundRef.current) {
                                                if (soundRef.current.playing()) soundRef.current.pause();
                                                else soundRef.current.play();
                                            }
                                        }}>
                                            {isPlaying ? (
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                                            ) : (
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                                            )}
                                        </button>
                                        <button className="control-btn" onClick={handleNext}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                                        </button>
                                    </div>

                                    {/* 2. Title & Artist (Middle of footer) */}
                                    <div className="mobile-track-info">
                                        <h1 className="mobile-title">{selectedSet.title}</h1>
                                        <h2 className="mobile-artist">{selectedSet.artist}</h2>
                                    </div>

                                    {/* 3. Seek Bar & Time */}
                                    <div className="seek-bar-container">
                                        <input
                                            type="range"
                                            min="0"
                                            max={duration || 0}
                                            step="0.1"
                                            value={seek}
                                            onChange={handleSeekChange}
                                            onMouseDown={handleSeekMouseDown}
                                            onMouseUp={handleSeekMouseUp}
                                            onClick={handleSeekMouseUp}
                                            onTouchStart={handleSeekMouseDown}
                                            onTouchEnd={handleSeekMouseUp}
                                            className="seek-slider"
                                        />
                                        <div className="time-display">
                                            {formatTime(seek * 1000)} / {formatTime((duration || 0) * 1000)}
                                        </div>
                                    </div>

                                    {/* 4. Metadata (Bottom of footer) */}
                                    {/* 4. Metadata (Bottom of footer) */}
                                    <div className="mobile-metadata-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%', overflow: 'hidden' }}>
                                        {/* Row 1: Technical Info (Strictly Fits Single Line) */}
                                        <div className="meta-row" style={{
                                            display: 'flex',
                                            gap: '8px',
                                            justifyContent: 'center',
                                            width: '100%',
                                            flexWrap: 'nowrap',
                                            padding: '4px 20px',
                                            overflow: 'hidden'
                                        }}>
                                            <div className="pill osu-play" onClick={() => {
                                                if (selectedMap.onlineId) {
                                                    window.electron.openExternal(`osu://b/${selectedMap.onlineId}`);
                                                }
                                            }} style={{ flexShrink: 0 }}>
                                                OSU! PLAY
                                            </div>
                                            <div className="pill difficulty" onClick={() => setShowDiffSelector(true)} style={{ flexShrink: 1, minWidth: 0 }}>
                                                <span>{selectedMap.difficulty}</span>
                                            </div>
                                            <div className="pill stars" onClick={() => setShowDiffSelector(true)} style={{ flexShrink: 0 }}>
                                                <StarIcon /> {selectedMap.starRating.toFixed(2)}
                                            </div>
                                            <div className="pill bpm" style={{ flexShrink: 0 }}>
                                                BPM: {Math.round(selectedMap.bpm)}
                                            </div>
                                        </div>

                                        {/* Row 2: Mapper (Clickable) */}
                                        <div
                                            className="meta-row mapper-row"
                                            onClick={handleMapperClick}
                                            style={{
                                                cursor: 'pointer',
                                                opacity: 0.7,
                                                fontSize: '0.8rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <span>mapped by <b>{selectedMap.mapper}</b></span>
                                            <div title="view in browser" style={{ display: 'flex', alignItems: 'center', marginTop: '1px' }}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                    <polyline points="15 3 21 3 21 9" />
                                                    <line x1="10" y1="14" x2="21" y2="3" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </footer>
                    </div>
                )}
            </AnimatePresence>

            {/* Difficulty Selector Sheet */}
            <AnimatePresence>
                {showDiffSelector && selectedSet && (
                    <>
                        <motion.div
                            className="diff-selector-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDiffSelector(false)}
                        />
                        <motion.div
                            className="diff-selector-sheet"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        >
                            <div className="sheet-header">
                                <h3>Beatmap difficulties</h3>
                            </div>
                            <div className="sheet-content">
                                {selectedSet.beatmaps
                                    .filter(map => map.rulesetId === selectedMode) // Filter by mode
                                    .sort((a, b) => a.starRating - b.starRating)
                                    .map(map => (
                                        <div
                                            key={map.id}
                                            className={`sheet-item ${selectedMap?.id === map.id ? 'active' : ''}`}
                                            onClick={() => {
                                                // Select map but DO NOT auto-play/restart if same audio
                                                selectBeatmap(map, false);
                                                setShowDiffSelector(false);
                                            }}
                                        >
                                            <div className="sheet-info-left" style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span className="sheet-diff-name">{map.difficulty}</span>
                                                {/* Removed mapper from here as it's now in main footer too, but can keep it */}
                                                <span className="sheet-mapper" style={{ fontSize: '0.75rem', opacity: 0.6 }}>by {map.mapper}</span>
                                            </div>
                                            <span className="sheet-diff-stars"><StarIcon /> {map.starRating.toFixed(2)}</span>
                                        </div>
                                    ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Invisible drag handle - placed at the end to be on top of all absolute layers */}
            <div className="window-drag-handle" />
        </div>
    )
}

export default App
