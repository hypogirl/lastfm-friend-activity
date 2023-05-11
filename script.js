username = document.cookie.split("=")[1]
if (username) {
    load(username);
    setInterval(() => {
        load(username);
    }, 10000);
}
else set_username();

const refresh = document.getElementById("refresh");
refresh.addEventListener("click", () => {
    load(username);
});

const change_username = document.getElementById("change");
change_username.addEventListener("click", () => {
    set_username();
});

function set_username() {
    const visible = document.getElementsByClassName("visible-when-load");
    for (const elem of visible) elem.style.display = "none";
    const content = document.getElementById("activity-feed");
    content.innerHTML = '<form>\n\
    <label for="user">Username</label><br>\n\
    <input type="text" id="user" name="user"><p>\n\
    <button type="button" id="userbutton">Set username</button>\n\
    </form>';
    document.getElementById('userbutton').addEventListener('click', () => {
        saveUser();
    });
      
}

function saveUser() {
    const user = document.getElementById("user");
    document.cookie = "user=" + user.value;
    load(user.value);
}

function getJSONP(url, success) {
    var ud = '_' + +new Date,
        script = document.createElement('script'),
        head = document.getElementsByTagName('head')[0] 
               || document.documentElement;

    window[ud] = function(data) {
        head.removeChild(script);
        success && success(data);
    };

    script.src = url.replace('callback=?', 'callback=' + ud);
    head.appendChild(script);
}

function load(user) {
    const refresh_img = document.getElementById("refresh");
    refresh_img.src = "icons/stop_refresh.png";
    const content = document.getElementById("activity-feed");
    //content.innerHTML = new String();
    const visible = document.getElementsByClassName("visible-when-load");
    const info = new Object();
    for (const elem of visible) elem.style.display = "block";
    fetch(`https://ws.audioscrobbler.com/2.0/?user=${user}&method=user.getFriends&api_key=c83f4f34f677587e7af2de09c50b6753&format=json&limit=500`)
   .then(r => r.text())
   .then(t => {
        const friend_object = JSON.parse(t).friends
        if (!friend_object) {
            content.innerHTML = "<h3 id='error'>Error getting friend activity.</h3>";
            return
        }
        if (error = document.getElementById("error")) error.remove();
        const friends = friend_object.user;
        const profile_pics = new Object();
        var no_friends = 0;
        for (friend of friends) {
            profile_pics[friend.name] = friend.image[3]["#text"] || "icons/pfp.jpg";
            fetch(`https://ws.audioscrobbler.com/2.0/?user=${friend.name}&method=user.getrecentTracks&api_key=c83f4f34f677587e7af2de09c50b6753&format=json&limit=1`)
                .then(r => r.text())
                .then(t => {
                    no_friends++;
                    recent_tracks_info = JSON.parse(t).recenttracks;
                    user = recent_tracks_info["@attr"].user;
                    recent_tracks = recent_tracks_info.track;
                    for (track of recent_tracks)
                        try {
                            if (track["@attr"].nowplaying == "true") {
                                info[user] = {
                                    user: user,
                                    pfp: profile_pics[user],
                                    track: track.name,
                                    artist: track.artist["#text"],
                                    album: track.album["#text"]
                                }
                            }
                        } catch (error) {break};
                        if (friends.length == no_friends) update_content(info);
                        setTimeout(() => {
                            refresh_img.src = "icons/refresh.png";
                        },10)
                    })
                    
                }
        }
    )
}

function update_content(info) {
    const info_users = Object.keys(info);
    for (const child of document.getElementById("activity-feed").children) {
        const info_elem = child.getElementsByClassName("activity-info")[0];
        if (info_elem == undefined) break
        const username = info_elem.getElementsByTagName("h2")[0].innerHTML;
        if (!info_users.includes(username)) child.remove();
        else {
            child.classList.remove("visible");
            const song_info = child.getElementsByClassName("activity-info")[0]
            song_info.innerHTML = `<h2>${info[username].user}</h2>
                <p><img src="icons/track.png" alt="Track" class="icon"> ${info[username].track}</br><img src="icons/artist.png" alt="Artist" class="icon"><b> ${info[username].artist}</b></br><img src="icons/album.png" alt="Album" class="icon"> ${info[username].album}</p>`
            child.style.opacity = "0";
            setTimeout(() => {
                child.style.opacity = "1";
                child.classList.add("visible");
            }, 100);
            info_users.splice(info_users.indexOf(username), 1);
        }
    }
    const content = document.getElementById("activity-feed");
    for (const user of info_users) {
        const item = document.createElement("div");
        item.classList.add("activity-item");
        item.innerHTML = `<img src=${info[user].pfp} alt="Avatar" class="avatar">
        <div class="activity-info">
            <h2>${info[user].user}</h2>
            <p><img src="icons/track.png" alt="Track" class="icon"> ${info[user].track}</br><img src="icons/artist.png" alt="Artist" class="icon"><b> ${info[user].artist}</b></br><img src="icons/album.png" alt="Album" class="icon"> ${info[user].album}</p>
        </div>
        <div class="activity-timestamp">
            <p>Listening now...</p>
        </div>`
        content.appendChild(item);
        setTimeout(() => {
            item.classList.add("visible");
        }, 10);
    }
}