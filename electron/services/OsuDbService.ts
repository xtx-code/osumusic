import Realm from 'realm';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Interfaces for our app (not Realm schema)
export interface BeatmapSet {
    id: string;
    onlineId: number;
    title: string;
    unicodeTitle: string;
    artist: string;
    unicodeArtist: string;
    coverPath: string; // Background artwork
    status: number;    // Ranked, Loved, etc.
    beatmaps: Beatmap[];
    files: RealmFile[];
}

export interface Beatmap {
    id: string; // UUID from Realm
    difficulty: string;
    starRating: number;
    bpm: number;
    totalLength: number;
    cs: number;
    ar: number;
    od: number;
    hp: number;
    audioHash: string; // To play audio
    audioPath: string;
    backgroundPath: string;
    mapper: string;
    onlineId: number; // osu! web ID
    rulesetId: number; // 0=osu, 1=taiko, 2=catch, 3=mania
}

export interface RealmFile {
    filename: string;
    hash: string;
}

export class OsuDbService {
    private realm: Realm | null = null;
    private osuPath: string;

    constructor() {
        this.osuPath = path.join(os.homedir(), 'Library', 'Application Support', 'osu');
    }

    public async openRealm(): Promise<void> {
        if (this.realm) return; // Already open

        const realmPath = path.join(this.osuPath, 'client.realm');
        if (!fs.existsSync(realmPath)) {
            throw new Error(`osu!lazer database not found at ${realmPath}`);
        }

        try {
            // Open without schema to use the file's schema (read-only)
            this.realm = await Realm.open({
                path: realmPath,
                readOnly: true,
            });
            console.log("Realm opened successfully with schema:", this.realm.schema.length, "types");
        } catch (e) {
            console.error("Failed to open Realm:", e);
            throw e;
        }
    }

    public getBeatmaps(): BeatmapSet[] {
        if (!this.realm) throw new Error("Realm not initialized");

        // We access objects dynamically
        const sets = this.realm.objects('BeatmapSet').filtered('DeletePending == false AND Beatmaps.@count > 0');

        // We limit to 50 for initial testing to avoid huge load times if user has thousands of maps
        // But for a music player we want all. Let's return mapped objects.
        // Note: Accessing properties on Realm objects is slow if done in a loop without care? 
        // Actually Realm is lazy. But mapping to JS objects is eager.
        // Let's just map minimal info needed for the list.

        return sets.map((set: any) => {
            // Safe access
            const beatmaps = set.Beatmaps;
            if (!beatmaps || beatmaps.length === 0) return null;

            const firstMap = beatmaps[0];
            const metadata = firstMap.Metadata;

            // Files
            const files = set.Files;

            // Resolve audio
            const audioFilename = metadata.AudioFile;
            // The Files list is a list of RealmNamedFileUsage { File: RealmFile { Hash }, Filename }
            const audioFileEntry = files.find((f: any) => f.Filename === audioFilename);
            const audioHash = audioFileEntry?.File?.Hash;

            // Resolve background
            const bgFilename = metadata.BackgroundFile;
            const bgFileEntry = files.find((f: any) => f.Filename === bgFilename);
            const bgHash = bgFileEntry?.File?.Hash;

            return {
                id: set.ID.toString(), // UUID
                onlineId: set.OnlineID || 0,
                title: metadata.Title || "",
                unicodeTitle: metadata.TitleUnicode || metadata.Title || "",
                artist: metadata.Artist || "",
                unicodeArtist: metadata.ArtistUnicode || metadata.Artist || "",
                coverPath: bgHash ? this.getFilePath(bgHash) : '', // Artwork
                status: set.Status || 0,
                beatmaps: beatmaps.map((b: any) => ({
                    id: b.ID.toString(),
                    difficulty: b.DifficultyName,
                    starRating: b.StarRating,
                    bpm: b.BPM || 0,
                    totalLength: b.TotalLength,
                    cs: b.BaseDifficulty?.CircleSize || 0,
                    ar: b.BaseDifficulty?.ApproachRate || 0,
                    od: b.BaseDifficulty?.OverallDifficulty || 0,
                    hp: b.BaseDifficulty?.DrainRate || 0,
                    audioHash: audioHash,
                    audioPath: audioHash ? this.getFilePath(audioHash) : '',
                    backgroundPath: bgHash ? this.getFilePath(bgHash) : '',
                    mapper: b.Metadata?.Author?.Username || b.Metadata?.Author || "Unknown",
                    onlineId: b.OnlineID || 0,
                    rulesetId: b.Ruleset ? b.Ruleset.OnlineID : (b.RulesetID || 0),
                })),
                files: files.map((f: any) => ({
                    filename: f.Filename,
                    hash: f.File?.Hash
                }))
            } as BeatmapSet;
        }).filter((s) => s !== null) as BeatmapSet[];
    }

    public getFilePath(hash: string): string {
        if (!hash || hash.length < 3) return '';
        const prefix1 = hash.substring(0, 1);
        const prefix2 = hash.substring(0, 2);
        return path.join(this.osuPath, 'files', prefix1, prefix2, hash);
    }

    public close() {
        if (this.realm) {
            this.realm.close();
            this.realm = null;
        }
    }
}
