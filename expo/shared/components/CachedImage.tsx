import React, {useState} from 'react';
import {Image, ImageProps, ImageSourcePropType} from 'react-native';
import {useCachedImageUri} from '@shared/hooks/useCachedImage';

export interface CachedImageProps extends Omit<ImageProps, 'source'> {
  scope: string;
  cacheKey: string;
  version: string;
  uri: string;
  /** Shown while the cached copy is still resolving. */
  fallbackSource?: ImageSourcePropType;
}

/**
 * RN Image wrapper that serves a locally cached copy of a versioned remote
 * image, re-downloading only when the version changes. If the cached file
 * fails to render, it falls back to the remote URL.
 */
export function CachedImage({scope, cacheKey, version, uri, fallbackSource, ...imageProps}: CachedImageProps) {
  const resolved = useCachedImageUri({scope, cacheKey, version, remoteUrl: uri});
  const [errored, setErrored] = useState(false);

  const displayUri = errored ? uri : resolved;

  if (!displayUri) {
    if (fallbackSource) {
      return <Image {...imageProps} source={fallbackSource} />;
    }
    return null;
  }

  return (
    <Image
      {...imageProps}
      source={{uri: displayUri}}
      onError={(e) => {
        if (!errored && displayUri !== uri) {
          setErrored(true);
        }
        imageProps.onError?.(e);
      }}
    />
  );
}
