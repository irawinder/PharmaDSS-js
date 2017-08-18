// The following scripts stage the drawing that is eventually projected upon a Tactile Matrix

var mfg;
var siteCapacity;
var enableSites;

var dockedNCE = false;

var BASIN_HEIGHT = 6;

/*      ---------------> + U-Axis
 *     |
 *     |
 *     |
 *     |
 *     |
 *     |
 *   + V-Axis
 *
 */
  var projectorWidth = 1920;
  var projectorHeight = 1200;
  var projectorOffset = 1280;

function setupTable() {
  // offscreen = createGraphics(projectorHeight, projectorHeight);
  // TableSurface(int u, int v, boolean left_margin)
  mfg = new TableSurface(projectorHeight, projectorHeight, V_MAX, V_MAX, true);
  enableSites = true;
  generateBasins();
}

function drawTable() {
  // Draw the scene, offscreen
  mfg.draw(offscreen);

  if (testProjectorOnMac) {
    stroke(background);
    strokeWeight(1);
    fill(textColor, 100);
    rect((width - int(0.85*height) ) / 2, (height - int(0.85*height) ) / 2, int(0.85*height), int(0.85*height), 10);
    image(offscreen, (width - int(0.8*height) ) / 2, (height - int(0.8*height) ) / 2, int(0.8*height), int(0.8*height));
  }
}

function generateBasins() {
  siteCapacity = new Array(NUM_SITES).fill(new Array(2));
  for (var i=0; i<NUM_SITES; i++) { 
    //siteCapacity[i] = agileModel.SITES.get(i).capEx + agileModel.SITES.get(i).capGn;
    siteCapacity[i][0] = agileModel.SITES[i].capEx;
    siteCapacity[i][1] = agileModel.SITES[i].capGn;
  }

  mfg.clearBasins();
  mfg.addBasins(siteCapacity);
  enableSites = true;
}

TableSurface.prototype.resetCellTypes = function() {
  for (var u=0; u<this.U; u++) {
    for (var v=0; v<this.V; v++) {
      
      // Sets Site ID to Null
      cellType[u][v][0] = "NULL";
      
      // Sets Site's "Existing" or "Greenfield" Status to Null
      cellType[u][v][1] = "NULL";
      
      inUse[u][v] = false;
      siteBuildIndex[u][v] = -1;
    }
  }
} 

