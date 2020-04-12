window.onload = function() {
  var game = new Phaser.Game(960, 770, Phaser.AUTO, "", {
    preload: preload,
    create: create,
    update: update
  });
  var background;
  var map;
  var player;
  var NPC;
  var cage;
  var layer;
  var layer2;
  var cageKey;
  var cursors;
  var keyUpPressed;
  var keyRightPressed;
  var healthBar;
  var hurtSound;
  var talkSound;
  var intro;
  var jumpSound;
  var pickupSound;
  var healthOld;
  var cropRect;
  var collisionNow = false;
  var collideKey = true;
  var wasCollision = false;
  var npcCollideNow = false;
  /**
   * This loads the assets in the game before adding them in the game.
   * The images and audio are borrowed from opengameart.org and freesound.
   */
  function preload() {
    game.load.image("Ledges(Trial)", "/assets/Images/Ledges.png");
    game.load.image("background", "/assets/images/Background.png");
    game.load.spritesheet("player1", "/assets/Images/dude.png", 32, 48);
    game.load.spritesheet("player2", "/assets/Images/dudette.png", 32, 48);
    game.load.image("key", "/assets/Images/key.png", 12, 14);
    game.load.spritesheet("cage", "/assets/Images/Cage.png", 34, 31);
    game.load.image("restart", "/assets/Images/Button.png");
    game.load.tilemap("map", "js/Map.json", null, Phaser.Tilemap.TILED_JSON);
    game.load.image("hbImage", "/assets/Images/HB.png");
    game.load.audio("hurt", "/assets/Sounds/damage_sound.wav");
    game.load.audio("dialogue", "/assets/Sounds/talking_sound.wav");
    game.load.audio("IntroMusic", "/assets/Sounds/Intro_sound.wav");
    game.load.audio("jump", "/assets/Sounds/jump_sound.wav");
    game.load.audio("pickup", "/assets/Sounds/pickup_sound.wav");
    game.load.spritesheet(
      "upkey",
      "/assets/Images/Key_up_animation.png",
      48,
      42
    );
    game.load.spritesheet(
      "rightkey",
      "/assets/Images/Key_right_animation.png",
      48,
      40
    );
    game.load.spritesheet(
      "leftkey",
      "/assets/Images/Key_left_animation.png",
      48,
      39
    );
  }
  /**
   * This adds background, map, platforms to collide, player, NPC, cage (which hold the NPC), damaging layers to collide, text on win condition, audio for relevant movements and background, health + max-health of player and the events to perform when player gets killed.
   * The cursor keys are enabled.
   * A healthbar was created using image whose width will be resized depending on the player's current health.
   */
  function create() {
    background = game.add.image(0, 0, "background");
    map = game.add.tilemap("map", 64, 64, 32, 32);
    map.addTilesetImage("Ledges(Trial)");
    layer = map.createLayer("collide");
    layer2 = map.createLayer("damage");
    layer.resizeWorld();
    game.add.text(220, 20, "Mission: Rescue the princess!");
    hurtSound = game.add.audio("hurt");
    intro = game.add.audio("IntroMusic");
    talkSound = game.add.audio("dialogue");
    jumpSound = game.add.audio("jump");
    pickupSound = game.add.audio("pickup");
    cursors = game.input.keyboard.createCursorKeys();

    player = game.add.sprite(0, 600, "player1", 4);

    keyUpPressed = game.add.sprite(800, 50, "upkey", 1);
    keyRightPressed = game.add.sprite(840, 90, "rightkey", 1);
    keyLeftPressed = game.add.sprite(760, 90, "leftkey", 1);

    NPC = game.add.sprite(0, 140, "player2", 1);
    cageKey = game.add.sprite(290, 100, "key");
    player.health = 4;
    maxHealth = 4;
    healthOld = maxHealth;
    player.events.onKilled.add(playerDied);
    healthBar = this.game.add.sprite(10, 10, "hbImage");
    intro.loop = true;
    intro.play();
    intro.volume = 0.15;
    cropRect = new Phaser.Rectangle(0, 0, healthBar.width, healthBar.height);
    healthBar.crop(cropRect);

    cage = game.add.sprite(0, 145, "cage", 1);
    cage.scale = new PIXI.Point(1.35, 1.5);
    /**
     * The events on player's death are triggered here.
     * Clicking on restart button resets the game.
     */
    function playerDied() {
      game.add.text(285, 358, "Game Over", {
        fontSize: "60px",
        fill: "black",
        fontStyle: "bold",
        font: "Century Gothic"
      });
      button = game.add.button(450, 420, "restart", whenPressed, this, 2, 1, 0);
      intro.stop();
      function whenPressed() {
        game.state.restart(game);
      }
    }
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.arcade.gravity.set(0, 300);
    game.physics.arcade.enable(player);
    game.physics.arcade.enable(NPC);
    game.physics.arcade.enable(cageKey);
    game.physics.arcade.enable(cage);

    player.body.bounce.y = 0.2;
    player.body.collideWorldBounds = true;
    NPC.body.bounce.y = 0.2;
    NPC.body.collideWorldBounds = true;
    cageKey.body.bounce.y = 0.5;
    cageKey.body.collideWorldBounds = true;
    cage.body.collideWorldBounds = true;
    cage.body.immovable = true;

    map.setCollisionBetween(1, 7, true, "collide");
    map.setCollision(1, true, "damage");

    player.animations.add("left", [0, 1, 2, 3], 10, true);
    player.animations.add("turn", [4], 20, false);
    player.animations.add("right", [5, 6, 7, 8], 10, true);

    keyUpPressed.animations.add("upArrow", [0, 1], 2, false);
    keyRightPressed.animations.add("rightArrow", [0, 1], 3, false);
    keyLeftPressed.animations.add("leftArrow", [0, 1], 3, false);
  }
  /**
   * Where relevant, collision are added (player to layer(s), NPC to layer(s) and the layer(s) to cage and its Key)
   */
  function update() {
    game.physics.arcade.collide(player, layer);
    game.physics.arcade.collide(NPC, layer);
    game.physics.arcade.collide(layer2, cageKey);
    game.physics.arcade.collide(layer, cage);

    collision();

    movement();

    cropRect.width = healthBar.width * (player.health / healthOld);

    healthBar.updateCrop();

    healthOld = player.health;
  }
  /**
   * The player's movement is triggered using keys and if statement on pressing left, right and up arrow keys.
   */
  function movement() {
    if (cursors.left.isDown) {
      player.body.velocity.x = -150;
      keyLeftPressed.animations.play("leftArrow");
    }
    if (cursors.right.isDown) {
      player.body.velocity.x = 150;
      keyRightPressed.animations.play("rightArrow");
    }

    if (player.body.velocity.x > 0) {
      player.animations.play("right");
    } else if (player.body.velocity.x < 0) {
      player.animations.play("left");
    } else {
      player.animations.play("turn");
    }
    if (cursors.up.isDown && player.body.onFloor()) {
      player.body.velocity.y = -290;
      keyUpPressed.animations.play("upArrow");
      jumpSound.play();
      jumpSound.volume = 0.15;
    }
  }
  /**
   * The collision conditions are defined here.
   */
  function collision() {
    collisionNow = game.physics.arcade.collide(player, layer2);
    npcCollideNow = game.physics.arcade.collide(player, NPC);
    collideKey = game.physics.arcade.collide(player, cageKey);
    cageCollide = game.physics.arcade.collide(player, cage);
    player.body.velocity.x = 0;

    if (npcCollideNow == true) {
      game.add.text(30, 90, "Thank you for rescuing me!", {
        fontSize: "30px",
        fill: "black",
        font: "Century Gothic"
      });
      talkSound.play();
      button = game.add.button(450, 420, "restart", whenPressed, this, 2, 1, 0);
      intro.stop();
      function whenPressed() {
        game.state.restart(game);
      }
    }

    if (collideKey == true) {
      game.add.text(290, 120, "Key Collected", {
        fontSize: "30px",
        fill: "black",
        font: "Century Gothic"
      });
      pickupSound.play();
      pickupSound.volume = 0.15;
      cage.kill();
      cageKey.kill();
    }
    if (collisionNow == true && wasCollision == false) {
      player.damage(1);
      hurtSound.play();
      hurtSound.volume = 0.15;
      game.camera.flash(0xf45642, 300, true, 1);
    }
  }
};
