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
var SAFE_ROW = 62; 
var SAFE_COL = 1;

// Cell B58
var RND_LIMIT_ROW = 57; 
var RND_LIMIT_COL = 1;

// "NCE Profile Data"
var PROFILE_SHEET = 0; 
  
// Cell A1
var PROFILE_ROW = 0; 
var PROFILE_COL = 0;
var NUM_PROFILES = 10;
var NUM_INTERVALS = 20;
    

function loadRules(model, rules, capacity, labour, RND) {
  model.WEIGHT_UNITS = rules.getString(0, 3);
  model.TIME_UNIT = rules.getString(2, 1);
  model.COST_UNITS = (rules.getString(7, 1)).substring(0, 1);

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
      if (rules.getString(0, 3 + i) == capacityToUseGMS[j]) {
        valid = true;
        index++;
        break;
      }
    }
    
    if(valid) {
      model.GMS_BUILDS = new Build();
      model.GMS_BUILDS.name         = "Build #" + (i + 1);
      model.GMS_BUILDS.capacity     = rules.getString(0, 3 + i);
      model.GMS_BUILDS.buildCost    = buildCost(model.GMS_BUILDS.capacity);
      model.GMS_BUILDS.buildTime    = buildTime(model.GMS_BUILDS.capacity);
      model.GMS_BUILDS.repurpCost   = 1000000 * rules.getString(3, 3 + i);
      model.GMS_BUILDS.repurpTime   = rules.getString(4, 3 + i);

      // Read MFG_System: GMS Build Labor
      for (var j=0; j<NUM_LABOR; j++) {
        var num = rules.getString(5 + 3*j, 3 + i);
        for (var k=0; k<num; k++) {
          print(model.LABOR_TYPES);
          model.GMS_BUILDS.labor = (new Person(
            model.LABOR_TYPES.getString(j, 0), // Name
            rules.getString(6 + 3*j, 3 + i), // #Shifts
            model.LABOR_TYPES.getString(j, 1) // Cost/Shift
          ));
        }
      }
    }
  }






  // Read MFG_System: RND Build Types
  index = -1;
  for (var i=0; i<NUM_RND_BUILDS; i++) {
  
    // Checks to see if capacity value is desired according to "float[] capacityToUseGMS"
    valid = false;
    for (var j=0; j<capacityToUseRND.length; j++) {
      if (RND.getString(RND_ROW, RND_COL + i) == capacityToUseRND[j]) {
        valid = true;
        index++;
        break;
      }
    }
    
    if(valid) {
      model.RND_BUILDS = new Build();
      model.RND_BUILDS.name          = "Build #" + (i+1);
      model.RND_BUILDS.capacity      = RND.getString(RND_ROW, RND_COL + i);
      model.RND_BUILDS.repurpCost    = 1000000 * RND.getString(RND_ROW + 2, RND_COL + i);
      model.RND_BUILDS.repurpTime    = RND.getString(RND_ROW + 1, RND_COL + i);
      
      // Read MFG_System: RND Build Labor
      for (var j=0; j<NUM_LABOR; j++) {
        var num = RND.getString(RND_ROW + 3 + 3*j, RND_COL + i);
        for (var k=0; k<num; k++) {
          model.RND_BUILDS.labor = (new Person(
            model.LABOR_TYPES.getString(j, 0), // Name
            RND.getString(RND_ROW + 4 + 3*j, RND_COL + i), // #Shifts
            model.LABOR_TYPES.getString(j, 1) // Cost/Shift
          ));
        }
      }
    }
  }
  





}


