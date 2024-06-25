const canvas = document.getElementById('gameCanvas');
const generateTrack = document.getElementById('generate');
const startCar = document.getElementById('start');
const ctx = canvas.getContext('2d');


let car = {
    x: 100,
    y: 100,
    width: 25,
    height: 15,
    speed: 0,
    angle: 0,
    rotateSpeed: 0,
    accel: 0,
    spawn_x: 0,
    spawn_y: 0
};

function generateTrackPoints(numPoints, radius, centerX, centerY) {
    let points = [];
    for (let i = 0; i < numPoints; i++) {
        let angle = (i / numPoints) * 2 * Math.PI;
        let x = centerX + 2*radius * Math.cos(angle) + (Math.random() - 0.5) * 100;
        let y = centerY + 0.8*radius * Math.sin(angle) + (Math.random() - 0.5) * 100;
        points.push({ x, y });
    }
    car.x = points[4].x;
    car.y = points[4].y;
    car.angle=0;
    car.speed = 0;
    car.accel=0;
    car.spawn_x = car.x;
    car.spawn_y = car.y;


    return points;
}

// Draw track
function drawTrack(points) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'gray';
    ctx.lineWidth = 70;
    ctx.stroke();
}


// Generate and draw random track
let trackPoints = generateTrackPoints(20, 300, canvas.width / 2, canvas.height / 2);

function isCarOnTrack() {
    const carCorners = [
        { x: car.x + car.width / 2 * Math.cos(car.angle) - car.height / 2 * Math.sin(car.angle),
          y: car.y + car.width / 2 * Math.sin(car.angle) + car.height / 2 * Math.cos(car.angle) },
        { x: car.x - car.width / 2 * Math.cos(car.angle) - car.height / 2 * Math.sin(car.angle),
          y: car.y - car.width / 2 * Math.sin(car.angle) + car.height / 2 * Math.cos(car.angle) },
        { x: car.x + car.width / 2 * Math.cos(car.angle) + car.height / 2 * Math.sin(car.angle),
          y: car.y + car.width / 2 * Math.sin(car.angle) - car.height / 2 * Math.cos(car.angle) },
        { x: car.x - car.width / 2 * Math.cos(car.angle) + car.height / 2 * Math.sin(car.angle),
          y: car.y - car.width / 2 * Math.sin(car.angle) - car.height / 2 * Math.cos(car.angle) }
    ];


    ctx.beginPath();
    ctx.moveTo(trackPoints[0].x, trackPoints[0].y);
    for (let i = 1; i < trackPoints.length; i++) {
        ctx.lineTo(trackPoints[i].x, trackPoints[i].y);
    }
    ctx.closePath();


    //ctx.fillStyle = 'blue';
    for (let corner of carCorners) {
        //ctx.fillRect(corner.x - 2.5, corner.y - 2.5, 5, 5);
        if (!ctx.isPointInStroke(corner.x, corner.y)) {
            return false;
        }
    }
    return true;
}


const carImage = new Image()
carImage.src = 'car-image.png'
function drawCar() {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);
    // ctx.fillStyle = 'red';
    // ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);
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
}


function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTrack(trackPoints);
    drawCar();
    updateCar();

    if (!isCarOnTrack()) {
        car.x = car.spawn_x;
        car.y = car.spawn_y;
        car.speed = 0;
        car.accel = 0;
        car.angle=0;

    }
    
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp') car.accel = 0.25;
    if (event.key === 'ArrowDown') car.accel = -0.25;
    if (event.key === 'ArrowLeft') car.rotateSpeed = -0.08; 
    if (event.key === 'ArrowRight') car.rotateSpeed = 0.08;
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        car.accel=0;
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') car.rotateSpeed = 0;
});

generateTrack.addEventListener('click', () => {
    trackPoints = generateTrackPoints(20, 300, canvas.width / 2, canvas.height / 2);
});

startCar.addEventListener('click', () => {
    console.log(isCarOnTrack());
});




gameLoop();
