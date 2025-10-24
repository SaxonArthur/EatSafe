if (!localStorage.getItem('currentActiveUser')) { //If user got logged out/error occured send them to homepage
    window.location.href = "/"
}

//Default location of Annandale
let lat = -33.881414543705745
let long = 151.17066591160824

//Uses Leaflet.js to load map
const map = L.map('map').setView([lat, long], 17);

const user = JSON.parse(localStorage.getItem(localStorage.getItem('currentActiveUser')))["displayName"];
const dietaryOptions = JSON.parse(localStorage.getItem(localStorage.getItem('currentActiveUser')))["dietaryRequirements"];

const email = JSON.parse(localStorage.getItem(localStorage.getItem('currentActiveUser')))["email"];

const tabs = document.querySelectorAll('.tab');
const contents = document.querySelectorAll('.tab-content');

const resultNotFound = document.getElementById('not-found');

const reviewContainer = document.getElementById('reviews');
const userReviews = document.getElementById('your-reviews');

const pages = document.querySelectorAll('.page')
const translateAmount = 100;
let translate = 0;

var searchResults = null;

const markers = {};

const reviewInputs = document.querySelectorAll('.review-stars-input');

const reviewInputImages = document.querySelectorAll('.review-stars-input-image');

var reviewStars

// In Write Review, when mouse hovers it sets stars
function updateStars(intValue) {
    //Turn selected stars yellow
    for (let i=intValue; i>0; i -= 0.5) {
        let currentInputImage = document.getElementById(i.toString()+'-star-image');
        if (Number.isInteger(i)) {
            currentInputImage.src = "images/writeStars/RightStar.svg"
        }
        else {
            currentInputImage.src = "images/writeStars/LeftStar.svg"
        }
    }
    
    //Turn other stars grey
    for (let i=intValue+0.5; i<=5; i+=0.5) {
        let currentInputImage = document.getElementById(i.toString()+'-star-image');
        if (Number.isInteger(i)) {
            currentInputImage.src = "images/writeStars/RightNoStar.svg"
        }
        else {
            currentInputImage.src = "images/writeStars/LeftNoStar.svg"
        }
    }
}

// Star selection system, hover to see stars, click to select
reviewInputs.forEach(currentInput => {
    currentInput.labels[0].addEventListener('mouseenter', () => {
        updateStars(parseFloat(currentInput.value))
    })
    currentInput.labels[0].addEventListener('click', () => {
        reviewInputs.forEach(i => i.checked=false)
        currentInput.checked=true;
        reviewStars = currentInput.value;
    })
    currentInput.labels[0].addEventListener('mouseleave', () => {
        if (reviewStars) updateStars(parseFloat(reviewStars));
        else { updateStars(0) }

    })
})

// Master function to retrieve backend data
async function retrieveVenueData() {
    const resp = await fetch("/venues");
    if (!resp.ok) throw new Error('Failed to fetch /venues');
    const data = await resp.json();
    return data.Venues;
}

// Tried to get it to go direct one page to another, had to settle for multi-skip
async function slide(direction, start, destination) {
    if (destination === 2) {
        getReviews()
    }
    
    translate=-100;

    translate=translate*(destination-1);

    await pages.forEach(
        page => {page.style.transform = `translateX(${translate}%)`
    })

    /*const startElement = document.getElementById('page-'+start.toString());
    const destinationElement = document.getElementById('page-'+destination.toString());

    //direction === "next" ? translate -= translateAmount : translate += translateAmount;

    if (destination-start > 0) {
        translate = translate*(destination-1);
        await pages.forEach(
            page => {page.style.transform = `translateX(${translate}%)`
        })
    }
    else if (destination-start < 0) {
        //translate = Math.abs(destination-start);
        translate = translate*(destination-1);
        console.log(translate);
        await pages.forEach(
            page => {page.style.transform = `translateX(${translate}%)`
        })
    }

    if (destination-start === 1) {
        destinationElement.style.display = "flex";
        await pages.forEach(
            page => {page.style.transform = `translateX(${translate}%)`
        })
    }
    else if (destination-start === -1) {
        if (destinationElement.style.display === "none") {
            destinationElement.style.display = "flex";
        }
        await pages.forEach(
            page => {page.style.transform = `translateX(${translate}%)`
        })
    }
    else if (destination-start > 1) {
        destinationElement.style.display = "flex";
        for (let i=(start+1); i<=destination-1; i++) {
            document.getElementById('page-'+i.toString()).style.display = "none";
        }
        await pages.forEach(
        page => {page.style.transform = `translateX(${translate}%)`
        })
    }*/

}

