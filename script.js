var canvas = document.getElementById("renderCanvas");


if (BABYLON.Engine.isSupported()) {
	var engine = new BABYLON.Engine(canvas, true);
	var scene = new BABYLON.Scene(engine);

	var skeleton;
	var obstacle;

	// Music
	var backgroundMusic = new BABYLON.Sound("BackgroundMusic", "sounds/background.mp3", scene, null, { loop: true, autoplay: true, volume: 0.2 });

	// Camera
	var camera = new BABYLON.FreeCamera("FreeCamera", new BABYLON.Vector3(0, 5, -50), scene);
	camera.rotation.y = Math.PI;
	camera.attachControl(canvas, true);
	camera.speed = 1.0;
	scene.activeCamera.keysUp.push(87); // W
	scene.activeCamera.keysLeft.push(65); // A 
	scene.activeCamera.keysDown.push(83); // S 
	scene.activeCamera.keysRight.push(68); // D 

	// Gravity & Collisions
	scene.gravity = new BABYLON.Vector3(0, -9.81, 0);
	camera.applyGravity = true; 
	//Set the ellipsoid around the camera (e.g. your player's size)
	camera.ellipsoid = new BABYLON.Vector3(0.5, 2.5, 0.5);
	// Enable Collisions
	scene.collisionsEnabled = true;
	camera.checkCollisions = true;

	// Light
	var light = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);
	light.diffuse = new BABYLON.Color3(1, 1, 1);
	light.specular = new BABYLON.Color3(1, 1, 1);
	light.groundColor = new BABYLON.Color3(0, 0, 0);

	// Skybox
	var skybox = BABYLON.Mesh.CreateBox("skyBox", 500.0, scene);
	skybox.infiniteDistance = true;
	var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
	skyboxMaterial.backFaceCulling = false;
	skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("textures/TropicalSunnyDay", scene);
	skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
		skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
	skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
	skyboxMaterial.disableLighting = true;
	skybox.material = skyboxMaterial;

	// Ground
	var ground = BABYLON.Mesh.CreateGround("ground", 2000, 2000, 1, scene);
	var materialGround = new BABYLON.StandardMaterial("textureGround", scene);
	materialGround.diffuseTexture = new BABYLON.Texture("grass.jpg", scene);
	materialGround.diffuseTexture.uScale = 120.0;
	materialGround.diffuseTexture.vScale = 120.0;
	materialGround.backFaceCulling = false;	
	ground.material = materialGround;
	ground.checkCollisions = true;

	// Tree
	// The function ImportMesh will import our custom model in the scene given in parameter
	BABYLON.SceneLoader.ImportMesh("", "assets/", "tree.babylon", scene, function (newMeshes) {
		var tree = newMeshes[0]; 
		tree.material = new BABYLON.StandardMaterial("tree", scene);
		tree.scaling = new BABYLON.Vector3(0.15, 0.15, 0.15);
		tree.position.x = -15.0;
	});

	// River
	var river = BABYLON.Mesh.CreateGround("river", 2000.0, 50.0, 1, scene);
	river.position.z = 30.0;
	var water = new BABYLON.WaterMaterial("water", scene);
	water.backFaceCulling = false;
	water.bumpTexture = new BABYLON.Texture("materialsLibrary/test/textures/waterbump.png", scene);
	water.windForce = 3;
	water.waveLength = 5.0;
	water.addToRenderList(skybox);
	river.material = water;

	// Sound
	var riverSound = new BABYLON.Sound("RiverSound", "sounds/river.wav", scene, null, { loop: true, autoplay: true });
	riverSound.attachToMesh(river);

	// You can't go over the river
	obstacle = BABYLON.Mesh.CreateBox("obstacle", 6.0, scene);
	obstacle.scaling = new BABYLON.Vector3(333.0, 2.0, 1.0);
	obstacle.position.y = 1.0;
	obstacle.position.z = 9.0; 
	var obstacleMaterial = new BABYLON.StandardMaterial("texture1", scene);
	obstacleMaterial.alpha = 0.0;
	obstacle.material = obstacleMaterial;
	obstacle.checkCollisions = true;

	// Skeleton
	BABYLON.SceneLoader.ImportMesh("", "assets/", "skeleton.babylon", scene, function (newMeshes) {
		skeleton = newMeshes[0]; 
		skeleton.material = new BABYLON.StandardMaterial("skeleton", scene);
		skeleton.position.x = -15.0;
		skeleton.position.z = -5.0;
		skeleton.actionManager = new BABYLON.ActionManager(scene);
		skeleton.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function() {
			document.getElementById("instructions").innerHTML = "Izberi pravo orožje!";

			document.getElementById("weapons").className = "";
			document.getElementById("weapons").innerHTML = '<ul><li><a onclick="onLose()"><img src="textures/weapons/violin.png" /></a></li><li><a onclick="onLose()"><img src="textures/weapons/chair.png" /></a></li><li><a onclick="onLose()"><img src="textures/weapons/gun.png" /></a></li><li><a onclick="rope()"><img src="textures/weapons/rope.png" /></a></li></ul>';
		}));
	});

	// Book
	BABYLON.SceneLoader.ImportMesh("", "assets/", "book.babylon", scene, function (newMeshes) {
		book = newMeshes[0]; 
		book.position.x = 100.0;
		book.position.z = -50.0;
		book.actionManager = new BABYLON.ActionManager(scene);
		book.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function() {
			open();
		}));
	});

	// Smrtnjak
	var smrtnjak;
	BABYLON.SceneLoader.ImportMesh("", "assets/", "skeleton2.babylon", scene, function (newMeshes) {
		smrtnjak = newMeshes[0]; 
		smrtnjak.position.z = 80.0;
		smrtnjak.position.y = 5.0;
		smrtnjak.rotation.y = 0.35;
		smrtnjak.actionManager = new BABYLON.ActionManager(scene);
		smrtnjak.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function() {
			document.getElementById("instructions").innerHTML = "Če želiš nadaljevati svojo pot, me moraš premagati. Ko boš pripravljen, pritisni na enter. Boriš se s preslednico.";
		}));
	});

	var life = 10;
	var hits = 10;
	var fightStarted = false;
	var smrtnjakHits;
	window.addEventListener("keydown", function(evt) {
		if(evt.keyCode === 13) {
			fightStarted = true;
			smrtnjakHits = setInterval(function(){ 
				life--; 
				if(life <= 0) {
					onLose();
				} else {
					document.getElementById("hit").className = "";
					document.getElementById("lives").className = "";
					document.getElementById("lives").innerHTML = "Število življenj<br>Smrtnjak: " + hits + "<br>Kurent: " + life;
				}
			}, 300);
		}
		if(evt.keyCode === 32 && fightStarted === true) {
			hits--;
			document.getElementById("hit").className = "hidden";
			if(hits <= 0) {
				document.getElementById("instructions").innerHTML = "Smrtnjak je premagan!";
				document.getElementById("lives").className = "hidden";
				smrtnjak.dispose();
				clearInterval(smrtnjakHits);
				win();
			}
		}
	});

	// Rabbit
	var rabbit = function () {
		BABYLON.SceneLoader.ImportMesh("", "assets/", "rabbit.babylon", scene, function (newMeshes) {
			var rabbit = newMeshes[0]; 
			rabbit.position.z = -90.0;
			rabbit.position.x = -40.0;
		    var hop = true;
		    var frame = 0;
		    scene.registerBeforeRender(function () {
			    if(frame >= 60) {
			    	rabbit.position.x += 0.5;
			    	if(hop === true) {
			    		rabbit.position.y += 0.3;
			    		if(frame >= 62) {
			    			hop = false;
			    		}
			    	}  else {
			    		rabbit.position.y -= 0.3;
			    		if(frame >= 65) {
			    			hop = true;
			    			frame = 0;
			    		}
			    	}
			    }
		    	frame++;
		    });
		});
	}

	// Register a render loop to repeatedly render the scene
	engine.runRenderLoop(function () {
		scene.render();
	});

	// Start Again
	document.getElementById("gameOver").addEventListener("click", function() {
		location.reload();
	});

	var win = function () {
		document.getElementById("win").className = "";
	    document.getElementById("instructions").className = "hidden";
	    document.getElementById("weapons").className = "hidden";
	    document.getElementById("lives").className = "hidden";
	    clearInterval(smrtnjakHits);
	    clearTimeout(t); 
	    document.getElementById("winText").innerHTML = "Čestitke za zmago! Čas -  " + (hours ? (hours > 9 ? hours : "0" + hours) : "00") + ":" + (minutes ? (minutes > 9 ? minutes : "0" + minutes) : "00") + ":" + (seconds > 9 ? seconds : "0" + seconds);
		document.getElementById("time").className = "hidden";
	}

	// Game Over
	var onLose = function () {
	    document.getElementById("gameOver").className = "";
	    document.getElementById("instructions").className = "hidden";
	    document.getElementById("weapons").className = "hidden";
	    document.getElementById("lives").className = "hidden";
	    backgroundMusic.stop();
	    var sound = new BABYLON.Sound("Loss", "sounds/loss.mp3", scene, null, { loop: false, autoplay: true, volume: 0.2 });
	    clearInterval(smrtnjakHits);
	    clearTimeout(t); 
	    document.getElementById("gameOverText").innerHTML = "Konec igre! Čas -  " + (hours ? (hours > 9 ? hours : "0" + hours) : "00") + ":" + (minutes ? (minutes > 9 ? minutes : "0" + minutes) : "00") + ":" + (seconds > 9 ? seconds : "0" + seconds) + "<br>Klikni za ponovno igranje.";
		document.getElementById("time").className = "hidden";
	};

	// Close the book
	document.getElementById("bookInstructions").addEventListener("click", function() {
	    document.getElementById("bookInstructions").className = "hidden";
	    document.getElementById("instructions").className = "";
	    document.getElementById("instructions").innerHTML = "Sedaj poišči Smrt ob drevesu in klikni nanjo.";
	});

	// Open the Book
	var open = function () {
	    document.getElementById("bookInstructions").className = "";
	    document.getElementById("instructions").className = "hidden";
	};

	var rope = function () {
		document.getElementById("weapons").className = "hidden";	
		document.getElementById("instructions").innerHTML = "Fantastično! Zvezal si Smrt na drevo, zato lahko sedaj nadaljuješ pot preko reke. Vendar pozor! Na drugi strani reke te čaka Smrtnjak. Ko ga zagledaš, klikni nanj.";
		skeleton.position.y = 5.0;
		skeleton.position.z = -2.0;
		skeleton.rotation.y = 0.5;
		obstacle.checkCollisions = false;
		document.getElementById("lives").className = "";
	};

	window.addEventListener("resize", function () {
		engine.resize();
	});
};