function TableSurface(W, H, U, V, left_margin) {
  var U, V;
  var MARGIN_W = 4;  // Left Margin for Grid (in Lego Squares)
  var BASINS_Y = 8;  // Top Margin for Basins (in Lego Squares_
  var BASINS_H = 10; // Height of Largest Basin (in Lego Squares)

	this.U = U;
	this.V = V;
	LEFT_MARGIN = left_margin;
	inputArea = new Array();
	cellType = new Array(U).fill(new Array(V).fill(new Array(2)));
	inUse = new Array(U).fill(new Array(V));
	siteBuildIndex = new Array(U).fill(new Array(V));

	cellW = float(W)/U;
	cellH = float(H)/V;

	this.resetCellTypes();

  

  this.checkTableDeploy = function() {
    // Cycle through each 22x22 Table Grid
    for (var u=0; u<this.U; u++) {
      for (var v=0; v<this.V; v++) {
        
        // Determine if the Cell is in a "Site" Basin and, if so, which one
        var site = -1;
        if (inBasin(u, v)) {
          if (cellType[u][v][0] = "SITE_0") site = 0;
          if (cellType[u][v][0] = "SITE_1") site = 1;
          if (cellType[u][v][0] = "SITE_2") site = 2;   
            
          // If the cell is currently in use, proceed
          if (inUse[u][v]) {
            
            // If Lego Piece is Removed ...
            if (tablePieceInput[u - MARGIN_W][v][0] == -1 && siteBuildIndex[u][v] != -1) {
              try {
                var remove = new Event("remove", site, siteBuildIndex[u][v]);
                session.current.event.push(remove);
                updateProfileCapacities();
                inUse[u][v] = false;
              } catch (e) {
                print("Error Removing A Piece from the Table");
              }
            }
  
          } 
          
          // If the cell is currently not in use, proceed
          else {
            
            // If lego id is valid, proceed
            if (tablePieceInput[u - MARGIN_W][v][0] > -1 && tablePieceInput[u - MARGIN_W][v][0] < NUM_PROFILES) {
              
              // Begin Building the Current Production Facility
              var deploy = new Event("deploy", site, session.selectedBuild, agileModel.PROFILES[tablePieceInput[u - MARGIN_W][v][0]].ABSOLUTE_INDEX);
              session.current.event.push(deploy);
              siteBuildIndex[u][v] = agileModel.SITES[site].siteBuild.length-1;
              print(siteBuildIndex[u][v]);
              inUse[u][v] = true;
              
            }
          }
        } 
      }
    }
    
    // Update Profile Information
    updateProfileCapacities();
  }

  this.clearBasins = function() {
    inputArea = new Array();
  }
  
  this.draw = function(p) {
    var buffer = 30;
    var spotLightHeight = 42;
    var spotLightWidth = 110;
    
  //  p.background(50);
    p.background(0);
    
    //draw spotlights
    for(var i = agileModel.profileColor.length-1; i>=0; i--){
      p.fill(agileModel.profileColor[NUM_PROFILES - i - 1]);
      p.noStroke();
      p.rect(15, (i*(spotLightHeight + 12) ) + buffer + logo_GSK.height, spotLightWidth, spotLightHeight, 10);
      p.fill(0);
      p.textSize(30);
      p.textAlign(CENTER, CENTER);
      p.text(NUM_PROFILES - i, 15 + spotLightWidth/2, (i*(spotLightHeight + 12) ) + buffer + logo_GSK.height + spotLightHeight/2 - 2);
    }
    
    // Draw Site Boundaries (Existing and Greenfield)
    if (enableSites) {
      if (inputArea.length > 0) {
        for (var i=0; i<inputArea.length; i++) {
          p.fill(255);
          p.textAlign(BOTTOM);
          p.textSize(cellH/2);
          p.text("Site " + (i+1), (inputArea[i].basinX + 0.0)*cellW, (inputArea[i].basinY - 4.1)*cellH);
          p.shape(inputArea[i].s[0]);
          p.shape(inputArea[i].s[1]);
          
         // p.tint(180);
          p.image(sitePNG, (inputArea[i].basinX)*cellW, (1.5)*cellH, (inputArea[i].basinWidth)*cellW, (inputArea[i].basinY - 4.5)*cellH);
        }
      }
    }

    // Cycle through each table grid, skipping margin
    for (var u=0; u<this.U; u++) {
      for (var v=0; v<this.V; v++) {
        if (!LEFT_MARGIN || (LEFT_MARGIN && u >= MARGIN_W) ) {
          
          if (inBasin(u, v)) {
            var current;
            
            // Draw Colortizer Input Pieces
            if (tablePieceInput[u - MARGIN_W][v][0] >=0 && tablePieceInput[u - MARGIN_W][v][0] < NUM_PROFILES) {
              
              p.fill(agileModel.profileColor[ tablePieceInput[u - MARGIN_W][v][0] ]);
              p.noStroke();
              p.rect(u*cellW, v*cellH, cellW, cellH);
              p.image(nce, u*cellW, v*cellH, cellW, cellH);
            }

          }
          
          // Draw black edges where Lego grad gaps are
          p.noFill();
          p.stroke(0);
          p.strokeWeight(3);
          p.rect(u*cellW, v*cellH, cellW, cellH);
          
          // Draw Interface for Selecting NCE to Zoom In To
          p.fill(255);
          p.rect(4*cellW, (V-3)*cellH, cellW*3, 3*cellH);
          p.textSize(20);
          p.textAlign(RIGHT);
          p.text("Select\nNCE", 3.5*cellW, (V-3)*cellH + 20);
          p.image(nce, 7*cellW, (V-2)*cellH, 200, 100);
          p.fill(0);
          p.rect(5*cellW, (V-2)*cellH, cellW, cellH);
          
          
//          int limit;
//          if (gameMode) {
//            limit = agileModel.activeProfiles.size();
//          } else {
//            limit = NUM_PROFILES;
//          }
          
          if (tablePieceInput[5 - MARGIN_W][V-2][0] > -1 && tablePieceInput[5 - MARGIN_W][V-2][0] < NUM_PROFILES) {
            infoOverlay = true;
            if (gameMode) {
              session.selectedProfile = activeProfileIndex(tablePieceInput[5 - MARGIN_W][V-2][0]);
            } else {
              session.selectedProfile = tablePieceInput[5 - MARGIN_W][V-2][0];
            }
            p.noStroke();
            p.fill(agileModel.profileColor[ tablePieceInput[5 - MARGIN_W][V-2][0] ]);
            p.noStroke();
            p.rect(5*cellW, (V-2)*cellH, cellW, cellH);
            p.image(nce, 5*cellW, (V-2)*cellH, cellW, cellH);
          } else {
            infoOverlay = false;
          }
          
          p.noFill();
        }
      }
    }

    // Draw Black Edge around 4x22 left margin area
    if (LEFT_MARGIN) {
      p.rect(0, 0, MARGIN_W*cellW, p.height);
    }
    
    // Draw logo_GSK, logo_MIT
    p.image(logo_GSK, 0.5*buffer, 1.0*buffer, 2.0*buffer, 2.0*buffer); 
    p.image(logo_MIT, 2.5*buffer, 2.1*buffer, 1.5*buffer, 0.7*buffer); 

    //drawBuilds(p);

    p.endDraw();
  }
  
  this.inBasin = function(u, v) {
    if (cellType[u][v][0].substring(0,4) == ("SITE") ) {
      return true;
    } else {
      return false;
    }
  }
  
  this.inExisting = function(u, v) {
    if (cellType[u][v][1].substring(0,4) == ("EXIS") ) {
      return true;
    } else {
      return false;
    }
  }
  
  this.addBasins = function(basinSize) {
    var num = basinSize.length; // Number of Sites
    var availableWidth = U - MARGIN_W;
    var basinWidth, step;
    if (num == 2) {
      basinWidth = 8;
      step = 2;
    } else {
      basinWidth = int(float(availableWidth)/num);
      step = 1;
    }
    for (var i=0; i<num; i++) {
      // Creates Existing/Greenfield Basins for Site
      inputArea.push( new Basin(i, MARGIN_W + step + i*basinWidth, BASINS_Y, basinSize[i], basinWidth - 2, BASIN_HEIGHT) );
    }
  }



  // A basin is an area on the table grid representing a total quantity 
  // of some available parameter. Typically, basins are "filled in" by tagged lego pieces.
  function Basin(index, basinX, basinY, basinCap, basinWidth, basinHeight) {
    var isQuad = true;

    this.basinX = basinX;
    this.basinY = basinY;
    this.basinCap = basinCap;
    this.basinWidth = basinWidth;
    this.basinHeight = basinHeight;

    MAX_SIZE = basinWidth * basinHeight;
    basinSize = new Array(2);
    basinSize[0] = int((basinCap[0] + basinCap[1]) / agileModel.maxCap * MAX_SIZE);
    basinSize[1] = int( basinCap[0] / agileModel.maxCap * MAX_SIZE);
    CORNER_BEVEL = new Array(2);
    CORNER_BEVEL[0] = 10;
    CORNER_BEVEL[1] = 5;
    s = new Array(2);

    // Designate CellType
    for (var i=0; i<basinSize[0]; i++) {
      var u = basinX + i%basinWidth;
      var v = basinY + i/basinWidth;
      cellType[u][v][0] = "SITE_" + index;
      if (i<basinSize[1]) {
        cellType[u][v][1] = "EXISTING";
      } else {
        cellType[u][v][1] = "GREENFIELD";
      }
    }

    // Outline (0 = Existing Capacity; 1 = Greenfield Capacity);
    for (var i=0; i<2; i++) {
      
      if (basinSize[i]%basinWidth != 0) {
        isQuad = false;
      } else {
        isQuad = true;
      }
    
      beginShape();
      noFill();
      strokeWeight(2*CORNER_BEVEL[i]);

      if (i==0) {
        stroke(255, 150);
      } else {
        stroke(GSK_ORANGE);
      }

      vertex( - CORNER_BEVEL[i] +  basinX*cellW, - CORNER_BEVEL[i] +  basinY*cellH);
      vertex( + CORNER_BEVEL[i] + (basinX + basinWidth) * cellW, - CORNER_BEVEL[i] +  basinY*cellH);
      if (isQuad) {
        vertex( + CORNER_BEVEL[i] + (basinX + basinWidth) * cellW, + CORNER_BEVEL[i] + (basinY + basinSize[i] / basinWidth) * cellH);
        vertex( - CORNER_BEVEL[i] +  basinX*cellW, + CORNER_BEVEL[i] + (basinY + basinSize[i] / basinWidth) * cellH);
      } else {
        vertex( + CORNER_BEVEL[i] + (basinX + basinWidth) * cellW, + CORNER_BEVEL[i] + (basinY + basinSize[i] / basinWidth) * cellH);
        vertex( + CORNER_BEVEL[i] + (basinX + basinSize[i]%basinWidth) * cellW, + CORNER_BEVEL[i] + (basinY + basinSize[i] / basinWidth) * cellH);
        vertex( + CORNER_BEVEL[i] + (basinX + basinSize[i]%basinWidth) * cellW, + CORNER_BEVEL[i] + (basinY + basinSize[i] / basinWidth + 1) * cellH);
        vertex( - CORNER_BEVEL[i] +  basinX*cellW, + CORNER_BEVEL[i] + (basinY + basinSize[i] / basinWidth + 1) * cellH);
      }
       vertex( - CORNER_BEVEL[i] +  basinX*cellW, - CORNER_BEVEL[i] +  basinY*cellH);

      endShape(CLOSE);
    }
    
  }
}

