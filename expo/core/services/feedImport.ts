import {extractSpotifyInfo} from '@core/contexts/PostsContext';
import type {Block} from '@shared/types/posts';

export type PodcastEpisodeJson = {
  title: string;
  description?: string;
  date?: string;
  duration?: string;
  url?: string;
  youtube_id?: string;
  youtube_url?: string;
  thumbnail?: string;
};

export type ImportablePost = {
  title: string;
  coverUrl: string;
  status: 'published';
  publishAt: null;
  blocks: Block[];
};

export function parsePodcastJson(raw: string): PodcastEpisodeJson[] {
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Expected a JSON array');
  return parsed as PodcastEpisodeJson[];
}

export function convertEpisodesToPosts(episodes: PodcastEpisodeJson[]): ImportablePost[] {
  return episodes.map(convertEpisode);
}

function convertEpisode(ep: PodcastEpisodeJson): ImportablePost {
  const blocks: Block[] = [];

  const metaParts = [ep.date, ep.duration].filter(Boolean).join(' · ');
  const textContent = [ep.description, metaParts].filter(Boolean).join('\n\n');
  if (textContent) {
    blocks.push({type: 'text', data: {html: textContent}});
  }

  if (ep.url) {
    const spotifyInfo = extractSpotifyInfo(ep.url);
    if (spotifyInfo) {
      blocks.push({type: 'spotify', data: {url: ep.url, ...spotifyInfo}});
    }
  }

  if (ep.youtube_id) {
    blocks.push({type: 'embed', data: {platform: 'youtube', id: ep.youtube_id}});
  }

  return {
    title: ep.title,
    coverUrl: ep.thumbnail ?? '',
    status: 'published',
    publishAt: null,
    blocks,
  };
}
