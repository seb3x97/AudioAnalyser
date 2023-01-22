/* CONSTANTES */

//1
const buttontAudio = document.getElementById('buttontAudio');
const MUSIC_URL = "https://raw.githubusercontent.com/seb3x97/AudioAnalyser/main/song/song.mp3";

/**
 * Event quand on appuie sur le bouton
 */
buttontAudio.addEventListener('click', function() {
    //On affiche le cylindre
    showCylinder();
    
    //On instancie l'envoi de la requête
    const xmlHTTP = new XMLHttpRequest();

    //On ouvre la requête en get et spécifie le type de retour
    xmlHTTP.open('GET', MUSIC_URL, true);
    xmlHTTP.responseType = "arraybuffer";

    //Event quand on a reçu toute la requête
    xmlHTTP.onload = function() {
        //On décode l'audio
        actx.decodeAudioData(xmlHTTP.response, function(buffer) {
            //On enlève le truc moche
            inputAudio.parentElement.removeChild(inputAudio);

            //On initialise l'audio
            initAudio(buffer);
        });
    };

    //On lis le fichier
    xmlHTTP.send();
});