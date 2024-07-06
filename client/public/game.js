//Document constants
const canvas = document.getElementById('gameCanvas');
const generateTrackButton = document.getElementById('generate');
const startAIButton = document.getElementById('start');
const trainStopButton = document.getElementById('trainStop')
const dispSensorsButton = document.getElementById('dispSensors')
const ctx = canvas.getContext('2d', {willReadFrequently: true});


// Off-screen canvas for track drawing and collision detection
const offscreenCanvas = document.createElement('canvas');
offscreenCanvas.width = canvas.width;
offscreenCanvas.height = canvas.height;
const offscreenCtx = offscreenCanvas.getContext('2d');

// UI state variables
let clientTraining = false;
let serverTraining = false;
let clientAiRunning = false;
let serverAiRunning = false;
let playerRunning = true;
let dispSensors = false;

let car = {
    x: 100.0,
    y: 100.0,
    width: 25,
    height: 15,
    corners: [],
    speed: 0.0,
    angle: 0.0,
    rotateSpeed: 0.0,
    accel: 0.0,
    spawn_x: 0.0,
    spawn_y: 0.0,
    N_trackDist: 0.0, 
    S_trackDist: 0.0, 
    E_trackDist: 0.0,
    W_trackDist: 0.0,
};


// Track functions

function generateTrackPoints(numPoints, radius, centerX, centerY) {
    let points = [];
    for (let i = 0; i < numPoints; i++) {
        let angle = (i / numPoints) * 2 * Math.PI;
        let x = centerX + 2*radius * Math.cos(angle) + (Math.random() - 0.5) * 100;
        let y = centerY + 0.8*radius * Math.sin(angle) + (Math.random() - 0.5) * 100;
        points.push({ x, y });
    }

    car.spawn_x = points[4].x;
    car.spawn_y = points[4].y;

    initCar();

    return points;
}

function setTrackDists(disp) {

    // Car's North vision
    let init_x = (car.corners[0].x + car.corners[2].x)/2 - 1;
    let init_y = (car.corners[0].y + car.corners[2].y)/2 - 1;

    let x = init_x;
    let y = init_y;
    let imgData = [1, 1, 1, 1]

    while (!(imgData[0]===0 && imgData[1]===0 && imgData[2]===0 && imgData[3]===0)) {
        if (disp) ctx.fillRect(x, y, 2, 2);
        x += 10 * Math.cos(car.angle)
        y += 10 * Math.sin(car.angle)
        imgData = ctx.getImageData(x, y, 1, 1).data;
    }

    car.N_trackDist = Math.sqrt((x - 10 * Math.cos(car.angle) - init_x - 1)**2 + (y - 10 * Math.sin(car.angle) - init_y - 1)**2);


    //Car's South vision
    init_x = (car.corners[1].x + car.corners[3].x)/2 - 1;
    init_y = (car.corners[1].y + car.corners[3].y)/2 - 1;

    x = init_x;
    y = init_y;
    imgData = [1, 1, 1, 1]

    while (!(imgData[0]===0 && imgData[1]===0 && imgData[2]===0 && imgData[3]===0)) {
        if (disp) ctx.fillRect(x, y, 2, 2);
        x -= 10 * Math.cos(car.angle)
        y -= 10 * Math.sin(car.angle)
        imgData = ctx.getImageData(x, y, 1, 1).data;
    }

    car.S_trackDist = Math.sqrt((x + 10 * Math.cos(car.angle) - init_x - 1)**2 + (y + 10 * Math.sin(car.angle) - init_y - 1)**2);



    //Car's East vision
    init_x = (car.corners[1].x + car.corners[0].x)/2 - 1;
    init_y = (car.corners[1].y + car.corners[0].y)/2 - 1;

    x = init_x;
    y = init_y;
    imgData = [1, 1, 1, 1]

    while (!(imgData[0]===0 && imgData[1]===0 && imgData[2]===0 && imgData[3]===0)) {
        if (disp) ctx.fillRect(x, y, 2, 2);
        x -= 10 * Math.sin(car.angle)
        y += 10 * Math.cos(car.angle)
        imgData = ctx.getImageData(x, y, 1, 1).data;
    }

    car.E_trackDist = Math.sqrt((x + 10 * Math.sin(car.angle) - init_x - 1)**2 + (y - 10 * Math.cos(car.angle) - init_y - 1)**2);



    //Car's West vision
    init_x = (car.corners[2].x + car.corners[3].x)/2 - 1;
    init_y = (car.corners[2].y + car.corners[3].y)/2 - 1;

    x = init_x;
    y = init_y;
    imgData = [1, 1, 1, 1]

    while (!(imgData[0]===0 && imgData[1]===0 && imgData[2]===0 && imgData[3]===0)) {
        if (disp) ctx.fillRect(x, y, 2, 2);
        x += 10 * Math.sin(car.angle)
        y -= 10 * Math.cos(car.angle)
        imgData = ctx.getImageData(x, y, 1, 1).data;
    }

    car.W_trackDist = Math.sqrt((x - 10 * Math.sin(car.angle) - init_x - 1)**2 + (y + 10 * Math.cos(car.angle) - init_y - 1)**2);


}

