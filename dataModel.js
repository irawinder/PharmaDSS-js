var loadOriginal = true;

var NUM_LABOR = 6;
var NUM_XLS_SITES = 2;
var NUM_SITES = 2;

var NUM_GMS_BUILDS = 12;
// Constrain the list of capacities that are acceptable for the game.
// 0.5  1  2  5  7  10  15  20  25  30  40  50
var capacityToUseGMS = [2];

// Cell U3
var RND_ROW = 1; 
var RND_COL = 3;
var NUM_RND_BUILDS = 6;
// Constrain the list of capacities that are acceptable for the game.
var capacityToUseRND = [0.4];

// Cell B63
var SAFE_ROW = 1; 
var SAFE_COL = 1;

// Cell B58
var RND_LIMIT_ROW = 1; 
var RND_LIMIT_COL = 1;

// Cell A1
var PROFILE_ROW = 0; 
var PROFILE_COL = 0;
var NUM_PROFILES = 10;
var NUM_INTERVALS = 20;

function loadRules(model, gms_rules, capacity, labour, rnd_pp, rnd_rules, supply, profile) {
  model.WEIGHT_UNITS = gms_rules.getString(0, 3);
  model.TIME_UNITS = gms_rules.getString(2, 1);
  model.COST_UNITS = (gms_rules.getString(7, 1)).substring(0, 1);

  model.LABOR_TYPES = new p5.Table();
  model.LABOR_TYPES.addColumn(labour.getString(0,0));
  model.LABOR_TYPES.addColumn(labour.getString(0,1));
  for (var i=0; i<NUM_LABOR; i++) {
    model.LABOR_TYPES.addRow();
    model.LABOR_TYPES.setString(i, 0, labour.getString(1 + i, 0));
    model.LABOR_TYPES.setString(i, 1, labour.getString(1 + i, 1));
  }

  // Read MFG_System: GMS Build Types
  var index = -1;
  var valid;
  for (var i=0; i<NUM_GMS_BUILDS; i++) {
    // Checks to see if capacity value is desired according to "float[] capacityToUseGMS"
    valid = false;
    for (var j=0; j<capacityToUseGMS.length; j++) {
      if (gms_rules.getString(0, 3 + i) == capacityToUseGMS[j]) {
        valid = true;
        index++;
        break;
      }
    }
    
    if(valid) {
      model.GMS_BUILDS.push(new Build());
      model.GMS_BUILDS[index].name         = "Build #" + (i + 1);
      model.GMS_BUILDS[index].capacity     = gms_rules.getString(0, 3 + i);
      model.GMS_BUILDS[index].buildCost    = buildCost(model.GMS_BUILDS.capacity);
      model.GMS_BUILDS[index].buildTime    = buildTime(model.GMS_BUILDS.capacity);
      model.GMS_BUILDS[index].repurpCost   = 1000000 * gms_rules.getString(3, 3 + i);
      model.GMS_BUILDS[index].repurpTime   = gms_rules.getString(4, 3 + i);

      // Read MFG_System: GMS Build Labor
      for (var j=0; j<NUM_LABOR; j++) {
        var num = gms_rules.getString(5 + 3*j, 3 + i);
        for (var k=0; k<num; k++) {
          model.GMS_BUILDS[index].labor = (new Person(
            model.LABOR_TYPES.getString(j, 0), // Name
            gms_rules.getString(6 + 3*j, 3 + i), // #Shifts
            model.LABOR_TYPES.getString(j, 1) // Cost/Shift
          ));
        }
      }
    }
  }






  // Read MFG_System: rnd_pp Build Types
  index = -1;
  for (var i=0; i<NUM_RND_BUILDS; i++) {
  
    // Checks to see if capacity value is desired according to "float[] capacityToUseGMS"
    valid = false;
    for (var j=0; j<capacityToUseRND.length; j++) {
      if (rnd_pp.getString(RND_ROW, RND_COL + i) == capacityToUseRND[j]) {
        valid = true;
        index++;
        break;
      }
    }
    
    if(valid) {
      model.RND_BUILDS.push(new Build());
      model.RND_BUILDS[index].name          = "Build #" + (i+1);
      model.RND_BUILDS[index].capacity      = rnd_pp.getString(RND_ROW, RND_COL + i);
      model.RND_BUILDS[index].repurpCost    = 1000000 * rnd_pp.getString(RND_ROW + 2, RND_COL + i);
      model.RND_BUILDS[index].repurpTime    = rnd_pp.getString(RND_ROW + 1, RND_COL + i);
      
      // Read MFG_System: rnd_pp Build Labor
      for (var j=0; j<NUM_LABOR; j++) {
        var num = rnd_pp.getString(RND_ROW + 3 + 3*j, RND_COL + i);
        for (var k=0; k<num; k++) {
          model.RND_BUILDS[index].labor = (new Person(
            model.LABOR_TYPES.getString(j, 0), // Name
            rnd_pp.getString(RND_ROW + 4 + 3*j, RND_COL + i), // #Shifts
            model.LABOR_TYPES.getString(j, 1) // Cost/Shift
          ));
        }
      }
    }
  }
  



  // Read MFG_System: Sites
  if (loadOriginal) {
    NUM_SITES = 2;
    for (var i=0; i<NUM_XLS_SITES; i++) {
      model.SITES.push(new Site(
        "" + capacity.getString(i, 1),
        capacity.getString(i, 2),
        capacity.getString(i + 2, 2),
        rnd_rules.getString(1 + i, 1)
      ));
    }
  } else {
    // Generates Random Sites but Makes Sure Existing and GnField stay rectangular
    NUM_SITES = int(random(2, 4));
    model.SITES = new Array();
    var randomLargest = int(random(0,NUM_SITES-.001));
    print("rLarge:" + randomLargest);
    for (var i=0; i<NUM_SITES; i++) {
      var totHeight;
      if (i==randomLargest) {
        totHeight = BASIN_HEIGHT;
      } else {
        totHeight = int(random( 2, BASIN_HEIGHT));
      }
      var gnHeight = int(random( 1, totHeight-1));
      var mag = 7.5;
      model.SITES.push(
        // Site(String name, float capEx, float capGn, var limitRnD)
        new Site( "Site " + (i+1), mag*(totHeight-gnHeight), mag*(gnHeight), int(random( 2, 5) ) 
      ));
    }
    
  }








  // Read MFG_System: MAX_SAFE_UTILIZATION
  model.MAX_SAFE_UTILIZATION = supply.getString(SAFE_ROW, SAFE_COL)/100.0;
  






  // Read Profile Information  
  var profileList;
  if (loadOriginal) {
    profileList = accendingIndex(NUM_PROFILES);
  } else {
    profileList = randomIndex(NUM_PROFILES);
  }
  
  // Read Profile: Attributes
  for (var i=0; i<NUM_PROFILES; i++) {
    
    // Read Profile: Basic Attributes
    model.PROFILES.push(new Profile(i)); 
    model.PROFILES[i].name = profile.getString(PROFILE_ROW + 2 + 4*i, PROFILE_COL);
    model.PROFILES[i].summary = profile.getString(PROFILE_ROW + 2 + 4*profileList[i], PROFILE_COL + 1);
    if (profile.getString(PROFILE_ROW + 2 + 4*profileList[i], PROFILE_COL + 2) == "success") {
      model.PROFILES[i].success = true;
    } else {
      model.PROFILES[i].success = false;
    }
    model.PROFILES[i].timeStart = profile.getString(PROFILE_ROW + 2 + 4*profileList[i], PROFILE_COL + 6);
    
    // Read Profile: Site Costs
    for (var j=0; j<NUM_XLS_SITES; j++) {
      model.PROFILES[i].productionCost = profile.getString(PROFILE_ROW + 2 + 4*profileList[i], PROFILE_COL + 7 + j);
    }
    
    // Read Profile: Demand Profile
    model.PROFILES[i].demandProfile = new p5.Table();
    model.PROFILES[i].demandProfile.addRow(); // Time
    model.PROFILES[i].demandProfile.addRow(); // Demand Forecast
    model.PROFILES[i].demandProfile.addRow(); // Demand Actual
    model.PROFILES[i].demandProfile.addRow(); // Event Description
    for (var j=0; j<NUM_INTERVALS; j++) {
      model.PROFILES[i].demandProfile.addColumn();
      model.PROFILES[i].demandProfile.setString(0, j, profile.getString(PROFILE_ROW, PROFILE_COL + 10 + j) );
      model.PROFILES[i].demandProfile.setString(1, j, profile.getString(PROFILE_ROW + 2 + 4*profileList[i], PROFILE_COL + 10 + j) );
      model.PROFILES[i].demandProfile.setString(2, j, profile.getString(PROFILE_ROW + 3 + 4*profileList[i], PROFILE_COL + 10 + j) );
      model.PROFILES[i].demandProfile.setString(3, j, profile.getString(PROFILE_ROW + 4 + 4*profileList[i], PROFILE_COL + 10 + j) );
    }
    
    model.PROFILES[i].ABSOLUTE_INDEX = i;
    THE_INDEX = i;
    // Calculates peak forecast demand value, lead years, etc
    model.PROFILES[i].calc();
    print(model.PROFILES[i]);
    //Rescale peak NCE values to be within reasonable orders of magnitude of GMS Build Options
    if (!loadOriginal) {
      var mag = 1000*(random(10)+3);
      model.PROFILES[i].setPeak(mag);
    }
    
    // Re-Calculates peak forecast demand value, lead years, etc
    model.PROFILES[i].calc();
  }
  
  model.generateColors();

}
