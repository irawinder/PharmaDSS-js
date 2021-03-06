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

var gmsRulesFile;
var gmsCapacityFile;
var gmsLabourFile;
var rndPPFile;
var rndRulesFile;
var supplyRulesFile;
var profileDataFile;

var session;

function preload() {
  gmsRulesFile = loadTable("data/GMSRules.csv","csv","header");
  gmsCapacityFile = loadTable("data/GMSCapacityRules.csv","csv","header");
  gmsLabourFile = loadTable("data/GMSLabourCosts.csv","csv");
  rndPPFile = loadTable("data/RND_PPRules.csv","csv");
  rndRulesFile = loadTable("data/RNDRules.csv","csv");
  supplyRulesFile = loadTable("data/RNDRules.csv","csv");
  profileDataFile = loadTable("data/ProfileData.csv","csv");
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
  HIGHLIGHT_ALPHA = color(174, 230, 230, 50);
  THEME = color(255, 108, 47);
  GSK_ORANGE = color(255, 108, 47);
  GSK_ORANGE_ALPHA200 = color(255, 108, 47, 200);
  GSK_ORANGE_ALPHA50 = color(255, 108, 47, 50);
  CAPACITY_COLOR = color(200, 95, 224); 
  CAPACITY_COLOR_ALPHA = color(200, 95, 224, 200); 
  NOW = color(255, 220, 4);
  END = color(249, 60, 60);

  RG = color(0);
  Launch = color(64, 100, 209);
  P3 = color(61, 164, 72);

  // Initiate MFG_System and Objects
  agileModel = new MFG_System();

  // Load Model XLS  COL, ROW
  if (readXLS) {
    loadRules(agileModel, gmsRulesFile, gmsCapacityFile, gmsLabourFile, rndPPFile, rndRulesFile, supplyRulesFile, profileDataFile);
  }

  agileModel.maxCapacity();
  
  //Initiate Game
  session = new Game();
  updateProfileCapacities();
    
  // Setup for Canvas Visualization
  createCanvas(screenWidth, screenHeight);

  // Loads and formats menue items
  loadMenu(screenWidth, screenHeight);





  phasing = loadImage("data/phasing.png");
  sitePNG = loadImage("data/site_COL.png");
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
  setupRadar();
  
  flatOutputs();
  setupTable();

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
  
  drawMenuButtons();

  noLoop();
}


// Refreshes when there's a mouse mouse movement
function mouseMoved() {
  // loop(); // NOTE: TURNED OFF TEMPORARILY DUE TO ERRORS
}

function loadMenu(canvasWidth, canvasHeight) {
  // Initializes Menu Items (canvas width, canvas height, button width[pix], button height[pix], 
  // number of buttons to offset downward, String[] names of buttons)
  if (showMainMenu) {
    hideText = hide;
  } else {
    hideText = show;
  }

  hideMenu = new Menu(canvasWidth, canvasHeight, max(int(width*0.13), 160), 25, 0, hideText, align);
  mainMenu = new Menu(canvasWidth, canvasHeight, max(int(width*0.13), 160), 25, 2, buttonNames, align);

  // Hides "End Turn" and "next Profile" button unless game is active
  mainMenu.buttons[13].isVoid = !gameMode;
  mainMenu.buttons[9].isVoid = !gameMode;
  mainMenu.buttons[10].isVoid = !gameMode;
  mainMenu.buttons[11].isVoid = !gameMode;
}

function gameText() {
  textAlign(LEFT);
  fill(249, 60, 60);
  textSize(textSizeValue + 2);
  text(game_message, 50, height-200, profilesX-MARGIN*1.5, height/8);
}




function drawMenuButtons() {

  for( var i=0; i < hideMenu.buttons.length; i++ ){
    noStroke();
    if( hideMenu.buttons[i].over() ) {  // Darkens button if hovering mouse over it
      fill(100, 180);
    } else if (hideMenu.buttons[i].isPressed){
      fill(100, 120);
    } else {
      fill(100, 120);
    }
    rectMode(CORNER);
    rect(hideMenu.buttons[i].x, hideMenu.buttons[i].y, hideMenu.buttons[i].w, hideMenu.buttons[i].h, 5);
    fill(255);
    textAlign(CENTER);
    textSize(12);
    print(hideMenu.buttons[i].label);
    text(hideMenu.buttons[i].label, hideMenu.buttons[i].x + hideMenu.buttons[i].w/2, hideMenu.buttons[i].y + hideMenu.buttons[i].h/2); 
  }

  for( var i=0; i < mainMenu.buttons.length; i++ ){
    if( !mainMenu.buttons[i].isVoid ) {
      noStroke();
      if( mainMenu.buttons[i].over() ) {  // Darkens button if hovering mouse over it
        fill(100, 180);
      } else if ( mainMenu.buttons[i].isPressed){
        fill(100, 120);
      } else {
        fill(100, 120);
      }
      rectMode(CORNER);
      rect(mainMenu.buttons[i].x, mainMenu.buttons[i].y, mainMenu.buttons[i].w, mainMenu.buttons[i].h, 5);
      fill(255);
      textAlign(CENTER);
      textSize(12);
      text(mainMenu.buttons[i].label, mainMenu.buttons[i].x + mainMenu.buttons[i].w/2, mainMenu.buttons[i].y + mainMenu.buttons[i].h/2); 
    }
  }
}