// Generate random track
let trackPoints = generateTrackPoints(20, 300, canvas.width / 2, canvas.height / 2);

// Draw track
const finishImage = new Image()
finishImage.src = 'finish-line.png'

function drawTrack(points) {
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'gray';
    ctx.lineWidth = 70;
    ctx.stroke();

    ctx.setLineDash([10, 10])
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.drawImage(finishImage, car.spawn_x-10, car.spawn_y-35, 20, 70)

}

function isCarOnTrack() {

    offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    offscreenCtx.beginPath();
    offscreenCtx.moveTo(trackPoints[0].x, trackPoints[0].y);
    for (let i = 1; i < trackPoints.length; i++) {
        offscreenCtx.lineTo(trackPoints[i].x, trackPoints[i].y);
    }
    offscreenCtx.closePath();
    offscreenCtx.strokeStyle = 'gray';
    offscreenCtx.lineWidth = 70;
    offscreenCtx.stroke();

    // ctx.fillStyle = 'blue';
    for (let [i, corner] of car.corners.entries()) {
        // ctx.fillRect(corner.x - 2.5, corner.y - 2.5, 5, 5);
        if (!offscreenCtx.isPointInStroke(corner.x, corner.y)) {
            return false;
        }
    }
    return true;
}


// Car functions

const carImage = new Image()
carImage.src = 'car-image.png'
function drawCar() {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);
    ctx.drawImage(carImage, -car.width / 2, -car.height / 2, car.width, car.height)
    ctx.restore();
}

function updateCar() {
    car.angle += car.rotateSpeed;

    if (car.accel!==0) {
        car.speed += car.accel;
    } else {
        if (car.speed < 0) {
            car.speed += 0.1;
            car.speed = (car.speed >= 0) ? 0 : car.speed;
        } else {
            car.speed -= 0.1;
            car.speed = (car.speed < 0) ? 0 : car.speed;
        }
    }

    car.x += Math.cos(car.angle) * car.speed;
    car.y += Math.sin(car.angle) * car.speed;

    car.corners = [
        { x: car.x + car.width / 2 * Math.cos(car.angle) - car.height / 2 * Math.sin(car.angle),
          y: car.y + car.width / 2 * Math.sin(car.angle) + car.height / 2 * Math.cos(car.angle) },
        { x: car.x - car.width / 2 * Math.cos(car.angle) - car.height / 2 * Math.sin(car.angle),
          y: car.y - car.width / 2 * Math.sin(car.angle) + car.height / 2 * Math.cos(car.angle) },
        { x: car.x + car.width / 2 * Math.cos(car.angle) + car.height / 2 * Math.sin(car.angle),
          y: car.y + car.width / 2 * Math.sin(car.angle) - car.height / 2 * Math.cos(car.angle) },
        { x: car.x - car.width / 2 * Math.cos(car.angle) + car.height / 2 * Math.sin(car.angle),
          y: car.y - car.width / 2 * Math.sin(car.angle) - car.height / 2 * Math.cos(car.angle) }
    ];

}

