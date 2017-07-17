  var align = "LEFT";
  var buttonNames = [
    "Load Random Data (SH+R)",  // 0
    "Load XLS Data (SH+X)",  // 1
    "Play Game (g)",  // 2
    "VOID",  // 3
    "Toggle Profile (p)",    // 4
    "Toggle Site (s)",  // 5
    "Toggle Existing Build (SH+S)", //6
    "Toggle New Build (b)",  // 7
    "VOID",  // 8
    "Deploy Selection (d)",  // 9
    "Remove Selection (r)",  // 10
    "Repurpose Selection (e)",  // 11
    "VOID",  // 12
    "End Turn (SPACE)",    // 13
    "VOID",  // 14
    "VOID",  // 15
    "Show Score Radar (z)",  // 16
    "Invert Colors (i)", // 17
    "Project Table (`)", // 18
  ];

// These Strings are for the hideMenu, formatted as arrays for Menu Class Constructor
var hide = ["Hide Main Menu (h)"];
var show = ["Show Main Menu (h)"];
// Button Array Associated with this Menu
var buttons;
var canvas;
var active; // lightest
var hover;
var pressed; // darkest

var isPressed;
var isVoid;

// The result of each button click is defined here
function mouseClicked() {
  //Hide/Show Menu
  if(hideMenu.buttons[0].over()){  
    toggleMainMenu();
  }
  
  if(mainMenu.buttons[0].over()){ 
    loadOriginal = false;
    regenerateGame();
  }
  
  if(mainMenu.buttons[1].over()){ 
    loadOriginal = true;
    regenerateGame();
  }
  
  if(mainMenu.buttons[2].over()){ 
    toggleGame();
  }
  
  if(mainMenu.buttons[4].over()){ 
    nextProfile();
  }
  
  if(mainMenu.buttons[5].over()){ 
    nextSite();
  }
  
  if(mainMenu.buttons[6].over()){ 
    nextSiteBuild();
  }
  
  if(mainMenu.buttons[7].over()){ 
    nextBuild();
  }
  
  if(mainMenu.buttons[9].over()){ 
    deploySelection();
  }
  
  if(mainMenu.buttons[10].over()){ 
    removeSelection();
  }
  
  if(mainMenu.buttons[11].over()){ 
    repurposeSelection();
  }
  
  if(mainMenu.buttons[13].over()){ 
    endTurn();
  }
  
  if(mainMenu.buttons[16].over()){ 
    displayRadar = toggle(displayRadar);
  }
  
  if(mainMenu.buttons[17].over()){ 
    invertColors();
  }
  
  if(mainMenu.buttons[18].over()){ 
    toggleProjection();
  }
  
  // checkSelections();
  
  loop();
}

function keyPressed() {
  switch(key) {
    case 'h': // "Hide Main Menu (h)"
      toggleMainMenu();
      break;
    case 'i': // "Invert Colors (i)"
      invertColors();
      break;
    case 'R': // "Regenerate Random Game Data (SH+R)"
      loadOriginal = false;
      regenerateGame();
      break;
    case 'X': // "Regenerate XLS Game Data (SH+X)"
      loadOriginal = true;
      regenerateGame();
      break;
    case 'g': // "Play Game (g)"
      toggleGame();
      game_message = "";
      break;
    case 'p': // "Toggle Profile (p)"
      nextProfile();
      break;
    case 's': // "Toggle Site (s)"
      nextSite();
      break;
    case 'S': // "Toggle Existing Build (SH+S)",
      nextSiteBuild();
      break;
    case 'b': // "Toggle Build (b)"
      nextBuild();
      break;
    case 'd': // "Deploy Selection (d)"
      if (gameMode) deploySelection();
      game_message = "";
      break;
    case 'r': // "Remove Selection (r)"
      if (gameMode) removeSelection();
       game_message = "";
      break;
    case 'e': // "Repurpose Selection (e)"
      if (gameMode) repurposeSelection();
      break;
    case ' ': // "Next Turn (SPACE)"
      if (gameMode) endTurn();
      game_message = "";
      break;
    case 'z': //  "Show Score Radar (z)"
      displayRadar = toggle(displayRadar);
      break;
    case '`': //  "Enable Projection (`)"
      toggleProjection();
      break;
      
    // Debugging (no formal buttons)
    case 'x':
      testPlace(tablePieceInput, 2, 8, 0);
      changeDetected = true;
      break;
    case 'P':
      // Toggle InfoOverlay
      if (infoOverride) {
        infoOverride = false;
      } else {
        infoOverride = true;
      }

  }
  loop();
}

