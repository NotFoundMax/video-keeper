import { db } from "../server/db";
import { videos } from "../shared/schema";

async function checkDurations() {
  const allVideos = await db.select().from(videos);
  console.log(`Total videos: ${allVideos.length}`);
  const zeroDuration = allVideos.filter(v => (v.duration || 0) === 0);
  console.log(`Videos with 0 duration: ${zeroDuration.length}`);
  if (zeroDuration.length > 0) {
    console.log("Samples of 0 duration videos:");
    zeroDuration.slice(0, 5).forEach(v => {
      console.log(`- [${v.platform}] ${v.title}: ${v.url}`);
    });
  }
}

checkDurations().catch(console.error);
