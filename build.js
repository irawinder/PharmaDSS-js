var production = 0.0;  // %capacity 0.0 - 1.0 being used for prodcution
var PROFILE_INDEX;
// Is build operational, yet?
var built;
// How many years since the build has been comissioned?
var age;
// Is the build flagged to be demolished?
var demolish = false;
// flag determining if build's capital cost has already been scored
var capEx_Logged = false;
var editing = false;
var labor = new Array();

function Build(name, capacity, buildCost, buildTime, repurpCost, repurpTime, labor, editing) {
  this.name = name;
  this.capacity = capacity;
  this.buildCost = buildCost;
  this.buildTime = buildTime;
  this.repurpCost = repurpCost;
  this.repurpTime = repurpTime;
  this.labor = labor;
  this.editing = editing;
  this.repurpose = false;

  // Allocate Specific Profile Information to a Build when it is deployed on Site
  this.assignProfile = function(index) {
    this.PROFILE_INDEX = index;
    this.built = false;
    this.age = 0;
  }

  this.updateBuild = function() {
    this.age++;
    if (this.repurpose) {
      if (this.age >= this.repurpTime) {
        this.built = true;
        this.repurpose = false;
      }
    } else if (this.age >= this.buildTime) {
      // Build becomes active after N years of construction
      this.built = true;
    }
  }

  this.draw = function(p, x, y, w, h, type, selected) {
    // Draw Build Characteristics
    var scaler = 3;
    p.noStroke();    
    p.fill(abs(255 - 75));
    p.rect(x + 35, y - 5, scaler*capacity, 10, 3);
    p.textAlign(LEFT);
    p.textSize(12);
    p.fill(255);
    p.text(capacity + " " + agileModel.WEIGHT_UNITS, x, y + 4);
    if (type == ("GMS")) {
      p.text("BLD: " + int(this.buildTime) + " " + agileModel.TIME_UNITS + ", " + int(this.buildCost/100000)/10.0 + agileModel.COST_UNITS, x, y - 11);
      p.text("RPP: " + int(this.repurpTime) + " " +agileModel.TIME_UNITS + ", " + int(this.repurpCost/100000)/10.0 + agileModel.COST_UNITS, x + 100, y - 11);
    } else {
      p.text("RPP: " + int(this.repurpTime) + " " +agileModel.TIME_UNITS + ", " + int(this.repurpCost/100000)/10.0 + agileModel.COST_UNITS, x, y - 11);
    }
    for (var i=0; i< this.labor.length; i++) {
      if (this.labor[i].name == (agileModel.LABOR_TYPES.getString(0, 0) )) {
        p.fill("#CC0000");
      } else if (this.labor[i].name == (agileModel.LABOR_TYPES.getString(1, 0) )) {
        p.fill("#00CC00");
      } else if (this.labor[i].name == (agileModel.LABOR_TYPES.getString(2, 0) )) {
        p.fill("#0000CC");
      } else if (this.labor[i].name == (agileModel.LABOR_TYPES.getString(3, 0) )) {
        p.fill("#CCCC00");
      } else if (this.labor[i].name == (agileModel.LABOR_TYPES.getString(4, 0) )) {
        p.fill("#CC00CC");
      } else {
        p.fill("#00CCCC");
      }
      p.ellipse(x + 37 + i*5, y + 15, 3, 10);
    }
  }
  
  this.draw = function(x, y, w, h, type, selected) {
    // Draw Build Characteristics
    var scaler = 3;
    textAlign(LEFT);
    noStroke();
    textSize(12);
    fill(textColor);
    // Draw "Chip" Image
    image(chip, x, y - 100 , w, 75);
  
    text("Production Capacity: " + int(this.capacity) + " tons", x, y -140);
    if (type == ("GMS")) {
      text("Build Time: " + int(this.buildTime) + " " + agileModel.TIME_UNITS, x, y - 11);
      text("Build Cost: " + int(this.buildCost/100000)/10.0 + agileModel.COST_UNITS, x, y +4);
      text("Repurpose Time: " + int(this.repurpTime) + " " + agileModel.TIME_UNITS, x, y + 19);
      text("Repurpose Cost: " + int(this.repurpCost/100000)/10.0 + agileModel.COST_UNITS, x, y + 34);
    } else {
      text("Repurpose Cost: " + int(this.repurpTime) + " " +agileModel.TIME_UNITS + ", " + int(this.repurpCost/100000)/10.0 + agileModel.COST_UNITS, x, y - 11);
    }
    
    text("Personnel: " , x, y - 115);
    for (var i=0; i< this.labor.length; i++) {
      if (this.labor[i].name == (agileModel.LABOR_TYPES.getString(0, 0) )) {
        fill("#CC0000");
      } else if (this.labor[i].name == (agileModel.LABOR_TYPES.getString(1, 0) )) {
        fill("#00CC00");
      } else if (this.labor[i].name == (agileModel.LABOR_TYPES.getString(2, 0) )) {
        fill("#0000CC");
      } else if (this.labor[i].name == (agileModel.LABOR_TYPES.getString(3, 0) )) {
        fill("#CCCC00");
      } else if (this.labor[i].name == (agileModel.LABOR_TYPES.getString(4, 0) )) {
        fill("#CC00CC");
      } else {
        fill("#00CCCC");
      }
      ellipse(x + i*5 + 5, y - 105, 3, 10);
    }
  }

}