function initCar() {
    car.x = car.spawn_x - 25;
    car.y = car.spawn_y;
    car.speed = 0.0;
    car.accel = 0.0;
    car.angle=0.0;
    car.rotateSpeed=0.0;

    car.corners = [
        { x: car.x + car.width / 2 * Math.cos(car.angle) - car.height / 2 * Math.sin(car.angle),
          y: car.y + car.width / 2 * Math.sin(car.angle) + car.height / 2 * Math.cos(car.angle) },
        { x: car.x - car.width / 2 * Math.cos(car.angle) - car.height / 2 * Math.sin(car.angle),
          y: car.y - car.width / 2 * Math.sin(car.angle) + car.height / 2 * Math.cos(car.angle) },
        { x: car.x + car.width / 2 * Math.cos(car.angle) + car.height / 2 * Math.sin(car.angle),
          y: car.y + car.width / 2 * Math.sin(car.angle) - car.height / 2 * Math.cos(car.angle) },
        { x: car.x - car.width / 2 * Math.cos(car.angle) + car.height / 2 * Math.sin(car.angle),
          y: car.y - car.width / 2 * Math.sin(car.angle) - car.height / 2 * Math.cos(car.angle) }
    ];

}

function drawBumpers() {

    ctx.fillStyle = 'blue';
    for (let corner of car.corners) {
        ctx.fillRect(corner.x - 2.5, corner.y - 2.5, 5, 5);
    }

    ctx.fillRect((car.corners[0].x +  car.corners[1].x)/2 -2.5, (car.corners[0].y + car.corners[1].y)/2 -2.5, 5, 5);
    ctx.fillRect((car.corners[2].x +  car.corners[3].x)/2 -2.5, (car.corners[2].y + car.corners[3].y)/2 -2.5, 5, 5);
    ctx.fillRect((car.corners[0].x +  car.corners[2].x)/2 -2.5, (car.corners[0].y + car.corners[2].y)/2 -2.5, 5, 5);
    ctx.fillRect((car.corners[1].x +  car.corners[3].x)/2 -2.5, (car.corners[1].y + car.corners[3].y)/2 -2.5, 5, 5);

}

// Async/fetch functions

// sends the game state to the server agent and return the next action
async function sendState(reward, done, doneState) {
    try {
        const args = (done) 
            ? doneState 
            : {
                carPosX: car.x, 
                carPosY: car.y,
                carSpeed: car.speed, 
                sineAngle: Math.sin(car.angle),
                cosineAngle: Math.cos(car.angle),
                N_trackDist: car.N_trackDist, 
                S_trackDist: car.S_trackDist, 
                E_trackDist: car.E_trackDist,
                W_trackDist: car.W_trackDist,
                reward: reward,
                done: done,
                isTrain: serverTraining
            };
        
            console.log(args.reward)
        

        const resp = await fetch('/api/sendState', {
                                method: 'POST',
                                body: JSON.stringify(args),
                                headers: new Headers({'Content-Type': 'application/json'})
                            })

        if (!resp.ok) console.error("Status " + resp.status + ": " + resp.statusText)

        data = await resp.json();
        if (data === null || typeof data !== "object") throw Error("Invalid response.");
        
        //actions are in the form of KeyDirection
        if (data.action !== 'UpUp' && data.action !== 'UpDown' && data.action !== 'UpRight' && data.action !== 'UpLeft' && data.action !== 'DownUp' && data.action !== 'DownDown' && data.action !== 'DownRight' && data.action !== 'DownLeft' && data.action !== 'None') { 
            console.log(data)
            throw Error("Invalid response: " + data.action) 
        }

        return data.action;

    } catch(error) {
        console.error(`Fetch error for /api/sendState:`, error);
    }
}


// Training Simulation Functions

function executeAction(action) {

    if (action === 'DownUp') car.accel = 0.1;
    if (action === 'DownDown') car.accel = -0.1;
    if (action === 'DownLeft') car.rotateSpeed = -0.04;
    if (action === 'DownRight') car.rotateSpeed = 0.04;
    if (action === 'UpUp' || action === 'UpDown') car.accel=0;
    if (action === 'UpLeft' || action === 'UpRight') car.rotateSpeed = 0;
} 


