// Demand profile for a chemical entity (i.e. NCE)
var MAX_PROFILE_VALUE = 0;
// This static index should always refer to the profile's "ideal" state located in "MFG_System.PROFILES"
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
var dragClickX, dragClickY, dragClickW, dragClickH;  
var over, locked;

var localProductionLimit;
var globalProductionLimit;

var THE_INDEX; // TODO: FIX NUMBERING SYSTEM???

function Profile(INDEX) {
  this.productionCost = new Array();
  this.demandProfile = new p5.Table();
  this.ABSOLUTE_INDEX = INDEX;
  launched = false;
}

function Profile(name, summary, success, timeStart, recoveries, productionCost, demandProfile, INDEX) {
  this.name = name;
  this.summary = summary;
  this.success = success;
  this.timeStart = timeStart;
  this.productionCost = new Array();
  this.demandProfile = new p5.Table();
  this.ABSOLUTE_INDEX = INDEX;
  this.timeLead = timeLead;
  launched = false;

  this.calc = function() {
    // Based on Profile, compute the peak forecast demand
    this.peak();
    // Based on Profile, compute the date that forecast is first know based on N years advance notice (i.e. 5yr) MFG_System.LEAD_TIME
    this.lead();
    // Based on Profile, compute the date that NCE Profile "terminates"
    this.end();
    //Initialize Table for holding capacity values
    this.initCapacityProfile();
  }

  // Given an existing profile, rescales all demand values (forecast and actual) according to a new peak value
  this.setPeak = function(newPeak) {
    var scaler = newPeak/demandPeak_F;
    for (var i=0; i<this.demandProfile.getColumnCount(); i++) {
      this.demandProfile.setString(1, i, float(this.demandProfile.getString(1, i)) * scaler); // Forecast
      this.demandProfile.setString(2, i, float(this.demandProfile.getString(2, i)) * scaler); // Actual
    }
  }

  // Based on Profile, compute the peak forecast demand
  this.peak = function() {
    demandPeak_F = 0;
    demandPeak_A = 0;
    var value_F, value_A, time;
    for (var i=0; i<this.demandProfile.getColumnCount(); i++) {
      time = float(this.demandProfile.getString(0, i));
      value_F = float(this.demandProfile.getString(1, i)); // Forecast
      value_A = float(this.demandProfile.getString(2, i)); // Actual
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
  this.lead = function() {
    this.timeLead = 0;
    for (var i=0; i<this.demandProfile.getColumnCount(); i++) {
      var value = float(this.demandProfile.getString(1, i));
      if (value > 0) {
        this.timeLaunch = i;
        this.timeLead = i - LEAD_TIME;
        break;
      }
    }
  }

  // Based on Profile, compute the date that NCE Profile "terminates" (i.e. is no longer viable)
  //for graph class
  this.end = function() {
    this.timeEnd = Number.POSITIVE_INFINITY;
    var viable = false;
    var current, previous;
    for (var i=1; i<this.demandProfile.getColumnCount(); i++) {
      current = float(this.demandProfile.getString(2, i));
      previous = float(this.demandProfile.getString(2, i-1));
      // If actual demand reaches zero, profile is no longer viable
      if (current == 0 && previous > 0) {
        this.timeEnd = i;
        break;
      }
      // If actual demand is still above zero, keep viable
      if (current > 0) {
        viable = true;
      }
    }
    if (!viable) this.timeEnd = this.timeLead;
  }

  this.initCapacityProfile = function() {
    capacityProfile = new p5.Table();
    capacityProfile.addRow(); //Time
    capacityProfile.addRow(); //Capacity (Actual)
    for (var i=0; i<this.demandProfile.getColumnCount(); i++) {
      capacityProfile.addColumn();
      capacityProfile.setString(0, i, float(this.demandProfile.getString(0, i))); //Time
      capacityProfile.setString(1, i, 0.0); // Capacity
    }
  }

  this.calcProduction = function(factories) {
    localProductionLimit = new Array();
    globalProductionLimit = 0;
    var numSites, numBuilds;
    var current;

    // Update Current Turn's Production Information
    numSites = factories.length;
    for (var i=0; i<numSites; i++) {
      localProductionLimit.push(0.0);
      numBuilds = factories[i].siteBuild.length;
      for (var j=0; j<numBuilds; j++) {
        current = factories[i].siteBuild[j];
        if (current.built) {
          if (current.PROFILE_INDEX == THE_INDEX) {
            localProductionLimit[i] = (localProductionLimit[i] + current.capacity);
          }
        }
      }
      globalProductionLimit += 1000*localProductionLimit[i];
    }
    
    // Sets Remaining Capacity to Current Turn's Status Quo:
    for (var i=max(session.current.TURN-1, 0); i<NUM_INTERVALS; i++) {
      capacityProfile.setString(1, i, globalProductionLimit);
    }

    // If Demand is yet to be built, adds potential to future capacity as "ghost"
    for (var i=0; i<numSites; i++) {
      numBuilds = factories[i].siteBuild.length;
      for (var j=0; j<numBuilds; j++) {
        current = factories[i].siteBuild[j];
        if (!current.built) {
          if (current.PROFILE_INDEX == THE_INDEX) {
            var yearsToOperate = int(current.buildTime - current.age);
            if (yearsToOperate + session.current.TURN < NUM_INTERVALS) { // Checks to make sure relevant
              var newCapacity = float(capacityProfile.getString(1, session.current.TURN-1 + yearsToOperate));
              // Sets Remaining Capacity to Future Turn's Status Quo:
              for (var k=session.current.TURN-1+yearsToOperate; k<NUM_INTERVALS; k++) {
                capacityProfile.setString(1, k, newCapacity + 1000*current.capacity);
              }
            }
          }
        }
      }
    }
  }
    
  var iconX, iconY, iconW, iconH;


  this.draw = function(x, y, w, h, axis, selected, detail) {
    this.xClick = x - 15;
    this.yClick = y - h - 7;
    this.wClick = w + 80;
    this.hClick = h + 20;
    var unit = 5000;
    var scalerH, scalerW;
    var markerH = 1.00;
    var forecastScalerH = 2.0; // leaves room for actual demand to overshoot forecast
    scalerH = h/(forecastScalerH*demandPeak_F);
    scalerW = float(w)/this.demandProfile.getColumnCount();

    // Draw Profile Selection
    if (selected) {
      fill(HIGHLIGHT_ALPHA);
      noStroke(); 
      rect(x - 15, y - h - 7, w + 30, h + 20, 5);
      //rect(0.25*MARGIN + profilesX, y - h - 7, profilesW + MARGIN*1.75, h+20, 2);
      noStroke();
    }

    // Draw Molecule Icon
    if (!detail) {
      fill(agileModel.profileColor[this.ABSOLUTE_INDEX]);
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
      fill(204,204,204, 80);
      var begin = max(0, this.timeLead);
      var end = max(0, this.timeEnd);

      if (!gameMode) {
        rect(x + scalerW * begin, y - h, scalerW * (min(end, this.demandProfile.getColumnCount()) - begin), h);
      } else {
        fill(204,204,204,80);
        rect(x + scalerW * begin, y - h, scalerW * (min(min(end, this.demandProfile.getColumnCount()), session.current.TURN) - begin), h);
      }
    }

    for (var i=0; i<this.demandProfile.getColumnCount(); i++) {
      var barF, barA, cap, capLast, globalCap;
      barF = scalerH * float(this.demandProfile.getString(1, i)); // Forecast Demand
      barA = scalerH * float(this.demandProfile.getString(2, i)); // Actual Demand
      cap = scalerH * float(capacityProfile.getString(1, i)); // Actual Global Production Capacity
      globalCap = scalerH * globalProductionLimit; // Actual Global Production Capacity
      // print(cap, globalCap, float(capacityProfile.getString(1, i)), scalerH); //TODO
      if (i==0) {
        capLast = 0;
      } else {
        capLast = scalerH * float(capacityProfile.getString(1, i-1));
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
        fill(agileModel.profileColor[this.ABSOLUTE_INDEX]);

        // Draws 1-yr future demand lighter
        if (session.current.TURN == i) {
          fill(agileModel.profileColor[this.ABSOLUTE_INDEX], 50);
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
          text((YEAR_0+i), x + scalerW * (i+.5) + 1, y + 15);
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
          stroke(CAPACITY_COLOR_ALPHA);
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
    if ( (gameMode && this.timeEnd <= session.current.TURN) || (!gameMode && this.timeEnd <= NUM_INTERVALS-1)) {
      fill("#FF0000");
    } else {
      fill(textColor);
    }
    textAlign(LEFT);
    noStroke();
    textSize(textSizeValue);
    var Y_SHIFT;
    if (!detail) {
      Y_SHIFT = 0;
    } else {
      Y_SHIFT = 28;
    }
    if (gameMode && this.timeEnd > session.current.TURN ) {
      text(this.name, x, y + 10 + Y_SHIFT);
    } else {
      text(this.name + ", " + this.summary, x, y + 10 + Y_SHIFT);
    }

    // Draw Demand Peak Value
    fill(textColor);
    ellipse(x + scalerW * (0.5+int(peakTime_F-1)), y - scalerH * float(this.demandProfile.getString(1, int(peakTime_F-1))), 3, 3);
    fill(textColor);
    textAlign(CENTER);
    textSize(textSizeValue);
    text(int(demandPeak_F/100)/10.0 + agileModel.WEIGHT_UNITS, x + scalerW * (0.5+int(peakTime_F-1)) + 1, y - scalerH * float(this.demandProfile.getString(1, int(peakTime_F-1))) - 5);

    noStroke();
    
    var markW = 1;
    
    // Lead Date
    if (this.timeLead >=0) {
      fill(P3);
      rect(x + scalerW * this.timeLead - markW, y - markerH*h, markW, markerH*h);
      if (detail) {
        textAlign(CENTER);
        text("Ph.III", x + scalerW * this.timeLead - markW, y-markerH*h-5);
      }
    }

    // Launch Date
    if (this.timeLaunch >=0) {
      fill(Launch);
      rect(x + scalerW * this.timeLaunch - markW, y - markerH*h, markW, markerH*h);
      if (detail) {
        textAlign(CENTER);
        fill(textColor);
        text("Launch", x + scalerW * this.timeLaunch - markW, y-markerH*h-5);
      }
    }

    // End Date
    if (!gameMode || session.current.TURN > this.timeEnd) {
      if (this.timeEnd >=0) {
        fill(END);
        rect(x + scalerW * this.timeEnd - markW, y - markerH*h, markW, markerH*h);
        if (detail) {
          textAlign(CENTER);
          text("End", x + scalerW * this.timeEnd - markW, y-markerH*h-5);
        }
      }
    }

    // Draw Time Details
    if (gameMode) {
      var barA = 0;
      var cap = 0;
      if (session.current.TURN > 0) {
        cap = float(this.demandProfile.getString(2, session.current.TURN-1));
        barA = scalerH * cap;
      }
      fill(abs(textColor - 50));
      var X, Y;
      if (detail) {
        Y = y - barA;
      } else {
        Y = y - h;
      }
      X = x + scalerW * (min(this.demandProfile.getColumnCount(), session.current.TURN)) - 3;
      fill(NOW);
      if (detail) {
        rect(X, y, 4, - max(0.25*h, barA) );
      } else {
        if (session.current.TURN != this.timeLead) rect(X, Y + h/2, 3, h/2 ); //this is the game moving rectangle
      }
      if (detail) {
        fill(NOW, 100);
        rect(X + 1, y, 2, 35);
        fill(NOW);
        textAlign(LEFT);
        text(int(cap/100)/10.0 + agileModel.WEIGHT_UNITS, X + 5, Y-5);
        textAlign(CENTER);
        text((YEAR_0 + session.current.TURN), X , y + MARGIN);
      }
    }

    // Y-Axis for Large-scale graphic
    if (detail) {
      //unit = demandPeak_F/3;
      unit = 1000*agileModel.GMS_BUILDS[0].capacity;
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
}

function updateProfileCapacities() {
  // Updates the production capacities for each NCE
  for (var i=0; i<agileModel.activeProfiles.length; i++) {
    agileModel.activeProfiles[i].calcProduction(agileModel.SITES);
  }
}