var U_MAX = 18;
var V_MAX = 22;
var ID_MAX = 15;
var tablePieceInput = new Array(U_MAX).fill(new Array(V_MAX).fill(new Array(2)));
// Arraylist for storing table input values for each previous turns
var tableHistory = new Array();
var portIN = 6152;
// import hypermedia.net.*;
var udp;  // define the UDP object
var connection = false;
var busyImporting = false;
var changeDetected = false;
var outputReady = false;

function initInputData() {
  for (var u=0; u<U_MAX; u++) {
    for (var v=0; v<V_MAX; v++) {
      tablePieceInput[u][v][0] = -1; // ID
      tablePieceInput[u][v][1] = 0; //Rotation
    }
  }
}

function initUDP() {
  udp = new UDP( this, portIN );
  // udp.log( true );     // <-- printout the connection activity
  udp.listen( true );
  
  // Initialize tablePieceInput
  initInputData();
}

function ImportData(inputStr) {
  if (inputStr[0].equals("COLORTIZER")) {
    if (!connection) connection = true;
    parseColortizerStrings(inputStr);
  } 
  busyImporting = false;
}

function parseColortizerStrings(data) {

  for (var i=0 ; i<data.length;i++) {

    var split = split(data[i], "\t");

    // Checks maximum possible ID value
    if (split.length == 2 && split[0].equals("IDMax")) {
      ID_MAX = int(split[1]);
    }

    // Checks if row format is compatible with piece recognition.  3 columns for ID, U, V; 4 columns for ID, U, V, rotation
    if (split.length == 3 || split.length == 4) {

      //Finds UV values of Lego Grid:
      var u_temp = int(split[1]);
      var v_temp = tablePieceInput.length - int(split[2]) - 1;

      if (split.length == 3 && !split[0].equals("gridExtents")) { // If 3 columns

        // detects if different from previous value
        if ( v_temp < tablePieceInput.length && u_temp < tablePieceInput[0].length ) {
          if ( tablePieceInput[v_temp][u_temp][0] != int(split[0]) ) {
            // Sets ID
            tablePieceInput[v_temp][u_temp][0] = int(split[0]);
            changeDetected = true;
            loop();
          }
        }

      } else if (split.length == 4) {   // If 4 columns

        // detects if different from previous value
        if ( v_temp < tablePieceInput.length && u_temp < tablePieceInput[0].length ) {
          if ( tablePieceInput[v_temp][u_temp][0] != int(split[0]) || tablePieceInput[v_temp][u_temp][1] != int(split[3])/90 ) {
            // Sets ID
            tablePieceInput[v_temp][u_temp][0] = int(split[0]);
            //Identifies rotation vector of piece [WARNING: Colortizer supplies rotation in degrees (0, 90, 180, and 270)]
            tablePieceInput[v_temp][u_temp][1] = int(split[3])/90;
            changeDetected = true;
            loop();
          }
        }
      }
    }
  }
}

function receive(data, ip, port) {  // <-- extended handler
  // get the "real" message =
  var message = new String( data );
  //println("catch!");
  //println(message);
  //saveStrings("data.txt", split(message, "\n"));
  var split = split(message, "\n");

  if (!busyImporting) {
    busyImporting = true;
    ImportData(split);
  }
  
  // Updates Screen whenever Webcam Update Received
  loop();
}

function sendCommand(command, port) {
  var dataToSend = "";
  dataToSend += command;
  udp.send( dataToSend, "localhost", port );
}