function loadModel_XLS(model, name) {  
  
  // Read MFG_System: Sites
  if (loadOriginal) {
    NUM_SITES = 2;
    for (var i=0; i<NUM_XLS_SITES; i++) {
      model.SITES.add(new Site(
        "" + reader.getvar(SITE_ROW + i, SITE_COL),
        reader.getFloat(SITE_ROW + i, SITE_COL + 1),
        reader.getFloat(SITE_ROW + i + 2, SITE_COL + 1),
        reader.getvar(RND_LIMIT_ROW + i, RND_LIMIT_COL)
      ));
    }
    
  } else {
    
    // Generates Random Sites but Makes Sure Existing and GnField stay rectangular
    NUM_SITES = int(random(2, 4));
    model.SITES.clear();
    var randomLargest = int(random(0,NUM_SITES-.001));
    prvarln("rLarge:" + randomLargest);
    for (var i=0; i<NUM_SITES; i++) {
      var totHeight;
      if (i==randomLargest) {
        totHeight = BASIN_HEIGHT;
      } else {
        totHeight = int(random( 2, BASIN_HEIGHT));
      }
      var gnHeight = int(random( 1, totHeight-1));
      var mag = 7.5;
      model.SITES.add(
        // Site(String name, float capEx, float capGn, var limitRnD)
        new Site( "Site " + (i+1), mag*(totHeight-gnHeight), mag*(gnHeight), int(random( 2, 5) ) 
      ));
    }
    
  }
  
  // Read MFG_System: MAX_SAFE_UTILIZATION
  model.MAX_SAFE_UTILIZATION = reader.getFloat(SAFE_ROW, SAFE_COL)/100.0;
  
  // Read Profile Information
  reader.openSheet(PROFILE_SHEET);
  
  var profileList;
  if (loadOriginal) {
    profileList = accendingIndex(NUM_PROFILES);
  } else {
    profileList = randomIndex(NUM_PROFILES);
  }
  
  // Read Profile: Attributes
  for (var i=0; i<NUM_PROFILES; i++) {
    
    // Read Profile: Basic Attributes
    model.PROFILES.add( new Profile(i) ); 
    model.PROFILES.get(i).name = reader.getString(PROFILE_ROW + 2 + 4*i, PROFILE_COL);
    model.PROFILES.get(i).summary = reader.getString(PROFILE_ROW + 2 + 4*profileList[i], PROFILE_COL + 1);
    if (reader.getString(PROFILE_ROW + 2 + 4*profileList[i], PROFILE_COL + 2).equals("success")) {
      model.PROFILES.get(i).success = true;
    } else {
      model.PROFILES.get(i).success = false;
    }
    model.PROFILES.get(i).timeStart = reader.getString(PROFILE_ROW + 2 + 4*profileList[i], PROFILE_COL + 6);
    
    // Read Profile: Site Costs
    for (var j=0; j<NUM_XLS_SITES; j++) {
      model.PROFILES.get(i).productionCost.add( reader.getFloat(PROFILE_ROW + 2 + 4*profileList[i], PROFILE_COL + 7 + j) );
    }
    
    // Read Profile: Demand Profile
    model.PROFILES.get(i).demandProfile.addRow(); // Time
    model.PROFILES.get(i).demandProfile.addRow(); // Demand Forecast
    model.PROFILES.get(i).demandProfile.addRow(); // Demand Actual
    model.PROFILES.get(i).demandProfile.addRow(); // Event Description
    for (var j=0; j<NUM_varERVALS; j++) {
      model.PROFILES.get(i).demandProfile.addColumn();
      model.PROFILES.get(i).demandProfile.setFloat(0, j, reader.getFloat(PROFILE_ROW, PROFILE_COL + 10 + j) );
      model.PROFILES.get(i).demandProfile.setFloat(1, j, reader.getFloat(PROFILE_ROW + 2 + 4*profileList[i], PROFILE_COL + 10 + j) );
      model.PROFILES.get(i).demandProfile.setFloat(2, j, reader.getFloat(PROFILE_ROW + 3 + 4*profileList[i], PROFILE_COL + 10 + j) );
      model.PROFILES.get(i).demandProfile.setString(3, j, reader.getString(PROFILE_ROW + 4 + 4*profileList[i], PROFILE_COL + 10 + j) );
    }
    
    // Calculates peak forecast demand value, lead years, etc
    model.PROFILES.get(i).calc();
    
    //Rescale peak NCE values to be within reasonable orders of magnitude of GMS Build Options
    if (!loadOriginal) {
      var mag = 1000*(random(10)+3);
      model.PROFILES.get(i).setPeak(mag);
    }
    
    // Re-Calculates peak forecast demand value, lead years, etc
    model.PROFILES.get(i).calc();
  }
  
  model.generateColors();
}