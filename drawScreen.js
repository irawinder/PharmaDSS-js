function drawScreen() {

  textSize(textSizeValue);

  //Profile
  profilesX = int(0.18*width);
  profilesY = int(0.21*height);
  profilesW = int(0.23*width);
  profilesH = int(0.02*height);
  
  //Sites
  sitesX    = int(profilesX + profilesW + 100);
  sitesY    = int(0.21*height);
  sitesW    = int(0.08*width);
  sitesH    = int(height) - 2*MARGIN - sitesY;
  
  //Radar
  radarH    = int(0.05*width);
  radarX    = int(sitesX + radarH + 70);
  radarY    = int(0.8*height + 15);
  
  //Builds
  buildsX   = sitesX + radarH*3;
  buildsY   = sitesY + sitesH/2;
  buildsW   = int(0.13*width);
  buildsH   = profilesH;
  
  infoX     = int(0.05*(width) / 2 + 4*MARGIN);
  infoY     = int((height - int(0.85*height) ) / 2);
  infoW     = int(0.95*(width -4*MARGIN));
  infoH     = int(0.85*height);
  
  var canH = height - 2.8*MARGIN;

  // Output Graph
  if (displayRadar || displayBuilds) {
    lineX     = int(MARGIN*1.5 + sitesX + (width - sitesX - 1.25*MARGIN)/3 + 20);
    lineY     = int(2.2*MARGIN + 65 + canH*.6);
    lineW     = int(2*(width - sitesX - 1.25*MARGIN)/3 - 100);
    lineH     = int(canH*.25);
  } else {
    lineX     = int(MARGIN*1.5 + sitesX);
    lineY     = int(2.2*MARGIN + 65 + canH*.6);
    lineW     = int(width - sitesX - 3.25*MARGIN);
    lineH     = int(canH*.25);
  }

  //Titles
  titlesY   = int(2.80*MARGIN);
  background(abs(backgroundValue - 15));
  var selected;

  noStroke();

  // Shadows
  fill(abs(backgroundValue - 50));
  rect(0.25*MARGIN + profilesX+5, 2.2*MARGIN+5, profilesW + 1.75*MARGIN, canH, 4);
  rect(0.5*MARGIN + sitesX+5, 2.2*MARGIN+5, width - sitesX - 1.25*MARGIN, canH*.6, 4);
  rect(0.5*MARGIN + sitesX+5, 2.2*MARGIN + 25 + canH*.6 , width - sitesX - 1.25*MARGIN, canH*.4 - 20 , 4);
  
  // Canvas
  fill(abs(backgroundValue - 0));
  rect(0.25*MARGIN + profilesX, 2.2*MARGIN, profilesW + 1.75*MARGIN, canH, 3);
  rect(0.5*MARGIN + sitesX, 2.2*MARGIN, width - sitesX - 1.25*MARGIN, canH*.6, 3);
  rect(0.5*MARGIN + sitesX, 2.2*MARGIN + 20 + canH*.6 , width - sitesX - 1.25*MARGIN, canH*.4 - 20 , 3);

  // Draw Title
  fill(textColor);
  textAlign(RIGHT);
  textSize(textSizeValue);
  text("PharmaDSS " + VERSION, width - MARGIN, MARGIN);
  text("Ira Winder, Nina Lutz, Kent Larson (MIT), Joana Gomes (IIM, GSK)\nGiovanni Giorgio, Mason Briner (Capital Strategy and Design, GSK)\nAndrew Rutter (AMT), John Dyson (CSD, GSK)", width - MARGIN, MARGIN + textSizeValue);  

  // Draw Pork Chop
  image(logo_GSK, 1.0*MARGIN, height-MARGIN - 85 + 2, 95, 95); 
  image(logo_MIT, 2.9*MARGIN, height-MARGIN - 15, 1.4*MARGIN, 0.6*MARGIN); 
  textAlign(LEFT);
  text("PharmaDSS \n" + VERSION,  2.9*MARGIN, height-MARGIN - 40);

  // Draw Profiles
  if (!gameMode) {
    drawProfiles(agileModel.PROFILES);
  } else {
    drawProfiles(agileModel.activeProfiles);
  }
 
  // Draw Sites
  fill(textColor);
  textAlign(LEFT);
  textSize(max(18, textSizeValue));
  text("Site Characteristics", MARGIN + sitesX - 10, titlesY);
  if (NUM_OUTPUTS < 5) {
    text("Performance", MARGIN + lineX  - 70, canH*.6 + titlesY + MARGIN/2.5 - 5);
  }
  if (!displayRadar) {
    text("MfG Capacity 'Chip'", MARGIN + sitesX  - 10, canH*.6 + titlesY + MARGIN/2.5 - 5);
  } else {
    text("Performance VS. Ideal", MARGIN + sitesX  - 10, canH*.6 + titlesY + MARGIN/2.5 - 5);
  }
  
  textSize(min(16, textSizeValue));
  NCEClicks = new Array();
  // for (var i=0; i<NUM_SITES; i++) {
  //   selected = false;
  //   if (i == session.selectedSite) selected = true;
  //   agileModel.SITES.get(i).draw(MARGIN  + sitesX + i*((width-sitesX-MARGIN)/NUM_SITES), sitesY, ((width-sitesX-MARGIN)/NUM_SITES) - MARGIN*2, sitesH, agileModel.maxCap, selected);
  // }
   
  // Line Graph and Outputs
  outputGraph = new LineGraph(outputs, lineX, lineY, lineW, lineH);
  
  // Draw Build Legend
  drawBuilds();
  
  //Draw Selected Profile in Large Format
  try {
    if (!gameMode) {
      drawLargeProfile(agileModel.PROFILES[session.selectedProfile]);
    } else {
      drawLargeProfile(agileModel.activeProfiles.get(session.selectedProfile));
    }
  } catch (e) {
    // print("Could not execute drawLargeProfile() in drawScreen()");
  }
  
  // Draw Radar Plot
  if (displayRadar) {
    kpi.draw(radarX, radarY, radarH);
  }
  outputGraph.draw();


}


