const IP_ADDRESS_BULB = '192.168.1.75';
const NOTE_TYPE = 'Note on'; // Note ON
const NOTE_NUMBER = 36; // Kick drum
const MIDI_FILE_PATH = './midi/test.mid'; // Sample MIDI file from Wikipedia https://en.wikipedia.org/wiki/File:MIDI_sample.mid?qsrc=3044

const dgram = require('dgram');
const MidiPlayer = require('midi-player-js');
const client = dgram.createSocket('udp4');
let count = 0;

setupUdpCallbacks();

// Initialize player and register event handler
let Player = new MidiPlayer.Player(function(event) {
    if (event.noteNumber === NOTE_NUMBER && event.name === NOTE_TYPE) {
        count += 1;
        count %= 3;
        let colors = [0, 0, 0];
        colors[count] = 255;

        let msg = getMessageWithColorBrightness(colors[0], colors[1], colors[2], 100);

        client.send(msg, 0, msg.length, 38899, IP_ADDRESS_BULB, function(err, bytes) {
            console.log("sent message");
        });
    }
});

Player.on('endOfFile', function() {
    client.close();
});

// Load a MIDI file
Player.loadFile(MIDI_FILE_PATH);
Player.play();

process.on('SIGINT', function() {
    console.log("Exiting...");
    client.close();
    process.exit();
});


function setupUdpCallbacks() {
    // https://nodejs.org/api/dgram.html#socketbindport-address-callback
    client.on('error', (err) => {
        console.error(`client error:\n${err.stack}`);
        client.close();
    });

    client.on('message', (msg, rinfo) => {
        console.log(`client got: ${msg} from ${rinfo.address}:${rinfo.port}`);
    });

    client.on('listening', () => {
        const address = client.address();
        console.log(`client listening ${address.address}:${address.port}`);
    });

    client.bind(38899);
}

// https://aleksandr.rogozin.us/blog/2021/8/13/hacking-philips-wiz-lights-via-command-line
function getMessageWithColorBrightness(r, g, b, dimming) {
    // let msg = `{"id":1,"method":"setState","params":{"state":true}}`;
    let msg = {
        "id":1,
        "method": "setPilot",
        "params": {
            "r": r,
            "g": g,
            "b": b,
            "dimming": dimming
        }
    };
    return JSON.stringify(msg);
}
