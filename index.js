//#region /-----Datas-------/

/* CONSTANTES */

/**
 * Couleurs
 */
const COLORS = {
    //Points
    POINT: "#0049bd",
    RANDOM: false,
};

/**
 * Values
 */
const VALUES = {
    //Calcul
    PI_TWO: Math.PI * 2,           //(PI * 2) est utilisé pour calculer la surface du cercle

    //Points
    POINTS_NB: 2048,   			//Nombre de points (doit être inférieur ou égual à 'FFTSIZE')
    POINTS_RADIUS: 4, 		    //Taille des points (rayon)

    //Données
    SPHERE_SPEED: 0.010,    //Vitesse de la rotation

    //Global
    AUDIO_CONTEXT: (AudioContext || window.AudioContext || window.webkitAudioContext),              //On récupére l'audioContext (dépends du navigateur)
    FREQUENCY_HIGHT_POINT: 5,       //Point où l'on concidère que la fréquence est haute
    FFTSIZE: 2048,                  //Influe sur le nombre de donnéese reçues. Doit être une puissance de 2 non nulle située dans l'intervalle compris entre 32 et 32768. Valeur par défaut est [2048] (https://developer.mozilla.org/fr/docs/Web/API/AnalyserNode/fftSize)
};

//1
const canvas = document.getElementById('canvas');
const parent = canvas.parentElement;
const ctx = canvas.getContext('2d');
const actx = new VALUES.AUDIO_CONTEXT();

//2
const analyser = actx.createAnalyser();           //Element pour l'analyse
const gainNode = actx.createGain();               //Element pour le volume

//3
const VOLUME = 0.5;

/* VARIABLES */

//1
let w = 0;          //Largeur du canvas
let h = 0;          //Hauteur du canvas
let dx = 0;         //Largeur / 2 du canvas
let dy = 0;         //Hauteur / 2 du canvas

//2
let playing = false;                //Si on est entrain de jouer de la musique

//3
let frequencyDatas = null;           //Tableau des fréquence de la musique
let bufferSource = null;            //Ce qui va nous permettre de jouer de la musique
let audioBuffer = null;             //Tableau qui contient notre musique
let avg = null;                     //On récupére la moyenne de la fréquence

//4
let startedAt = null;               //Temps quand on a commencé
let pausedAt = null;                //Temps quand on a fait une pause

//#endregion

//#region /-----Events------/

//1
window.onresize = onResizeEvent;          //Event quand on redimensionne la fenêtre

/**
 * Quand on redimensionne la fenêtre
 */
function onResizeEvent() {
    //On change les valeurs (widht, height, moitié de width et moitié de height)
    w = parent.offsetWidth;
    h = parent.offsetHeight;
    dx = w / 2;
    dy = h / 2;

    //On redimensionne le canvas
    ctx.canvas.width = w;
    ctx.canvas.height = h;

    //On clear le canvas
    clearCanvas();

    //On redimensionne la sphère
    Sphere.getInstance().resize();
};
//#endregion

//#region /-----Utils-------/

/**
* On récupére la moyenne des valeurs d'un array
* @param {*} array array
* @returns Retourne la moyenne d'un array
*/
function average(array) {
    return array.reduce((a, b) => a + b) / array.length;
};

/**
 * On affiche le cylindre
 */
function showCylinder() {
    document.getElementById("menu").classList.remove('active');
    document.getElementById("content").classList.add('active');
};
//#endregion

//#region /-----Function----/

/**
 * Animate
 * @returns
 */
function animate() {
    //Si on n'est pas entrain de jouer de la musique
    if (!playing) return;

    //RequestAnimation
    window.requestAnimationFrame(animate);

    //On récupére les fréquences de la musique au tick actuel
    analyser.getByteFrequencyData(frequencyDatas);

    //On récupére la moyenne de la fréquence
    avg = average([].slice.call(frequencyDatas)) * gainNode.gain.value;

    //On clear le canvas
    clearCanvas();

    //On redessine la sphere
    Sphere.getInstance().draw();
};

/**
 * On clear le canvas
 */
function clearCanvas() {
    //On clear le rectangle
    ctx.clearRect(0, 0, w, h);
};

/**
* On toggle l'audio
*/
function toggleAudio() {
    //On change le playing
    playing = !playing;

    //On toggle l'audio
    playing ? playAudio() : pauseAudio()
};

/**
* On joue l'audio
*/
function playAudio() {
    //On affiche le statut
    document.title = "🔊";

    //On récupére le temps du démarrage
    startedAt = pausedAt ? Date.now() - pausedAt : Date.now();

    //On crée le bufferSource et on le configure
    bufferSource = actx.createBufferSource();
    bufferSource.buffer = audioBuffer;
    bufferSource.loop = true;
    bufferSource.connect(gainNode);

    //Event quand on a fini la musique
    bufferSource.onended = function () {
        //Si on n'est pas entreint de jouer de la musique
        if (!playing) return;

        //On passe le playing en false
        playing = false;
        pausedAt = null;
    }

    //Si pausAt existe on redémarre par rapport au temps passé sinon on relance
    pausedAt ? bufferSource.start(0, pausedAt / 1000) : bufferSource.start();

    //On lance l'annimation
    animate();
};

/**
* On mets l'audio en pause
*/
function pauseAudio() {
    //Si il n'y a pas de bufferSource
    if (bufferSource == null) return;

    //On affiche le statut
    document.title = "🔇";

    //On calcul la pausee
    pausedAt = Date.now() - startedAt;

    //On stop la musique
    bufferSource.stop();
};

