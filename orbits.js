//  Anthony Frandsen
//  April 27, 2021
//  Week 15 Assignment

/*
    Use you imagination and create a Web application that uses the mouse to interact with image(s) and text.
*/

/* Constants */
const MAX_TRAIL_LENGTH = 60;
const ATTRACTION_FORCE = 0.0025;
const MINIMUM_BALL_SIZE = 15;
const MAXIMUM_BALL_SIZE = 50;
const MAXIMUM_RANDOM_VELOCITY = 30;
const SLOWMO_FPS = 30;
const STABLE_COLOR = "180,218,85";
const UNSTABLE_COLOR_RED = 244;
const UNSTABLE_COLOR_GREEN = 32;
const UNSTABLE_COLOR_BLUE = 105;
const STABLE_COLOR_RED = 180;
const STABLE_COLOR_GREEN = 218;
const STABLE_COLOR_BLUE = 85;
const COUNT_UNTIL_STABLE = 60;
const EXTRA_COUNT_UNTIL_ALL_STABLE = 1200;

/* Classes */
class Vector{
    constructor(x, y){
        this.x = x;
        this.y = y;
    }
    mutable_add(otherVector){
        this.x += otherVector.x;
        this.y += otherVector.y;
    }
    mutable_subtract(otherVector){
        this.x -= otherVector.x;
        this.y -= otherVector.y;
    }
    mutable_multiply(factor){
        this.x *= factor;
        this.y *= factor;
    }
    add(otherVector){
        return new Vector(
            this.x + otherVector.x,
            this.y + otherVector.y
        );
    }
    subtract(otherVector){
        return new Vector(
            this.x - otherVector.x,
            this.y - otherVector.y
        );
    }
    multiply(factor){
        return new Vector(
            this.x * factor,
            this.y * factor
        );
    }
}

class Ball{
    //Constructor only uses position, and gives a random size and intial velocity
    constructor(x, y){
        this.position = new Vector(x, y);
        this.r = Math.random() * (MAXIMUM_BALL_SIZE - MINIMUM_BALL_SIZE) + MINIMUM_BALL_SIZE;
        this.velocity = new Vector(
            Math.random() * MAXIMUM_RANDOM_VELOCITY - MAXIMUM_RANDOM_VELOCITY / 2,
            Math.random() * MAXIMUM_RANDOM_VELOCITY - MAXIMUM_RANDOM_VELOCITY / 2
        );
        this.stable = true;
        this.stableCount = COUNT_UNTIL_STABLE;
        this.history = [];
    }
    color(){
        //If ball is stable, save computation time and display stable color
        if (this.stableCount > COUNT_UNTIL_STABLE){
            return{
                main: "rgb(" + STABLE_COLOR + ")",
                ghost: "rgba(" + STABLE_COLOR + ",0.5)"
            }
        }

        //Otherwise, compute the color
        let output = "";
        let colorOffset = ~~((STABLE_COLOR_RED - UNSTABLE_COLOR_RED) * this.stableCount / COUNT_UNTIL_STABLE);
        output += (UNSTABLE_COLOR_RED + colorOffset) + ",";
        colorOffset = ~~((STABLE_COLOR_GREEN - UNSTABLE_COLOR_GREEN) * this.stableCount / COUNT_UNTIL_STABLE);
        output += (UNSTABLE_COLOR_GREEN + colorOffset) + ",";
        colorOffset = ~~((STABLE_COLOR_BLUE - UNSTABLE_COLOR_BLUE) * this.stableCount / COUNT_UNTIL_STABLE);
        output += (UNSTABLE_COLOR_BLUE + colorOffset);
        return{
            main: "rgb(" + output + ")",
            ghost: "rgba(" + output + ",0.5)"
        }
    }
    
    update(){
        //Add the current position into the history for displaying trails.
        //If too many in history, remove oldest one.
        //Finally, update current position.
        this.history.push(new Vector(this.position.x, this.position.y));
        if (this.history.length > MAX_TRAIL_LENGTH){
            this.history.shift();
        }
        this.position.mutable_add(this.velocity);
    }
}

/* Global Variables */
var canvas;
var context;
var fps = 60;
var max_speed = false;
var balls = [];
var bannerHidden = false;

