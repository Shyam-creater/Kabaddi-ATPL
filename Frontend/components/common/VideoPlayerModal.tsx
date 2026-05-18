import React, { useState, useEffect } from 'react';
import {
    View, Text, Modal, TouchableOpacity, StyleSheet,
    StatusBar, ActivityIndicator, Platform
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';

interface Props {
    visible: boolean;
    url: string;
    title?: string;
    subtitle?: string;
    type?: 'live' | 'preview' | 'recorded';
    onClose: () => void;
}

// Extract YouTube video ID from any YouTube URL format
const getYouTubeVideoId = (url: string = ''): string | null => {
    if (!url) return null;
    const match = url.match(
        /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|live\/|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
};

const isYouTubeShorts = (url: string = ''): boolean =>
    url ? /youtube\.com\/shorts\//i.test(url) : false;

const isYouTube = (url: string = ''): boolean =>
    url ? /youtube\.com|youtu\.be/.test(url) : false;

const isDirectVideo = (url: string = ''): boolean =>
    url ? /\.(mp4|webm|ogg|mov|m3u8)(\?.*)?$/i.test(url) || url.startsWith('data:video') : false;

// Build a self-contained HTML page that embeds YouTube - bypasses Error 153
const buildYouTubeHtml = (videoId: string, isShorts: boolean): string => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body {
        width: 100%; height: 100%;
        background: #000;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .player-wrapper {
        position: relative;
        width: 100%;
        /* 16:9 for regular videos, 9:16 for Shorts portrait */
        padding-bottom: ${isShorts ? '177.78%' : '56.25%'};
        height: 0;
        overflow: hidden;
      }
      iframe {
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        border: none;
      }
    </style>
  </head>
  <body>
    <div class="player-wrapper">
      <iframe
        src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&rel=0&controls=1&modestbranding=1&playsinline=1&enablejsapi=1&origin=https://www.youtube.com"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share"
        allowfullscreen
        frameborder="0"
        referrerpolicy="strict-origin-when-cross-origin"
      ></iframe>
    </div>
  </body>
</html>
`;

const buildGenericHtml = (url: string): string => `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      * { margin: 0; padding: 0; }
      html, body { width: 100%; height: 100%; background: #000; }
      iframe, video { width: 100%; height: 100%; border: none; }
    </style>
  </head>
  <body>
    <iframe src="${url}${url.includes('?') ? '&' : '?'}autoplay=1&mute=1" allowfullscreen allow="autoplay; fullscreen"></iframe>
  </body>
</html>
`;

const TYPE_CONFIG = {
    live: { label: '🔴 Live Stream', color: '#E31C25', bg: 'rgba(227,28,37,0.15)' },
    preview: { label: '📅 Match Preview', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
    recorded: { label: '🎬 Match Highlights', color: '#6366F1', bg: 'rgba(99,102,241,0.15)' },
};

// Chrome-like user agent to prevent YouTube from blocking WebView
const CHROME_USER_AGENT =
    'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

export default function VideoPlayerModal({ visible, url, title, subtitle, type = 'recorded', onClose }: Props) {
    const [loading, setLoading] = useState(true);
    const [localUri, setLocalUri] = useState<string | null>(null);
    const cfg = TYPE_CONFIG[type];

    const youtubeId = getYouTubeVideoId(url);
    const isShorts = isYouTubeShorts(url);
    const isDirect = isDirectVideo(url);

    useEffect(() => {
        let isMounted = true;
        setLocalUri(null); // Reset on open

        const processUrl = async () => {
            if (!url) {
                if (isMounted) setLoading(false);
                return;
            }
            if (isDirect && url.startsWith('data:video')) {
                if (Platform.OS === 'web') {
                    setLocalUri(url);
                    setLoading(false);
                    return;
                }
                setLoading(true);
                // @ts-ignore
                const fileUri = (FileSystem.documentDirectory || FileSystem.cacheDirectory || 'file:///') + 'temp_video.mp4';
                const base64Data = url.split(',')[1] || '';
                try {
                    await FileSystem.writeAsStringAsync(fileUri, base64Data, { encoding: 'base64' as any });
                    if (isMounted) {
                        setLocalUri(fileUri);
                        setLoading(false);
                    }
                } catch (e) {
                    console.log("Error saving base64 video:", e);
                    if (isMounted) {
                        setLocalUri(url); // fallback
                        setLoading(false);
                    }
                }
            } else {
                setLocalUri(url);
                setLoading(false);
            }
        };

        if (visible) {
            processUrl();
        } else {
            setLocalUri(null);
            setLoading(true);
        }
        return () => { isMounted = false; };
    }, [url, visible, isDirect]);

    const getWebViewSource = () => {
        if (youtubeId) return { uri: `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0` };
        return { html: buildGenericHtml(localUri || '') };
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
            hardwareAccelerated
        >
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <View style={styles.container}>

                {/* ── Header ── */}
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <View style={[styles.typeBadge, { backgroundColor: cfg.bg, borderColor: cfg.color }]}>
                            <Text style={[styles.typeBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>
                        {title && <Text style={styles.title} numberOfLines={1}>{title}</Text>}
                        {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* ── Video Player ── */}
                <View style={styles.playerWrapper}>
                    {isDirect ? (
                        localUri ? (
                            <Video
                                source={{ uri: localUri }}
                                style={styles.videoPlayer}
                                useNativeControls
                                resizeMode={ResizeMode.CONTAIN}
                                shouldPlay
                            />
                        ) : (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="large" color={cfg.color} />
                                <Text style={styles.loadingText}>Processing video...</Text>
                            </View>
                        )
                    ) : (
                        // YouTube & stream URLs → WebView with injected HTML
                        <>
                            {loading && (
                                <View style={styles.loadingOverlay}>
                                    <ActivityIndicator size="large" color={cfg.color} />
                                    <Text style={styles.loadingText}>Loading video...</Text>
                                </View>
                            )}
                            <WebView
                                source={getWebViewSource()}
                                style={[styles.webView, loading && { opacity: 0 }]}
                                allowsInlineMediaPlayback={true}
                                mediaPlaybackRequiresUserAction={false}
                                allowsFullscreenVideo={true}
                                javaScriptEnabled={true}
                                domStorageEnabled={true}
                                originWhitelist={['*']}
                                onLoadEnd={() => setLoading(false)}
                                onError={() => setLoading(false)}
                            />
                        </>
                    )}
                </View>

                {/* ── Footer tip ── */}
                <View style={styles.footer}>
                    <Ionicons name={isDirect ? 'film-outline' : 'logo-youtube'} size={13} color="rgba(255,255,255,0.35)" style={{ marginRight: 6 }} />
                    <Text style={styles.footerText}>
                        {isDirect
                            ? 'Use player controls to manage playback'
                            : youtubeId
                                ? 'Tap ⛶ for fullscreen · Double-tap to seek'
                                : 'Streaming via embedded player'}
                    </Text>
                </View>

            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: 'rgba(0,0,0,0.85)',
        gap: 12,
    },
    typeBadge: {
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginBottom: 6,
    },
    typeBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: -0.3,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    closeBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    playerWrapper: {
        flex: 1,
        backgroundColor: '#000',
    },
    videoPlayer: {
        width: '100%',
        height: '100%',
    },
    webView: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        gap: 12,
    },
    loadingText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    footerText: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 10,
        fontWeight: '600',
        flex: 1,
    },
});
