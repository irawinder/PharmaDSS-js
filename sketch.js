var screenWidth;
var screenHeight;
var textSizeValue;
var MARGIN;
var main;
var profilesX, profilesY, buildsX, buildsY, sitesX, sitesY, radarX, radarY, titlesY, lineX, lineY, infoX, infoY;
var profilesW, profilesH, buildsW, buildsH, sitesW, sitesH, radarH, lineW, lineH, infoW, infoH;
var HIGHLIGHT, THEME, GSK_ORANGE, CAPACITY_COLOR, NOW, END;
var textColor;
var backgroundValue;
var BUTTON_OFFSET_H;
var BUTTON_OFFSET_W;
var dataLocation;
var readXLS;
var agileModel;

var displayBuilds;
var displayRadar;
var outputGraph;
var infoOverlay;
var infoOverride;

var mainMenu, hideMenu;
var showMainMenu;
var hideText;
var buttonNames;
var align;
var marginH, marginW;

var RG;
var Launch;
var P3;


function preload() {


}

function setup() {
  screenWidth = 1280;
  screenHeight = 800;
  textSizeValue = 12;
  MARGIN = 50;

  textColor = 255;
  backgroundValue = 50;
  BUTTON_OFFSET_H = 40;
  BUTTON_OFFSET_W = 50;

  dataLocation = "data/Agile Network Model v7_XLS.xls";
  readXLS = true;
  showMainMenu = true;

  displayBuilds = true;
  displayRadar = true;
  infoOverlay = false;
  infoOverride = false;

  HIGHLIGHT = color(174, 230, 230);
  THEME = color(255, 108,47);
  GSK_ORANGE = color(255, 108,47);
  CAPACITY_COLOR = color(200, 95, 224); 
  NOW = color(255, 220, 4);
  END = color(249, 60, 60);

  RG = color(0);
  Launch = color(64, 100, 209);
  P3 = color(61, 164, 72);

  // Initiate MFG_System and Objects
  agileModel = new MFG_System();
  
  // Load Model XLS
  if (readXLS) {
    // loadModel_XLS(agileModel, dataLocation);
  }

  agileModel.maxCapacity();
  
  //Initiate Game
  // var session = new Game();
  // updateProfileCapacities();
    
  // Setup for Canvas Visualization
  createCanvas(screenWidth, screenHeight, P2D);

  // Loads and formats menue items
  loadMenu(screenWidth, screenHeight);






  phasing = loadImage("data/phasing.png");
  sitePNG = loadImage("data/site.png");
  sitePNG_BW = loadImage("data/site_BW.png");
  nce = loadImage("data/coumpound2.png");
  nceMini = loadImage("data/compound.png");
  chip = loadImage("data/chip.png");
  
  logo_GSK = loadImage("data/GSK-logo-2014.png");
  logo_MIT = loadImage("data/MIT_logo_BW.png");

  main = loadFont("data/Arial.ttf");
  textFont(main);

  noStroke();

  textSize(textSizeValue);







  initOutputs();
  // setupRadar();
  
  // flatOutputs();
  // setupTable();

  // initUDP();
}

function draw() {
  textSizeValue = min(12,int(width/100));
 
  // Decode Lego pieces only if there is a change in Colortizer input
  if (changeDetected) {
    println("Lego Movement Detected");
    decodePieces();
    changeDetected = false;
  }
  
  drawScreen();
  // drawPhaseDiagram();
  
  // Draws Overlay Graphic to describe NCE attributes
  if (infoOverlay || infoOverride) {
      drawInfoOverlay();
  }
  
  // Refers to "drawTable" tab (need to draw twice to clear buffer?!)
  noStroke();
  // drawTable();
  // drawTable();
  
  // Draws Menu
  hideMenu.draw();
  if (showMainMenu) {
    mainMenu.draw();
  }
  
  if(!gameMode){
    game_message = " ";
  }

  gameText();
  
  noLoop();
}


// Refreshes when there's a mouse mouse movement
function mouseMoved() {
  loop();
}

function loadMenu(canvasWidth, canvasHeight) {
  // Initializes Menu Items (canvas width, canvas height, button width[pix], button height[pix], 
  // number of buttons to offset downward, String[] names of buttons)
  if (showMainMenu) {
    hideText = "hide";
  } else {
    hideText = "show";
  }

  hideMenu = new Menu(canvasWidth, canvasHeight, max(int(width*.13), 160), 25, 0, hideText, align);
  mainMenu = new Menu(canvasWidth, canvasHeight, max(int(width*0.13), 160), 25, 2, buttonNames, align);

  // Hides "End Turn" and "next Profile" button unless game is active
  mainMenu.buttons[13].isVoid = !gameMode;
  mainMenu.buttons[9].isVoid = !gameMode;
  mainMenu.buttons[10].isVoid = !gameMode;
  mainMenu.buttons[11].isVoid = !gameMode;
}

function gameText(){
  textAlign(LEFT);
  fill(249, 60, 60);
  textSize(textSizeValue+ 2);
  text(game_message, 50, height-260, profilesX-MARGIN*1.5, height/8);
}