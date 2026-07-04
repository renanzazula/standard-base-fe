// Stub for the optional peer dep of react-native-youtube-iframe.
// The YouTube player is never rendered on web (PodcastEpisodeDetail guards
// on Platform.OS), so this only needs to satisfy Metro's static resolution.
const WebView = () => null;

module.exports = { WebView };