function drawGates(disp) {
    front = {x: (car.corners[0].x + car.corners[2].x)/2, y: (car.corners[0].y + car.corners[2].y)/2}
    back = {x: (car.corners[1].x + car.corners[1].x)/2, y: (car.corners[3].y + car.corners[3].y)/2}
    const gateWidth = 70; // Same as track width
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    offscreenCtx.lineWidth = 15;
    let reward = 0.1;
    for (let i = 0; i < trackPoints.length; i++) {
        const currentPoint = trackPoints[i];
        const nextPoint = trackPoints[(i + 1) % trackPoints.length];
        const prevPoint = trackPoints[(i - 1 + trackPoints.length) % trackPoints.length];
        
        // Calculate direction vector
        let dx = nextPoint.x - prevPoint.x;
        let dy = nextPoint.y - prevPoint.y;
        
        // Normalize direction vector
        const length = Math.sqrt(dx * dx + dy * dy);
        dx /= length;
        dy /= length;
        
        // Perpendicular vector
        const perpX = -dy;
        const perpY = dx;
        
        // Calculate gate endpoints
        const gateStartX = currentPoint.x - perpX * gateWidth / 2;
        const gateStartY = currentPoint.y - perpY * gateWidth / 2;
        const gateEndX = currentPoint.x + perpX * gateWidth / 2;
        const gateEndY = currentPoint.y + perpY * gateWidth / 2;
        
        // Draw gate
        if (disp) {
            ctx.beginPath();
            ctx.moveTo(gateStartX, gateStartY);
            ctx.lineTo(gateEndX, gateEndY);
            ctx.stroke();
        }

        offscreenCtx.beginPath();
        offscreenCtx.moveTo(gateStartX, gateStartY);
        offscreenCtx.lineTo(gateEndX, gateEndY);
        offscreenCtx.stroke();

        if (offscreenCtx.isPointInStroke(front.x, front.y)) {
            if (car.speed < 0) {
                reward = -1;
            } else if (car.speed > 0) {
                reward = 0.5;
            }
        }

    }

    return reward;
}


// Main game loop
let counter = 1n;
let done = false;
let doneState = undefined;
let newAction;
let currReward;
let backState;
async function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTrack(trackPoints);
    drawCar();

    setTrackDists(dispSensors);
    if (dispSensors) { drawBumpers(); }
    currReward = drawGates(dispSensors)

    if (!isCarOnTrack()) {
        done = true;
        doneState = {
            carPosX: car.x,
            carPosY: car.y,
            carSpeed: car.speed,
            sineAngle: Math.sin(car.angle),
            cosineAngle: Math.cos(car.angle),
            N_trackDist: car.N_trackDist, 
            S_trackDist: car.S_trackDist, 
            E_trackDist: car.E_trackDist,
            W_trackDist: car.W_trackDist,
            reward: -1,
            done: done,
            isTrain: serverTraining
        }

        car.x = backState.x;
        car.y = backState.y;
        car.angle = backState.angle;
        car.N_trackDist = backState.N_trackDist;
        car.S_trackDist = backState.S_trackDist
        car.E_trackDist = backState.E_trackDist
        car.W_trackDist = backState.W_trackDist;
        car.speed = -car.speed/2;
        
    } else {
        backState = {
            x: car.x,
            y: car.y,
            angle: car.angle,
            N_trackDist: car.N_trackDist, 
            S_trackDist: car.S_trackDist, 
            E_trackDist: car.E_trackDist,
            W_trackDist: car.W_trackDist,
        }
    }


    if (serverTraining || serverAiRunning) { 
        newAction = await sendState(currReward, done, doneState);
        console.log(newAction)
        executeAction(newAction);

        done = false

    }
    
    updateCar();
    requestAnimationFrame(gameLoop);
}




// Event listeners

document.addEventListener('keydown', (event) => {
    if (playerRunning) {
        if (event.key === 'ArrowUp') car.accel = 0.1;
        if (event.key === 'ArrowDown') car.accel = -0.1;
        if (event.key === 'ArrowLeft') car.rotateSpeed = -0.035; 
        if (event.key === 'ArrowRight') car.rotateSpeed = 0.035;
    }
});

document.addEventListener('keyup', (event) => {
    if (playerRunning) {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') car.accel=0;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') car.rotateSpeed = 0;
    }
});

dispSensorsButton.addEventListener('click', () => {
    dispSensors = !dispSensors
    dispSensorsButton.textContent = (dispSensors) ? 'Remove Sensors' : 'Display Sensors';
})

generateTrackButton.addEventListener('click', () => {
    if (playerRunning) {
        trackPoints = generateTrackPoints(20, 300, canvas.width / 2, canvas.height / 2);
    }
});