function fauxPieces(code, pieces, maxID) {
  if (code == 2 ) {
    
    // Sets all grids to have "no object" (-1) with no rotation (0)
    for (var i=0; i<pieces.length; i++) {
      for (var j=0; j<pieces[0].length; j++) {
        pieces[i][j][0] = -1;
        pieces[i][j][1] = 0;
      }
    }
  } else if (code == 1 ) {
    
    // Sets grids to be alternating one of each N piece types (0-N) with no rotation (0)
    for (var i=0; i<pieces.length; i++) {
      for (var j=0; j<pieces[0].length; j++) {
        pieces[i][j][0] = i  % maxID+1;
        pieces[i][j][1] = 0;
      }
    }
  } else if (code == 0 ) {
    
    // Sets grids to be random piece types (0-N) with random rotation (0-3)
    for (var i=0; i<pieces.length; i++) {
      for (var j=0; j<pieces[0].length; j++) {
        if (random(0, 1) > 0.5) {
          pieces[i][j][0] = int(random(-1.99, maxID+1));
          pieces[i][j][1] = int(random(0, 4));
        } else { // 95% of pieces are blank
          pieces[i][j][0] = -1;
          pieces[i][j][1] = 0;
        }
      }
    }
  } else if (code == 3) {
    
    // Adds N random pieces to existing configuration
    for (var i=0; i<50; i++) {
      var u = int(random(0,pieces.length)); 
      var v = int(random(0,pieces[0].length)); 
      if (pieces[u][v][0] == -1) {
        pieces[u][v][0] = int(random(-1.99, maxID+1));
        pieces[u][v][1] = int(random(0, 4));
      }
    }
  } 
}

