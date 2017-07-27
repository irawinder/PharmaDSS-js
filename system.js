// Units for Describing Weight (i.e. "tons")
var WEIGHT_UNITS;
// Units for Describing time (i.e. "years")
var TIME_UNITS;
var YEAR_0 = 2017;
// Units for Describing cost (i.e. "GBP")
var COST_UNITS;
// Objects that hold marginal attributes of various build volumes.  
// Each build is associated with a discrete build volume.
var profileColor;
// Max capacity value for a Site. (capEx + capGn)
var maxCap;
// Maximum portion (0.0 - 1.0) of site utilization considered "safe."
var MAX_SAFE_UTILIZATION;
// Time Profile is know in advance of first expected demand;
var LEAD_TIME = 5;

function MFG_System() {
  this.LABOR_TYPES = new p5.Table();
  // The possible Universe/Reality of Profiles
  this.PROFILES = new Array();
  // Only the Profiles Visible/Used during a game situation
  this.activeProfiles = new Array();
  this.SITES = new Array();
  this.GMS_BUILDS = new Array();
  this.RND_BUILDS = new Array();

  this.generateColors = function() {
    colorMode(HSB);
    
    this.profileColor = new Array();
    var hue;
    for (var i=0; i<this.profileColor.length; i++) {
      hue = i * 200.0 / this.profileColor.length;
      this.profileColor[i] = color(hue, 255, 255);
      
      if(i > 2){
        hue = i * 255.0 / this.profileColor.length;
        this.profileColor[i] = color(hue, 255, 255);
      }

    }
    colorMode(RGB);
  }
  
  this.maxCapacity = function() {
    var current;
    maxCap = 0;
    for (var i=0; i<NUM_SITES; i++) { // Calculate maximum site capacity value
      // current = agileModel.SITES.get(i).capEx + SITES.get(i).capGn;
      if ( current > agileModel.maxCap ) maxCap = current;
    }
    return maxCap;
  }
}