function toggleMainMenu() {
  showMainMenu = toggle(showMainMenu);
  if (showMainMenu) {
    hideMenu.buttons[0].label = hide[0];
  } else {
    hideMenu.buttons[0].label = show[0];
  }
  print("showMainMenu = " + showMainMenu);
}

function alignLeft() {
  align = "LEFT";
  loadMenu(width, height);
  print(align);
}

function alignRight() {
  align = "RIGHT";
  loadMenu(width, height);
  print(align);
}

function alignCenter() {
  align = "CENTER";
  loadMenu(width, height);
  print(align);
}

function invertColors() {
  if (backgroundValue == 50) {
    backgroundValue = 255;
    textColor = 50;
    HIGHLIGHT = color(144, 200, 200);
  } else {
    backgroundValue = 50;
    textColor = 255;
    HIGHLIGHT = color(174, 240, 240);
  }
  print("background: " + backgroundValue + ", textColor: " + textColor);
}

// Toggle God Mode vs. Game Mode
function toggleGame() {
  if (gameMode) {
    gameMode = false;
    mainMenu.buttons[2].label = "Play Game (g)";
    mainMenu.buttons[13].isVoid = true;
    mainMenu.buttons[9].isVoid = true;
    mainMenu.buttons[10].isVoid = true;
    mainMenu.buttons[11].isVoid = true;
  } else {
    gameMode = true;
    session = new Game();
    regenerateGame();
    updateProfileCapacities();
    mainMenu.buttons[2].label = "God Mode (g)";
    mainMenu.buttons[13].isVoid = false;
    mainMenu.buttons[9].isVoid = false;
    mainMenu.buttons[10].isVoid = false;
    mainMenu.buttons[11].isVoid = false;
  }
  
  print("gameMode: " + gameMode);
}

function toggleProjection() {
  toggle2DProjection();
  print("displayProjection2D = " + displayProjection2D);
}

function pressButton(bool, button) {
  if (bool) {
    mainMenu.buttons[button].isPressed = false;
  } else {
    mainMenu.buttons[button].isPressed = true;
  }
}

// iterates an index parameter
function next(index, max) {
  if (index == max) {
    index = 0;
  } else {
    index ++;
  }
  return index;
}

// flips a boolean
function toggle(bool) {
  if (bool) {
    return false;
  } else {
    return true;
  }
}

 

function Button(x, y, w, h, label){
  // Various Shades of button states (0-255)
  active = 180; // lightest
  hover = 120;
  pressed = 120; // darkest
  
  isPressed = false;
  isVoid = false;
  
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.label = label;
  
  //Button Objects are draw to a PGraphics object rather than directly to canvas
  this.draw = function(p){
    if (!isVoid) {
      p.noStroke();
      if( this.over() ) {  // Darkens button if hovering mouse over it
        p.fill(100, hover);
      } else if (isPressed){
        p.fill(100, pressed);
      } else {
        p.fill(100, active);
      }
      p.rect(x, y, w, h, 5);
      p.fill(255);
      p.textAlign(CENTER);
      p.text(label, x + (w/2), y + 0.6*h); 
    }
  } 
  
  // returns true if mouse hovers in button region
  this.over = function(){
    if(mouseX >= x  && mouseY >= y + 5 && mouseX <= x + w && mouseY <= y + 2 + h){
      return true;
    } else {
      return false;
    }
  }
}


function Menu(w, h, x, y, vOffset, names, align){
  this.names = names;
  this.w = w;
  this.h = h;
  this.vOffset = vOffset;
  this.align = align;
  this.x = x;
  this.y = y;
  
  // distance in pixels from corner of screen
  var marginH = BUTTON_OFFSET_H;
  var marginW = BUTTON_OFFSET_W;
  
  canvas = createGraphics(w, h);
  // #Buttons defined by Name String Array Length
  this.buttons = new Array(this.names.length);

  // Initializes the button objects
  for (var i=0; i<this.buttons.length; i++) {
    if ( this.align == "right" || this.align == "RIGHT" ) {
      // Right Align
      this.buttons[i] = new Button(this.w - this.x - marginW, marginH + this.vOffset*(this.y+5) + i*(this.y+5), this.x, this.y, this.names[i]);
    } else if ( this.align == "left" || this.align == "LEFT" ) { 
      // Left Align
      this.buttons[i] = new Button(marginW, marginH + this.vOffset*(this.y+5) + i*(this.y+5), this.x, this.y, names[i]);
    } else if ( this.align == "center" || this.align == "CENTER" ) { 
      // Center Align
      this.buttons[i] = new Button( (this.w-this.x)/2, marginH + this.vOffset*(this.y+5) + i*(this.y+5), this.x, this.y, this.names[i]);
    }
    
    // Alows a menu button spacer to be added by setting its string value to "VOID"
    if (this.names[i] == "void" || this.names[i] == "VOID" ) {
      this.buttons[i].isVoid = true;
    }
  }
  
  // Draws the Menu to its own PGraphics canvas
  this.draw = function() {
    canvas.clear();
    for (var i=0; i<this.buttons.length; i++) {
      this.buttons[i].draw(canvas);
    }  
    image(canvas, 0, 0);
  }
}

