const socket = io();
let marvTweets;

window.twttr = (function (d, s, id) {
    let js, fjs = d.getElementsByTagName(s)[0],
        t = window.twttr || {};
    if (d.getElementById(id)) return t;
    js = d.createElement(s);
    js.id = id;
    js.src = "https://platform.twitter.com/widgets.js";
    fjs.parentNode.insertBefore(js, fjs);

    t._e = [];
    t.ready = function (f) {
        t._e.push(f);
    };

    return t;
}(document, "script", "twitter-wjs"));

$(document).ready(function(){
    socket.emit('getMarvinTweets');
});

$(function () {

    $('.search').click(function () {
        let $input = $(`#${$(this).val()}`);
        socket.emit($input.attr('name'), $input.val());
        $input.val('');
    });

    $('#twitterPost').click(function(){
        socket.emit('submitTweet');
    });

    socket.on('searchResult', function (data, location) {
        switch (location) {
            case 'submittedTweet':
                $("#submittedTweet").before($("<div class='scale-transition scale-in' id='submitText'>Thanks! You've just made the world a little more depressing.</div>"));
                setTimeout(function(){
                    $("#submittedTweet, #submitText").removeClass('scale-in').addClass('scale-out');
                    $("#submittedTweet").empty();
                    $("#submitText").remove();
                    marvTweets.push(data);
                }, 7000);
                genTweet(data.id_str, 'submittedTweet');
                break;
            case 'marvTweets':
                console.log(data);
                marvTweets = data;
                marvTweetDisplay();
                break;
            case 'tweets':
                console.log(data);
                genTweet(data.statuses[0].id_str, 'tweets');
                break;
            case 'spotify':
                console.log(data);
                $(`#${location}`).empty().prepend($(`<iframe src="https://open.spotify.com/embed?uri=${data.body.tracks.items["0"].uri}" allowtransparency="true" frameborder="0" width="300" height="380"></iframe>`));
                break;
            case 'movies':
                $(`#${location}`).empty().prepend($(`
                    <div class="card">
                        <div class="card-image">
                            <img src="${data.poster}">
                            <span class="card-title">${data.title}</span> 
                        </div>
                        <div class="card-content">
                            <p class="flow-text">${data.plot}</p>
                        </div>
                        <div class="card-action">
                            <a href="${data.imdburl}">View on IMDB</a>
                        </div>
                    </div>`
                ));
                break;
        }
    });
});

function marvTweetDisplay(){
    let randomTweet = marvTweets[Math.floor(Math.random() * marvTweets.length)];
    console.log(randomTweet);

    genTweet(randomTweet.id_str, 'marvTweets');

    setTimeout(function(){
        marvTweetDisplay();
    }, 7000);
}

function genTweet(tweetID, location){
    console.log(location);
    $(`#${location}`).removeClass('scale-in').addClass('scale-out');
    setTimeout(function(){
        let tweetDiv = $(`<div class="tweet" id="${tweetID}">`);

        $(`#${location}`).empty().prepend(tweetDiv);

        twttr.widgets.createTweet(tweetID, document.getElementById(tweetID),
            {
                conversation: 'none'
            }
        ).then(function(){
            $(`#${location}`).removeClass('scale-out').addClass('scale-in');
        });
    }, 300);
}