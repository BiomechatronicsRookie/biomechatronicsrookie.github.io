console.log("Portfolio loaded!");

const expandCards = document.querySelectorAll(".expand-card");
const softwareTracks = document.querySelectorAll(".long-card");
const projectVideos = document.querySelectorAll(".project-video");

const getYouTubeId = (value = "") => {
    const trimmed = value.trim();
    if (!trimmed) {
        return "";
    }

    if (!trimmed.includes("youtube.com") && !trimmed.includes("youtu.be")) {
        return trimmed;
    }

    try {
        const url = new URL(trimmed);

        if (url.hostname.includes("youtu.be")) {
            return url.pathname.replace("/", "");
        }

        if (url.searchParams.get("v")) {
            return url.searchParams.get("v");
        }

        const pathParts = url.pathname.split("/").filter(Boolean);
        const embedIndex = pathParts.indexOf("embed");
        if (embedIndex !== -1 && pathParts[embedIndex + 1]) {
            return pathParts[embedIndex + 1];
        }
    } catch {
        return "";
    }

    return "";
};

const buildYouTubeEmbedUrl = (id) => {
    const params = new URLSearchParams({
        autoplay: "1",
        mute: "1",
        loop: "1",
        playlist: id,
        rel: "0",
        modestbranding: "1",
        playsinline: "1"
    });

    return `https://www.youtube.com/embed/${id}?${params.toString()}`;
};

const safePlayVideo = (video) => {
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
        playPromise.catch(() => {
            // Ignore autoplay rejections from browser policy.
        });
    }
};

projectVideos.forEach((media) => {
    if (!(media instanceof HTMLVideoElement)) {
        return;
    }

    media.addEventListener("loadedmetadata", () => safePlayVideo(media));
    media.addEventListener("error", () => {
        const source = media.currentSrc || media.querySelector("source")?.src || "unknown";
        console.warn("Video failed to load:", source);
    });
    if (media.readyState >= 1) {
        safePlayVideo(media);
    }
});

expandCards.forEach((card) => {
    const localVideos = card.querySelectorAll("video");
    const youtubeEmbeds = card.querySelectorAll("iframe[data-youtube-url], iframe[data-youtube-id]");

    const playVideos = () => {
        localVideos.forEach((video) => {
            safePlayVideo(video);
        });

        youtubeEmbeds.forEach((embed) => {
            const raw = embed.dataset.youtubeId || embed.dataset.youtubeUrl || "";
            const videoId = getYouTubeId(raw);
            if (!videoId) {
                return;
            }

            if (!embed.dataset.activeSrc) {
                embed.dataset.activeSrc = buildYouTubeEmbedUrl(videoId);
            }

            if (embed.src !== embed.dataset.activeSrc) {
                embed.src = embed.dataset.activeSrc;
            }
        });
    };

    const pauseVideos = () => {
        youtubeEmbeds.forEach((embed) => {
            embed.src = "";
        });
    };

    card.addEventListener("mouseenter", playVideos);
    card.addEventListener("mouseleave", pauseVideos);
    card.addEventListener("focusin", playVideos);
    card.addEventListener("focusout", pauseVideos);
    card.addEventListener("click", playVideos);
    card.addEventListener("touchstart", playVideos, { passive: true });
});

const setupSoftwareMarquee = () => {
    softwareTracks.forEach((track) => {
        const viewport = track.parentElement;
        const groups = track.querySelectorAll(".software-ball-group");
        if (!groups.length || !viewport) {
            return;
        }

        const primaryGroup = groups[0];

        // Keep one source group and rebuild clones based on viewport width.
        Array.from(groups)
            .slice(1)
            .forEach((group) => group.remove());

        const shift = Math.ceil(primaryGroup.getBoundingClientRect().width);
        if (!shift) {
            return;
        }

        const requiredWidth = viewport.clientWidth + shift;
        let builtWidth = shift;
        while (builtWidth < requiredWidth) {
            const clone = primaryGroup.cloneNode(true);
            clone.setAttribute("aria-hidden", "true");
            clone.dataset.marqueeClone = "true";
            track.appendChild(clone);
            builtWidth += shift;
        }

        track.style.setProperty("--marquee-shift", `${shift}px`);

        const speedPxPerSec = 70;
        const durationSec = Math.max(10, Math.round(shift / speedPxPerSec));
        track.style.setProperty("--marquee-duration", `${durationSec}s`);
    });
};

setupSoftwareMarquee();
window.addEventListener("load", setupSoftwareMarquee);
window.addEventListener("resize", setupSoftwareMarquee);
