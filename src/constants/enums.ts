export enum Game {
  GENSHIN = 'genshin',
  STARRAIL = 'starrail',
  ZZZ = 'zzz'
}

export enum DatabaseKey {
  GENSHIN = 'genshin',
  STARRAIL = 'starrail',
  ZZZ = 'zzz'
}

export const GAME_THUMBNAILS = {
  [Game.GENSHIN]: 'genshin-impact.png',
  [Game.STARRAIL]: 'star-rail.png',
  [Game.ZZZ]: 'zenless-zone-zero.png'
};

export const HOYO_REDEEM_URLS = {
  [Game.GENSHIN]: 'https://genshin.hoyoverse.com/gift?code=',
  [Game.STARRAIL]: 'https://hsr.hoyoverse.com/gift?code=',
  [Game.ZZZ]: 'https://zzz.hoyoverse.com/gift?code='
};