startAIButton.addEventListener('click', () => {
    if (!clientTraining) {
        clientAiRunning = !clientAiRunning;
        playerRunning = !clientAiRunning;
        startAIButton.textContent = (clientAiRunning) ? 'Stop AI (DQN)' : 'Start AI (DQN)';
        initCar();

        if (clientAiRunning) {
            fetch('api/startAI', {method: 'POST',
                body: JSON.stringify({
                    carPosX: car.x,
                    carPosY: car.y,
                    carSpeed: car.speed,
                    sineAngle: Math.sin(car.angle),
                    cosineAngle: Math.cos(car.angle),
                    N_trackDist: car.N_trackDist, 
                    S_trackDist: car.S_trackDist, 
                    E_trackDist: car.E_trackDist,
                    W_trackDist: car.W_trackDist
                }), 
                headers: new Headers({'Content-Type': 'application/json'})})
            .then((resp) => {
                if (resp.ok) {
                    resp.json().then((data) => {
                        if (data === null || typeof data !== "object") console.error("Invalid response.");
                        else if (data.action !== 'UpUp' && data.action !== 'UpDown' && data.action !== 'UpRight' && data.action !== 'UpLeft' && data.action !== 'DownUp' && data.action !== 'DownDown' && data.action !== 'DownRight' && data.action !== 'DownLeft' && data.action !== 'None') { 
                            console.error("Invalid response.") 
                        } else {

                            executeAction(data.action);
                            serverAiRunning=true;
                        }

                    })
                } else {
                    console.error('Status code' + resp.status + ': ' + resp.statusText)
                }
            })
            .catch(() => console.error("Could not start AI"))
        } else {
            serverAiRunning = false;

            fetch('/api/stopAI', {method:'POST', headers: new Headers({'Content-Type': 'application/json'})})
            .then((resp) => {
                if (resp.ok) {
                    resp.json().then((data) => {
                        if (data === null || typeof data !== "object") console.error("Invalid response.");
                    })
                } else {
                    console.error('Status code' + resp.status + ': ' + resp.statusText)
                }
            })
            .catch(() => console.error("Could not stop AI"))
        }
    }
});



trainStopButton.addEventListener('click', () => {
    if (!clientAiRunning) {
        // UI Update
        clientTraining = !clientTraining;
        playerRunning = !clientTraining;
        trainStopButton.textContent = (clientTraining) ? 'Stop' : 'Train';
        initCar();

        

        if (clientTraining) {

            fetch('/api/startTraining', {
                method: 'POST',
                body: JSON.stringify({
                    carPosX: car.x,
                    carPosY: car.y,
                    carSpeed: car.speed,
                    sineAngle: Math.sin(car.angle),
                    cosineAngle: Math.cos(car.angle),
                    N_trackDist: car.N_trackDist, 
                    S_trackDist: car.S_trackDist, 
                    E_trackDist: car.E_trackDist,
                    W_trackDist: car.W_trackDist
                }),
                headers: new Headers({'Content-Type': 'application/json'})
            })
            .then((resp) => {
                if (resp.ok) {
                    resp.json().then((data) => {
                        if (data === null || typeof data !== "object") console.error("Invalid response.");
                        else if (data.action !== 'UpUp' && data.action !== 'UpDown' && data.action !== 'UpRight' && data.action !== 'UpLeft' && data.action !== 'DownUp' && data.action !== 'DownDown' && data.action !== 'DownRight' && data.action !== 'DownLeft' && data.action !== 'None') { 
                            console.error("Invalid response.") 
                        } else {

                            executeAction(data.action);
                            serverTraining=true;
                        }

                    })
                } else {
                    console.error('Status code' + resp.status + ': ' + resp.statusText)
                }
            })
            .catch(() => console.error("Could not start training"))


        } else {

            serverTraining=false;
            
            fetch('/api/stopTraining', {
                method: 'POST',
                headers: new Headers({'Content-Type': 'application/json'})
            })
            .then((resp) => {
                if (resp.ok) {
                    resp.json().then((data) => {
                        if (data === null || typeof data !== "object") console.error("Invalid response.");
                    })
                } else {
                    console.error('Status code' + resp.status + ': ' + resp.statusText)
                }
            })
            .catch(() => console.error("Could not stop training"))
        }
    }
})


// Main
gameLoop();
