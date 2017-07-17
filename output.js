var outputs;
var NUM_OUTPUTS = 5;

var outputNames = [
  "Capital\nExpenses",
  "Cost of\nGoods",
  "Operating\nExpenses",
  "Demand\nMet",
  "Security\nof Supply"
];

var outputMax = [
  250000000.0,
    2000000.0,
   20000000.0,
          1.0,
          1.0
];

var outputUnits = [
  "mil GBP",
  "mil GBP",
  "mil GBP",
  "%",
  "%"
];

function initOutputs() {
  for (var i=0; i<NUM_OUTPUTS; i++) {
    outputs = new Array();
  }
}

function calcOutputs(turn) {
  if (outputs.get(turn).length > 0) {
    // Capital Expenditures
    outputs.get(turn)[0] = calcCAPEX();
  }
  
  if (outputs.get(turn).length > 1) {
    // Ability to meet Demand
    outputs.get(turn)[3] = calcDemandMeetAbility();
  }
  
  if (outputs.get(turn).length > 2) {
    // Security of Supply
    outputs.get(turn)[4] = calcSecurity();
  }
  
  if (outputs.get(turn).length > 3) {
    // Operating Expenditures
    outputs.get(turn)[1] = calcCOGs();
  }
  
  if (outputs.get(turn).length > 4) {
    // Cost of Goods
    outputs.get(turn)[2] = calcOPEX();
  }
  
}

function randomOutputs() {
  outputs = new Array();
  
  var o;
  for (var i=0; i<NUM_INTERVALS; i++) {
    o = new Array();
    for(var j=0; j<NUM_OUTPUTS; j++) {
      o[j] = 0.9/(j+1) * (i+1)/20.0 + random(-0.1, 0.1);
    }
    outputs.push(o);
  }
  
  // Set KPI Radar to Last Available Output array
  o = outputs.get(outputs.length - 1);
  
  for (var i=0; i<NUM_OUTPUTS; i++) {
    kpi.setScore(i, o[i]);
  }
}

function flatOutputs() {
  outputs = new Array();
  
  var o;
  for (var i=0; i<NUM_INTERVALS; i++) {
    o = new Array();
    for(var j=0; j<NUM_OUTPUTS; j++) {
      o[j] = 1.0;
    }
    outputs.push(o);
  }
  
  // Set KPI Radar to Last Available Output array
  o = outputs.get(outputs.length - 1);
  
  for (var i=0; i<NUM_OUTPUTS; i++) {
    kpi.setScore(i, o[i]);
  }
}

// Returns the capital expenses for the current turn
function calcCAPEX() {
  var expenses = 0.0;
  var current;
  for (var i=0; i<agileModel.SITES.length; i++) {
    for (var j=0; j<agileModel.SITES.get(i).siteBuild.length; j++) {
      current = agileModel.SITES.get(i).siteBuild.get(j);
      if (!current.capEx_Logged) { // Ensures capital cost for build is only counted once
        expenses += current.buildCost;
        if (current.age != 0) current.capEx_Logged = false;
      }
    }
  }
  return expenses;
}

// Returns the Operating Expenses for the current turn
function calcOPEX() {
  var expenses = 0.0;
  var current;
  for (var i=0; i<agileModel.SITES.length; i++) {
    for (var j=0; j<agileModel.SITES.get(i).siteBuild.length; j++) {
      current = agileModel.SITES.get(i).siteBuild.get(j);
      if (current.built) {
        for (var l=0; l<current.labor.length; l++) {
          expenses += current.labor.get(l).cost;
        }
      }
    }
  }
  return expenses;
}

// Returns the cost of goods for the current turn
function calcCOGs() {
  var expenses = 0.0;
  var current;
  var nce;
  for (var i=0; i<agileModel.SITES.length; i++) {
    for (var j=0; j<agileModel.SITES.get(i).siteBuild.length; j++) {
      current = agileModel.SITES.get(i).siteBuild.get(j);
      nce = agileModel.PROFILES.get(current.PROFILE_INDEX);
      if (current.built) {
        expenses += current.production * current.capacity * nce.productionCost.get(i);
      }
    }
  }
  return expenses;
}