// Search bar logic
const search = document.getElementById('search-bar-input');
search.addEventListener('input', async (e) => { //When search bar input
    preSearchResults = searchResults;
    searchResults = await SearchVenues(e.target.value);
    if (e.target.value.length < 1) {
        document.querySelectorAll('.result').forEach(result => result.remove());
    }
    else if (searchResults && searchResults.length > 0 && preSearchResults !== searchResults) {
        document.querySelectorAll('.result').forEach(result => result.remove());
        resultNotFound.style.display = 'none';
        searchResults.forEach(venue => { //Creating the search results
            const result = document.createElement('div');
            result.addEventListener('click', function() {
                openData(venue["display-name"]);
            })
            result.classList.add('result');
            const resultName = document.createElement('p');
            resultName.classList.add('result-name');
            resultName.textContent = venue["display-name"];
            const resultAddress = document.createElement('p');
            resultAddress.classList.add('result-address');
            resultAddress.style.fontSize = venue["address"].length < 40 ? '1.8vh' : (venue["address"].length / -22.2 + 3.6).toString()+'vh';
            resultAddress.textContent = venue["address"];
            result.appendChild(resultName);
            result.appendChild(resultAddress);
            document.getElementById('search-results').appendChild(result);
        })
    }
    else if (searchResults && searchResults.length == 0) {
        document.querySelectorAll('.result').forEach(result => result.remove());
        resultNotFound.style.display = 'block';
    }
});

// Similar logic to above but for Write a review
const reviewSearch = document.getElementById('write-review-search')
reviewSearch.addEventListener('input', async (e) => {
    searchResults = await SearchVenues(e.target.value);
    if (e.target.value.length < 1) {
        document.querySelectorAll('.review-result').forEach(result => result.remove());
    }
    else if (searchResults && searchResults.length > 0) {
        document.querySelectorAll('.review-result').forEach(result => result.remove());
        searchResults.forEach(venue => {
            const reviewResult = document.createElement('div');
            reviewResult.classList.add('review-result');

            const reviewResultName = document.createElement('p');
            reviewResultName.classList.add('review-result-name');
            reviewResultName.style.fontSize = venue["display-name"].length < 30 ? '1.7vh' : (venue["display-name"].length / -17.6 + 3.4).toString()+'vh';
            reviewResultName.textContent = venue["display-name"];

            reviewResult.addEventListener('click', () => {
                document.querySelectorAll('.review-result').forEach(result => result.remove());
                reviewSearch.value = venue["display-name"];
            })

            reviewResult.appendChild(reviewResultName);
            document.getElementById('review-search-results').appendChild(reviewResult);
        })
        }
    else if (searchResults && searchResults.length == 0) {
        document.querySelectorAll('.review-result').forEach(result => result.remove());
    }
})

// If venue exists
async function checkSearch() {
    const venues = await retrieveVenueData();
    const confirmVenue = venues.find(dict => 
        Object.values(dict).includes(reviewSearch.value)
    )
    if (confirmVenue) return true
    else return false

}

function openWriteReview(venue=null) {
    document.getElementById('write-review-container').style.display = "block"
    reviewSearch.value = venue;
}

