var players = [];
//var player_video_default;
function onYouTubeIframeAPIReady() {
    $('.youtube-slide').each(function (index, youtubeSlide) {
        var index = $(youtubeSlide).data('index');
        var id = $(youtubeSlide).data('id');
        var properties = {
            height: '100%',
            width: '100%',
            videoId: id,
            events: {
                onStateChange: onPlayerStateChange
            },
            playerVars: {
                playlist: id,
                loop: 1,
                showinfo: 0,
                controls: 0,
                disablekb: 1,
                iv_load_policy: 3,
                rel: 0,
                fs: 0,
                modestbranding: 1,
            }
        };
        var count_video_slides = $('.youtube-slide').length;
        if (index == 1 || count_video_slides == 1) {
            properties.events.onReady = onPlayerReady;
            _YOUTUBE_PATCH = true;
        }
        players[index] = new YT.Player('youtube-slide-' + index, properties);
    });

    $('.youtube-video_default').each(function (index, youtubeVD) {
        var id = $(youtubeVD).data('yt_id');
        var properties = {
            height: '475px',
            width: '80%',
            videoId: id,
            events: {
                onStateChange: onPlayerStateChangeVD
            },
            playerVars: {
                playlist: id,
                loop: 1,
                disablekb: 1,
                iv_load_policy: 3,
                rel: 0,
                fs: 0,
                modestbranding: 1,
            }
        };
        players[id] = new YT.Player('yt_video_default_' + id, properties);
    });


}

function onPlayerReady(event) {
    var count_video_slides = $('.youtube-slide').length;
    if (count_video_slides == 1) {
        var index = $('.youtube-slide').data('index');
        players[index].playVideo().mute();
    } else {
        players[1].playVideo().mute();
    }
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        $('#mute-ctrl').addClass('show');
    }
}

function onPlayerStateChangeVD(event) {
    if (event.data == YT.PlayerState.ENDED) {
        //event.target.playVideo();
        event.target.stopVideo();
    }
}