/**
 * On initialise l'audio
 */
function initAudio(buffer) {
    //On resize
    onResizeEvent();
    
    //On enregistre l'audio buffer (les données de la musique)
    audioBuffer = buffer;

    //Settings de l'analyser
    analyser.fftSize = VALUES.FFTSIZE;
    analyser.minDecibels = -100;
    analyser.maxDecibels = -30;
    analyser.smoothingTimeConstant = 0.8;

    //On change le volume et on connecte les machines
    gainNode.gain.value = VOLUME;
    gainNode.connect(analyser);
    analyser.connect(actx.destination);

    //On enregistre le tableau de données
    frequencyDatas = new Uint8Array(analyser.frequencyBinCount);

    //On génére les elements
    Sphere.getInstance().generate();

    //On ajoute un envent click sur le canvas
    ctx.canvas.onclick = toggleAudio;

    //On lance l'audio
    toggleAudio();
};
//#endregion

//#region /-----Class-------/

/**
 * Class Vertex3D
 */
class Vertex3D {
    /**
     * Constructeur renseigné
     * @param {*} x Position en x
     * @param {*} y Position en y
     * @param {*} z Position en z
     */
    constructor(x, y, z) {
        //On enregistre
        this.x = parseFloat(x);
        this.y = parseFloat(y);
        this.z = parseFloat(z);
    };
};

/**
 * Sphere
 */
class Sphere {
    /**
     * Constructeur par défaut
     */
    constructor() {
        //On enregistre
        this.rotation = 0;                    //Rotation de la sphere
        this.points = [];                     //Points que contient la sphere
    };

    /**
     * On récupére l'instance de la sphere
     */
    static getInstance() {
        //On retourne l'instance
        if(this._instance == undefined) this._instance = new Sphere();
        return this._instance;
    }

    /**
     * On génére les points sur la sphere
     */
    generate() {
        //On boucle le nombre de points voulu pour les créer
        for (let i = 0; i < VALUES.POINTS_NB; i++) {
            //On ajoute le point
            this.points.push(new Point(this, i));
        };
    };

    /**
     * On redimentione la sphere
     */
    resize() {
        //On calcul le radius
        this.radius = (Math.min(w, h) / 2);

        //On calcul la différence de taille entre les points de devant et de derrière
        this.scaleDiff = w / (w / 300);

        //On dessine
        this.draw();
    };

    /**
     * On la shpère
     */
    draw() {
        //On modifie la rotation
        this.rotation += VALUES.SPHERE_SPEED;

        //Si on a fait un tour complet on reset la rotation
        if (this.rotation > VALUES.PI_TWO) this.rotation = VALUES.SPHERE_SPEED;

        //On calcul le sinus et le cosinus de la rotation
        const sin = Math.sin(this.rotation);
        const cos = Math.cos(this.rotation);

        //On boucle les points pour les dessiner
        this.points.forEach(el => {
            el.draw(sin, cos);
        });
    };
};

/**
 * Class Point
 */
class Point {
    /**
     * Constructeur Renseigné
     * @param {*} sphere Instance de la sphere
     * @param {*} index Index du point dans la liste des points
     */
    constructor(sphere, index) {
        //On enregistre
        this.sphere = sphere;
        this.index = index;
        this.color = COLORS.RANDOM ? `#${Math.floor(Math.random()*16777215).toString(16)}` : COLORS.POINT;

        //On génére une position (radian) random dans la sphère (azimuthal angle) (sortie [0°, 360°])
        const p = Math.random() * VALUES.PI_TWO;

        //On génére une position (radian) random dans la sphère (l'angle polar) (acos entré [-1, 1] sortie [0, π] soit [0°, 180°])
        const o = Math.acos((Math.random() * 2) - 1);

        //On crée la position du point sur la sphere (sans le rayon donc actuellement les points sont collés au centre) (https://en.wikipedia.org/wiki/Spherical_coordinate_system#Coordinate_system_conversions)
        const pos = new Vertex3D(
            Math.cos(p) * Math.sin(o),    //x
            Math.sin(p) * Math.sin(o),    //y
            Math.cos(o)                   //z
        );

        //On enregistre la position
        this.position = pos;
    }
    /**
     * On dessine le point sur le canvas
     * @param {*} sin Sinus de l'angle (rotation)
     * @param {*} cos Cosinus de l'angle (rotation)
     */
    draw(sin, cos) {
        //On calcul le rayon avec la fréquence
        const radius = this.sphere.radius + (frequencyDatas[this.index] / VALUES.FREQUENCY_HIGHT_POINT);

        //On ajoute le rayon aux points pour les "décoler" du centre
        const x = this.position.x * radius;
        const y = this.position.y * radius;
        const z = this.position.z * radius;

        //On calcul la 3d
        const rotX = x * cos + z * sin;
        const rotZ = x * -sin + z * cos - this.sphere.radius;

        //On calcul le scale
        const scale = this.sphere.scaleDiff / (this.sphere.scaleDiff - rotZ);

        //On calcul la position en x
        const posX = rotX * scale + dx;

        //On calcul la position en y
        const posY = y * scale + dy;

        //On dessine le point sur la canvas
        ctx.beginPath();
        ctx.arc(posX, posY, VALUES.POINTS_RADIUS * scale, 0, VALUES.PI_TWO);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
    }
};
//#endregion