function testPlace(pieces, u, v, id) {
  if (pieces[u][v][0] == -1) {
    pieces[u][v][0] = id;
  } else {
    pieces[u][v][0] = -1;
  }
}

function decodePieces() {
  mfg.checkTableDeploy();
}

// function drawBuilds(p) {
//   // Draw Build/Repurpose Units
  
//   //Builds
//   buildsX = 20;
//   buildsY = int(0.75*p.height);
//   buildsW   = int(0.135*p.width);
//   buildsH   = profilesH;
  
//   var selected;
  
//   p.beginDraw();
  
//   // Build Var
//   p.fill(255);
//   p.textAlign(LEFT);
//   p.textSize(12);
//   p.text("Pre-Engineered \nProduction Units:", buildsX, buildsY - MARGIN);
//   var spread = 3.0;
  
//   // Draw GMS Build Options
//   p.fill(255);
//   p.textAlign(LEFT);
//   p.text("GMS", buildsX, buildsY + 1.4*MARGIN);
// //      text("Build", MARGIN + buildsX, buildsY - 10);
// //      text("Repurpose", MARGIN + buildsX + 80, buildsY - 10);
//   for (var i=0; i<agileModel.GMS_BUILDS.length; i++) {
//     selected = false;
//     if (i == session.selectedBuild) selected = true;
//     agileModel.GMS_BUILDS[i].draw(p, buildsX, 2*MARGIN + buildsY + int(spread*buildsH*i), buildsW, buildsH, "GMS", selected);
//   }
//   // Draw R&D Build Options
//   p.fill(255);
//   p.textAlign(LEFT);
//   var vOffset = buildsY + spread*buildsH*(agileModel.GMS_BUILDS.length+1);
//   p.text("R&D", buildsX, vOffset + 1.4*MARGIN);
//   for (var i=0; i<agileModel.RND_BUILDS.length; i++) {
//     selected = false;
//     // if (...) selected = true;
//     agileModel.RND_BUILDS[i].draw(p, buildsX, 2*MARGIN + int(vOffset + spread*buildsH*i ), buildsW, buildsH, "R&D", selected);
//   }
  
//   // Draw Personnel Legend
//   var vOff = -50;
//   p.fill(255);
//   p.textAlign(LEFT);
// //      text("Personnel:", titlesY, MARGIN);
//   for (var i=0; i<NUM_LABOR; i++) {
//     if (i==0) {
//       p.fill("#CC0000");
//     } else if (i==1) {
//       p.fill("#00CC00");
//     } else if (i==2) {
//       p.fill("#0000CC");
//     } else if (i==3) {
//       p.fill("#CCCC00");
//     } else if (i==4) {
//       p.fill("#CC00CC");
//     } else {
//       p.fill("#00CCCC");
//     }
    
//     var xOff = 0;
//     if (i > 2) {
//       xOff = 100;
//     }
    
//     p.ellipse(buildsX + xOff, 15*(i%3) - 4 + buildsY, 3, 10);
//     p.fill(255);
//     p.text(agileModel.LABOR_TYPES.getString(i,0), buildsX + 10 + xOff, 15*(i%3) + buildsY);
//   }
  
//   p.endDraw();
// }