async function submitReview() {
    const verifyVenue = await checkSearch();
    reviewInputs.forEach(i => {
        if (i.checked) reviewStars=i.value;
    })
    if (verifyVenue && document.getElementById('write-review-content').value && reviewStars) {
        try { // Send POST request to backend to insert review
            const payload = {
                venueName: reviewSearch.value,
                reviewerName: user,
                reviewStars: Number(reviewStars),
                reviewContent: document.getElementById('write-review-content').value
            };
            const resp = await fetch('/post-review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await resp.json();
            if (resp.ok && result.success) {
                document.getElementById('write-review-container').style.display="none";
                getReviews();
            } else {
                alert('Failed to write review');
            }
        } catch (err) {
            alert('Failed to post review (network error)');
        }
    }
}

const profileDisplayName=document.getElementById("user-display-name");
profileDisplayName.style.fontSize = user.length < 12 ? '3.8vh' : (user.length / -3.2 + 7.6).toString()+'vh';
profileDisplayName.textContent=user;

// Creating the dietary summary on profile page
dietaryOptions.forEach(option => {
    const dietaryOption = document.createElement('div');
    dietaryOption.classList.add('dietary-option');

    const dietaryOptionText = document.createElement('div');
    dietaryOptionText.textContent = option;
    dietaryOptionText.style.fontSize = option.length <= 14 ? '2.4vh' : (option.length / -5.8 + 4.8).toString() + 'vh'; 
    dietaryOptionText.classList.add('dietary-option-text');

    dietaryOption.appendChild(dietaryOptionText);
    document.getElementById('dietary-options-container').appendChild(dietaryOption);
})

document.getElementById('user-id').textContent = 'User Id: '+JSON.parse(localStorage.getItem(localStorage.getItem('currentActiveUser')))["userID"];

// Setting up map and markers
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

const restaurantIcon = L.icon({
    iconUrl: "images/LocationIcon.svg",
    iconSize: [30,30],
    iconAnchor: [15,30],
    popupAnchor: [0,-30]
})

const userIcon = L.icon({
    iconUrl: "images/UserLocationIcon.svg",
    iconSize: [20,20],
    iconAnchor: [15,30],
})

L.marker([lat, long], {icon:userIcon}).addTo(map);

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

// Uses Haversine formula for distance by latitude and longitude
function calculateDistance(lat1, long1, lat2, long2) {
    const startingLat = deg2rad(lat1);
    const startingLong = deg2rad(long1);
    const destinationLat = deg2rad(lat2);
    const destinationLong = deg2rad(long2);

    const radius = 6371; // Radius of the Earth

    const distance = Math.acos(
        Math.sin(startingLat) * Math.sin(destinationLat) + 
        Math.cos(startingLat) * Math.cos(destinationLat) *
        Math.cos(startingLong - destinationLong)
    ) * radius;

    return distance;
}

function closeTerms(element) {
    element.parentElement.style.display = "none"
}

function showSettings(id) {
    document.getElementById(id).style.display = "block";
}

// Sends GET request to server then loops to see if active user wrote any reviews
function getReviews() {
    retrieveVenueData()
        .then(venues => {
            Array.from(userReviews.children).forEach(review => {
                if (review.id !== "no-reviews"){
                    review.remove();
                }
            })
            venues.forEach(venue => {
                venue["reviews"].forEach(review => {
                    if (review["name"] === user) { // Construct reviews
                        document.getElementById('no-reviews').style.display = "none";

                        const userReview = document.createElement('div');
                        userReview.classList.add('users-review');
                        
                        const horizontalAlign3 = document.createElement('div');
                        horizontalAlign3.classList.add('horizontal-align');

                        const userReviewContainer = document.createElement('div');
                        userReviewContainer.classList.add('users-review-container');

                        const userReviewRestaurant = document.createElement('p');
                        userReviewRestaurant.classList.add('users-review-restaurant');
                        userReviewRestaurant.textContent = venue["display-name"];
                        userReviewRestaurant.style.fontSize = venue["display-name"].length < 28 ? '2.7vh' : (venue["display-name"].length / -10.4 + 5.4).toString() + 'vh';

                        const userReviewRating = document.createElement('img');
                        userReviewRating.classList.add('users-review-rating');
                        userReviewRating.src = `images/stars/${review["stars"].toString()}.svg`;

                        const userReviewContent = document.createElement('p');
                        userReviewContent.classList.add('users-review-content');
                        userReviewContent.textContent = review["content"];
                        userReviewContent.style.fontSize = review["content"].length < 60 ? '2.3vh' : (review["content"].length / -26.1 + 4.6).toString() + 'vh';

                        const userReviewDelete = document.createElement('input');
                        userReviewDelete.classList.add('users-review-delete');
                        userReviewDelete.type = "image";
                        userReviewDelete.src =  `images/DeleteReviewIcon.svg`;
                        // When clicked, ask for confirmation then call server to delete review
                        userReviewDelete.addEventListener('click', async (e) => {
                            e.preventDefault();
                            const confirmDelete = confirm('Delete this review?');
                            if (!confirmDelete) return;

                            userReviewDelete.disabled = true;
                            try {
                                const resp = await fetch('/delete-review', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ venueName: venue['display-name'], reviewerName: review['name'] })
                                });
                                const result = await resp.json();
                                if (resp.ok && result.success) {
                                    review.remove();
                                } else {
                                    alert('Failed to delete review');
                                    userReviewDelete.disabled = false;
                                }
                            } catch (err) {
                                alert('Failed to delete review (network error)');
                                userReviewDelete.disabled = false;
                            }
                        });

                        horizontalAlign3.appendChild(userReviewRestaurant);
                        horizontalAlign3.appendChild(userReviewRating);

                        userReviewContainer.appendChild(horizontalAlign3);
                        userReviewContainer.appendChild(userReviewContent);
                        userReviewContainer.appendChild(userReviewDelete);
                        
                        userReview.appendChild(userReviewContainer);
                        
                        userReviews.appendChild(userReview);
                    }
                })
            })
        })

    }


