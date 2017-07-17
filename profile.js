// Demand profile for a chemical entity (i.e. NCE)
var MAX_PROFILE_VALUE = 0;
// This static index should always refer to the profile's "ideal" state located in "MFG_System.PROFILES"
var ABSOLUTE_INDEX;
var launched;

// Profile Output Weights:
var weightBalance = 1.0; // Factors into Security of Supply (Site Safety/Balance)
var weightSupply  = 1.0; // Factors into Security of Supply (NCE Safety/Capacity)
var weightDemand  = 1.0; // Factors into Ability to Meet Demand

// Peak Demands (Forecast and Actual)
var demandPeak_F, demandPeak_A; // calculate from demandProfile
var peakTime_F, peakTime_A;

var timeLead;
var timeLaunch;
var timeEnd;
var capacityProfile;

//Parameters for click interface
var xClick, yClick, wClick, hClick;
var dragClickX, dragClickY, dragClickW, dragClickH;  
var over, locked;

var localProductionLimit;
var globalProductionLimit;

function Profile(INDEX) {
  productionCost = new Array();
  demandProfile = new p5.Table();
  ABSOLUTE_INDEX = INDEX;
  launched = false;
}

function Profile(name, summary, success, timeStart, recoveries, productionCost, demandProfile, INDEX) {
  this.name = name;
  this.summary = summary;
  this.success = success;
  this.timeStart = timeStart;
  this.productionCost = productionCost;
  this.demandProfile = demandProfile;
  ABSOLUTE_INDEX = INDEX;
  launched = false;
}

Profile.calc = function() {
  // Based on Profile, compute the peak forecast demand
  peak();
  // Based on Profile, compute the date that forecast is first know based on N years advance notice (i.e. 5yr) MFG_System.LEAD_TIME
  lead();
  // Based on Profile, compute the date that NCE Profile "terminates"
  end();
  //Initialize Table for holding capacity values
  initCapacityProfile();
}

// Given an existing profile, rescales all demand values (forecast and actual) according to a new peak value
Profile.setPeak = function(newPeak) {
  var scaler = newPeak/demandPeak_F;
  for (var i=0; i<demandProfile.getColumnCount (); i++) {
    demandProfile.setFloat(1, i, demandProfile.getFloat(1, i) * scaler); // Forecast
    demandProfile.setFloat(2, i, demandProfile.getFloat(2, i) * scaler); // Actual
  }
}

// Based on Profile, compute the peak forecast demand
Profile.peak = function() {
  demandPeak_F = 0;
  demandPeak_A = 0;
  var value_F, value_A, time;
  for (var i=0; i<demandProfile.getColumnCount (); i++) {
    time = demandProfile.getFloat(0, i);
    value_F = demandProfile.getFloat(1, i); // Forecast
    value_A = demandProfile.getFloat(2, i); // Actual
    if (demandPeak_F < value_F ) {
      demandPeak_F = value_F;
      peakTime_F = time;

      // Sets global max profile value
      if (MAX_PROFILE_VALUE < value_F) MAX_PROFILE_VALUE = value_F;
    }
    if (demandPeak_A < value_A ) {
      demandPeak_A = value_A;
      peakTime_A = time;
    }
  }
}

// Based on Profile, compute the date that forecast is first know based on N years advance notice (i.e. 5yr) MFG_System.LEAD_TIME
//For graph class
Profile.lead = function() {
  timeLead = 0;
  for (var i=0; i<demandProfile.getColumnCount (); i++) {
    var value = demandProfile.getFloat(1, i);
    if (value > 0) {
      timeLaunch = i;
      timeLead = i - agileModel.LEAD_TIME;
      break;
    }
  }
}

