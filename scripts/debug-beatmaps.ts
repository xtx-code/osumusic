import Realm from 'realm';
import path from 'path';
import os from 'os';

async function test() {
    const osuPath = path.join(os.homedir(), 'Library', 'Application Support', 'osu');
    const realmPath = path.join(osuPath, 'client.realm');

    console.log(`Opening ${realmPath}`);

    try {
        const realm = await Realm.open({
            path: realmPath,
            readOnly: true,
        });

        console.log("Realm opened.");
        const sets = realm.objects('BeatmapSet').filtered('DeletePending == false AND Beatmaps.@count > 0');
        console.log(`Found ${sets.length} beatmap sets.`);

        if (sets.length > 0) {
            const firstSet: any = sets[0];
            console.log("First Set:", firstSet.Metadata.Artist, "-", firstSet.Metadata.Title);
            console.log("Files:", firstSet.Files.length);
            console.log("Beatmaps:", firstSet.Beatmaps.length);
        }

        realm.close();
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
