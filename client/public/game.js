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
    NE_trackDist: 0.0,
    NW_trackDist: 0.0,
    up: false,
    left: false,
    right: false
};


// Track functions

function generateTrackPoints(numPoints, radius, centerX, centerY) {
    let points = [];
    for (let i = 0; i < numPoints; i++) {
        let angle = (i / numPoints) * 2 * Math.PI;
        let x = centerX + 2*radius * Math.cos(angle) + (Math.random() - 0.5) * 50;
        let y = centerY + 0.8*radius * Math.sin(angle) + (Math.random() - 0.5) * 50;
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


    //Car's North West vision
    init_x = car.corners[2].x - 1;
    init_y = car.corners[2].y - 1;

    x = init_x;
    y = init_y;
    imgData = [1, 1, 1, 1]

    while (!(imgData[0]===0 && imgData[1]===0 && imgData[2]===0 && imgData[3]===0)) {
        if (disp) ctx.fillRect(x, y, 2, 2);
        x += 10 * Math.sin(car.angle + Math.PI/4)
        y -= 10 * Math.cos(car.angle + Math.PI/4)
        imgData = ctx.getImageData(x, y, 1, 1).data;
    }

    car.NW_trackDist = Math.sqrt((x - 10 * Math.sin(car.angle) - init_x - 1)**2 + (y + 10 * Math.cos(car.angle) - init_y - 1)**2);

    //Car's North East vision
    init_x = car.corners[0].x - 1;
    init_y = car.corners[0].y - 1;

    x = init_x;
    y = init_y;
    imgData = [1, 1, 1, 1]

    while (!(imgData[0]===0 && imgData[1]===0 && imgData[2]===0 && imgData[3]===0)) {
        if (disp) ctx.fillRect(x, y, 2, 2);
        x -= 10 * Math.sin(car.angle - Math.PI/4)
        y += 10 * Math.cos(car.angle - Math.PI/4)
        imgData = ctx.getImageData(x, y, 1, 1).data;
    }

    car.NE_trackDist = Math.sqrt((x + 10 * Math.sin(car.angle) - init_x - 1)**2 + (y - 10 * Math.cos(car.angle) - init_y - 1)**2);


}

// Generate random track
let trackPoints = generateTrackPoints(20, 300, canvas.width / 2, canvas.height / 2);

// Draw track
const finishImage = new Image()
finishImage.src = 'finish-line.png'

function drawTrack(points) {

    // Road
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

    // Center line
    ctx.setLineDash([10, 10])
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Finish line
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

    for (let [i, corner] of car.corners.entries()) {
        if (!offscreenCtx.isPointInStroke(corner.x, corner.y)) {
            return {cornerIdx: i, bool: false};
        }
    }
    return {corner:undefined, bool: true};
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
    car.up = false;
    car.left = false;
    car.right = false;

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
async function sendState(reward, done) {
    try {
        //const args = (done) ? doneState : 
        const args = {
                carX: car.x,
                carY: car.y, 
                sineAngle: Math.sin(car.angle),
                cosAngle: Math.cos(car.angle),
                carSpeed: car.speed, 
                NE_trackDist: car.NE_trackDist, 
                NW_trackDist: car.NW_trackDist,
                N_trackDist: car.N_trackDist, 
                S_trackDist: car.S_trackDist, 
                E_trackDist: car.E_trackDist,
                W_trackDist: car.W_trackDist,
                up: car.up,
                left: car.left,
                right: car.right,
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

        //actions are in the form of KeySwitch
        if (data.action !== 'UpSwitch' && data.action !== 'LeftSwitch' && data.action !== 'RightSwitch' && data.action !== 'None') { 
            throw Error("Invalid response: " + data.action) 
        }

        return data.action;

    } catch(error) {
        console.error(`Fetch error for /api/sendState:`, error);
    }
}


// Training Simulation Functions

function executeAction(action) {

    if (action==='UpSwitch') {
        car.accel = (car.accel===0.1) ? 0 : 0.1;
        car.up = car.accel===0.1;
    }

    // if (action==='DownSwitch') {
    //     car.accel = (car.accel===-0.1) ? 0 : -0.1;
    //     car.down = car.accel===-0.1;
    // }

    if (action==='LeftSwitch') {
        car.rotateSpeed = (car.rotateSpeed===-0.04) ? 0 : -0.04;
        car.left = car.rotateSpeed===-0.04;
    }

    if (action==='RightSwitch') {
        car.rotateSpeed = (car.rotateSpeed===0.04) ? 0 : 0.04;
        car.right = car.rotateSpeed===0.04;
    }


    // if (action === 'DownUp') car.accel = 0.1;
    // if (action === 'DownDown') car.accel = -0.1;
    // if (action === 'DownLeft') car.rotateSpeed = -0.04;
    // if (action === 'DownRight') car.rotateSpeed = 0.04;
    // if (action === 'UpUp' || action === 'UpDown') car.accel=0;
    // if (action === 'UpLeft' || action === 'UpRight') car.rotateSpeed = 0;
} 


let gatesTracker = {blues: Array(20).fill(false), reds: Array(20).fill(false), active: Array(20).fill(false)}

function drawGates(disp) {
    front = {x: (car.corners[0].x + car.corners[2].x)/2, y: (car.corners[0].y + car.corners[2].y)/2};
    back = {x: (car.corners[1].x + car.corners[1].x)/2, y: (car.corners[3].y + car.corners[3].y)/2};
    const gateWidth = 70; 
    ctx.lineWidth = 2;
    offscreenCtx.lineWidth = 15;
    let reward = -0.1;
    let noReward = true;
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
        const gateStartX1 = currentPoint.x  - perpX * (gateWidth / 2)
        const gateStartY1 = currentPoint.y - perpY * (gateWidth / 2)
        const gateEndX1 = currentPoint.x + perpX * (gateWidth / 2)
        const gateEndY1 = currentPoint.y + perpY * (gateWidth / 2)



        // Calculate next direction vector
        const midPoint = {x: (prevPoint.x + 3*currentPoint.x)/4, y: (prevPoint.y + 3*currentPoint.y)/4} 

        let dxM = currentPoint.x - prevPoint.x;
        let dyM = currentPoint.y - prevPoint.y;
        
        // Normalize direction vector
        const lengthM = Math.sqrt(dxM * dxM + dyM * dyM);
        dxM /= lengthM;
        dyM /= lengthM;
        
        // Perpendicular vector
        const perpXM = -dyM;
        const perpYM = dxM;


        // Calculate gate endpoints for the second line
        const gateStartX2 = midPoint.x - perpXM * (gateWidth / 2)
        const gateStartY2 = midPoint.y - perpYM * (gateWidth / 2)
        const gateEndX2 = midPoint.x + perpXM * (gateWidth / 2) 
        const gateEndY2 = midPoint.y + perpYM * (gateWidth / 2)

        
        // Draw gate
        if (disp) {
            ctx.strokeStyle = 'blue';
            ctx.beginPath();
            ctx.moveTo(gateStartX1, gateStartY1);
            ctx.lineTo(gateEndX1, gateEndY1);
            ctx.stroke();

            ctx.strokeStyle = 'red';
            ctx.beginPath();
            ctx.moveTo(gateStartX2, gateStartY2);
            ctx.lineTo(gateEndX2, gateEndY2);
            ctx.stroke();
        }

        offscreenCtx.beginPath();
        offscreenCtx.moveTo(gateStartX1, gateStartY1);
        offscreenCtx.lineTo(gateEndX1, gateEndY1);
        offscreenCtx.stroke();

        onBlue = offscreenCtx.isPointInStroke(front.x, front.y);
        

        offscreenCtx.beginPath();
        offscreenCtx.moveTo(gateStartX2, gateStartY2);
        offscreenCtx.lineTo(gateEndX2, gateEndY2);
        offscreenCtx.stroke();

        onRed = offscreenCtx.isPointInStroke(front.x, front.y);

        if (noReward) {
            if (onBlue && !gatesTracker.active[i]) {
                gatesTracker.active[i] = true;
                gatesTracker.blues[i] = !gatesTracker.blues[i];
                if (gatesTracker.reds[i]) {
                    reward = -1;
                    gatesTracker.reds[i] = false;
                    gatesTracker.blues[i] = false;
                    noReward = false;
                }
            }

            if (onRed && !gatesTracker.active[i]) {
                gatesTracker.active[i] = true;
                gatesTracker.reds[i] = !gatesTracker.reds[i];
                if (gatesTracker.blues[i]) {
                    reward = 0.5;
                    gatesTracker.blues[i] = false;
                    gatesTracker.reds[i] = false;
                    noReward = false;
                } 
            }

            if (!onBlue && !onRed) {
                gatesTracker.active[i] = false;
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
let val;
async function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTrack(trackPoints);
    drawCar();

    setTrackDists(dispSensors);
    if (dispSensors) { drawBumpers(); }
    currReward = drawGates(dispSensors)

    val = isCarOnTrack();
    if (!val.bool) {
        done = true;
        // doneState = {
        //     carSpeed: car.speed,
        //     NW_trackDist: car.NE_trackDist,
        //     NE_trackDist: car.NW_trackDist,
        //     N_trackDist: car.N_trackDist, 
        //     S_trackDist: car.S_trackDist, 
        //     E_trackDist: car.E_trackDist,
        //     W_trackDist: car.W_trackDist,
        //     up: car.up,
        //     down: car.down,
        //     left: car.left,
        //     right: car.right,
        //     reward: -1,
        //     done: done,
        //     isTrain: serverTraining
        // }

        currReward = -1;

        car.x = backState.x;
        car.y = backState.y;
        car.angle = backState.angle;
        car.N_trackDist = backState.N_trackDist;
        car.S_trackDist = backState.S_trackDist
        car.E_trackDist = backState.E_trackDist
        car.W_trackDist = backState.W_trackDist;
        car.speed = (val.cornerIdx===0 || val.cornerIdx===2) ? -2 : 2;

        //initCar();
        
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

    //if (counter%10n===0n) {
        if (serverTraining || serverAiRunning) { 
            newAction = await sendState(currReward, done);
            console.log(newAction)
            executeAction(newAction);

            done = false
        } 
        else {
            initCar();
        }
    //    counter = 0n;
    //}
    //counter += 1n;
    
    updateCar();
    requestAnimationFrame(gameLoop);
}




// Event listeners

document.addEventListener('keydown', (event) => {
    if (playerRunning) {
        if (event.key === 'ArrowUp') {
            car.accel = 0.1; 
            car.up = true;
        }

        // if (event.key === 'ArrowDown') {
        //     car.accel = -0.1; 
        //     car.down = true;
        // }

        if (event.key === 'ArrowLeft') {
            car.rotateSpeed = -0.035; 
            car.left = true;
        }

        if (event.key === 'ArrowRight') {
            car.rotateSpeed = 0.035; 
            car.right = true;
        }
    }
});

document.addEventListener('keyup', (event) => {
    if (playerRunning) {
        if (event.key === 'ArrowUp'){ // || event.key === 'ArrowDown') {
            car.accel=0; 
            car.up = (event.key==='ArrowUp') ? false : car.up;
            //car.down = (event.key==='ArrowDown') ? false : car.down;

        }

        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            car.rotateSpeed = 0;
            car.left = (event.key==='ArrowLeft') ? false : car.left;
            car.right = (event.key==='ArrowRight') ? false : car.right;
        }
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

        if (clientAiRunning) {
            fetch('api/startAI', {method: 'POST',
                body: JSON.stringify({
                    carX: car.x,
                    carY: car.y, 
                    sineAngle: Math.sin(car.angle),
                    cosAngle: Math.cos(car.angle),
                    carSpeed: car.speed,
                    NE_trackDist: car.NE_trackDist,
                    NW_trackDist: car.NW_trackDist,
                    N_trackDist: car.N_trackDist, 
                    S_trackDist: car.S_trackDist, 
                    E_trackDist: car.E_trackDist,
                    W_trackDist: car.W_trackDist,
                    up: car.up,
                    left: car.left,
                    right: car.right
                }), 
                headers: new Headers({'Content-Type': 'application/json'})})
            .then((resp) => {
                if (resp.ok) {
                    resp.json().then((data) => {
                        if (data === null || typeof data !== "object") console.error("Invalid response.");
                        else if (data.action !== 'UpSwitch' && data.action !== 'LeftSwitch' && data.action !== 'RightSwitch' && data.action !== 'None') { 
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

        

        if (clientTraining) {

            fetch('/api/startTraining', {
                method: 'POST',
                body: JSON.stringify({
                    carX: car.x,
                    carY: car.y, 
                    sineAngle: Math.sin(car.angle),
                    cosAngle: Math.cos(car.angle),
                    carSpeed: car.speed,
                    NE_trackDist: car.NE_trackDist, 
                    NW_trackDist: car.NW_trackDist,
                    N_trackDist: car.N_trackDist, 
                    S_trackDist: car.S_trackDist, 
                    E_trackDist: car.E_trackDist,
                    W_trackDist: car.W_trackDist,
                    up: car.up,
                    left: car.left,
                    right: car.right
                }),
                headers: new Headers({'Content-Type': 'application/json'})
            })
            .then((resp) => {
                if (resp.ok) {
                    resp.json().then((data) => {
                        if (data === null || typeof data !== "object") console.error("Invalid response.");
                        else if (data.action !== 'UpSwitch' && data.action !== 'LeftSwitch' && data.action !== 'RightSwitch' && data.action !== 'None') { 
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
