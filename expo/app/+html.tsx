import {ScrollViewStyleReset} from 'expo-router/html';
import type {PropsWithChildren} from 'react';

// Custom HTML shell for web builds (https://docs.expo.dev/router/reference/static-rendering/#root-html).
// Exists to fix the mobile-browser login layout (see
// standard-base/.docs/README_Mobile_Web_Login_Change_Request.md):
// - `viewport-fit=cover` so safe-area insets (env()) resolve on notched
//   iPhones in Safari; without it react-native-safe-area-context gets 0.
// - `100dvh` instead of `height: 100%` so the layout tracks the dynamic
//   viewport as mobile browser chrome appears/disappears.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: viewportStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const viewportStyles = `
@supports (height: 100dvh) {
  html,
  body,
  #root {
    height: 100dvh;
  }
}
/* Matches the branded login background so mobile browsers don't flash white
   behind the app while it loads or during overscroll. */
body {
  background-color: #000;
}
`;
