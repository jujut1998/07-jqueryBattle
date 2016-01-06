// Key codes
var CODES = {
  37: 'left',
  32: 'up',
  39: 'right',
  40: 'down'
};

// Input state
var pressed = {
  left: false,
  up: false,
  right: false,
  down: false
};

// Game configuration
var cfg = {
  fps: 60,
  width: 640,
  height: 480,
  isGameOver: false
};

var $container = $('#container');

// Game entities
var player;
var enemies = [];
var bullets = [];

function Player (x, y) {
  this.position = {
    x: x,
    y: y
  };
  this.velocity = {
    x: 0,
    y: 0
  };
  this.speed = 5;
  this.health = 10;
  this.width = 50;
  this.height = 50;
  this.timeSinceLastShot = 0;
  this.timeSinceLastDamaged = 0;
  this.element = $('<div class="player">').appendTo($container);
}

function Enemy (x, y) {
  this.position = {
    x: x,
    y: y
  };
  this.velocity = {
    x: 0,
    y: 0
  };
  this.health = 1;
  this.width = 50;
  this.height = 50;
  this.element = $('<div class="enemy">').appendTo($container);
  this.isAttacking = false;
  this.timeWhenAttackStarted = 0;
}

function Bullet (x, y) {
  this.position = {
    x: x,
    y: y
  };
  this.velocity = {
    x: 0,
    y: 10
  };
  this.health = 1;
  this.width = 5;
  this.height = 20;
  this.element = $('<div class="bullet">').appendTo($container);
}

function setup () {
  // Reset state
  $container.empty();
  player = new Player(320, 50);
  enemies = [];
  bullets = [];

  // Spawn enemies
  enemies.push(new Enemy(100, 360));
  enemies.push(new Enemy(210, 360));
  enemies.push(new Enemy(320, 360));
  enemies.push(new Enemy(430, 360));
  enemies.push(new Enemy(540, 360));
}

// Game logic
function update () {

  // Spawn bullet
  var currentTime = Date.now();
  var bulletDelay = 100;
  if (pressed.up && currentTime - player.timeSinceLastShot > bulletDelay) {
    bullets.push(new Bullet(player.position.x, player.position.y + player.height));
    player.timeSinceLastShot = currentTime;
  }

  // Left-right movement
  if (pressed.left) {
    player.velocity.x = -player.speed;
  } else if (pressed.right) {
    player.velocity.x = player.speed;
  } else {
    player.velocity.x = 0;
  }

  // Enemy attack movement
  if (enemies.length) {
    runEnemyAI(enemies);
  }

  // Amazing physics simulation
  var entities = [player].concat(enemies, bullets);
  entities.forEach(function(entity) {
    entity.position.x += entity.velocity.x;
    entity.position.y += entity.velocity.y;
  });


  // TODO: Collision detection & health adjustment
  for (var i=0; i < bullets.length; i++) {
    var bullet = bullets[i];
    for (var j = 0; j < enemies.length; j++) {
      var enemy = enemies[j];
      if (isColliding(bullet, enemy)) {
        enemy.health--;
        bullet.health--;
        break;
      }
    }
  }
  
  var stunTime = 500;
  if (currentTime - player.timeSinceLastDamaged > stunTime) {
    for (var i=0; i < enemies.length; i++) {
      var enemy = enemies[i];
      if(isColliding(enemy, player)) {
        player.health--;
      }
    }
  }

  // Player bounds checking
  if (player.position.x < 0) {
    player.position.x = 0;
  } else if (player.position.x > cfg.width) {
    player.position.x = cfg.width;
  }
  // Bullet bounds/health checking
  
  for (var i = bullets.length - 1; i >= 0; i--) {
    var bullet = bullets[i];
    // Remove bullet if dead or out of bounds
    if (bullet.health <= 0 || bullet.position.y > cfg.height + bullet.height) {
      bullet.element.remove();
      bullets.splice(i, 1);
    }
  }
  var stunTime = 500;
  // if (currentTime - player.timeSinceLastDamaged > stunTime) {

  // Enemy health checking
  for (var j = enemies.length - 1; j >= 0; j--) {
    var enemy = enemies[j];
    if (enemy.health <= 0) {
      enemy.element.remove();
      enemies.splice(j, 1);
    }
  }
  // TODO: Lose condition (i.e. if player is dead)
  if (!cfg.isGameOver && player.health <= 0) {
    player.element.remove();
    cfg.isGameOver = true;
    alert('YOU LOSE!!!');
  }
  // TODO: Win condition (i.e. if all enemies are dead)
  if (!cfg.isGameOver && enemies.length === 0) {
    cfg.isGameOver = true;
    alert('YOU WIN!!!');
  }
  
}
function isColliding (e1, e2) {
    var e1left = e1.position.x - e1.width/2;
    var e1right = e1.position.x + e1.width/2;
    var e1top = e1.position.y + e1.height/2;
    var e1bottom = e1.position.y - e1.height/2;
    
    var e2left = e2.position.x - e2.width/2;
    var e2right = e2.position.x + e2.width/2;
    var e2top = e2.position.y + e2.height/2;
    var e2bottom = e2.position.y - e2.height/2;
  
    return !(
      e1bottom > e2top ||
      e1top < e2bottom ||
      e1left > e2right ||
      e1right < e2left
    );
}

// Enemy attack movement
function runEnemyAI (enemies) {
  var attackingEnemy;
  // Find enemy that is currently attacking
  enemies.forEach(function (enemy) {
    if (enemy.isAttacking) {
      attackingEnemy = enemy;
    }
  });
  // Choose 1 enemy to attack the player, if none currently are
  if (!attackingEnemy) {
    attackingEnemy = enemies[Math.floor(Math.random() * enemies.length)];
    attackingEnemy.isAttacking = true;
    attackingEnemy.timeWhenAttackStarted = Date.now();
  }

  var attackTime = Date.now() - attackingEnemy.timeWhenAttackStarted;
  var epsilon = 0.3;
  if (attackTime/540 > 2*Math.PI - epsilon) {
    attackingEnemy.isAttacking = false;
    attackingEnemy.velocity.x = 0;
    attackingEnemy.velocity.y = 0;
    return;
  }
  attackingEnemy.velocity.x = Math.sin(attackTime/180) * 5;
  attackingEnemy.velocity.y = -Math.sin(attackTime/540)* 5;
}

// Rendering logic
function draw () {
  $container.width(cfg.width);
  $container.height(cfg.height);

  var entities = [player].concat(enemies, bullets);
  entities.forEach(function (entity) {

    entity.element.css({
      height: entity.height,
      width: entity.width,
      left: entity.position.x,
      bottom: entity.position.y
    });
  });
}


// Input handling
$(document).bind('keydown keyup', function (evt) {
  var direction = CODES[evt.which];

  if (evt.type === 'keydown') {
    pressed[direction] = true;
  } else {
    pressed[direction] = false;
  }
});

setup();

// Kick off the game loop
setInterval(function () {
  update();
  draw();
}, 1000/cfg.fps);