var nceW = 15;

function drawLargeProfile(selected) {
  selected.draw(MARGIN + profilesX - nceW, int(height - 1.75*MARGIN), profilesW, int(0.10*height),true, false, true);
}

function drawInfoProfile(selected) {
  selected.draw(infoX + 80, height - 160, infoW - 160, infoH - 300,true, false, true);
}

function drawProfiles(list) {
  fill(textColor);
  textAlign(LEFT);
  textSize(max(18, textSizeValue));
  text("NCE Demand Profiles", MARGIN + profilesX - 25, titlesY);
  
  // Current Year
  textAlign(RIGHT);
  fill(textColor, 200);
  text(agileModel.YEAR_0 + session.current.TURN, profilesX + profilesW + 1.15*MARGIN, titlesY);
  
  var axis;
  var selected;
  var numProf = agileModel.PROFILES.length;
  for (var i=1; i<=list.length; i++) {
    selected = false;
    axis = false;
    if (!gameMode || list.get(i-1).timeLead <= session.current.TURN ) {
      if (i == numProf) axis = true;
      if (i == session.selectedProfile+1) selected = true;
         if(!gameMode){
            list.get(i-1).draw(MARGIN + profilesX - nceW, MARGIN + profilesY + int(0.57*height*(i-1)/float(numProf+1)), 
            profilesW, profilesH,
            axis, selected, false);
         }
         else{
             list.get(i-1).draw(MARGIN + profilesX - nceW, MARGIN + profilesY + int(0.57*height*(i-1)/float(numProf+1)), 
             profilesW, profilesH,
             axis, selected, false);
         }
    }

  }
  
  // Draw Profile Legend
  noStroke();
  
  // Draw Rainbow Icon
  colorMode(HSB);
  var ht = 10;
  var fraction = ht / agileModel.profileColor.length;
  for (var i=0; i<agileModel.profileColor.length; i++) {
    fill(agileModel.profileColor[i], 200);
    rect(MARGIN + profilesX, titlesY + textSizeValue*1.5 + i*fraction, 15, fraction);
  }
  colorMode(RGB); 
  // Always set back to RGB!!!
  
  fill(textColor, 150);
  rect(MARGIN + profilesX, titlesY + textSizeValue*2.7 + 2, 15, 10);
  fill(P3);
  rect(MARGIN + profilesX+80 +textSizeValue*2, titlesY + textSizeValue*1.5 , 3, textSizeValue-2);
  fill(Launch);
  rect(MARGIN + profilesX+210 +textSizeValue*4, titlesY + textSizeValue*1.5, 3, textSizeValue-2);
  fill(END);
  rect(MARGIN + profilesX+80 +textSizeValue*2, titlesY + textSizeValue*2.7 + 2, 3, textSizeValue-2);
  fill(textColor);
  fill(CAPACITY_COLOR);
  rect(MARGIN + profilesX+210  +textSizeValue*3, titlesY + textSizeValue*2.7 + 5, 15, 3);
  
  fill(textColor);
  textAlign(LEFT);
  text("Actual", MARGIN + profilesX+20, titlesY + textSizeValue*1.5 + 10);
  text("Forecast", MARGIN + profilesX+20, titlesY + textSizeValue*2.7 + 12);
  text("Capacity", MARGIN + profilesX+220  +textSizeValue*4, titlesY + textSizeValue*2.7 + 12);
  text("Launch", MARGIN + profilesX+220  +textSizeValue*4, titlesY + textSizeValue*1.5 + 10);
  text("Lead (Ph.III)", MARGIN + profilesX+90  +textSizeValue*2, titlesY + textSizeValue*1.5 + 10);
  text("End", MARGIN + profilesX+90  +textSizeValue*2, titlesY + textSizeValue*2.7 + 12);

  if(gameMode) {
    fill(NOW);
    rect(MARGIN + profilesX+140 +textSizeValue*3, titlesY + textSizeValue*2.7 + 2, 3, textSizeValue-2);
    fill(textColor);
    text("Now", MARGIN + profilesX+150  +textSizeValue*3, titlesY + textSizeValue*2.7 + 12);
  }

}



