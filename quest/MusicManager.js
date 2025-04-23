export class MusicManager {
    static instance = null;

    constructor() {
        if (MusicManager.instance) {
            return MusicManager.instance;
        }
        MusicManager.instance = this;

        // Basic setup
        this.currentTrack = null;
        this.playlist = [];
        this.volume = 0.5;

        // ONLY listen for level changes - that's it!
        window.addEventListener('changeLevel', (event) => {
            const levelId = event.detail?.levelId;
            if (!levelId) return;

            // Kill current track
            if (this.currentTrack) {
                this.currentTrack.pause();
                this.currentTrack = null;
            }

            // Set new playlist and play
            this.playlist = this.playlists[levelId] || [];
            if (this.playlist.length > 0) {
                this.play();
            }
        });

        // Current playlist
        this.playlist = [];
        
        // Track transition delay in ms (30 seconds)
        this.transitionDelay = 30000;
        
        // Fade duration in ms (2 seconds)
        this.fadeDuration = 2000;
        
        // Playlists per level
        this.playlists = {
            singapore6: [
                'audio/singapore01.mp3',
                'audio/singapore02.mp3'
            ],
            nightclub: [
                'audio/nightclub01.mp3',
                'audio/nightclub02.mp3',
                'audio/nightclub03.mp3'
            ],
            taiyong: [
                'audio/taiyong01.mp3',
                'audio/taiyong02.mp3',
                'audio/taiyong03.mp3',
                'audio/taiyong04.mp3',
                'audio/taiyong05.mp3'
            ]
        };

        // Special tracks (not part of regular playlists)
        this.specialTracks = {
            menu: 'audio/menu.mp3',
            credits: 'audio/credits02.mp3'
        };
        
        // Bind methods
        this._handleTrackEnd = this._handleTrackEnd.bind(this);
        
        // Add initialization state
        this.isInitialized = false;
        this.pendingTrack = null;
        this.pendingType = null;
        
        console.log('MusicManager initialized');
    }

    // Static method to get instance
    static getInstance() {
        if (!MusicManager.instance) {
            new MusicManager();
        }
        return MusicManager.instance;
    }
    
    _handleLevelChange(event) {
        const levelId = event.detail?.levelId;
        if (!levelId) return;

        // Kill everything
        if (this.currentTrack) {
            this.currentTrack.pause();
            this.currentTrack = null;
        }
        if (this.nextTrackTimeout) {
            clearTimeout(this.nextTrackTimeout);
            this.nextTrackTimeout = null;
        }

        // Start new track
        if (levelId === 'main_menu') {
            this.playSpecialTrack('menu');
        } else if (levelId === 'credits') {
            this.playSpecialTrack('credits');
        } else {
            this.setLevel(levelId);
        }
    }

    // Add initialization method
    initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        
        // Play any pending tracks
        if (this.pendingType === 'special' && this.pendingTrack) {
            this.playSpecialTrack(this.pendingTrack);
        } else if (this.pendingType === 'level' && this.pendingTrack) {
            this.setLevel(this.pendingTrack);
        }
        
        this.pendingTrack = null;
        this.pendingType = null;
    }

    // New method to play special tracks (menu/credits)
    async playSpecialTrack(type) {
        if (!this.isInitialized) {
            this.pendingTrack = type;
            this.pendingType = 'special';
            return;
        }
        
        if (!this.specialTracks[type]) return;
        
        // Stop any current music
        this.stopAll();
        
        // Create new audio element
        const audio = new Audio(this.specialTracks[type]);
        audio.volume = 0;  // Start at 0 for fade in
        audio.loop = true; // Special tracks loop continuously
        
        try {
            await audio.play();
            console.log(`[MusicManager] Now playing special track: ${type}`);
            
            // Fade in
            this.fadeIn(audio);
            
            // Store current track
            this.currentTrack = audio;
        } catch (error) {
            console.error('[MusicManager] Error playing special track:', error);
        }
    }
    
    // Method to stop all music immediately
    stopAll() {
        if (this.currentTrack) {
            this.currentTrack.pause();
            this.currentTrack.removeEventListener('ended', this._handleTrackEnd);
            this.currentTrack = null;
        }
        
        if (this.nextTrackTimeout) {
            clearTimeout(this.nextTrackTimeout);
            this.nextTrackTimeout = null;
        }
    }
    
    setLevel(levelId) {
        // Stop current music IMMEDIATELY
        this.stop();
        
        // Set new playlist
        this.playlist = this.playlists[levelId] || [];
        
        if (this.playlist.length > 0) {
            console.log(`[MusicManager] Setting playlist for level: ${levelId}`);
            this.play();
        }
    }
    
    async play() {
        if (this.playlist.length === 0) {
            console.warn('[MusicManager] Attempted to play with empty playlist');
            return;
        }
        
        // Select random track
        const trackPath = this.getRandomTrack();
        console.log(`[MusicManager] Selected track: ${trackPath}`);
        
        // Create new audio element
        const audio = new Audio(trackPath);
        audio.volume = 0;  // Start at 0 for fade in
        
        // Add ended event listener
        audio.addEventListener('ended', this._handleTrackEnd);
        
        try {
            // Start playing
            await audio.play();
            console.log(`[MusicManager] Successfully started playback: ${trackPath}`);
            
            // Fade in
            console.log(`[MusicManager] Starting fade in for: ${trackPath}`);
            this.fadeIn(audio);
            
            // Store current track
            this.currentTrack = audio;
        } catch (error) {
            console.error('[MusicManager] Error playing track:', error, '\nTrack path:', trackPath);
        }
    }
    
    stop() {
        if (this.currentTrack) {
            this.currentTrack.pause();
            this.currentTrack.removeEventListener('ended', this._handleTrackEnd);
            this.currentTrack = null;
        }
        
        if (this.nextTrackTimeout) {
            clearTimeout(this.nextTrackTimeout);
            this.nextTrackTimeout = null;
        }
    }
    
    getRandomTrack() {
        const index = Math.floor(Math.random() * this.playlist.length);
        return this.playlist[index];
    }
    
    async fadeIn(audio) {
        const steps = 20;
        const stepDuration = this.fadeDuration / steps;
        const volumeStep = this.volume / steps;
        
        for (let i = 0; i <= steps; i++) {
            await new Promise(resolve => setTimeout(resolve, stepDuration));
            audio.volume = Math.min(volumeStep * i, this.volume);
        }
    }
    
    async fadeOut(audio) {
        const steps = 20;
        const stepDuration = this.fadeDuration / steps;
        const volumeStep = audio.volume / steps;
        
        for (let i = steps; i >= 0; i--) {
            await new Promise(resolve => setTimeout(resolve, stepDuration));
            audio.volume = volumeStep * i;
        }
    }
    
    _handleTrackEnd() {
        console.log('[MusicManager] Track ended, starting fade out');
        // Start fade out of current track
        this.fadeOut(this.currentTrack).then(() => {
            console.log('[MusicManager] Fade out complete, preparing next track');
            this.currentTrack.pause();
            this.currentTrack.removeEventListener('ended', this._handleTrackEnd);
            this.currentTrack = null;
            
            // Wait for transition delay before playing next track
            console.log(`[MusicManager] Waiting ${this.transitionDelay}ms before playing next track`);
            this.nextTrackTimeout = setTimeout(() => {
                this.play();
            }, this.transitionDelay);
        });
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.currentTrack) {
            this.currentTrack.volume = this.volume;
        }
    }
    
    dispose() {
        this.stop();
        this.playlist = [];
    }
} 