// Search algorithm
async function SearchVenues(keyword) {
    keyword = keyword.toLowerCase().trim();
    if (keyword.length < 1) {
        return;
    }
    const venues = await retrieveVenueData()
    const filteredVenues = venues.filter(venue => venue["display-name"].toLowerCase().includes(keyword));
    const scoredVenues = filteredVenues.map(venue => {
        const venueName = venue["display-name"].toLowerCase();

        // Venues are given a 'score' that is given points for proximity, starts with keyword, includes keyword

        let score = 0;

        if (venueName === keyword) {
            score += 200;
        }
        else if (venueName.startsWith(keyword)) {
            score += 100;
        }
        else if (venueName.includes(keyword)) {
            score += 50;
            score += Math.max(0, 30 - calculateDistance(lat, long, venue["lat"], venue["long"]) * 10);

        }
        return { ...venue, score };

        });
        scoredVenues.sort((a, b) => b.score - a.score); // Venues with the highest score go to the top of the list
        return scoredVenues.slice(0,5);
    };


// Locates user, not used as I have limited venue data
function geolocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        long: position.coords.longitude
                    });
                },
                (err) => {
                    resolve({ lat, long });
                }
            );
        } else {
            resolve({ lat, long });
        }
    });
}

/*geolocation().then(coords => {
    map.setView([coords.lat, coords.long], 17);
})*/

// Places markers
retrieveVenueData()
    .then(venues => {
        venues.forEach((element) => {
            markers[element["display-name"]] = L.marker([element["lat"], element["long"]], {icon:restaurantIcon})
            .addTo(map)
            .on('click', () => {
                tabs.forEach((tab, idx) => {
                    if (idx == 1 || idx == 2) {
                        tab.classList.remove('active');
                    }
                    else if (idx == 0 && tab.classList.contains('active') == false) {
                        tab.classList.add('active');
                    }
                    });
                contents.forEach((content, idx) => {
                    if (idx == 1 || idx == 2) {
                        content.classList.remove('active');
                    }
                    else if (idx == 0 && content.classList.contains('active') == false) {
                        content.classList.add('active');
                    }
                });
                Array.from(reviewContainer.children).forEach(review => {
                    review.remove();
                })

                Array.from(document.getElementById('dietary-options').children).forEach(option => {
                    option.remove();
                })

                var reviewRating=0;
                element["reviews"].forEach(review => {
                    reviewRating += review["stars"];
                })
                reviewContainer.style.display = "none";

                // Constructing each venues information

                reviewRating /= element["reviews"].length;
                document.getElementById('venue-menu').style.display = 'block';
                document.getElementById('venue-name').textContent = element["display-name"];
                document.getElementById('review-average').textContent = (Math.round(reviewRating * 2)/2);
                document.getElementById('review-stars').src = `images/stars/${(Math.round(reviewRating * 2)/2).toString()}.svg`;
                document.getElementById('review-count').textContent = '('+element["reviews"].length+')';
                document.getElementById('venue-cost').textContent = element["cost"];
                document.getElementById('address-data').textContent = element["address"];
                document.getElementById('phone-number-data').textContent = element["phone-number"];
                document.getElementById('write-review-popup').onclick = () => openWriteReview(element["display-name"]);

                document.getElementById('opening-times-data').innerHTML = "Mon     "+element["opening-times"]["Mon"]+"<br>"+
                                                                            "Tue     "+element["opening-times"]["Tues"]+"<br>"+
                                                                            "Wed     "+element["opening-times"]["Wed"]+"<br>"+
                                                                            "Thu     "+element["opening-times"]["Thurs"]+"<br>"+
                                                                            "Fri     "+element["opening-times"]["Fri"]+"<br>"+
                                                                            "Sat     "+element["opening-times"]["Sat"]+"<br>"+
                                                                            "Sun     "+element["opening-times"]["Sun"]+"<br>";
                element["reviews"].forEach(review => {
                    var horizontalAlign1 = document.createElement('div');
                    horizontalAlign1.classList.add('horizontal-align');
                    horizontalAlign1.classList.add('space-between');

                    var horizontalAlign2 = document.createElement('div');
                    horizontalAlign2.classList.add('horizontal-align');

                    var verticalAlign = document.createElement('div');
                    verticalAlign.classList.add('vertical-align');

                    var newReview = document.createElement('div');
                    newReview.classList.add('review');

                    var newReviewProfile = document.createElement('img');
                    newReviewProfile.classList.add('review-profile');
                    newReviewProfile.src = `images/ProfilePic.svg`;

                    var newReviewName = document.createElement('p');
                    newReviewName.classList.add('review-name');
                    newReviewName.style.fontSize = review["name"].length < 15 ? '1.9vh' : (review["name"].length / -7.9 +3.8).toString() + 'vh';
                    newReviewName.textContent = review["name"];

                    var newReviewStars = document.createElement('img');
                    newReviewStars.classList.add('review-rating');
                    newReviewStars.src = `images/stars/${review["stars"].toString()}.svg`;

                    var newReviewContent = document.createElement('p');
                    newReviewContent.classList.add('review-content');
                    newReviewContent.textContent = review["content"];

                    horizontalAlign1.appendChild(newReviewName);
                    horizontalAlign1.appendChild(newReviewStars);

                    verticalAlign.appendChild(horizontalAlign1);
                    verticalAlign.appendChild(newReviewContent);

                    horizontalAlign2.appendChild(newReviewProfile);
                    horizontalAlign2.appendChild(verticalAlign);

                    newReview.appendChild(horizontalAlign2);

                    reviewContainer.appendChild(newReview);

                })
                element["dietary-options"].forEach(option => {
                    var dietaryItem = document.createElement('li');
                    dietaryItem.classList.add('dietary-types');
                    dietaryItem.textContent = option;
                    document.getElementById('dietary-options').appendChild(dietaryItem);
                })
                })
    })
})