// Based on Profile, compute the date that NCE Profile "terminates" (i.e. is no longer viable)
//for graph class
Profile.end = function() {
  timeEnd = Float.POSITIVE_INFINITY;
  var viable = false;
  var current, previous;
  for (var i=1; i<demandProfile.getColumnCount (); i++) {
    current = demandProfile.getFloat(2, i);
    previous = demandProfile.getFloat(2, i-1);
    // If actual demand reaches zero, profile is no longer viable
    if (current == 0 && previous > 0) {
      timeEnd = i;
      break;
    }
    // If actual demand is still above zero, keep viable
    if (current > 0) {
      viable = true;
    }
  }
  if (!viable) timeEnd = timeLead;
}

Profile.initCapacityProfile = function() {
  capacityProfile = new p5.Table();
  capacityProfile.addRow(); //Time
  capacityProfile.addRow(); //Capacity (Actual)
  for (var i=0; i<demandProfile.getColumnCount (); i++) {
    capacityProfile.addColumn();
    capacityProfile.setFloat(0, i, demandProfile.getFloat(0, i)); //Time
    capacityProfile.setFloat(1, i, 0.0); // Capacity
  }
}

Profile.calcProduction = function(factories) {
  localProductionLimit = new Array();
  globalProductionLimit = 0;
  var numSites, numBuilds;
  var current;

  // Update Current Turn's Production Information
  numSites = factories.length;
  for (var i=0; i<numSites; i++) {
    localProductionLimit.push(0.0);
    numBuilds = factories.get(i).siteBuild.length;
    for (var j=0; j<numBuilds; j++) {
      current = factories.get(i).siteBuild.get(j);
      if (current.built) {
        if (current.PROFILE_INDEX == ABSOLUTE_INDEX) {
          localProductionLimit.set(i, localProductionLimit.get(i) + current.capacity);
        }
      }
    }
    globalProductionLimit += 1000*localProductionLimit.get(i);
  }
  
  // Sets Remaining Capacity to Current Turn's Status Quo:
  for (var i=max(session.current.TURN-1, 0); i<NUM_INTERVALS; i++) {
    capacityProfile.setFloat(1, i, globalProductionLimit);
  }

  // If Demand is yet to be built, adds potential to future capacity as "ghost"
  for (var i=0; i<numSites; i++) {
    numBuilds = factories.get(i).siteBuild.length;
    for (var j=0; j<numBuilds; j++) {
      current = factories.get(i).siteBuild.get(j);
      if (!current.built) {
        if (current.PROFILE_INDEX == ABSOLUTE_INDEX) {
          var yearsToOperate = int(current.buildTime - current.age);
          if (yearsToOperate + session.current.TURN < NUM_INTERVALS) { // Checks to make sure relevant
            var newCapacity = capacityProfile.getFloat(1, session.current.TURN-1 + yearsToOperate);
            // Sets Remaining Capacity to Future Turn's Status Quo:
            for (var k=session.current.TURN-1+yearsToOperate; k<NUM_INTERVALS; k++) {
              capacityProfile.setFloat(1, k, newCapacity + 1000*current.capacity);
            }
          }
        }
      }
    }
  }
}
  
var iconX, iconY, iconW, iconH;

