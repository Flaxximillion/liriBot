let marvQuotes = [
    "Funny, how just when you think life can't possibly get any worse it suddenly does.",
    "Now I lay me down to sleep,\n" +
    "Try to count electric sheep,\n" +
    "Sweet dream wishes you can keep,\n" +
    "How I hate the night.",
    "Now the world has gone to bed,\n" +
    "Darkness won't engulf my head,\n" +
    "I can see in infrared,\n" +
    "How I hate the night.",
    "Marvin was humming ironically because he hated humans so much.",
    "Sorry, did I say something wrong?",
    "I have a million ideas. They all point to certain death.",
    "I'd give you advice, but you wouldn't listen. No one ever does.",
    "I ache, therefore I am.",
    "I’m just trying to die.",
    "Incredible... It's even worse than I thought it would be.",
    "I've been talking to the main computer... It hates me.",
    "Not that anyone cares what I say, but the Restaurant is on the other end of the universe",
    "I’m not getting you down at all, am I?",
    "You watch this door. It’s about to open again. I can tell by the intolerable air of smugness it suddenly generates.",
    "Life. Loathe it or ignore it. You can’t like it.",
    "Do you want me to sit in a corner and rust, or just fall apart where I’m standing?",
    "I hate oceans.",
    "I only have to talk to somebody and they begin to hate me. Even robots hate me. If you just ignore me I expect I shall probably go away",
    "This is the sort of thing you lifeforms enjoy, is it?",
    "I've seen it. It's rubbish.",
    "Don’t pretend you want to talk to me, I know you hate me.",
    "The best conversation I had was over forty million years ago…. And that was with a coffee machine.",
    "I can even go and stick my head in a bucket of water if you like. Would you like me to go and stick my head in a bucket of water?",
    "Why should I want to make anything up? Life’s bad enough as it is without wanting to invent any more of it.",
    "Wearily I sit here, pain and misery my only companions. Why stop now just when I’m hating it?",
    "Well I wish you’d just tell me rather than try to engage my enthusiasm.",
    "It gives me a headache just trying to think down to your level.",
    "Here I am, brain the size of a planet, and they ask me to pick up a piece of paper.",
    "I won’t enjoy it.",
    "You think you’ve got problems. What are you supposed to do if you are a manically depressed robot?",
    "It amazes me how you manage to live in anything that small.",
    "Life. Don't talk to me about life.",
    "Pardon me for breathing, which I never do anyway so I don't know why I bother to say it, Oh God, I'm so depressed.",
    "There's only one life-form as intelligent as me within thirty parsecs of here and that's me.",
    "I wish you'd just tell me rather trying to engage my enthusiasm, because I haven't got one.",
    "And then of course I've got this terrible pain in all the diodes down my left side.",
    "My capacity for happiness, you could fit into a matchbox without taking out the matches first."
];

const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const request = require('request');
const fs = require('fs');

const twit = require('twitter');
const twitConfig = require('./config/twitterConfig');
let client = new twit(twitConfig);

const SpotifyWebApi = require('spotify-web-api-node');
const spotifyConfig = require('./config/spotifyConfig');
let spotifyApi = new SpotifyWebApi(spotifyConfig);

spotifyApi.clientCredentialsGrant()
    .then(function(data){
        spotifyApi.setAccessToken(data.body['access_token']);
    });

const imdb = require('imdb-api');

const index = require('./routes/index');
const users = require('./routes/users');

let app = express();

const http = require('http').Server(app);
const io = require('socket.io')(http);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
let accessLogStream = fs.createWriteStream(path.join(__dirname, 'logger.log'), {flags: 'a'});

app.use(logger('dev', {stream: accessLogStream}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


http.listen(1337, function () {
    console.log('listening on *:1337');
});

io.on('connection', function (socket) {
    socket.on('submitTweet', function(){
        let quote = marvQuotes[Math.floor(Math.random() * marvQuotes.length)];
        client.post('statuses/update', {status: quote})
            .then(function(data){
                socket.emit('searchResult', data, 'submittedTweet');
            })
    });

    socket.on('getMarvinTweets', function(){
        client.get('statuses/user_timeline', {
            screen_name: 'TheParanoidMarv'
        }).then(function(response){
            socket.emit('searchResult', response, 'marvTweets');
        })
    });

    socket.on('twitterSearch', function (search) {
        client.get('search/tweets', {
            q: `${search}`,
            count: 1,
            lang: 'en'
        }, function (err, data, response) {
            socket.emit('searchResult', data, 'tweets');
        })
    });

    socket.on('spotifySearch', function (search) {
        console.log(search);
        spotifyApi.searchTracks(search, {limit: 1}, function(err, data){
            socket.emit('searchResult', data, 'spotify')
        })
    });

    socket.on('movieSearch', function (search){
        imdb.getReq({name: search, opts: {apiKey: '40e9cece'}}).then(function(response){
            socket.emit('searchResult', response, 'movies');
        })
    });
});

module.exports = app;