function openData(venueName) {
    markers[venueName].fire('click');
    document.querySelectorAll('.result').forEach(result => result.remove());
    document.getElementById('search-bar-input').value = '';
}

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove("active"))
        contents.forEach(c => { c.classList.remove('active'); });

        tab.classList.add('active');
        if (tab.textContent == "Overview") {
            reviewContainer.style.display = "none";
            document.getElementById('overview').classList.add('active');
        }
        else if (tab.textContent == "Reviews") {
            reviewContainer.style.display = "block";
            document.getElementById('reviews').classList.add('active');
        }
        else if (tab.textContent == "Dietary Options") {
            reviewContainer.style.display = "none";
            document.getElementById("dietary-options").classList.add('active');
        }
    })
}
)

// Resetting menu when closed
function hideMenu() {
    document.getElementById('venue-menu').style.display = 'none';
    tabs.forEach((tab, idx) => {
        if (idx == 1 || idx == 2) {
            tab.classList.remove('active');
        }
        else if (idx == 0 && tab.classList.contains('active') == false) {
            tab.classList.add('active');
        }
    });
    contents.forEach((content, idx) => {
        if (idx == 1 || idx == 2) {
            content.classList.remove('active');
        }
        else if (idx == 0 && content.classList.contains('active') == false) {
            content.classList.add('active');
        }
    });
}

function hideWriteReview() {
    document.getElementById('write-review-container').style.display="none"
    reviewSearch.value="";
    updateStars(0);
    document.getElementById('write-review-content').value="";
}

// THE FOLLOWING TWO FUNCTINONS ARE TEMPORARY AS THE FRIENDS PAGE INCLUDE PLACEHOLDERS

function removeFriend(removeElement) {
    const friendNode = removeElement.parentElement.parentElement;
    friendNode.remove()
}

function addFriend(name) {
    document.querySelectorAll('.request-name').forEach(request => {
        if (request.textContent === name) {
            request.parentElement.parentElement.remove();
            document.querySelectorAll('.friend-name').forEach(friend => {
                if (friend.textContent === name) {
                    friend.parentElement.parentElement.style.display = "flex";
                }
            })
        }
    })
}

document.querySelectorAll('.friend-name').forEach(name => {
    name.style.fontSize = name.textContent.length <= 15 ? '2.3vh' : (name.textContent.length / -6.5 + 4.6).toString() + 'vh';
})

function logout() {
    localStorage.removeItem('currentActiveUser');
    localStorage.removeItem('remember');
    window.location.href="/"
}

function deleteAccount() {
    if (confirm('Are you sure you want to delete your account?')) {
        localStorage.removeItem(localStorage.getItem('currentActiveUser'));
        localStorage.removeItem('currentActiveUser');
        localStorage.removeItem('remember');
        window.location.href="/"
    }
}