function drawBuilds() {
  var selected;
  var spread = 3.0;
  
  // Draw Personnel Legend
  var vOff = -50;
  fill(textColor);
  textAlign(LEFT);
  //      text("Personnel:", titlesY, MARGIN);
  for (var i=0; i<NUM_LABOR; i++) {
    if (i==0) {
      fill("#CC0000");
    } else if (i==1) {
      fill("#00CC00");
    } else if (i==2) {
      fill("#0000CC");
    } else if (i==3) {
      fill("#CCCC00");
    } else if (i==4) {
      fill("#CC00CC");
    } else {
      fill("#00CCCC");
    }
    
    var xOff = 0;
    if (i > 2) {
      xOff = 100;
    }
    
    ellipse(sitesX + xOff + 1.0*MARGIN - 5, 15*(i%3) - 4 + MARGIN, 3, 10);
    fill(textColor);
    // text(agileModel.LABOR_TYPES.getString(i,0), sitesX + 10 + xOff + 1.0*MARGIN - 5, 15*(i%3) + MARGIN);
  }
}

function drawInfoOverlay() {
  stroke(backgroundValue);
  strokeWeight(1);
  fill(textColor, 100);
  
  rect(infoX, infoY, infoW, infoH, 10);
  fill(backgroundValue);
  rect(infoX + 20, infoY + 20, infoW - 40, infoH - 40, 10);
  
  try {
    //Draw Selected Profile in Large Format
    if (!gameMode) {
      drawInfoProfile(agileModel.PROFILES.get(session.selectedProfile));
    } else {
      drawInfoProfile(agileModel.activeProfiles.get(session.selectedProfile));
    }
    
  } catch(e) {
    print("Could not execute drawInfoOverlay() in drawScreen()");
  }
  
  fill(textColor);
  for (var i=0; i<NUM_SITES; i++) {
    try {
      text("Site " + i + ", Cost of Goods: " + agileModel.activeProfiles.get(session.selectedProfile).productionCost.get(i), 
        infoX + 180 + MARGIN, infoY + 80 + 30*i);
    } catch(e) {
      
    }
  }
}