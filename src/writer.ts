import fs from "fs";

export function writeFlaggedTweet(
  url: string
) {
  fs.appendFileSync(
    "flagged.csv",
    `${url},false\n`
  );
}