function checkSelections() {
  var numProfiles;
  if (!gameMode) {
    numProfiles = agileModel.PROFILES.length;
      for(var i =0; i<numProfiles; i++){
        if(mouseX <= agileModel.PROFILES.get(i).xClick + agileModel.PROFILES.get(i).wClick && mouseX >= agileModel.PROFILES.get(i).xClick 
        && mouseY <= agileModel.PROFILES.get(i).yClick + agileModel.PROFILES.get(i).hClick && mouseY >= agileModel.PROFILES.get(i).yClick){
          session.setProfile(i);
        }
      }
  } else {
    numProfiles = agileModel.activeProfiles.length;
    
    for(var i =0; i<numProfiles; i++){
        if(mouseX <= agileModel.activeProfiles.get(i).xClick + agileModel.activeProfiles.get(i).wClick && mouseX >= agileModel.activeProfiles.get(i).xClick 
        && mouseY <= agileModel.activeProfiles.get(i).yClick + agileModel.activeProfiles.get(i).hClick && mouseY >= agileModel.activeProfiles.get(i).yClick){
            session.setProfile(i);} 
    }
       
    for(var j = 0; j<NCEClicks.length; j++){
      var NCEClickX = NCEClicks.get(j)[0];
      var NCEClickY = NCEClicks.get(j)[1];
      var NCEClickWidth = NCEClicks.get(j)[2];
      var NCEClickHeight = NCEClicks.get(j)[3];  
        if(mouseX <= NCEClickX + NCEClickWidth && mouseX >= NCEClickX  && mouseY <= NCEClickY + NCEClickHeight && mouseY >= NCEClickY){
          session.selectedSiteBuild = int(NCEClicks.get(j)[4]);
            for(var i = 0; i<agileModel.activeProfiles.length; i++){
                if (NCEClicks.get(j)[5] == agileModel.activeProfiles.get(i).ABSOLUTE_INDEX){
                    session.selectedProfile = int(i);
                }
            }
        }
      }
     
    
     for(var i =0; i<numProfiles; i++){
        if(mouseX <= agileModel.activeProfiles.get(i).xClick + agileModel.activeProfiles.get(i).wClick && mouseX >= agileModel.activeProfiles.get(i).xClick 
        && mouseY <= agileModel.activeProfiles.get(i).yClick + agileModel.activeProfiles.get(i).hClick && mouseY >= agileModel.activeProfiles.get(i).yClick){
          session.setProfile(i);
        }    
     }
   }
  
    

   for(var i = 0; i< NUM_SITES; i++){
        var clickX = MARGIN  + sitesX + i*((width-sitesX-MARGIN)/NUM_SITES);
        var clickW = ((width-sitesX-MARGIN)/NUM_SITES) - MARGIN*2;
      if(mouseX <= clickX + clickW && mouseX >= clickX  && mouseY <= sitesY + sitesH && mouseY >= sitesY){
        session.selectedSite = int(agileModel.SITES.get(i).name) - 1;
      }

    }
      
   if(!gameMode){
     for(var j = 0; j<NCEClicks.length; j++){
            var NCEClickX = NCEClicks.get(j)[0];
            var NCEClickY = NCEClicks.get(j)[1];
            var NCEClickWidth = NCEClicks.get(j)[2];
            var NCEClickHeight = NCEClicks.get(j)[3];  
              if(mouseX <= NCEClickX + NCEClickWidth && mouseX >= NCEClickX  && mouseY <= NCEClickY + NCEClickHeight && mouseY >= NCEClickY){
                session.selectedSiteBuild = int(NCEClicks.get(j)[4]);
                session.selectedProfile = int(NCEClicks.get(j)[5]);
              }
     }
   }
}