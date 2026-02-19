
import Realm from 'realm';
import path from 'path';
import os from 'os';

async function inspect() {
    const osuPath = path.join(os.homedir(), 'Library', 'Application Support', 'osu');
    const realmPath = path.join(osuPath, 'client.realm');

    const realm = await Realm.open({
        path: realmPath,
        readOnly: true,
    });

    const sets = realm.objects('BeatmapSet');
    if (sets.length > 0) {
        const set = sets[0] as any;
        console.log("BeatmapSet Keys:", Object.keys(set));
        console.log("Status:", set.Status);

        const firstMap = set.Beatmaps[0];
        console.log("Beatmap Keys:", Object.keys(firstMap));
        console.log("StarRating:", firstMap.StarRating);
    }

    realm.close();
}

inspect();