// Returns the % ability to meet demand for a given turn (0.0 - 1.0)
function calcDemandMeetAbility() {
  var percent; // 0.0 - 1.0
  var totDemandMet = 0;
  var totDemand = 0;
  var scoreCount = 0;
  
  var profileCapacity, profileActualDemand;
  
  percent = 0.0;
  
  for (var i=0; i<agileModel.activeProfiles.length; i++) {
    
    profileCapacity = agileModel.activeProfiles.get(i).globalProductionLimit;
    profileActualDemand = agileModel.activeProfiles.get(i).demandProfile.getFloat(2, session.current.TURN-1);
    
    if (profileActualDemand > 0) {
      scoreCount++;
      totDemandMet += min(profileCapacity, profileActualDemand);
      totDemand += profileActualDemand;
      percent += min(profileCapacity, profileActualDemand) / profileActualDemand;
    }
  }
  
  if (totDemand > 0) {
    //percent = totDemandMet / totDemand;
    percent /= scoreCount;
  } else {
    percent = 1.0;
  }
  
  return percent;

}

// Returns the security of the supply chain network for a given turn
function calcSecurity() {

  // percent = balanceScore + supplyScore [%]
  var percent, balanceScore, supplyScore;
  
  balanceScore = 0.0;
  supplyScore = 0.0;
  
  // WEIGHTS SHOULD ADD UP TO 1.0
  var BALANCE_WEIGHT = 0.5;
  var SUPPLY_WEIGHT  = 0.5;

  // Magnitude of allowed value difference before score reaches 0% (1.0 for 100% deviance; 2.0 for 200% deviance, etc)
  var TOLERANCE = 2.0;
  // Ideal %Capacity Available in Network
  var IDEAL_NETWORK_BUFFER = 0.2;
  
  var siteCapacity;
  var totalCapacity, numBackup, bufferSupply;
  var scoreCount;
  var current;
  
  // If Demand Exists; NCE's Score Counts toward Total
  scoreCount = 0;
  
  // Cycles through Each NCE
  for (var i=0; i<agileModel.activeProfiles.length; i++) {

    numBackup = 0.0;
    
    // Calculates NCE Capacity at each site;
    siteCapacity = new float[agileModel.SITES.length];
    for (var s=0; s<agileModel.SITES.length; s++) {
      siteCapacity[s] = 0.0;
      for (var b=0; b<agileModel.SITES.get(s).siteBuild.length; b++) {
        current = agileModel.SITES.get(s).siteBuild.get(b);
        if (current.PROFILE_INDEX == agileModel.activeProfiles.get(i).ABSOLUTE_INDEX) {
          siteCapacity[s] += current.capacity;
        }
      }
      
    }
    
    // Calculates Total NCE Capacity
    totalCapacity = 0.0;
    for (var s=0; s<agileModel.SITES.length; s++) {
      totalCapacity += siteCapacity[s];
    }
    
    var demand = agileModel.activeProfiles.get(i).demandProfile.getFloat(2, min(session.current.TURN, NUM_INTERVALS-1) );
    demand /= 1000.0; // units of kiloTons
    
    // Calaculates normalized balance and supply scores and adds them to total
    if ( demand > 0) { // Only scores if demand exists
      // If Demand Exists; NCE's Score Counts toward Total
      scoreCount ++;
    
      // Determines how many "backup" sites there are
      if (agileModel.SITES.length == 1) {
        // Scores Perfect if only one site
        numBackup = 1.0;
      } else {
        // assigns "1" if capacity exists at site
        for (var s=0; s<agileModel.SITES.length; s++) {
          if (siteCapacity[s] > 0.0) {
            numBackup += 1.0;
          }
        }
      }
      
      // normalizes balance/backup to a score 0.0 - 1.0;
      if (agileModel.SITES.length > 1) {
        numBackup -= 1.0; // Eliminates effect of first site
        numBackup /= (agileModel.SITES.length - 1);
        if (numBackup < 0.0) numBackup = 0.0;
      }
      
      // Adds the current NCE's balance score to the overall
      balanceScore += agileModel.activeProfiles.get(i).weightBalance * numBackup;
      

      // Calculate Normalized supply score and add it to total
      var sup = 0;
      bufferSupply = (1.0 + IDEAL_NETWORK_BUFFER) * demand / totalCapacity;
      if (totalCapacity == 0) {
        sup = 0.0;
      } else if (bufferSupply > 0 && bufferSupply <= 1.0) {
        sup = 1.0;
      } else if (bufferSupply > 1.0) {
        sup = TOLERANCE - bufferSupply;
        if (sup < 0.0) sup = 0;
      }
      supplyScore += agileModel.activeProfiles.get(i).weightSupply * sup;
      
    }
    
  }
  
  // Aggregate scores
  balanceScore /= scoreCount;
  supplyScore  /= scoreCount;
  percent = BALANCE_WEIGHT * balanceScore + SUPPLY_WEIGHT * supplyScore;
  
  return percent;
}