//Function called when page and all resources are loaded
window.addEventListener("load", function(){    
    //Click the reset button to clear balls
    document.getElementById("resetButton").addEventListener("click", function(){
        balls=[];
    });

    //Click the delete button to clear the last ball
    document.getElementById("deleteButton").addEventListener("click", function(){
        balls.pop();
    });

    //Click the hide/show button to collapse the top banner
    document.getElementById("hide_show").addEventListener("click", function(){
        if (bannerHidden){
            document.getElementById("header").style.setProperty("display", "block");
            document.getElementById("hide_show").innerHTML = "Hide Instructions";
            bannerHidden = false;
        }
        else{
            document.getElementById("header").style.setProperty("display", "none");
            document.getElementById("hide_show").innerHTML = "Show Instructions";
            bannerHidden = true;
        }
    });

    //Click the slowmo button to slow the interval down
    document.getElementById("slow-mo").addEventListener("click", function(){
        max_speed = false;
        fps = 10;
    });

    //Click the reset speed button to reset the interval
    document.getElementById("regular-speed").addEventListener("click", function(){
        max_speed = false;
        fps = 60;
    });

    //Click the slowmo button to speed the interval up
    document.getElementById("fast-forward").addEventListener("click", function(){
        max_speed = false;
        fps = 240;
    });

    //Click the max speed button to cycle as fast as possible
    document.getElementById("max-speed").addEventListener("click", function(){
        max_speed = true;
    });

    //Initialize the canvas
    canvas = document.getElementById("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.onselectstart = function(){return false;} //prevent clicking from selecting text on document
    context = canvas.getContext("2d");

    //Click the screen to add a ball
    canvas.addEventListener( "click", addBall);

    //Start the main loop
    update();
});

function getMousePos(event) {
    //this gets the mouse position in context to the canvas
    var rect = canvas.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
}

function addBall(event){
    //add a ball where the mouse currently is
    balls.push(new Ball(getMousePos(event).x, getMousePos(event).y));
}

function update(){
    do{
        //clear the screen
        context.clearRect(0, 0, canvas.width, canvas.height);
    
        //update the balls
        stable = true;
    
        balls.forEach(ball => {
            ball.stable = true;
        });
    
        //Logic presented here is transcribed from the C++ source code by Jean Tampon at https://github.com/johnBuffer/NoCol
        for (let i = 0; i < balls.length; i++){
            current_ball = balls[i];
            let to_center = new Vector(canvas.width * 0.5, canvas.height * 0.5);
            to_center.mutable_subtract(current_ball.position);
            to_center.mutable_multiply(ATTRACTION_FORCE);
            current_ball.velocity.mutable_add(to_center);
    
            for (let k = i + 1; k < balls.length; k++){
                collider = balls[k];
                const collide_vec = current_ball.position.subtract(collider.position);
                const dist = Math.sqrt(collide_vec.x*collide_vec.x + collide_vec.y*collide_vec.y);
    
                const minDist = current_ball.r + collider.r;
    
                if (dist < minDist){
                    current_ball.stable = false;
                    collider.stable = false;
    
                    const collide_axe = collide_vec.multiply(1.0 / dist);
    
                    current_ball.position.mutable_add(collide_axe.multiply(0.5 * (minDist - dist)));
                    collider.position.mutable_subtract(collide_axe.multiply(0.5 * (minDist - dist)));
                }
            }
        }
        balls.forEach(function(ball){
            if (ball.stable){
                ball.stableCount++;
            }
            else{
                ball.stableCount = 0;
            }
        });
    
        //check if all balls are stable and stop fastforwarding if so
        let allStable = true;
        for (let i = 0; i < balls.length; i++){
            if (balls[i].stableCount < COUNT_UNTIL_STABLE + EXTRA_COUNT_UNTIL_ALL_STABLE){
                allStable = false;
                break;
            }
        }
        if (max_speed && allStable){
            max_speed = false;
            fps = 60;
        }
    
        //update the balls
        balls.forEach(ball => {
            ball.update();
        });  
    } while(max_speed)

    //display the trails
    balls.forEach(ball => {
        if (ball.history.length > 0){
            for (i = 1; i < ball.history.length; i++){
                context.beginPath();
                context.moveTo(ball.history[i - 1].x, ball.history[i - 1].y);
                context.lineTo(ball.history[i].x, ball.history[i].y); 
                context.strokeStyle = "rgba(" + STABLE_COLOR + "," + i / ball.history.length + ")";
                context.stroke();
            }
        }
    });
    
    //display the balls
    balls.forEach(ball => {
        //after image for slowmo
        if (fps < SLOWMO_FPS && ball.history.length > 0){
            context.fillStyle = ball.color().ghost;
            context.beginPath();
            context.arc(
                ball.history[ball.history.length - 1].x,
                ball.history[ball.history.length - 1].y, 
                ball.r, 0, Math.PI * 2
            );
            context.closePath();
            context.fill();
        }
        context.fillStyle = ball.color().main;
        context.beginPath();
        context.arc(ball.position.x, ball.position.y, ball.r, 0, Math.PI * 2);
        context.closePath();
        context.fill();
    });
    
    //call the next update
    window.setTimeout(update, 1000 / fps);
}