Profile.draw = function(x, y, w, h, axis, selected, detail) {
  xClick = x - 15;
  yClick = y - h - 7;
  wClick = w + 80;
  hClick = h + 20;
  var unit = 5000;
  var scalerH, scalerW;
  var markerH = 1.00;
  var forecastScalerH = 2.0; // leaves room for actual demand to overshoot forecast
  scalerH = h/(forecastScalerH*demandPeak_F);
  scalerW = float(w)/demandProfile.getColumnCount();

  // Draw Profile Selection
  if (selected) {
    fill(HIGHLIGHT, 50);
    noStroke(); 
    rect(x - 15, y - h - 7, w + 30, h+20, 5);
    //rect(0.25*MARGIN + profilesX, y - h - 7, profilesW + MARGIN*1.75, h+20, 2);
    noStroke();
  }

  // Draw Molecule Icon
  if (!detail) {
    fill(agileModel.profileColor[ABSOLUTE_INDEX], 180);
    if (selected) {
      stroke(textColor);
      strokeWeight(1);
    } else {
      noStroke();
    }
    rect(x + w + 28, y-h-7, 29, h+20, 5);
    image(nceMini, x + w + 30, y-19, 23, 23);
    iconX = x +w;
    iconY = y - h - 7;
    iconW = 29;
    iconH = h + 20;
  }

  noStroke();

  // Time Bar
  if (!detail) {
    fill("#CCCCCC", 80);
    var begin = max(0, timeLead);
    var end = max(0, timeEnd);

    if (!gameMode) {
      rect(x + scalerW * begin, y - h, scalerW * (min(end, demandProfile.getColumnCount()) - begin), h);
    } else {
      fill("#CCCCCC", 80);
      rect(x + scalerW * begin, y - h, scalerW * (min(min(end, demandProfile.getColumnCount()), session.current.TURN) - begin), h);
    }
  }

  for (var i=0; i<demandProfile.getColumnCount (); i++) {
    var barF, barA, cap, capLast, globalCap;
    barF = scalerH * demandProfile.getFloat(1, i); // Forecast Demand
    barA = scalerH * demandProfile.getFloat(2, i); // Actual Demand
    cap = scalerH * capacityProfile.getFloat(1, i); // Actual Global Production Capacity
    globalCap = scalerH * globalProductionLimit; // Actual Global Production Capacity
    if (i==0) {
      capLast = 0;
    } else {
      capLast = scalerH * capacityProfile.getFloat(1, i-1);
    }
    noStroke();

    //Draw forecast and actual bars
    if (background == 255) {
      fill(120);
    } else {
      fill(180);
    }
    rect(x + scalerW * i +1, y - barF, scalerW - 1, barF);

    // If game is on, only shows actual demand bars for finished turns
    if (!gameMode || session.current.TURN + 1 > i) {
      var alpha;
      fill(agileModel.profileColor[ABSOLUTE_INDEX], 150);
      
      // Draws 1-yr future demand lighter
      if (session.current.TURN == i) {
        fill(agileModel.profileColor[ABSOLUTE_INDEX], 50);
      }
      rect(x + scalerW * i + 1, y - barA, scalerW - 1, barA);
    }


    // Draw Details such as axis
    fill(textColor);
    textAlign(CENTER);
    stroke(textColor);
    strokeWeight(1);
    if (detail) {
      if (i==0 || (i+1)%5 == 0) {
        line(x + scalerW * i + 0.5*scalerW, y, x + scalerW * i + 0.5*scalerW, y+3);
        noStroke();
        text((agileModel.YEAR_0+i), x + scalerW * (i+.5) + 1, y + 15);
      } else {
        line(x + scalerW * i + 0.5*scalerW, y, x + scalerW * i + 0.5*scalerW, y+2);
      }
    }

    // Draw Global Manufacturing Capacity
    if (gameMode) {
      noFill();
      if (i < session.current.TURN) {
        stroke(CAPACITY_COLOR);
      } else {
        stroke(CAPACITY_COLOR, 200);
        //          cap = globalCap;
        //          capLast = globalCap;
      }
      strokeWeight(3);
      // Draw Vertical line
      line(x +  scalerW * (i-0), y - cap, x + scalerW * (i-0), y - capLast);
      // Draw Horizontal line
      line(x + scalerW * (i-0), y - cap, x + scalerW * (i-0) + scalerW, y - cap);
      noStroke();
    }
  }

  // Draw Profile Name and Summary
  // Draw small year axis on last NCE only
  if ( (gameMode && timeEnd <= session.current.TURN) || (!gameMode && timeEnd <= NUM_INTERVALS-1)) {
    fill("#FF0000");
  } else {
    fill(textColor);
  }
  textAlign(LEFT);
  textSize(textSizeValue);
  var Y_SHIFT;
  if (!detail) {
    Y_SHIFT = 0;
  } else {
    Y_SHIFT = 28;
  }
  if (gameMode && timeEnd > session.current.TURN ) {
    text(name, x, y + 10 + Y_SHIFT);
  } else {
    text(name + ", " + summary, x, y + 10 + Y_SHIFT);
  }

  // Draw Demand Peak Value
  fill(textColor);
  ellipse(x + scalerW * (0.5+int(peakTime_F-1)), y - scalerH * demandProfile.getFloat(1, int(peakTime_F-1)), 3, 3);
  fill(textColor);
  textAlign(CENTER);
  textSize(textSize);
  text(int(demandPeak_F/100)/10.0 + agileModel.WEIGHT_UNITS, x + scalerW * (0.5+int(peakTime_F-1)) + 1, y - scalerH * demandProfile.getFloat(1, int(peakTime_F-1)) - 5);

  noStroke();
  
  var markW = 1;
  
  // Lead Date
  if (timeLead >=0) {
    fill(P3);
    rect(x + scalerW * timeLead - markW, y - markerH*h, markW, markerH*h);
    if (detail) {
      textAlign(CENTER);
      text("Ph.III", x + scalerW * timeLead - markW, y-markerH*h-5);
    }
  }

  // Launch Date
  if (timeLaunch >=0) {
    fill(Launch);
    rect(x + scalerW * timeLaunch - markW, y - markerH*h, markW, markerH*h);
    if (detail) {
      textAlign(CENTER);
      fill(textColor);
      text("Launch", x + scalerW * timeLaunch - markW, y-markerH*h-5);
    }
  }

  // End Date
  if (!gameMode || session.current.TURN > timeEnd) {
    if (timeEnd >=0) {
      fill(END);
      rect(x + scalerW * timeEnd - markW, y - markerH*h, markW, markerH*h);
      if (detail) {
        textAlign(CENTER);
        text("End", x + scalerW * timeEnd - markW, y-markerH*h-5);
      }
    }
  }

  // Draw Time Details
  if (gameMode) {
    var barA = 0;
    var cap = 0;
    if (session.current.TURN > 0) {
      cap = demandProfile.getFloat(2, session.current.TURN-1);
      barA = scalerH * cap;
    }
    fill(abs(textColor - 50));
    var X, Y;
    if (detail) {
      Y = y - barA;
    } else {
      Y = y - h;
    }
    X = x + scalerW * (min(demandProfile.getColumnCount(), session.current.TURN)) - 3;
    fill(NOW);
    if (detail) {
      rect(X, y, 4, - max(0.25*h, barA) );
    } else {
      if (session.current.TURN != timeLead) rect(X, Y + h/2, 3, h/2 ); //this is the game moving rectangle
    }
    if (detail) {
      fill(NOW, 100);
      rect(X + 1, y, 2, 35);
      fill(NOW);
      textAlign(LEFT);
      text(int(cap/100)/10.0 + agileModel.WEIGHT_UNITS, X + 5, Y-5);
      textAlign(CENTER);
      text((agileModel.YEAR_0 + session.current.TURN), X , y + MARGIN);
    }
  }

  // Y-Axis for Large-scale graphic
  if (detail) {
    //unit = demandPeak_F/3;
    unit = 1000*agileModel.GMS_BUILDS.get(0).capacity;
    stroke(textColor, 20);
    strokeWeight(1);
    for (var i=0; i<=int (forecastScalerH*demandPeak_F/unit); i++) {
      line(x, y - scalerH*i*unit, x+w, y - scalerH*i*unit);
      fill(textColor, 50);
      textAlign(RIGHT);
      if (i%2 == 0) text(i*int(unit/100)/10.0 + agileModel.WEIGHT_UNITS, x + w + 35, y - scalerH*(i-0.25)*unit);
    }
  }
}


function updateProfileCapacities() {
  // Updates the production capacities for each NCE
  for (var i=0; i<agileModel.activeProfiles.length; i++) {
    agileModel.activeProfiles.get(i).calcProduction(agileModel.SITES);
  }
}